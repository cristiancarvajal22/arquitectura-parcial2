# Dirty, Reference y reutilización de marcos — P2-015

`PageCoherence(deps)` reutiliza MMU de Marcelo, PageFifo/CacheCoherence/PhysicalRam
de Cristian y Swap de #12. Las versiones exactas están en tests/dependencies/page-coherence.json.
No se copian sus implementaciones a src ni se reemplazan sus ramas.

## Operaciones

- `markAccess(state, request)`: sobre el candidato de una operación confirmada,
  traduce y marca Reference para read/fetch; write marca también Dirty. No depende
  de que haya hit o miss. E/S evita esos cambios; Page Fault retorna pending.
- `prepare(state, vpn)`: selecciona marco con PageFifo. Guarda víctima Dirty en Swap
  y después invalida las líneas físicas del marco en L1I/L1D/L2. Devuelve estado
  candidato, decisión, 32 bytes entrantes y traza. El snapshot original no cambia.
- `finish(current, prepared, loadedBytes)`: exige la misma base, un plan sin alterar
  y exactamente los 32 bytes esperados. Instala la página, actualiza ambas tablas,
  FIFO y flags, y vuelve a validar. Rechaza planes obsoletos o transferencias parciales.

La invalidación conserva vecinos. Una caché Dirty que exige writeback detiene la
reutilización; nunca se descarta silenciosamente. Con la propuesta write-through
las líneas permanecen limpias, pero la página puede estar Dirty frente a Swap.
La nueva página empieza sin Dirty/Reference; el acceso reintentado marca Reference.

## Responsabilidad del coordinador

Estas son etapas puras de preparación/instalación. El coordinador debe ejecutar la
transferencia real de 32 bytes por bus entre prepare y finish, verificar su resultado,
y confirmar junto con revisión, contadores y evento global. La igualdad de bytes
que comprueba finish no prueba por sí sola que se ejecutó un bus. No se incrementa
revision ni el reloj aquí; no se suplanta el coordinador del fallo de página.
El cargador debe haber añadido swap.initialPages mediante la API de #12.

## Reproducir

```bash
python3 scripts/fetch-test-deps.py page-coherence
node --test tests/integration/page-coherence.test.cjs
```

El primer comando usa la sesión existente de gh, descarga exclusivamente archivos
del mismo repositorio a .test-deps y comprueba su hash Git. No altera ramas ni sube
credenciales. `--offline` permite comprobar un conjunto ya descargado.

Diez pruebas con módulos reales de las ramas: acceso caliente y flags, bypass E/S,
escritura/desalojo/recarga, invalidación y vecinos, plan obsoleto, transferencia
incompleta, protección de writeback y reset determinista. La carga de página en
estas pruebas suministra el bloque completo; aún falta demostrar la integración
del coordinador y sus 32 micro-pasos en la hoja. Evidencia: ../evidence/P2-015.md.
