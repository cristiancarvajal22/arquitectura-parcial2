'use strict';

// Pure bus transaction kernel. Apps Script can use the global BusArbiter;
// Node uses the guarded export below. No spreadsheet or network side effects.
var BusArbiter = (function () {
  var blockedKeys = ['__proto__', 'prototype', 'constructor'];

  function fail(code, message, details) {
    var error = new Error(message);
    error.busCode = code;
    error.details = details || {};
    throw error;
  }

  function record(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  }

  function name(value) {
    return typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_]*$/.test(value)
      && blockedKeys.indexOf(value) === -1;
  }

  function width(value) {
    if (!Number.isInteger(value) || value < 1 || value > 32) {
      fail('INVALID_WIRING', 'A bus or port width must be an integer from 1 to 32.', { widthBits: value });
    }
  }

  function unsigned(value, bits, details) {
    if (!Number.isInteger(value) || value < 0 || value >= Math.pow(2, bits)) {
      fail('OUT_OF_RANGE', 'Value does not fit the unsigned width.', details);
    }
  }

  // Explicit JSON copying rejects unsupported data instead of silently losing it.
  function copy(value, ancestors) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (!Array.isArray(value) && !record(value)) fail('INVALID_STATE', 'State must contain only JSON data.');
    if (ancestors.indexOf(value) !== -1) fail('INVALID_STATE', 'Circular state is not supported.');
    var chain = ancestors.concat([value]);
    if (Array.isArray(value)) {
      var array = [];
      for (var i = 0; i < value.length; i++) {
        if (!Object.prototype.hasOwnProperty.call(value, i)) fail('INVALID_STATE', 'Sparse arrays are not supported.');
        array.push(copy(value[i], chain));
      }
      return array;
    }
    var result = {};
    Object.keys(value).forEach(function (key) {
      if (blockedKeys.indexOf(key) !== -1) fail('INVALID_STATE', 'Unsafe state key.', { key: key });
      result[key] = copy(value[key], chain);
    });
    return result;
  }

  function readPath(state, path) {
    if (!Array.isArray(path) || path.length === 0
      || path[0] === 'buses' || path[0] === 'revision') {
      fail('INVALID_WIRING', 'Port paths must refer to existing data, not bus metadata.');
    }
    var value = state;
    path.forEach(function (key) {
      if (Array.isArray(value) && (!Number.isInteger(key) || key < 0 || key >= value.length)) {
        fail('INVALID_WIRING', 'An array port must address an existing element, not array metadata.', { path: path });
      }
      if (!(name(key) || (Number.isInteger(key) && key >= 0))
        || value === null || typeof value !== 'object'
        || !Object.prototype.hasOwnProperty.call(value, key)) {
        fail('INVALID_WIRING', 'Port path does not exist.', { path: path });
      }
      value = value[key];
    });
    return value;
  }

  /**
   * transfer(state, wiring, signals, expectedRevision)
   * wiring.segments: {name: {widthBits, domain}}
   * wiring.ports: [{name, segment, path: [...], widthBits}]
   * signals: optional En_NAME / Ld_NAME boolean keys; omitted means false.
   * Returns completed {state, event}, or rejected {error}; inputs never mutate.
   */
  function transfer(state, wiring, signals, expectedRevision) {
    try {
      if (!record(state) || !Number.isSafeInteger(state.revision) || state.revision < 0
        || state.revision === Number.MAX_SAFE_INTEGER || !record(state.buses)) {
        fail('INVALID_STATE', 'Expected JSON state with buses and a nonnegative revision.');
      }
      if (expectedRevision !== state.revision) fail('STALE_REVISION', 'The observed state is outdated.');
      if (!record(wiring) || !record(wiring.segments) || !Array.isArray(wiring.ports)
        || !record(signals) || Object.keys(wiring.segments).length === 0) {
        fail('INVALID_WIRING', 'Segments, ports and signals are required.');
      }
      var original = copy(state, []);
      var buses = {};
      Object.keys(wiring.segments).forEach(function (segment) {
        var spec = wiring.segments[segment];
        if (!name(segment) || !record(spec)
          || ['virtual', 'physical', 'data', 'control'].indexOf(spec.domain) === -1) {
          fail('INVALID_WIRING', 'Invalid segment descriptor.', { segment: segment });
        }
        width(spec.widthBits);
        buses[segment] = { widthBits: spec.widthBits, domain: spec.domain,
          level: 'Z', value: null, drivers: [], receivers: [] };
      });
      var portNames = new Set();
      var allowedSignals = new Set();
      var ports = wiring.ports.map(function (port) {
        if (!record(port) || !name(port.name) || portNames.has(port.name)
          || !Object.prototype.hasOwnProperty.call(buses, port.segment)) {
          fail('INVALID_WIRING', 'Port name must be unique and its segment must exist.');
        }
        width(port.widthBits);
        portNames.add(port.name);
        allowedSignals.add('En_' + port.name);
        allowedSignals.add('Ld_' + port.name);
        var value = readPath(original, port.path);
        unsigned(value, port.widthBits, { port: port.name, value: value });
        return { name: port.name, segment: port.segment, path: port.path.slice(),
          widthBits: port.widthBits, value: value };
      });
      Object.keys(signals).forEach(function (key) {
        if (!allowedSignals.has(key) || typeof signals[key] !== 'boolean') {
          fail('INVALID_SIGNALS', 'Unknown signal or non-boolean signal value.', { signal: key });
        }
      });
      var normalized = {};
      allowedSignals.forEach(function (key) {
        normalized[key] = Object.prototype.hasOwnProperty.call(signals, key) && signals[key];
      });
      ports.forEach(function (port) {
        if (normalized['En_' + port.name]) buses[port.segment].drivers.push(port.name);
        if (normalized['Ld_' + port.name]) buses[port.segment].receivers.push(port.name);
      });
      // Resolve every segment before preparing any capture. Equal values still contend.
      Object.keys(buses).forEach(function (segment) {
        var bus = buses[segment];
        if (bus.drivers.length > 1) {
          fail('BUS_CONTENTION', 'More than one driver is enabled.', { segment: segment, drivers: bus.drivers });
        }
        if (bus.drivers.length === 0 && bus.receivers.length > 0) {
          fail('NO_BUS_DRIVER', 'An enabled receiver cannot capture High-Z.', { segment: segment });
        }
        if (bus.drivers.length === 1) {
          var source = ports.find(function (port) { return port.name === bus.drivers[0]; });
          unsigned(source.value, bus.widthBits, { segment: segment, value: source.value });
          bus.level = 'driven';
          bus.value = source.value;
        }
      });
      var paths = new Set();
      var captures = [];
      ports.forEach(function (port) {
        if (!normalized['Ld_' + port.name]) return;
        var value = buses[port.segment].value;
        unsigned(value, port.widthBits, { port: port.name, value: value });
        var key = JSON.stringify(port.path.map(String));
        if (paths.has(key)) fail('MULTIPLE_LOADS', 'Two receivers target the same state location.', { path: port.path });
        paths.add(key);
        captures.push({ port: port.name, segment: port.segment, path: port.path,
          before: port.value, after: value });
      });
      // Only now commit to a detached copy. A caller can swap this state once.
      var next = copy(original, []);
      captures.forEach(function (capture) {
        var target = next;
        capture.path.slice(0, -1).forEach(function (key) { target = target[key]; });
        target[capture.path[capture.path.length - 1]] = capture.after;
      });
      next.buses = buses;
      next.revision += 1;
      return { status: 'completed', state: next, event: {
        kind: 'bus-transfer', revisionBefore: original.revision, revisionAfter: next.revision,
        signals: normalized, segments: copy(buses, []), captures: captures
      } };
    } catch (error) {
      if (!error.busCode) throw error;
      return { status: 'rejected', error: { code: error.busCode,
        message: error.message, details: error.details } };
    }
  }

  return { transfer: transfer };
}());

if (typeof module !== 'undefined' && module.exports) module.exports = BusArbiter;
