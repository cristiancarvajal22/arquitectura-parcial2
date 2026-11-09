'use strict';
var PageFifo=(function(){
 function range(n,max){if(!Number.isInteger(n)||n<0||n>max)throw new RangeError('Fuera de rango');}
 function reset(){return {revision:0,queue:[],frames:Array.from({length:8},function(_,pfn){
  return {pfn:pfn,vpn:pfn===7?15:null,pinned:pfn===7};})};}
 function validate(s){
  range(s.revision,Number.MAX_SAFE_INTEGER);
  if(!Array.isArray(s.frames)||s.frames.length!==8||!Array.isArray(s.queue))throw new Error('Estado FIFO inválido');
  var pages=[],eligible=[];
  s.frames.forEach(function(f,i){
   if(!f||f.pfn!==i||typeof f.pinned!=='boolean')throw new Error('Marco inválido');
   if(i===7&&(f.vpn!==15||!f.pinned))throw new Error('Marco de E/S protegido');
   if(f.vpn!==null){range(f.vpn,i===7?15:14);if(pages.indexOf(f.vpn)!==-1)throw new Error('Página duplicada');pages.push(f.vpn);}
   if(!f.pinned&&f.vpn!==null)eligible.push(i);
  });
  if(s.queue.length!==eligible.length||new Set(s.queue).size!==s.queue.length||
    s.queue.some(function(p){return eligible.indexOf(p)===-1;}))throw new Error('Cola inconsistente');
 }
 // Selection does not evict or mutate. MMU must flush dirty data and invalidate caches first.
 function select(s,vpn){
  validate(s);range(vpn,15);
  var hit=s.frames.find(function(f){return f.vpn===vpn;});
  if(hit)return {revision:s.revision,vpn:vpn,pfn:hit.pfn,victim:null,reason:'hit'};
  var free=s.frames.find(function(f){return !f.pinned&&f.vpn===null;});
  if(free)return {revision:s.revision,vpn:vpn,pfn:free.pfn,victim:null,reason:'free'};
  if(!s.queue.length)throw new Error('No hay marcos reemplazables');
  var victim=s.frames[s.queue[0]];
  return {revision:s.revision,vpn:vpn,pfn:victim.pfn,victim:victim.vpn,reason:'fifo'};
 }
 // Call only after the coordinator completes the eviction/load transaction.
 function commit(s,decision){
  var current=select(s,decision.vpn);
  if(['revision','vpn','pfn','victim','reason'].some(function(k){return current[k]!==decision[k];}))throw new Error('Decisión obsoleta o alterada');
  var next=JSON.parse(JSON.stringify(s));
  if(current.reason==='hit')return next;
  if(s.revision===Number.MAX_SAFE_INTEGER)throw new Error('Revisión agotada');
  next.queue=next.queue.filter(function(p){return p!==current.pfn;});next.queue.push(current.pfn);
  next.frames[current.pfn].vpn=current.vpn;next.revision++;validate(next);return next;
 }
 function view(s,vpn){validate(s);return {queue:s.queue.map(function(p){return {pfn:p,vpn:s.frames[p].vpn};}),
  head:s.queue.length?s.frames[s.queue[0]].vpn:null,decision:vpn===undefined?null:select(s,vpn),
  excluded:s.frames.filter(function(f){return f.pinned;}).map(function(f){return {pfn:f.pfn,vpn:f.vpn,reason:'pinned'};})};}
 return {reset:reset,validate:validate,select:select,commit:commit,view:view};
}());
if(typeof module!=='undefined'&&module.exports)module.exports=PageFifo;
