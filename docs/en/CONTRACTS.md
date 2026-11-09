# State and interface contract · P2-001

Status: **proposal for review**. No simulator logic is implemented here.
Task owner: Cristian. Related to [#1](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/1).
[Español](../es/CONTRATOS.md).

## Scope and pending decisions

CPU, buses, memory, caches, I/O and Sheets share one serializable state.
A snapshot contains the complete committed state; animations consume events
from that same state. Sheet cells are not a separate authoritative CPU.

Required sizes from [ARQUITECTURA.md](../ARQUITECTURA.md) remain unchanged:
four 8-bit registers, 512 virtual addresses, 256-byte RAM, sixteen 32-byte
pages, eight frames, 8-byte L1I/L1D, 32-byte L2, and two eight-byte keyboard
and LCD reservations **within RAM**.

Pending review; these are not claimed team agreements:

- Marcelo (#2): ISA encoding, maximum IR length, flag semantics, final
  PC/MAR widths, KBD/LCD addresses and pinned pages/frames.
- Joseph (#3): cache write/allocation policies, complete signal vector and
  binary encoding, control-bus widths and access sequences.
- Both Marcelo and Joseph: review this contract and its examples in the PR.
  Their review criterion remains incomplete until both actually review it.

Nine-bit PC/MAR and the example profile are proposals. The illustrative
profile reserves PA 240..247 for KBD and 248..255 for LCD, mapping VPN 15
to pinned PFN 7 (VA 480..511). The entire frame 7 is excluded from FIFO,
including its sixteen non-peripheral bytes. Seven frames are replaceable.
Do not hard-code these locations before #2 is resolved. Cache write policies
and control encoding remain `null` pending #3; null never implies a default.

## Shared representation · schemaVersion 1

Use only JSON objects, arrays, strings, integers, booleans and null. No
functions, circular references, Map/Set, BigInt, NaN or undefined. Arrays
store numeric byte values; hex/binary are display formats. Validate before
mutation: do not truncate addresses, coerce strings or wrap invalid inputs.

- `schemaVersion`: format version; consumers reject unsupported versions.
- `profile`: sizes, widths, I/O map, pinned frames, policies and decision
  status. `status: "proposal"` prevents production Run/Step.
- `revision`: state commit counter, initially 0; unrelated to Git commits.
- `cpu.registers`: AX/BX/CX/DX (0..255); `pc`/`mar` (0..511 in this
  profile), `mdr` (0..255), `ir: {bytes, decoded}`. IR retains fetch order;
  decoded stays null until a complete valid instruction is available.
- `cpu.flags`: ZF/CF/SF booleans, initially false. Operation-specific rules
  belong to #2 and are not invented by this contract.
- `cpu.alu`: byte operands A/B and result; operation null when idle.
- `cpu.control`: phase idle, micro-step 0, null control word and named
  signals. Numeric encoding is derived only after #3 defines its bits.
- `buses`: separate `internalAddress` (9 bits, VA), `internalData` (8 bits),
  `internalControl` (width pending), `externalAddress` (8 bits, PA),
  `externalData` (8 bits), `externalControl` (width pending). Each stores
  widthBits, domain, level, value, drivers and receivers. Idle is level Z,
  null value and empty endpoint lists. Z is never encoded as zero.
- `ram.bytes`: exactly 256 bytes, including the **only authoritative** KBD
  and LCD buffers. `ram.frames`: eight descriptors with PFN, VPN or null,
  and pinned flag; no duplicate RAM bytes.
- `mmu.pages`: sixteen VPN-ordered entries with present, pfn, dirty,
  referenced and pinned. Non-present pages have null PFN and false
  Dirty/Reference. Two present pages cannot share a frame in this contract.
- `mmu.fifo`: replaceable PFNs in arrival order, without duplicates;
  hits do not reorder it. `mmu.fault`: null or `{requestId, vpn, victimPfn,
  stage, transferredBytes}`; a page transfer contains 32 bytes.
- `swap.pages`: sixteen arrays of 32 bytes backing the virtual space.
  RAM is newer for present dirty pages. Peripheral bytes are not copied to
  Swap as ordinary memory.
- `caches.l1i`, `l1d`: one line each. `l2`: four eight-byte lines and FIFO
  of valid line indices. A line has valid, tag, dirty and bytes. Physical
  tag is floor(PA/8), offset PA % 8; invalid tag is null. FIFO tracks arrival,
  not the last access.
- `io.keyboard`: basePa, capacity 8, head, tail, count; indices 0..7 and
  count 0..8. Reset sets head=tail=count=0. Full means count=8; head=tail
  alone does not distinguish full/empty. There is no second byte buffer.
- `io.lcd`: basePa, length 8, cursor 0. Its view reads RAM; zero displays
  an empty position rather than a visible character.
- `clock`: cycle 0, microStep 0, phase idle on reset.
- `execution`: mode (`idle`, `paused`, `running`, `halted`, `error`),
  pendingRequest and lastError; reset values are idle, null and null.
- `metrics`: hit/miss counters for L1I/L1D/L2, page faults and committed
  micro-steps, initially zero.
- `lastEvent`: last committed event or null; export full history separately
  instead of growing the snapshot indefinitely.

All register/peripheral endpoints expose `En_<endpoint>` and `Ld_<endpoint>`:
AX/BX/CX/DX, PC, IR, MAR, MDR, ALU, RAM, KBD and LCD. Read, Write, Clock,
IO, Mem_R and Mem_W are also present. All initially false. Legal combinations
are defined in #3; a signal's existence does not authorize an illegal ISA action.

## Access interfaces

Conceptual signatures only; no implementations in this task:

```text
snapshot(state) -> independent JSON copy
reset(profile) -> Result
fetch(state, {requestId, expectedRevision, va, length}) -> Result
read(state, {requestId, expectedRevision, va}) -> Result
write(state, {requestId, expectedRevision, va, value}) -> Result
step(state, {requestId, expectedRevision}) -> Result
resume(state, {requestId, expectedRevision}) -> Result
```

requestId is unique within a run. expectedRevision must match the observed
state. The Apps Script coordinator serializes operations with a lock and
rejects stale writers with STALE_REVISION. Step and Run cannot overlap.
A synchronous API returns once per micro-step; the UI schedules the next
one. Operations never busy-wait for animations.

read/write handle one byte. fetch returns length bytes in order, with
positive length and va + length <= 512. Reject fractional/negative/out-of-range
VA, values outside 0..255, invalid lengths and instruction fetches from I/O.
Translate each page **before** caches. Fetches crossing lines/pages split into
correctly translated accesses; never extend a PA into an unrelated frame.
L1I serves only fetch; L1D serves data. I/O bypasses all caches and requires
IO plus an authorized endpoint; ordinary writes cannot touch reservations.
Dirty/Reference update even on hits, according to the operation and #3.

Discriminated results:

```text
completed: {status, requestId, state, events, value}
pending:   {status, requestId, state, events, reason}
rejected:  {status, requestId, error: {code, message, details}}
```

For completed, value is a byte for read, byte array for fetch, or null for
write/reset/step. events lists committed events in order. pending denotes a
page fault or I/O wait, not an error or an instruction commit. pendingRequest
retains the request, fetched bytes, unwritten destinations and resume stage.
resume uses the **same requestId**. Retries cannot consume a keyboard byte
or write the LCD twice. The coordinator retains the last completed ID's
result until another request starts; only one request may be active. Older
IDs return STALE_REQUEST.

Rejected results never expose a partially changed state. The coordinator
retains the previous snapshot and returns an external diagnostic to the UI.
Stopping scheduling after rejection changes no registers, RAM, caches,
FIFO, flags, counters or clock. The diagnostic is outside the rejected state.

Minimum error codes: INVALID_PROFILE, OUT_OF_RANGE, INVALID_OPERAND,
BUS_CONTENTION, NO_BUS_DRIVER, IO_PROTECTED, FETCH_FROM_IO, STALE_REVISION,
STALE_REQUEST, UNKNOWN_REQUEST and HALTED. Details identify field, value
and segment/operation when applicable.

## Events and atomicity

Every event has schemaVersion, id, requestId, revisionBefore, revisionAfter,
cycle, microStep, phase, kind, signals, controlWord, segments, va, pa, bytes,
changes and result. IDs are unique and monotonic within a run. result is
committed for a published event; rejection is a separate diagnostic. Each
segment names its width, level, value, driver or null, and receivers.
changes lists paths with before/after values. Use null for absent VA/PA.

Micro-step order:

1. Validate request, revision, ranges, signals and **all** segments.
2. Resolve drivers: none means Z, one supplies bits, two or more reject
   the entire step even if their values agree. Load from Z is rejected;
   a receiver with Load false retains its value.
3. Prepare changes in a copy; validate translation, I/O and coherence.
4. Commit state, revision and event exactly once, then animate.

A page fault commits maintenance steps (Swap, 32-byte transfer, page table,
FIFO, invalidation) while leaving the instruction's effect pending. Save a
dirty victim before reusing its frame; invalidate all physical cache lines
of the reused frame before resuming. Cancellation/retry never repeats committed
effects. pendingRequest records the completed stage. A maintenance rejection
preserves the last committed state, not the state preceding all earlier
maintenance steps. Animations cannot advance CPU or write RAM directly.

## Deterministic reset

The same approved profile produces the same reset data: zeroed registers,
flags, clock, metrics, RAM and Swap; empty IR; inactive signals; Z buses;
invalid zeroed cache lines; empty FIFOs; no request, fault, error or event;
empty keyboard and LCD cursor zero. Pinned pages/frames retain their mapping,
not their contents. Other pages are non-present and other frames free.
revision returns to zero for a **new run**; the coordinator invalidates old
IDs/results so they cannot be reused after reset. No wall-clock timestamps
or randomness belong in reset snapshots. Loading a program is a subsequent
operation, not a hidden reset side effect.

## Verification and completion

JSON examples and their checker will be linked on this branch. They are
illustrative contract data, not evidence of a running CPU or working sheet.
To close #1: verify examples, settle shared decisions, obtain actual reviews
from Marcelo and Joseph, and merge into develop. Until review and integration
are complete, the card must not be marked Done.
