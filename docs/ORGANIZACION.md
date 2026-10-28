# Organización acordada para iniciar

## Estructura prevista del repositorio
La única entrega inicial es documentación de planificación y plantillas. Crear los directorios de implementación en sus issues, cuando tengan contenido real.
- `src/core/`: estado, reloj, eventos y contratos compartidos.
- `src/cpu/`: registros, ALU, decodificación y microsecuencias.
- `src/buses/`: control/direcciones/datos, arbitraje, buffers y control word.
- `src/memory/`: RAM, MMU, tabla, FIFO, Swap y fallos.
- `src/cache/`: L1I/L1D/L2 y coherencia.
- `src/io/`: KBD, LCD y mapa de E/S.
- `src/assembler/`: editor, sintaxis, símbolos, codificación, cargador y catálogo.
- `src/sheets/`: adaptador Apps Script y representación en celdas.
- `src/ui/`: animaciones y controles.
- `programs/`: tres fuentes ASM y resultados esperados.
- `tests/unit/`, `tests/integration/`, `tests/acceptance/`: pruebas futuras.
- `docs/es/`, `docs/en/`: arquitectura, ISA, micro-palabra, instalación y uso.
- `docs/evidence/`: trazas y enlaces de evidencia real, sin inventar historial.
- `assets/`: nombre/logotipo oficial del equipo y capturas finales.
- `.github/`: plantillas para issues y PRs.

## Responsabilidades y revisión
Cristian coordina CPU/buses; Marcelo, memoria virtual; Joshep, cachés. La coordinación significa mantener contratos e integración, no exclusividad del código.
Todos implementan funciones sustanciales, revisan otros módulos, escriben pruebas y preparan una explicación de todas las partes.
Revisores alternados: en los bloques impares C→M, M→J, J→C; en los pares C→J, M→C, J→M. Reparto inicial: 16 tareas por integrante y la misma suma de puntos relativos. Los puntos no son horas ni nota.
Si cambian una asignación, acuerden el cambio y revisen la carga y el commit graph; no fabriquen commits para igualar cantidades.

## Cuentas del equipo
- Cristian: `cristiancarvajal22`, propietario del repositorio.
- Marcelo: `marceloaguilera777`, usuario comunicado por Cristian; invitación de escritura enviada y aceptación pendiente. Sus 16 tareas y 16 revisiones están identificadas en las issues. La asignación nativa de GitHub se completará tras habilitar su acceso.
- Joshep: usuario todavía pendiente; mantener responsabilidades por nombre.

## GitHub Project
Vista principal de tipo Board agrupada por Status:
1. **Backlog**: resultado definido, aún no listo por dependencias.
2. **To Do**: dependencias satisfechas, alcance y criterios claros.
3. **In Progress**: el responsable comenzó y enlazó su rama; máximo una implementación activa por persona.
4. **In Review**: PR a develop abierto, evidencia de pruebas adjunta, reviewer solicitado.
5. **Done**: criterios verificados, revisión ajena aprobada, PR integrado y evidencia enlazada. Una fusión en develop requiere cerrar explícitamente la issue si GitHub no la cierra por no ser la rama por defecto.

Campos mínimos reales: Title, Status, Assignees. Responsable, reviewer, prioridad P0/P1/P2, puntos, fase, rúbrica, rama y dependencias se guardan en el cuerpo de cada issue y en BACKLOG.md; no dependen de campos personalizados inexistentes.
Las tres tareas iniciales de contratos pasan a To Do. No iniciar trabajo futuro ni marcar tareas Done por crear tarjetas. Bloqueos se describen en la issue y permanecen en su estado real.

## Secuencia y cortes propuestos
- 27-29 octubre: contratos de estado, direcciones, ISA, APIs y micro-palabra; los tres deben revisarlos.
- 30 octubre-2 noviembre: CPU/buses, memoria, cachés y E/S por contratos.
- 3-5 noviembre: editor/ensamblador/cargador, demos, animaciones e integración.
- 6-7 noviembre: regresión, documentación bilingüe, enlace a la planilla y ensayo completo.
- 8 noviembre: ensayo final, auditoría y candidata estable en main.
- 9 noviembre antes de las 10:00: verificación de entrega; no commits ni movimientos de GitHub después del cierre.
Estas ventanas son una propuesta de ejecución; recalibrar la carga con la disponibilidad real, todavía no comunicada.

## Acuerdo de finalización
Toda tarea técnica debe dejar PR revisado, prueba reproducible, criterios marcados y evidencia vinculada. Toda tarea documental necesita revisión de exactitud y de correspondencia ES/EN cuando aplica. La defensa se ensaya con modificación de código/memoria real y preguntas cruzadas. Los tres exponen ~6 min 40 s dentro de los 20 min grupales; las preguntas individuales ocupan los 10 min siguientes.
