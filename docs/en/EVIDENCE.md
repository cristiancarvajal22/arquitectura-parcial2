# Evidence matrix — task #39

Snapshot: November 9, 2026. This index covers available module tests and GitHub reviews.
Linked feature branches are not yet integrated into `develop`; passing module tests do not certify a complete rubric criterion.

## Rubric criteria

| Criterion | Available evidence | Status and remaining verification |
| --- | --- | --- |
| G1 · Buses, tri-state and micro-word (20) | #3, #7, #8, #9; [buses][bus], [viewer][microword], [contract #60](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/60). | Partial. Arbitration and event projection tested; shared vector agreement and complete spreadsheet animation pending. |
| G2 · L1I/L1D/L2 (15) | #16–#21; [L2][l2], [FIFO and bus tests][l2-test]; pinned dependencies in #65. | Partial. Four FIFO lines, eight-transfer misses and L1I reuse tested. Actual L1D integration, combined counters and animation pending. |
| G3 · Paging and Swap (15) | #10–#15; [RAM][ram], [MMU][mmu], [FIFO][fifo], [Swap][swap], [coherence][pages]. | Partial. 32-byte roundtrip and dirty eviction tested. Complete page-fault controller, micro-step transfer and visual demonstration pending. |
| G4 · Keyboard/LCD (15) | #22–#24; [keyboard #56](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/56), tested circular queue. | Partial. CPU IN/OUT, LCD and complete bus-driven echo remain to be demonstrated. |
| G5 · CPU, assembler and demos (15) | #4–#6, #25–#30; [registers/ALU #53](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/53), [microcode #58](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/58), [clock][clock], [parser][asm]. | Partial. Modules do not yet form an integrated CPU. Editor/loader and all three programs remain pending. |
| G6 · Bilingual documentation (10) | [Spanish README](../../README.md), [English README](../../README_EN.md), [architecture](../ARQUITECTURA.md), [ISA](../ISA_MAPA_MEMORIA.md), #37–#39. | Partial. Contracts and evidence linked; user manual and spreadsheet URL require verification. |
| G7 · Identity and presentation (10) | #31–#33 and #45; [organization](../ORGANIZACION.md). | Final name/logo, spreadsheet controls and animation not verified. |
| I1 · Individual tracking (10) | [Issues](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues), [Project](https://github.com/users/cristiancarvajal22/projects/6), assignees and related PRs. | Assignments verified. Board movement history requires an authenticated session and is not certified here. |
| I2 · Git and collaboration (15) | Personal branches, commits and reviews below. | Traceable contributions. Joseph's PR reviews and integration remain pending; no self-approval. |
| I3 · Team presentation (15) | #40–#42 and #45. | Actual 20-minute rehearsal, balanced participation and attire remain to be recorded. No rehearsal is claimed here. |
| I4 · Individual defense (20) | #40–#45. | Questions and live changes require practice and records; a written guide is not proof of individual mastery. |

## Tests and versions

Local execution: Node v24.22.1, November 9, 2026. All counts below are passing tests.
Bus and MMU counts include their complete test groups, not only the linked entry file.

| PR | Checked commit | Test file | Passed |
| --- | --- | --- | --- |
| [#52][bus] | `650a31c` | [tests/integration/bus-step.test.cjs][bus-test] | 102 (contracts + ports + arbitration + integration) |
| [#54][ram] | `92f48cb` | [tests/unit/ram.test.cjs][ram-test] | 9 |
| [#55][fifo] | `908738d` | [tests/unit/fifo.test.cjs][fifo-test] | 5 |
| [#57][asm] | `ce70a54` | [tests/unit/assembler.test.cjs][asm-test] | 34 |
| [#59][mmu] | `2618568` | [tests/unit/mmu-access.test.mjs][mmu-test] | 34 (three MMU files) |
| [#61][clock] | `0bf3fa9` | [tests/unit/clock.test.cjs][clock-test] | 10 |
| [#62][microword] | `555ae5e` | [tests/unit/microword.test.cjs][microword-test] | 11 |
| [#63][swap] | `ccd7720` | [tests/unit/swap.test.cjs][swap-test] | 10 |
| [#64][pages] | `241c4c6` | [tests/integration/page-coherence.test.cjs][pages-test] | 10 |
| [#65][l2] | `31e2b63` | [tests/integration/l2.test.cjs][l2-test] | 10 |

For #64 and #65, first run `python3 scripts/fetch-test-deps.py page-coherence` or
`python3 scripts/fetch-test-deps.py l2`, respectively, with authenticated `gh`.
Manifests pin each same-repository dependency to a commit and blob hash.
Then run `node --test` with the linked test file. Peers' source modules are not copied into Joseph's commits.

Clock tests use service doubles. Micro-word tests combine a contract snapshot with test events.
Page coherence uses actual MMU/FIFO/RAM/Swap/coherence modules but receives a complete page block.
L2 uses actual BusArbiter, PhysicalRam and InstructionCache; actual L1D integration is not claimed.

## Contributions and reviews

| Member | Traceable contributions | Checked scope |
| --- | --- | --- |
| Cristian · cristiancarvajal22 | [#52][bus], [#54][ram], [#55][fifo], [#57][asm] | Reviewed and tested buses, RAM, FIFO and parser; reused as test dependencies. |
| Marcelo · marceloaguilera777 | [#59][mmu], [#58](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/58) | MMU reused in coherence; MMU and decoder/microcode tests executed. This is not a complete CPU. |
| Joseph · JosephPerez725 | [#60](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/60), [#61][clock], [#62][microword], [#63][swap], [#64][pages], [#65][l2] | Contract, clock, viewer, Swap, page coherence and L2; phased commits, tests and documentation. |

Joseph's approved reviews, limited to each module's scope:
- [PR #52](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/52#pullrequestreview-5822215129) at `650a31c`.
- [PR #54](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/54#pullrequestreview-5822215579) at `92f48cb`.
- [PR #55](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/55#pullrequestreview-5822216073) at `908738d`.
- [PR #57](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/57#pullrequestreview-5822216600) at `ce70a54`.
Approval does not mean the PR is merged or the complete simulator is operational.

## Delivery pending

- **Spreadsheet:** final URL unverified; a first-midterm sheet is not a substitute.
- **Manual:** must be checked against actual application controls.
- **Board:** link available; status and movement history unverified without an authenticated session.
- **Final tests:** CPU + memory + I/O + spreadsheet, three programs and reproducible traces.
- **Defense:** timed rehearsal and actual results for all three team members.

Update this matrix as integration and evidence progress; retain the tested commit.
[Español](../es/EVIDENCIAS.md).

[bus]: https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/52
[bus-test]: https://github.com/cristiancarvajal22/arquitectura-parcial2/blob/650a31c42fdd20bc866f8ef37eb1f40cba030a1b/tests/integration/bus-step.test.cjs
[ram]: https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/54
[ram-test]: https://github.com/cristiancarvajal22/arquitectura-parcial2/blob/92f48cbecd1bdc9f161b18638392ada7eb2fc36a/tests/unit/ram.test.cjs
[fifo]: https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/55
[fifo-test]: https://github.com/cristiancarvajal22/arquitectura-parcial2/blob/908738df96e9290c8556247a90201f6aabf3d895/tests/unit/fifo.test.cjs
[asm]: https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/57
[asm-test]: https://github.com/cristiancarvajal22/arquitectura-parcial2/blob/ce70a5487f6521f4dd71a6004e9e06353f3edb66/tests/unit/assembler.test.cjs
[mmu]: https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/59
[mmu-test]: https://github.com/cristiancarvajal22/arquitectura-parcial2/blob/26185682ddc6ea6e8771772bfdaf5a4317498712/tests/unit/mmu-access.test.mjs
[clock]: https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/61
[clock-test]: https://github.com/cristiancarvajal22/arquitectura-parcial2/blob/0bf3fa9901f03d941eab0a6288b6cb4eb5db51bf/tests/unit/clock.test.cjs
[microword]: https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/62
[microword-test]: https://github.com/cristiancarvajal22/arquitectura-parcial2/blob/555ae5e896334301c98df7cf2dc20378b7b58fa1/tests/unit/microword.test.cjs
[swap]: https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/63
[swap-test]: https://github.com/cristiancarvajal22/arquitectura-parcial2/blob/ccd7720e2f7d960a80ab62f4bd495bfe6ee16669/tests/unit/swap.test.cjs
[pages]: https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/64
[pages-test]: https://github.com/cristiancarvajal22/arquitectura-parcial2/blob/241c4c6466c68630aacbc9cac20beed5d4db147c/tests/integration/page-coherence.test.cjs
[l2]: https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/65
[l2-test]: https://github.com/cristiancarvajal22/arquitectura-parcial2/blob/31e2b633e1b2d6dd237f5ae6df1488aa1b9f391d/tests/integration/l2.test.cjs
