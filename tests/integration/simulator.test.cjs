const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function context(){const c=vm.createContext({});
 const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);
 for(const f of walk('src').filter(f=>f.endsWith('.js')))vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
 vm.runInContext('var simulator=Simulator('+fs.readFileSync('docs/examples/core/reset.snapshot.json','utf8')+');',c);
 return c;}
const copy=x=>JSON.parse(JSON.stringify(x));
function program(c,name){return c.simulator.load(fs.readFileSync('programs/'+name+'.asm','utf8')).state;}
test('complete arithmetic demo executes loop, flags and STORE through hierarchy',()=>{
 const c=context(),initial=program(c,'arithmetic'),r=c.simulator.run(initial,100);
 assert.equal(r.status,'halted',r.error);assert.equal(r.state.cpu.registers.AX,15);
 assert.equal(r.state.cpu.registers.BX,6);assert.equal(r.state.cpu.registers.DX,5);
 const t=c.mmuResolveAccess(r.state,{va:300,kind:'read',io:false,endpoint:null});
 assert.equal(r.state.ram.bytes[t.pa],15);assert.equal(initial.runtime.instructions,0);
 assert.ok(r.state.metrics.l1i.hits>0);assert.ok(r.state.metrics.l2.misses>0);
});
test('arithmetic loop agrees with independently tabulated flags and branch targets',()=>{
 const c=context(),expected=JSON.parse(fs.readFileSync('programs/arithmetic.expected.json','utf8'));
 let state=program(c,'arithmetic'),iteration=0;
 for(let i=0;i<expected.instructionCount;i++){
  const pc=state.cpu.pc,result=c.simulator.step(state);
  assert.equal(result.status,i===expected.instructionCount-1?'halted':'completed',result.error);
  state=result.state;
  if(state.cpu.ir.decoded.mnemonic==='CMP'){
   const row=expected.iterations[iteration];
   for(const [name,value] of Object.entries(state.cpu.registers))assert.equal(value,row[name]);
   for(const [name,value] of Object.entries(state.cpu.flags))assert.equal(value,row[name]);
  }
  if(state.cpu.ir.decoded.mnemonic==='JNZ'){
   assert.equal(state.cpu.pc,expected.iterations[iteration].jumpTaken?expected.loopPc:pc+4);
   iteration++;
  }
 }
 assert.equal(iteration,expected.iterations.length);
 assert.equal(state.cpu.pc,expected.haltPc);
 const variant=c.simulator.run(program(c,'arithmetic-variant'),100);
 assert.equal(variant.status,'halted',variant.error);
 for(const [name,value] of Object.entries(variant.state.cpu.registers))assert.equal(value,expected.variantFinal[name]);
 assert.equal(variant.state.runtime.instructions,expected.variantInstructionCount);
});
test('echo waits without consuming, resumes once and fills real video RAM',()=>{
 const c=context();let s=program(c,'echo');s=c.simulator.step(s).state;
 const waiting=c.simulator.step(s);assert.equal(waiting.status,'waiting');assert.deepEqual(copy(waiting.state),copy(s));
 for(const ch of 'ABCDEFGH')s=c.KeyboardQueue.enqueue(s,ch,s.revision).state;
 const r=c.simulator.run(s,100);assert.equal(r.status,'halted',r.error);
 assert.equal(c.lcdReadDisplay(r.state).text,'ABCDEFGH');assert.equal(r.state.io.keyboard.count,0);
 assert.deepEqual(copy(r.state.ram.bytes.slice(232,240)),Array.from('ABCDEFGH',x=>x.charCodeAt(0)));
 const io=r.events.filter(e=>e.kind.startsWith('io-'));assert.equal(io.length,16);
 assert.equal(io.filter(e=>e.kind==='io-read').length,8);
});
test('dirty page survives eviction and reload in a complete CPU program',()=>{
 const c=context(),r=c.simulator.run(program(c,'memory'),100);
 assert.equal(r.status,'halted',r.error);assert.equal(r.state.cpu.registers.DX,42);
 assert.ok(r.events.some(e=>e.kind==='swap-save'&&e.vpn===4));
 assert.ok(r.state.metrics.pageFaults>8);assert.equal(r.state.ram.bytes.length,256);
 assert.equal(r.state.ram.frames[7].vpn,15);
});
test('reset/reload clears cache metrics and is deterministic',()=>{
 const c=context(),a=c.simulator.run(program(c,'memory'),100),b=c.simulator.run(program(c,'memory'),100);
 assert.deepEqual(copy(a.state),copy(b.state));
 const fresh=program(c,'echo');assert.equal(fresh.metrics.pageFaults,0);
 assert.equal(fresh.caches.l1i.valid,false);assert.equal(fresh.io.keyboard.count,0);
});
test('invalid source and failing execution publish no partial state',()=>{
 const c=context();assert.equal(c.simulator.load('NOT_AN_OPCODE').ok,false);
 const s=c.simulator.load('JMP 0').state;
 s.cpu.pc=480;const before=copy(s),r=c.simulator.step(s);
 assert.equal(r.status,'error');assert.deepEqual(copy(r.state),before);
});
test('mapped LOAD peeks and STORE writes LCD without moving the device cursors',()=>{
 const c=context();
 const loaded=c.simulator.load('LOAD AX, [480]\nSTORE [488], AX\nLOAD BX, [488]\nHALT');
 assert.equal(loaded.ok,true);
 const initial=c.KeyboardQueue.enqueue(loaded.state,'Q',0).state;
 const r=c.simulator.run(initial,10);
 assert.equal(r.status,'halted',r.error);
 assert.equal(r.state.cpu.registers.AX,81);
 assert.equal(r.state.cpu.registers.BX,81);
 assert.equal(r.state.ram.bytes[232],81);
 assert.deepEqual(copy(r.state.io),copy(initial.io));
 assert.equal(r.state.metrics.l1d.hits+r.state.metrics.l1d.misses,0);
 assert.equal(r.state.mmu.pages[15].dirty,false);
 const io=r.events.filter(e=>e.kind==='bus'&&e.signals.IO);
 assert.deepEqual(copy(io.map(e=>[e.from,e.to,e.pa])),[['KBD','MDR',224],['MDR','LCD',232],['LCD','MDR',232]]);
});
test('MOV to the same register enables and loads one port',()=>{
 const c=context(),r=c.simulator.run(c.simulator.load('MOV AX, 127\nMOV AX, AX\nHALT').state,10);
 assert.equal(r.status,'halted',r.error);
 assert.equal(r.state.cpu.registers.AX,127);
 assert.ok(r.events.some(e=>e.kind==='bus'&&e.signals.En_AX&&e.signals.Ld_AX));
});
test('controlled RAM edit invalidates a cached instruction and marks the backing page dirty',()=>{
 const c=context(),initial=c.simulator.load('MOV AX, 1\nJMP 0').state;
 const before=c.simulator.step(initial).state;
 assert.equal(before.caches.l1i.valid,true);
 const pa=before.mmu.pages[0].pfn*32+2;
 const edited=c.simulator.editRam(before,pa,77).state;
 assert.equal(edited.caches.l1i.valid,false);
 assert.equal(edited.mmu.pages[0].dirty,true);
 assert.equal(before.ram.bytes[pa],1);
 const after=c.simulator.run(edited,2);
 assert.equal(after.status,'completed',after.error);
 assert.equal(after.state.cpu.registers.AX,77);
 assert.throws(()=>c.simulator.editRam(before,224,77));
});
