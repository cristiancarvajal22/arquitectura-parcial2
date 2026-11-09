# Micro-palabra y buffers — P2-009

Implementación asistida por IA. Usa la propuesta de 30 bits del PR #60, todavía
pendiente de acuerdo del equipo; nunca cambia profile.status a ready.

`microWordView(event)` valida un evento committed de transferencia y produce
word, binary (b29..b0) y 30 filas bit/señal/valor/componente/acción. Verifica señales
booleanas completas, coherencia de emisores/receptores, dirección/datos dentro de
su ancho, High-Z, combinaciones de control y palabra numérica cuando no es null.
Si es null calcula una proyección marcada como derivada, sin modificar el evento.
Los buses de control no se arbitran aquí: esa validación pertenece al motor.

Bits pares 0..22: Enable de AX,BX,CX,DX,PC,IR,MAR,MDR,ALU,RAM,KBD,LCD.
El bit siguiente a cada Enable es su Load. Bits 24..29: Read, Write, Clock, IO,
Mem_R, Mem_W. Enable conecta una salida; Load captura una entrada. Un Enable
apagado muestra High-Z; un Load apagado muestra HOLD: una carga no es un buffer
emisor. Un emisor inactivo no obliga a que todo el bus esté en Z si otro conduce.

## Seis capturas sintéticas de un micro-paso

| Caso | Bits activos | Decimal |
|---|---|---:|
| Fetch PC→MAR | 8 En_PC, 13 Ld_MAR, 26 Clock | 67117312 |
| ALU→AX | 16 En_ALU, 1 Ld_AX, 26 Clock | 67174402 |
| Read RAM→MDR | 18 En_RAM, 15 Ld_MDR, 24 Read, 28 Mem_R, 26 Clock | 352616448 |
| Write MDR→RAM | 14 En_MDR, 19 Ld_RAM, 25 Write, 29 Mem_W, 26 Clock | 638074880 |
| IN KBD→MDR | 20 En_KBD, 15 Ld_MDR, 24 Read, 27 IO, 26 Clock | 219185152 |
| OUT MDR→LCD | 14 En_MDR, 23 Ld_LCD, 25 Write, 27 IO, 26 Clock | 243286016 |

Los casos son transferencias aisladas, no instrucciones completas: fetch requiere
más pasos y la MMU/caché no se simulan aquí. `tests/unit/microword.test.cjs`
construye cada captura y comprueba valor, bits, señales y ausencia de mutación.
También proyecta el evento PC→MAR existente del contrato del repositorio.

## Google Sheets

Copiar microword.js y microword-sheet.js a archivos .gs de un proyecto vinculado.
Después de confirmar un evento de transferencia llamar `microWordRender(event)`.
Escribe la pestaña MICROPALABRA_P2_009: binario de 30 caracteres conservando ceros,
decimal, tabla completa y verde para bits activos. No cambia RAM, CPU ni señales.
La pestaña está reservada para esta vista. No pasar eventos administrativos del reloj.
El renderizador valida antes de dibujar; una falla de Sheets no revierte el motor:
se redibuja desde el último evento confirmado, sin repetir su ejecución.

Pendiente: aprobación de #3, conexión del motor y capturas de la hoja real para los
seis casos. La prueba de escritura/formato usa una hoja simulada, no una cuenta Google.

Prueba: `node --test tests/unit/microword.test.cjs`.
