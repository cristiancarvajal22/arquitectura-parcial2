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
