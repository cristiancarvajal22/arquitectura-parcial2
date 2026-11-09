const {test}=require('node:test'),assert=require('node:assert/strict');
const fifo=require('../../src/memory/fifo.js');
function load(s,vpn){return fifo.commit(s,fifo.select(s,vpn));}
test('siete libres antes de víctimas 0,1,2 aunque se referencie la cabeza',()=>{
 let s=fifo.reset();for(let i=0;i<7;i++){const d=fifo.select(s,i);assert.equal(d.reason,'free');assert.equal(d.pfn,i);s=fifo.commit(s,d);}
 const before=JSON.stringify(s);s=load(s,0);assert.equal(JSON.stringify(s),before);
 for(let i=7;i<10;i++){const d=fifo.select(s,i);assert.equal(d.reason,'fifo');assert.equal(d.victim,i-7);s=fifo.commit(s,d);}
 assert.deepEqual(fifo.view(s).queue.map(x=>x.vpn),[3,4,5,6,7,8,9]);
 assert.deepEqual(s.frames[7],{pfn:7,vpn:15,pinned:true});
});
test('seleccionar no desaloja; commit obsoleto o alterado no modifica',()=>{
 const s=fifo.reset(),d=fifo.select(s,0);assert.equal(s.frames[0].vpn,null);
 const next=load(s,1);assert.throws(()=>fifo.commit(next,d));
 assert.throws(()=>fifo.commit(s,{...d,pfn:7}));assert.equal(s.queue.length,0);
});
test('marcos fijados adicionales se excluyen, incluida búsqueda de libres',()=>{
 let s=fifo.reset();s.frames[0].pinned=true;
 for(let vpn=0;vpn<6;vpn++)s=load(s,vpn);
 assert.equal(fifo.select(s,6).pfn,1);assert.equal(fifo.view(s,6).excluded.length,2);
 assert.equal(fifo.view(s,6).head,0);assert.equal(fifo.view(s,6).decision.victim,0);
});
test('reset, página protegida y repeticiones sin duplicar',()=>{
 let s=fifo.reset();s=load(s,15);assert.deepEqual(s,fifo.reset());
 for(let i=0;i<30;i++)s=load(s,i%15);
 assert.equal(new Set(s.queue).size,7);assert.deepEqual(fifo.reset().queue,[]);
});
test('rechaza corrupción y VPN fuera de rango',()=>{
 for(const vpn of [-1,16,1.5,NaN])assert.throws(()=>fifo.select(fifo.reset(),vpn));
 const s=load(fifo.reset(),0);s.queue.push(0);assert.throws(()=>fifo.select(s,1));
 const all=fifo.reset();all.frames.forEach(f=>f.pinned=true);assert.throws(()=>fifo.select(all,0));
});
