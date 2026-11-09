# Clock and persistence — P2-006

Node tests cover the core and its connection to the actual bus coordinator.
Full motor integration and execution in the real Apps Script spreadsheet remain pending.

`src/core/clock.js` injects store, lock, motor and resetter. `clock-store.js` supplies
ScriptProperties/ScriptLock adapters. The motor must be a pure bounded function
`motor(snapshot, request) -> Result`: exactly one micro-step, returning state,
events and completed/pending/rejected. It must not persist, update cells or perform
external peripheral side effects. To continue pending memory/I/O, its adapter must
reuse the transaction in execution.pendingRequest, not replace its ID with the new
clock command ID. PR #52 BusMicroStep covers internal transfers only.

Use `clockAppsScript(motorStep, createReset).initialize()` after wiring the real
motor. Dispatch `{epoch, sequence: lastSequence+1, expectedRevision, action}`.
Actions are step, run (integer limit 1..8), pause and reset. Pause before Step during
Run. The UI awaits each batch, renders its committed events, then sends the next.
Pause/reset are handled between batches; there is no server-side infinite loop.
BUSY means retry the same request. Double clicks must retain their sequence.

The motor owns cycle increments. Mode changes create execution-control events
without bus transfers; do not feed those events to the micro-word renderer.
The batch is calculated on copies and published together. Failure discards the
uncommitted batch. Pending ends it and preserves the waiting transaction.

The durable envelope contains epoch, sequence, state and the last receipt.
Identical retries return that receipt; stale sequences/revisions are rejected.
Reset uses the deterministic resetter, advances epoch and invalidates old-session
commands. Loading a program is a separate operation.

A script lock protects read/compute/publish and is released in finally. Two slots
hold at most 20 ASCII chunks of 7000 characters each. Write the inactive slot first,
then change HEAD. A pre-HEAD failure preserves the previous snapshot. A lost response
after publication is recovered by retrying the same command. Do not clear properties
to recover. Payloads over 140000 characters are rejected before writing. Every writer
of these keys must use the same lock.

Local doubles do not prove real Google service behavior. Before integration, test
Step, an eight-step Run, pause/resume, double click, reset while waiting for keyboard,
and reopening the session in the spreadsheet. Callbacks must be bounded and avoid
network calls. Property/execution quotas remain additional limits.

Run `node --test tests/unit/clock.test.cjs`.
Official references:
- https://developers.google.com/apps-script/guides/services/quotas
- https://developers.google.com/apps-script/reference/lock/lock-service
- https://developers.google.com/apps-script/reference/properties/properties

## Bus and micro-word integration

`python3 scripts/fetch-test-deps.py clock-bus` fetches five pinned dependencies.
`node --test tests/unit/clock.test.cjs tests/integration/clock-bus.test.cjs`: 16 passed.
Uses BusMicroStep/BusArbiter from #52 and the viewer from #62. Covers PC→MAR,
eight-step Run, pause, retry after reopening, contention, reset and publication failure.
Ready profile and wiring are test configuration, not production approval.
Properties/Lock remain local doubles; live spreadsheet and memory/I/O are pending.
