'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { transfer } = require('../../src/buses/arbiter.js');

const specs = {
  internalAddress: { widthBits: 9, domain: 'virtual' },
  internalData: { widthBits: 8, domain: 'data' },
  internalControl: { widthBits: 16, domain: 'control' },
  externalAddress: { widthBits: 8, domain: 'physical' },
  externalData: { widthBits: 8, domain: 'data' },
  externalControl: { widthBits: 16, domain: 'control' },
};
// Control width is a test parameter, not a final architecture decision.
function fixture() {
  const state = { revision: 0, buses: {}, values: {}, untouched: { ram: [12, 34], flags: [false, true] } };
  const wiring = { segments: structuredClone(specs), ports: [] };
  for (const [segment, spec] of Object.entries(specs)) {
    for (const suffix of ['A', 'B', 'C']) {
      const name = segment + suffix;
      state.values[name] = suffix === 'A' ? 42 : 7;
      wiring.ports.push({ name, segment, widthBits: spec.widthBits, path: ['values', name] });
    }
  }
  return { state, wiring };
}

function rejected(f, signals, code, revision = f.state.revision) {
  const saved = JSON.stringify(f);
  const result = transfer(f.state, f.wiring, signals, revision);
  assert.equal(result.status, 'rejected');
  assert.equal(result.error.code, code);
  assert.equal('state' in result, false);
  assert.equal('event' in result, false);
  assert.equal(JSON.stringify(f), saved, 'a rejection must preserve every input');
}

for (const segment of Object.keys(specs)) {
  test(`${segment}: no driver is High-Z, not zero`, () => {
    const f = fixture();
    const result = transfer(f.state, f.wiring, {}, 0);
    assert.equal(result.status, 'completed');
    assert.equal(result.state.buses[segment].level, 'Z');
    assert.equal(result.state.buses[segment].value, null);
    assert.deepEqual(result.state.values, f.state.values);
  });
  test(`${segment}: one driver broadcasts only to enabled receivers`, () => {
    const f = fixture();
    const result = transfer(f.state, f.wiring,
      { [`En_${segment}A`]: true, [`Ld_${segment}B`]: true }, 0);
    assert.equal(result.status, 'completed');
    assert.equal(result.state.values[segment + 'B'], 42);
    assert.equal(result.state.values[segment + 'C'], 7);
    assert.equal(f.state.values[segment + 'B'], 7);
    assert.equal(result.state.buses[segment].value, 42);
    assert.deepEqual(result.state.buses[segment].drivers, [segment + 'A']);
    assert.deepEqual(result.state.buses[segment].receivers, [segment + 'B']);
    assert.deepEqual(result.state.untouched, f.state.untouched);
    assert.equal(result.state.revision, 1);
    assert.equal(result.event.captures.length, 1);
  });
  test(`${segment}: two equal-valued drivers still reject the entire step`, () => {
    const f = fixture();
    f.state.values[segment + 'B'] = 42;
    rejected(f, { [`En_${segment}A`]: true, [`En_${segment}B`]: true }, 'BUS_CONTENTION');
  });
  test(`${segment}: Load on High-Z is rejected without captures`, () => {
    rejected(fixture(), { [`Ld_${segment}B`]: true }, 'NO_BUS_DRIVER');
  });
}

for (const value of [0, 127, 128, 255]) {
  test(`eight-bit data preserves ${value}`, () => {
    const f = fixture();
    f.state.values.internalDataA = value;
    const result = transfer(f.state, f.wiring, { En_internalDataA: true, Ld_internalDataB: true }, 0);
    assert.equal(result.status, 'completed');
    assert.equal(result.state.values.internalDataB, value);
  });
}

test('virtual address 300 does not truncate to eight bits', () => {
  const f = fixture();
  f.state.values.internalAddressA = 300;
  const result = transfer(f.state, f.wiring, { En_internalAddressA: true, Ld_internalAddressB: true }, 0);
  assert.equal(result.status, 'completed');
  assert.equal(result.state.values.internalAddressB, 300);
});

test('contention in the last segment rolls back a valid first-segment capture', () => {
  rejected(fixture(), { En_internalAddressA: true, Ld_internalAddressB: true,
    En_externalControlA: true, En_externalControlB: true }, 'BUS_CONTENTION');
});

test('receiver overflow rolls back all segments', () => {
  const f = fixture();
  f.state.values.internalAddressA = 300;
  f.wiring.ports.find(p => p.name === 'internalAddressB').widthBits = 8;
  rejected(f, { En_internalDataA: true, Ld_internalDataB: true,
    En_internalAddressA: true, Ld_internalAddressB: true }, 'OUT_OF_RANGE');
});

test('duplicate capture destinations are rejected', () => {
  const f = fixture();
  f.wiring.ports.find(p => p.name === 'internalDataC').path = ['values', 'internalDataB'];
  rejected(f, { En_internalDataA: true, Ld_internalDataB: true, Ld_internalDataC: true }, 'MULTIPLE_LOADS');
});

test('stale caller cannot overwrite state', () => rejected(fixture(), {}, 'STALE_REVISION', 1));
test('unknown signal catches spelling mistakes', () => rejected(fixture(), { En_AX_typo: true }, 'INVALID_SIGNALS'));
test('numeric signals are not coerced', () => rejected(fixture(), { En_internalDataA: 1 }, 'INVALID_SIGNALS'));
test('a control width must be supplied explicitly', () => {
  const f = fixture(); f.wiring.segments.internalControl.widthBits = null;
  rejected(f, {}, 'INVALID_WIRING');
});
for (const value of [-1, 256, 1.5, '42']) {
  test(`invalid byte ${JSON.stringify(value)} is rejected without wrapping`, () => {
    const f = fixture(); f.state.values.internalDataA = value;
    rejected(f, {}, 'OUT_OF_RANGE');
  });
}
test('successful result shares no writable data with the input or event', () => {
  const f = fixture();
  const result = transfer(f.state, f.wiring, { En_internalDataA: true, Ld_internalDataB: true }, 0);
  result.state.untouched.ram[0] = 99;
  result.state.buses.internalData.receivers.push('other');
  assert.equal(f.state.untouched.ram[0], 12);
  assert.deepEqual(result.event.segments.internalData.receivers, ['internalDataB']);
});
