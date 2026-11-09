'use strict';
var InstructionCache=(function(){
 function integer(n,max){if(!Number.isInteger(n)||n<0||n>max)throw new Error('Valor fuera de rango');}
 function reset(){return {lineBytes:8,valid:false,tag:null,dirty:false,bytes:Array(8).fill(0),generation:0};}
 function validate(c){
  if(c.lineBytes!==8||typeof c.valid!=='boolean'||c.dirty!==false||!Array.isArray(c.bytes)||c.bytes.length!==8)throw new Error('L1I inválida');
  for(var i=0;i<8;i++)integer(c.bytes[i],255);
  integer(c.generation,Number.MAX_SAFE_INTEGER-1);
  if(c.valid)integer(c.tag,27);else if(c.tag!==null)throw new Error('Tag inválido');
 }
 // PA must already be translated by MMU for every byte, including page crossings.
 function lookup(c,pa,kind){
  validate(c);integer(pa,255);
  if(kind!=='fetch')return {status:'bypass',reason:'not-fetch'};
  if(pa>=224)return {status:'rejected',reason:'non-executable-io'};
  var tag=Math.floor(pa/8),offset=pa%8;
  if(c.valid&&c.tag===tag)return {status:'hit',byte:c.bytes[offset]};
  return {status:'miss',request:{kind:'read-line',level:'L2',basePa:tag*8,length:8,generation:c.generation},offset:offset};
 }
 function fill(c,request,response){
  validate(c);
  if(request.kind!=='read-line'||request.level!=='L2'||request.length!==8||request.generation!==c.generation)throw new Error('Solicitud obsoleta o inválida');
  integer(request.basePa,216);if(request.basePa%8!==0)throw new Error('Línea no alineada');
  if(response.basePa!==request.basePa||!Array.isArray(response.bytes)||response.bytes.length!==8)throw new Error('Respuesta L2 incorrecta');
  for(var i=0;i<8;i++)integer(response.bytes[i],255);
  return {lineBytes:8,valid:true,tag:request.basePa/8,dirty:false,bytes:response.bytes.slice(),generation:c.generation+1};
 }
 function invalidate(c){validate(c);var n=reset();n.generation=c.generation+1;return n;}
 return {reset:reset,validate:validate,lookup:lookup,fill:fill,invalidate:invalidate};
}());
if(typeof module!=='undefined'&&module.exports)module.exports=InstructionCache;
