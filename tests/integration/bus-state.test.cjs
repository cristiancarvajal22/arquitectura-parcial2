'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { transfer } = require('../../src/buses/arbiter.js');
const { scenario } = require('../../examples/buses/pc-to-mar.cjs');
const reset = () => JSON.parse(fs.readFileSync(path.join(__dirname,
  '../../docs/examples/core/reset.snapshot.json'), 'utf8'));

test('bus kernel consumes the complete shared snapshot without duplicating CPU or RAM', () => {
  const state = reset();
  state.cpu.pc = 300;
  const result = transfer(state, scenario().wiring, { En_PC: true, Ld_MAR: true }, 0);
  assert.equal(result.status, 'completed');
  assert.equal(result.state.cpu.mar, 300);
  for (const key of ['profile', 'ram', 'swap', 'mmu', 'caches', 'io', 'clock', 'metrics']) {
    assert.deepEqual(result.state[key], state[key]);
  }
  assert.equal(state.cpu.mar, 0);
  // Full control/clock/global-event publication still belongs to the coordinator.
  assert.equal(result.state.lastEvent, null);
});

test('KBD and LCD bindings agree with the integrated ISA and shared snapshot', () => {
  const state = reset();
  const { wiring } = scenario();
  assert.equal(state.io.keyboard.basePa, 224);
  assert.equal(state.io.lcd.basePa, 232);
  assert.deepEqual(wiring.ports.find(p => p.name === 'KBD').path, ['ram', 'bytes', 224]);
  assert.deepEqual(wiring.ports.find(p => p.name === 'LCD').path, ['ram', 'bytes', 232]);
  assert.deepEqual(state.ram.bytes.slice(232, 240), Array(8).fill(32));
  assert.deepEqual(state.ram.bytes.slice(240, 256), Array(16).fill(0));
  state.ram.bytes[224] = 65; // Injected peripheral input for this kernel test.
  const result = transfer(state, wiring, { En_KBD: true, Ld_LCD: true }, 0);
  assert.equal(result.status, 'completed');
  assert.equal(result.state.ram.bytes[232], 65);
  assert.equal(result.state.ram.bytes[224], 65);
  assert.deepEqual(result.state.io, state.io, 'bus capture alone does not consume KBD or advance LCD');
});

test('IR receives four bytes from MDR over an eight-bit bus without resizing', () => {
  let state = reset();
  const instruction = [0x21, 0x00, 0x2c, 0x01]; // STORE [300], AX in the integrated ISA.
  for (const [index, value] of instruction.entries()) {
    const { wiring } = scenario();
    wiring.ports.find(p => p.name === 'IR').path = ['cpu', 'ir', 'bytes', index];
    state.cpu.mdr = value; // Injected fetch output; no MMU/cache claim.
    const result = transfer(state, wiring, { En_MDR: true, Ld_IR: true }, state.revision);
    assert.equal(result.status, 'completed');
    state = result.state;
    assert.equal(state.cpu.ir.bytes.length, 4);
    assert.equal(state.buses.internalData.widthBits, 8);
  }
  assert.deepEqual(state.cpu.ir.bytes, instruction);
  assert.equal(state.revision, 4);
  assert.equal(state.cpu.ir.decoded, null, 'bus transfer is not instruction decoding');
});

test('a failed transfer preserves the entire shared snapshot, including caches and clock', () => {
  const state = reset();
  const saved = structuredClone(state);
  const result = transfer(state, scenario().wiring,
    { En_AX: true, En_BX: true, Ld_LCD: true, En_PC: true, Ld_MAR: true }, 0);
  assert.equal(result.status, 'rejected');
  assert.equal(result.error.code, 'BUS_CONTENTION');
  assert.deepEqual(state, saved);
  assert.equal('state' in result, false);
});
