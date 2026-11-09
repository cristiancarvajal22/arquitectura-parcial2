'use strict';
var CacheCoherence=(function(){
 function range(n,max){if(!Number.isInteger(n)||n<0||n>max)throw new Error('Rango inválido');}
 function entries(c){
  if(!c.l2||!Array.isArray(c.l2.lines)||c.l2.lines.length!==4||!Array.isArray(c.l2.fifo))throw new Error('L2 requiere cuatro líneas y FIFO');
  var all=[{level:'l1i',index:null,line:c.l1i},{level:'l1d',index:null,line:c.l1d}];
  c.l2.lines.forEach(function(line,index){all.push({level:'l2',index:index,line:line});});
  all.forEach(function(e){var l=e.line;
   if(!l||typeof l.valid!=='boolean'||typeof l.dirty!=='boolean'||!Array.isArray(l.bytes)||l.bytes.length!==8)throw new Error('Línea inválida');
   for(var i=0;i<8;i++)range(l.bytes[i],255);
   if(l.valid)range(l.tag,27);else if(l.tag!==null||l.dirty)throw new Error('Línea inválida conserva tag/dirty');
   if(e.level==='l1i'&&l.dirty)throw new Error('L1I no puede ser dirty');
  });
  if(new Set(c.l2.fifo).size!==c.l2.fifo.length)throw new Error('FIFO duplicado');
  c.l2.fifo.forEach(function(i){range(i,3);if(!c.l2.lines[i].valid)throw new Error('FIFO apunta a línea inválida');});
  return all;
 }
 // Ranges are physical. Aliased virtual addresses therefore invalidate the same copies.
 function invalidate(c,start,length){
  range(start,223);range(length,224);if(length===0||start+length>224)throw new Error('Rango de memoria ordinaria requerido');
  var all=entries(c),first=Math.floor(start/8),last=Math.floor((start+length-1)/8);
  var affected=all.filter(function(e){return e.line.valid&&e.line.tag>=first&&e.line.tag<=last;});
  var dirty=affected.filter(function(e){return e.line.dirty;});
  if(dirty.length)return {status:'needs-writeback',lines:dirty.map(function(e){return {level:e.level,index:e.index,basePa:e.line.tag*8,bytes:e.line.bytes.slice()};})};
  var next=JSON.parse(JSON.stringify(c));
  affected.forEach(function(e){var l=e.level==='l2'?next.l2.lines[e.index]:next[e.level];l.valid=false;l.tag=null;l.dirty=false;});
  next.l2.fifo=next.l2.fifo.filter(function(i){return next.l2.lines[i].valid;});
  // Cancel any outstanding L1I fill, including a miss whose old resident line is unrelated.
  if(next.l1i.generation!==undefined){range(next.l1i.generation,Number.MAX_SAFE_INTEGER-1);next.l1i.generation++;}
  return {status:'completed',caches:next,invalidated:affected.map(function(e){return {level:e.level,index:e.index};})};
 }
 function route(pa){range(pa,255);return pa<224?'cacheable':pa<240?'io-bypass':'reserved';}
 return {invalidate:invalidate,route:route};
}());
if(typeof module!=='undefined'&&module.exports)module.exports=CacheCoherence;
