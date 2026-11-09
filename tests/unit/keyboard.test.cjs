const {test}=require('node:test'),assert=require('node:assert/strict');
const kbd=require('../../src/io/keyboard.js');
function reset(){return {revision:0,buses:{},ram:{bytes:Array(256).fill(0)},io:{keyboard:kbd.resetMetadata()},cpu:{mdr:0,registers:{AX:99,BX:0,CX:0,DX:0}}};}
// Contract double for unit tests. Actual arbiter integration has a separate command below.
const double={transfer(s,w,signals,revision){assert.equal(revision,s.revision);const n=structuredClone(s);
 for(const segment of Object.keys(w.segments)){
  const source=w.ports.find(p=>p.segment===segment&&signals['En_'+p.name]);
  for(const target of w.ports.filter(p=>p.segment===segment&&signals['Ld_'+p.name])){
   assert.ok(source);const value=source.path.reduce((a,k)=>a[k],s),parent=target.path.slice(0,-1).reduce((a,k)=>a[k],n);parent[target.path.at(-1)]=value;
  }
 }n.revision++;return {status:'completed',state:n,event:{signals}};}};
const bus=process.env.BUS_ARBITER_PATH?require(process.env.BUS_ARBITER_PATH):double;
function add(s,c){return kbd.enqueue(s,c,s.revision).state;}
function take(s){return kbd.consume(s,'AX',s.revision,bus);}
test('vacío espera sin escribir ni invocar bus',()=>{
 const s=reset(),before=structuredClone(s);assert.equal(kbd.consume(s,'AX',0,{transfer(){throw Error('no');}}).status,'waiting');assert.deepEqual(s,before);
});
test('un carácter atraviesa En_KBD y MDR antes del registro',()=>{
 const s=add(reset(),'A'),r=take(s);assert.equal(r.state.cpu.registers.AX,65);assert.equal(r.state.cpu.mdr,65);
 assert.equal(r.events[0].signals.En_KBD,true);assert.equal(r.events[1].signals.En_MDR,true);
 assert.equal(r.state.io.keyboard.count,0);assert.equal(s.io.keyboard.count,1);
 assert.throws(()=>kbd.consume(r.state,'AX',s.revision,bus));
});
test('ocho caracteres en RAM; noveno rechazado y FIFO conserva orden',()=>{
 let s=reset();for(const c of 'ABCDEFGH')s=add(s,c);const before=structuredClone(s);
 assert.equal(kbd.enqueue(s,'I',s.revision).status,'full');assert.deepEqual(s,before);
 assert.deepEqual(s.ram.bytes.slice(224,232),[65,66,67,68,69,70,71,72]);
 for(const c of 'ABCDEFGH'){s=take(s).state;assert.equal(s.cpu.registers.AX,c.charCodeAt(0));}
 assert.equal(take(s).status,'waiting');
});
test('wrap-around repetido preserva punteros y bytes vecinos',()=>{
 let s=reset();s.ram.bytes[223]=17;s.ram.bytes[232]=32;
 for(let i=0;i<30;i++){s=add(s,String.fromCharCode(65+i%26));s=take(s).state;assert.equal(s.cpu.registers.AX,65+i%26);}
 assert.equal(s.io.keyboard.head,6);assert.equal(s.io.keyboard.tail,6);assert.equal(s.ram.bytes[223],17);assert.equal(s.ram.bytes[232],32);
});
test('interrupción en cualquiera de las dos transferencias no consume ni modifica',()=>{
 for(const failed of [1,2]){let calls=0;const s=add(reset(),'Z'),before=structuredClone(s);
  const r=kbd.consume(s,'AX',s.revision,{transfer(...args){return ++calls===failed?{status:'rejected',error:{code:'INTERRUPTED'}}:bus.transfer(...args);}});
  assert.equal(r.status,'rejected');assert.deepEqual(s,before);assert.equal(take(s).state.cpu.registers.AX,90);
 }
});
test('codificación, estado obsoleto y punteros inválidos',()=>{
 const s=reset();for(const c of ['', 'AB','á','\n','😀'])assert.throws(()=>kbd.enqueue(s,c,0));
 assert.throws(()=>kbd.enqueue(s,'A',1));s.io.keyboard.tail=1;assert.throws(()=>kbd.view(s));
});
