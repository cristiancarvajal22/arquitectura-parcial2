# Marcelo's task integration

`src/core/machine.js` coordinates the team's CPU/ALU, bus arbiter, RAM, page FIFO, keyboard, parser, L1I, L2 and Swap modules. Their original commits remain ancestors of the integration branch.

Each STEP publishes one committed microstep, with at most one byte transfer on a data segment. The detached candidate is validated before publication. Rejection does not advance clock, metrics or architectural state. Page faults progress through Dirty-victim save, physical cache invalidation, 32-byte load and table installation before retrying the original access.

Memory requests retain their logical ID, stage, transfer position and lookup-accounting journal. An empty keyboard produces a pending result without consuming data. Latest-step replay and the clock controller's epoch/sequence receipts prevent duplicate effects.

Data ALU operations remain eight-bit. Address calculation has a nine-bit combinational path to PC/MAR. INC/DEC use the internal constant-one ALU input.

The integration control word preserves bits 0..29 and appends En_L1I, Ld_L1I, En_L1D, Ld_L1D, En_L2, Ld_L2, En_SWAP, Ld_SWAP, En_MMU and Ld_MMU. Both control segments are 40-bit; data buses remain eight-bit. Numeric encoding uses powers of two rather than JavaScript's 32-bit bitwise operators. This extension requires peer review against contract #3; the original 30-bit renderer is not used for the new profile.

State is persisted using Joseph's two-slot property store and global lock. Panels derive from the saved state. Reset starts another epoch and clears the program; reloading is explicit.

The memory regression test writes 32 distinct bytes, forces eviction and reload, and compares all bytes. `node scripts/demo-evidence.cjs` runs the three real motor demos and exports their traces.

Sheets adapter tests use service doubles. Live installation and a second person's execution must be verified separately and must not be inferred from local test results.
