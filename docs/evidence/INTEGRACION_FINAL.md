# Integración final / Final integration

2026-11-09, antes del cierre de las 10:00 de Bolivia. Node v24.22.1.

- 352 pruebas aprobadas, 0 fallidas: `node --test tests/unit/* tests/integration/* tests/contracts/* tests/acceptance/*`.
- El paquete generado `dist/Simulador.gs` se cargó en un contexto JavaScript independiente y ejecutó las tres demos hasta HALT.
- Aritmética: AX=15, DX=5, 3 page faults; STORE en VA 300 conserva 15.
- Eco: LCD=ABCDEFGH, cola vacía, 1 page fault; entrada vacía conserva el estado y permite reanudar.
- Memoria: DX=42, 14 page faults; desalojo Dirty, Swap y recarga conservan el byte.
- Se reutilizan ensamblador, ALU, decodificador, bus, teclado, LCD, MMU, FIFO, L1I/L1D/L2 y coherencia del equipo.
- Correcciones de integración: las pruebas CPU/buses usan el checkout integrado; los tests LCD respetan el reset con espacios ASCII 32.

El coordinador de entrega ejecuta una instrucción por Step y devuelve la traza de transferencias. La paginación se instala por bloque; no se declara una animación completa de cada byte de Swap. El reloj por micro-pasos permanece disponible como módulo separado.

352 local tests passed. The generated Apps Script bundle ran all three programs in an independent JavaScript context. Step commits one instruction; paging commits whole blocks. Live spreadsheet execution and sharing permissions still need validation.

## Pendiente fuera del repositorio

- Instalar y autorizar el script en la hoja compartida; validar el menú y los paneles reales.
- Confirmar enlace accesible para el docente y ensayar la defensa.
- Joseph mueve las tarjetas del tablero conforme al acuerdo de cierre del equipo.

La matriz anterior conserva su corte histórico. Este documento registra las pruebas de la integración actual, sin presentar ensayos ni capturas de Sheets que no se realizaron.
