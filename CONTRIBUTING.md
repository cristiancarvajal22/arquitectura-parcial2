# Cómo trabajar con GitHub

## Una tarea, una rama, un PR
1. Elegir una tarea cuyo trabajo previo ya esté terminado. La tarjeta dice quién es responsable y qué debe entregar.
2. Actualizar `develop` y crear una rama personal desde ella: `feature/<nombre>/<modulo>`.
   Nombres permitidos: `cristian`, `marcelo`, `joseph`. Ejemplo: `feature/joseph/cache-l2`.
3. Mover la tarjeta a **In Progress** cuando se empiece. Enlazar la rama. Trabajar en una implementación activa por persona.
4. Guardar cambios pequeños con mensajes claros. Ejemplos: `feat(cpu): agregar suma`, `fix(mmu): corregir dirección`, `test(cache): comprobar hit`, `docs(isa): explicar saltos`.
5. Abrir un **Pull Request (PR) hacia develop**. Un PR permite ver y comprobar los cambios antes de unirlos al trabajo del equipo. Enlazar la tarea y sus pruebas; moverla a **In Review**.
6. Otro compañero comprueba que se cumplan los criterios y registra su aprobación o los cambios necesarios. No hay asignaciones fijas de esta función y nadie aprueba su propio PR.
7. Integrar el PR, cerrar la tarea y moverla a **Done** cuando esté comprobada. Si GitHub no la cierra al integrar en develop, cerrarla manualmente.
8. Para la entrega estable, abrir un PR de develop a main y repetir la comprobación entre compañeros.

## Para qué sirve cada rama
- `main`: versión estable que se presentará.
- `develop`: trabajo integrado que se está preparando.
- `feature/<nombre>/<modulo>`: trabajo de una tarea concreta.

Si hay un conflicto, resolverlo en la rama personal y volver a ejecutar las pruebas afectadas. Cada alumno debe usar su propia cuenta y autoría real. No crear commits vacíos ni historial artificial.

## Antes de terminar
Adjuntar una prueba, traza, captura o documento que demuestre el resultado. Actualizar la documentación en ambos idiomas si cambia el funcionamiento.

No subir contraseñas, tokens, `.clasprc.json` ni otros datos de acceso. El cierre comunicado es el **9 de noviembre de 2026 a las 10:00 (America/La_Paz)**: no se admiten commits ni movimientos de tablero posteriores.

Las reglas anteriores son acuerdos del equipo. No se afirma que haya protección técnica de ramas activa. Los commits administrativos de organización inicial no sustituyen las contribuciones de implementación de los alumnos.
