'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { transfer } = require('../../src/buses/arbiter.js');
const { scenario, demonstrate } = require('../../examples/buses/pc-to-mar.cjs');

function get(state, path) { return path.reduce((value, key) => value[key], state); }
function set(state, path, value) { path.slice(0, -1).reduce((v, k) => v[k], state)[path.at(-1)] = value; }

for (const endpoint of ['AX', 'BX', 'CX', 'DX', 'PC', 'MAR', 'MDR', 'IR', 'ALU', 'RAM', 'KBD', 'LCD']) {
  test(`${endpoint}: Enable transmits, Load captures and disabled Load preserves data`, () => {
    const f = scenario();
    const target = f.wiring.ports.find(p => p.name === endpoint);
    const partner = f.wiring.ports.find(p => p.name !== endpoint && p.segment === target.segment);
    set(f.state, target.path, 128);
    set(f.state, partner.path, 7);
    const driven = transfer(f.state, f.wiring, { [`En_${endpoint}`]: true, [`Ld_${partner.name}`]: true }, 0);
    assert.equal(driven.status, 'completed');
    assert.equal(get(driven.state, partner.path), 128);
    const loaded = transfer(f.state, f.wiring, { [`En_${partner.name}`]: true, [`Ld_${endpoint}`]: true }, 0);
    assert.equal(loaded.status, 'completed');
    assert.equal(get(loaded.state, target.path), 7);
    const disabled = transfer(f.state, f.wiring, { [`En_${partner.name}`]: true, [`Ld_${endpoint}`]: false }, 0);
    assert.equal(disabled.status, 'completed');
    assert.equal(get(disabled.state, target.path), 128);
  });
}

test('all source values are sampled before any destination is changed', () => {
  const f = scenario();
  f.state.cpu.registers.AX = 42;
  f.state.cpu.registers.BX = 7;
  f.wiring.ports.push({ name: 'Bridge', segment: 'externalData', widthBits: 8,
    path: ['cpu', 'registers', 'BX'] });
  f.wiring.ports.push({ name: 'Sink', segment: 'externalData', widthBits: 8,
    path: ['cpu', 'registers', 'CX'] });
  const result = transfer(f.state, f.wiring, { En_AX: true, Ld_BX: true, En_Bridge: true, Ld_Sink: true }, 0);
  assert.equal(result.status, 'completed');
  assert.equal(result.state.cpu.registers.BX, 42);
  assert.equal(result.state.cpu.registers.CX, 7);
});

test('LCD capture updates only the bound byte in existing RAM', () => {
  const f = scenario();
  f.state.ram.bytes[247] = 11;
  f.state.ram.bytes[249] = 22;
  f.state.cpu.registers.AX = 65;
  const result = transfer(f.state, f.wiring, { En_AX: true, Ld_LCD: true }, 0);
  assert.equal(result.status, 'completed');
  assert.equal(result.state.ram.bytes.length, 256);
  assert.deepEqual(result.state.ram.bytes.slice(247, 250), [11, 65, 22]);
  assert.equal(f.state.ram.bytes[248], 0);
});

test('script exposes a global without CommonJS (Apps Script loading shape)', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(require.resolve('../../src/buses/arbiter.js'), 'utf8'), context);
  // Create input inside the same realm, as Apps Script would.
  const f = scenario();
  const result = vm.runInContext(`BusArbiter.transfer(${JSON.stringify(f.state)},
    ${JSON.stringify(f.wiring)}, {En_PC:true,Ld_MAR:true}, 0)`, context);
  assert.equal(result.status, 'completed');
  assert.equal(result.state.cpu.mar, 300);
  // This is not a Google Apps Script deployment or a Sheets integration test.
});

test('demonstration produces verified transfer and contention output', () => {
  const result = demonstrate();
  assert.equal(result.accepted.mar, 300);
  assert.equal(result.accepted.event.captures[0].before, 0);
  assert.equal(result.accepted.event.captures[0].after, 300);
  assert.equal(result.rejected.code, 'BUS_CONTENTION');
  assert.equal(result.originalUnchanged, true);
});
