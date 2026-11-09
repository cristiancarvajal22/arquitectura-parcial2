# Swap de páginas — P2-012

El respaldo contiene 16 páginas de 32 bytes (512 B); RAM sigue teniendo 256 B.
`initialPages` conserva la imagen de carga; `pages` conserva el respaldo actualizado.
Son arrays independientes. Una página residente Dirty puede ser más reciente en RAM.

## API pura

| Función | Resultado |
|---|---|
| swapCreate(image) | Respaldo nuevo desde imagen de exactamente 512 bytes; omitir imagen crea ceros |
| swapReadPage(store, vpn) | Copia independiente de los 32 bytes |
| swapWritePage(store, vpn, bytes) | Respaldo nuevo; preserva imagen inicial y páginas vecinas |
| swapReset() | Respaldo vacío a cero |
| swapRestoreImage(store) | Nueva ejecución del respaldo desde la imagen inicial |
| swapAttachImage(state, image) | Copia del snapshot con respaldo nuevo; no modifica RAM/CPU/MMU |
| swapSaveFrame(state, vpn, pfn) | Prepara una copia con 32 bytes del marco guardados en Swap |

VPN válido: entero 0..15. Página: exactamente 32 enteros 0..255. Arrays incompletos,
índices fuera de rango y bytes inválidos se rechazan antes de mutar. No hay alias
entre entrada, salida e imagen inicial. `swapSaveFrame` comprueba el mapeo objetivo
y rechaza páginas/marcos fijados de E/S; el coordinador valida el snapshot completo.

## Integración con MMU

El snapshot #1 ya contiene `swap.pages`. `swapAttachImage` añade `initialPages`
al cargar un programa, operación que debe coordinarse con reset, invalidación y RAM.
No usar esta función para migrar una sesión Dirty en curso: reemplaza su respaldo.
El coordinador guarda la víctima Dirty, invalida cachés, transporta los 32 bytes por
el bus y confirma tabla/marcos/FIFO. Estas funciones no deciden víctimas, limpian
Dirty, incrementan revisiones ni ejecutan la animación. Preparan datos sobre copias.
Leer Swap no instala automáticamente una página en RAM.

## Prueba

`node --test tests/unit/swap.test.cjs` — 10 pruebas. Incluye ida/vuelta completa,
preservación de vecinos, aislamiento de copias, reset frente a recarga, rechazo de
E/S y mantenimiento de RAM en 256 B. Evidencia: ../evidence/P2-012.md.
Integración del desalojo pertenece a #15; la aprobación de este módulo no demuestra
que el simulador completo o la hoja estén conectados.
