const {test}=require('node:test');
const assert=require('node:assert/strict');
const alu=require('../../src/cpu/registers-alu.js');
test('reset y snapshot independientes con anchuras ISA',()=>{
 const s=alu.reset(); assert.equal(alu.validate(s),true);
 s.pc=511;s.mar=300;s.ir.bytes=[0x20,0,44,1];s.ir.loadedBytes=4;
 const copy=alu.snapshot(s);copy.registers.AX=255;assert.equal(s.registers.AX,0);
 for(const [path,bad] of [['pc',512],['mar',-1],['mdr',256]]){const c=alu.reset();c[path]=bad;assert.throws(()=>alu.validate(c));}
 for(const bad of [-1,256,1.5,NaN,undefined]){const c=alu.reset();c.registers.AX=bad;assert.throws(()=>alu.validate(c));}
 const c=alu.reset();delete c.ir.bytes[2];assert.throws(()=>alu.validate(c));
});
const vectors=[
 ['ADD',255,1,0,true,true,false],['ADD',127,1,128,false,false,true],
 ['ADD',128,127,255,false,false,true],['SUB',0,1,255,false,true,true],
 ['SUB',128,1,127,false,false,false],['SUB',255,255,0,true,false,false],
 ['INC',255,0,0,true,true,false],['DEC',0,0,255,false,true,true],
 ['CMP',0,255,1,false,true,false],['AND',128,127,0,true,false,false],
 ['OR',128,127,255,false,false,true],['XOR',255,255,0,true,false,false],
 ['NOT',127,0,128,false,true,true]
];
for(const [op,a,b,result,ZF,CF,SF] of vectors)test(`${op} ${a},${b}`,()=>{
 const r=alu.evaluate(op,a,b,{CF:true});assert.equal(r.result,result);
 assert.deepEqual(r.flags,{ZF,CF,SF});assert.equal(r.writeResult,op!=='CMP');
});
test('todos los pares de bytes de suma/resta frente a aritmética independiente',()=>{
 for(let a=0;a<256;a++)for(let b=0;b<256;b++){
  const sum=alu.evaluate('ADD',a,b,{CF:false}),sub=alu.evaluate('SUB',a,b,{CF:false});
  assert.equal(sum.result,(a+b)%256);assert.equal(sum.flags.CF,a+b>=256);
  assert.equal(sub.result,(a-b+256)%256);assert.equal(sub.flags.CF,a<b);
 }
});
test('operaciones inválidas no cambian los operandos ni flags',()=>{
 const f={CF:false};assert.throws(()=>alu.evaluate('MOV',1,2,f));
 assert.throws(()=>alu.evaluate('ADD',256,0,f));assert.deepEqual(f,{CF:false});
 assert.equal(alu.evaluate('NOT',255,0,f).flags.CF,false);
});
