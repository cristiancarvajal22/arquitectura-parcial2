/** Four physical lines, FIFO independent of page FIFO. Read-only line service. */
var UnifiedL2=(function(){
  function clone(x){return JSON.parse(JSON.stringify(x));}
  function byte(v){if(!Number.isInteger(v)||v<0||v>255)throw new Error('INVALID_BYTE');}
  function address(pa){if(!Number.isInteger(pa)||pa<0||pa>=224)throw new Error('NON_CACHEABLE_ADDRESS');}
  function reset(){return {lines:Array.from({length:4},function(){return {valid:false,tag:null,dirty:false,bytes:Array(8).fill(0)};}),fifo:[],generation:0};}
  function validate(c){
    if(!c||!Array.isArray(c.lines)||c.lines.length!==4||!Array.isArray(c.fifo))throw new Error('INVALID_L2');
    if(c.generation!==undefined&&(!Number.isSafeInteger(c.generation)||c.generation<0||c.generation>=Number.MAX_SAFE_INTEGER))throw new Error('INVALID_GENERATION');
    var tags=[],valid=[];
    for(var i=0;i<4;i++){
      var l=c.lines[i];
      if(!l||typeof l.valid!=='boolean'||l.dirty!==false||!Array.isArray(l.bytes)||l.bytes.length!==8)throw new Error('INVALID_LINE');
      for(var j=0;j<8;j++)byte(l.bytes[j]);
      if(l.valid){if(!Number.isInteger(l.tag)||l.tag<0||l.tag>27||tags.indexOf(l.tag)!==-1)throw new Error('INVALID_TAG');tags.push(l.tag);valid.push(i);}
      else if(l.tag!==null)throw new Error('INVALID_TAG');
    }
    if(c.fifo.length!==valid.length||new Set(c.fifo).size!==c.fifo.length||c.fifo.some(function(i){return !Number.isInteger(i)||valid.indexOf(i)===-1;}))throw new Error('INVALID_FIFO');
  }
  function lookup(c,pa){validate(c);address(pa);var tag=Math.floor(pa/8),index=c.lines.findIndex(function(l){return l.valid&&l.tag===tag;});
    return index<0?{status:'miss',basePa:tag*8}:{status:'hit',index:index,basePa:tag*8,byte:c.lines[index].bytes[pa%8],bytes:c.lines[index].bytes.slice()};}
  function begin(c,basePa){validate(c);address(basePa);if(basePa%8!==0)throw new Error('UNALIGNED_LINE');
    if(lookup(c,basePa).status==='hit')throw new Error('ALREADY_PRESENT');
    return {basePa:basePa,baseline:clone(c),bytes:[]};}
  function accept(c,fill,transfer){validate(c);
    if(!fill||JSON.stringify(c)!==JSON.stringify(fill.baseline))throw new Error('STALE_FILL');
    address(fill.basePa);if(fill.basePa%8!==0||!Array.isArray(fill.bytes)||fill.bytes.length>=8)throw new Error('INVALID_FILL');
    for(var i=0;i<fill.bytes.length;i++)byte(fill.bytes[i]);
    if(!transfer||transfer.pa!==fill.basePa+fill.bytes.length)throw new Error('OUT_OF_ORDER_TRANSFER');byte(transfer.value);
    var next=clone(fill);next.bytes.push(transfer.value);
    if(next.bytes.length<8)return {status:'pending',fill:next,cache:clone(c)};
    var updated=clone(c),slot=updated.lines.findIndex(function(l){return !l.valid;}),victim=null;
    if(slot<0){slot=updated.fifo.shift();victim=updated.lines[slot].tag;}
    updated.lines[slot]={valid:true,tag:fill.basePa/8,dirty:false,bytes:next.bytes.slice()};updated.fifo.push(slot);updated.generation=(c.generation||0)+1;validate(updated);
    return {status:'completed',cache:updated,response:{basePa:fill.basePa,bytes:next.bytes.slice()},victimTag:victim,index:slot};
  }
  /** Convenience transaction: callback must stage bus transfers, never persist itself. */
  function readLine(c,request,readBusByte){
    if(!request||request.kind!=='read-line'||request.level!=='L2'||request.length!==8)throw new Error('INVALID_REQUEST');
    address(request.basePa);if(request.basePa%8!==0)throw new Error('UNALIGNED_LINE');
    var result=lookup(c,request.basePa),events=[{kind:'cache-lookup',level:'l2',basePa:request.basePa,result:result.status}];
    if(result.status==='hit')return {status:'completed',cache:clone(c),response:{basePa:request.basePa,bytes:result.bytes},events:events,metrics:{hits:1,misses:0}};
    if(typeof readBusByte!=='function')throw new Error('BUS_REQUIRED');
    var fill=begin(c,request.basePa),accepted;
    for(var i=0;i<8;i++){
      var transfer=readBusByte(request.basePa+i);
      if(!transfer||!transfer.event)throw new Error('MISSING_BUS_EVENT');
      accepted=accept(c,fill,transfer);events.push({kind:'line-byte',level:'l2',pa:transfer.pa,value:transfer.value,bus:clone(transfer.event)});
      if(accepted.status==='pending')fill=accepted.fill;
    }
    events.push({kind:'line-filled',level:'l2',basePa:request.basePa,index:accepted.index,victimTag:accepted.victimTag});
    return {status:'completed',cache:accepted.cache,response:accepted.response,events:events,metrics:{hits:0,misses:1}};
  }
  function invalidate(c,start,length){validate(c);address(start);
    if(!Number.isInteger(length)||length<1||start+length>224)throw new Error('INVALID_RANGE');
    var next=clone(c),first=Math.floor(start/8),last=Math.floor((start+length-1)/8);
    next.lines.forEach(function(l){if(l.valid&&l.tag>=first&&l.tag<=last){l.valid=false;l.tag=null;l.dirty=false;}});
    next.fifo=next.fifo.filter(function(i){return next.lines[i].valid;});
    next.generation=(c.generation||0)+1;validate(next);return next;
  }
  return {reset:reset,validate:validate,lookup:lookup,begin:begin,accept:accept,readLine:readLine,invalidate:invalidate};
}());
if(typeof module!=='undefined'&&module.exports)module.exports=UnifiedL2;
