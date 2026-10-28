# Segundo Parcial - Arquitectura de Computadoras (SIS-131)

[English](README_EN.md) · [Organización](docs/ORGANIZACION.md) · [Arquitectura prevista](docs/ARQUITECTURA.md) · [Rúbrica](docs/RUBRICA.md) · [Flujo de trabajo](CONTRIBUTING.md)

**Equipo:** Cristian, Marcelo y Joshep. **Tecnología:** Google Sheets + JavaScript/Google Apps Script.
**Cierre oficial comunicado:** lunes 9 de noviembre de 2026, 10:00 (America/La_Paz).
**Estado:** planificación inicial; no existe todavía una implementación del simulador. Objetivo: nivel Excelente en los 100 puntos grupales y 60 individuales por alumno de parcial2.pdf.

## Alcance
CPU mononúcleo, un programa/proceso/hilo; AX/BX/CX/DX de 8 bits, PC/IR/MAR/MDR y ZF/CF/SF; buses internos/externos con tri-estado y micro-palabra; RAM 256 B (8×32 B), memoria virtual 512 B (16×32 B), tabla P/Dirty/Reference, FIFO y Swap; L1I 8 B, L1D 8 B y L2 32 B; KBD con cola de 8 B y LCD 8×1 con video de 8 B en RAM; editor, ensamblador, cargador y tres demos.

## Organización antes de programar
- `main`: entregas estables; `develop`: integración.
- Una issue por resultado verificable, una rama `feature/<nombre>/<modulo>` y PR a `develop`.
- Revisión cruzada; nadie aprueba su propio PR. Los commits de implementación deben ser personales y semánticos.
- GitHub Project: **Backlog → To Do → In Progress → In Review → Done**.
- El backlog distribuye implementación, pruebas, documentación y defensa entre los tres; la preparación administrativa inicial no equivale a contribución técnica de los alumnos.
- Consultar [plan de tareas](docs/BACKLOG.md) y dependencias antes de empezar.
- Usuarios confirmados: Cristian = `cristiancarvajal22`; Marcelo = `marceloaguilera777`; Joshep pendiente de confirmar. Invitación de escritura enviada a Marcelo; aceptación y asignaciones nativas pendientes. Sus 16 responsabilidades y 16 revisiones están registradas con su usuario. Los nombres en las issues definen responsabilidad; no implican asignación GitHub hasta verificar sus cuentas y acceso.

## Tablero
[GitHub Project del equipo](https://github.com/users/cristiancarvajal22/projects/6) · [Issues](https://github.com/cristiancarvajal22/arquitectura-computadoras-parcial2/issues)

48 tareas técnicas: 16 por integrante, 57 puntos relativos y 16 revisiones por persona. Tres contratos iniciales en To Do; 45 tareas futuras en Backlog.

## Planilla y ejecución
La planilla todavía no se ha creado: el enlace directo verificado se incorporará en la tarea de publicación. La guía de instalación, ISA definitiva, diagramas de micro-operaciones y manual completo se producirán y probarán con la implementación. No se presentan ejemplos de código inexistente.

## Evaluación y evidencia
Cada issue debe relacionar criterio G1-G7/I1-I4, criterios de aceptación, prueba reproducible y PR. Apuntar al 100% requiere demostrar funcionamiento y dominio individual; este repositorio inicial no certifica una nota.
