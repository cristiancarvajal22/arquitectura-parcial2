/* Integration coordinator, Marcelo: #5 #8 #11 #17 #20 #23 #26 #29 #32 #35.
 * Pure JSON motor. One step commits at most one physical bus transfer.
 * Existing team modules retain their authorship in the merged Git history.
 */
var P2Machine = (function () {
  'use strict';
  var SIGNALS = microWordSignals.concat(['En_L1I','Ld_L1I','En_L1D','Ld_L1D',
    'En_L2','Ld_L2','En_SWAP','Ld_SWAP','En_MMU','Ld_MMU']);
  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function fail(code, message) { var e = new Error(message || code); e.code = code; throw e; }
  function byte(v) { if (!Number.isInteger(v) || v < 0 || v > 255) fail('OUT_OF_RANGE'); }
  function signals(active) { var s={}; SIGNALS.forEach(function(k){s[k]=false;});
    Object.keys(active||{}).forEach(function(k){if(!Object.prototype.hasOwnProperty.call(s,k)||typeof active[k]!=='boolean')fail('INVALID_SIGNALS',k);s[k]=active[k];});
    s.Clock=true;if(s.Read&&s.Write||s.Mem_R&&s.Mem_W||s.IO&&(s.Mem_R||s.Mem_W))fail('INVALID_CONTROL');return s; }
  function buses() { var b={}; [['internalAddress',9,'virtual'],['externalAddress',8,'physical'],
    ['internalData',8,'data'],['externalData',8,'data'],['internalControl',40,'control'],['externalControl',40,'control']]
    .forEach(function(x){b[x[0]]={widthBits:x[1],domain:x[2],level:'Z',value:null,drivers:[],receivers:[]};});return b; }
  function profile(approved) { return {id:'team-integration-40-v1',status:approved===true?'ready':'proposal',pendingIssues:approved===true?[]:[3],
    sizes:{ramBytes:256,virtualBytes:512,pageBytes:32,frameCount:8,pageCount:16,lineBytes:8,l2Lines:4},
    widths:{register:8,pc:9,mar:9,mdr:8,irMaxBytes:4,internalControl:40,externalControl:40},
    ioMap:{keyboard:{va:480,pa:224,length:8},lcd:{va:488,pa:232,length:8}},pinnedMappings:[{vpn:15,pfn:7}],
    cachePolicy:{addressing:'physical',l2Replacement:'FIFO',write:'write-through',allocate:'no-write-allocate'},
    controlEncoding:SIGNALS.slice()}; }
  function create(p) {
    if(!p||p.id!=='team-integration-40-v1')fail('INVALID_PROFILE');
    var cpu=CpuAlu.reset(); cpu.alu.addressResult=0;
    cpu.control={phase:'idle',microStep:0,word:null,signals:signals({}),machine:{phase:'fetch',stage:'address',instructionStart:0,execIndex:0,sequence:0}};
    SIGNALS.forEach(function(k){cpu.control.signals[k]=false;});
    var stats=cacheMetricsCreate();stats.pageFaults=0;stats.committedMicroSteps=0;
    return {schemaVersion:1,profile:copy(p),revision:0,cpu:cpu,buses:buses(),ram:PhysicalRam.reset(),
      mmu:{pages:mmuCreatePageTable(p.pinnedMappings).pages,fifo:[],fault:null},swap:swapCreate(),
      caches:{l1i:InstructionCache.reset(),l1d:l1dCreate(),l2:UnifiedL2.reset()},
      io:{keyboard:KeyboardQueue.resetMetadata(),lcd:{basePa:232,length:8,cursor:0}},
      clock:{cycle:0,microStep:0,phase:'idle'},execution:{mode:'idle',pendingRequest:null,lastError:null,memoryReceipt:null},
      metrics:stats,lastEvent:null,program:{source:'',starts:[],sourceMap:[],origin:0}};
  }
  function check(s) {
    var v=mmuValidateIoMap(s); if(!v.ok)fail(v.error.code,v.error.message);
    if(!Number.isSafeInteger(s.revision)||s.revision<0||s.revision>=Number.MAX_SAFE_INTEGER)fail('INVALID_STATE');
    if(s.profile.id!=='team-integration-40-v1'||s.profile.ioMap.keyboard.va!==480||s.profile.ioMap.keyboard.pa!==224||s.profile.ioMap.lcd.va!==488||s.profile.ioMap.lcd.pa!==232)fail('INVALID_PROFILE','El coordinador integrado usa el mapa de equipo 224/232.');
    [s.clock.cycle,s.clock.microStep,s.metrics.committedMicroSteps].forEach(function(v){if(!Number.isSafeInteger(v)||v<0||v>=Number.MAX_SAFE_INTEGER)fail('INVALID_COUNTER');});
    if(s.lastEvent&&(s.lastEvent.revisionAfter!==s.revision||!Number.isSafeInteger(s.lastEvent.id)||s.lastEvent.id<1))fail('INVALID_EVENT');
    PageFifo.validate({revision:s.revision,frames:s.ram.frames,queue:s.mmu.fifo});
    CpuAlu.validate(s.cpu);UnifiedL2.validate(s.caches.l2);InstructionCache.validate(s.caches.l1i);l1dValidate(s.caches.l1d);
    swapValidate(s.swap);
  }
  function set(s,path,value){var t=s;path.slice(0,-1).forEach(function(k){t=t[k];});t[path[path.length-1]]=value;}
  function changes(a,b,path,out){if(JSON.stringify(a)===JSON.stringify(b))return;
    if(a!==null&&b!==null&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)){
      var keys=Array.from(new Set(Object.keys(a).concat(Object.keys(b))));keys.forEach(function(k){if(!path&&k==='lastEvent')return;changes(a[k],b[k],path?path+'.'+k:k,out);});
    }else {var change={path:path,before:a===undefined?null:a,after:b===undefined?null:b};if(b===undefined)change.deleted=true;out.push(change);}}
  function port(name,segment,path,width){return {name:name,segment:segment,path:path,widthBits:width};}
  function tx(s,ctx,ports,active,pa){
    var spec={segments:{internalAddress:{widthBits:9,domain:'virtual'},externalAddress:{widthBits:8,domain:'physical'},
      internalData:{widthBits:8,domain:'data'},externalData:{widthBits:8,domain:'data'}},ports:ports.slice()};
    if(pa!==null&&pa!==undefined){s.cpu.alu.addressResult=pa;spec.ports.push(port('MMU','externalAddress',['cpu','alu','addressResult'],8));active.En_MMU=true;ctx.pa=pa;}
    ctx.signals=signals(active);var en={};spec.ports.forEach(function(p){['En_','Ld_'].forEach(function(prefix){en[prefix+p.name]=ctx.signals[prefix+p.name];});});
    var r=BusArbiter.transfer(s,spec,en,s.revision);if(r.status==='rejected')fail(r.error.code,r.error.message);
    r.event.captures.forEach(function(c){set(s,c.path,c.after);});s.buses=r.state.buses;ctx.transferred=true;
  }
  function addressTo(s,ctx,value,destination){
    if(!Number.isInteger(value)||value<0||value>511)fail('OUT_OF_RANGE');s.cpu.alu.addressResult=value;
    var active={En_ALU:true};active['Ld_'+destination]=true;
    tx(s,ctx,[port('ALU','internalAddress',['cpu','alu','addressResult'],9),
      port(destination,'internalAddress',['cpu',destination.toLowerCase()],9)],active,null);
  }
  function transferRegister(s,ctx,destination,source){
    var sourceName,path;
    if(source.kind==='register'){sourceName=source.name;path=sourceName==='MDR'?['cpu','mdr']:['cpu','registers',sourceName];}
    else if(source.kind==='immediate'){sourceName='IR';path=['cpu','ir','bytes',2];if(s.cpu.ir.bytes[2]!==source.value)fail('INVALID_OPERAND');}
    else if(source.kind==='aluResult'){sourceName='ALU';path=['cpu','alu','result'];}else fail('INVALID_OPERAND');
    var destPath=destination==='MDR'?['cpu','mdr']:['cpu','registers',destination];
    var ports=[port(sourceName,'internalData',path,8)];
    // A loopback capture uses one endpoint, not two ports with duplicate names.
    if(sourceName===destination){var active={};active['En_'+sourceName]=true;active['Ld_'+sourceName]=true;tx(s,ctx,ports,active,null);}
    else {ports.push(port(destination,'internalData',destPath,8));var sig={};sig['En_'+sourceName]=true;sig['Ld_'+destination]=true;tx(s,ctx,ports,sig,null);}
  }
  function commit(before,next,ctx,id,status,value){
    var sig=ctx.signals||signals({});if(!ctx.transferred)next.buses=buses();
    var word=0;SIGNALS.forEach(function(k,i){if(sig[k])word+=Math.pow(2,i);});
    ['internalControl','externalControl'].forEach(function(k){next.buses[k]={widthBits:40,domain:'control',level:'driven',value:word,drivers:['UC'],receivers:[]};});
    next.revision=before.revision+1;next.clock={cycle:before.clock.cycle+1,microStep:before.clock.microStep+1,phase:ctx.kind};
    next.cpu.control.phase=ctx.kind;next.cpu.control.microStep=next.clock.microStep;next.cpu.control.signals=sig;next.cpu.control.word=word;
    next.metrics.committedMicroSteps=before.metrics.committedMicroSteps+1;
    var delta=[];changes(before,next,'',delta);
    var event={schemaVersion:1,id:before.lastEvent?before.lastEvent.id+1:1,requestId:id,
      revisionBefore:before.revision,revisionAfter:next.revision,cycle:next.clock.cycle,microStep:next.clock.microStep,
      phase:ctx.kind,kind:ctx.kind,signals:copy(sig),controlWord:word,segments:Object.keys(next.buses).map(function(k){var b=next.buses[k];return {name:k,widthBits:b.widthBits,level:b.level,value:b.value,driver:b.drivers.length?b.drivers[0]:null,receivers:b.receivers.slice()};}),
      va:ctx.va===undefined?null:ctx.va,pa:ctx.pa===undefined?null:ctx.pa,bytes:ctx.bytes||[],changes:delta,result:'committed'};
    if(ctx.lookup)event.lookup=ctx.lookup;next.lastEvent=copy(event);
    return {status:status||'completed',requestId:id,state:next,events:[event],value:value===undefined?null:value};
  }
  function lookup(s,m,level,outcome,ctx){var r=cacheMetricsRecord(s.metrics,m.accounting,{requestId:m.requestId,lookupId:level,level:level,outcome:outcome});
    s.metrics=r.metrics;m.accounting=r.accounting;ctx.lookup={level:level,outcome:outcome,counted:r.counted};}
  function startMemory(s,kind,va,io,endpoint,id){
    if(s.execution.pendingRequest!==null)fail('BUSY');
    s.execution.pendingRequest={requestId:id,kind:kind,va:va,io:io,endpoint:endpoint,stage:'translate',
      accounting:cacheMetricsBeginRequest(id),index:0,buffer:Array(8).fill(0)};s.execution.memoryReceipt=null;
  }
  function finishMemory(s,m){s.execution.memoryReceipt={requestId:m.requestId,value:m.kind==='write'?null:s.cpu.mdr};s.execution.pendingRequest=null;}
  function cachePort(level,index){if(level==='l2')return ['caches','l2','lines',index];return ['caches',level];}
  function memoryTick(s,ctx){
    var m=s.execution.pendingRequest;if(!m)fail('UNKNOWN_REQUEST');ctx.va=m.va;ctx.kind='memory-'+m.stage;
    if(m.stage==='translate'){
      var tr=mmuResolveAccess(s,{va:m.va,kind:m.kind,io:m.io,endpoint:m.endpoint});if(!tr.ok)fail(tr.error.code,tr.error.message);
      if(tr.status==='pageFault'){
        var d=PageFifo.select({revision:s.revision,frames:s.ram.frames,queue:s.mmu.fifo},tr.vpn);
        m.vpn=tr.vpn;m.pfn=d.pfn;m.victim=d.victim;m.victimDirty=d.victim!==null&&s.mmu.pages[d.victim].dirty;m.index=0;m.stage=m.victimDirty?'save-page':'invalidate';
        s.mmu.fault={requestId:m.requestId,vpn:m.vpn,victimPfn:m.pfn,stage:m.stage,transferredBytes:0};s.metrics.pageFaults++;ctx.kind='page-fault';return false;
      }
      m.translation=tr;m.pa=tr.pa;m.level=m.kind==='fetch'?'l1i':'l1d';m.stage=!tr.access.cacheable?'io':m.kind==='write'?'write-l1':'lookup-l1';return false;
    }
    if(m.stage==='save-page'){
      var from=m.pfn*32+m.index;tx(s,ctx,[port('RAM','externalData',['ram','bytes',from],8),port('SWAP','externalData',['swap','pages',m.victim,m.index],8)],{En_RAM:true,Ld_SWAP:true,Read:true,Mem_R:true},from);
      ctx.bytes=[s.ram.bytes[from]];m.index++;s.mmu.fault.transferredBytes=m.index;if(m.index===32){m.index=0;m.stage='invalidate';}return false;
    }
    if(m.stage==='invalidate'){
      var inv=CacheCoherence.invalidate(s.caches,m.pfn*32,32);if(inv.status!=='completed')fail('CACHE_WRITEBACK_REQUIRED');s.caches=inv.caches;
      if(m.victim!==null)s.mmu.pages[m.victim]={vpn:m.victim,present:false,pfn:null,dirty:false,referenced:false,pinned:false};
      s.ram.frames[m.pfn].vpn=null;s.mmu.fifo=s.mmu.fifo.filter(function(p){return p!==m.pfn;});m.stage='load-page';m.index=0;s.mmu.fault.stage='load-page';s.mmu.fault.transferredBytes=0;return false;
    }
    if(m.stage==='load-page'){
      var pa=m.pfn*32+m.index;tx(s,ctx,[port('SWAP','externalData',['swap','pages',m.vpn,m.index],8),port('RAM','externalData',['ram','bytes',pa],8)],{En_SWAP:true,Ld_RAM:true,Write:true,Mem_W:true},pa);
      ctx.bytes=[s.ram.bytes[pa]];m.index++;s.mmu.fault.transferredBytes=m.index;if(m.index===32)m.stage='install-page';return false;
    }
    if(m.stage==='install-page'){
      var fs={revision:s.revision,frames:s.ram.frames,queue:s.mmu.fifo};var decision=PageFifo.select(fs,m.vpn);if(decision.pfn!==m.pfn)fail('STALE_REPLACEMENT');
      var installed=PageFifo.commit(fs,decision);s.ram.frames=installed.frames;s.mmu.fifo=installed.queue;
      s.mmu.pages[m.vpn]={vpn:m.vpn,present:true,pfn:m.pfn,dirty:false,referenced:false,pinned:false};s.mmu.fault=null;m.stage='translate';return false;
    }
    ctx.pa=m.pa;
    if(m.stage==='io'){
      if(m.kind==='read'){
        if(m.consume&&s.io.keyboard.count===0)return 'waiting';
        var k=s.io.keyboard;if(m.consume)m.pa=k.basePa+k.head;
        var inputSignals={Ld_MDR:true,Read:true,IO:true};inputSignals['En_'+m.endpoint]=true;
        tx(s,ctx,[port(m.endpoint,'externalData',['ram','bytes',m.pa],8),port('MDR','externalData',['cpu','mdr'],8)],inputSignals,m.pa);
        if(m.consume){k.head=(k.head+1)%8;k.count--;}
      }else{
        var lcd=s.io.lcd,proposal=null;if(m.advanceCursor){m.pa=lcd.basePa+lcd.cursor;
          var trf={pa:m.pa,signals:{Ld_LCD:true,Write:true,Read:false,IO:true,Clock:true},bus:{level:'driven',value:s.cpu.mdr,drivers:['MDR'],receivers:['LCD']}};
          proposal=lcdReceive(s,trf);}
        tx(s,ctx,[port('MDR','externalData',['cpu','mdr'],8),port('LCD','externalData',['ram','bytes',m.pa],8)],{En_MDR:true,Ld_LCD:true,Write:true,IO:true},m.pa);
        if(proposal)s.io.lcd.cursor=proposal.state.io.lcd.cursor;
      }
      ctx.bytes=[s.cpu.mdr];finishMemory(s,m);return true;
    }
    if(m.stage==='lookup-l1'){
      var result=m.level==='l1i'?InstructionCache.lookup(s.caches.l1i,m.pa,'fetch'):l1dRead(s.caches.l1d,m.translation);
      lookup(s,m,m.level,result.status,ctx);m.stage=result.status==='hit'?'deliver':'lookup-l2';return false;
    }
    if(m.stage==='lookup-l2'){
      var l2=UnifiedL2.lookup(s.caches.l2,m.pa);lookup(s,m,'l2',l2.status,ctx);m.basePa=Math.floor(m.pa/8)*8;m.index=0;
      if(l2.status==='hit'){m.slot=l2.index;m.stage='fill-l1';s.caches[m.level].valid=false;s.caches[m.level].tag=null;}
      else {m.fill=UnifiedL2.begin(s.caches.l2,m.basePa);m.stage='fill-l2';}return false;
    }
    if(m.stage==='fill-l2'){
      var fillPa=m.basePa+m.index;tx(s,ctx,[port('RAM','externalData',['ram','bytes',fillPa],8),port('L2','externalData',['execution','pendingRequest','buffer',m.index],8)],{En_RAM:true,Ld_L2:true,Read:true,Mem_R:true},fillPa);
      var accepted=UnifiedL2.accept(s.caches.l2,m.fill,{pa:fillPa,value:m.buffer[m.index]});ctx.bytes=[m.buffer[m.index]];m.index++;
      if(accepted.status==='completed'){s.caches.l2=accepted.cache;m.slot=accepted.index;m.index=0;m.stage='fill-l1';s.caches[m.level].valid=false;s.caches[m.level].tag=null;delete m.fill;}
      else m.fill=accepted.fill;return false;
    }
    if(m.stage==='fill-l1'){
      var target=m.level==='l1i'?'L1I':'L1D',sig={En_L2:true,Read:true};sig['Ld_'+target]=true;
      tx(s,ctx,[port('L2','externalData',cachePort('l2',m.slot).concat(['bytes',m.index]),8),port(target,'externalData',cachePort(m.level).concat(['bytes',m.index]),8)],sig,m.basePa+m.index);
      ctx.bytes=[s.caches[m.level].bytes[m.index]];m.index++;if(m.index===8){s.caches[m.level].valid=true;s.caches[m.level].tag=m.basePa/8;if(m.level==='l1i')s.caches.l1i.generation++;m.stage='deliver';}return false;
    }
    if(m.stage==='deliver'){
      var name=m.level==='l1i'?'L1I':'L1D',sig={Ld_MDR:true,Read:true};sig['En_'+name]=true;
      tx(s,ctx,[port(name,'externalData',cachePort(m.level).concat(['bytes',m.pa%8]),8),port('MDR','externalData',['cpu','mdr'],8)],sig,m.pa);
      s.mmu.pages[m.translation.vpn].referenced=true;ctx.bytes=[s.cpu.mdr];finishMemory(s,m);return true;
    }
    if(m.stage==='write-l1'){var wr=l1dPlanWrite(s.caches.l1d,m.translation,s.cpu.mdr);lookup(s,m,'l1d',wr.status,ctx);m.stage='write-l2';return false;}
    if(m.stage==='write-l2'){var hit=UnifiedL2.lookup(s.caches.l2,m.pa);lookup(s,m,'l2',hit.status,ctx);m.slot=hit.status==='hit'?hit.index:null;m.stage='write-ram';return false;}
    if(m.stage==='write-ram'){
      tx(s,ctx,[port('MDR','externalData',['cpu','mdr'],8),port('RAM','externalData',['ram','bytes',m.pa],8)],{En_MDR:true,Ld_RAM:true,Write:true,Mem_W:true},m.pa);
      var pg=s.mmu.pages[m.translation.vpn];pg.dirty=true;pg.referenced=true;
      if(s.caches.l1i.valid&&s.caches.l1i.tag===Math.floor(m.pa/8))s.caches.l1i=InstructionCache.invalidate(s.caches.l1i);
      m.stage='write-copy-l1';return false;
    }
    if(m.stage==='write-copy-l1'){
      if(s.caches.l1d.valid&&s.caches.l1d.tag===Math.floor(m.pa/8))tx(s,ctx,[port('MDR','externalData',['cpu','mdr'],8),port('L1D','externalData',['caches','l1d','bytes',m.pa%8],8)],{En_MDR:true,Ld_L1D:true,Write:true},m.pa);
      m.stage='write-copy-l2';return false;
    }
    if(m.stage==='write-copy-l2'){
      if(m.slot!==null)tx(s,ctx,[port('MDR','externalData',['cpu','mdr'],8),port('L2','externalData',cachePort('l2',m.slot).concat(['bytes',m.pa%8]),8)],{En_MDR:true,Ld_L2:true,Write:true},m.pa);
      finishMemory(s,m);return true;
    }
    fail('INVALID_STAGE',m.stage);
  }
  function cpuTick(s,ctx){
    var m=s.cpu.control.machine;ctx.kind='cpu-'+m.phase+'-'+m.stage;
    if(m.phase==='fetch'){
      if(m.stage==='address'){
        if(s.cpu.ir.loadedBytes===0){if(s.program.starts.indexOf(s.cpu.pc)===-1)fail('INVALID_INSTRUCTION_BOUNDARY');m.instructionStart=s.cpu.pc;}
        ctx.va=s.cpu.pc;tx(s,ctx,[port('PC','internalAddress',['cpu','pc'],9),port('MAR','internalAddress',['cpu','mar'],9)],{En_PC:true,Ld_MAR:true},null);m.stage='request';
      }else if(m.stage==='request'){startMemory(s,'fetch',s.cpu.mar,false,null,'fetch-'+m.sequence+'-'+s.cpu.ir.loadedBytes);m.stage='wait';}
      else if(m.stage==='wait'){var done=memoryTick(s,ctx);if(done==='waiting')return 'waiting';if(done===true)m.stage='ir';}
      else if(m.stage==='ir'){
        tx(s,ctx,[port('MDR','internalData',['cpu','mdr'],8),port('IR','internalData',['cpu','ir','bytes',s.cpu.ir.loadedBytes],8)],{En_MDR:true,Ld_IR:true},null);s.cpu.ir.loadedBytes++;m.stage='increment';
      }else if(m.stage==='increment'){addressTo(s,ctx,s.cpu.pc+1,'PC');m.stage=s.cpu.ir.loadedBytes===4?'decode':'address';}
      else if(m.stage==='decode'){var d=cpuDecodeInstruction(s.cpu.ir.bytes);if(!d.ok)fail(d.error.code,d.error.message);s.cpu.ir.decoded=d.instruction;m.steps=cpuBuildExecutionPlan(s.cpu.ir.bytes).steps;m.execIndex=0;m.phase='execute';m.stage='operation';}
      else fail('INVALID_STAGE');return false;
    }
    var op=m.steps[m.execIndex];if(!op)fail('INVALID_STAGE');ctx.kind='cpu-'+op.operation.toLowerCase().replace(/_/g,'-');var p=op.parameters;
    switch(op.operation){
      case 'TRANSFER_TO_REGISTER':transferRegister(s,ctx,p.destination,p.source);break;
      case 'CAPTURE_ALU_A':case 'CAPTURE_ALU_B':{
        var source=p.source,sourceName,path;
        if(source.kind==='register'){sourceName=source.name;path=['cpu','registers',sourceName];}
        else {sourceName='IR';path=['cpu','ir','bytes',2];if(source.value===1&&(s.cpu.ir.decoded.mnemonic==='INC'||s.cpu.ir.decoded.mnemonic==='DEC')){sourceName='ALU';s.cpu.alu.result=1;path=['cpu','alu','result'];}}
        var target=op.operation==='CAPTURE_ALU_A'?'a':'b';
        // INC/DEC select the ALU's hardwired constant-one input, not a bus load.
        if(sourceName==='ALU'){s.cpu.alu[target]=1;}
        else tx(s,ctx,[port(sourceName,'internalData',path,8),port('ALU','internalData',['cpu','alu',target],8)],(function(){var a={Ld_ALU:true};a['En_'+sourceName]=true;return a;}()),null);
        break;}
      case 'EVALUATE_ALU':{var alu=CpuAlu.evaluate(p.mnemonic,s.cpu.alu.a,s.cpu.alu.b,s.cpu.flags);s.cpu.alu.result=alu.result;s.cpu.alu.operation=p.mnemonic;m.flags=alu.flags;break;}
      case 'COMMIT_FLAGS':s.cpu.flags=copy(m.flags);break;
      case 'PREPARE_ADDRESS':addressTo(s,ctx,p.address,'MAR');break;
      case 'REQUEST_READ':startMemory(s,'read',s.cpu.mar,s.cpu.mar>=480,s.cpu.mar>=480?(s.cpu.mar<488?'KBD':'LCD'):null,'data-'+m.sequence);break;
      case 'REQUEST_WRITE':startMemory(s,'write',s.cpu.mar,s.cpu.mar>=480,s.cpu.mar>=480?(s.cpu.mar<488?'KBD':'LCD'):null,'data-'+m.sequence);break;
      case 'REQUEST_INPUT':startMemory(s,'read',s.profile.ioMap.keyboard.va,true,'KBD','io-'+m.sequence);s.execution.pendingRequest.consume=true;break;
      case 'REQUEST_OUTPUT':startMemory(s,'write',s.profile.ioMap.lcd.va,true,'LCD','io-'+m.sequence);s.execution.pendingRequest.advanceCursor=true;break;
      case 'WAIT_READ':case 'WAIT_WRITE':case 'WAIT_INPUT':case 'WAIT_OUTPUT':{var done=memoryTick(s,ctx);if(done==='waiting')return 'waiting';if(done!==true)return false;break;}
      case 'CAPTURE_RESPONSE_IN_MDR':transferRegister(s,ctx,'MDR',{kind:'register',name:'MDR'});break;
      case 'RESOLVE_BRANCH':{
        var take=p.condition==='always'||p.condition==='ZF_SET'&&s.cpu.flags.ZF||p.condition==='ZF_CLEAR'&&!s.cpu.flags.ZF;
        if(take){if(s.program.starts.indexOf(p.address)===-1)fail('INVALID_INSTRUCTION_BOUNDARY');addressTo(s,ctx,p.address,'PC');}break;}
      case 'HALT':addressTo(s,ctx,m.instructionStart,'PC');s.execution.mode='halted';break;
      case 'ADVANCE_PC':break;
      default:fail('INVALID_MICROCODE',op.operation);
    }
    m.execIndex++;
    if(m.execIndex===m.steps.length&&s.execution.mode!=='halted'){
      s.cpu.ir={bytes:[0,0,0,0],loadedBytes:0,decoded:null};m.phase='fetch';m.stage='address';m.sequence++;delete m.steps;delete m.flags;
    }
    return false;
  }
  function step(state,request){
    try{
      var before=copy(state);check(before);
      if(!request||typeof request.requestId!=='string'||!request.requestId.length)fail('INVALID_REQUEST');
      if(before.lastEvent&&before.lastEvent.requestId===request.requestId){if(request.expectedRevision!==before.lastEvent.revisionBefore)fail('REQUEST_ID_REUSE');return {status:'completed',requestId:request.requestId,state:before,events:[],value:null,replayed:true};}
      if(request.expectedRevision!==before.revision)fail('STALE_REVISION');
      if(before.profile.status!=='ready'||before.profile.pendingIssues.length)fail('INVALID_PROFILE');
      if(before.execution.mode==='halted')fail('HALTED');
      var next=copy(before),ctx={};var waiting=cpuTick(next,ctx);
      if(waiting==='waiting')return {status:'pending',requestId:request.requestId,state:before,events:[],reason:'keyboard-empty'};
      return commit(before,next,ctx,request.requestId);
    }catch(e){return {status:'rejected',requestId:request?request.requestId:null,error:{code:e.code||'INVALID_STATE',message:e.message,details:{}}};}
  }
  function load(state,source,origin){
    var parsed=AsmParser.assemble(source,origin);if(!parsed.ok)return {status:'rejected',error:{code:'ASSEMBLY_ERROR',message:'Código inválido',details:parsed.errors}};
    if(!parsed.instructions.length)return {status:'rejected',error:{code:'EMPTY_PROGRAM',message:'Programa vacío'}};
    var next=create(state.profile),image=Array(512).fill(0);parsed.bytes.forEach(function(b,i){image[parsed.origin+i]=b;});next.swap=swapCreate(image);
    next.cpu.pc=parsed.origin;next.program={source:source,origin:parsed.origin,starts:parsed.instructions.map(function(i){return i.address;}),sourceMap:parsed.instructions.map(function(i){return {line:i.line,address:i.address,bytes:i.bytes.slice()};})};
    var ctx={kind:'program-load'};return commit(state,next,ctx,'load-'+state.revision);
  }
  function type(state,text){
    try{check(state);if(typeof text!=='string'||!text.length||text.length+state.io.keyboard.count>8)fail('KBD_FULL');
      for(var i=0;i<text.length;i++)if(text.charCodeAt(i)<32||text.charCodeAt(i)>126)fail('INVALID_CHARACTER');
      var current=copy(state),events=[];
      for(var j=0;j<text.length;j++){
        var before=copy(current),ctx={kind:'keyboard-input'};current.io.keyboard.inputValue=text.charCodeAt(j);var k=current.io.keyboard,pa=k.basePa+k.tail;
        tx(current,ctx,[port('KBD','externalData',['io','keyboard','inputValue'],8),port('RAM','externalData',['ram','bytes',pa],8)],{En_KBD:true,Ld_RAM:true,Write:true,IO:true},pa);
        k.tail=(k.tail+1)%8;k.count++;delete k.inputValue;var result=commit(before,current,ctx,'kbd-'+before.revision);current=result.state;events.push(result.events[0]);
      }
      return {status:'completed',state:current,events:events,value:null};
    }catch(e){return {status:'rejected',error:{code:e.code||'INVALID_STATE',message:e.message}};}
  }
  function run(state,limit){var current=copy(state),events=[],r;if(!Number.isInteger(limit)||limit<1||limit>50000)fail('INVALID_BATCH');
    for(var i=0;i<limit;i++){r=step(current,{requestId:'step-'+current.revision,expectedRevision:current.revision});if(r.status==='rejected')return r;current=r.state;events=events.concat(r.events);if(r.status==='pending'||current.execution.mode==='halted')break;}
    return {status:r.status,state:current,events:events,value:null};}
  function editPage(state,vpn,patch){
    try{check(state);if(state.execution.pendingRequest||state.execution.mode==='running')fail('BUSY');
      if(!Number.isInteger(vpn)||vpn<0||vpn>15||!patch||Object.keys(patch).some(function(k){return k!=='referenced'&&k!=='dirty';}))fail('INVALID_OPERAND');
      var page=state.mmu.pages[vpn];if(!page.present||page.pinned)fail('IO_PROTECTED');
      if(patch.referenced!==undefined&&typeof patch.referenced!=='boolean'||patch.dirty!==undefined&&patch.dirty!==true)fail('INVALID_OPERAND','Dirty solo puede marcarse; limpiarlo requiere guardar en Swap.');
      var next=copy(state);Object.keys(patch).forEach(function(k){next.mmu.pages[vpn][k]=patch[k];});
      return commit(state,next,{kind:'page-table-edit'},'edit-'+state.revision);
    }catch(e){return {status:'rejected',error:{code:e.code||'INVALID_STATE',message:e.message}};}
  }
  return {profile:profile,create:create,check:check,step:step,load:load,type:type,run:run,editPage:editPage,signals:SIGNALS.slice()};
}());
