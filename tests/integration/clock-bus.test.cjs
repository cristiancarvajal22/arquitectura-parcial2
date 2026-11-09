const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const copy = value => JSON.parse(JSON.stringify(value));
const ctx = vm.createContext({});
for (const path of ['.test-deps/arbiter.js', '.test-deps/bus-step.js',
  '.test-deps/microword.js', 'src/core/clock.js', 'src/core/clock-store.js']) {
  vm.runInContext(fs.readFileSync(path, 'utf8'), ctx);
}
const scenarioContext = vm.createContext({module: {exports: {}},
  require: () => ctx.BusArbiter});
vm.runInContext(fs.readFileSync('.test-deps/bus-scenario.cjs', 'utf8'), scenarioContext);
function reset() {
  const state = JSON.parse(fs.readFileSync('.test-deps/bus-reset.json', 'utf8'));
  // Test configuration only; does not approve or change the production profile.
  state.profile.status = 'ready'; state.profile.pendingIssues = [];
  for (const name of ['internalControl', 'externalControl']) {
    state.profile.widths[name] = 16; state.buses[name].widthBits = 16;
  }
  state.cpu.pc = 300; state.execution.mode = 'idle';
  return state;
}
function harness() {
  let held = false, calls = 0;
  const properties = {}, wiring = copy(scenarioContext.module.exports.scenario().wiring);
  const props = {getProperty: k => properties[k] ?? null,
    setProperty: (k,v) => {properties[k] = v;},
    setProperties: values => Object.assign(properties, values)};
  const store = ctx.clockPropertyStore(props);
  const lock = {tryLock: () => {if (held) return false; held = true; return true;},
    releaseLock: () => {held = false;}};
  const signals = {En_PC: true, Ld_MAR: true};
  const motor = (state, request) => {
    calls++;
    return ctx.BusMicroStep.execute(ctx.clockClone(state), ctx.clockClone(wiring),
      ctx.clockClone({...request, phase: 'fetch-address', va: state.cpu.pc, signals}));
  };
  const open = () => ctx.clockController(store, lock, motor, reset);
  const c = open(); c.initialize();
  const request = (action,limit) => {
    const record = c.read();
    return {epoch:record.epoch, sequence:record.sequence+1,
      expectedRevision:record.state.revision, action, limit};
  };
  return {c,open,request,signals,props,properties,calls:()=>calls,
    send:(action,limit)=>c.dispatch(request(action,limit))};
}
test('Step commits actual bus transfer and micro-word projection', () => {
  const h = harness(), out = h.send('step');
  assert.equal(out.state.cpu.mar,300); assert.equal(out.state.clock.cycle,1);
  assert.equal(out.state.metrics.committedMicroSteps,1);
  assert.equal(out.events.length,2); // Mode transition followed by transfer.
  const event = out.events.find(e => e.kind === 'bus-transfer');
  const view = ctx.microWordView(event);
  assert.equal(view.rows.find(r=>r[1]==='En_PC')[4],'DRIVING');
  assert.equal(view.rows.find(r=>r[1]==='Ld_MAR')[4],'CAPTURE');
  assert.equal(view.rows.find(r=>r[1]==='En_AX')[4],'High-Z');
  assert.deepEqual(copy(h.c.read().state.lastEvent),copy(event));
});
test('reopening controller and retrying do not transfer twice', () => {
  const h = harness(), request = h.request('step'), first = h.c.dispatch(request);
  const second = h.open().dispatch(request);
  assert.deepEqual(copy(second),copy(first)); assert.equal(h.calls(),1);
});
test('Run eight, pause and Step preserve exact clock and event order', () => {
  const h = harness(), run = h.send('run',8);
  assert.equal(run.state.clock.cycle,8);
  assert.deepEqual(copy(run.events.map(e=>e.id)),[1,2,3,4,5,6,7,8,9]);
  const pause = h.send('pause');
  assert.equal(pause.state.clock.cycle,8); assert.equal(pause.events[0].kind,'execution-control');
  const step = h.send('step');
  assert.equal(step.state.clock.cycle,9); assert.equal(step.state.lastEvent.id,11);
});
test('actual bus contention rolls back mode, counters and persisted record', () => {
  const h = harness(), before = copy(h.c.read()); h.signals.En_MAR = true;
  assert.throws(()=>h.send('step'),/BUS_CONTENTION/);
  assert.deepEqual(copy(h.c.read()),before);
  h.signals.En_MAR = false; assert.equal(h.send('step').state.cpu.mar,300);
});
test('reset after real transfers preserves deterministic state and rejects old session', () => {
  const h = harness(); h.send('run',3); const stale = h.request('run',1);
  const out = h.send('reset');
  assert.deepEqual(copy(out.state),reset()); assert.equal(out.epoch,2);
  assert.throws(()=>h.c.dispatch(stale),/STALE_SESSION/);
});
test('publication failure retains old record despite computed bus events', () => {
  const h = harness(), before = copy(h.c.read()), save = h.props.setProperty;
  h.props.setProperty = () => {throw Error('STORE_FAILURE');};
  assert.throws(()=>h.send('step'),/STORE_FAILURE/);
  assert.deepEqual(copy(h.c.read()),before);
  h.props.setProperty = save; assert.equal(h.send('step').state.clock.cycle,1);
});
