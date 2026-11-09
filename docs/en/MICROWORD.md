# Micro-word and buffers — P2-009

AI-assisted implementation using the proposed 30-bit encoding from PR #60. Team
agreement remains pending; this code never marks a profile ready.

microWordView(event) validates a committed transfer and returns word, a 30-character
binary string (b29..b0), and bit/signal/value/component/action rows. It checks boolean
signals, drivers/receivers, address/data widths, High-Z, control combinations and
numeric word consistency. A null word is derived from signals and labeled as such.
The event is never modified. Control-bus arbitration remains the motor's responsibility.

Even bits 0..22 enable AX,BX,CX,DX,PC,IR,MAR,MDR,ALU,RAM,KBD,LCD respectively.
The following bit loads that component. Bits 24..29 are Read,Write,Clock,IO,Mem_R,Mem_W.
Enable drives an output; Load captures an input. Disabled Enable means High-Z;
disabled Load means HOLD, not High-Z. Other drivers may still drive the shared bus.

| Synthetic micro-step | Active bits | Decimal |
|---|---|---:|
| Fetch PC→MAR | 8,13,26 | 67117312 |
| ALU→AX | 16,1,26 | 67174402 |
| Read RAM→MDR | 18,15,24,28,26 | 352616448 |
| Write MDR→RAM | 14,19,25,29,26 | 638074880 |
| IN KBD→MDR | 20,15,24,27,26 | 219185152 |
| OUT MDR→LCD | 14,23,25,27,26 | 243286016 |

These are isolated transfers, not full instructions. The tests construct each event
and verify values, active bits, actions and immutability. They also project the
repository's existing PC-to-MAR contract event. MMU/cache execution is not simulated.

Copy microword.js and microword-sheet.js to .gs files in a bound Apps Script project.
After committing a transfer event, call microWordRender(event). It writes the dedicated
MICROPALABRA_P2_009 tab, preserving leading binary zeros and coloring active bits green.
It never changes CPU, RAM or signals. Do not pass administrative clock events.
Validation precedes drawing. If Sheets fails, redraw the last committed event; never
execute the CPU operation again merely to repair its display.

Pending: #3 agreement, motor hookup and six screenshots from the real spreadsheet.
The Sheets adapter is currently tested with a double, not a live Google account.
Run `node --test tests/unit/microword.test.cjs`.
