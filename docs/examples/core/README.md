# Ejemplos del contrato / Contract examples

Estos archivos se construyeron para revisar el formato; **no son una traza
obtenida ejecutando el simulador**. El perfil sigue siendo una propuesta y
Run/Step debe rechazarlo hasta cerrar #3 y aprobar el perfil conjunto. La transferencia describe cómo
se representaría un paso con perfil aprobado, sin implementarlo ni ejecutarlo.

These are hand-built contract fixtures, **not simulator execution traces**.
Run/Step must reject the proposal profile until #3 and joint review settle the pending
decisions. The transfer describes an approved-profile step without executing it.

- [reset.snapshot.json](reset.snapshot.json): estado completo de reset
  propuesto / proposed complete reset state.
- [pc-to-mar.before.json](pc-to-mar.before.json): estado pausado con PC=300,
  MAR=0 / paused state with PC=300, MAR=0.
- [pc-to-mar.event.json](pc-to-mar.event.json): PC → MAR por bus virtual de
  9 bits; En_PC/Ld_MAR/Clock activos / nine-bit virtual-bus transfer with
  En_PC/Ld_MAR/Clock active.
- [pc-to-mar.after.json](pc-to-mar.after.json): MAR=300, revisión 1 y el
  mismo evento / MAR=300, revision 1 and the same event.

300 no cabe en ocho bits: permite detectar truncamiento a 44. No hay
traducción ni acceso a memoria: PA es null y bytes está vacío. Los otros
cinco segmentos permanecen en Z. `changes` enumera todos los cambios salvo
`lastEvent`, que recibe el propio evento sin crear referencias circulares.

300 does not fit in eight bits, detecting truncation to 44. There is no
translation or memory access: PA is null and bytes is empty. The other five
segments remain Z. `changes` lists all changes except `lastEvent`, which
receives the event itself without circular references.

El mapa sigue la [ISA integrada en PR #51](../../ISA_MAPA_MEMORIA.md): KBD
PA 224..231 / VA 480..487, LCD PA 232..239 / VA 488..495 y VPN 15 → PFN 7
fijado. LCD inicia con ocho espacios (32), IR con cuatro ceros y loadedBytes=0.
Las políticas de escritura/asignación y codificación de control esperan a Joseph.

The map follows the ISA integrated in PR #51: KBD PA 224..231 / VA 480..487,
LCD PA 232..239 / VA 488..495, pinned VPN 15 → PFN 7. LCD starts with eight
spaces (32); IR has four zeros and loadedBytes=0. Write/allocation policies
and control encoding still await Joseph.
