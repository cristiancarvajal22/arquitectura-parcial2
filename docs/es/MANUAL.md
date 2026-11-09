# Instalación y uso · Google Sheets

Responsable: Marcelo · tarea #38.

[English](../en/MANUAL.md) · [Planilla del equipo](https://docs.google.com/spreadsheets/d/1VhOJ5jGlvC1rMByyLyrB1OWXCSWokwGDJDajLnvnqLE/edit)

## Instalar la versión integrada

1. Abrir la planilla con una cuenta que tenga permiso de edición.
2. Entrar en **Extensiones → Apps Script**.
3. Copiar el contenido completo de [`dist/SimuladorP2.gs`](../../dist/SimuladorP2.gs).
4. Crear una secuencia de comandos llamada `IntegracionP2` y pegar el contenido.
5. El paquete contiene todas sus dependencias. Conservar una copia de los scripts previos en Git y evitar dos versiones distintas de las mismas funciones globales. Los antiguos ejemplos `mmuPreview*` no son el motor.
6. Guardar. Seleccionar **P2_Setup** y ejecutar. Revisar los permisos de acceso a la misma planilla; no se necesitan claves, tokens, publicación web ni el botón Implementar.
7. Volver a Sheets. Se abrirá el panel lateral. Si no aparece, recargar y usar **Simulador P2 → Abrir controles**.
8. Revisar la configuración y pulsar **Activar configuración del equipo**. Esta acción inicia una ejecución nueva y vacía; el perfil técnico usa las direcciones del mapa de integración. La aprobación académica del PR se registra por separado.

El motor permanece bloqueado si el perfil tiene estado `proposal`. La activación selecciona explícitamente el perfil `team-integration-40-v1`; no modifica los ejemplos históricos del contrato.

## Cargar y ejecutar

- Elegir una de las tres demos y pulsar **Cargar demo**.
- **STEP** confirma un micro-paso, con como máximo una transferencia de datos/dirección por segmento.
- **RUN** agenda lotes de hasta ocho micro-pasos desde el navegador. La interfaz no usa un bucle de espera en el servidor.
- **PAUSA** detiene el agendamiento y cambia el modo a pausa. Esperar a que termine una petición en curso antes de iniciar otra acción.
- **RESET** crea un estado nuevo, limpia programa, RAM ordinaria, Swap, cachés, métricas y cola; preserva el perfil elegido. Volver a cargar una demo antes de ejecutar.
- Para introducir código propio, editar **Editor**, una línea ASM por celda desde A2, y pulsar **Cargar código de la hoja Editor**. Se valida todo el programa antes de sustituir el estado.

El cargador conserva el mapa de línea fuente → dirección → bytes. No permite programas que invadan la página 15 de E/S, ni saltos fuera de una frontera de instrucción reconocida.

## Demos y resultados esperados

| Demo | Acción | Resultado |
|---|---|---|
| Aritmética | Cargar y ejecutar | AX=35, DX=5; VA 300 contiene 35 |
| Eco | Cargar; escribir ABCDEFGH y enviar al teclado; ejecutar | LCD=ABCDEFGH; cola vacía; cursor 0 |
| Accesos dispersos | Cargar y ejecutar | DX=71; fallos de página, FIFO y guardados de víctimas Dirty visibles |

En Eco, ejecutar con la cola vacía deja pendiente la misma instrucción IN. Enviar caracteres y continuar con RUN. Si se quiere usar STEP después de RUN, pulsar PAUSA primero. Una cola llena rechaza una entrada que no cabe sin aceptar una parte oculta.

## Leer los paneles

- **CPU:** registros, flags, PC/MAR de nueve bits, IR de cuatro bytes y buses. `Z`/High-Z significa ausencia de emisor, no el valor cero.
- **RAM:** 256 bytes físicos. Marcos 0..6 reemplazables; marco 7 protegido.
- **MMU_P2_011:** 16 entradas, P/PFN/Dirty/Reference, cola FIFO, VA y offset. En rojo se observa el fallo, víctima, Dirty y avance 0..32 bytes. El botón del panel permite alternar Reference de una página presente no protegida, solo mediante una acción validada y sin transacción pendiente.
- **Swap:** las 16 páginas de respaldo de 32 bytes. Una víctima Dirty se guarda completa antes de reutilizar su marco.
- **Caches:** L1I/L1D de una línea de ocho bytes; L2 de cuatro líneas. Hits, misses y tasa de aciertos son proyecciones del mismo estado confirmado. Con cero búsquedas, la tasa es 0%.
- **LCD_P2_023:** ocho caracteres y los ocho bytes de video reales. El cursor es circular: el noveno carácter reemplaza el primero. Cero se muestra como espacio; ASCII 32..126 se muestra literalmente y otros bytes como `·`.
- **Teclado:** cola, cantidad, head y tail. No existe una segunda copia de sus bytes fuera de RAM.
- **Señales:** micropalabra de integración de 40 bits: las 30 señales iniciales y diez señales para cachés, Swap y traducción. Cada buffer muestra conducción o High-Z.
- **Traza:** eventos confirmados por época, revisión, ciclo, VA/PA, emisores, receptores y señales. Reset cambia de época; el historial conserva su identificación.

La hoja es una vista. Editar sus celdas de RAM o MMU no modifica el estado persistido y el siguiente render las repone. Usar el editor ASM y las acciones validadas del panel.

## Mapa utilizado

| Región | VA | PA |
|---|---|---|
| Memoria paginada ordinaria | 0..479 | Marcos 0..6, 0..223 |
| Teclado | 480..487 | 224..231 |
| LCD | 488..495 | 232..239 |
| Reservado sin periférico | 496..511 | 240..255 |

Este mapa coincide con RAM, teclado, ensamblador y caché L2 del equipo. Los ejemplos antiguos que usaban PA 240/248 son ilustrativos, no el perfil de integración.

## Pruebas y límites de la evidencia

Las pruebas locales verifican las tres demos mediante el motor real y comprueban el adaptador de Sheets con servicios simulados. Las trazas están en [evidence/integration](../evidence/integration).

La validación desde otra computadora, la instalación de este paquete en la planilla y las capturas de la versión integrada deben registrarse con resultados reales. La vista aislada anterior de MMU/LCD no sustituye esa validación.

Si una acción informa `STALE_REVISION`, actualizar el panel y repetir sobre el estado actual. `BUSY` significa que otra acción conserva el bloqueo. `INVALID_PROFILE` exige revisar la configuración; no se corrige ocultando decisiones pendientes en el contrato.

Usar únicamente el paquete `SimuladorP2.gs` para esta guía; el paquete alternativo `Simulador.gs` del equipo tiene otros controles. No instalar ambos como motores activos.
