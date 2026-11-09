# Bus arbitration · first delivery for #7

[Español](../es/BUSES.md) · [Source](../../src/buses/arbiter.js) ·
[Runnable demo](../../examples/buses/pc-to-mar.cjs) · [Evidence](../evidence/P2-007.md).

## Implemented behavior

`BusArbiter.transfer(state, wiring, signals, expectedRevision)` calculates a
complete transaction on a detached state copy. It neither writes to Sheets
nor owns another register bank. Ports bind existing paths, such as
`['cpu', 'registers', 'AX']` or `['ram', 'bytes', 248]`. Receivers update those
locations in the new state.

A `completed` result contains `state` and `event`. The coordinator may replace
the old state once, after validating the rest of the micro-step. A `rejected`
result contains only `error`, with no partially committed state or event.
Inputs remain unchanged on both success and rejection.

## Explicit configuration

`wiring.segments` maps names to `{widthBits, domain}`. Widths are integers
from 1 to 32, with no implicit defaults. Domains are virtual, physical, data
or control. The example provides six segments:

- `internalAddress`: nine virtual bits, 0..511.
- `externalAddress`: eight physical bits, 0..255.
- `internalData` and `externalData`: eight bits each.
- `internalControl` and `externalControl`: **sixteen bits for testing only**;
  Joseph must establish the production widths in #3.

Each `wiring.ports` entry supplies `{name, segment, path, widthBits}`. Names
are unique and paths must exist. Values are unsigned integers. A wider bus
can feed a narrow receiver only when the value fits; overflow is rejected,
never truncated or coerced from text. Two active receivers cannot target
the same path. Ports cannot target the reserved revision/buses metadata.

The demo connects PC/MAR to the address segment and other endpoints to the
data segment to test Enable/Load. IR receives one byte at cpu.ir.bytes[0];
this does not define an ISA or multibyte instruction assembly. RAM[240] and
RAM[248] are **illustrative** KBD/LCD locations pending #2. Their internal-bus
connection is a test arrangement; the final external route/bridges belong to #3.

## Transaction rules

signals accepts boolean En_NAME/Ld_NAME entries. Omitted signals are false;
unknown names and numeric values such as 1 are rejected. Read/Write/Clock/IO
and control-word encoding belong to the coordinator, which passes only the
relevant Enable/Load subset to this kernel.

1. Validate revision, configuration, paths and ranges.
2. Sample every source from the same original state.
3. No driver means Z and null value. Loading from Z is rejected.
4. One driver broadcasts to enabled receivers; disabled receivers retain
   their values. Several receivers may capture a bus.
5. Two or more drivers cause BUS_CONTENTION even if their values agree.
   Reject the **whole** transaction, not just the conflicting segment.
6. Validate all destinations, commit captures together in a copy, increment
   revision once and return a local bus event.

The result includes resolved buses with level, value, drivers, receivers,
domain and width. The event records before/after revisions, normalized
signals, segments, and captures with paths and before/after values. A driven
segment without receivers changes no register. State and event have no shared
mutable objects.

Errors: INVALID_STATE, INVALID_WIRING, INVALID_SIGNALS, OUT_OF_RANGE,
STALE_REVISION, BUS_CONTENTION, NO_BUS_DRIVER and MULTIPLE_LOADS. Revision
validation does **not replace a concurrency lock** in the Apps Script coordinator.

## Reproduce

Requires Node with node:test; verified using v24.18.0 without dependencies:

```sh
node --test tests/unit/bus-arbiter.test.cjs tests/unit/bus-ports.test.cjs
node examples/buses/pc-to-mar.cjs
```

The demo moves MAR from 0 to 300 and revision from 0 to 1. Simultaneously
enabling PC and MAR returns BUS_CONTENTION and leaves the original intact.
Captured output is linked in the evidence.

## Remaining integration

This is a tested standalone kernel. Before closing #7:

- Resolve #1/#2/#3 and finalize wiring, control widths, mappings and legal signals.
- Connect the approved state, clock, control and complete snapshot. Validate
  ISA, I/O and coherence **before publishing** a result; the kernel alone
  does not authorize memory writes.
- Complete the global event with cycle, phase, request ID, VA/PA, bytes,
  control word and lastEvent. This module returns only the local bus event.
- Implement peripheral transactions: En_KBD alone does not consume a byte;
  LCD does not advance its cursor; RAM does not update caches or Dirty/Reference.
- Test actual integrated modules and High-Z visualization in Sheets, obtain
  peer review and merge into develop.

Global BusArbiter loading without CommonJS was tested using Node VM.
**No Google Apps Script deployment or execution has been performed.**
The issue stays In Progress with a draft PR until integration is ready.
