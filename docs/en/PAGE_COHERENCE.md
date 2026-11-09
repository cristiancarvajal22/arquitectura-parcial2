# Dirty, Reference and frame reuse — P2-015

PageCoherence(deps) reuses Marcelo's MMU, Cristian's PageFifo/CacheCoherence/
PhysicalRam, and #12 Swap. Exact versions are pinned in
tests/dependencies/page-coherence.json; their source is not copied into src.

markAccess(state,request) operates on a successful access candidate: read/fetch
set Reference, write also sets Dirty, regardless of cache hits. I/O bypasses those
updates; absent pages return pending. prepare(state,vpn) selects via PageFifo,
saves a Dirty victim before invalidating its L1I/L1D/L2 physical lines, then returns
the candidate, decision, incoming 32 bytes and trace. Inputs remain unchanged.

finish(current,prepared,loadedBytes) checks the unchanged base, unaltered plan and
all 32 expected bytes before installing RAM, page/frame mappings, FIFO and flags.
Stale/partial/modified inputs are rejected. Neighboring cache lines remain intact.
Dirty caches requiring writeback block reuse rather than silently losing data.
Write-through leaves cache lines clean while the page may still be Dirty versus Swap.
New pages start with clear flags; the retried access sets Reference.

These are pure transaction stages. The coordinator must perform the actual 32-byte
bus transfer between prepare and finish, then commit revision, counters and global
event together. Byte equality is not proof of bus execution. This module does not
advance clock/revision or replace the page-fault coordinator. #12 initialPages must
be installed by the loader.

Run `python3 scripts/fetch-test-deps.py page-coherence`, then
`node --test tests/integration/page-coherence.test.cjs`. The helper uses existing gh
authentication, downloads same-repository files into ignored .test-deps and verifies
Git blob hashes; --offline verifies cached dependencies without downloading.

Ten integration tests cover flags on warm accesses, I/O, dirty eviction/reload,
neighbor preservation, stale/incomplete plans, writeback protection and deterministic
reset. They supply the page block directly; actual coordinator/bus micro-steps and
spreadsheet validation remain pending. Evidence: ../evidence/P2-015.md.
