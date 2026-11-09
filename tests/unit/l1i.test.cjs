const {test}=require('node:test'),a=require('node:assert/strict'),cache=require('../../src/cache/l1i.js');
const response=basePa=>({basePa,bytes:Array.from({length:8},(_,i)=>basePa+i)});
test('frío solicita L2; repetido hit y salto reemplaza una sola línea',()=>{
 let c=cache.reset(),r=cache.lookup(c,3,'fetch');a.equal(r.status,'miss');a.equal(r.request.basePa,0);
 c=cache.fill(c,r.request,response(0));a.deepEqual(cache.lookup(c,3,'fetch'),{status:'hit',byte:3});
 r=cache.lookup(c,17,'fetch');c=cache.fill(c,r.request,response(16));a.equal(cache.lookup(c,3,'fetch').status,'miss');
});
test('frontera de línea y página traduce cada byte a marcos no contiguos',()=>{
 let c=cache.reset();const fetched=[],requests=[];
 // VA 30,31 -> PFN 2; VA 32,33 -> PFN 5.
 for(const pa of [94,95,160,161]){let r=cache.lookup(c,pa,'fetch');if(r.status==='miss'){requests.push(r.request.basePa);c=cache.fill(c,r.request,response(r.request.basePa));r=cache.lookup(c,pa,'fetch');}fetched.push(r.byte);}
 a.deepEqual(fetched,[94,95,160,161]);a.deepEqual(requests,[88,160]);
});
test('datos evitan L1I, E/S no ejecutable',()=>{
 const c=cache.reset();a.equal(cache.lookup(c,0,'read').status,'bypass');
 for(const pa of [224,232,255])a.equal(cache.lookup(c,pa,'fetch').status,'rejected');
});
test('invalidación descarta respuestas pendientes y evita instrucciones antiguas',()=>{
 let c=cache.reset();const old=cache.lookup(c,0,'fetch').request;c=cache.invalidate(c);
 a.throws(()=>cache.fill(c,old,response(0)));const fresh=cache.lookup(c,0,'fetch').request;
 c=cache.fill(c,fresh,{basePa:0,bytes:Array(8).fill(99)});a.equal(cache.lookup(c,0,'fetch').byte,99);
 a.throws(()=>cache.fill(c,fresh,response(0)));
});
test('respuesta inválida o mutable no corrompe estado',()=>{
 const c=cache.reset(),q=cache.lookup(c,0,'fetch').request;
 a.throws(()=>cache.fill(c,q,{basePa:8,bytes:Array(8).fill(0)}));
 a.throws(()=>cache.fill(c,q,{basePa:0,bytes:Array(8).fill(256)}));
 const r=response(0),next=cache.fill(c,q,r);r.bytes[0]=77;a.equal(next.bytes[0],0);a.equal(c.valid,false);
});
