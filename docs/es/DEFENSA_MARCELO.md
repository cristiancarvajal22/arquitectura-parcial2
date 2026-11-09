# Defensa de Marcelo · tarea #41

Guion preparado; ensayo cronometrado y cambio en vivo pendientes de realizar por Marcelo.

## Recorrido de 6 minutos y 40 segundos

| Tiempo | Explicación y acción |
|---|---|
| 0:00–0:45 | «La RAM tiene 256 bytes y el programa usa 512 direcciones virtuales. No creamos RAM extra: movemos páginas entre siete marcos utilizables y Swap; el octavo marco está reservado para E/S». Mostrar tabla y mapa. |
| 0:45–1:35 | Traducir VA 100: VPN=3, offset=4. Con PFN=6, PA=196. Mostrar que el tag físico es 24 y el offset de caché es 4. |
| 1:35–2:50 | Ejecutar accesos dispersos. Detener en Page Fault rojo. Identificar petición, víctima FIFO y Dirty. Explicar que un hit no mueve FIFO y que un marco protegido nunca es víctima. |
| 2:50–3:55 | Avanzar por guardado e intercambio. Señalar las 32 transferencias y la invalidación antes de reutilizar el marco. Diferenciar Dirty de página de caché write-through. |
| 3:55–4:45 | Mostrar reanudación de la misma petición. Explicar cómo se conserva el índice y por qué esperar no vuelve a escribir ni consume dos caracteres. |
| 4:45–5:35 | Predecir una consulta: L1 hit no consulta L2; miss consulta L2 y quizá RAM. Comparar counters y separar FIFO de L2 de FIFO de páginas. |
| 5:35–6:40 | Cambio en vivo preparado: sustituir `MOV BX, 7` por `MOV BX, 3` en la demo aritmética, cargar y ejecutar. Resultado esperado: 15 en AX y VA 300. Volver a la demo dispersa para explicar conservación tras recarga. |

## Preguntas que debo responder

- **¿Por qué PC/MAR tienen nueve bits si el CPU es de ocho?** Porque ocho bits describen los datos; 512 posiciones virtuales requieren nueve bits de dirección.
- **¿Por qué quedan siete marcos?** El marco físico 7 contiene teclado y video RAM y queda fijado a la página 15.
- **¿Cuándo se guarda una víctima?** Si Dirty está activo. Primero se guardan sus 32 bytes; después se invalida y se reutiliza el marco.
- **¿Qué hace Reference?** Registra acceso; no altera el reemplazo FIFO.
- **¿Por qué los tags son físicos?** La traducción ya ocurrió y el tag identifica la línea del marco real. Al reutilizar el marco hay que invalidar sus copias.
- **¿Por qué una escritura llega a RAM aunque haya hit?** La política es write-through. No-write-allocate evita cargar una línea inexistente por una escritura.
- **¿Qué pasa con IN sin caracteres?** Conserva la petición pendiente y espera sin un bucle que congele la interfaz.
- **¿Qué ocurre si dos emisores ponen el mismo byte?** También es contención y se rechaza antes de publicar cambios.

## Comprobar antes de exponer

- [ ] Explicar el código propio sin leer este guion.
- [ ] Hacer el ensayo de 6:40 y registrar duración real.
- [ ] Ejecutar el cambio 7→3 en la planilla, no solo predecirlo.
- [ ] Explicar una prueba del árbitro y una de L2 de los compañeros.
- [ ] Abrir los PR personales y mostrar evidencia, sin afirmar revisiones que no existan.

Las trazas locales están en `docs/evidence/integration/`. El registro de un ensayo solo se completa después de realizarlo.
