const {test}=require('node:test'),a=require('node:assert/strict'),co=require('../../src/cache/coherence.js');
function line(tag,dirty=false){return {valid:true,tag,dirty,bytes:Array(8).fill(tag)};}
function state(){return {l1i:{...line(4),generation:2},l1d:line(4),l2:{lines:[line(3),line(4),line(5),line(8)],fifo:[0,1,2,3]}};}
test('edición invalida todas las copias físicas y preserva vecinos y FIFO',()=>{
 const c=state(),r=co.invalidate(c,33,1);a.equal(r.status,'completed');
 a.equal(r.caches.l1i.valid,false);a.equal(r.caches.l1d.valid,false);a.equal(r.caches.l2.lines[1].valid,false);
 a.deepEqual(r.caches.l2.lines[0],c.l2.lines[0]);a.deepEqual(r.caches.l2.lines[2],c.l2.lines[2]);
 a.deepEqual(r.caches.l2.fifo,[0,2,3]);a.equal(c.l1i.valid,true);a.equal(r.caches.l1i.generation,3);
});
test('reemplazo de marco invalida sus cuatro líneas, sin vecinos',()=>{
 const c=state();c.l2.lines=[line(3),line(4),line(7),line(8)];
 const r=co.invalidate(c,32,32);a.deepEqual(r.caches.l2.lines.map(l=>l.valid),[true,false,false,true]);
});
test('dirty no se descarta ni se confunde con write-through',()=>{
 const c=state();c.l2.lines[1].dirty=true;const before=structuredClone(c),r=co.invalidate(c,32,8);
 a.equal(r.status,'needs-writeback');a.equal(r.lines[0].basePa,32);a.equal(r.caches,undefined);a.deepEqual(c,before);
 r.lines[0].bytes[0]=255;a.equal(c.l2.lines[1].bytes[0],4);
});
test('dos alias físicos tienen mismo conjunto de invalidaciones',()=>{
 const translate=va=>32+va%32;
 a.deepEqual(co.invalidate(state(),translate(1),1),co.invalidate(state(),translate(65),1));
});
test('frontera entre líneas y cancelación de fill pendiente',()=>{
 const c=state(),r=co.invalidate(c,31,2);a.equal(r.invalidated.length,4);
 const other=co.invalidate(c,0,1);a.equal(other.caches.l1i.valid,true);a.equal(other.caches.l1i.generation,3);
});
test('E/S y reservado no usan invalidación de caché',()=>{
 a.equal(co.route(223),'cacheable');a.equal(co.route(224),'io-bypass');a.equal(co.route(232),'io-bypass');a.equal(co.route(255),'reserved');
 for(const [s,n] of [[224,1],[223,2],[-1,1],[0,0]])a.throws(()=>co.invalidate(state(),s,n));
});
