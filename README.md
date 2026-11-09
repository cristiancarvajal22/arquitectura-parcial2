# Arquitectura - Segundo Parcial

Simulador de una computadora en **Google Sheets + JavaScript/Google Apps Script**.

**Equipo:** Cristian, Marcelo y Joseph.
**Cierre comunicado:** lunes 9 de noviembre de 2026 a las 10:00, hora de Bolivia (America/La_Paz).
**Estado de esta rama:** motor integrado con pruebas locales y tres demos reproducibles. La instalación integrada en Sheets, la revisión entre compañeros y la comprobación desde otra cuenta deben verificarse antes de declarar la entrega terminada.

## Trabajo del equipo
Las tareas y su avance se registran en el [tablero](https://github.com/users/cristiancarvajal22/projects/6). Cada tarjeta reúne la descripción, el trabajo a realizar, los criterios de aceptación y el entregable.

Las primeras tres tareas definen los [datos y la comunicación](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/1), las [instrucciones y el mapa de memoria](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/2) y las [cachés y señales](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues/3). Estos acuerdos serán la base para integrar los módulos.

El [índice de tareas](docs/BACKLOG.md) reúne las 48 tarjetas y el [glosario](docs/GLOSARIO.md) explica los términos del proyecto.

## Cómo se reparte el trabajo
Cada integrante tiene **16 tareas** y **57 puntos relativos de esfuerzo**. Los puntos sirven para comparar la carga; no son horas ni calificación. Las tareas combinan programación, pruebas, documentación y preparación de la defensa. Cada tarjeta tiene un responsable y criterios de finalización; no hay una persona fija asignada para revisar cada tarea. Los PR se comprueban entre compañeros, como pide la rúbrica.

Cuentas: Cristian = `cristiancarvajal22`; Marcelo = `marceloaguilera777`; Joseph = `JosephPerez725`.
Marcelo ya tiene acceso al repositorio y sus 16 asignaciones de GitHub. Joseph ya publica commits y PR desde `JosephPerez725` y sus tareas están asignadas en GitHub.

## Alcance
- CPU con cuatro registros, operaciones e instrucciones; buses y señales que muestran cómo se mueve cada dato.
- RAM de 256 B y memoria virtual de 512 B, con páginas de 32 B, FIFO y Swap.
- Cachés L1I/L1D de 8 B y L2 de 32 B; teclado y LCD de ocho caracteres.
- Editor, ensamblador y cargador; tres programas demo; hoja animada y documentación completa en español e inglés.

Los detalles obligatorios están en la [arquitectura](docs/ARQUITECTURA.md) y la [rúbrica](docs/RUBRICA.md). La meta es cumplir el nivel Excelente en los 100 puntos grupales y 60 individuales; la nota dependerá del producto y de la defensa real.

## Enlaces de trabajo
- [GitHub Project](https://github.com/users/cristiancarvajal22/projects/6)
- [Todas las issues](https://github.com/cristiancarvajal22/arquitectura-parcial2/issues)
- [Organización y estructura](docs/ORGANIZACION.md)
- [English documentation](README_EN.md)

[Planilla del equipo](https://docs.google.com/spreadsheets/d/1VhOJ5jGlvC1rMByyLyrB1OWXCSWokwGDJDajLnvnqLE/edit). Existe y se comprobaron previamente vistas aisladas; la versión integrada y el acceso de evaluación requieren comprobación real.

## Ejecutar esta versión

- [Manual ES](docs/es/MANUAL.md) · [Manual EN](docs/en/MANUAL.md).
- [Paquete único de Apps Script](dist/SimuladorP2.gs): instalar en el proyecto vinculado y ejecutar `P2_Setup`.
- [Integración y buses](docs/es/INTEGRACION.md) · [Resultados y trazas de las demos](docs/evidence/integration/demos.json).
- [Guion de Marcelo](docs/es/DEFENSA_MARCELO.md) · [Auditoría y pendientes](docs/evidence/MARCELO_AUDIT.md).
- [Guion de Cristian](docs/evidence/P2-040.md) · [Auditoría de sus 16 tareas](docs/evidence/P2-046.md) · [Regresión de los paquetes](docs/evidence/P2-043.md).

Pruebas sin dependencias npm:

```sh
node scripts/prepare-test-deps.cjs
node scripts/build-marcelo.cjs --check
node --test tests/contracts/*.mjs tests/unit/*.mjs tests/unit/*.cjs tests/integration/*.cjs tests/acceptance/*.cjs
node scripts/demo-evidence.cjs --check
```

Las ramas originales de los compañeros se integraron preservando sus commits. Los módulos de terceros del equipo no se presentan como código original de Marcelo.

## Evidencias y especificaciones


- [Matriz G1–G7 e I1–I4](docs/es/EVIDENCIAS.md)
- [ISA y mapa de memoria](docs/ISA_MAPA_MEMORIA.md)
- [Micro-palabra y pruebas (PR #62)](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/62)
- [Contrato de cachés y señales (PR #60)](https://github.com/cristiancarvajal22/arquitectura-parcial2/pull/60)
- [Planilla y manual: estado de verificación](docs/es/EVIDENCIAS.md#pendientes-de-entrega)

## Adaptador alternativo del equipo

Se conserva el coordinador por instrucción de Joseph: `src/core/simulator.js`, `src/sheets/app.js` y `dist/Simulador.gs`, generado con `scripts/build-app.cjs`. El paquete de micro-pasos de Marcelo es `dist/SimuladorP2.gs`, generado con `scripts/build-marcelo.cjs`, y se instala con `P2_Setup`. Usar un solo paquete/motor por ejecución. La diferencia entre STEP por instrucción y STEP por micro-paso se documenta en [la evidencia de Joseph](docs/evidence/INTEGRACION_FINAL.md) y [la integración de Marcelo](docs/es/INTEGRACION.md).
