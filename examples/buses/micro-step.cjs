'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execute } = require('../../src/core/bus-step.js');
const { scenario } = require('./pc-to-mar.cjs');
const proposal = JSON.parse(fs.readFileSync(path.join(__dirname,
  '../../docs/examples/core/reset.snapshot.json'), 'utf8'));
const request = { requestId: 'validation-step-1', expectedRevision: 0,
  phase: 'fetch-address', va: 300, signals: { En_PC: true, Ld_MAR: true } };
const { wiring } = scenario();
const guard = execute(proposal, wiring, request);
assert.equal(guard.error.code, 'INVALID_PROFILE');

// An explicitly synthetic local test, never an approved production configuration.
const state = structuredClone(proposal);
state.profile.id = 'synthetic-validation-only';
state.profile.status = 'ready';
state.profile.pendingIssues = [];
for (const name of ['internalControl', 'externalControl']) {
  state.profile.widths[name] = 16;
  state.buses[name].widthBits = 16;
}
state.cpu.pc = 300;
state.execution.mode = 'paused';
const result = execute(state, wiring, request);
assert.equal(result.status, 'completed');
assert.equal(result.state.cpu.mar, 300);
const retry = execute(result.state, wiring, request);
assert.equal(retry.replayed, true);
assert.deepEqual(retry.state, result.state);
const saved = JSON.stringify(result.state);
const contention = execute(result.state, wiring, { ...request,
  requestId: 'validation-conflict', expectedRevision: 1,
  signals: { En_PC: true, En_MAR: true, Ld_MAR: true } });
assert.equal(contention.error.code, 'BUS_CONTENTION');
assert.equal(JSON.stringify(result.state), saved);
process.stdout.write(JSON.stringify({ validationOnly: true,
  productionProposalResult: guard.error.code,
  accepted: { mar: result.state.cpu.mar, revision: result.state.revision,
    clock: result.state.clock, committedMicroSteps: result.state.metrics.committedMicroSteps,
    event: result.events[0] },
  retry: { replayed: retry.replayed, revision: retry.state.revision, cycle: retry.state.clock.cycle },
  rejected: contention.error, statePreserved: JSON.stringify(result.state) === saved
}, null, 2) + '\n');
