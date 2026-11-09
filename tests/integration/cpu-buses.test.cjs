const {test}=require('node:test'),a=require('node:assert/strict'),load=require('../helpers/read-module.cjs');
const bus=load('650a31c42fdd20bc866f8ef37eb1f40cba030a1b','src/buses/arbiter.js');
const alu=load('1527c6ca92ab978d079525d78b2a5f5b85bd2e2b','src/cpu/registers-alu.js');
const step=load('650a31c42fdd20bc866f8ef37eb1f40cba030a1b','src/core/bus-step.js');
const segments=[['internalAddress',9,'virtual',300],['externalAddress',8,'physical',200],
 ['internalData',8,'data',255],['externalData',8,'data',128],['internalControl',4,'control',9],['externalControl',4,'control',6]];
for(const [name,widthBits,domain,value] of segments){
 const wiring={segments:{[name]:{widthBits,domain}},ports:[
  {name:'A',segment:name,path:['source'],widthBits},{name:'B',segment:name,path:['other'],widthBits},
  {name:'DEST',segment:name,path:['target'],widthBits}]};
 const state=()=>({revision:0,buses:{},source:value,other:value,target:0});
 test(name+': sin emisor no permite Load',()=>{const s=state(),r=bus.transfer(s,wiring,{Ld_DEST:true},0);a.equal(r.status,'rejected');a.equal(r.error.code,'NO_BUS_DRIVER');a.equal(s.target,0);});
 test(name+': un emisor carga valor esperado',()=>{const s=state(),r=bus.transfer(s,wiring,{En_A:true,Ld_DEST:true},0);a.equal(r.status,'completed');a.equal(r.state.target,value);a.equal(r.event.captures[0].after,value);a.equal(s.target,0);});
 test(name+': dos emisores aun iguales detienen transferencia',()=>{const s=state(),before=JSON.stringify(s),r=bus.transfer(s,wiring,{En_A:true,En_B:true,Ld_DEST:true},0);a.equal(r.error.code,'BUS_CONTENTION');a.equal(JSON.stringify(s),before);});
 test(name+': Load deshabilitado conserva destino',()=>{const r=bus.transfer(state(),wiring,{En_A:true,Ld_DEST:false},0);a.equal(r.status,'completed');a.equal(r.state.target,0);a.equal(r.event.captures.length,0);});
}
for(const [op,left,right,expected,flags] of [['ADD',255,1,0,{ZF:true,CF:true,SF:false}],['SUB',0,1,255,{ZF:false,CF:true,SF:true}],['XOR',128,128,0,{ZF:true,CF:false,SF:false}]]){
 test(op+': salida ALU real capturada en cuatro registros',()=>{
  const result=alu.evaluate(op,left,right,{CF:false});a.equal(result.result,expected);a.deepEqual(result.flags,flags);
  for(const reg of ['AX','BX','CX','DX']){
   const s={revision:0,buses:{},cpu:alu.reset()};s.cpu.alu.result=result.result;
   const w={segments:{internalData:{widthBits:8,domain:'data'}},ports:[{name:'ALU',segment:'internalData',path:['cpu','alu','result'],widthBits:8},{name:reg,segment:'internalData',path:['cpu','registers',reg],widthBits:8}]};
   const r=bus.transfer(s,w,{En_ALU:true,['Ld_'+reg]:true},0);a.equal(r.status,'completed');a.equal(r.state.cpu.registers[reg],expected);
  }
 });
}
test('CMP calcula flags sin autorizar escritura del resultado',()=>{
 const s=alu.reset();s.registers.AX=3;s.registers.BX=5;const before=JSON.stringify(s);
 const r=alu.evaluate('CMP',s.registers.AX,s.registers.BX,s.flags);a.equal(r.writeResult,false);a.deepEqual(r.flags,{ZF:false,CF:true,SF:true});a.equal(JSON.stringify(s),before);
});
test('estado halted rechaza nuevos pasos conservando CPU, reloj y métricas',()=>{
 const s={schemaVersion:1,revision:8,profile:{status:'ready',pendingIssues:[]},cpu:{...alu.reset(),control:{signals:{Clock:false}}},clock:{cycle:8,microStep:8},metrics:{committedMicroSteps:8},execution:{mode:'halted',pendingRequest:null}};
 const before=JSON.stringify(s);const r=step.execute(s,{},{});a.equal(r.status,'rejected');a.equal(r.error.code,'HALTED');a.equal(JSON.stringify(s),before);
});
