# Flujo Gitflow personal y revisión

1. Elegir una issue en To Do con responsable y reviewer confirmados.
2. Actualizar develop y crear `feature/<nombre>/<modulo>` desde develop. Nombres: cristian, marcelo, joshep; módulo específico en kebab-case, por ejemplo `feature/cristian/bus-arbitraje`.
3. Mover a In Progress y enlazar rama. Cada integrante usa su propia cuenta y autoría real.
4. Commits pequeños: `feat(cpu): ...`, `fix(mmu): ...`, `test(cache): ...`, `docs(isa): ...`, `chore(repo): ...`. No fabricar historial ni usar commits vacíos.
5. Abrir PR a develop usando la plantilla, referenciar la issue y solicitar al reviewer indicado. Mover a In Review.
6. Reviewer verifica criterios, pruebas, integración y explicación del autor. Registrar aprobación o cambios requeridos; nunca autoaprobar.
7. Integrar solo con aprobación ajena. Preservar autoría individual. Cerrar issue explícitamente si corresponde y mover a Done.
8. Entregas: PR de develop a main, revisión de otro integrante y evidencia de regresión. No mezclar features directamente en main.
9. Conflictos: resolver en la rama personal, repetir las pruebas afectadas y obtener nueva revisión.
10. Antes del cierre del 9/11/2026 10:00 America/La_Paz, dejar main y la planilla enlazada verificadas. No modificar historial ni tablero después del cierre.

## Reglas previstas y límites actuales
La política es revisión obligatoria de al menos otro integrante y ausencia de pushes directos durante desarrollo. La creación administrativa inicial es la única excepción de arranque. Estas reglas de equipo no equivalen a protección técnica de ramas: no se afirma que haya reglas de protección activas. Confirmar disponibilidad de GitHub según plan y permisos antes de configurarlas.
No incluir credenciales, .clasprc.json, tokens, IDs privados innecesarios ni datos personales en el repo. No se ha creado un proyecto Apps Script ni una planilla en este arranque.
