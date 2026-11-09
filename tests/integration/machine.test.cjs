const test=require('node:test');const assert=require('node:assert/strict');
const {machine,execute}=require('../helpers/machine.cjs');
function loaded(api,source,origin){const r=api.load(api.create(api.profile(true)),source,origin);assert.equal(r.status,'completed',JSON.stringify(r.error));return r.state;}
test('paused RAM edit invalidates the fetched line and rejects pending or reserved accesses',()=>{
 const api=machine();
 let state=loaded(api,'MOV AX, 1\nJMP 0');
 const tick=()=>{const r=api.step(state,{requestId:'test-'+state.revision,expectedRevision:state.revision});
  assert.equal(r.status,'completed',JSON.stringify(r.error));state=r.state;};
 tick();
 assert.equal(api.editRam(state,2,77).error.code,'BUSY');
 for(let i=0;i<400&&(state.cpu.pc!==4||state.cpu.control.machine.stage!=='address'||state.cpu.ir.loadedBytes!==0);i++)tick();
 assert.equal(state.cpu.pc,4);
 const pa=state.mmu.pages[0].pfn*32+2;
 assert.equal(state.caches.l1i.valid,true);
 assert.equal(api.editRam(state,224,77).error.code,'IO_PROTECTED');
 const before=state;
 const edited=api.editRam(state,pa,77);
 assert.equal(edited.status,'completed',JSON.stringify(edited.error));
 state=edited.state;
 assert.equal(state.caches.l1i.valid,false);
 assert.equal(state.mmu.pages[0].dirty,true);
 assert.equal(before.ram.bytes[pa],1);
 assert.equal(edited.events[0].kind,'ram-edit');
 for(let i=0;i<400&&state.cpu.registers.AX!==77;i++)tick();
 assert.equal(state.cpu.registers.AX,77);
});
test('arithmetic, four registers, branch loop, physical buses and HALT',()=>{
 const api=machine();let s=loaded(api,'MOV AX, 0\nMOV BX, 7\nMOV CX, 5\nMOV DX, 0\nloop: ADD AX, BX\nINC DX\nDEC CX\nCMP CX, 0\nJNZ loop\nSTORE [300], AX\nHALT');
 const r=execute(api,s);s=r.state;assert.equal(s.cpu.registers.AX,35);assert.equal(s.cpu.registers.DX,5);assert.equal(s.cpu.registers.CX,0);
 assert.equal(s.ram.bytes[s.mmu.pages[9].pfn*32+12],35);assert.equal(s.execution.mode,'halted');
 assert.equal(s.cpu.pc,40);assert.ok(s.metrics.pageFaults>0);
 assert.ok(r.events.some(e=>e.signals.En_PC&&e.signals.Ld_MAR));
 assert.ok(r.events.some(e=>e.signals.En_MDR&&e.signals.Ld_IR));
 assert.ok(r.events.some(e=>e.signals.Mem_W));
 for(const e of r.events){assert.equal(e.revisionAfter,e.revisionBefore+1);assert.ok(!(e.signals.Read&&e.signals.Write));
  for(const seg of e.segments){if(seg.level==='Z'){assert.equal(seg.value,null);assert.equal(seg.driver,null);}else assert.ok(seg.driver);}}
 const frozen=JSON.stringify(s);assert.equal(api.step(s,{requestId:'halt',expectedRevision:s.revision}).error.code,'HALTED');assert.equal(JSON.stringify(s),frozen);
});
test('empty keyboard resumes exactly once, eight characters use real video RAM',()=>{
 const api=machine();let s=loaded(api,'MOV CX, 8\nloop: IN DX, [KBD]\nOUT [LCD], DX\nDEC CX\nCMP CX, 0\nJNZ loop\nHALT');
 let r=execute(api,s);assert.equal(r.status,'pending');s=r.state;const frozen=JSON.stringify(s);
 r=api.step(s,{requestId:'wait-'+s.revision,expectedRevision:s.revision});assert.equal(r.status,'pending');assert.equal(JSON.stringify(r.state),frozen);
 const input=api.type(s,'ABCDEFGH');assert.equal(input.status,'completed');r=execute(api,input.state);s=r.state;
 assert.equal(s.ram.bytes.slice(232,240).map(b=>String.fromCharCode(b)).join(''),'ABCDEFGH');assert.equal(s.io.keyboard.count,0);assert.equal(s.io.lcd.cursor,0);
 assert.equal(r.events.filter(e=>e.signals.Ld_LCD).length,8);assert.equal(r.events.filter(e=>e.signals.En_KBD&&e.signals.Read).length,8);
 assert.equal(r.events.filter(e=>e.lookup&&e.pa>=224).length,0);
});
test('fetch crosses byte, cache-line and page boundaries at unaligned origin',()=>{
 const api=machine();const r=execute(api,loaded(api,'MOV AX, 9\nMOV BX, 3\nSUB AX, BX\nHALT',30));
 assert.equal(r.state.cpu.registers.AX,6);assert.ok(r.state.metrics.pageFaults>=2);
 assert.ok(r.events.some(e=>e.va===31));assert.ok(r.events.some(e=>e.va===32));
});
test('invalid program load is atomic and nine-bit addresses remain intact',()=>{
 const api=machine(),s=api.create(api.profile(true)),before=JSON.stringify(s);
 assert.equal(api.load(s,'MOV AX, 300').status,'rejected');assert.equal(api.load(s,'HALT',480).status,'rejected');assert.equal(JSON.stringify(s),before);
 const loadedState=loaded(api,'MOV AX, 17\nSTORE [400], AX\nLOAD DX, [400]\nHALT');const r=execute(api,loadedState);
 assert.equal(r.state.cpu.registers.DX,17);assert.ok(r.events.some(e=>e.va===400));
});
test('retry of latest STEP does not duplicate memory, clock or metrics',()=>{
 const api=machine();const s=loaded(api,'HALT');const request={requestId:'unique',expectedRevision:s.revision};
 const first=api.step(s,request);const again=api.step(first.state,request);
 assert.equal(again.replayed,true);assert.equal(JSON.stringify(again.state),JSON.stringify(first.state));
 assert.equal(api.step(first.state,{requestId:'other',expectedRevision:s.revision}).error.code,'STALE_REVISION');
});
test('proposal profile cannot execute and reset is deterministic',()=>{
 const api=machine(),s=api.create(api.profile(false));assert.equal(api.step(s,{requestId:'1',expectedRevision:0}).error.code,'INVALID_PROFILE');
 assert.equal(JSON.stringify(api.create(api.profile(true))),JSON.stringify(api.create(api.profile(true))));
});
test('write-through updates hot cache copies and metrics count actual lookups',()=>{
 const api=machine();const r=execute(api,loaded(api,'LOAD AX, [400]\nMOV BX, 29\nSTORE [400], BX\nLOAD DX, [400]\nHALT'));
 assert.equal(r.state.cpu.registers.DX,29);const tag=Math.floor((r.state.mmu.pages[12].pfn*32+16)/8);
 assert.equal(r.state.caches.l1d.tag,tag);assert.equal(r.state.caches.l1d.bytes[0],29);
 for(const level of ['l1i','l1d','l2']){
  const actual=r.events.filter(e=>e.lookup&&e.lookup.level===level&&e.lookup.counted);
  assert.equal(r.state.metrics[level].hits,actual.filter(e=>e.lookup.outcome==='hit').length);
  assert.equal(r.state.metrics[level].misses,actual.filter(e=>e.lookup.outcome==='miss').length);
 }
});
test('LOAD/STORE on LCD inspect exact addresses without moving the OUT cursor',()=>{
 const api=machine();const r=execute(api,loaded(api,'MOV AX, 90\nSTORE [490], AX\nLOAD DX, [490]\nHALT'));
 assert.equal(r.state.cpu.registers.DX,90);assert.equal(r.state.ram.bytes[234],90);assert.equal(r.state.io.lcd.cursor,0);
 assert.equal(r.state.metrics.l1d.hits+r.state.metrics.l1d.misses,0);
});
test('each fault transfers 32 bytes; clean victims do not trigger Swap saves',()=>{
 const api=machine();const r=execute(api,loaded(api,'LOAD AX, [256]\nLOAD BX, [288]\nHALT'));
 assert.equal(r.events.filter(e=>e.kind==='memory-save-page').length,0);
 assert.equal(r.events.filter(e=>e.kind==='memory-load-page').length,r.state.metrics.pageFaults*32);
 assert.equal(r.events.filter(e=>e.kind==='memory-install-page').length,r.state.metrics.pageFaults);
});
test('validated page-table edits preserve protected mappings and reject busy changes',()=>{
 const api=machine();let s=execute(api,loaded(api,'LOAD AX, [256]\nHALT')).state;s.execution.mode='paused';
 const before=JSON.stringify(s);const edit=api.editPage(s,8,{referenced:false});assert.equal(edit.status,'completed');assert.equal(edit.state.mmu.pages[8].referenced,false);
 assert.equal(JSON.stringify(s),before);assert.equal(api.editPage(s,15,{referenced:true}).status,'rejected');assert.equal(api.editPage(s,8,{dirty:false}).status,'rejected');
});
test('dirty page eviction and reload preserve all 32 bytes',()=>{
 const api=machine();const lines=[];
 for(let i=0;i<32;i++)lines.push('MOV AX, '+(i+1),'STORE ['+(448+i)+'], AX');
 for(let page=0;page<14;page++)lines.push('LOAD BX, ['+(page*32)+']');
 for(let i=0;i<32;i++)lines.push('LOAD DX, ['+(448+i)+']');lines.push('HALT');
 const r=execute(api,loaded(api,lines.join('\n')),50000);
 assert.equal(r.state.cpu.registers.DX,32);assert.ok(r.events.some(e=>e.kind==='memory-save-page'));
 const page=r.state.mmu.pages[14];assert.equal(page.present,true);
 assert.deepEqual(Array.from(r.state.ram.bytes.slice(page.pfn*32,page.pfn*32+32)),Array.from({length:32},(_,i)=>i+1));
 assert.ok(r.state.mmu.fifo.every(p=>p!==7));assert.equal(r.state.ram.bytes.length,256);
});
