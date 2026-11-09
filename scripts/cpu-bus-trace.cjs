const load=require('../tests/helpers/read-module.cjs');
const bus=load('650a31c42fdd20bc866f8ef37eb1f40cba030a1b','src/buses/arbiter.js');
const state={revision:0,buses:{},cpu:{pc:300,mar:0}};
const wiring={segments:{internalAddress:{widthBits:9,domain:'virtual'}},ports:[
 {name:'PC',segment:'internalAddress',path:['cpu','pc'],widthBits:9},
 {name:'MAR',segment:'internalAddress',path:['cpu','mar'],widthBits:9}]};
const result=bus.transfer(state,wiring,{En_PC:true,Ld_MAR:true},0);
if(result.status!=='completed'||result.state.cpu.mar!==300)throw Error('Trace failed');
process.stdout.write(JSON.stringify({moduleCommit:'650a31c42fdd20bc866f8ef37eb1f40cba030a1b',before:state,...result},null,2)+'\n');
