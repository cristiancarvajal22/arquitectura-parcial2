# Auditoría de Marcelo · #47

Las 16 asignaciones reales son #2, #5, #8, #11, #14, #17, #20, #23, #26, #29, #32, #35, #38, #41, #44 y #47. La lista pegada inicialmente repetía #11 y omitía #14; se comprobó contra GitHub.

## Producto y evidencia

| Issue | Implementación o entregable | Comprobación disponible |
|---|---|---|
| #2 | docs/ISA_MAPA_MEMORIA.md; mapa de integración en docs/es/MANUAL.md | Mapas y permisos cubiertos por pruebas de contrato/MMU |
| #5 | src/core/machine.js, decoder.js y microcode.js | CPU completa, saltos, bucles, HALT y reintentos en tests/integration/machine.test.cjs |
| #8 | Coordinador de transferencias con BusArbiter real | Eventos y buses de las tres demos; sin cambios directos de resultados en UI |
| #11 | src/memory/mmu*.js | Fronteras, páginas ausentes, coherencia con marcos y permisos |
| #14 | memoryTick en machine.js | Guardado Dirty, carga de 32 bytes, invalidación y reanudación |
| #17 | src/cache/l1d.js e integración | Hits/misses, write-through, no-write-allocate y lectura posterior |
| #20 | src/cache/metrics.js e integración | Contadores contrastados con eventos de consultas reales; reset por reloj |
| #23 | src/io/lcd.js, lcd-view.js y app.js | 1/8/9 caracteres, Load, video RAM y OUT real en la prueba del adaptador |
| #26 | Cargador de machine.js, parser del equipo y Editor | Programa multípágina, rechazo atómico, mapas fuente/bytes y primer fetch |
| #29 | programs/echo.asm y catálogo | Eco ABCDEFGH mediante IN/OUT, cola vacía y ocho escrituras de LCD |
| #32 | Panel MMU, Swap y acciones de edición de app.js | Estado real del motor; prueba del adaptador con servicios de Sheets simulados |
| #35 | tests/integration/machine.test.cjs | Página Dirty con 32 valores distintos conservada tras desalojo/recarga |
| #38 | Manual ES/EN | Preparado; instalación por otro integrante y capturas integradas pendientes |
| #41 | docs/es/DEFENSA_MARCELO.md | Guion y preguntas preparados; ensayo real pendiente |
| #44 | docs/es/ENTREGA.md y release/candidate.json | Candidata identificada; acceso de otra cuenta, revisión y entrega main pendientes |
| #47 | Este documento y marcelo-commits.json | Aportes reales y brechas registradas; no sustituye la comprobación de defensa |

## Resultados ejecutados

La regresión local terminó con **324 pruebas aprobadas, cero fallidas**. Las tres demos se ejecutaron por el motor real de Node.js: aritmética AX=35; eco LCD=ABCDEFGH; accesos dispersos DX=71. Los JSON y trazas están en [integration](integration).

La prueba del adaptador de Sheets usa dobles de los servicios y el almacén de propiedades. No es una prueba desde otra cuenta ni una captura del producto instalado. Las vistas aisladas que Marcelo comprobó antes no demuestran por sí solas la integración nueva.

## Autoría e historial

[marcelo-commits.json](marcelo-commits.json) enumera commits de contenido, excluyendo merges del conteo. Los módulos de Cristian y Joseph se incorporan mediante sus commits originales. Su implementación no se atribuye a Marcelo. Los commits nuevos reflejan arreglos, coordinador, pruebas, demos, adaptador y documentación; no se crearon commits vacíos para aumentar el número.

## Kanban y revisión

Los entregables de código con pruebas están preparados para revisión; las tareas con comprobaciones humanas pendientes deben conservar esos pendientes. Ninguna evidencia local registra una aprobación de compañero, ensayo, instalación ajena o integración en main que no haya ocurrido.

Antes del cierre: revisar PR, ejecutar en la planilla, verificar acceso del evaluador y ensayar el cambio en vivo. Después del cierre comunicado no se modifica repositorio ni tablero.
