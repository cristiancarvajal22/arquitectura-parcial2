'use strict';
var PhysicalRam=(function(){
 function range(n,max,label){if(!Number.isInteger(n)||n<0||n>max)throw new RangeError(label+': 0..'+max);}
 function reset(){return {bytes:Array.from({length:256},function(_,i){return i>=232&&i<240?32:0;}),
  frames:Array.from({length:8},function(_,pfn){return {pfn:pfn,vpn:pfn===7?15:null,pinned:pfn===7};})};}
 function validate(ram){
  if(!ram||!Array.isArray(ram.bytes)||ram.bytes.length!==256)throw new Error('RAM requiere 256 bytes');
  for(var i=0;i<256;i++)range(ram.bytes[i],255,'byte');
  if(!Array.isArray(ram.frames)||ram.frames.length!==8)throw new Error('RAM requiere ocho marcos');
  var seen=[];
  for(var p=0;p<8;p++){
   var f=ram.frames[p];if(!f||f.pfn!==p||f.pinned!==(p===7))throw new Error('Marco inválido');
   if(p===7&&f.vpn!==15)throw new Error('Marco 7 fijado a página 15');
   if(f.vpn!==null){range(f.vpn,p===7?15:14,'VPN');if(seen.indexOf(f.vpn)!==-1)throw new Error('VPN duplicada');seen.push(f.vpn);}
  }
 }
 function region(pa){range(pa,255,'PA');return pa<224?'ram':pa<232?'kbd':pa<240?'lcd':'reserved';}
 function access(pa,actor,write){
  var kind=region(pa);actor=actor||'program';
  if(['program','keyboard','lcd','cache','loader'].indexOf(actor)===-1)throw new Error('Actor desconocido');
  if(kind==='reserved')throw new Error('Zona reservada');
  if(actor==='keyboard'&&kind!=='kbd'||actor==='lcd'&&kind!=='lcd')throw new Error('Fuera del dispositivo');
  if((actor==='cache'||actor==='loader')&&kind!=='ram')throw new Error('E/S no cacheable ni cargable');
  if(write&&kind==='kbd'&&actor!=='keyboard')throw new Error('KBD solo admite escritura del controlador');
  return kind;
 }
 function read(ram,pa,actor){validate(ram);access(pa,actor,false);return ram.bytes[pa];}
 function write(ram,pa,value,actor){
  validate(ram);range(value,255,'valor');var kind=access(pa,actor,true);
  var next=JSON.parse(JSON.stringify(ram)),before=next.bytes[pa];next.bytes[pa]=value;
  return {ram:next,event:{pa:pa,before:before,after:value,region:kind,cacheable:kind==='ram',
   requiresCacheCoherence:kind==='ram'}};
 }
 // A display projection only; reserved bytes are visible but remain inaccessible to programs.
 function rows(ram){validate(ram);return ram.bytes.map(function(value,pa){return {pa:pa,pfn:Math.floor(pa/32),
  offset:pa%32,region:region(pa),decimal:value,hex:value.toString(16).toUpperCase().padStart(2,'0')};});}
 return {reset:reset,validate:validate,region:region,read:read,write:write,rows:rows};
}());
if(typeof module!=='undefined'&&module.exports)module.exports=PhysicalRam;
