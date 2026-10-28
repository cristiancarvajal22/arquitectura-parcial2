# Tareas del proyecto

El proyecto reúne **48 tareas: 16 por persona y 57 puntos relativos de esfuerzo para cada integrante**. Cada tarjeta incluye la descripción del trabajo, sus pasos, los criterios de aceptación y el entregable.

El avance se registra en el [tablero](https://github.com/users/cristiancarvajal22/projects/6). Los PR se comprobarán entre compañeros.

## [P2-001] Definir qué datos guarda el simulador y cómo se comunican sus partes

[Ver tarea #1](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/1) · **Responsable: Cristian** · 2 puntos relativos.

El estado del simulador reunirá los registros de la CPU, la memoria, las cachés, el teclado y el LCD en una estructura común. Esta tarea incluye la definición de los datos que comparte cada módulo y de los eventos que describen cada paso del reloj, para mantener sincronizadas la ejecución y las animaciones.

## [P2-002] Definir las instrucciones y las direcciones de memoria

[Ver tarea #2](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/2) · **Responsable: Marcelo** · 2 puntos relativos.

La ISA establecerá las instrucciones reconocidas por la CPU, sus operandos y su codificación en bytes. El mapa de memoria indicará la ubicación de programas, datos, teclado y LCD. Ambas definiciones servirán como referencia para conectar CPU, ensamblador y memoria.

## [P2-003] Decidir cómo funcionarán las cachés y las señales de control

[Ver tarea #3](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/3) · **Responsable: Joseph** · 2 puntos relativos.

Las políticas de caché definirán el funcionamiento de L1I, L1D y L2 durante lecturas, escrituras y reemplazos. La especificación también incluirá las señales de control utilizadas en los buses y las actualizaciones necesarias para evitar copias antiguas cuando cambie una página.

## [P2-004] Crear los cuatro registros y las operaciones de 8 bits

[Ver tarea #4](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/4) · **Responsable: Cristian** · 5 puntos relativos.

Los registros AX, BX, CX y DX almacenarán datos de 8 bits y trabajarán junto con los registros de control de la CPU. La ALU ejecutará las operaciones de la ISA y actualizará ZF, CF y SF según el resultado. Las pruebas cubrirán operaciones normales, límites y desbordamientos.

## [P2-005] Hacer que la CPU busque, entienda y ejecute instrucciones

[Ver tarea #5](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/5) · **Responsable: Marcelo** · 5 puntos relativos.

El ciclo de la CPU comprenderá la búsqueda, decodificación y ejecución de instrucciones. Cada instrucción contará con una secuencia de micro-pasos que utilizará PC, MAR, MDR, IR y las señales de los buses. El ciclo también contemplará la espera y continuación de accesos a memoria o al teclado.

## [P2-006] Crear el reloj y guardar el estado entre pasos en Apps Script

[Ver tarea #6](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/6) · **Responsable: Joseph** · 5 puntos relativos.

El reloj controlará el avance del simulador y el guardado de su estado entre ejecuciones de Apps Script. Step ejecutará un micro-paso y Run procesará grupos pequeños de pasos sin bloquear la hoja. El control de ejecución incluirá pausa, reinicio y prevención de modificaciones simultáneas.

## [P2-007] Controlar quién puede transmitir por cada bus

[Ver tarea #7](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/7) · **Responsable: Cristian** · 5 puntos relativos.

El arbitraje de los buses permitirá un solo emisor activo por segmento. Las salidas restantes permanecerán en High-Z. La detección de contención detendrá el micro-paso antes de modificar datos si dos componentes intentan transmitir al mismo tiempo.

## [P2-008] Mover lecturas, escrituras y E/S a través de los buses

[Ver tarea #8](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/8) · **Responsable: Marcelo** · 5 puntos relativos.

Las lecturas, escrituras y operaciones de E/S recorrerán los buses del simulador. Cada transferencia registrará su dirección, emisor, receptor y señales Read, Write, Clock e IO. El acceso a memoria y periféricos quedará conectado con este recorrido.

## [P2-009] Mostrar la micro-palabra y qué hace cada señal

[Ver tarea #9](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/9) · **Responsable: Joseph** · 5 puntos relativos.

La micro-palabra mostrará los bits de control activos en cada micro-paso. Su representación en la hoja identificará las salidas y cargas habilitadas y su relación con los buffers. Los valores visibles coincidirán con las acciones ejecutadas por el motor.

## [P2-010] Crear la RAM de 256 bytes y reservar teclado y LCD

[Ver tarea #10](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/10) · **Responsable: Cristian** · 3 puntos relativos.

La RAM tendrá 256 bytes distribuidos en ocho marcos de 32 bytes. Dentro de esa capacidad estarán reservados los ocho bytes del teclado y los ocho del video del LCD. Las lecturas y escrituras respetarán los límites de cada marco y las zonas de E/S.

## [P2-011] Traducir direcciones virtuales a direcciones de RAM

[Ver tarea #11](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/11) · **Responsable: Marcelo** · 3 puntos relativos.

La MMU traducirá las 512 direcciones virtuales a posiciones de la RAM física de 256 bytes. La tabla tendrá una entrada por página virtual, con presencia, marco, Dirty y Reference. La traducción separará el número de página y el desplazamiento para calcular la dirección física.

## [P2-012] Guardar y recuperar páginas en Swap

[Ver tarea #12](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/12) · **Responsable: Joseph** · 3 puntos relativos.

Swap almacenará el respaldo de las páginas que no estén cargadas en RAM. Las transferencias moverán páginas completas de 32 bytes y conservarán sus modificaciones. El almacenamiento distinguirá la imagen inicial del programa de las páginas actualizadas durante la ejecución.

## [P2-013] Elegir qué página sale de RAM usando FIFO

[Ver tarea #13](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/13) · **Responsable: Cristian** · 5 puntos relativos.

El reemplazo FIFO utilizará el orden de entrada de las páginas para elegir una víctima cuando no queden marcos libres utilizables. La cola excluirá los marcos reservados según el mapa de E/S. Su estado y la víctima seleccionada quedarán visibles en la hoja.

## [P2-014] Atender un fallo de página y continuar la instrucción

[Ver tarea #14](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/14) · **Responsable: Marcelo** · 5 puntos relativos.

La atención de un Page Fault suspenderá el acceso a una página ausente, obtendrá un marco y guardará la víctima en Swap si fue modificada. Después cargará la página solicitada, actualizará la tabla y continuará la instrucción sin repetir sus efectos.

## [P2-015] Actualizar Dirty y Reference y evitar copias viejas al cambiar páginas

[Ver tarea #15](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/15) · **Responsable: Joseph** · 5 puntos relativos.

Los bits Dirty y Reference reflejarán las escrituras y consultas de páginas, incluidos los accesos resueltos por caché. La reutilización de un marco retirará las copias que ya no correspondan a su contenido. Las pruebas comprobarán que una página modificada conserve sus datos después de un desalojo y una recarga.

## [P2-016] Crear la caché L1I para las instrucciones

[Ver tarea #16](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/16) · **Responsable: Cristian** · 5 puntos relativos.

L1I almacenará una línea de ocho bytes dedicada a las instrucciones del programa. Cada búsqueda del PC comprobará si los bytes solicitados están presentes y consultará L2 cuando falten. El funcionamiento incluirá saltos y búsquedas que crucen límites de línea o página.

## [P2-017] Crear la caché L1D para los datos

[Ver tarea #17](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/17) · **Responsable: Marcelo** · 5 puntos relativos.

L1D almacenará una línea de ocho bytes para las lecturas y escrituras de datos. Su conexión con L2 seguirá las políticas de escritura y actualización acordadas. Los accesos al teclado y al LCD utilizarán el camino de E/S sin almacenarse en esta caché.

## [P2-018] Crear la caché L2 de 32 bytes y su reemplazo FIFO

[Ver tarea #18](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/18) · **Responsable: Joseph** · 5 puntos relativos.

L2 funcionará como una caché unificada de cuatro líneas de ocho bytes. Atenderá solicitudes de L1I y L1D y obtendrá datos de RAM cuando no encuentre el bloque solicitado. Su reemplazo utilizará una cola FIFO independiente de la cola de páginas.

## [P2-019] Mantener actualizadas las copias de caché y memoria

[Ver tarea #19](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/19) · **Responsable: Cristian** · 3 puntos relativos.

La coherencia entre L1I, L1D, L2 y RAM evitará que una lectura utilice copias antiguas. Las actualizaciones cubrirán escrituras, carga de programas, edición de memoria y reemplazo de páginas. Cada cambio afectará únicamente a las líneas correspondientes.

## [P2-020] Contar los hits y misses de cada caché

[Ver tarea #20](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/20) · **Responsable: Marcelo** · 3 puntos relativos.

Los contadores registrarán hits y misses de L1I, L1D y L2 por separado y calcularán la tasa de aciertos de cada nivel. Solo se contabilizarán las consultas que realmente reciba cada caché. Una secuencia con resultados conocidos permitirá comprobar los valores y su reinicio.

## [P2-021] Animar los aciertos, fallos y movimientos entre cachés

[Ver tarea #21](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/21) · **Responsable: Joseph** · 3 puntos relativos.

La animación de cachés mostrará consultas y transferencias entre L1I, L1D, L2 y RAM. Identificará la línea consultada, el resultado hit o miss y el movimiento de bytes durante cargas y reemplazos. La representación visual quedará sincronizada con el micro-paso y los contadores.

## [P2-022] Crear la entrada de teclado y su cola de ocho bytes

[Ver tarea #22](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/22) · **Responsable: Cristian** · 5 puntos relativos.

El teclado contará con un panel de entrada y una cola circular de ocho bytes en RAM. Los caracteres conservarán su orden hasta ser leídos por IN mediante En_KBD y el bus. El manejo de la cola incluirá estados vacío y lleno, vuelta al inicio y entrada de un noveno carácter.

## [P2-023] Crear el LCD de ocho caracteres y su memoria de video

[Ver tarea #23](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/23) · **Responsable: Marcelo** · 5 puntos relativos.

El LCD mostrará una fila de ocho caracteres asociada con ocho bytes de video en RAM. El cursor y las escrituras se actualizarán mediante OUT y Ld_LCD. Las pruebas comprobarán la correspondencia entre pantalla y memoria, además del estado posterior a un reinicio.

## [P2-024] Hacer funcionar IN y OUT dentro del ciclo de la CPU

[Ver tarea #24](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/24) · **Responsable: Joseph** · 5 puntos relativos.

IN y OUT formarán parte del ciclo de ejecución de la CPU. IN transferirá un byte del teclado a un registro y OUT enviará el contenido de un registro al LCD mediante el mapa de E/S y los buffers tri-estado. Las pausas y reanudaciones no duplicarán el consumo de caracteres.

## [P2-025] Leer el código ensamblador y explicar sus errores

[Ver tarea #25](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/25) · **Responsable: Cristian** · 5 puntos relativos.

El análisis del código ASM reconocerá instrucciones, registros, números, etiquetas y operandos de teclado o LCD. El ensamblador resolverá las etiquetas y validará cada línea según la ISA. Los errores mostrarán su ubicación y causa sin dejar un programa cargado parcialmente.

## [P2-026] Convertir instrucciones a bytes y cargarlas en memoria virtual

[Ver tarea #26](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/26) · **Responsable: Marcelo** · 5 puntos relativos.

El codificador transformará las instrucciones validadas en bytes y el cargador las ubicará en memoria virtual. La carga conservará la relación entre líneas de fuente y bytes generados y preparará PC, tabla de páginas y cachés para la nueva ejecución. La validación impedirá programas que excedan el espacio disponible o invadan E/S.

## [P2-027] Crear el catálogo de programas y el editor en celdas

[Ver tarea #27](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/27) · **Responsable: Joseph** · 5 puntos relativos.

El catálogo y el editor en celdas permitirán seleccionar, modificar, guardar, verificar y cargar programas ASM. Las fuentes permanecerán separadas del estado de ejecución del simulador. El catálogo incluirá los tres programas de demostración.

## [P2-028] Preparar un programa de operaciones y bucles con AX, BX, CX y DX

[Ver tarea #28](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/28) · **Responsable: Cristian** · 3 puntos relativos.

La demo aritmética utilizará AX, BX, CX y DX, un bucle y un salto condicional. Su resultado esperado estará calculado para compararlo con la ejecución hasta HALT. El programa incluirá una variante pequeña para demostrar un cambio durante la defensa.

## [P2-029] Preparar un programa que copie el teclado al LCD

[Ver tarea #29](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/29) · **Responsable: Marcelo** · 3 puntos relativos.

La demo de eco leerá caracteres del teclado con IN y los enviará al LCD con OUT. Su ejecución mostrará los cambios en la cola, el bus y la memoria de video. Los casos de prueba incluirán espera sin entrada, texto de ocho caracteres y reinicio.

## [P2-030] Preparar un programa que provoque fallos de página y de caché

[Ver tarea #30](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/30) · **Responsable: Joseph** · 3 puntos relativos.

La demo de accesos dispersos provocará misses de caché y Page Faults utilizando más páginas que marcos disponibles. También modificará una página y comprobará la conservación de sus datos mediante Swap. La ejecución se contrastará con el orden FIFO y los contadores previstos.

## [P2-031] Organizar la hoja, elegir el nombre del equipo y añadir el logo

[Ver tarea #31](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/31) · **Responsable: Cristian** · 3 puntos relativos.

La hoja organizará los paneles de CPU, buses, memorias, cachés y E/S para facilitar el seguimiento de las demos. El nombre y el logo del equipo aparecerán también en la documentación y la presentación. Los controles Step, Run, Pause y Reset indicarán el modo de ejecución actual.

## [P2-032] Mostrar visualmente cómo se resuelve un Page Fault

[Ver tarea #32](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/32) · **Responsable: Marcelo** · 3 puntos relativos.

La visualización del Page Fault mostrará la dirección solicitada, la página ausente, la víctima, la transferencia por Swap y la actualización de la tabla. La animación seguirá el orden del motor y representará la carga de los 32 bytes. Step permitirá detener la ejecución en cada fase.

## [P2-033] Animar los buses y distinguir buffers activos y High-Z

[Ver tarea #33](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/33) · **Responsable: Joseph** · 3 puntos relativos.

La animación de buses distinguirá los caminos internos y externos, el emisor activo, los receptores habilitados y las salidas en High-Z. Cada cable y señal coincidirán con la micro-palabra actual. La representación incluirá registros, memoria, cachés, teclado y LCD.

## [P2-034] Probar registros, instrucciones y buses con resultados conocidos

[Ver tarea #34](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/34) · **Responsable: Cristian** · 3 puntos relativos.

Las pruebas de CPU y buses compararán la ejecución con resultados definidos de antemano. Cubrirán registros, operaciones, flags, saltos, bucles y HALT, además de buses sin emisor, con un emisor o con contención. Las trazas permitirán localizar y comprobar las correcciones.

## [P2-035] Probar traducción de direcciones, FIFO y conservación en Swap

[Ver tarea #35](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/35) · **Responsable: Marcelo** · 3 puntos relativos.

Las pruebas de memoria comprobarán la traducción de direcciones, la tabla de páginas, FIFO y la conservación de datos en Swap. Incluirán direcciones frontera, páginas ausentes, marcos llenos y víctimas limpias o modificadas. También validarán las reservas de RAM del teclado y del LCD.

## [P2-036] Probar cachés, teclado y LCD trabajando juntos

[Ver tarea #36](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/36) · **Responsable: Joseph** · 3 puntos relativos.

Las pruebas de cachés y E/S verificarán su funcionamiento dentro del sistema completo. Los hits y misses se compararán con una secuencia conocida y los caracteres se seguirán desde la cola hasta el LCD. Los casos se repetirán tras un reinicio, una carga de programa y un reemplazo de página.

## [P2-037] Explicar la arquitectura, las instrucciones y la micro-palabra en español e inglés

[Ver tarea #37](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/37) · **Responsable: Cristian** · 3 puntos relativos.

La documentación técnica describirá la arquitectura, la ISA y la micro-palabra en español e inglés. Los diagramas mostrarán los recorridos entre CPU, buses, cachés, MMU, Swap y periféricos. Las tablas y los ejemplos corresponderán a la versión implementada.

## [P2-038] Escribir una guía de instalación y uso en ambos idiomas

[Ver tarea #38](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/38) · **Responsable: Marcelo** · 3 puntos relativos.

El manual explicará la instalación y el uso de Sheets y Apps Script en ambos idiomas. Incluirá la preparación de la planilla, el editor, la carga de programas, los controles y la lectura de los paneles. Su validación se realizará desde otra computadora e incluirá el enlace directo de la planilla.

## [P2-039] Relacionar cada punto de la rúbrica con una prueba real

[Ver tarea #39](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/39) · **Responsable: Joseph** · 3 puntos relativos.

La matriz de evidencia relacionará cada criterio de la rúbrica con sus tareas, PR, pruebas, capturas y trazas. El índice permitirá localizar el funcionamiento de los módulos y los aportes de cada integrante. La revisión comprobará los enlaces y la correspondencia entre español e inglés.

## [P2-040] Preparar la explicación de Cristian y practicar cambios en vivo

[Ver tarea #40](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/40) · **Responsable: Cristian** · 3 puntos relativos.

La preparación de Cristian cubrirá CPU, buses y micro-palabra mediante una traza de su trabajo. La práctica incluirá traducción de direcciones y FIFO para responder sobre otros módulos. El ensayo contemplará una modificación en vivo y una intervención de unos 6 minutos y 40 segundos.

## [P2-041] Preparar la explicación de Marcelo y practicar cambios en vivo

[Ver tarea #41](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/41) · **Responsable: Marcelo** · 3 puntos relativos.

La preparación de Marcelo cubrirá memoria virtual, tabla de páginas, FIFO y Swap. La práctica incluirá la predicción de hits y misses y las señales utilizadas en un acceso. El ensayo contemplará una modificación en vivo y una intervención de unos 6 minutos y 40 segundos.

## [P2-042] Preparar la explicación de Joseph y practicar cambios en vivo

[Ver tarea #42](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/42) · **Responsable: Joseph** · 3 puntos relativos.

La preparación de Joseph cubrirá L1I, L1D, L2 y el recorrido del teclado al LCD. La práctica incluirá la interpretación de una micro-palabra de CPU o buses. El ensayo contemplará un cambio de código o memoria y una intervención de unos 6 minutos y 40 segundos.

## [P2-043] Ejecutar las tres demos completas en la misma planilla

[Ver tarea #43](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/43) · **Responsable: Cristian** · 2 puntos relativos.

La regresión final ejecutará las tres demos en una misma versión de la planilla, desde reset y usando Step y Run. Los resultados se compararán con los previstos y con el estado de registros, buses, memoria, cachés, E/S y animaciones. Los fallos registrados se volverán a probar después de sus correcciones.

## [P2-044] Preparar la versión final y comprobar el enlace de Google Sheets

[Ver tarea #44](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/44) · **Responsable: Marcelo** · 2 puntos relativos.

La versión estable se preparará a partir del trabajo integrado en develop. La verificación incluirá el enlace de Sheets desde otra cuenta, la documentación bilingüe y los resultados de las tres demos. El PR hacia main identificará el commit correspondiente a la entrega.

## [P2-045] Ensayar la defensa completa y preparar la presentación

[Ver tarea #45](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/45) · **Responsable: Joseph** · 2 puntos relativos.

El ensayo completo comprenderá 20 minutos de exposición y demos más 10 minutos de preguntas individuales. La distribución de tiempos permitirá que los tres integrantes expliquen una parte técnica sustancial. La preparación incluirá logo, indumentaria, equipos y conexión.

## [P2-046] Comprobar las tareas y aportes de Cristian antes del cierre

[Ver tarea #46](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/46) · **Responsable: Cristian** · 2 puntos relativos.

La auditoría de Cristian reunirá sus tareas, ramas personales, commits, PR y pruebas. La comprobación incluirá los enlaces y la explicación de sus cambios y su relación con otros módulos. Las evidencias pendientes quedarán resueltas antes del cierre oficial.

## [P2-047] Comprobar las tareas y aportes de Marcelo antes del cierre

[Ver tarea #47](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/47) · **Responsable: Marcelo** · 2 puntos relativos.

La auditoría de Marcelo reunirá sus aportes de código, pruebas y documentación. La comprobación incluirá sus ramas, commits y PR, junto con la preparación para explicar otros módulos y realizar cambios en vivo. Los pendientes quedarán resueltos antes del cierre oficial.

## [P2-048] Comprobar las tareas y aportes de Joseph antes del cierre

[Ver tarea #48](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/48) · **Responsable: Joseph** · 2 puntos relativos.

La auditoría de Joseph reunirá sus tareas, ramas, commits, PR y pruebas. La comprobación incluirá la explicación de los cambios y la localización de su evidencia durante la defensa. Los enlaces y el material pendiente quedarán listos antes del cierre oficial.
