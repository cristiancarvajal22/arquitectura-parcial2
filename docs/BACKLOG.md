# Backlog inicial del Segundo Parcial

Proyecto: [Kanban](https://github.com/users/cristiancarvajal22/projects/6). Cierre: 9/11/2026 10:00 America/La_Paz.

**48 tareas, 16 por integrante; 57 puntos relativos y 16 revisiones por persona.** Los puntos comparan esfuerzo y no equivalen a horas ni calificación. Solo P2-001/002/003 empiezan en To Do; el resto, Backlog. No se ha desarrollado código.

El cuerpo de cada issue conserva responsable, reviewer, rama, fase, dependencias, prioridad, rúbrica y criterios. Las asignaciones GitHub de Marcelo/Joshep requieren confirmar sus usuarios y acceso; no se adivinan cuentas. Reglas de revisión en [CONTRIBUTING](../CONTRIBUTING.md).

## [P2-001][CORE] Acordar estado serializable y contrato de eventos

[Abrir issue #1](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/1)

Responsable: **Cristian**. Reviewer: **Marcelo**. Prioridad: P0. Esfuerzo: 2 puntos.
Fase: F1 · Contratos (27-29 oct). Estado inicial: To Do.
Rama: `feature/cristian/core-contratos`. Rúbrica: G1,G2,G3,G4,G5,I1 + I1/I2.
Dependencias: ninguna; revisar el contrato con todo el equipo.

- [ ] Definir estructura única de CPU, buses, RAM, páginas, cachés, E/S, reloj y estado de ejecución sin implementar lógica.
- [ ] Especificar APIs de lectura/escritura/fetch y eventos de micro-paso con ciclo, fase, señales, emisor, receptores y direcciones virtual/física.
- [ ] Publicar ejemplos de snapshots y contratos revisados por Marcelo y Joshep; definir reinicio determinista y errores atómicos.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-002][ISA] Cerrar ISA, anchuras de registros y mapa de RAM/E/S

[Abrir issue #2](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/2)

Responsable: **Marcelo**. Reviewer: **Joshep**. Prioridad: P0. Esfuerzo: 2 puntos.
Fase: F1 · Contratos (27-29 oct). Estado inicial: To Do.
Rama: `feature/marcelo/isa-mapa`. Rúbrica: G3,G4,G5 + I1/I2.
Dependencias: ninguna; revisar el contrato con todo el equipo.

- [ ] Documentar opcodes, operandos, longitud/codificación, flags y saltos para AX/BX/CX/DX de 8 bits; incluir IN reg,[KBD], OUT [LCD],reg y HALT.
- [ ] Fijar anchuras PC/MAR para 0..511, IR multibyte si aplica y fronteras de instrucción; describir accesos cruzando línea/página.
- [ ] Reservar exactamente 8 B KBD y 8 B LCD dentro de RAM 256 B; fijar direcciones, mapeo virtual, marcos protegidos y cantidad real de marcos reemplazables.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-003][CACHE] Cerrar políticas de caché, coherencia y micro-palabra

[Abrir issue #3](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/3)

Responsable: **Joshep**. Reviewer: **Cristian**. Prioridad: P0. Esfuerzo: 2 puntos.
Fase: F1 · Contratos (27-29 oct). Estado inicial: To Do.
Rama: `feature/joshep/cache-contratos`. Rúbrica: G1,G2,G3,G4 + I1/I2.
Dependencias: ninguna; revisar el contrato con todo el equipo.

- [ ] Especificar L1I/L1D de una línea de 8 B y L2 de 4 líneas de 8 B (32 B), tags físicos, válidos, FIFO L2 y políticas de escritura/asignación.
- [ ] Definir traducción antes de caché, E/S no cacheable, invalidación por reemplazo de marco/carga/edición y actualización de Dirty/Reference aun en hits.
- [ ] Acordar vector completo Enable/Load/Read/Write/Clock/IO, anchura por segmento y trazas fetch/read/write/IN/OUT/Page Fault con un emisor por bus.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-004][CPU] Implementar registros AX..DX y ALU de 8 bits

[Abrir issue #4](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/4)

Responsable: **Cristian**. Reviewer: **Joshep**. Prioridad: P0. Esfuerzo: 5 puntos.
Fase: F2 · Núcleo (30 oct-2 nov). Estado inicial: Backlog.
Rama: `feature/cristian/cpu-registros-alu`. Rúbrica: G1,G5 + I1/I2.
Dependencias: P2-001, P2-002.

- [ ] AX/BX/CX/DX solo conservan bytes; PC/IR/MAR/MDR siguen anchuras acordadas y son visibles en snapshots.
- [ ] Operaciones de ISA actualizan ZF/CF/SF con reglas documentadas, incluyendo cero, acarreo/préstamo y signo.
- [ ] Verificar 0, 127, 128, 255 y desbordamiento con resultados esperados; transferencias respetan contrato de buses.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-005][CPU] Implementar fetch/decode/execute y secuencias de control

[Abrir issue #5](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/5)

Responsable: **Marcelo**. Reviewer: **Cristian**. Prioridad: P0. Esfuerzo: 5 puntos.
Fase: F2 · Núcleo (30 oct-2 nov). Estado inicial: Backlog.
Rama: `feature/marcelo/cpu-microsecuencias`. Rúbrica: G1,G5 + I1/I2.
Dependencias: P2-001, P2-002, P2-003.

- [ ] Fetch pasa PC→MAR→jerarquía→MDR→IR mediante señales y no mediante lecturas ocultas.
- [ ] Cada opcode tiene microsecuencia trazable; saltos condicionales, bucles y HALT funcionan usando los cuatro registros.
- [ ] Step avanza un micro-paso; una instrucción suspendida espera memoria/E/S y continúa sin duplicar efectos.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-006][CORE] Implementar reloj, snapshots y ciclo seguro en Apps Script

[Abrir issue #6](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/6)

Responsable: **Joshep**. Reviewer: **Marcelo**. Prioridad: P0. Esfuerzo: 5 puntos.
Fase: F2 · Núcleo (30 oct-2 nov). Estado inicial: Backlog.
Rama: `feature/joshep/core-reloj`. Rúbrica: G1,G7 + I1/I2.
Dependencias: P2-001, P2-002, P2-003.

- [ ] Un estado/snapshot confirmado alimenta módulos y renderizado; reinicio restaura valores y contadores reproducibles.
- [ ] Run ejecuta lotes acotados y cede control para animación; evita ejecuciones solapadas y estados parcialmente escritos.
- [ ] Probar pausa/reanudación, doble clic y reinicio durante espera; documentar límites de Apps Script y recuperación.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-007][BUS] Implementar arbitraje, High-Z y detección de contención

[Abrir issue #7](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/7)

Responsable: **Cristian**. Reviewer: **Marcelo**. Prioridad: P0. Esfuerzo: 5 puntos.
Fase: F2 · Núcleo (30 oct-2 nov). Estado inicial: Backlog.
Rama: `feature/cristian/bus-arbitraje`. Rúbrica: G1 + I1/I2.
Dependencias: P2-001, P2-003.

- [ ] Modelar bus interno y externo con control, dirección y datos; describir segmentos y ancho de cada uno.
- [ ] Sin emisores el bus muestra Z; con uno propaga bits; con dos o más detiene el micro-paso antes de cambiar estado.
- [ ] Todos los registros y periféricos exponen Enable/Load; pruebas fuerzan cada caso y verifican que receptores deshabilitados no capturan.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-008][BUS] Integrar transacciones de lectura, escritura y E/S por bus

[Abrir issue #8](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/8)

Responsable: **Marcelo**. Reviewer: **Joshep**. Prioridad: P0. Esfuerzo: 5 puntos.
Fase: F2 · Núcleo (30 oct-2 nov). Estado inicial: Backlog.
Rama: `feature/marcelo/bus-transacciones`. Rúbrica: G1,G3,G4 + I1/I2.
Dependencias: P2-002, P2-003, P2-007.

- [ ] Las señales Read/Write/Clock/IO y dirección correcta gobiernan transferencias CPU↔caché/RAM/E/S.
- [ ] Lectura y escritura registran emisor/receptor, MAR/MDR y orden temporal; nunca Read y Write incompatibles simultáneos.
- [ ] Verificar fetch, dato, IN y OUT con trazas y que no haya rutas directas que omitan buffers.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-009][BUS] Implementar micro-palabra visible y decodificador de señales

[Abrir issue #9](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/9)

Responsable: **Joshep**. Reviewer: **Cristian**. Prioridad: P0. Esfuerzo: 5 puntos.
Fase: F2 · Núcleo (30 oct-2 nov). Estado inicial: Backlog.
Rama: `feature/joshep/bus-micropalabra`. Rúbrica: G1,G7 + I1/I2.
Dependencias: P2-003, P2-007.

- [ ] Mostrar vector binario y nombres para todos los Enable/Load, Mem_R/Mem_W y E/S acordados, incluidos En_KBD y Ld_LCD.
- [ ] Cada bit visible coincide con el evento del micro-paso y el buffer correspondiente; inactivos aparecen High-Z.
- [ ] Comprobar al menos fetch, ALU→registro, read, write, IN y OUT con snapshots y explicación bit a bit.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-010][RAM] Implementar 8 marcos de 32 B y reserva de E/S

[Abrir issue #10](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/10)

Responsable: **Cristian**. Reviewer: **Joshep**. Prioridad: P0. Esfuerzo: 3 puntos.
Fase: F2 · Núcleo (30 oct-2 nov). Estado inicial: Backlog.
Rama: `feature/cristian/ram-marcos`. Rúbrica: G3,G4 + I1/I2.
Dependencias: P2-001, P2-002.

- [ ] RAM conserva exactamente 256 bytes con marcos 0..7; límites 0/31/32/255 y valores fuera de rango validados.
- [ ] Cola KBD y video LCD ocupan sus 16 bytes dentro de RAM según mapa; acceso normal no los sobrescribe.
- [ ] Representación hex/decimal y escritura controlada mantienen sincronía con snapshots y contrato de caché.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-011][MMU] Implementar traducción VPN/PFN/offset y tabla de 16 entradas

[Abrir issue #11](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/11)

Responsable: **Marcelo**. Reviewer: **Cristian**. Prioridad: P0. Esfuerzo: 3 puntos.
Fase: F2 · Núcleo (30 oct-2 nov). Estado inicial: Backlog.
Rama: `feature/marcelo/mmu-traduccion`. Rúbrica: G3 + I1/I2.
Dependencias: P2-001, P2-002, P2-010.

- [ ] Para VA 0..511, VPN=floor(VA/32), offset=VA%32 y PA=PFN*32+offset con PFN 0..7.
- [ ] Tabla visible contiene VPN, P, PFN, Dirty y Reference; detecta VA inválida y mapeos inconsistentes.
- [ ] Probar VA 0,31,32,255,256,511 y páginas ausentes; permisos/reservas E/S acordados no crean RAM extra.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-012][SWAP] Implementar respaldo por páginas y persistencia de 32 bytes

[Abrir issue #12](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/12)

Responsable: **Joshep**. Reviewer: **Marcelo**. Prioridad: P0. Esfuerzo: 3 puntos.
Fase: F2 · Núcleo (30 oct-2 nov). Estado inicial: Backlog.
Rama: `feature/joshep/swap-paginas`. Rúbrica: G3 + I1/I2.
Dependencias: P2-001, P2-002, P2-010.

- [ ] Backing store representa las 16 páginas virtuales de 32 B y copias de Swap sin incrementar RAM física.
- [ ] Lectura/escritura de una página copia los 32 bytes exactos, conserva vecinos y valida índices y longitud.
- [ ] Probar ida/vuelta de una página modificada y reset/carga; distinguir imagen inicial de programa y respaldo actualizado.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-013][FIFO] Implementar cola FIFO y elección de víctima elegible

[Abrir issue #13](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/13)

Responsable: **Cristian**. Reviewer: **Marcelo**. Prioridad: P0. Esfuerzo: 5 puntos.
Fase: F2 · Núcleo (30 oct-2 nov). Estado inicial: Backlog.
Rama: `feature/cristian/mmu-fifo`. Rúbrica: G3 + I1/I2.
Dependencias: P2-002, P2-011, P2-012.

- [ ] Usar marcos libres antes de desalojar; FIFO elige por orden de entrada, sin rejuvenecer por hit/Reference.
- [ ] Excluir marcos reservados/fijados según contrato y mostrar cola, cabeza y víctima con motivos.
- [ ] Secuencia de más páginas que marcos elegibles produce víctimas predichas; reset vacía cola y no duplica entradas.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-014][MMU] Implementar Page Fault con Swap y reintento atómico

[Abrir issue #14](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/14)

Responsable: **Marcelo**. Reviewer: **Joshep**. Prioridad: P0. Esfuerzo: 5 puntos.
Fase: F2 · Núcleo (30 oct-2 nov). Estado inicial: Backlog.
Rama: `feature/marcelo/mmu-page-fault`. Rúbrica: G1,G3 + I1/I2.
Dependencias: P2-005, P2-008, P2-011, P2-012, P2-013.

- [ ] P=0 suspende instrucción, obtiene marco, escribe víctima sucia en Swap y trae exactamente 32 B.
- [ ] Actualiza P/PFN/Dirty/Reference y ambas entradas de tabla sin alias entre páginas; víctima limpia no se escribe innecesariamente.
- [ ] Reanuda exactamente el acceso fallido sin doble incremento de PC, doble escritura ni doble consumo de KBD; adjuntar traza completa.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-015][MMU] Implementar bits Dirty/Reference e invalidación al reutilizar marcos

[Abrir issue #15](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/15)

Responsable: **Joshep**. Reviewer: **Cristian**. Prioridad: P0. Esfuerzo: 5 puntos.
Fase: F2 · Núcleo (30 oct-2 nov). Estado inicial: Backlog.
Rama: `feature/joshep/mmu-coherencia`. Rúbrica: G2,G3 + I1/I2.
Dependencias: P2-003, P2-011, P2-014.

- [ ] Todas las lecturas/fetch marcan Reference; escrituras marcan Dirty incluso con hit de caché y respetan E/S.
- [ ] Antes de reutilizar un marco se invalidan o sincronizan L1I/L1D/L2 según políticas y no se sirven bytes de la víctima.
- [ ] Probar escritura→desalojo→recarga y hit caliente→Page Fault→lectura nueva; verificar bytes y tabla contra modelo esperado.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-016][L1I] Implementar L1I de 8 B para fetch exclusivo

[Abrir issue #16](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/16)

Responsable: **Cristian**. Reviewer: **Joshep**. Prioridad: P0. Esfuerzo: 5 puntos.
Fase: F2 · Núcleo (30 oct-2 nov). Estado inicial: Backlog.
Rama: `feature/cristian/cache-l1i`. Rúbrica: G1,G2 + I1/I2.
Dependencias: P2-003, P2-008, P2-011.

- [ ] Una línea válida de 8 B con tag físico/offset; solo fetch la utiliza y lecturas de datos no la consultan.
- [ ] Miss solicita línea a L2 por contrato y hit devuelve byte correcto; fetch cruzando frontera usa ambas líneas/páginas correctamente.
- [ ] Verificar acceso frío/repetido, salto fuera de línea e invalidación tras recarga de marco o edición de programa.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-017][L1D] Implementar L1D de 8 B para operandos

[Abrir issue #17](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/17)

Responsable: **Marcelo**. Reviewer: **Cristian**. Prioridad: P0. Esfuerzo: 5 puntos.
Fase: F2 · Núcleo (30 oct-2 nov). Estado inicial: Backlog.
Rama: `feature/marcelo/cache-l1d`. Rúbrica: G1,G2 + I1/I2.
Dependencias: P2-003, P2-008, P2-011.

- [ ] Una línea de datos de 8 B; cargas y almacenes respetan política de escritura/asignación acordada.
- [ ] Hit/miss consultan L2 solo cuando corresponde; registros y memoria reciben bytes correctos a través de buses.
- [ ] Probar lectura repetida, escritura y lectura posterior, límites y bypass completo de direcciones KBD/LCD.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-018][L2] Implementar L2 unificada de 32 B y reemplazo FIFO

[Abrir issue #18](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/18)

Responsable: **Joshep**. Reviewer: **Marcelo**. Prioridad: P0. Esfuerzo: 5 puntos.
Fase: F2 · Núcleo (30 oct-2 nov). Estado inicial: Backlog.
Rama: `feature/joshep/cache-l2`. Rúbrica: G1,G2 + I1/I2.
Dependencias: P2-003, P2-008, P2-010, P2-011.

- [ ] Cuatro líneas de 8 B con válido/tag y cola FIFO independiente del FIFO de páginas; capacidad total exacta 32 B.
- [ ] Miss de L1I/L1D consulta L2; miss L2 trae bytes de RAM a través del bus; hits no duplican lecturas de RAM.
- [ ] Acceder cinco bloques fuerza víctima conocida; validar hits compartidos entre instrucciones/datos y coherencia de la inclusión si se adopta.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-019][CACHE] Integrar escrituras, bypass E/S e invalidación multinivel

[Abrir issue #19](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/19)

Responsable: **Cristian**. Reviewer: **Marcelo**. Prioridad: P0. Esfuerzo: 3 puntos.
Fase: F3 · Integración (3-5 nov). Estado inicial: Backlog.
Rama: `feature/cristian/cache-coherencia`. Rúbrica: G2,G3,G4 + I1/I2.
Dependencias: P2-015, P2-016, P2-017, P2-018.

- [ ] Escrituras mantienen coherencia L1D/L2/RAM/Swap según contrato; fetch no lee instrucciones obsoletas.
- [ ] Carga de programa, edición de RAM y reemplazo de marco invalidan todas las líneas afectadas sin borrar vecinos.
- [ ] Probar alias físicos, acceso E/S no cacheable y modificación seguida de lectura/fetch con valores esperados.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-020][CACHE] Implementar métricas Hit/Miss y tasa por nivel

[Abrir issue #20](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/20)

Responsable: **Marcelo**. Reviewer: **Joshep**. Prioridad: P0. Esfuerzo: 3 puntos.
Fase: F3 · Integración (3-5 nov). Estado inicial: Backlog.
Rama: `feature/marcelo/cache-metricas`. Rúbrica: G2 + I1/I2.
Dependencias: P2-016, P2-017, P2-018.

- [ ] Contadores separados L1I/L1D/L2 contabilizan una búsqueda por acceso efectivo; L2 solo cuenta cuando se consulta.
- [ ] Hit Rate=hits/(hits+misses) con denominador cero definido; reset reinicia coherentemente estado y contadores.
- [ ] Una secuencia manual fría/caliente y reintento tras Page Fault coincide con expectativas documentadas sin doble conteo.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-021][CACHE] Animar flujo L1I/L1D↔L2↔RAM e indicadores

[Abrir issue #21](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/21)

Responsable: **Joshep**. Reviewer: **Cristian**. Prioridad: P0. Esfuerzo: 3 puntos.
Fase: F3 · Integración (3-5 nov). Estado inicial: Backlog.
Rama: `feature/joshep/cache-animacion`. Rúbrica: G1,G2,G7 + I1/I2.
Dependencias: P2-009, P2-016, P2-017, P2-018, P2-020.

- [ ] Cada hit/miss resalta nivel, línea, tag y transferencia correspondiente al mismo micro-paso.
- [ ] Mostrar relleno, reemplazo y actualización de contadores; líneas inactivas no aparentan transferencias.
- [ ] Step permite inspección y Run conserva orden; comparar eventos con pantallas para lectura, escritura y fetch.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-022][KBD] Implementar cola circular KBD de 8 B y entrada interactiva

[Abrir issue #22](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/22)

Responsable: **Cristian**. Reviewer: **Joshep**. Prioridad: P0. Esfuerzo: 5 puntos.
Fase: F3 · Integración (3-5 nov). Estado inicial: Backlog.
Rama: `feature/cristian/io-kbd`. Rúbrica: G1,G4 + I1/I2.
Dependencias: P2-002, P2-008, P2-010.

- [ ] Panel captura caracteres con codificación definida; ocho bytes reales en RAM y punteros head/tail/count coherentes.
- [ ] IN publica el byte mediante En_KBD y el bus; cola vacía y desbordamiento tienen comportamiento explícito sin corrupción.
- [ ] Probar 0/1/8/9 caracteres, wrap-around y lectura interrumpida; consumo ocurre una vez al completar la transacción.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-023][LCD] Implementar LCD 8×1 y video buffer de 8 B

[Abrir issue #23](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/23)

Responsable: **Marcelo**. Reviewer: **Cristian**. Prioridad: P0. Esfuerzo: 5 puntos.
Fase: F3 · Integración (3-5 nov). Estado inicial: Backlog.
Rama: `feature/marcelo/io-lcd`. Rúbrica: G1,G4 + I1/I2.
Dependencias: P2-002, P2-008, P2-010.

- [ ] Ocho celdas visibles corresponden exactamente a ocho bytes reservados en RAM con conversión de caracteres documentada.
- [ ] OUT activa receptor Ld_LCD y actualiza la posición acordada a través del bus; sin Load no cambia el display.
- [ ] Probar escritura de 1/8/9 caracteres según política de cursor, reset y sincronía RAM↔LCD en Step/Run.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-024][IO] Integrar IN/OUT con CPU, MMU y bypass de caché

[Abrir issue #24](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/24)

Responsable: **Joshep**. Reviewer: **Marcelo**. Prioridad: P0. Esfuerzo: 5 puntos.
Fase: F3 · Integración (3-5 nov). Estado inicial: Backlog.
Rama: `feature/joshep/io-in-out`. Rúbrica: G1,G2,G3,G4,G5 + I1/I2.
Dependencias: P2-005, P2-014, P2-019, P2-022, P2-023.

- [ ] Ensamblado de operandos KBD/LCD y ejecución IN/OUT respetan mapa de memoria y señales IO.
- [ ] E/S utiliza buffers tri-estado y modifica cola/video reales de RAM; no deja líneas de caché inconsistentes.
- [ ] Probar eco byte a byte, entrada vacía y pausas durante E/S; traza identifica registro, dirección y En_KBD/Ld_LCD.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-025][ASM] Implementar parser, símbolos y diagnósticos del ensamblador

[Abrir issue #25](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/25)

Responsable: **Cristian**. Reviewer: **Marcelo**. Prioridad: P0. Esfuerzo: 5 puntos.
Fase: F3 · Integración (3-5 nov). Estado inicial: Backlog.
Rama: `feature/cristian/asm-parser`. Rúbrica: G5 + I1/I2.
Dependencias: P2-001, P2-002.

- [ ] Analizar registros AX..DX, inmediatos, etiquetas, saltos y operandos [KBD]/[LCD] según ISA documentada.
- [ ] Resolver etiquetas y validar rangos/operandos; errores indican línea y motivo sin cargar programa parcial.
- [ ] Probar programa válido, etiqueta duplicada/ausente, instrucción desconocida, overflow y sintaxis IN/OUT.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-026][LOADER] Implementar codificador y cargador a memoria virtual

[Abrir issue #26](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/26)

Responsable: **Marcelo**. Reviewer: **Joshep**. Prioridad: P0. Esfuerzo: 5 puntos.
Fase: F3 · Integración (3-5 nov). Estado inicial: Backlog.
Rama: `feature/marcelo/asm-cargador`. Rúbrica: G2,G3,G5 + I1/I2.
Dependencias: P2-002, P2-012, P2-015, P2-025.

- [ ] Codificar ISA y producir mapa fuente↔bytes; cargar en páginas virtuales respetando tamaño y zona E/S.
- [ ] Cargar valida todo antes de mutar estado; reinicia PC, tabla, FIFO y cachés de modo reproducible conforme al contrato.
- [ ] Probar carga multípágina, frontera 31/32 y programa demasiado grande; comparar bytes cargados y primer fetch.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-027][EDITOR] Crear catálogo de programas y editor ASM en celdas

[Abrir issue #27](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/27)

Responsable: **Joshep**. Reviewer: **Cristian**. Prioridad: P0. Esfuerzo: 5 puntos.
Fase: F3 · Integración (3-5 nov). Estado inicial: Backlog.
Rama: `feature/joshep/asm-editor`. Rúbrica: G5,G7 + I1/I2.
Dependencias: P2-001, P2-002, P2-025.

- [ ] Catálogo conserva al menos tres fuentes independientes y permite seleccionar, editar y guardar sin código hardcodeado.
- [ ] Botones Verificar y Cargar muestran diagnósticos del ensamblador y solo cargan fuente válida.
- [ ] Probar modificación, error de sintaxis, retorno al catálogo y persistencia entre ejecuciones; separar fuente de estado de CPU.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-028][DEMO] Crear demo aritmética con bucles AX/BX/CX/DX y flags

[Abrir issue #28](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/28)

Responsable: **Cristian**. Reviewer: **Joshep**. Prioridad: P0. Esfuerzo: 3 puntos.
Fase: F3 · Integración (3-5 nov). Estado inicial: Backlog.
Rama: `feature/cristian/demo-aritmetica`. Rúbrica: G5,I4 + I1/I2.
Dependencias: P2-004, P2-005, P2-026, P2-027.

- [ ] Fuente ASM utiliza sustancialmente los cuatro registros y un bucle/salto condicional con resultado calculado a mano.
- [ ] Catálogo permite editar y cargar; ejecución termina en HALT y conserva resultado esperado en registros/memoria.
- [ ] Adjuntar pasos/flags esperados y variante de una instrucción para defensa; repetir tras reset produce mismo resultado.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-029][DEMO] Crear demo de eco interactivo teclado→LCD

[Abrir issue #29](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/29)

Responsable: **Marcelo**. Reviewer: **Cristian**. Prioridad: P0. Esfuerzo: 3 puntos.
Fase: F3 · Integración (3-5 nov). Estado inicial: Backlog.
Rama: `feature/marcelo/demo-eco`. Rúbrica: G1,G4,G5,I4 + I1/I2.
Dependencias: P2-024, P2-026, P2-027.

- [ ] Programa lee con IN y escribe con OUT usando DX y demás registros cuando corresponde; espera entrada sin bloquear la interfaz.
- [ ] Texto de hasta ocho caracteres aparece progresivamente en LCD y se observan cola, video RAM y señales tri-estado.
- [ ] Adjuntar recorrido de prueba con entrada vacía, ocho bytes y reinicio; no sustituir eco por actualización directa de UI.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-030][DEMO] Crear demo de accesos dispersos, Page Fault y misses

[Abrir issue #30](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/30)

Responsable: **Joshep**. Reviewer: **Marcelo**. Prioridad: P0. Esfuerzo: 3 puntos.
Fase: F3 · Integración (3-5 nov). Estado inicial: Backlog.
Rama: `feature/joshep/demo-memoria`. Rúbrica: G1,G2,G3,G5,I4 + I1/I2.
Dependencias: P2-014, P2-019, P2-020, P2-026, P2-027.

- [ ] Fuente accede a más páginas que marcos elegibles y más líneas que capacidad de caché; explicar secuencia prevista.
- [ ] Incluye escritura que ensucia una página, desalojo FIFO, guardado Swap y recarga con byte preservado.
- [ ] Registrar víctimas, conteos hit/miss esperados y traza paso a paso; resultado es determinista con reset y direcciones respetan E/S.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-031][UI] Diseñar panel Sheets, identidad del equipo y controles

[Abrir issue #31](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/31)

Responsable: **Cristian**. Reviewer: **Marcelo**. Prioridad: P1. Esfuerzo: 3 puntos.
Fase: F3 · Integración (3-5 nov). Estado inicial: Backlog.
Rama: `feature/cristian/ui-panel-identidad`. Rúbrica: G7 + I1/I2.
Dependencias: P2-001, P2-002, P2-006.

- [ ] Acordar nombre/logotipo oficiales con los tres; integrarlos en hoja, documentación y material de presentación.
- [ ] Organizar CPU, buses, memorias, cachés, E/S y editor con leyenda accesible y formatos legibles.
- [ ] Step/Run/Pause/Reset muestran modo actual y evitan acciones incompatibles; walkthrough en pantalla de tamaño habitual.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-032][UI] Animar Page Fault, tabla interactiva y transferencia de 32 B

[Abrir issue #32](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/32)

Responsable: **Marcelo**. Reviewer: **Joshep**. Prioridad: P1. Esfuerzo: 3 puntos.
Fase: F3 · Integración (3-5 nov). Estado inicial: Backlog.
Rama: `feature/marcelo/ui-page-fault`. Rúbrica: G3,G7 + I1/I2.
Dependencias: P2-011, P2-013, P2-014, P2-015.

- [ ] Page Fault se resalta rojo y muestra VPN/offset/PFN, víctima, Dirty, Swap y cola FIFO en secuencia real.
- [ ] Tabla permite inspeccionar entradas y editar valores solo mediante acciones validadas que preserven contratos y coherencia.
- [ ] Mostrar transferencia completa de 32 B y reanudación; Step permite pausar en cada fase sin perder estado.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-033][UI] Animar cables, buffers High-Z y señales por micro-paso

[Abrir issue #33](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/33)

Responsable: **Joshep**. Reviewer: **Cristian**. Prioridad: P1. Esfuerzo: 3 puntos.
Fase: F3 · Integración (3-5 nov). Estado inicial: Backlog.
Rama: `feature/joshep/ui-buses`. Rúbrica: G1,G7 + I1/I2.
Dependencias: P2-007, P2-008, P2-009, P2-031.

- [ ] Representar caminos internos/externos y distinguir emisor Enable, receptores Load y buffers en Z.
- [ ] Cada cable activo coincide con la traza del motor y micro-palabra, incluyendo KBD/LCD y acceso a caché.
- [ ] Modo lento/Step conserva legibilidad; contención se muestra como error y no como transferencia válida.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-034][TEST] Validar CPU, ISA y buses con casos límite

[Abrir issue #34](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/34)

Responsable: **Cristian**. Reviewer: **Joshep**. Prioridad: P0. Esfuerzo: 3 puntos.
Fase: F4 · Validación (6-7 nov). Estado inicial: Backlog.
Rama: `feature/cristian/test-cpu-buses`. Rúbrica: G1,G5 + I1/I2.
Dependencias: P2-004, P2-005, P2-007, P2-008, P2-009, P2-028.

- [ ] Suite comprueba flags, salto tomado/no tomado, bucle, HALT y cuatro registros con valores esperados independientes.
- [ ] Incluye sin emisor, un emisor, dos emisores y Load deshabilitado en cada segmento representativo.
- [ ] Relacionar fallos con issue/PR y adjuntar traza; no dar por válido un test que solo replica implementación.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-035][TEST] Validar MMU/FIFO/Swap y reservas de RAM

[Abrir issue #35](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/35)

Responsable: **Marcelo**. Reviewer: **Cristian**. Prioridad: P0. Esfuerzo: 3 puntos.
Fase: F4 · Validación (6-7 nov). Estado inicial: Backlog.
Rama: `feature/marcelo/test-memoria`. Rúbrica: G3,G4 + I1/I2.
Dependencias: P2-010, P2-011, P2-012, P2-013, P2-014, P2-015, P2-030.

- [ ] Casos frontera VA/PA, P=0, marcos libres/llenos y exclusión de reservas verifican tabla y FIFO esperados.
- [ ] Víctima limpia/sucia, recuperación de Swap y reintento comprueban 32 bytes completos y ausencia de efectos duplicados.
- [ ] Ejecutar demo dispersa desde estado limpio, conservar evidencia y documentar cada discrepancia corregida.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-036][TEST] Validar cachés, coherencia y E/S de extremo a extremo

[Abrir issue #36](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/36)

Responsable: **Joshep**. Reviewer: **Marcelo**. Prioridad: P0. Esfuerzo: 3 puntos.
Fase: F4 · Validación (6-7 nov). Estado inicial: Backlog.
Rama: `feature/joshep/test-cache-io`. Rúbrica: G1,G2,G4 + I1/I2.
Dependencias: P2-019, P2-020, P2-021, P2-022, P2-023, P2-024, P2-029.

- [ ] Secuencia de accesos conocida produce contadores L1I/L1D/L2 exactos y conserva datos tras escritura/invalidate.
- [ ] Verificar que KBD/LCD no alteran caché y que cola/video de ocho bytes coinciden con bus y display.
- [ ] Cubrir reset, carga de programa, repetición y reemplazo de marco; adjuntar traza y resultado observado.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-037][DOC] Documentar arquitectura, ISA y micro-palabra en ES/EN

[Abrir issue #37](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/37)

Responsable: **Cristian**. Reviewer: **Marcelo**. Prioridad: P1. Esfuerzo: 3 puntos.
Fase: F4 · Documentación (6-7 nov). Estado inicial: Backlog.
Rama: `feature/cristian/docs-arquitectura`. Rúbrica: G1,G2,G3,G5,G6 + I1/I2.
Dependencias: P2-002, P2-003, P2-005, P2-009, P2-019.

- [ ] Completar documentos en docs/es y docs/en con mismos contenidos y términos revisados por otra persona.
- [ ] Diagramas Mermaid incluyen buses internos/externos, jerarquía, MMU/Swap y periféricos con flujos reales.
- [ ] Tabla ISA especifica opcode/bytes/operandos/flags y control word explica cada bit con ejemplo de microsecuencia real.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-038][DOC] Escribir manual bilingüe de instalación y uso en Sheets

[Abrir issue #38](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/38)

Responsable: **Marcelo**. Reviewer: **Joshep**. Prioridad: P1. Esfuerzo: 3 puntos.
Fase: F4 · Documentación (6-7 nov). Estado inicial: Backlog.
Rama: `feature/marcelo/docs-manual`. Rúbrica: G6,G7 + I1/I2.
Dependencias: P2-006, P2-027, P2-028, P2-029, P2-030, P2-031, P2-032, P2-033.

- [ ] Guía ES/EN reproduce copia/configuración Apps Script desde repo sin credenciales y con pasos verificables.
- [ ] Explica editor, carga, Step/Run/Reset, métricas, fallos y KBD/LCD con capturas de producto real.
- [ ] Otra persona sigue guía en su computadora y registra resultado; incluir enlace directo verificado cuando exista planilla.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-039][DOC] Construir matriz final de evidencia G1-G7 e I1-I4

[Abrir issue #39](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/39)

Responsable: **Joshep**. Reviewer: **Cristian**. Prioridad: P1. Esfuerzo: 3 puntos.
Fase: F4 · Documentación (6-7 nov). Estado inicial: Backlog.
Rama: `feature/joshep/docs-evidencia`. Rúbrica: G6,I1,I2,I3,I4 + I1/I2.
Dependencias: P2-034, P2-035, P2-036, P2-037, P2-038.

- [ ] README.md y README_EN.md enlazan arquitectura, ISA, micro-palabra, manual, Project y planilla verificada.
- [ ] Cada criterio tiene issues/PRs, prueba o captura reproducible y estado real, sin afirmar cumplimiento pendiente.
- [ ] Auditar contribuciones por alumno y revisiones; diferencias entre idiomas y enlaces rotos corregidas.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-040][DEFENSA] Preparar exposición de CPU/buses y ejercicio cruzado de memoria

[Abrir issue #40](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/40)

Responsable: **Cristian**. Reviewer: **Joshep**. Prioridad: P1. Esfuerzo: 3 puntos.
Fase: F5 · Defensa (8 nov). Estado inicial: Backlog.
Rama: `feature/cristian/defensa-cristian`. Rúbrica: I2,I3,I4 + I1/I2.
Dependencias: P2-028, P2-030, P2-034, P2-035, P2-037.

- [ ] Cristian explica buses/High-Z/micro-palabra con traza propia y también traduce VA→PA/FIFO de un módulo ajeno.
- [ ] Ensaya modificar instrucción o byte en vivo y verifica efecto en caché/memoria sin romper integración.
- [ ] Parte técnica ~6 min 40 s coordinada con compañeros; adjuntar guion, preguntas/respuestas y enlaces a PR personales.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-041][DEFENSA] Preparar exposición de MMU/Swap y ejercicio cruzado de caché

[Abrir issue #41](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/41)

Responsable: **Marcelo**. Reviewer: **Cristian**. Prioridad: P1. Esfuerzo: 3 puntos.
Fase: F5 · Defensa (8 nov). Estado inicial: Backlog.
Rama: `feature/marcelo/defensa-marcelo`. Rúbrica: I2,I3,I4 + I1/I2.
Dependencias: P2-029, P2-030, P2-035, P2-036, P2-037.

- [ ] Marcelo explica tabla, FIFO, víctima sucia y Page Fault; también predice hit/miss y control de un acceso ajeno.
- [ ] Ensaya modificación de código/memoria en vivo y muestra persistencia tras desalojo/recarga.
- [ ] Parte técnica ~6 min 40 s coordinada; adjuntar guion, preguntas/respuestas y ramas/PR personales verificables.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-042][DEFENSA] Preparar exposición de caché/E/S y ejercicio cruzado de buses

[Abrir issue #42](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/42)

Responsable: **Joshep**. Reviewer: **Marcelo**. Prioridad: P1. Esfuerzo: 3 puntos.
Fase: F5 · Defensa (8 nov). Estado inicial: Backlog.
Rama: `feature/joshep/defensa-joshep`. Rúbrica: I2,I3,I4 + I1/I2.
Dependencias: P2-021, P2-024, P2-029, P2-030, P2-034, P2-036.

- [ ] Joshep explica L1I/L1D/L2, métricas y eco KBD/LCD; también interpreta cada bit de una micro-palabra ajena.
- [ ] Ensaya cambio de instrucción/valor y demuestra invalidación o resultado de E/S con una traza real.
- [ ] Parte técnica ~6 min 40 s coordinada; adjuntar preguntas/respuestas, guion y evidencia de contribuciones personales.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-043][INTEGRACION] Ejecutar regresión de las tres demos en planilla compartida

[Abrir issue #43](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/43)

Responsable: **Cristian**. Reviewer: **Marcelo**. Prioridad: P0. Esfuerzo: 2 puntos.
Fase: F5 · Entrega (8 nov). Estado inicial: Backlog.
Rama: `feature/cristian/integracion-regresion`. Rúbrica: G1,G2,G3,G4,G5,G7 + I1/I2.
Dependencias: P2-028, P2-029, P2-030, P2-034, P2-035, P2-036, P2-038.

- [ ] Desde reset ejecutar las tres demos en Step y Run en la misma planilla candidata, registrando resultados esperados/obtenidos.
- [ ] Comprobar eventos, registros, buses, tabla, cachés, E/S y animación sincronizados; no aceptar módulos probados solo por separado.
- [ ] Resolver bloqueos con issues y PR revisados y repetir casos afectados; enlazar evidencia de la ejecución final.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-044][ENTREGA] Verificar acceso a Sheets y preparar candidata develop→main

[Abrir issue #44](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/44)

Responsable: **Marcelo**. Reviewer: **Joshep**. Prioridad: P0. Esfuerzo: 2 puntos.
Fase: F5 · Entrega (8 nov). Estado inicial: Backlog.
Rama: `feature/marcelo/entrega-candidata`. Rúbrica: G6,I2 + I1/I2.
Dependencias: P2-037, P2-038, P2-039, P2-043.

- [ ] Enlace directo de planilla funciona desde cuenta de otro integrante, con acceso de evaluación acordado sin publicar datos privados innecesarios.
- [ ] PR develop→main revisado incluye regresión y documentación ES/EN; congelar versión candidata antes del cierre.
- [ ] Anotar versión/commit y procedimiento de restauración; no integrar defectos conocidos críticos ni afirmar despliegue antes de verificarlo.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-045][DEFENSA] Coordinar ensayo TFG 20+10 min y logística del equipo

[Abrir issue #45](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/45)

Responsable: **Joshep**. Reviewer: **Cristian**. Prioridad: P0. Esfuerzo: 2 puntos.
Fase: F5 · Entrega (8 nov). Estado inicial: Backlog.
Rama: `feature/joshep/defensa-ensayo`. Rúbrica: I3,I4,G7 + I1/I2.
Dependencias: P2-031, P2-040, P2-041, P2-042, P2-043, P2-044.

- [ ] Ensayo cronometrado: 20 min exposición/demo de los tres programas y 10 min preguntas individuales de código/memoria.
- [ ] Cada integrante tiene tiempo y contenido sustancial; practicar cambio en vivo y transición de pantallas sin leer diapositivas.
- [ ] Confirmar nombre/logo, indumentaria formal del equipo, equipos, conectividad y alternativa local de evidencia; registrar mejoras.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-046][GITFLOW] Auditar trazabilidad y aportes técnicos de Cristian

[Abrir issue #46](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/46)

Responsable: **Cristian**. Reviewer: **Joshep**. Prioridad: P1. Esfuerzo: 2 puntos.
Fase: F5 · Auditoría (antes del 9 nov 10:00). Estado inicial: Backlog.
Rama: `feature/cristian/auditoria-cristian`. Rúbrica: I1,I2,I3,I4 + I1/I2.
Dependencias: P2-039, P2-040, P2-043, P2-044, P2-045.

- [ ] Verificar issues movidas durante trabajo real, ramas feature/cristian/*, commits semánticos y PR revisados.
- [ ] Contrastar carga técnica con aportes reales y dominio cruzado; documentar brechas sin fabricar historial.
- [ ] Antes del cierre comprobar enlaces finales y evidencias individuales; no hacer commits ni movimientos posteriores al 9/11 10:00.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-047][GITFLOW] Auditar trazabilidad y aportes técnicos de Marcelo

[Abrir issue #47](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/47)

Responsable: **Marcelo**. Reviewer: **Cristian**. Prioridad: P1. Esfuerzo: 2 puntos.
Fase: F5 · Auditoría (antes del 9 nov 10:00). Estado inicial: Backlog.
Rama: `feature/marcelo/auditoria-marcelo`. Rúbrica: I1,I2,I3,I4 + I1/I2.
Dependencias: P2-039, P2-041, P2-043, P2-044, P2-045.

- [ ] Verificar issues movidas durante trabajo real, ramas feature/marcelo/*, commits semánticos y PR revisados.
- [ ] Contrastar implementación/pruebas/documentación con aportes de compañeros y registrar brechas reales.
- [ ] Confirmar preparación para preguntas y código en vivo; auditoría y correcciones deben ocurrir antes del cierre oficial.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.

## [P2-048][GITFLOW] Auditar trazabilidad y aportes técnicos de Joshep

[Abrir issue #48](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues/48)

Responsable: **Joshep**. Reviewer: **Marcelo**. Prioridad: P1. Esfuerzo: 2 puntos.
Fase: F5 · Auditoría (antes del 9 nov 10:00). Estado inicial: Backlog.
Rama: `feature/joshep/auditoria-joshep`. Rúbrica: I1,I2,I3,I4 + I1/I2.
Dependencias: P2-039, P2-042, P2-043, P2-044, P2-045.

- [ ] Verificar issues movidas durante trabajo real, ramas feature/joshep/*, commits semánticos y PR revisados.
- [ ] Contrastar implementación/pruebas/documentación con reparto previsto y verificar revisión de módulos ajenos.
- [ ] Comprobar enlaces de evidencia, defensa ensayada y estado final del tablero antes del cierre; sin inventar aprobaciones.
- [ ] PR y evidencia enlazados, revisión ajena completada; cerrar y mover a Done solo después de validación.
