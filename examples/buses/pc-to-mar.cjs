'use strict';
const { transfer } = require('../../src/buses/arbiter.js');

// Map/IR follow the integrated ISA (#51). Bus routing/control widths still await #3.
function scenario() {
  const state = { revision: 0, buses: {},
    cpu: { registers: { AX: 0, BX: 0, CX: 0, DX: 0 }, pc: 300, mar: 0,
      mdr: 0, ir: { bytes: [0, 0, 0, 0], loadedBytes: 0 }, alu: { result: 0 } },
    ram: { bytes: Array(256).fill(0) } };
  state.ram.bytes.fill(32, 232, 240);
  const segments = {
    internalAddress: { widthBits: 9, domain: 'virtual' },
    internalData: { widthBits: 8, domain: 'data' },
    internalControl: { widthBits: 16, domain: 'control' },
    externalAddress: { widthBits: 8, domain: 'physical' },
    externalData: { widthBits: 8, domain: 'data' },
    externalControl: { widthBits: 16, domain: 'control' },
  };
  const ports = ['AX', 'BX', 'CX', 'DX'].map(name => ({ name,
    segment: 'internalData', widthBits: 8, path: ['cpu', 'registers', name] }));
  for (const [name, path] of [['PC', ['cpu', 'pc']], ['MAR', ['cpu', 'mar']]]) {
    ports.push({ name, path, segment: 'internalAddress', widthBits: 9 });
  }
  for (const [name, path] of [['MDR', ['cpu', 'mdr']], ['IR', ['cpu', 'ir', 'bytes', 0]],
    ['ALU', ['cpu', 'alu', 'result']], ['RAM', ['ram', 'bytes', 32]],
    ['KBD', ['ram', 'bytes', 224]], ['LCD', ['ram', 'bytes', 232]]]) {
    ports.push({ name, path, segment: 'internalData', widthBits: 8 });
  }
  return { state, wiring: { segments, ports } };
}

function demonstrate() {
  const f = scenario();
  const saved = JSON.stringify(f.state);
  const accepted = transfer(f.state, f.wiring, { En_PC: true, Ld_MAR: true }, 0);
  const rejected = transfer(f.state, f.wiring, { En_PC: true, En_MAR: true, Ld_MAR: true }, 0);
  if (accepted.status !== 'completed' || rejected.status !== 'rejected') throw Error('Unexpected demo result.');
  return { illustrativeWiring: true,
    accepted: { pc: accepted.state.cpu.pc, mar: accepted.state.cpu.mar,
      revision: accepted.state.revision, event: accepted.event },
    rejected: rejected.error, originalUnchanged: saved === JSON.stringify(f.state) };
}

module.exports = { scenario, demonstrate };
if (require.main === module) process.stdout.write(JSON.stringify(demonstrate(), null, 2) + '\n');
