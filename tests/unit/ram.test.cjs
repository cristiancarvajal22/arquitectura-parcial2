const {test}=require('node:test'),assert=require('node:assert/strict');
const ram=require('../../src/memory/ram.js');
test('256 bytes, ocho marcos y LCD inicial con espacios',()=>{
 const s=ram.reset();assert.equal(s.bytes.length,256);assert.equal(s.frames.length,8);
 assert.deepEqual(s.bytes.slice(232,240),Array(8).fill(32));assert.equal(s.frames[7].vpn,15);
});
for(const pa of [0,31,32,223])test('escritura aislada en '+pa,()=>{
 const s=ram.reset(),r=ram.write(s,pa,255);assert.equal(ram.read(r.ram,pa),255);
 assert.equal(s.bytes[pa],0);assert.equal(r.event.requiresCacheCoherence,true);
 for(let i=0;i<256;i++)if(i!==pa)assert.equal(r.ram.bytes[i],s.bytes[i]);
});
test('frontera 255 visible pero protegida, rango y bytes rechazados',()=>{
 const s=ram.reset();assert.equal(ram.rows(s)[255].pfn,7);
 for(const pa of [-1,256,1.5,NaN,255]){assert.throws(()=>ram.read(s,pa));assert.throws(()=>ram.write(s,pa,1));}
 for(const value of [-1,256,1.5,NaN,'2'])assert.throws(()=>ram.write(s,0,value));
});
test('KBD solo controlador; LCD STORE permitido sin modificar cursor',()=>{
 let s=ram.reset();assert.throws(()=>ram.write(s,224,65));
 s=ram.write(s,224,65,'keyboard').ram;assert.equal(ram.read(s,224),65);
 const r=ram.write(s,232,66);assert.equal(r.event.cacheable,false);assert.equal(r.ram.bytes[232],66);
 for(const actor of ['cache','loader'])for(const pa of [224,232,240]){
  assert.throws(()=>ram.write(s,pa,1,actor));assert.throws(()=>ram.read(s,pa,actor));
 }
 assert.throws(()=>ram.write(s,0,1,'keyboard'));assert.throws(()=>ram.write(s,0,1,'lcd'));
});
test('proyección decimal/hex usa snapshot actualizado y no memoria duplicada',()=>{
 const s=ram.write(ram.reset(),32,171).ram,rows=ram.rows(s);
 assert.deepEqual(rows[32],{pa:32,pfn:1,offset:0,region:'ram',decimal:171,hex:'AB'});
 rows[32].decimal=0;assert.equal(s.bytes[32],171);
});
test('rechaza estructuras corruptas antes de modificar',()=>{
 const a=ram.reset();delete a.bytes[0];assert.throws(()=>ram.write(a,1,3));
 const b=ram.reset();b.frames[7].pinned=false;assert.throws(()=>ram.read(b,0));
 const c=ram.reset();c.frames[0].vpn=15;assert.throws(()=>ram.validate(c));
});
