# Tareas del proyecto

Repartimos el proyecto en **48 tareas: 16 por persona y 57 puntos relativos de esfuerzo para cada integrante**. En las tarjetas dejamos la descripción del trabajo, sus pasos, los criterios de aceptación y el entregable.

Llevaremos el avance en el [tablero](https://github.com/users/cristiancarvajal22/projects/6). Los PR se comprobarán entre compañeros.

## [P2-001] Definir qué datos guarda el simulador y cómo se comunican sus partes

[Ver tarea #1](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/1) · **Responsable: Cristian** · 2 puntos relativos.

Vamos a definir cómo se guarda el estado del simulador y qué información comparte cada módulo. Incluiremos los registros de la CPU, la memoria, las cachés, el teclado y el LCD. También definiremos los eventos de cada paso del reloj para que la ejecución y las animaciones trabajen con los mismos datos.

## [P2-002] Definir las instrucciones y las direcciones de memoria

[Ver tarea #2](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/2) · **Responsable: Marcelo** · 2 puntos relativos.

Definiremos las instrucciones que va a reconocer la CPU, sus operandos y la forma de convertirlas a bytes. También dejaremos definido el mapa de memoria: dónde van los programas, los datos, el teclado y el LCD. Con esto podremos conectar CPU, ensamblador y memoria sin usar reglas distintas.

## [P2-003] Decidir cómo funcionarán las cachés y las señales de control

[Ver tarea #3](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/3) · **Responsable: Joseph** · 2 puntos relativos.

En esta tarea dejaremos definidas las reglas de L1I, L1D y L2: qué guardan, cómo responden a una lectura o escritura y qué reemplazan cuando se llenan. También especificaremos las señales que permiten mover los datos por los buses y cómo se actualizan las copias al cambiar una página.

## [P2-004] Crear los cuatro registros y las operaciones de 8 bits

[Ver tarea #4](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/4) · **Responsable: Cristian** · 5 puntos relativos.

Implementaremos AX, BX, CX y DX como registros de 8 bits, junto con los registros de control de la CPU. La ALU realizará las operaciones de nuestra ISA y actualizará ZF, CF y SF según el resultado. Vamos a comprobar tanto las operaciones normales como los casos de desbordamiento.

## [P2-005] Hacer que la CPU busque, entienda y ejecute instrucciones

[Ver tarea #5](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/5) · **Responsable: Marcelo** · 5 puntos relativos.

Vamos a conectar las etapas de búsqueda, decodificación y ejecución de instrucciones. Cada instrucción tendrá una secuencia de micro-pasos visible, usando PC, MAR, MDR, IR y las señales de los buses. La CPU también tendrá que esperar y continuar correctamente cuando necesite memoria o entrada del teclado.

## [P2-006] Crear el reloj y guardar el estado entre pasos en Apps Script

[Ver tarea #6](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/6) · **Responsable: Joseph** · 5 puntos relativos.

Implementaremos el reloj del simulador y la forma de guardar su estado entre ejecuciones de Apps Script. Step avanzará un micro-paso y Run ejecutará grupos pequeños de pasos sin dejar bloqueada la hoja. También controlaremos las pausas, el reinicio y los clics repetidos para evitar cambios simultáneos.

## [P2-007] Controlar quién puede transmitir por cada bus

[Ver tarea #7](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/7) · **Responsable: Cristian** · 5 puntos relativos.

Vamos a controlar qué componente transmite por cada bus. Solo podrá haber un emisor activo por segmento; las demás salidas permanecerán en High-Z. Si aparecen dos emisores al mismo tiempo, el simulador deberá detectar la contención y detener el paso sin alterar los datos.

## [P2-008] Mover lecturas, escrituras y E/S a través de los buses

[Ver tarea #8](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/8) · **Responsable: Marcelo** · 5 puntos relativos.

Conectaremos las lecturas, escrituras y operaciones de E/S con los buses del simulador. Cada transferencia mostrará su dirección, el componente que envía, el que recibe y las señales Read, Write, Clock e IO. El acceso a memoria y periféricos tendrá que seguir este recorrido.

## [P2-009] Mostrar la micro-palabra y qué hace cada señal

[Ver tarea #9](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/9) · **Responsable: Joseph** · 5 puntos relativos.

Implementaremos la micro-palabra de control y su representación en la hoja. Cada bit mostrará qué salida o carga está habilitada en el micro-paso actual. Vamos a relacionar esas señales con los buffers para poder explicar por qué se mueve cada dato.

## [P2-010] Crear la RAM de 256 bytes y reservar teclado y LCD

[Ver tarea #10](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/10) · **Responsable: Cristian** · 3 puntos relativos.

La RAM tendrá 256 bytes distribuidos en ocho marcos de 32 bytes. Dentro de esa capacidad reservaremos los ocho bytes de la cola del teclado y los ocho del video del LCD. Implementaremos las lecturas y escrituras respetando los límites de los marcos y las zonas reservadas.

## [P2-011] Traducir direcciones virtuales a direcciones de RAM

[Ver tarea #11](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/11) · **Responsable: Marcelo** · 3 puntos relativos.

Implementaremos la traducción entre las 512 direcciones virtuales y los 256 bytes de RAM. La tabla tendrá una entrada por página virtual, con su presencia, marco, Dirty y Reference. Vamos a separar página y desplazamiento para calcular la dirección física de cada acceso.

## [P2-012] Guardar y recuperar páginas en Swap

[Ver tarea #12](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/12) · **Responsable: Joseph** · 3 puntos relativos.

Prepararemos Swap como respaldo de las páginas que no están cargadas en RAM. Las transferencias serán de 32 bytes completos y deberán conservar los cambios hechos durante la ejecución. También separaremos el programa inicial de las versiones actualizadas de sus páginas.

## [P2-013] Elegir qué página sale de RAM usando FIFO

[Ver tarea #13](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/13) · **Responsable: Cristian** · 5 puntos relativos.

Usaremos FIFO para decidir qué página sale cuando ya no quedan marcos utilizables. Mantendremos una cola con el orden de entrada y respetaremos los marcos reservados en el mapa de E/S. La cola y la víctima elegida quedarán visibles para poder seguir el reemplazo.

## [P2-014] Atender un fallo de página y continuar la instrucción

[Ver tarea #14](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/14) · **Responsable: Marcelo** · 5 puntos relativos.

Vamos a implementar la atención de un Page Fault. La CPU suspenderá el acceso, conseguirá un marco, guardará la víctima en Swap si fue modificada y cargará la página solicitada. Después actualizará la tabla y continuará la instrucción sin repetir sus efectos.

## [P2-015] Actualizar Dirty y Reference y evitar copias viejas al cambiar páginas

[Ver tarea #15](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/15) · **Responsable: Joseph** · 5 puntos relativos.

Conectaremos los bits Dirty y Reference con todos los accesos a memoria, incluidos los que resuelve la caché. También retiraremos las copias que dejen de ser válidas al reutilizar un marco. Vamos a comprobar que una página escrita conserve sus datos después de salir de RAM y volver a cargarse.

## [P2-016] Crear la caché L1I para las instrucciones

[Ver tarea #16](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/16) · **Responsable: Cristian** · 5 puntos relativos.

Implementaremos L1I con una línea de ocho bytes dedicada a las instrucciones del programa. Cada búsqueda del PC comprobará si los bytes están en esa línea y consultará L2 cuando no estén. Incluiremos saltos y búsquedas que crucen una línea o una página.

## [P2-017] Crear la caché L1D para los datos

[Ver tarea #17](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/17) · **Responsable: Marcelo** · 5 puntos relativos.

L1D guardará una línea de ocho bytes para las lecturas y escrituras de datos. La conectaremos con L2 siguiendo las políticas que definimos para mantener las copias actualizadas. Los accesos al teclado y al LCD pasarán por el camino de E/S sin quedar almacenados en esta caché.

## [P2-018] Crear la caché L2 de 32 bytes y su reemplazo FIFO

[Ver tarea #18](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/18) · **Responsable: Joseph** · 5 puntos relativos.

Construiremos L2 como una caché unificada de cuatro líneas de ocho bytes. Atenderá las peticiones de L1I y L1D y consultará RAM cuando no encuentre el bloque solicitado. Tendrá su propia cola FIFO para reemplazar líneas cuando se llene.

## [P2-019] Mantener actualizadas las copias de caché y memoria

[Ver tarea #19](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/19) · **Responsable: Cristian** · 3 puntos relativos.

Vamos a conectar las actualizaciones de L1I, L1D, L2 y RAM para que no queden copias viejas. Cubriremos las escrituras, la carga de un programa, la edición de memoria y el reemplazo de páginas. Los cambios deberán afectar solo a las líneas correspondientes.

## [P2-020] Contar los hits y misses de cada caché

[Ver tarea #20](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/20) · **Responsable: Marcelo** · 3 puntos relativos.

Agregaremos contadores de hits y misses independientes para L1I, L1D y L2, junto con su porcentaje de aciertos. Cada nivel contará únicamente las consultas que realmente recibe. Vamos a comparar una secuencia calculada a mano con los valores de la hoja y comprobar su reinicio.

## [P2-021] Animar los aciertos, fallos y movimientos entre cachés

[Ver tarea #21](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/21) · **Responsable: Joseph** · 3 puntos relativos.

Animaremos las consultas y transferencias entre L1I, L1D, L2 y RAM. La hoja mostrará la línea consultada, el hit o miss y el movimiento de bytes cuando haya carga o reemplazo. La animación y los contadores tendrán que coincidir con el micro-paso que se está ejecutando.

## [P2-022] Crear la entrada de teclado y su cola de ocho bytes

[Ver tarea #22](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/22) · **Responsable: Cristian** · 5 puntos relativos.

Implementaremos el panel de entrada y una cola circular de ocho bytes en RAM para el teclado. Los caracteres quedarán en orden hasta que una instrucción IN los lea mediante En_KBD y el bus. Definiremos qué ocurre con una cola vacía, una llena y la entrada de un noveno carácter.

## [P2-023] Crear el LCD de ocho caracteres y su memoria de video

[Ver tarea #23](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/23) · **Responsable: Marcelo** · 5 puntos relativos.

El LCD mostrará una fila de ocho caracteres conectada con sus ocho bytes de video en RAM. Implementaremos el cursor y la actualización mediante OUT y Ld_LCD. Vamos a comprobar que pantalla y memoria coincidan y que el reinicio deje ambas en el estado esperado.

## [P2-024] Hacer funcionar IN y OUT dentro del ciclo de la CPU

[Ver tarea #24](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/24) · **Responsable: Joseph** · 5 puntos relativos.

Integraremos IN y OUT al ciclo de la CPU. IN llevará un byte del teclado a un registro y OUT enviará el contenido de un registro al LCD, usando el mapa de E/S y los buffers tri-estado. Las pausas y los reintentos no deberán consumir un carácter dos veces.

## [P2-025] Leer el código ensamblador y explicar sus errores

[Ver tarea #25](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/25) · **Responsable: Cristian** · 5 puntos relativos.

Implementaremos la lectura del código ASM: instrucciones, registros, números, etiquetas y operandos de teclado o LCD. El ensamblador resolverá las etiquetas y comprobará que cada línea respete nuestra ISA. Los errores indicarán la línea y el motivo, sin dejar un programa cargado a medias.

## [P2-026] Convertir instrucciones a bytes y cargarlas en memoria virtual

[Ver tarea #26](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/26) · **Responsable: Marcelo** · 5 puntos relativos.

Convertiremos las instrucciones validadas a sus bytes y las cargaremos en memoria virtual. Conservaremos la relación entre las líneas de código y los bytes generados, y prepararemos PC, tabla de páginas y cachés para la nueva ejecución. También comprobaremos que el programa quepa y respete la zona de E/S.

## [P2-027] Crear el catálogo de programas y el editor en celdas

[Ver tarea #27](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/27) · **Responsable: Joseph** · 5 puntos relativos.

Crearemos el catálogo y el editor de programas en celdas. Podremos seleccionar una fuente ASM, modificarla, guardarla, verificarla y cargarla sin cambiar el código del simulador. El catálogo incluirá las tres demos y mantendrá separadas sus fuentes del estado de la CPU.

## [P2-028] Preparar un programa de operaciones y bucles con AX, BX, CX y DX

[Ver tarea #28](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/28) · **Responsable: Cristian** · 3 puntos relativos.

Prepararemos una demo aritmética que use AX, BX, CX y DX, un bucle y un salto condicional. Calcularemos su resultado esperado para contrastarlo con la ejecución hasta HALT. También dejaremos preparada una modificación pequeña para probarla durante la defensa.

## [P2-029] Preparar un programa que copie el teclado al LCD

[Ver tarea #29](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/29) · **Responsable: Marcelo** · 3 puntos relativos.

Vamos a preparar el programa de eco del teclado al LCD. Leerá cada carácter con IN y lo enviará con OUT, mostrando el cambio en la cola, el bus y la memoria de video. Probaremos la espera sin entrada, un texto de ocho caracteres y el reinicio.

## [P2-030] Preparar un programa que provoque fallos de página y de caché

[Ver tarea #30](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/30) · **Responsable: Joseph** · 3 puntos relativos.

La tercera demo accederá a direcciones dispersas para provocar misses de caché y Page Faults. Usaremos más páginas que marcos disponibles y modificaremos una página para comprobar su recuperación desde Swap. Dejaremos anotados el orden FIFO y los resultados esperados para comparar la ejecución.

## [P2-031] Organizar la hoja, elegir el nombre del equipo y añadir el logo

[Ver tarea #31](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/31) · **Responsable: Cristian** · 3 puntos relativos.

Organizaremos los paneles de la hoja para poder seguir CPU, buses, memorias, cachés y E/S durante las demos. Elegiremos el nombre y el logo del equipo y los incorporaremos también a la documentación y la presentación. Los controles Step, Run, Pause y Reset mostrarán el modo actual de ejecución.

## [P2-032] Mostrar visualmente cómo se resuelve un Page Fault

[Ver tarea #32](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/32) · **Responsable: Marcelo** · 3 puntos relativos.

Vamos a mostrar las etapas de un Page Fault en la hoja: dirección solicitada, página ausente, víctima, paso por Swap, carga de los 32 bytes y actualización de la tabla. La animación seguirá el orden del motor y permitirá detenerse en cada fase con Step.

## [P2-033] Animar los buses y distinguir buffers activos y High-Z

[Ver tarea #33](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/33) · **Responsable: Joseph** · 3 puntos relativos.

Animaremos los caminos internos y externos de los datos, distinguiendo el emisor activo, los receptores habilitados y los buffers en High-Z. Cada cable y señal deberán coincidir con la micro-palabra actual. Incluiremos los recorridos de registros, memoria, caché, teclado y LCD.

## [P2-034] Probar registros, instrucciones y buses con resultados conocidos

[Ver tarea #34](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/34) · **Responsable: Cristian** · 3 puntos relativos.

Prepararemos pruebas de CPU y buses con resultados esperados definidos de antemano. Cubriremos registros, operaciones, flags, saltos, bucles y HALT, además de los casos de bus sin emisor, con uno y con contención. Guardaremos las trazas para localizar y corregir cualquier diferencia.

## [P2-035] Probar traducción de direcciones, FIFO y conservación en Swap

[Ver tarea #35](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/35) · **Responsable: Marcelo** · 3 puntos relativos.

Comprobaremos la traducción de direcciones, la tabla de páginas, FIFO y la conservación de los datos en Swap. Las pruebas incluirán direcciones frontera, páginas ausentes, marcos llenos y víctimas limpias o modificadas. También revisaremos que se respeten las reservas de RAM para teclado y LCD.

## [P2-036] Probar cachés, teclado y LCD trabajando juntos

[Ver tarea #36](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/36) · **Responsable: Joseph** · 3 puntos relativos.

Vamos a probar cachés y E/S trabajando dentro del sistema completo. Compararemos los hits y misses con una secuencia conocida y seguiremos los caracteres desde la cola hasta el LCD. Repetiremos los casos después de reset, de cargar un programa y de reemplazar una página.

## [P2-037] Explicar la arquitectura, las instrucciones y la micro-palabra en español e inglés

[Ver tarea #37](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/37) · **Responsable: Cristian** · 3 puntos relativos.

Documentaremos la arquitectura, la ISA y la micro-palabra en español e inglés. Los diagramas mostrarán los recorridos reales entre CPU, buses, cachés, MMU, Swap y periféricos. Las tablas y los ejemplos tendrán que coincidir con la versión implementada.

## [P2-038] Escribir una guía de instalación y uso en ambos idiomas

[Ver tarea #38](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/38) · **Responsable: Marcelo** · 3 puntos relativos.

Escribiremos el manual de instalación y uso de Sheets y Apps Script en los dos idiomas. Incluiremos la preparación de la planilla, el editor, la carga de programas, los controles y la lectura de los paneles. Lo comprobaremos desde otra computadora y añadiremos el enlace directo de la planilla.

## [P2-039] Relacionar cada punto de la rúbrica con una prueba real

[Ver tarea #39](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/39) · **Responsable: Joseph** · 3 puntos relativos.

Reuniremos la evidencia de cada criterio de la rúbrica: tareas, PR, pruebas, capturas y trazas. El índice permitirá localizar tanto el funcionamiento de los módulos como los aportes de cada integrante. Revisaremos los enlaces y la correspondencia entre las versiones en español e inglés.

## [P2-040] Preparar la explicación de Cristian y practicar cambios en vivo

[Ver tarea #40](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/40) · **Responsable: Cristian** · 3 puntos relativos.

Cristian preparará la explicación de CPU, buses y micro-palabra con una traza de su trabajo. También practicará traducción de direcciones y FIFO para poder responder sobre otros módulos. El ensayo incluirá una modificación de código o memoria en vivo y una intervención de unos 6 minutos y 40 segundos.

## [P2-041] Preparar la explicación de Marcelo y practicar cambios en vivo

[Ver tarea #41](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/41) · **Responsable: Marcelo** · 3 puntos relativos.

Marcelo preparará la explicación de memoria virtual, tabla de páginas, FIFO y Swap. Practicará también la predicción de hits y misses y las señales de un acceso. El ensayo incluirá una modificación en vivo y una intervención de unos 6 minutos y 40 segundos.

## [P2-042] Preparar la explicación de Joseph y practicar cambios en vivo

[Ver tarea #42](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/42) · **Responsable: Joseph** · 3 puntos relativos.

Joseph preparará la explicación de L1I, L1D, L2 y el recorrido del teclado al LCD. También practicará la lectura de una micro-palabra de CPU o buses. El ensayo incluirá un cambio de código o memoria y una intervención de unos 6 minutos y 40 segundos.

## [P2-043] Ejecutar las tres demos completas en la misma planilla

[Ver tarea #43](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/43) · **Responsable: Cristian** · 2 puntos relativos.

Ejecutaremos las tres demos completas en una misma versión de la planilla, desde reset y usando Step y Run. Compararemos sus resultados con los previstos y revisaremos la sincronización de registros, buses, memoria, cachés, E/S y animaciones. Los fallos quedarán registrados y se volverán a probar después de corregirlos.

## [P2-044] Preparar la versión final y comprobar el enlace de Google Sheets

[Ver tarea #44](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/44) · **Responsable: Marcelo** · 2 puntos relativos.

Prepararemos la versión estable de entrega a partir del trabajo integrado en develop. Comprobaremos el enlace de Sheets desde otra cuenta, la documentación bilingüe y los resultados de las tres demos. El PR hacia main dejará identificado el commit de la versión que vamos a presentar.

## [P2-045] Ensayar la defensa completa y preparar la presentación

[Ver tarea #45](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/45) · **Responsable: Joseph** · 2 puntos relativos.

Haremos un ensayo completo con 20 minutos de exposición y demos, más 10 minutos de preguntas individuales. Ajustaremos los tiempos y las transiciones para que los tres expliquemos una parte técnica sustancial. También confirmaremos logo, indumentaria, equipos y conexión para la defensa.

## [P2-046] Comprobar las tareas y aportes de Cristian antes del cierre

[Ver tarea #46](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/46) · **Responsable: Cristian** · 2 puntos relativos.

Revisaremos las tareas y aportes de Cristian: ramas personales, commits, PR y pruebas. Comprobaremos que los enlaces funcionen y que pueda explicar sus cambios y su relación con el resto del simulador. Las evidencias pendientes deberán quedar resueltas antes del cierre oficial.

## [P2-047] Comprobar las tareas y aportes de Marcelo antes del cierre

[Ver tarea #47](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/47) · **Responsable: Marcelo** · 2 puntos relativos.

Revisaremos las tareas y aportes de Marcelo en código, pruebas y documentación. Comprobaremos sus ramas, commits y PR, además de la preparación para explicar otros módulos y modificar código o memoria en vivo. Resolveremos lo que falte antes del cierre oficial.

## [P2-048] Comprobar las tareas y aportes de Joseph antes del cierre

[Ver tarea #48](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/48) · **Responsable: Joseph** · 2 puntos relativos.

Revisaremos las tareas y aportes de Joseph, junto con sus ramas, commits, PR y pruebas. Comprobaremos que pueda explicar los cambios y localizar su evidencia durante la defensa. Los enlaces y el material pendiente quedarán listos antes del cierre oficial.
