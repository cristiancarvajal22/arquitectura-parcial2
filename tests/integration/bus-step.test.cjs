'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execute } = require('../../src/core/bus-step.js');
const { scenario } = require('../../examples/buses/pc-to-mar.cjs');

function fixture() {
  const state = JSON.parse(fs.readFileSync(path.join(__dirname,
    '../../docs/examples/core/reset.snapshot.json'), 'utf8'));
  // Synthetic test configuration, NOT evidence of team approval or a deployed profile.
  state.profile.status = 'ready';
  state.profile.pendingIssues = [];
  for (const segment of ['internalControl', 'externalControl']) {
    state.profile.widths[segment] = 16;
    state.buses[segment].widthBits = 16;
  }
  state.cpu.pc = 300;
  state.execution.mode = 'paused';
  return { state, wiring: scenario().wiring, request: { requestId: 'test-step-1',
    expectedRevision: 0, phase: 'fetch-address', va: 300, signals: { En_PC: true, Ld_MAR: true } } };
}

function rejected(f, code) {
  const saved = JSON.stringify(f);
  const result = execute(f.state, f.wiring, f.request);
  assert.equal(result.status, 'rejected');
  assert.equal(result.error.code, code);
  assert.equal('state' in result, false);
  assert.equal('events' in result, false);
  assert.equal(JSON.stringify(f), saved);
}

test('register, clock, control, metrics and global event commit together', () => {
  const f = fixture();
  f.state.cpu.control.signals.En_AX = true; // Previous step's signal must turn off.
  const original = structuredClone(f.state);
  const result = execute(f.state, f.wiring, f.request);
  assert.equal(result.status, 'completed');
  assert.equal(result.state.cpu.mar, 300);
  assert.equal(result.state.revision, 1);
  assert.deepEqual(result.state.clock, { cycle: 1, microStep: 1, phase: 'fetch-address' });
  assert.equal(result.state.cpu.control.microStep, 1);
  assert.equal(result.state.cpu.control.signals.En_AX, false);
  assert.equal(result.state.cpu.control.signals.Clock, true);
  assert.equal(result.state.metrics.committedMicroSteps, 1);
  assert.equal(result.events[0].id, 1);
  assert.equal(result.events[0].va, 300);
  assert.equal(result.events[0].pa, null);
  assert.deepEqual(result.events[0].bytes, []);
  assert.equal(result.events[0].segments.length, 6);
  assert.deepEqual(result.state.lastEvent, result.events[0]);
  assert.deepEqual(result.state.cpu.control.signals, result.events[0].signals);
  assert.deepEqual(f.state, original);
  assert.deepEqual(result.state.ram, original.ram);
  assert.deepEqual(result.state.caches, original.caches);
});

test('global event deltas exactly reconstruct the new snapshot', () => {
  const f = fixture();
  const result = execute(f.state, f.wiring, f.request);
  const replay = structuredClone(f.state);
  for (const change of result.events[0].changes) {
    const parts = change.path.split('.');
    const target = parts.slice(0, -1).reduce((value, key) => value[key], replay);
    assert.deepEqual(target[parts.at(-1)], change.before);
    target[parts.at(-1)] = structuredClone(change.after);
  }
  replay.lastEvent = result.events[0];
  assert.deepEqual(replay, result.state);
  result.events[0].signals.En_PC = false;
  assert.equal(result.state.lastEvent.signals.En_PC, true);
});

test('contention rejects clock and metrics as well as all captures', () => {
  const f = fixture(); f.request.signals.En_MAR = true;
  rejected(f, 'BUS_CONTENTION');
});
test('destination overflow does not advance the clock', () => {
  const f = fixture(); f.wiring.ports.find(p => p.name === 'MAR').widthBits = 8;
  rejected(f, 'OUT_OF_RANGE');
});
test('Load without a driver rejects the global step', () => {
  const f = fixture(); f.request.signals.En_PC = false;
  rejected(f, 'NO_BUS_DRIVER');
});
test('old revisions cannot commit another global event', () => {
  const f = fixture(); f.request.expectedRevision = 1;
  rejected(f, 'STALE_REVISION');
});
test('retrying the same request returns its receipt without advancing counters twice', () => {
  const f = fixture();
  const first = execute(f.state, f.wiring, f.request);
  const retry = execute(first.state, f.wiring, f.request);
  assert.equal(retry.status, 'completed');
  assert.equal(retry.replayed, true);
  assert.deepEqual(retry.state, first.state);
  assert.deepEqual(retry.events, first.events);
  retry.state.cpu.mar = 9;
  assert.equal(first.state.cpu.mar, 300);
});
test('a repeated ID with different work is rejected', () => {
  const f = fixture(); f.state = execute(f.state, f.wiring, f.request).state;
  f.request.signals.Ld_MAR = false;
  rejected(f, 'REQUEST_ID_REUSE');
});
test('successive requests produce increasing event IDs and clocks', () => {
  const f = fixture(); f.state = execute(f.state, f.wiring, f.request).state;
  const request = { ...f.request, requestId: 'test-step-2', expectedRevision: 1,
    phase: 'register-transfer', va: null, signals: { En_MAR: true, Ld_PC: true } };
  const next = execute(f.state, f.wiring, request);
  assert.equal(next.status, 'completed');
  assert.equal(next.events[0].id, 2);
  assert.equal(next.state.clock.cycle, 2);
  assert.equal(next.state.cpu.pc, 300);
});
test('HALT leaves the architectural state unchanged', () => {
  const f = fixture(); f.state.execution.mode = 'halted'; rejected(f, 'HALTED');
});
test('proposal profiles cannot execute', () => {
  const f = fixture(); f.state.profile.status = 'proposal'; rejected(f, 'INVALID_PROFILE');
});
test('pending decisions cannot be hidden by the ready label', () => {
  const f = fixture(); f.state.profile.pendingIssues = [3]; rejected(f, 'INVALID_PROFILE');
});
test('memory and peripheral captures cannot bypass their coordinators', () => {
  const f = fixture(); f.request.signals = { En_AX: true, Ld_LCD: true };
  rejected(f, 'UNSUPPORTED_TRANSACTION');
});
test('Read/Write control signals are outside register-step scope', () => {
  const f = fixture(); f.request.signals.Read = true; rejected(f, 'INVALID_SIGNALS');
});
test('pending memory transactions cannot interleave with register steps', () => {
  const f = fixture(); f.state.execution.pendingRequest = { requestId: 'pending-memory' };
  rejected(f, 'BUSY');
});
test('counter overflow is rejected before touching any state', () => {
  const f = fixture(); f.state.clock.cycle = Number.MAX_SAFE_INTEGER;
  rejected(f, 'INVALID_STATE');
});
test('snapshot and last event must agree on the revision', () => {
  const f = fixture(); f.state.lastEvent = { id: 1, revisionAfter: 3 };
  rejected(f, 'INVALID_STATE');
});
test('IR captures exactly four ordered bytes and tracks progress', () => {
  const f = fixture();
  for (const [index, value] of [0x21, 0, 0x2c, 1].entries()) {
    f.state.cpu.mdr = value; // Injected memory output, not a memory subsystem test.
    f.wiring.ports.find(p => p.name === 'IR').path[3] = index;
    f.request = { requestId: `test-ir-${index}`, expectedRevision: index,
      phase: 'fetch-byte', va: index, signals: { En_MDR: true, Ld_IR: true } };
    const result = execute(f.state, f.wiring, f.request);
    assert.equal(result.status, 'completed');
    f.state = result.state;
    assert.equal(f.state.cpu.ir.loadedBytes, index + 1);
  }
  assert.deepEqual(f.state.cpu.ir.bytes, [0x21, 0, 0x2c, 1]);
  assert.equal(f.state.cpu.ir.decoded, null);
  f.request.requestId = 'test-fifth-byte'; f.request.expectedRevision = 4;
  rejected(f, 'INVALID_IR_LOAD');
});
test('IR cannot skip a position', () => {
  const f = fixture();
  f.wiring.ports.find(p => p.name === 'IR').path[3] = 1;
  f.request.signals = { En_MDR: true, Ld_IR: true };
  rejected(f, 'INVALID_IR_LOAD');
});
test('both modules load as globals without CommonJS', () => {
  const context = vm.createContext({});
  for (const file of ['../../src/buses/arbiter.js', '../../src/core/bus-step.js'])
    vm.runInContext(fs.readFileSync(require.resolve(file), 'utf8'), context);
  const f = fixture();
  const result = vm.runInContext(`BusMicroStep.execute(${JSON.stringify(f.state)},
    ${JSON.stringify(f.wiring)},${JSON.stringify(f.request)})`, context);
  assert.equal(result.status, 'completed');
  assert.equal(result.state.cpu.mar, 300);
  assert.equal(result.events[0].cycle, 1);
});
