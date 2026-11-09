// Contract-fixture validation only: this does not execute a simulator.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const fixture = name => JSON.parse(readFileSync(
  new URL(`../../docs/examples/core/${name}.json`, import.meta.url), 'utf8'));
const reset = fixture('reset.snapshot');
const before = fixture('pc-to-mar.before');
const event = fixture('pc-to-mar.event');
const after = fixture('pc-to-mar.after');
const integer = (value, max) => assert.ok(Number.isInteger(value) && value >= 0 && value <= max);
const bytes = (values, length) => {
  assert.equal(values.length, length);
  values.forEach(value => integer(value, 255));
};
const unique = values => assert.equal(new Set(values).size, values.length);
const endpoints = ['AX', 'BX', 'CX', 'DX', 'PC', 'IR', 'MAR', 'MDR', 'ALU', 'RAM', 'KBD', 'LCD'];
const signalNames = [...endpoints.flatMap(x => [`En_${x}`, `Ld_${x}`]),
  'Read', 'Write', 'Clock', 'IO', 'Mem_R', 'Mem_W'];

function validateSnapshot(state) {
  assert.equal(state.schemaVersion, 1);
  assert.equal(state.profile.status, 'proposal');
  assert.deepEqual(state.profile.pendingIssues, [3]);
  assert.deepEqual(state.profile.sizes, { ramBytes: 256, virtualBytes: 512,
    pageBytes: 32, frameCount: 8, pageCount: 16, lineBytes: 8, l2Lines: 4 });
  assert.equal(state.profile.cachePolicy.write, null);
  assert.equal(state.profile.cachePolicy.allocate, null);
  assert.equal(state.profile.controlEncoding, null);
  assert.equal(state.profile.widths.pc, 9);
  assert.equal(state.profile.widths.mar, 9);
  assert.deepEqual(Object.keys(state.cpu.registers), ['AX', 'BX', 'CX', 'DX']);
  Object.values(state.cpu.registers).forEach(value => integer(value, 255));
  integer(state.cpu.pc, 511);
  integer(state.cpu.mar, 511);
  integer(state.cpu.mdr, 255);
  assert.equal(state.profile.widths.irMaxBytes, 4);
  bytes(state.cpu.ir.bytes, 4);
  integer(state.cpu.ir.loadedBytes, 4);
  assert.deepEqual(Object.keys(state.cpu.flags), ['ZF', 'CF', 'SF']);
  Object.values(state.cpu.flags).forEach(flag => assert.equal(typeof flag, 'boolean'));
  for (const key of ['a', 'b', 'result']) integer(state.cpu.alu[key], 255);
  assert.deepEqual(Object.keys(state.cpu.control.signals).sort(), [...signalNames].sort());
  Object.values(state.cpu.control.signals).forEach(value => assert.equal(typeof value, 'boolean'));
  assert.equal(state.cpu.control.phase, state.clock.phase);
  assert.equal(state.cpu.control.microStep, state.clock.microStep);

  const widths = { internalAddress: 9, internalData: 8, internalControl: null,
    externalAddress: 8, externalData: 8, externalControl: null };
  assert.deepEqual(Object.keys(state.buses).sort(), Object.keys(widths).sort());
  for (const [name, bus] of Object.entries(state.buses)) {
    assert.equal(bus.widthBits, widths[name]);
    assert.ok(bus.drivers.length <= 1, 'a committed bus cannot have contention');
    unique(bus.receivers);
    if (!bus.drivers.length) {
      assert.equal(bus.level, 'Z');
      assert.equal(bus.value, null);
      assert.deepEqual(bus.receivers, []);
    } else {
      assert.equal(bus.level, 'driven');
      assert.notEqual(bus.widthBits, null);
      integer(bus.value, 2 ** bus.widthBits - 1);
      assert.equal(state.cpu.control.signals[`En_${bus.drivers[0]}`], true);
      for (const receiver of bus.receivers) assert.equal(state.cpu.control.signals[`Ld_${receiver}`], true);
    }
  }

  bytes(state.ram.bytes, 256);
  assert.equal(state.ram.frames.length, 8);
  assert.equal(state.mmu.pages.length, 16);
  const mapped = [];
  state.mmu.pages.forEach((page, vpn) => {
    assert.equal(page.vpn, vpn);
    for (const key of ['present', 'dirty', 'referenced', 'pinned']) assert.equal(typeof page[key], 'boolean');
    if (page.present) {
      integer(page.pfn, 7);
      mapped.push(page.pfn);
      assert.equal(state.ram.frames[page.pfn].vpn, vpn);
      assert.equal(state.ram.frames[page.pfn].pinned, page.pinned);
    } else {
      assert.equal(page.pfn, null);
      assert.equal(page.dirty, false);
      assert.equal(page.referenced, false);
      assert.equal(page.pinned, false);
    }
  });
  unique(mapped);
  state.ram.frames.forEach((frame, pfn) => {
    assert.equal(frame.pfn, pfn);
    assert.equal(typeof frame.pinned, 'boolean');
    if (frame.vpn !== null) {
      integer(frame.vpn, 15);
      assert.equal(state.mmu.pages[frame.vpn].present, true);
      assert.equal(state.mmu.pages[frame.vpn].pfn, pfn);
    } else assert.equal(frame.pinned, false);
  });
  unique(state.mmu.fifo);
  assert.deepEqual([...state.mmu.fifo].sort(), state.ram.frames
    .filter(frame => frame.vpn !== null && !frame.pinned).map(frame => frame.pfn).sort());
  for (const mapping of state.profile.pinnedMappings) {
    assert.equal(state.ram.frames[mapping.pfn].vpn, mapping.vpn);
    assert.equal(state.ram.frames[mapping.pfn].pinned, true);
  }
  assert.equal(state.swap.pages.length, 16);
  state.swap.pages.forEach(page => bytes(page, 32));

  assert.equal(state.caches.l2.lines.length, 4);
  const lines = [state.caches.l1i, state.caches.l1d, ...state.caches.l2.lines];
  for (const line of lines) {
    bytes(line.bytes, 8);
    assert.equal(typeof line.valid, 'boolean');
    assert.equal(typeof line.dirty, 'boolean');
    if (line.valid) integer(line.tag, 31);
    else { assert.equal(line.tag, null); assert.equal(line.dirty, false); }
  }
  unique(state.caches.l2.fifo);
  assert.deepEqual([...state.caches.l2.fifo].sort(), state.caches.l2.lines
    .flatMap((line, i) => line.valid ? [i] : []).sort());

  const reserved = [];
  assert.deepEqual(state.profile.ioMap, {
    keyboard: { va: 480, pa: 224, length: 8 },
    lcd: { va: 488, pa: 232, length: 8 },
  });
  for (const [name, mapping] of Object.entries(state.profile.ioMap)) {
    assert.equal(mapping.length, 8);
    integer(mapping.pa, 248);
    integer(mapping.va, 504);
    assert.equal(state.io[name].basePa, mapping.pa);
    for (let i = 0; i < 8; i++) {
      const va = mapping.va + i;
      const page = state.mmu.pages[Math.floor(va / 32)];
      assert.equal(page.pinned, true);
      assert.equal(page.pfn * 32 + va % 32, mapping.pa + i);
      reserved.push(mapping.pa + i);
    }
    assert.equal('bytes' in state.io[name], false, 'I/O must not duplicate RAM');
    assert.equal('buffer' in state.io[name], false, 'I/O must not duplicate RAM');
  }
  assert.equal(reserved.length, 16);
  unique(reserved);
  const keyboard = state.io.keyboard;
  assert.equal(keyboard.capacity, 8);
  integer(keyboard.head, 7); integer(keyboard.tail, 7); integer(keyboard.count, 8);
  assert.equal((keyboard.head + keyboard.count) % 8, keyboard.tail);
  assert.equal(state.io.lcd.length, 8);
  integer(state.io.lcd.cursor, 7);
  integer(state.revision, Number.MAX_SAFE_INTEGER);
  integer(state.clock.cycle, Number.MAX_SAFE_INTEGER);
  integer(state.clock.microStep, Number.MAX_SAFE_INTEGER);
  assert.ok(['idle', 'paused', 'running', 'halted', 'error'].includes(state.execution.mode));
  assert.deepEqual(JSON.parse(JSON.stringify(state)), state);
}

for (const [name, state] of Object.entries({ reset, before, after })) {
  test(`snapshot ${name}: sizes, ranges, buses, mappings and I/O`, () => validateSnapshot(state));
}

test('reset fixture: zero data, invalid caches, empty queues and idle control', () => {
  for (const values of [Object.values(reset.cpu.registers),
    ...reset.swap.pages, reset.caches.l1i.bytes, reset.caches.l1d.bytes,
    ...reset.caches.l2.lines.map(line => line.bytes)]) assert.ok(values.every(v => v === 0));
  assert.deepEqual(reset.cpu.ir, { bytes: [0, 0, 0, 0], decoded: null, loadedBytes: 0 });
  reset.ram.bytes.forEach((byte, pa) => assert.equal(byte, pa >= 232 && pa < 240 ? 32 : 0));
  for (const field of ['pc', 'mar', 'mdr']) assert.equal(reset.cpu[field], 0);
  assert.ok(Object.values(reset.cpu.flags).every(v => v === false));
  assert.ok(Object.values(reset.cpu.control.signals).every(v => v === false));
  assert.ok(Object.values(reset.buses).every(bus => bus.level === 'Z'));
  assert.equal(reset.revision, 0);
  assert.deepEqual(reset.clock, { cycle: 0, microStep: 0, phase: 'idle' });
  assert.deepEqual(reset.execution, { mode: 'idle', pendingRequest: null, lastError: null });
  assert.equal(reset.lastEvent, null);
  assert.equal(reset.mmu.fault, null);
  assert.deepEqual(reset.mmu.fifo, []);
  assert.deepEqual(reset.caches.l2.fifo, []);
  assert.ok([reset.caches.l1i, reset.caches.l1d, ...reset.caches.l2.lines].every(l => !l.valid));
  assert.deepEqual(reset.io.keyboard, { basePa: 224, capacity: 8, head: 0, tail: 0, count: 0 });
  assert.equal(reset.io.lcd.cursor, 0);
  assert.deepEqual(reset.metrics, { l1i: { hits: 0, misses: 0 }, l1d: { hits: 0, misses: 0 },
    l2: { hits: 0, misses: 0 }, pageFaults: 0, committedMicroSteps: 0 });
});

test('illustrative event: exact before/after diff and nine-bit PC=300 transfer', () => {
  assert.equal(event.schemaVersion, 1);
  assert.equal(event.result, 'committed');
  assert.equal(event.revisionBefore, before.revision);
  assert.equal(event.revisionAfter, before.revision + 1);
  assert.equal(event.revisionAfter, after.revision);
  assert.equal(event.va, 300);
  assert.equal(event.pa, null);
  assert.deepEqual(event.bytes, []);
  assert.equal(before.cpu.pc, 300);
  assert.equal(before.cpu.mar, 0);
  assert.equal(after.cpu.mar, 300);
  assert.deepEqual(event.signals, after.cpu.control.signals);
  assert.equal(event.controlWord, after.cpu.control.word);
  for (const key of ['cycle', 'microStep', 'phase']) assert.equal(event[key], after.clock[key]);
  assert.deepEqual(event.segments, Object.entries(after.buses).map(([name, bus]) => ({
    name, widthBits: bus.widthBits, level: bus.level, value: bus.value,
    driver: bus.drivers[0] ?? null, receivers: bus.receivers })));
  const replay = structuredClone(before);
  unique(event.changes.map(change => change.path));
  for (const change of event.changes) {
    const path = change.path.split('.');
    let target = replay;
    for (const key of path.slice(0, -1)) {
      assert.ok(Object.hasOwn(target, key));
      target = target[key];
    }
    const key = path.at(-1);
    assert.ok(Object.hasOwn(target, key));
    assert.deepEqual(target[key], change.before);
    target[key] = structuredClone(change.after);
  }
  replay.lastEvent = event;
  assert.deepEqual(replay, after, 'event changes must fully describe the proposed transition');
});

const invalidCases = {
  'register overflow': s => { s.cpu.registers.AX = 256; },
  'virtual address overflow': s => { s.cpu.pc = 512; },
  'fractional address': s => { s.cpu.mar = 1.5; },
  'RAM outside 256 bytes': s => { s.ram.bytes.pop(); },
  'Swap page outside 32 bytes': s => { s.swap.pages[0].push(0); },
  'cache line outside eight bytes': s => { s.caches.l1i.bytes.pop(); },
  'pinned frame in FIFO': s => { s.mmu.fifo.push(7); },
  'duplicate FIFO entry': s => { s.mmu.fifo.push(0, 0); },
  'inconsistent page-frame mapping': s => { s.mmu.pages[15].pfn = 6; },
  'overlapping I/O reservations': s => { s.profile.ioMap.lcd = { ...s.profile.ioMap.keyboard }; s.io.lcd.basePa = 224; },
  'duplicated keyboard buffer': s => { s.io.keyboard.buffer = Array(8).fill(0); },
  'Z represented as zero': s => { s.buses.internalData.value = 0; },
  'two drivers in committed state': s => { s.buses.internalData.drivers = ['AX', 'BX']; },
  'invalid keyboard count': s => { s.io.keyboard.count = 9; },
};
for (const [name, mutate] of Object.entries(invalidCases)) {
  test(`reject inconsistent fixture: ${name}`, () => {
    const invalid = structuredClone(reset);
    mutate(invalid);
    assert.throws(() => validateSnapshot(invalid), assert.AssertionError);
  });
}
