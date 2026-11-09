'use strict';

// Coordinates an internal register transfer. Memory/I/O transactions need
// their own coordinator so they cannot bypass MMU, cache or peripheral effects.
var BusMicroStep = (function () {
  function reject(code, message) { return { status: 'rejected', error: { code: code, message: message, details: {} } }; }
  function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
  function counter(value) { return Number.isSafeInteger(value) && value >= 0 && value < Number.MAX_SAFE_INTEGER; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  function changes(before, after, prefix, output) {
    Object.keys(after).forEach(function (key) {
      if (!prefix && key === 'lastEvent') return;
      var path = prefix ? prefix + '.' + key : key;
      if (same(before[key], after[key])) return;
      if (object(before[key]) && object(after[key])) changes(before[key], after[key], path, output);
      else output.push({ path: path, before: before[key], after: after[key] });
    });
  }

  function cpuPath(path) {
    if (!Array.isArray(path) || path[0] !== 'cpu') return false;
    if (path.length === 2) return ['pc', 'mar', 'mdr'].indexOf(path[1]) !== -1;
    if (path.length === 3 && path[1] === 'registers') return ['AX', 'BX', 'CX', 'DX'].indexOf(path[2]) !== -1;
    if (path.length === 3 && path[1] === 'alu') return ['a', 'b', 'result'].indexOf(path[2]) !== -1;
    return path.length === 4 && path[1] === 'ir' && path[2] === 'bytes'
      && Number.isInteger(path[3]) && path[3] >= 0 && path[3] < 4;
  }

  function execute(state, wiring, request) {
    if (!object(state) || state.schemaVersion !== 1 || !object(state.cpu)
      || !object(state.cpu.control) || !object(state.cpu.control.signals)
      || !object(state.clock) || !object(state.metrics) || !object(state.execution)
      || !counter(state.revision) || !counter(state.clock.cycle) || !counter(state.clock.microStep)
      || !counter(state.metrics.committedMicroSteps)) {
      return reject('INVALID_STATE', 'A complete version-1 snapshot with valid counters is required.');
    }
    if (!object(state.profile) || state.profile.status !== 'ready'
      || !Array.isArray(state.profile.pendingIssues) || state.profile.pendingIssues.length !== 0) {
      return reject('INVALID_PROFILE', 'A proposal or a profile with pending decisions cannot execute.');
    }
    if (state.execution.mode === 'halted') return reject('HALTED', 'HALT preserves the architectural state.');
    if (['idle', 'paused', 'running'].indexOf(state.execution.mode) === -1) return reject('INVALID_STATE', 'Execution mode cannot step.');
    if (state.execution.pendingRequest !== null) return reject('BUSY', 'A pending transaction must finish before a new register step.');
    if (!object(request) || typeof request.requestId !== 'string' || !request.requestId.trim()
      || typeof request.phase !== 'string' || !/^[a-z][a-z0-9-]*$/.test(request.phase)
      || !object(request.signals) || !counter(request.expectedRevision)
      || !(request.va === null || (Number.isInteger(request.va) && request.va >= 0 && request.va <= 511))) {
      return reject('INVALID_REQUEST', 'Request ID, phase, expected revision, signals and VA/null are required.');
    }
    if (!object(wiring) || !object(wiring.segments) || !Array.isArray(wiring.ports)) {
      return reject('INVALID_WIRING', 'Explicit segments and ports are required.');
    }
    var keys = Object.keys(request.signals);
    if (keys.some(function (key) { return !/^(En|Ld)_[A-Za-z][A-Za-z0-9_]*$/.test(key)
      || typeof request.signals[key] !== 'boolean'; })) {
      return reject('INVALID_SIGNALS', 'Register steps accept boolean Enable/Load signals only.');
    }
    var signals = {};
    Object.keys(state.cpu.control.signals).forEach(function (key) { signals[key] = false; });
    if (!Object.prototype.hasOwnProperty.call(signals, 'Clock')
      || keys.some(function (key) { return !Object.prototype.hasOwnProperty.call(signals, key); })) {
      return reject('INVALID_SIGNALS', 'Signals must exist in the shared control vector.');
    }
    keys.forEach(function (key) { signals[key] = request.signals[key]; });
    signals.Clock = true;

    var last = state.lastEvent;
    if (last !== null && (!object(last) || !counter(last.id) || last.revisionAfter !== state.revision)) {
      return reject('INVALID_STATE', 'Last event and snapshot revision must agree.');
    }
    if (last && last.requestId === request.requestId) {
      // Retry only the most recent receipt, against the revision it originally consumed.
      if (last.kind !== 'bus-transfer' || last.revisionBefore !== request.expectedRevision
        || last.phase !== request.phase || last.va !== request.va || !same(last.signals, signals)) {
        return reject('REQUEST_ID_REUSE', 'The same request ID cannot describe different work.');
      }
      return { status: 'completed', requestId: request.requestId,
        state: clone(state), events: [clone(last)], value: null, replayed: true };
    }
    if (request.expectedRevision !== state.revision) return reject('STALE_REVISION', 'The observed state is outdated.');
    if (wiring.ports.some(function (port) {
      return !object(port) || ((request.signals['En_' + port.name] || request.signals['Ld_' + port.name])
        && (!cpuPath(port.path) || ['internalAddress', 'internalData'].indexOf(port.segment) === -1));
    })) return reject('UNSUPPORTED_TRANSACTION', 'This coordinator only transfers internal CPU values.');
    var irLoads = wiring.ports.filter(function (port) {
      return request.signals['Ld_' + port.name] && port.path[0] === 'cpu' && port.path[1] === 'ir';
    });
    if (irLoads.length && (!object(state.cpu.ir) || !Array.isArray(state.cpu.ir.bytes)
      || state.cpu.ir.bytes.length !== 4 || !Number.isInteger(state.cpu.ir.loadedBytes)
      || state.cpu.ir.loadedBytes < 0 || state.cpu.ir.loadedBytes >= 4
      || irLoads.length !== 1 || irLoads[0].path[3] !== state.cpu.ir.loadedBytes)) {
      return reject('INVALID_IR_LOAD', 'IR receives one byte at the next position, up to four bytes.');
    }

    var engine = typeof module !== 'undefined' && module.exports ? require('../buses/arbiter.js') : BusArbiter;
    var result = engine.transfer(state, wiring, request.signals, request.expectedRevision);
    if (result.status === 'rejected') return result;
    var next = result.state;
    next.clock = { cycle: state.clock.cycle + 1, microStep: state.clock.microStep + 1, phase: request.phase };
    next.cpu.control.phase = request.phase;
    next.cpu.control.microStep = next.clock.microStep;
    next.cpu.control.signals = signals;
    next.cpu.control.word = null; // Numeric encoding remains owned by contract #3.
    if (irLoads.length) {
      next.cpu.ir.loadedBytes += 1;
      next.cpu.ir.decoded = null;
    }
    next.metrics.committedMicroSteps += 1;
    var delta = [];
    changes(state, next, '', delta);
    var event = { schemaVersion: 1, id: last ? last.id + 1 : 1,
      requestId: request.requestId, revisionBefore: state.revision, revisionAfter: next.revision,
      cycle: next.clock.cycle, microStep: next.clock.microStep, phase: request.phase,
      kind: 'bus-transfer', signals: clone(signals), controlWord: null,
      segments: Object.keys(next.buses).map(function (name) {
        var bus = next.buses[name];
        return { name: name, widthBits: bus.widthBits, level: bus.level, value: bus.value,
          driver: bus.drivers.length ? bus.drivers[0] : null, receivers: bus.receivers.slice() };
      }), va: request.va, pa: null, bytes: [], changes: delta, result: 'committed' };
    next.lastEvent = clone(event);
    return { status: 'completed', requestId: request.requestId, state: next,
      events: [event], value: null, replayed: false };
  }

  return { execute: execute };
}());

if (typeof module !== 'undefined' && module.exports) module.exports = BusMicroStep;
