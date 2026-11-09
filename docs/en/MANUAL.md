# Installation and use · Google Sheets

Owner: Marcelo · issue #38.

[Español](../es/MANUAL.md) · [Team spreadsheet](https://docs.google.com/spreadsheets/d/1VhOJ5jGlvC1rMByyLyrB1OWXCSWokwGDJDajLnvnqLE/edit)

## Install the integrated build

1. Open the spreadsheet with an account that can edit it.
2. Select **Extensions → Apps Script**.
3. Copy all of [`dist/SimuladorP2.gs`](../../dist/SimuladorP2.gs).
4. Create a script named `IntegracionP2` and paste the bundle.
5. The bundle includes its dependencies. Preserve previous scripts in Git and avoid conflicting copies of global functions. The old `mmuPreview*` examples are not the execution engine.
6. Save, select **P2_Setup**, and run it. Review the permissions to access the same spreadsheet. No credentials, API keys, web deployment, or Deploy button are needed.
7. Return to Sheets. If the sidebar does not appear, reload and choose **Simulador P2 → Abrir controles**.
8. Review the configuration and click **Activar configuración del equipo**. This starts a new, empty execution using the integration memory map. Peer approval of the PR is a separate review step.

Execution remains disabled for a `proposal` profile. Activation explicitly selects `team-integration-40-v1`; it does not rewrite historical contract examples.

## Programs and controls

Select a demo and click **Cargar demo**. **STEP** commits one microstep. **RUN** schedules batches of at most eight microsteps from the browser, without a blocking server loop. **PAUSA** stops scheduling; let an outstanding request finish before another action. **RESET** clears the program, ordinary RAM, Swap, caches, metrics, and input queue while retaining the selected profile. Reload a program after Reset.

For custom programs, write one assembly line per cell in **Editor**, starting at A2, then click **Cargar código de la hoja Editor**. The whole source is validated before replacing persistent state. The loader preserves source-line/address/byte mappings and rejects code in the I/O page and branches to invalid instruction boundaries.

| Demo | Expected result |
|---|---|
| Arithmetic | AX=35, DX=5, virtual address 300 contains 35 |
| Echo | Send ABCDEFGH through the keyboard: LCD=ABCDEFGH, queue empty, cursor 0 |
| Scattered accesses | DX=71; page faults, FIFO replacement and Dirty-victim saves are visible |

An empty keyboard suspends the same IN instruction. Send characters and continue with RUN. Pause before switching from RUN to STEP. Input that exceeds queue capacity is rejected atomically.

## Panels

- **CPU:** registers, flags, nine-bit PC/MAR, four-byte IR, and buses. High-Z is not zero.
- **RAM:** exactly 256 physical bytes; frames 0..6 are replaceable and frame 7 is pinned.
- **MMU_P2_011:** 16 page entries, P/PFN/Dirty/Reference, FIFO, VA and offset. A red fault shows the victim, Dirty flag and all 32 transferred bytes. The sidebar can toggle Reference only for an eligible resident page, through a validated action with no pending transaction.
- **Swap:** 16 backing pages of 32 bytes. Dirty victims are saved before frame reuse.
- **Caches:** separate L1I/L1D lines of eight bytes and four L2 lines. Hit rate is zero with no lookups. Only actual lookups affect counters.
- **LCD_P2_023:** eight characters projected from eight video-RAM bytes. The ninth output wraps to position zero. Byte zero displays as a space; printable ASCII is literal; other bytes display as `·`.
- **Teclado:** queue count, head and tail. Its bytes exist only in RAM.
- **Señales:** the 40-bit integration word: the original 30 signals plus ten cache, Swap and translation signals.
- **Traza:** committed events with epoch, revision, clock, VA/PA, drivers, receivers and signals. Reset starts another epoch.

Cells are views, not a second source of simulator state. Direct edits to RAM/MMU display cells are replaced by the next render. Use assembly and validated sidebar actions.

## Integration memory map

| Region | VA | PA |
|---|---|---|
| Ordinary paged memory | 0..479 | Frames 0..6: 0..223 |
| Keyboard | 480..487 | 224..231 |
| LCD | 488..495 | 232..239 |
| Reserved | 496..511 | 240..255 |

This matches the team's RAM, keyboard, assembler and L2 modules. Older PA 240/248 examples are illustrative, not the integration profile.

## Evidence and remaining checks

Local tests execute all three demos through the real motor. Sheets adapter tests use simulated services; their results do not establish a live deployment. Traces are in [evidence/integration](../evidence/integration).

Record actual results for installation, integrated screenshots, and a second person's installation from another computer. Earlier standalone MMU/LCD screenshots are not substitutes.

For `STALE_REVISION`, refresh and retry against the current state. `BUSY` means another action holds the lock. `INVALID_PROFILE` requires checking configuration, not concealing unresolved contract decisions.
