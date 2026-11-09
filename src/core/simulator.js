/** Delivery coordinator. Step commits one instruction and returns its ordered trace. */
function Simulator(template) {
  var clone = function(x) { return JSON.parse(JSON.stringify(x)); };
  var pages = PageCoherence({validateSnapshot:mmuValidateSnapshot,resolveAccess:mmuResolveAccess,
    swapValidate:swapValidate,fifo:PageFifo,saveFrame:swapSaveFrame,
    invalidate:CacheCoherence.invalidate,readPage:swapReadPage});
  function load(source) {
    var assembled = AsmParser.assemble(source,0);
    if (!assembled.ok) return {ok:false,errors:assembled.errors};
    if (!assembled.bytes.length) return {ok:false,errors:[{line:0,message:'Programa vacío'}]};
    var s=clone(template),image=Array(512).fill(0);
    assembled.bytes.forEach(function(b,i){image[i]=b;});
    s=swapAttachImage(s,image);s.caches.l1i=InstructionCache.reset();
    s.caches.l1d=l1dCreate();s.caches.l2=UnifiedL2.reset();
    s.runtime={instructions:0,lastTrace:[],source:source};
    s.execution.mode='paused';s.execution.pendingRequest=null;
    return {ok:true,state:s};
  }
  function step(original) {
    if (original.execution.mode==='halted') return {status:'halted',state:clone(original),events:[]};
    var s=clone(original),trace=[],pc=s.cpu.pc;
    function emit(e){trace.push(e);}
    function transfer(from,to,sourcePath,targetPath,width,segment,extra) {
      var segments={};segments[segment]={widthBits:width,domain:width===9?'virtual':'data'};
      var wiring={segments:segments,ports:[{name:from,segment:segment,path:sourcePath,widthBits:width},
        {name:to,segment:segment,path:targetPath,widthBits:width}]};
      var signals={};signals['En_'+from]=true;signals['Ld_'+to]=true;
      var r=BusArbiter.transfer(s,wiring,signals,s.revision);
      if(r.status!=='completed')throw Error(r.error.code);
      s=r.state;emit({kind:'bus',from:from,to:to,signals:signals,segment:segment,
        value:r.event.captures[0].after,pa:extra===undefined?null:extra});
    }
    function translated(va,kind) {
      var q={va:va,kind:kind,io:false,endpoint:null},r=mmuResolveAccess(s,q);
      if(!r.ok)throw Error(r.error.code);
      if(r.status==='pageFault') {
        var plan=pages.prepare(s,Math.floor(va/32));
        s=pages.finish(s,plan,plan.bytes).state;s.metrics.pageFaults++;
        plan.trace.forEach(emit);emit({kind:'page-fault',vpn:plan.decision.vpn,
          victim:plan.decision.victim,pfn:plan.decision.pfn,bytes:32});
        r=mmuResolveAccess(s,q);
      }
      if(!r.ok||r.status!=='translated')throw Error('TRANSLATION_FAILED');
      s=pages.markAccess(s,q).state;return r;
    }
    function count(level,outcome,pa){s.metrics[level][outcome==='hit'?'hits':'misses']++;
      emit({kind:'cache',level:level,result:outcome,pa:pa,tag:Math.floor(pa/8)});}
    function read(va,kind) {
      var t=translated(va,kind),pa=t.pa,isFetch=kind==='fetch',level=isFetch?'l1i':'l1d';
      var hit=isFetch?InstructionCache.lookup(s.caches.l1i,pa,'fetch'):l1dRead(s.caches.l1d,t);
      count(level,hit.status,pa);
      if(hit.status==='miss'){
        var request={kind:'read-line',level:'L2',basePa:Math.floor(pa/8)*8,length:8};
        var line=UnifiedL2.readLine(s.caches.l2,request,function(address){
          transfer('RAM','MDR',['ram','bytes',address],['cpu','mdr'],8,'externalData',address);
          return {pa:address,value:s.cpu.mdr,event:trace[trace.length-1]};
        });
        s.caches.l2=line.cache;s.metrics.l2.hits+=line.metrics.hits;s.metrics.l2.misses+=line.metrics.misses;
        line.events.filter(function(e){return e.kind!=='line-byte';}).forEach(emit);
        s.caches[level]=isFetch?InstructionCache.fill(s.caches.l1i,hit.request,line.response):l1dFill(t,line.response.bytes);
      }
      transfer(isFetch?'L1I':'L1D','MDR',['caches',level,'bytes',pa%8],['cpu','mdr'],8,'internalData',pa);
      return s.cpu.mdr;
    }
    function write(va,register) {
      var t=translated(va,'write'),value=s.cpu.registers[register];
      var plan=l1dPlanWrite(s.caches.l1d,t,value);count('l1d',plan.status,t.pa);
      transfer(register,'MDR',['cpu','registers',register],['cpu','mdr'],8,'internalData');
      transfer('MDR','RAM',['cpu','mdr'],['ram','bytes',t.pa],8,'externalData',t.pa);
      var invalidated=CacheCoherence.invalidate(s.caches,t.pa,1);
      if(invalidated.status!=='completed')throw Error('WRITEBACK_REQUIRED');
      s.caches=invalidated.caches;s.caches.l1d=plan.lineAfterCommit;
      emit({kind:'write-through',va:va,pa:t.pa,value:value});
    }
    try {
      if(!Number.isInteger(pc)||pc<0||pc+4>480)throw Error('INVALID_PC');
      transfer('PC','MAR',['cpu','pc'],['cpu','mar'],9,'internalAddress');
      s.cpu.ir.loadedBytes=0;
      for(var i=0;i<4;i++){
        read(pc+i,'fetch');transfer('MDR','IR',['cpu','mdr'],['cpu','ir','bytes',i],8,'internalData');
        s.cpu.ir.loadedBytes++;
      }
      var decoded=cpuDecodeInstruction(s.cpu.ir.bytes);
      if(!decoded.ok)throw Error(decoded.error.message);
      var ins=decoded.instruction,op=ins.mnemonic,r=ins.register,src=ins.sourceRegister;
      s.cpu.ir.decoded=ins;var nextPc=pc+4;
      if(op==='HALT'){s.execution.mode='halted';nextPc=pc;}
      else if(op==='MOV'){
        if(src)transfer(src,r,['cpu','registers',src],['cpu','registers',r],8,'internalData');
        else {s.cpu.mdr=ins.immediate;transfer('MDR',r,['cpu','mdr'],['cpu','registers',r],8,'internalData');}
      } else if(op==='LOAD'){
        read(ins.address,'read');transfer('MDR',r,['cpu','mdr'],['cpu','registers',r],8,'internalData');
      } else if(op==='STORE')write(ins.address,r);
      else if(['JMP','JZ','JNZ'].indexOf(op)!==-1){
        if(op==='JMP'||(op==='JZ'&&s.cpu.flags.ZF)||(op==='JNZ'&&!s.cpu.flags.ZF))nextPc=ins.address;
      } else if(op==='IN'){
        var input=KeyboardQueue.consume(s,r,s.revision,BusArbiter);
        if(input.status==='waiting')return {status:'waiting',state:clone(original),events:[{kind:'waiting-keyboard'}]};
        if(input.status!=='completed')throw Error(input.error.code);
        s=input.state;emit({kind:'io-read',endpoint:'KBD',register:r,value:s.cpu.registers[r],
          signals:{Read:true,Write:false,IO:true,En_KBD:true},transfers:input.events});
      } else if(op==='OUT'){
        transfer(r,'MDR',['cpu','registers',r],['cpu','mdr'],8,'internalData');
        var address=s.io.lcd.basePa+s.io.lcd.cursor,before=clone(s);
        transfer('MDR','LCD',['cpu','mdr'],['ram','bytes',address],8,'externalData',address);
        var out=lcdReceive(before,{pa:address,signals:{Ld_LCD:true,Write:true,Read:false,IO:true,Clock:true},
          bus:{level:'driven',drivers:['MDR'],receivers:['LCD'],value:s.cpu.mdr}});
        s.io.lcd=out.state.io.lcd;emit({kind:'io-write',endpoint:'LCD',pa:address,value:s.cpu.mdr,
          signals:{IO:true,Write:true,Read:false,Ld_LCD:true}});
      } else if(op!=='NOP') {
        var b=src?s.cpu.registers[src]:ins.immediate===null?1:ins.immediate;
        var alu=CpuAlu.evaluate(op,s.cpu.registers[r],b,s.cpu.flags);
        s.cpu.alu={a:alu.a,b:alu.b,result:alu.result,operation:op};s.cpu.flags=alu.flags;
        if(alu.writeResult)transfer('ALU',r,['cpu','alu','result'],['cpu','registers',r],8,'internalData');
      }
      s.cpu.pc=nextPc;s.clock.cycle++;s.clock.microStep+=trace.filter(function(e){return e.kind==='bus';}).length;
      s.clock.phase=op;s.runtime.instructions++;s.runtime.lastTrace=trace;
      s.revision=original.revision+1;s.lastEvent=null;
      CpuAlu.validate(s.cpu);
      return {status:s.execution.mode==='halted'?'halted':'completed',state:s,events:trace};
    }catch(e){return {status:'error',error:String(e.message),state:clone(original),events:[]};}
  }
  function run(state,limit) {
    if(!Number.isInteger(limit)||limit<1||limit>1000)throw Error('Run: 1..1000 instrucciones');
    var result={status:'completed',state:clone(state),events:[]},all=[];
    for(var i=0;i<limit;i++){result=step(result.state);all=all.concat(result.events);
      if(result.status!=='completed')break;}
    result.events=all;return result;
  }
  return {load:load,step:step,run:run};
}
