# Arbitraje de buses · primera entrega de #7

[English](../en/BUSES.md) · [Código](../../src/buses/arbiter.js) ·
[Demo ejecutable](../../examples/buses/pc-to-mar.cjs) · [Evidencia](../evidence/P2-007.md).

## Qué está implementado

`BusArbiter.transfer(state, wiring, signals, expectedRevision)` calcula una
transacción completa sobre una copia del estado recibido. No escribe en Sheets
ni conserva un segundo banco de registros. Los puertos señalan rutas existentes
del estado compartido: por ejemplo `['cpu', 'registers', 'AX']` o
`['ram', 'bytes', 248]`. Un receptor actualiza esa ubicación en el nuevo estado.

Un resultado `completed` contiene `state` y `event`. El coordinador puede
sustituir el estado anterior una sola vez después de validar el resto del
micro-paso. Un resultado `rejected` contiene únicamente un diagnóstico
`error`; no expone estado ni eventos parcialmente confirmados.
Los argumentos de entrada nunca se modifican, incluso cuando hay éxito.

## Configuración explícita

`wiring.segments` asigna un nombre a `{widthBits, domain}`. Los anchos son
enteros de 1 a 32 bits; no hay anchos implícitos. Los dominios permitidos son
`virtual`, `physical`, `data` y `control`. El ejemplo define seis segmentos:

- `internalAddress`: 9 bits virtuales, permite 0..511.
- `externalAddress`: 8 bits físicos, permite 0..255.
- `internalData` y `externalData`: 8 bits.
- `internalControl` y `externalControl`: **16 bits solo para las pruebas**;
  Joseph debe fijar los anchos reales en #3 antes de la integración.

`wiring.ports` contiene `{name, segment, path, widthBits}` por puerto. El nombre
debe ser único y la ruta debe existir. Los valores son enteros sin signo.
Un bus más ancho puede alimentar un receptor estrecho únicamente si el valor
cabe en él. Se rechaza overflow; nunca se truncan bits ni se convierten cadenas.
Dos receptores activos no pueden escribir la misma ruta en una transacción.
Los puertos no pueden apuntar a `revision` o `buses`, reservados al resultado.

La demo conecta PC/MAR al segmento de direcciones y los demás puertos al
segmento de datos para comprobar Enable/Load. Usa IR como un byte recibido
en `cpu.ir.bytes[0]`. No define una ISA ni el ensamblado de IR multibyte.
RAM[240] y RAM[248] son ubicaciones **ilustrativas** de KBD/LCD, pendientes
de #2. La conexión de ambos periféricos al bus interno es un montaje de
prueba; el recorrido externo definitivo y sus puentes pertenecen a #3.

## Reglas del paso

`signals` admite `En_<nombre>` y `Ld_<nombre>` booleanos. Una señal omitida
equivale a false; una desconocida o un valor como 1 se rechaza.
Read/Write/Clock/IO y la codificación de la micro-palabra corresponden al
coordinador, que debe pasar aquí solo las señales Enable/Load pertinentes.

1. Validar revisión, configuración, rutas y rangos antes de trabajar.
2. Muestrear todos los valores emisores del mismo estado anterior.
3. Sin emisor: nivel `Z`, valor null. Un receptor activo sobre Z es error.
4. Un emisor: propaga su valor a los receptores con Load=true; los demás
   conservan su valor. Puede haber varios receptores.
5. Dos o más emisores: `BUS_CONTENTION`, aunque transmitan el mismo valor.
   Se rechaza **todo** el paso, no solo el segmento conflictivo.
6. Validar todos los destinos y confirmar sus capturas juntas en una copia;
   incrementar `revision` una vez y producir un evento del módulo.

El resultado incluye los buses resueltos (`level`, `value`, `drivers`,
`receivers`, dominio y ancho). El evento registra revisión anterior/posterior,
señales normalizadas, segmentos y capturas con ruta, valor anterior y nuevo.
Un segmento sin receptores puede estar conducido; no altera registros.
La copia devuelta y el evento no comparten objetos modificables entre sí.

Errores: `INVALID_STATE`, `INVALID_WIRING`, `INVALID_SIGNALS`, `OUT_OF_RANGE`,
`STALE_REVISION`, `BUS_CONTENTION`, `NO_BUS_DRIVER` y `MULTIPLE_LOADS`.
La revisión evita aceptar un estado observado antiguo, pero **no reemplaza
el bloqueo de concurrencia** que deberá implementar el coordinador en Apps Script.

## Comprobar

Requiere Node.js con `node:test`; se comprobó con v24.18.0, sin dependencias:

```sh
node --test tests/unit/bus-arbiter.test.cjs tests/unit/bus-ports.test.cjs
node examples/buses/pc-to-mar.cjs
```

Resultado de la demo: MAR pasa de 0 a 300, revisión 0 → 1; el intento con
En_PC y En_MAR simultáneos devuelve `BUS_CONTENTION`, con estado original
intacto. La salida guardada está en la evidencia.

## Integración pendiente

Esta entrega prueba un núcleo independiente. Antes de cerrar #7 hacen falta:

- Resolver #1/#2/#3 y fijar cableado, anchos de control, mapeo y señales legales.
- Conectar el núcleo al estado aprobado, reloj, control y snapshot completo.
  El coordinador debe validar ISA, E/S y coherencia **antes de publicar** el
  resultado; este módulo no autoriza por sí mismo una escritura de memoria.
- Completar el evento global con ciclo, fase, ID de petición, VA/PA, bytes,
  micro-palabra y `lastEvent`. Aquí se entrega solo el evento local del bus.
- Implementar transacciones periféricas: En_KBD no consume un carácter por
  sí solo; LCD no avanza el cursor; RAM no actualiza cachés ni Dirty/Reference.
- Probar los módulos reales juntos y su visualización High-Z en Sheets,
  obtener revisión de otro compañero e integrar a develop.

El archivo se carga como `BusArbiter` global sin CommonJS; se verificó esa
forma de carga en Node VM. **No se desplegó ni ejecutó en Google Apps Script**.
La tarjeta permanece In Progress con un PR en borrador hasta la integración.
