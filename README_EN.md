# Architecture - Second Midterm

A computer simulator built with **Google Sheets + JavaScript/Google Apps Script**.

**Team:** Cristian, Marcelo and Joseph.
**Reported deadline:** Monday, November 9, 2026, 10:00 (America/La_Paz).
**Branch status:** integrated motor, local tests and three reproducible demos. Live Sheets installation, peer review and access from another account must be checked before declaring delivery complete.

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
[Español](README.md) · [Team organization](docs/ORGANIZACION.md) · [Contribution steps](CONTRIBUTING.md) · [Architecture](docs/ARQUITECTURA.md) · [Rubric](docs/RUBRICA.md) · [Issues](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues)

[Team spreadsheet](https://docs.google.com/spreadsheets/d/1VhOJ5jGlvC1rMByyLyrB1OWXCSWokwGDJDajLnvnqLE/edit). Earlier standalone views were checked; the integrated build and evaluator access still require live verification.

## Run this build

[English manual](docs/en/MANUAL.md) · [Spanish manual](docs/es/MANUAL.md) · [Apps Script bundle](dist/SimuladorP2.gs) · [Integration](docs/en/INTEGRATION.md) · [Real local demo results](docs/evidence/integration/demos.json).

Install the bundle in the bound Apps Script project and run `P2_Setup`. Local regression uses Node.js and no npm dependencies; see the Spanish README for the exact commands. Team dependencies retain their original commits and authorship. Local tests are not a claim of live deployment or completed peer review.
