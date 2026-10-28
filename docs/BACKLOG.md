# Índice de las 48 tareas

Equipo: Cristian, Marcelo y Joseph. Hay **16 tareas y 57 puntos relativos por persona**. Cada tarjeta enlazada contiene una explicación, pasos sugeridos, criterios de finalización y lo que debe entregarse.

Consulta el estado actual en el [tablero](https://github.com/users/cristiancarvajal22/projects/6). Antes de empezar una tarjeta, termina sus dependencias. No hay personas fijas asignadas para comprobar PR; el equipo realiza esa comprobación entre compañeros.

## [P2-001] Definir qué datos guarda el simulador y cómo se comunican sus partes

[Ver tarea #1](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/1) · **Responsable: Cristian** · 2 puntos relativos.

Antes de programar, acuerden qué información necesita cada parte: registros de la CPU, memoria, cachés, teclado y pantalla. Un evento será un registro de lo que ocurrió en un paso del reloj, para que todos los módulos y las animaciones cuenten la misma historia.

Antes de empezar: puede empezar ahora; acordar las decisiones entre los tres.

## [P2-002] Definir las instrucciones y las direcciones de memoria

[Ver tarea #2](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/2) · **Responsable: Marcelo** · 2 puntos relativos.

La ISA es la lista de instrucciones que entenderá la CPU, como sumar, saltar, leer el teclado o escribir en el LCD. También deben acordar en qué direcciones vivirán los programas, los datos y los dos dispositivos, para que ningún módulo use un mapa distinto.

Antes de empezar: puede empezar ahora; acordar las decisiones entre los tres.

## [P2-003] Decidir cómo funcionarán las cachés y las señales de control

[Ver tarea #3](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/3) · **Responsable: Joseph** · 2 puntos relativos.

Las cachés guardan copias de datos usados recientemente para evitar leer la RAM cada vez. Aquí se decide qué hacer al leer, escribir o reemplazar una copia, y qué señales binarias permiten moverla por los buses. Este acuerdo evita que una parte muestre datos diferentes de otra.

Antes de empezar: puede empezar ahora; acordar las decisiones entre los tres.

## [P2-004] Crear los cuatro registros y las operaciones de 8 bits

[Ver tarea #4](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/4) · **Responsable: Cristian** · 5 puntos relativos.

Los registros AX, BX, CX y DX son pequeñas casillas donde la CPU guarda números mientras trabaja. La ALU hace las operaciones aritméticas. Los indicadores ZF, CF y SF avisan si el resultado es cero, hubo acarreo o el número tiene signo.

Antes de empezar: [#1](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/1), [#2](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/2).

## [P2-005] Hacer que la CPU busque, entienda y ejecute instrucciones

[Ver tarea #5](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/5) · **Responsable: Marcelo** · 5 puntos relativos.

La CPU debe repetir tres etapas: buscar una instrucción en memoria, identificar qué significa y ejecutarla. Cada etapa se divide en pequeños pasos visibles, sin saltarse los buses ni los controles definidos.

Antes de empezar: [#1](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/1), [#2](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/2), [#3](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/3).

## [P2-006] Crear el reloj y guardar el estado entre pasos en Apps Script

[Ver tarea #6](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/6) · **Responsable: Joseph** · 5 puntos relativos.

El reloj indica cuándo avanza el simulador. Cada paso debe terminar guardando un estado completo y coherente. Al usar Run se ejecutarán grupos pequeños de pasos para que Google Sheets siga respondiendo y pueda mostrar las animaciones.

Antes de empezar: [#1](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/1), [#2](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/2), [#3](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/3).

## [P2-007] Controlar quién puede transmitir por cada bus

[Ver tarea #7](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/7) · **Responsable: Cristian** · 5 puntos relativos.

Un bus es un camino compartido para mover información. En cada momento debe hablar un solo componente. Los demás quedan en High-Z, que significa que su salida está desconectada y no interfiere con el camino.

Antes de empezar: [#1](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/1), [#3](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/3).

## [P2-008] Mover lecturas, escrituras y E/S a través de los buses

[Ver tarea #8](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/8) · **Responsable: Marcelo** · 5 puntos relativos.

Una lectura, una escritura y una operación con teclado o LCD deben recorrer los buses de verdad dentro del modelo. Las señales Read, Write, Clock e IO indicarán qué está ocurriendo y qué componente puede actuar.

Antes de empezar: [#2](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/2), [#3](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/3), [#7](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/7).

## [P2-009] Mostrar la micro-palabra y qué hace cada señal

[Ver tarea #9](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/9) · **Responsable: Joseph** · 5 puntos relativos.

La micro-palabra es una fila de bits de control. Cada bit enciende o apaga una acción, como poner el PC en el bus o cargar un valor en MAR. Debe verse en pantalla y coincidir con lo que realmente ocurre en ese paso.

Antes de empezar: [#3](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/3), [#7](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/7).

## [P2-010] Crear la RAM de 256 bytes y reservar teclado y LCD

[Ver tarea #10](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/10) · **Responsable: Cristian** · 3 puntos relativos.

La RAM física tendrá exactamente 256 bytes, repartidos en ocho marcos de 32 bytes. Un marco es un espacio donde puede cargarse una página. Los buffers de teclado y pantalla ocuparán 16 bytes de esa misma RAM, sin añadir memoria extra.

Antes de empezar: [#1](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/1), [#2](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/2).

## [P2-011] Traducir direcciones virtuales a direcciones de RAM

[Ver tarea #11](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/11) · **Responsable: Marcelo** · 3 puntos relativos.

El programa podrá usar 512 direcciones virtuales aunque la RAM solo tenga 256 bytes. La MMU busca en una tabla qué página virtual está cargada en qué marco y calcula la dirección física. La tabla también indica si la página está presente, fue modificada o fue consultada.

Antes de empezar: [#1](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/1), [#2](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/2), [#10](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/10).

## [P2-012] Guardar y recuperar páginas en Swap

[Ver tarea #12](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/12) · **Responsable: Joseph** · 3 puntos relativos.

Swap será el respaldo de las páginas que no caben en la RAM. Se guarda una página completa de 32 bytes, de forma que, al volver a cargarla, sus cambios no se pierdan.

Antes de empezar: [#1](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/1), [#2](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/2), [#10](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/10).

## [P2-013] Elegir qué página sale de RAM usando FIFO

[Ver tarea #13](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/13) · **Responsable: Cristian** · 5 puntos relativos.

FIFO significa que sale primero la página que entró primero. Solo se reemplaza una página cuando no quedan marcos libres utilizables. Los marcos reservados para E/S deben respetarse según el contrato inicial.

Antes de empezar: [#2](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/2), [#11](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/11), [#12](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/12).

## [P2-014] Atender un fallo de página y continuar la instrucción

[Ver tarea #14](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/14) · **Responsable: Marcelo** · 5 puntos relativos.

Un Page Fault ocurre cuando el programa pide una página que no está cargada en RAM. La CPU debe esperar, conseguir un marco, guardar la página que sale si fue modificada, traer los 32 bytes solicitados y continuar exactamente donde quedó.

Antes de empezar: [#5](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/5), [#8](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/8), [#11](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/11), [#12](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/12), [#13](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/13).

## [P2-015] Actualizar Dirty y Reference y evitar copias viejas al cambiar páginas

[Ver tarea #15](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/15) · **Responsable: Joseph** · 5 puntos relativos.

Dirty indica que una página fue escrita; Reference indica que fue consultada. Cuando se reutiliza un marco, las cachés no deben seguir entregando bytes de la página anterior. Aquí se conectan esas actualizaciones para no perder cambios ni leer copias viejas.

Antes de empezar: [#3](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/3), [#11](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/11), [#14](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/14).

## [P2-016] Crear la caché L1I para las instrucciones

[Ver tarea #16](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/16) · **Responsable: Cristian** · 5 puntos relativos.

L1I guarda únicamente los bytes de las instrucciones que busca el PC. Tiene una sola línea de ocho bytes. Si la instrucción ya está allí es un hit; si no está, es un miss y debe pedirse al siguiente nivel.

Antes de empezar: [#3](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/3), [#8](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/8), [#11](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/11).

## [P2-017] Crear la caché L1D para los datos

[Ver tarea #17](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/17) · **Responsable: Marcelo** · 5 puntos relativos.

L1D guarda una línea de ocho bytes de datos u operandos. Debe funcionar tanto cuando la CPU lee como cuando escribe, siguiendo las reglas acordadas para mantener las copias actualizadas.

Antes de empezar: [#3](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/3), [#8](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/8), [#11](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/11).

## [P2-018] Crear la caché L2 de 32 bytes y su reemplazo FIFO

[Ver tarea #18](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/18) · **Responsable: Joseph** · 5 puntos relativos.

L2 es el nivel compartido entre las cachés pequeñas y la RAM. Tendrá cuatro líneas de ocho bytes. Su propia cola FIFO decidirá qué línea sale cuando se necesita una quinta; esta cola es distinta del FIFO de páginas.

Antes de empezar: [#3](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/3), [#8](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/8), [#10](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/10), [#11](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/11).

## [P2-019] Mantener actualizadas las copias de caché y memoria

[Ver tarea #19](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/19) · **Responsable: Cristian** · 3 puntos relativos.

Un mismo dato puede estar copiado en L1, L2 y RAM. Esta tarea conecta las reglas necesarias para que una escritura, una carga de programa o un cambio de página no deje una copia antigua que luego se use por error.

Antes de empezar: [#15](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/15), [#16](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/16), [#17](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/17), [#18](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/18).

## [P2-020] Contar los hits y misses de cada caché

[Ver tarea #20](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/20) · **Responsable: Marcelo** · 3 puntos relativos.

Los contadores deben explicar cuántas consultas resolvió cada caché y cuántas fallaron. La tasa de aciertos es hits dividido entre el total de consultas. No se cuenta una consulta a L2 si L1 ya respondió.

Antes de empezar: [#16](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/16), [#17](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/17), [#18](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/18).

## [P2-021] Animar los aciertos, fallos y movimientos entre cachés

[Ver tarea #21](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/21) · **Responsable: Joseph** · 3 puntos relativos.

La animación debe enseñar de dónde salió cada byte: L1I, L1D, L2 o RAM. No basta con encender un cuadro; el movimiento debe corresponder al evento real y coincidir con los contadores.

Antes de empezar: [#9](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/9), [#16](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/16), [#17](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/17), [#18](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/18), [#20](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/20).

## [P2-022] Crear la entrada de teclado y su cola de ocho bytes

[Ver tarea #22](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/22) · **Responsable: Cristian** · 5 puntos relativos.

El teclado necesita una cola: los caracteres esperan su turno hasta que el programa los lee con IN. Deben guardarse en ocho bytes de RAM. Una cola circular vuelve al principio del espacio cuando llega al final, sin alterar el orden.

Antes de empezar: [#2](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/2), [#8](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/8), [#10](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/10).

## [P2-023] Crear el LCD de ocho caracteres y su memoria de video

[Ver tarea #23](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/23) · **Responsable: Marcelo** · 5 puntos relativos.

El LCD mostrará una fila de ocho caracteres. Cada posición representará uno de los ocho bytes reservados en RAM como memoria de video. La pantalla solo cambia cuando la CPU realiza la escritura permitida por Ld_LCD.

Antes de empezar: [#2](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/2), [#8](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/8), [#10](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/10).

## [P2-024] Hacer funcionar IN y OUT dentro del ciclo de la CPU

[Ver tarea #24](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/24) · **Responsable: Joseph** · 5 puntos relativos.

IN toma un carácter del teclado y lo coloca en un registro; OUT manda un registro al LCD. Ambas instrucciones deben usar la CPU, el mapa de memoria y los buffers tri-estado, igual que las demás instrucciones usan sus caminos definidos.

Antes de empezar: [#5](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/5), [#14](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/14), [#19](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/19), [#22](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/22), [#23](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/23).

## [P2-025] Leer el código ensamblador y explicar sus errores

[Ver tarea #25](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/25) · **Responsable: Cristian** · 5 puntos relativos.

El ensamblador convierte el texto del programa en instrucciones que la CPU puede ejecutar. Primero debe reconocer instrucciones, registros, números y etiquetas. Una etiqueta es un nombre que permite saltar a una posición sin escribir a mano su dirección.

Antes de empezar: [#1](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/1), [#2](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/2).

## [P2-026] Convertir instrucciones a bytes y cargarlas en memoria virtual

[Ver tarea #26](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/26) · **Responsable: Marcelo** · 5 puntos relativos.

Después de validar el ensamblador, hay que generar sus bytes y guardarlos en las páginas virtuales. El cargador prepara también el inicio del programa para que CPU, tabla de páginas y cachés no conserven datos de la ejecución anterior.

Antes de empezar: [#2](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/2), [#12](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/12), [#15](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/15), [#25](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/25).

## [P2-027] Crear el catálogo de programas y el editor en celdas

[Ver tarea #27](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/27) · **Responsable: Joseph** · 5 puntos relativos.

El equipo necesita elegir y modificar programas sin cambiar el código del simulador. El catálogo guardará al menos tres fuentes ASM y el editor permitirá escribirlas en celdas, verificarlas y enviarlas al cargador.

Antes de empezar: [#1](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/1), [#2](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/2), [#25](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/25).

## [P2-028] Preparar un programa de operaciones y bucles con AX, BX, CX y DX

[Ver tarea #28](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/28) · **Responsable: Cristian** · 3 puntos relativos.

La primera demo debe demostrar que funcionan los cuatro registros, las operaciones, los indicadores y los saltos. Su resultado tiene que poder calcularse a mano para comprobar el simulador y explicarlo durante la defensa.

Antes de empezar: [#4](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/4), [#5](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/5), [#26](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/26), [#27](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/27).

## [P2-029] Preparar un programa que copie el teclado al LCD

[Ver tarea #29](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/29) · **Responsable: Marcelo** · 3 puntos relativos.

La segunda demo será un eco: el usuario escribe y el programa mueve cada carácter del teclado al LCD usando IN y OUT. Deben verse la cola, los bytes de video y las señales que mueven el dato.

Antes de empezar: [#24](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/24), [#26](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/26), [#27](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/27).

## [P2-030] Preparar un programa que provoque fallos de página y de caché

[Ver tarea #30](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/30) · **Responsable: Joseph** · 3 puntos relativos.

La tercera demo usará direcciones separadas para obligar a cambiar líneas de caché y páginas de RAM. También modificará una página y la volverá a cargar para demostrar que Swap guardó sus cambios.

Antes de empezar: [#14](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/14), [#19](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/19), [#20](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/20), [#26](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/26), [#27](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/27).

## [P2-031] Organizar la hoja, elegir el nombre del equipo y añadir el logo

[Ver tarea #31](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/31) · **Responsable: Cristian** · 3 puntos relativos.

La hoja debe ser fácil de recorrer durante una demo: CPU, buses, memorias, cachés, teclado, LCD y editor tendrán zonas claras. El nombre y logo oficiales del equipo deben aparecer también en la documentación y en la presentación.

Antes de empezar: [#1](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/1), [#2](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/2), [#6](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/6).

## [P2-032] Mostrar visualmente cómo se resuelve un Page Fault

[Ver tarea #32](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/32) · **Responsable: Marcelo** · 3 puntos relativos.

Cuando falta una página, la interfaz debe enseñar por qué se detuvo la CPU y qué hace para continuar. Se verá la dirección solicitada, la página que sale, el respaldo en Swap, los 32 bytes que llegan y el cambio de la tabla.

Antes de empezar: [#11](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/11), [#13](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/13), [#14](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/14), [#15](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/15).

## [P2-033] Animar los buses y distinguir buffers activos y High-Z

[Ver tarea #33](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/33) · **Responsable: Joseph** · 3 puntos relativos.

Los cables deben indicar qué camino usa cada transferencia. Un buffer activo transmite; uno en High-Z está desconectado. La animación debe ayudar a ver quién envía, quién recibe y qué señales lo permiten.

Antes de empezar: [#7](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/7), [#8](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/8), [#9](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/9), [#31](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/31).

## [P2-034] Probar registros, instrucciones y buses con resultados conocidos

[Ver tarea #34](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/34) · **Responsable: Cristian** · 3 puntos relativos.

Estas pruebas comprobarán CPU y buses sin depender solo de que una animación se vea bien. Para cada caso se anotará el resultado esperado antes de ejecutar y luego se comparará con lo que ocurrió.

Antes de empezar: [#4](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/4), [#5](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/5), [#7](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/7), [#8](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/8), [#9](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/9), [#28](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/28).

## [P2-035] Probar traducción de direcciones, FIFO y conservación en Swap

[Ver tarea #35](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/35) · **Responsable: Marcelo** · 3 puntos relativos.

Las pruebas deben demostrar que las direcciones se traducen correctamente y que sacar una página de RAM no hace perder sus datos. También comprobarán las reservas del teclado y del LCD dentro de la RAM.

Antes de empezar: [#10](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/10), [#11](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/11), [#12](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/12), [#13](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/13), [#14](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/14), [#15](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/15), [#30](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/30).

## [P2-036] Probar cachés, teclado y LCD trabajando juntos

[Ver tarea #36](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/36) · **Responsable: Joseph** · 3 puntos relativos.

Aquí se comprueba el recorrido completo, no cada módulo aislado. Los hits y misses deben coincidir con un cálculo previo y los caracteres deben recorrer cola, bus y video sin quedar guardados en caché.

Antes de empezar: [#19](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/19), [#20](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/20), [#21](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/21), [#22](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/22), [#23](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/23), [#24](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/24), [#29](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/29).

## [P2-037] Explicar la arquitectura, las instrucciones y la micro-palabra en español e inglés

[Ver tarea #37](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/37) · **Responsable: Cristian** · 3 puntos relativos.

La documentación técnica debe permitir que otro estudiante entienda cómo está construido el simulador. Ambos idiomas deben explicar el mismo funcionamiento real, con diagramas y ejemplos que coincidan con la implementación.

Antes de empezar: [#2](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/2), [#3](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/3), [#5](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/5), [#9](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/9), [#19](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/19).

## [P2-038] Escribir una guía de instalación y uso en ambos idiomas

[Ver tarea #38](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/38) · **Responsable: Marcelo** · 3 puntos relativos.

El manual debe permitir que alguien use el proyecto desde otra computadora sin ayuda del autor. Explicará cómo preparar Sheets y Apps Script, cómo cargar los programas y cómo interpretar los controles y paneles.

Antes de empezar: [#6](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/6), [#27](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/27), [#28](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/28), [#29](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/29), [#30](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/30), [#31](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/31), [#32](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/32), [#33](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/33).

## [P2-039] Relacionar cada punto de la rúbrica con una prueba real

[Ver tarea #39](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/39) · **Responsable: Joseph** · 3 puntos relativos.

La rúbrica debe tener evidencia fácil de encontrar. Esta tarea reunirá, para cada criterio, el enlace a la tarea, el PR y la prueba, captura o traza que demuestre que se cumple. No se marcará como logrado lo que siga pendiente.

Antes de empezar: [#34](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/34), [#35](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/35), [#36](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/36), [#37](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/37), [#38](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/38).

## [P2-040] Preparar la explicación de Cristian y practicar cambios en vivo

[Ver tarea #40](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/40) · **Responsable: Cristian** · 3 puntos relativos.

Cristian explicará CPU y buses, pero también deberá resolver preguntas de memoria de otra parte del proyecto. El objetivo es demostrar comprensión del sistema y poder cambiar una instrucción o un dato sin ayuda.

Antes de empezar: [#28](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/28), [#30](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/30), [#34](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/34), [#35](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/35), [#37](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/37).

## [P2-041] Preparar la explicación de Marcelo y practicar cambios en vivo

[Ver tarea #41](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/41) · **Responsable: Marcelo** · 3 puntos relativos.

Marcelo explicará memoria virtual, tabla de páginas, FIFO y Swap. También deberá predecir un acceso de caché de otra parte del proyecto y demostrar que sabe modificar el programa o la memoria durante la defensa.

Antes de empezar: [#29](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/29), [#30](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/30), [#35](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/35), [#36](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/36), [#37](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/37).

## [P2-042] Preparar la explicación de Joseph y practicar cambios en vivo

[Ver tarea #42](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/42) · **Responsable: Joseph** · 3 puntos relativos.

Joseph explicará cachés y E/S y deberá interpretar también los bits de una micro-palabra de otro módulo. Practicará un cambio de código o memoria y comprobará qué ocurre en los datos, las cachés o el LCD.

Antes de empezar: [#21](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/21), [#24](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/24), [#29](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/29), [#30](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/30), [#34](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/34), [#36](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/36).

## [P2-043] Ejecutar las tres demos completas en la misma planilla

[Ver tarea #43](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/43) · **Responsable: Cristian** · 2 puntos relativos.

La integración final debe demostrar que todas las partes funcionan juntas en una sola versión del simulador. Cada demo se ejecutará desde reset y se comparará con los resultados esperados, tanto paso a paso como con Run.

Antes de empezar: [#28](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/28), [#29](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/29), [#30](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/30), [#34](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/34), [#35](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/35), [#36](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/36), [#38](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/38).

## [P2-044] Preparar la versión final y comprobar el enlace de Google Sheets

[Ver tarea #44](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/44) · **Responsable: Marcelo** · 2 puntos relativos.

La entrega estable irá en main después de integrar el trabajo en develop. Debe poder identificarse exactamente qué versión se presenta y abrir la planilla desde otra cuenta con los permisos acordados para la evaluación.

Antes de empezar: [#37](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/37), [#38](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/38), [#39](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/39), [#43](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/43).

## [P2-045] Ensayar la defensa completa y preparar la presentación

[Ver tarea #45](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/45) · **Responsable: Joseph** · 2 puntos relativos.

El equipo dispone de 20 minutos para exponer y demostrar los tres programas, más 10 minutos de preguntas individuales. Este ensayo debe comprobar los tiempos, las transiciones y que todos expliquen una parte técnica sustancial.

Antes de empezar: [#31](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/31), [#40](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/40), [#41](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/41), [#42](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/42), [#43](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/43), [#44](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/44).

## [P2-046] Comprobar las tareas y aportes de Cristian antes del cierre

[Ver tarea #46](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/46) · **Responsable: Cristian** · 2 puntos relativos.

Cristian debe poder mostrar qué hizo durante el proyecto y explicarlo. Se revisarán sus tarjetas, ramas personales, commits, PR y pruebas, sin crear historial artificial ni dejar cambios para después de la fecha límite.

Antes de empezar: [#39](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/39), [#40](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/40), [#43](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/43), [#44](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/44), [#45](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/45).

## [P2-047] Comprobar las tareas y aportes de Marcelo antes del cierre

[Ver tarea #47](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/47) · **Responsable: Marcelo** · 2 puntos relativos.

Marcelo debe poder mostrar sus aportes en implementación, pruebas y documentación, además de explicar cómo se conectan con los módulos de sus compañeros. La revisión será sobre evidencia real del trabajo realizado.

Antes de empezar: [#39](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/39), [#41](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/41), [#43](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/43), [#44](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/44), [#45](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/45).

## [P2-048] Comprobar las tareas y aportes de Joseph antes del cierre

[Ver tarea #48](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/48) · **Responsable: Joseph** · 2 puntos relativos.

Joseph debe poder mostrar sus tareas, sus cambios de código y las pruebas que hizo. También se comprobará que entiende la relación con otros módulos y que su material de defensa permite localizar sus aportes.

Antes de empezar: [#39](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/39), [#42](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/42), [#43](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/43), [#44](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/44), [#45](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/45).
