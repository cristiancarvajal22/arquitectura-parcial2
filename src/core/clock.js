/** P2-006. Inject pure motor/reset functions; persist only confirmed batches. */
function clockClone(value) { return JSON.parse(JSON.stringify(value)); }
function clockCheck(state) {
  if (!state || state.schemaVersion !== 1 || !state.profile || !state.execution || !state.clock ||
      !state.cpu || !state.cpu.control || !state.cpu.control.signals ||
      !Number.isSafeInteger(state.revision) || state.revision < 0 ||
      !Number.isSafeInteger(state.clock.cycle) || state.clock.cycle < 0 ||
      !Number.isSafeInteger(state.clock.microStep) || state.clock.microStep < 0) throw new Error('INVALID_STATE');
}
function clockController(store, lock, motor, resetter) {
  function locked(fn) {
    if (!lock.tryLock(0)) throw new Error('BUSY');
    try { return fn(); } finally { lock.releaseLock(); }
  }
  function initialize() {
    return locked(function () {
      var existing = store.load();
      if (existing) return clockClone(existing);
      var state = resetter(); clockCheck(state);
      var record = {epoch: 1, sequence: 0, state: state, receipt: null};
      store.save(record); return clockClone(record);
    });
  }
  function dispatch(request) {
    return locked(function () {
      var record = store.load();
      if (!record) throw new Error('NOT_INITIALIZED');
      if (!request || !Number.isSafeInteger(request.sequence) || request.sequence < 1 ||
          !Number.isSafeInteger(request.expectedRevision) || request.expectedRevision < 0 ||
          ['step','run','pause','reset'].indexOf(request.action) === -1) throw new Error('INVALID_REQUEST');
      var limit = request.action === 'run' ? request.limit : 1;
      if (!Number.isInteger(limit) || limit < 1 || limit > 8) throw new Error('INVALID_BATCH');
      var key = JSON.stringify([request.epoch, request.sequence, request.expectedRevision, request.action, limit]);
      if (record.receipt && record.receipt.key === key) return clockClone(record.receipt.result);
      if (request.epoch !== record.epoch) throw new Error('STALE_SESSION');
      if (request.sequence !== record.sequence + 1) throw new Error('STALE_REQUEST');
      if (request.expectedRevision !== record.state.revision) throw new Error('STALE_REVISION');
      var next = clockClone(record.state), events = [], status = 'completed';
      clockCheck(next);
      function mode(value) {
        if (next.execution.mode === value) return;
        var before = next.execution.mode, rev = next.revision;
        next.execution.mode = value; next.revision++;
        var event = {schemaVersion:1, id: next.lastEvent ? next.lastEvent.id + 1 : 1,
          requestId: record.epoch + ':' + request.sequence + ':mode', kind:'execution-control',
          revisionBefore:rev, revisionAfter:next.revision, cycle:next.clock.cycle,
          microStep:next.clock.microStep, phase:next.clock.phase,
          signals:clockClone(next.cpu.control.signals), controlWord:next.cpu.control.word,
          segments:[], va:null, pa:null, bytes:[], result:'committed',
          changes:[{path:'execution.mode',before:before,after:value},{path:'revision',before:rev,after:next.revision}]};
        next.lastEvent=event; events.push(clockClone(event));
      }
      if (request.action === 'reset') {
        next = resetter(); clockCheck(next);
        if (next.revision !== 0 || next.execution.pendingRequest !== null) throw new Error('INVALID_RESET');
        record.epoch++; record.sequence=0;
      } else {
        if (request.action === 'pause') {
          if (['halted','error'].indexOf(next.execution.mode) !== -1) throw new Error('RESET_REQUIRED');
          mode('paused');
        }
        else {
          if (next.profile.status !== 'ready' || !Array.isArray(next.profile.pendingIssues) || next.profile.pendingIssues.length) throw new Error('INVALID_PROFILE');
          if (next.execution.mode === 'halted') throw new Error('HALTED');
          if (['idle','paused','running'].indexOf(next.execution.mode) === -1) throw new Error('RESET_REQUIRED');
          if (request.action === 'step' && next.execution.mode === 'running') throw new Error('PAUSE_FIRST');
          mode(request.action === 'run' ? 'running' : 'paused');
          for (var i=0; i<limit; i++) {
            var result = motor(clockClone(next), {requestId:record.epoch+':'+request.sequence+':'+i,
              expectedRevision:next.revision});
            if (!result || result.status === 'rejected') throw new Error(result && result.error ? result.error.code : 'INVALID_MOTOR');
            if (['completed','pending'].indexOf(result.status) === -1 || !Array.isArray(result.events)) throw new Error('INVALID_MOTOR');
            clockCheck(result.state);
            if (result.state.revision < next.revision || result.state.revision > next.revision + 1 ||
                (result.status === 'completed' && result.state.revision !== next.revision+1)) throw new Error('INVALID_MOTOR_REVISION');
            if (result.state.revision === next.revision && JSON.stringify(result.state) !== JSON.stringify(next)) throw new Error('UNVERSIONED_CHANGE');
            next = clockClone(result.state); events = events.concat(clockClone(result.events));
            status = result.status;
            if (status === 'pending' || next.execution.mode === 'halted') break;
          }
        }
        record.sequence = request.sequence;
      }
      var output = {status:status, epoch:record.epoch, sequence:record.sequence, state:next, events:events};
      record.state=next; record.receipt={key:key,result:output};
      store.save(record); // The UI receives no events before durable publication succeeds.
      return clockClone(output);
    });
  }
  return {initialize:initialize, dispatch:dispatch, read:function () { return locked(function () { return clockClone(store.load()); }); }};
}
