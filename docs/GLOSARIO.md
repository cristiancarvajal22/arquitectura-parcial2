# Palabras del proyecto, explicadas de forma sencilla

## CPU, registros y programas
- **CPU:** parte que busca y ejecuta las instrucciones del programa.
- **Registro:** pequeña casilla dentro de la CPU que guarda un valor. AX, BX, CX y DX guardan datos de 8 bits.
- **Byte y bit:** un bit vale 0 o 1; ocho bits forman un byte. Un byte puede representar valores de 0 a 255.
- **ALU:** parte de la CPU que hace operaciones aritméticas y lógicas.
- **Flags o indicadores:** bits que describen un resultado. ZF indica cero, CF acarreo/préstamo y SF signo, según las reglas de la ISA.
- **PC:** dirección de la próxima instrucción. **IR:** instrucción actual. **MAR:** dirección del acceso. **MDR:** dato del acceso.
- **ISA:** lista de instrucciones que entiende la CPU y reglas para escribirlas/codificarlas.
- **ASM o ensamblador:** texto del programa con instrucciones y registros. El programa ensamblador lo convierte en bytes.
- **Etiqueta:** nombre de una posición del programa, usado por los saltos.
- **Fetch:** búsqueda de la instrucción que necesita la CPU.
- **HALT:** instrucción que termina la ejecución.
- **Micro-paso:** una pequeña acción del ciclo de una instrucción.
- **Estado o snapshot:** conjunto de valores del simulador en un momento. Debe poder guardarse y recuperarse.
- **Evento o traza:** registro de una acción; una secuencia de eventos permite explicar paso a paso qué ocurrió.
- **Determinista:** con el mismo programa, datos y estado inicial, produce el mismo resultado.
- **Atómico:** se completa de forma coherente o se detiene sin dejar un cambio a medias.

## Buses y señales
- **Bus:** camino compartido para mover direcciones, datos o señales de control.
- **Emisor/receptor:** componente que envía un valor/componente que lo recibe.
- **Enable:** habilita una salida para transmitir por el bus.
- **Load:** permite que un receptor guarde el valor del bus.
- **High-Z o alta impedancia:** salida desconectada del bus para que no interfiera.
- **Tri-estado:** una salida puede representar 0, 1 o estar desconectada (Z).
- **Contención:** dos emisores intentan usar el mismo bus a la vez. El simulador debe detectarlo antes de cambiar datos.
- **Micro-palabra:** conjunto de bits de control que indica qué acciones están habilitadas en un micro-paso.
- **Read/Write/Clock/IO:** señales de lectura, escritura, reloj y entrada/salida.

## Memoria y cachés
- **RAM física:** memoria disponible realmente en el modelo: 256 bytes.
- **Memoria virtual:** espacio de 512 direcciones que usa el programa. No añade RAM; sus páginas se cargan en los marcos disponibles.
- **Página/marco:** grupo virtual de 32 bytes/espacio de 32 bytes en RAM donde se carga una página.
- **VPN/PFN:** número de página virtual/número de marco físico.
- **Desplazamiento u offset:** posición de un byte dentro de una página o línea.
- **MMU:** parte que traduce direcciones virtuales a físicas usando la tabla de páginas.
- **Tabla de páginas:** indica si cada página está presente, su marco y sus bits de estado.
- **Dirty/Reference:** bits que indican que una página fue modificada/consultada.
- **Page Fault:** se solicita una página ausente de RAM; hay que traerla antes de continuar.
- **Swap:** respaldo que guarda páginas fuera de RAM, incluidas sus modificaciones.
- **FIFO:** sale primero lo que entró primero. El FIFO de páginas y el FIFO de L2 tienen colas independientes.
- **Víctima:** página o línea elegida para salir cuando se necesita espacio.
- **Caché:** copia pequeña y rápida de parte de la memoria. L1I guarda instrucciones, L1D datos y L2 comparte ambos usos.
- **Línea de caché y tag:** grupo de bytes guardado en caché e información que identifica su dirección.
- **Hit/Miss:** el dato pedido ya está en esa caché/no está y hay que buscarlo en otro nivel.
- **Hit Rate:** hits dividido entre hits + misses; se explica también qué mostrar cuando todavía no hubo consultas.
- **Coherencia:** las copias de un dato no se contradicen al leerlas.
- **Invalidar:** marcar una copia como no utilizable porque ya no corresponde a la memoria actual.
- **Bypass o no cacheable:** acceso que evita la caché, como el de teclado o LCD.
- **E/S, KBD y LCD:** entrada/salida, teclado y pantalla. Cada dispositivo usa ocho bytes reservados dentro de RAM.

## GitHub y comprobaciones
- **Issue o tarjeta:** tarea con responsable, explicación y criterios para terminarla.
- **Dependencia:** tarea que debe estar lista antes de empezar otra.
- **Rama feature:** copia de trabajo personal para una tarea concreta.
- **Commit:** cambio guardado en el historial con un mensaje que explica su propósito.
- **PR (Pull Request):** propuesta de unir una rama al trabajo del equipo para que otro compañero compruebe los cambios.
- **Integrar:** unir cambios en develop; la entrega estable pasa después a main.
- **Criterio de aceptación:** resultado concreto que se debe comprobar para dar la tarea por terminada.
- **Prueba reproducible:** pasos y datos que otra persona puede repetir y comparar con el resultado esperado.
