# Organización del proyecto

## Equipo y tareas
- **Cristian:** `cristiancarvajal22`.
- **Marcelo:** `marceloaguilera777`.
- **Joseph:** `JosephPerez725`.

Cada integrante tiene **16 tareas**. La suma de esfuerzo previsto es igual: **57 puntos relativos por persona**. Los puntos no son horas ni nota. El [índice](BACKLOG.md) enlaza cada tarjeta; la tarjeta explica qué hacer, los pasos sugeridos y cómo comprobarlo.

Cristian coordina CPU y buses; Marcelo, memoria virtual; Joseph, cachés. Coordinar significa ayudar a mantener los acuerdos y la integración. Los tres programan, prueban, documentan y aprenden los módulos ajenos para la defensa.

Cada tarea tiene un responsable. La comprobación de un PR la hace otro compañero disponible; no se asigna una persona fija de antemano. La rúbrica exige PR revisados y contribuciones reales.

## Antes de programar
Las primeras tres tareas deben acordar:
1. Qué datos guarda el simulador y cómo se comunican los módulos.
2. Qué instrucciones admite la CPU y cómo se distribuyen las direcciones de memoria.
3. Cómo se mantienen las cachés y qué señales permiten mover los datos.

Eso evita que cada persona programe una parte incompatible con las demás. La estructura inicial y los valores obligatorios están en [ARQUITECTURA.md](ARQUITECTURA.md).

## Tablero
[GitHub Project](https://github.com/users/cristiancarvajal22/projects/6)

- **Backlog:** está definida, pero se hará más adelante o necesita otras tareas.
- **To Do:** está lista para empezar.
- **In Progress:** el responsable ya empezó; una implementación activa por persona.
- **In Review:** el PR tiene evidencia y está listo para que otro compañero lo compruebe.
- **Done:** se cumplieron los criterios, se comprobó el resultado y se integró el trabajo.

El estado actual se consulta en GitHub. El cuerpo de las tarjetas explica la tarea; no sustituye el estado del tablero. Un bloqueo se explica en la tarjeta junto con lo que falta.

## Dónde irá cada parte
Los directorios de código se crearán cuando se implementen sus tareas; todavía no contienen un simulador.
- `src/core/`: datos compartidos, reloj y eventos.
- `src/cpu/`: registros, operaciones e instrucciones.
- `src/buses/`: caminos de control, direcciones y datos.
- `src/memory/`: RAM, traducción, páginas, FIFO y Swap.
- `src/cache/`: L1I, L1D, L2 y sus copias.
- `src/io/`: teclado y LCD.
- `src/assembler/`: editor, ensamblador, cargador y catálogo.
- `src/sheets/`: conexión con Google Sheets y Apps Script.
- `src/ui/`: controles y animaciones.
- `programs/`: las tres demos y sus resultados esperados.
- `tests/unit/`, `tests/integration/`, `tests/acceptance/`: pruebas de partes y del sistema.
- `docs/es/`, `docs/en/`: documentación final en ambos idiomas.
- `docs/evidence/`: evidencias reales de las pruebas.
- `assets/`: logo y capturas finales.
- `.github/`: plantillas para tarjetas y PR.

## Ramas y entrega
`main` guarda la versión estable; `develop` reúne las partes. Cada tarea se hace desde develop en `feature/cristian/...`, `feature/marcelo/...` o `feature/joseph/...`, con PR hacia develop. La guía completa está en [CONTRIBUTING.md](../CONTRIBUTING.md).

## Etapas propuestas
- 27-29 de octubre: acuerdos iniciales entre los tres.
- 30 de octubre-2 de noviembre: CPU, buses, memoria, cachés y E/S.
- 3-5 de noviembre: ensamblador, cargador, demos, interfaz e integración.
- 6-7 de noviembre: pruebas finales, documentación bilingüe y enlace a la planilla.
- 8 de noviembre: ensayo completo y versión candidata en main.
- Antes del 9 de noviembre a las 10:00 (America/La_Paz): verificar la entrega. Después del cierre no subir commits ni mover tarjetas.

Las fechas son una propuesta y deben ajustarse a la disponibilidad real. Para la defensa, repartir los 20 minutos grupales de forma equilibrada (~6 min 40 s por persona) y ensayar 10 minutos de preguntas y cambios de código o memoria.

## Acceso a GitHub
Marcelo aceptó su invitación al repositorio y tiene sus 16 tareas asignadas. Joseph tiene permiso Write en el tablero; su invitación de escritura al repositorio está enviada y pendiente de aceptación. Al aceptarla, completar sus 16 asignaciones de GitHub. Sus responsabilidades ya figuran con su cuenta en las tarjetas.
