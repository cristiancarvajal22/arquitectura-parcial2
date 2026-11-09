/** Stages for the page-fault coordinator. Dependencies are the team's modules. */
function PageCoherence(deps) {
  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function check(s) {
    var v=deps.validateSnapshot(s);
    if (!v.ok) throw new Error(v.error.code+': '+v.error.message);
    if (!Number.isSafeInteger(s.revision) || s.revision<0) throw new Error('INVALID_REVISION');
    deps.swapValidate(s.swap);
  }
  function fifoState(s) { return {revision:s.revision,queue:copy(s.mmu.fifo),frames:copy(s.ram.frames)}; }
  /** Call only on the candidate of a successful memory/cache access. */
  function markAccess(state, request) {
    check(state);
    var result=deps.resolveAccess(state,request);
    if (!result.ok) throw new Error(result.error.code);
    if (result.status==='pageFault') return {status:'pending',state:copy(state),vpn:result.vpn};
    var next=copy(state);
    if (result.access.cacheable) {
      next.mmu.pages[result.vpn].referenced=true;
      if (request.kind==='write') next.mmu.pages[result.vpn].dirty=true;
    }
    return {status:'completed',state:next,pa:result.pa,cacheable:result.access.cacheable};
  }
  /** Save Dirty victim and invalidate all old physical copies BEFORE reuse. */
  function prepare(state, vpn) {
    check(state);
    var selection=deps.fifo.select(fifoState(state),vpn);
    if (selection.reason==='hit') return {status:'resident',state:copy(state),decision:selection};
    var next=copy(state),trace=[];
    if (selection.victim!==null && next.mmu.pages[selection.victim].dirty) {
      next=deps.saveFrame(next,selection.victim,selection.pfn);
      trace.push({kind:'swap-save',vpn:selection.victim,pfn:selection.pfn,bytes:32});
    }
    var invalidation=deps.invalidate(next.caches,selection.pfn*32,32);
    if (invalidation.status!=='completed') throw new Error('CACHE_WRITEBACK_REQUIRED');
    next.caches=invalidation.caches;
    // Cancel an outstanding L2 fill even when no resident line matched this frame.
    if(next.caches.l2.generation!==undefined){
      if(!Number.isSafeInteger(next.caches.l2.generation)||next.caches.l2.generation<0||next.caches.l2.generation>=Number.MAX_SAFE_INTEGER-1)throw new Error('INVALID_GENERATION');
      next.caches.l2.generation++;
    }
    trace.push({kind:'invalidate-frame',pfn:selection.pfn,lines:invalidation.invalidated});
    return {status:'prepared',decision:selection,baseline:copy(state),state:next,
      bytes:deps.readPage(next.swap,vpn),trace:trace};
  }
  /** supplied bytes must be the 32-byte result of the coordinator's completed load. */
  function finish(current, prepared, loadedBytes) {
    check(current);
    if (!prepared || prepared.status!=='prepared' || JSON.stringify(current)!==JSON.stringify(prepared.baseline)) throw new Error('STALE_REPLACEMENT');
    // Recompute instead of trusting a caller-modified candidate or victim decision.
    var plan=prepare(current,prepared.decision.vpn);
    if (JSON.stringify(plan)!==JSON.stringify(prepared)) throw new Error('ALTERED_REPLACEMENT');
    if (!Array.isArray(loadedBytes) || loadedBytes.length!==32 || loadedBytes.some(function(b,i){return !Number.isInteger(b)||b!==plan.bytes[i];})) throw new Error('INCOMPLETE_TRANSFER');
    // Explicit loop also rejects sparse arrays, for which Array.some skips holes.
    for(var i=0;i<32;i++) if(loadedBytes[i]!==plan.bytes[i]) throw new Error('INCOMPLETE_TRANSFER');
    var next=copy(plan.state),d=plan.decision;
    for(var j=0;j<32;j++) next.ram.bytes[d.pfn*32+j]=loadedBytes[j];
    var committed=deps.fifo.commit(fifoState(current),d);
    next.ram.frames=committed.frames;next.mmu.fifo=committed.queue;
    if(d.victim!==null) next.mmu.pages[d.victim]={vpn:d.victim,present:false,pfn:null,dirty:false,referenced:false,pinned:false};
    next.mmu.pages[d.vpn]={vpn:d.vpn,present:true,pfn:d.pfn,dirty:false,referenced:false,pinned:false};
    next.mmu.fault=null;
    check(next);
    return {status:'completed',state:next,trace:plan.trace.concat([{kind:'page-installed',vpn:d.vpn,pfn:d.pfn,bytes:32}])};
  }
  return {markAccess:markAccess,prepare:prepare,finish:finish};
}
