# Versión candidata y restauración · #44

Esta rama prepara una candidata para revisión. No afirma que `main` esté actualizado ni que otro integrante ya haya aprobado la entrega.

1. Revisar las pruebas de integración y la instalación en la planilla.
2. Revisar el PR hacia `develop`. Las dependencias del equipo conservan sus commits; no integrar sus ramas nuevamente si ya están incluidas por este PR.
3. Desde otra cuenta, abrir el enlace directo de [Sheets](https://docs.google.com/spreadsheets/d/1VhOJ5jGlvC1rMByyLyrB1OWXCSWokwGDJDajLnvnqLE/edit) y ejecutar una demo. Registrar quién lo comprobó y el resultado real.
4. Después de aprobar e integrar en `develop`, revisar el PR `develop → main` y anotar el commit efectivamente integrado.
5. Antes del 9 de noviembre de 2026 a las 10:00 Bolivia, congelar repositorio y tablero. No hacer commits, integraciones ni movimientos posteriores al cierre comunicado.

## Recuperar esta candidata

El archivo [release/candidate.json](../../release/candidate.json) identifica el commit fuente y SHA-256 del paquete con finales de línea LF. Desde GitHub se puede abrir ese commit y descargar `dist/SimuladorP2.gs`. Al instalarlo, usar el procedimiento del manual; `P2_Setup` y una carga explícita reconstruyen una ejecución determinista.

El checksum identifica el archivo preparado. No certifica revisión humana, despliegue ni acceso de otra cuenta. Las modificaciones posteriores de Apps Script no se deben describir como si fueran el mismo paquete congelado cuando no coinciden con él.
