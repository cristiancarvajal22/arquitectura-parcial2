# Contrato de estado e interfaces · P2-001

Estado: **propuesta para revisión**, sin lógica del simulador implementada.
Responsable de la tarea: Cristian. Relacionada con [#1](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/1).
[English](../en/CONTRACTS.md).

## Alcance y decisiones pendientes

Este contrato define una representación compartida por CPU, buses, memoria,
cachés, E/S y la hoja. Un snapshot describe el estado confirmado completo; las
animaciones consumen eventos de ese mismo estado. No existe un estado de CPU
independiente en las celdas de Google Sheets.

Los valores obligatorios de [ARQUITECTURA.md](../ARQUITECTURA.md) se conservan:
cuatro registros de 8 bits, 512 direcciones virtuales, RAM de 256 bytes,
16 páginas de 32 bytes, ocho marcos, L1I/L1D de 8 bytes, L2 de 32 bytes,
y dos reservas de ocho bytes para teclado y LCD **dentro de RAM**.

Pendiente de revisión, sin afirmar acuerdos del equipo:

- Marcelo (#2): codificación ISA, longitud máxima de IR, semántica de flags,
  anchuras finales PC/MAR, direcciones KBD/LCD y páginas/marcos protegidos.
- Joseph (#3): escritura/asignación de cachés, vector y codificación binaria
  de señales, anchura de buses de control y secuencias de acceso.
- Marcelo y Joseph: revisar este contrato y sus ejemplos en el PR. No se
  considera cumplido el criterio de revisión hasta que ambos lo comprueben.

Las anchuras de 9 bits para PC/MAR y el perfil de ejemplos son propuestas.
El perfil ilustrativo reserva PA 240..247 para KBD y 248..255 para LCD;
VPN 15 se fija a PFN 7 (VA 480..511). Todo el marco 7 queda excluido de FIFO,
incluidos sus 16 bytes sin periférico. Quedan siete marcos reemplazables.
No se deben implementar estas ubicaciones como constantes hasta resolver #2.
Las políticas de escritura y la codificación de control permanecen `null`
hasta resolver #3; `null` significa pendiente, nunca una política implícita.

## Representación única · schemaVersion 1

Todo dato es JSON: objetos, listas, cadenas, enteros, booleanos y `null`.
No usar funciones, referencias circulares, Map/Set, BigInt, NaN ni undefined.
Los arrays guardan números decimales; hex/binario son formatos de presentación.
Los valores se validan **antes** de cambiar estado; no truncar direcciones,
convertir cadenas en números ni aplicar módulo para ocultar entradas inválidas.

- `schemaVersion`: versión del formato. Un consumidor rechaza versiones distintas.
- `profile`: tamaños, anchuras, mapa de E/S, marcos fijados, políticas y estado
  de las decisiones. `status: "proposal"` impide Run/Step de producción.
- `revision`: contador de commits de estado, empieza en 0. No es un commit Git.
- `cpu.registers`: AX, BX, CX, DX (0..255); `pc`, `mar` (0..511 en este
  perfil), `mdr` (0..255), `ir: {bytes, decoded}`. IR conserva bytes en orden
  de fetch; `decoded` es `null` hasta completar una instrucción válida.
- `cpu.flags`: ZF, CF, SF booleanos, inicialmente falsos. Las reglas por
  operación pertenecen a #2; este contrato no las inventa.
- `cpu.alu`: operandos A/B y resultado (bytes), operación nula en reposo.
- `cpu.control`: fase `idle`, micro-paso 0, palabra de control nula y señales
  nombradas. La palabra numérica solo se deriva cuando #3 fije los bits.
- `buses`: seis segmentos separados: `internalAddress` (9 bits, VA),
  `internalData` (8 bits), `internalControl` (ancho pendiente),
  `externalAddress` (8 bits, PA), `externalData` (8 bits) y
  `externalControl` (ancho pendiente). Cada uno tiene `widthBits`, `domain`,
  `level`, `value`, `drivers` y `receivers`. En reposo `level: "Z"`,
  `value: null`, listas vacías. Nunca representar Z como cero.
- `ram.bytes`: exactamente 256 bytes. Es la **única** copia autoritativa de
  cola KBD y video LCD. `ram.frames`: ocho descriptores PFN, VPN o `null`,
  y `pinned`; no duplican los bytes de RAM.
- `mmu.pages`: 16 entradas ordenadas por VPN, con `present`, `pfn`, `dirty`,
  `referenced`, `pinned`. Si no está presente: PFN nulo, Dirty/Reference falsos.
  No hay dos páginas presentes sobre un mismo marco en este contrato.
- `mmu.fifo`: PFN reemplazables por orden de entrada, sin duplicados. Un hit
  no reordena la cola. `mmu.fault`: nulo o `{requestId, vpn, victimPfn,
  stage, transferredBytes}`; una transferencia de página tiene 32 bytes.
- `swap.pages`: 16 listas de 32 bytes; respalda el espacio virtual completo.
  Para una página presente y sucia, RAM es más reciente que Swap. E/S no se
  copia a Swap como si fuese memoria ordinaria.
- `caches.l1i`, `l1d`: una línea cada una. `l2`: cuatro líneas de ocho bytes
  y `fifo` de índices válidos. Línea: `valid`, `tag`, `dirty`, `bytes`.
  `tag = floor(PA/8)`, offset `PA % 8`; tag nulo al invalidar.
  FIFO usa orden de inserción, no de último acceso.
- `io.keyboard`: `basePa`, `capacity: 8`, `head`, `tail`, `count`;
  índices 0..7, count 0..8. Vacío: head=tail=count=0. Lleno: count=8;
  head=tail por sí solo no distingue lleno de vacío. No guarda otro buffer.
- `io.lcd`: `basePa`, `length: 8`, `cursor: 0`. La vista se obtiene de
  RAM; el byte 0 se presenta vacío, no como un carácter visible.
- `clock`: `cycle`, `microStep`, `phase`; reset da 0, 0, `idle`.
- `execution`: `mode` (`idle`, `paused`, `running`, `halted`, `error`),
  `pendingRequest`, `lastError`; reset da `idle`, `null`, `null`.
- `metrics`: contadores de accesos L1I/L1D/L2 (`hits`, `misses`), fallos
  de página y micro-pasos confirmados, todos inicialmente cero.
- `lastEvent`: último evento confirmado o `null`. La historia completa se
  exporta aparte; no se acumula indefinidamente dentro del snapshot.

Cada endpoint de registro/periférico tiene señales Enable y Load con el
nombre `En_<endpoint>` y `Ld_<endpoint>`: AX/BX/CX/DX, PC, IR, MAR, MDR,
ALU, RAM, KBD, LCD. Se incluyen Read, Write, Clock, IO, Mem_R y Mem_W.
Todas empiezan en falso; las combinaciones legales se cierran en #3.
Que una señal exista no autoriza una operación que la ISA prohíba.

## Interfaces de acceso

Firmas conceptuales, sin implementaciones en esta tarea:

```text
snapshot(state) -> copia JSON independiente
reset(profile) -> Result
fetch(state, {requestId, expectedRevision, va, length}) -> Result
read(state, {requestId, expectedRevision, va}) -> Result
write(state, {requestId, expectedRevision, va, value}) -> Result
step(state, {requestId, expectedRevision}) -> Result
resume(state, {requestId, expectedRevision}) -> Result
```

`requestId` es una cadena única durante una ejecución. `expectedRevision`
debe coincidir con el estado observado. La capa de Apps Script serializa
operaciones con un bloqueo; un escritor con revisión antigua recibe
`STALE_REVISION`, sin escribir. No se ejecutan Step y Run simultáneamente.
Una API síncrona devuelve un resultado por micro-paso; la UI agenda el
siguiente. Ninguna operación espera activamente hasta completar una animación.

`read`/`write` operan sobre un byte; `fetch` devuelve una lista de `length`
bytes en orden, con length positivo y `va + length <= 512`.
Se rechazan VA negativa, no entera o mayor que 511, bytes fuera de 0..255,
longitud inválida y fetch en E/S. Un acceso se traduce por página **antes**
de consultar cachés. Un fetch que cruza línea/página se divide en accesos
correctamente traducidos; no se suma un offset a un PA de otro marco.
L1I solo recibe fetch, L1D solo datos. E/S evita todas las cachés, requiere
señal IO y endpoint autorizado; una escritura ordinaria no toca reservas.
Dirty/Reference se actualizan aun si hay hit según la operación y #3.

Resultados discriminados:

```text
completed: {status, requestId, state, events, value}
pending:   {status, requestId, state, events, reason}
rejected:  {status, requestId, error: {code, message, details}}
```

En `completed`, value es byte (read), lista de bytes (fetch) o null
(write/reset/step). `events` contiene los eventos confirmados, en orden.
`pending` indica Page Fault o espera de E/S; no significa error ni confirma
la instrucción. `execution.pendingRequest` conserva la petición y los bytes
ya obtenidos, destinos aún no escritos y etapa para reanudar.
`resume` usa **el mismo requestId**; un nuevo intento con ese ID no puede
consumir dos veces un carácter ni escribir dos veces LCD. La capa coordinadora
mantiene el resultado del último ID completado hasta iniciar otra petición;
solo se admite una petición activa. Un ID antiguo devuelve `STALE_REQUEST`.

Un `rejected` no devuelve un estado parcialmente modificado. El coordinador
conserva el snapshot anterior y devuelve el diagnóstico a la UI. La parada
del planificador tras el rechazo no altera registros, RAM, cachés, FIFO,
flags, contadores ni reloj. El diagnóstico es externo al snapshot rechazado.

Errores mínimos: `INVALID_PROFILE`, `OUT_OF_RANGE`, `INVALID_OPERAND`,
`BUS_CONTENTION`, `NO_BUS_DRIVER`, `IO_PROTECTED`, `FETCH_FROM_IO`,
`STALE_REVISION`, `STALE_REQUEST`, `UNKNOWN_REQUEST`, `HALTED`.
Los detalles deben identificar campo, valor y segmento/operación cuando aplique.

## Eventos y atomicidad

Cada evento contiene `schemaVersion`, `id`, `requestId`, `revisionBefore`,
`revisionAfter`, `cycle`, `microStep`, `phase`, `kind`, `signals`,
`controlWord`, `segments`, `va`, `pa`, `bytes`, `changes` y `result`.
`id` es único y monotónico dentro de la ejecución. `result` es `committed`
para un evento confirmado; el rechazo es un diagnóstico separado.
Cada segmento del evento identifica nombre, ancho, nivel, valor, emisor
o null y receptores. `changes` enumera rutas con valor anterior y nuevo;
excluye `lastEvent`, que recibe el propio evento sin referencias circulares.
No inventar VA/PA cuando el paso no tiene una dirección: usar null.

Orden de un micro-paso:

1. Validar petición, revisión, rangos, señales y **todos** los segmentos.
2. Resolver emisores: cero da Z; uno da bits; dos o más rechazan el paso
   completo, incluso si ambos emiten el mismo valor. Un Load sobre Z se
   rechaza; un receptor con Load falso conserva su valor.
3. Preparar cambios sobre una copia; validar traducción, E/S y coherencia.
4. Confirmar una sola vez estado, revisión y evento. Solo entonces animar.

Page Fault confirma micro-pasos de mantenimiento (Swap, transferencia de
32 bytes, tabla, FIFO, invalidación) pero deja pendiente el efecto de la
instrucción. Una víctima sucia se salva antes de reutilizar su marco; todas
las líneas físicas del marco se invalidan antes de reanudar el acceso.
Una cancelación/reintento no repite efectos ya confirmados. `pendingRequest`
describe la etapa alcanzada; un rechazo durante el mantenimiento preserva
el último estado confirmado, no revierte los micro-pasos anteriores.
Las animaciones no pueden avanzar la CPU ni escribir directamente en RAM.

## Reinicio determinista

Para el mismo perfil aprobado, reset produce siempre los mismos datos:
registros, flags, reloj, métricas, RAM y Swap a cero; IR vacío; señales
apagadas; buses Z; cachés inválidas y bytes cero; colas FIFO vacías;
sin peticiones, fallos, errores ni evento. KBD vacío y cursor LCD a cero.
Las páginas/marcos fijados por el perfil conservan su mapeo, no su contenido.
Las demás páginas quedan no presentes y los marcos libres.
`revision` vuelve a 0 en una **nueva ejecución**; la capa coordinadora
invalida sus IDs y resultados anteriores para que no se reusen tras reset.
No incluir hora de pared ni aleatoriedad en el snapshot de reset.
Cargar un programa es una operación posterior, no un efecto oculto de reset.

## Comprobación y cierre

Los [ejemplos JSON](../examples/core/README.md) son datos
ilustrativos del contrato, no evidencia de una CPU ni de una planilla funcional.
Para cerrar #1: comprobar los ejemplos, resolver decisiones cruzadas,
registrar revisión real de Marcelo y Joseph, e integrar el PR a develop.
Mientras falte revisión o integración, la tarjeta no debe figurar Done.

[Evidencia y pasos de comprobación](../evidence/P2-001.md).
