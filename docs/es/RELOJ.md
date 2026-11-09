# Reloj y persistencia — P2-006

Núcleo probado en Node y conectado en pruebas al coordinador real de buses.
Integración con motor completo y ejecución real en Apps Script pendientes.

## Archivos y uso

- `src/core/clock.js`: coordinador que recibe almacenamiento, bloqueo, motor y reset.
- `src/core/clock-store.js`: adaptador a ScriptProperties y ScriptLock.
- `tests/unit/clock.test.cjs`: pruebas reproducibles con servicios simulados.

El motor es una función pura `motor(snapshot, request) -> Result`, compatible con
el contrato #1. Recibe requestId y expectedRevision. Debe ejecutar **un** micro-paso
acotado, devolver state/events y status completed/pending/rejected. Nunca escribe
celdas, consume periféricos externos ni persiste por su cuenta. El adaptador del
motor debe continuar `execution.pendingRequest` cuando haya una petición pendiente;
el ID del comando del reloj no reemplaza el ID de esa transacción de memoria/E/S.
BusMicroStep del PR #52 solo cubre transferencias internas: aún no es el motor completo.

```javascript
// En Apps Script, tras conectar motorPaso y crearReset con los módulos del equipo:
var controlador = clockAppsScript(motorPaso, crearReset);
var inicial = controlador.initialize(); // No borra una sesión existente.
var resultado = controlador.dispatch({
  epoch: inicial.epoch,
  sequence: inicial.sequence + 1,
  expectedRevision: inicial.state.revision,
  action: 'step'
});
```

Acciones: step, run (limit entero 1..8), pause, reset. Step requiere pausar Run.
La UI envía un lote, recibe estado/eventos, anima y recién entonces solicita otro.
No hay bucle infinito, temporizador de servidor ni espera activa. Pausa y reset
se atienden entre lotes. Una ejecución simultánea recibe BUSY y debe reintentar
la misma solicitud; nunca inventar una secuencia nueva para un doble clic.

## Confirmación y recuperación

Un solo snapshot alimenta motor y vista. El reloj no incrementa los ciclos que ya
incrementa el motor. Los cambios de modo producen eventos execution-control sin
transferencias de bus. Estos eventos no deben enviarse al visor de micro-palabra.
Un lote se calcula sobre copias y se publica completo: si un paso falla, se descarta
el lote aún no confirmado. Pending termina el lote y conserva la espera.

El sobre persistido contiene epoch, sequence, state y el último recibo. Un reintento
idéntico devuelve el recibo sin ejecutar de nuevo. Secuencias/revisiones antiguas se
rechazan. Reset obtiene un snapshot determinista del resetter, inicia otra epoch e
invalida comandos de la sesión anterior. No carga un programa de forma oculta.

ScriptLock protege lectura, cálculo y publicación; se libera mediante finally.
El almacenamiento usa dos slots con hasta 20 fragmentos ASCII de 7000 caracteres.
Primero escribe el slot inactivo y al final cambia HEAD. Un fallo antes de HEAD
conserva el snapshot anterior. Si se pierde la respuesta después de guardar, repetir
la misma solicitud recupera el recibo. No borrar propiedades para solucionar errores.
Un payload mayor que 140000 caracteres se rechaza antes de escribir. No debe haber
otros escritores de estas claves que omitan el bloqueo.

## Límites y prueba manual pendiente

No se afirma que los servicios simulados reproduzcan todos los fallos del servicio
de Google. Probar en la planilla real antes de integrar: Step, Run de 8 pasos,
pausa/continuación, doble clic, reset durante espera de teclado y reapertura de sesión.
Un motor lento sigue siendo lento: cada callback debe estar acotado y no hacer red.
Las cuotas de Properties y ejecución son límites adicionales; no confundir estas
pruebas locales con validación de cuotas o de animaciones reales.

Fuentes oficiales:
- https://developers.google.com/apps-script/guides/services/quotas
- https://developers.google.com/apps-script/reference/lock/lock-service
- https://developers.google.com/apps-script/reference/properties/properties

Prueba: `node --test tests/unit/clock.test.cjs`.

## Integración con buses y micro-palabra

`python3 scripts/fetch-test-deps.py clock-bus` descarga cinco dependencias fijadas.
`node --test tests/unit/clock.test.cjs tests/integration/clock-bus.test.cjs`: 16 aprobadas.
Se utiliza BusMicroStep/BusArbiter de #52 y el visor de #62. Se comprueban PC→MAR,
Run de ocho pasos, pausa, reintento tras reapertura, contención, reset y fallo de publicación.
El perfil ready y el cableado son configuración de prueba; no aprueban el perfil de producción.
Properties/Lock siguen siendo dobles locales. Falta probar la hoja real y memoria/E/S.
