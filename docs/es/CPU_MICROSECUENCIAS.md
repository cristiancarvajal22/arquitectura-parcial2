# Microsecuencias de CPU · P2-005

Responsable: Marcelo.
Estado: diseño inicial; implementación pendiente.

Referencias:
- Contrato compartido: CONTRATOS.md.
- ISA propuesta: ../ISA_MAPA_MEMORIA.md.
- Señales y políticas de memoria: pendiente de integrar con #3.

## Objetivo

Cada STEP avanza un micro-paso de la CPU.
Los registros, señales y eventos pertenecen al estado compartido.
Las celdas de Sheets muestran ese estado, sin ejecutar instrucciones
ni modificar memoria por su cuenta.

## Secuencia de búsqueda de instrucciones

Se utiliza provisionalmente el formato de cuatro bytes propuesto en #2.

| Paso | Acción |
|---|---|
| F0 | Conservar dirección inicial y preparar IR para una nueva instrucción |
| F1 | Transferir PC a MAR mediante En_PC y Ld_MAR |
| F2 | Emitir una única petición fetch de un byte en MAR |
| F3 | Esperar si la petición devuelve pending |
| F4 | Capturar el byte de respuesta en MDR mediante el bus correspondiente |
| F5 | Transferir MDR al siguiente byte de IR mediante En_MDR y Ld_IR |
| F6 | Si faltan bytes, preparar la siguiente dirección y repetir desde F1 |
| F7 | Validar y decodificar la instrucción completa |

Cada transferencia ocurre mediante señales y un único emisor por segmento.
La actualización de PC también requiere una microoperación trazable.
Las señales exactas de respuesta y avance se coordinan con #3.

Los bytes de opcode y operandos se solicitan como instrucciones,
utilizando fetch y L1I.

## Decodificación

Comprobar opcode, registros, campos reservados y dirección.
Una instrucción inválida produce un diagnóstico sin confirmar cambios
parciales del micro-paso rechazado.

Seleccionar la microsecuencia de la instrucción.
IR conserva sus bytes y su representación decodificada.

## Ejecución prevista

| Grupo | Secuencia conceptual |
|---|---|
| MOV | Seleccionar fuente, transferir por bus y cargar destino |
| ALU | Capturar operandos, calcular y transferir resultado; actualizar flags según ISA |
| CMP | Capturar operandos y actualizar flags sin escribir el registro destino |
| LOAD | Preparar dirección, solicitar lectura, esperar, capturar respuesta y cargar destino |
| STORE | Preparar dirección y dato, solicitar escritura y esperar su confirmación |
| JMP/JZ/JNZ | Evaluar condición y cargar PC con destino o continuar secuencialmente |
| IN | Solicitar carácter, esperar y cargar destino una sola vez |
| OUT | Solicitar salida y confirmar un único efecto sobre LCD |
| NOP | Continuar con la siguiente instrucción |
| HALT | Detener la ejecución conservando PC en la dirección de HALT |

Esta tabla resume grupos; la implementación debe desglosar cada opcode
en micro-pasos trazables.

## Esperas y continuación

- Solo puede existir una petición activa.
- La petición pendiente conserva requestId, etapa y datos ya obtenidos.
- pending no reinicia la instrucción ni vuelve a emitir la solicitud.
- resume utiliza el mismo requestId de la petición pendiente y la revisión actual.
- Una respuesta se captura una sola vez.
- No repetir escrituras, actualizaciones de flags ni consumo de teclado.
- Los micro-pasos de mantenimiento de memoria pueden confirmarse mientras
  el efecto de la instrucción permanece pendiente.
- Un rechazo conserva el último estado confirmado.

## Pruebas que deben implementarse

1. Fetch completo: un micro-paso por STEP.
2. Instrucción que cruza una línea de caché.
3. Instrucción que cruza una página.
4. Operaciones sobre AX, BX, CX y DX.
5. Salto tomado y no tomado.
6. Bucle con cantidad de iteraciones conocida.
7. LOAD suspendido por memoria y reanudado sin duplicación.
8. IN suspendido y reanudado consumiendo un solo carácter.
9. OUT confirmado una sola vez.
10. HALT seguido de STEP sin nueva ejecución.

## Pendientes de integración

- Confirmar decisiones de ISA de #2.
- Incorporar señales y combinaciones legales de #3.
- Implementar CPU en src/cpu/.
- Ejecutar pruebas y añadir evidencia real.

Este documento describe el diseño; no demuestra todavía una CPU funcional.
