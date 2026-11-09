'use strict';
var KeyboardQueue=(function(){
 function validate(s){
  var k=s.io.keyboard;
  if(!Number.isSafeInteger(s.revision)||s.revision<0||s.revision>=Number.MAX_SAFE_INTEGER-1)throw new Error('Revisión inválida');
  if(!Array.isArray(s.ram.bytes)||s.ram.bytes.length!==256)throw new Error('RAM inválida');
  for(var i=0;i<256;i++)if(!Number.isInteger(s.ram.bytes[i])||s.ram.bytes[i]<0||s.ram.bytes[i]>255)throw new Error('Byte inválido');
  if(k.basePa!==224||k.capacity!==8||!Number.isInteger(k.head)||!Number.isInteger(k.tail)||!Number.isInteger(k.count)||
   k.head<0||k.head>7||k.tail<0||k.tail>7||k.count<0||k.count>8||k.tail!==(k.head+k.count)%8)throw new Error('Punteros KBD inválidos');
 }
 function resetMetadata(){return {basePa:224,capacity:8,head:0,tail:0,count:0};}
 function enqueue(s,character,expectedRevision){
  validate(s);if(expectedRevision!==s.revision)throw new Error('Estado obsoleto');
  if(typeof character!=='string'||character.length!==1||character.charCodeAt(0)<32||character.charCodeAt(0)>126)throw new Error('Solo un carácter ASCII imprimible (32..126)');
  if(s.io.keyboard.count===8)return {status:'full'};
  var next=JSON.parse(JSON.stringify(s)),k=next.io.keyboard;
  next.ram.bytes[k.basePa+k.tail]=character.charCodeAt(0);k.tail=(k.tail+1)%8;k.count++;next.revision++;
  return {status:'completed',state:next};
 }
 // Inject the bus arbiter. Both transfers and queue consumption are one detached transaction.
 function consume(s,register,expectedRevision,arbiter){
  validate(s);if(expectedRevision!==s.revision)throw new Error('Estado obsoleto');
  if(['AX','BX','CX','DX'].indexOf(register)===-1)throw new Error('Registro inválido');
  if(!s.io.keyboard.count)return {status:'waiting'};
  var wiring={segments:{externalData:{widthBits:8,domain:'data'},internalData:{widthBits:8,domain:'data'}},ports:[
   {name:'KBD',segment:'externalData',path:['ram','bytes',224+s.io.keyboard.head],widthBits:8},
   {name:'MDR_IN',segment:'externalData',path:['cpu','mdr'],widthBits:8},
   {name:'MDR',segment:'internalData',path:['cpu','mdr'],widthBits:8},
   {name:register,segment:'internalData',path:['cpu','registers',register],widthBits:8}]};
  var first=arbiter.transfer(s,wiring,{En_KBD:true,Ld_MDR_IN:true},s.revision);
  if(first.status!=='completed')return first;
  var signals={En_MDR:true};signals['Ld_'+register]=true;
  var second=arbiter.transfer(first.state,wiring,signals,first.state.revision);
  if(second.status!=='completed')return second;
  var k=second.state.io.keyboard;k.head=(k.head+1)%8;k.count--;
  return {status:'completed',state:second.state,events:[first.event,second.event]};
 }
 function view(s){validate(s);var k=s.io.keyboard;return {head:k.head,tail:k.tail,count:k.count,
  full:k.count===8,empty:k.count===0,text:Array.from({length:k.count},function(_,i){return String.fromCharCode(s.ram.bytes[224+(k.head+i)%8]);}).join('')};}
 return {resetMetadata:resetMetadata,enqueue:enqueue,consume:consume,view:view,validate:validate};
}());
if(typeof module!=='undefined'&&module.exports)module.exports=KeyboardQueue;
