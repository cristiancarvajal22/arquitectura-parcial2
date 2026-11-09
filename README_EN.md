# Architecture - Second Midterm

A computer simulator built with **Google Sheets + JavaScript/Google Apps Script**.

**Team:** Cristian, Marcelo and Joseph.
**Reported deadline:** Monday, November 9, 2026, 10:00 (America/La_Paz).
**Status:** integrated and tested core; spreadsheet installation and validation pending.

## Work organization
Tasks and progress are recorded on the [Project board](https://github.com/users/cristiancarvajal22/projects/6). Each issue includes a description, planned work, acceptance criteria and deliverables. The first three tasks define the shared state, instruction set, memory map, cache rules and control signals used to integrate the simulator.

The [task index](docs/BACKLOG.md) lists all 48 issues. The [Spanish glossary](docs/GLOSARIO.md) explains the project's technical terms.

## Work distribution
Each member owns **16 tasks and 57 relative effort points**. Points compare workload; they are not hours or grades. Work includes implementation, testing, documentation and oral-defense practice. Issues have one owner and no fixed review assignment. Team members check each other's PRs as required by the rubric.

GitHub accounts: Cristian `cristiancarvajal22`, Marcelo `marceloaguilera777`, Joseph `JosephPerez725`.
Marcelo has repository access and 16 native issue assignments. Joseph has Write access to the Project; his repository invitation has been sent and must be accepted before his repository assignments can be completed.

## Planned scope
Four-register CPU and ALU; internal/external tri-state buses and a visible control word; 256 B RAM, 512 B virtual memory, 32 B pages, FIFO and Swap; 8 B L1I/L1D and 32 B L2; an 8 B keyboard queue and an 8×1 LCD with 8 B video RAM; editor, assembler, loader, three demos and an animated spreadsheet.

The target is Excellent across 100 group points and 60 individual points per student. The planning documents do not certify a grade. Final architecture, ISA, control-word specification, installation guide and user manual must describe the implemented simulator in both languages.

## Links
[Español](README.md) · [Team organization](docs/ORGANIZACION.md) · [Architecture](docs/ARQUITECTURA.md) · [Rubric](docs/RUBRICA.md) · [Issues](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues)

The spreadsheet does not exist yet. Its verified direct link will be added with the implementation and complete bilingual user manual.

## Integrated delivery — November 9

The integrated core executes all three demos; **352 local tests passed**. Arithmetic: AX=15; echo: ABCDEFGH; memory: DX=42 after dirty eviction and reload.

Installation: create a Google spreadsheet, open **Extensions → Apps Script**, paste [dist/Simulador.gs](dist/Simulador.gs), save and run `simSetup` once. Authorize spreadsheet access and reload the sheet. Use the **Simulador** menu to select, load, Step or Run. Sources remain editable in the catalog. For Echo, enter ABCDEFGH through the keyboard menu.

**Delivery scope:** Step executes one complete instruction and exposes its ordered trace; Run executes eight instructions. Page transfers commit a complete 32-byte block. Live Google Sheets validation, per-micro-step animation and the shared URL remain pending. [Final evidence](docs/evidence/INTEGRACION_FINAL.md).
