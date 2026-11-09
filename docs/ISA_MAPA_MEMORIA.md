# ISA y mapa de memoria

Propuesta para la issue #2.
Responsable: Marcelo.
Estado: pendiente de revisión del equipo.

Este documento define la codificación que compartirán el ensamblador,
la CPU y el cargador. Las políticas de caché y las APIs se coordinan
con los contratos de las issues #1 y #3.

## 1. Registros y direcciones

| Elemento | Ancho | Uso |
|---|---|---|
| AX, BX, CX, DX | 8 bits | Datos entre 0 y 255 |
| PC | 9 bits | Dirección virtual de la próxima instrucción |
| MAR | 9 bits | Dirección virtual solicitada por la CPU |
| MDR | 8 bits | Byte transferido |
| IR | 32 bits lógicos | Instrucción completa: cuatro bytes |
| ZF, CF, SF | 1 bit cada uno | Estado de la ALU |
| Dirección física | 8 bits | Posición de RAM entre 0 y 255 |

IR se representa como un arreglo de cuatro bytes.
Se carga byte a byte mediante MDR y señales de control.
Esto no implica un bus de datos de 32 bits.

La MMU recibe direcciones virtuales de 9 bits y entrega direcciones
físicas de 8 bits. No se recortan PC ni MAR con máscaras de 8 bits.

## 2. Formato de instrucciones

Todas las instrucciones ocupan cuatro bytes:

[opcode, A, B, C]

Los códigos de registro son:

- AX = 0
- BX = 1
- CX = 2
- DX = 3

Los inmediatos de datos ocupan un byte: 0..255.

Las direcciones se codifican con:
- B = byte bajo.
- C = byte alto, cuyo único bit permitido es el bit 0.
- Dirección = B + 256 × C.

Ejemplo: dirección 300 = 012Ch.
B = 2Ch y C = 01h.

Los campos no utilizados deben valer cero.
Un opcode, registro o campo inválido detiene la CPU con un error visible.

## 3. Tabla ISA

Los opcodes se expresan en hexadecimal.
rd significa registro destino y rs registro fuente.

| Opcode | Instrucción | A | B | C | Flags |
|---|---|---|---|---|---|
| 00 | HALT | 0 | 0 | 0 | No cambia |
| 01 | NOP | 0 | 0 | 0 | No cambia |
| 10 | MOV rd, inmediato | rd | inmediato | 0 | No cambia |
| 11 | MOV rd, rs | rd | rs | 0 | No cambia |
| 20 | LOAD rd, [dirección] | rd | bajo | alto | No cambia |
| 21 | STORE [dirección], rs | rs | bajo | alto | No cambia |
| 30 | ADD rd, rs | rd | rs | 0 | ZF, CF, SF |
| 31 | SUB rd, rs | rd | rs | 0 | ZF, CF, SF |
| 32 | INC rd | rd | 0 | 0 | ZF, CF, SF |
| 33 | DEC rd | rd | 0 | 0 | ZF, CF, SF |
| 34 | CMP rd, rs | rd | rs | 0 | ZF, CF, SF |
| 35 | CMP rd, inmediato | rd | inmediato | 0 | ZF, CF, SF |
| 40 | AND rd, rs | rd | rs | 0 | ZF, SF; CF=0 |
| 41 | OR rd, rs | rd | rs | 0 | ZF, SF; CF=0 |
| 42 | XOR rd, rs | rd | rs | 0 | ZF, SF; CF=0 |
| 43 | NOT rd | rd | 0 | 0 | ZF, SF; conserva CF |
| 50 | JMP dirección | 0 | bajo | alto | No cambia |
| 51 | JZ dirección | 0 | bajo | alto | Consulta ZF |
| 52 | JNZ dirección | 0 | bajo | alto | Consulta ZF |
| 60 | IN rd, [KBD] | rd | 0 | 0 | No cambia |
| 61 | OUT [LCD], rs | rs | 0 | 0 | No cambia |

ADD, SUB, AND, OR y XOR guardan el resultado en rd.
CMP realiza la resta para actualizar flags, sin modificar registros.

Los resultados de datos se reducen a 8 bits:
resultado = valor AND 255.

ZF = 1 cuando el resultado de 8 bits es cero.
SF corresponde al bit 7 del resultado.
En suma, CF indica acarreo; en resta, indica préstamo.
INC y DEC siguen estas mismas reglas de suma/resta.

## 4. Ejecución y saltos

PC comienza en la dirección de entrada indicada por el cargador.

Durante fetch se conserva la dirección inicial de la instrucción.
Los cuatro bytes se obtienen mediante la jerarquía de memoria,
MDR y las señales de buses; después se valida la instrucción.

La siguiente dirección secuencial es dirección inicial + 4.
Un salto tomado la sustituye por su destino absoluto.
JZ salta si ZF=1; JNZ salta si ZF=0.

HALT deja la CPU detenida y conserva PC en la dirección de HALT.
Los STEP posteriores no modifican el estado arquitectónico.

No hay desbordamiento circular silencioso del PC.
Si no existe una próxima instrucción completa dentro del área
ejecutable, se informa un error antes de buscarla.

No se exige alineación a múltiplos de cuatro:
el cargador identifica las fronteras reales de las instrucciones.
Los saltos deben apuntar al inicio de una instrucción del programa.

## 5. Cruces de línea y página

El fetch obtiene cada byte por separado.

Si una instrucción comienza en 006h, ocupa 006h..009h:
cruza una línea de caché de 8 bytes.

Si comienza en 01Eh, ocupa 01Eh..021h:
cruza una página de 32 bytes.

Cada byte utiliza su dirección virtual y traducción correspondiente.
Las lecturas de opcode y operandos pertenecen al flujo de instrucciones
y utilizan L1I.

Un fallo de página conserva los bytes ya recibidos y el micro-paso
pendiente. La instrucción continúa sin repetir efectos confirmados.

## 6. Mapa físico: RAM de 256 bytes

| Direcciones físicas | Tamaño | Uso |
|---|---|---|
| 00h..DFh | 224 B | Marcos 0..6 reemplazables |
| E0h..E7h | 8 B | Cola del teclado |
| E8h..EFh | 8 B | Buffer de video LCD |
| F0h..FFh | 16 B | Reservados; no disponibles para programas |

El marco físico 7, E0h..FFh, queda protegido y no se desaloja.
Existen ocho marcos físicos, pero solo siete reemplazables.

Los índices y la cantidad de elementos de la cola se conservan
en el estado serializable del controlador, no en RAM adicional.

## 7. Mapa virtual: 512 direcciones

| Direcciones virtuales | Tamaño | Uso |
|---|---|---|
| 000h..1DFh | 480 B | Páginas 0..14: programa y datos |
| 1E0h..1E7h | 8 B | Teclado |
| 1E8h..1EFh | 8 B | LCD |
| 1F0h..1FFh | 16 B | Reservados; acceso rechazado |

La página virtual 15 está fijada al marco físico 7:
P=1 y PFN=7. No participa en FIFO.

Las páginas 0..14 compiten por los siete marcos reemplazables.
La tabla mantiene sus 16 entradas visibles.
La página 15 se identifica además como protegida.

Traducción:
VPN = floor(VA / 32)
offset = VA mod 32
PA = PFN × 32 + offset

Ejemplo:
VA=100 → VPN=3, offset=4.
Si PFN=6, PA=196.

El cargador registra los rangos de código y datos de cada programa,
evita solapamientos y no permite cargar código ni datos ordinarios
en la página reservada para E/S.

## 8. Reglas de entrada y salida

KBD y LCD son no cacheables, tanto con IN/OUT como con LOAD/STORE.

IN retira el carácter más antiguo de la cola y lo guarda en rd.
Si la cola está vacía, espera sin modificar rd.
Al continuar, consume exactamente un carácter.

El teclado acepta hasta ocho bytes.
Si la cola está llena, rechaza la nueva entrada y muestra el estado.

OUT escribe un carácter en la posición actual del buffer LCD.
El cursor avanza circularmente entre 0 y 7.
El LCD comienza con ocho espacios y cursor 0.

LOAD sobre KBD inspecciona el byte sin consumirlo.
STORE sobre KBD se rechaza: la entrada corresponde al controlador.
LOAD/STORE sobre LCD acceden a sus bytes; STORE no mueve el cursor.

Los caracteres admitidos inicialmente son ASCII imprimibles:
códigos 32..126.

Los accesos de E/S usan las señales y buffers triestado acordados.
No se actualiza el LCD ni se consume teclado mediante atajos
que omitan el recorrido de buses.

## 9. Ejemplo de codificación

Programa cargado desde 000h:

| Dirección | Ensamblador | Bytes |
|---|---|---|
| 000h | MOV AX, 7 | 10 00 07 00 |
| 004h | MOV BX, 5 | 10 01 05 00 |
| 008h | ADD AX, BX | 30 00 01 00 |
| 00Ch | STORE [300], AX | 21 00 2C 01 |
| 010h | HALT | 00 00 00 00 |

Resultado esperado:
AX=12, BX=5, ZF=0, CF=0, SF=0.
La dirección virtual 300 contiene 0Ch.
La CPU queda detenida con PC=010h.

La página virtual 9, que contiene la dirección 300,
se traduce al marco asignado por la MMU.

## 10. Revisión requerida

Antes de integrar:
- Revisar compatibilidad con el estado y las APIs de la issue #1.
- Revisar señales y accesos no cacheables con la issue #3.
- Confirmar formato fijo de cuatro bytes y tabla de opcodes.
- Confirmar página 15 protegida y siete marcos reemplazables.
- Confirmar semántica de teclado, LCD y representación de IR.

Este documento es una especificación propuesta, no evidencia
de que el simulador ya esté implementado.
