# Matriz de evidencias — tarea #39

Corte: 9 de noviembre de 2026. Evidencia de módulos y revisiones disponibles en GitHub.
Las ramas enlazadas contienen trabajo aún no integrado en `develop`; una prueba unitaria aprobada no certifica el criterio completo.

## Criterios de la rúbrica

| Criterio | Evidencia disponible | Estado y comprobación pendiente |
| --- | --- | --- |
| G1 · Buses, triestado y micro-palabra (20) | #3, #7, #8, #9; [buses][bus], [visor][microword], [contrato #60](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/60). | Parcial. Arbitraje probado y proyección de eventos; falta confirmar vector entre módulos y animación de todos los recorridos en la hoja. |
| G2 · L1I/L1D/L2 (15) | #16–#21; [L2][l2], [pruebas FIFO y bus][l2-test]. Dependencias y versiones en PR #65. | Parcial. Cuatro líneas FIFO, miss de ocho transferencias y reutilización L1I probados; L1D real, métricas integradas y animación pendientes. |
| G3 · Paginación y Swap (15) | #10–#15; [RAM][ram], [MMU][mmu], [FIFO][fifo], [Swap][swap], [coherencia][pages]. | Parcial. Roundtrip de 32 bytes y desalojo Dirty probados. Falta controlador completo de page fault, transferencia por micro-pasos y demostración visual. |
| G4 · Teclado/LCD (15) | #22–#24; [teclado #56](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/56), cola circular probada. | Parcial. Falta demostrar IN/OUT ejecutados por CPU, LCD y eco completo por bus. |
| G5 · CPU, ensamblador y demos (15) | #4–#6, #25–#30; [registros/ALU #53](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/53), [microsecuencias #58](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/58), [reloj][clock], [parser][asm]. | Parcial. Los módulos no constituyen todavía una CPU integrada. Editor/cargador y ejecución de tres programas pendientes. |
| G6 · Documentación bilingüe (10) | [README ES](../../README.md), [README EN](../../README_EN.md), [arquitectura](../ARQUITECTURA.md), [ISA](../ISA_MAPA_MEMORIA.md), #37–#39. | Parcial. Contratos y evidencias bilingües enlazados; manual de uso y URL de planilla por verificar. |
| G7 · Identidad y presentación (10) | #31–#33 y #45; [organización](../ORGANIZACION.md). | Pendiente de comprobación: nombre/logo definitivos, controles y animaciones en planilla. |
| I1 · Seguimiento individual (10) | [Issues](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues), [Project](https://github.com/users/cristiancarvajal22/projects/6), responsables y PR relacionados. | Asignaciones comprobadas. No se certifica el historial de movimientos del tablero; requiere sesión con acceso. |
| I2 · Git y colaboración (15) | Ramas personales y commits en los PR de esta matriz; revisiones verificadas abajo. | Aportes trazables. Revisiones de los PR de Joseph e integración siguen pendientes; no se autoaprueban. |
| I3 · Exposición del equipo (15) | #40–#42 y #45. | Ensayo real de 20 minutos, participación equilibrada e indumentaria por registrar. No hay evidencia de ensayo en esta matriz. |
| I4 · Defensa individual (20) | #40–#45. | Preguntas y cambios en vivo por practicar y registrar; una guía escrita no prueba dominio individual. |

## Pruebas y versiones

Ejecución local: Node v24.22.1, 2026-11-09. Todos los conteos siguientes corresponden a pruebas aprobadas.
En buses y MMU se ejecutaron los grupos completos indicados, no solamente el archivo de entrada enlazado.

| PR | Commit comprobado | Archivo de prueba | Aprobadas |
| --- | --- | --- | --- |
| [#52][bus] | `650a31c` | [tests/integration/bus-step.test.cjs][bus-test] | 102 (contratos + puertos + arbitraje + integración) |
| [#54][ram] | `92f48cb` | [tests/unit/ram.test.cjs][ram-test] | 9 |
| [#55][fifo] | `908738d` | [tests/unit/fifo.test.cjs][fifo-test] | 5 |
| [#57][asm] | `ce70a54` | [tests/unit/assembler.test.cjs][asm-test] | 34 |
| [#59][mmu] | `2618568` | [tests/unit/mmu-access.test.mjs][mmu-test] | 34 (tres archivos MMU) |
| [#61][clock] | `0bf3fa9` | [tests/unit/clock.test.cjs][clock-test] | 10 |
| [#62][microword] | `555ae5e` | [tests/unit/microword.test.cjs][microword-test] | 11 |
| [#63][swap] | `ccd7720` | [tests/unit/swap.test.cjs][swap-test] | 10 |
| [#64][pages] | `241c4c6` | [tests/integration/page-coherence.test.cjs][pages-test] | 10 |
| [#65][l2] | `31e2b63` | [tests/integration/l2.test.cjs][l2-test] | 10 |

En #64 y #65, ejecutar primero `python3 scripts/fetch-test-deps.py page-coherence` o
`python3 scripts/fetch-test-deps.py l2`, respectivamente, con `gh` autenticado.
Los manifiestos fijan commit y hash de cada dependencia del mismo repositorio.
Después ejecutar `node --test` con el archivo enlazado. No se copian módulos ajenos en commits de Joseph.

Las pruebas de reloj usan servicios dobles. Las de micro-palabra combinan una captura del contrato y eventos de prueba.
Las de coherencia reutilizan MMU/FIFO/RAM/Swap/coherencia reales, pero suministran el bloque completo.
Las de L2 usan BusArbiter, PhysicalRam e InstructionCache reales; L1D no se presenta como integrado.

## Aportes y revisiones comprobables

| Integrante | Aporte localizable | Alcance comprobado |
| --- | --- | --- |
| Cristian · cristiancarvajal22 | [#52][bus], [#54][ram], [#55][fifo], [#57][asm] | Buses, RAM, FIFO y parser revisados y probados; dependencias reutilizadas en pruebas. |
| Marcelo · marceloaguilera777 | [#59][mmu], [#58](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/58) | MMU utilizada en coherencia; pruebas MMU y decoder/microcode ejecutadas. No equivale a CPU completa. |
| Joseph · JosephPerez725 | [#60](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/60), [#61][clock], [#62][microword], [#63][swap], [#64][pages], [#65][l2] | Contrato, reloj, visor, Swap, coherencia y L2; commits por fases, pruebas y documentación. |

Revisiones aprobadas por Joseph sobre el alcance de cada módulo:
- [PR #52](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/52#pullrequestreview-5822215129) en `650a31c`.
- [PR #54](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/54#pullrequestreview-5822215579) en `92f48cb`.
- [PR #55](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/55#pullrequestreview-5822216073) en `908738d`.
- [PR #57](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/57#pullrequestreview-5822216600) en `ce70a54`.
Las aprobaciones no significan que los PR estén fusionados ni que el simulador completo funcione.

## Pendientes de entrega

- **Planilla:** URL final no verificada; no se sustituye por una planilla del primer parcial.
- **Manual:** pendiente de contraste con controles reales de la aplicación.
- **Tablero:** enlace disponible, estado y movimientos sin comprobar por falta de sesión con acceso.
- **Pruebas finales:** CPU + memoria + E/S + hoja, tres programas y trazas reproducibles.
- **Defensa:** ensayo e intervenciones de los tres integrantes, con duración y resultados reales.

Actualizar esta matriz cuando se integren módulos o se obtenga evidencia nueva; conservar el commit de cada prueba.
[English](../en/EVIDENCE.md).

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
