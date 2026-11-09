; Eight input bytes are echoed to the eight-character LCD.
MOV CX, 8
loop: IN AX, [KBD]
OUT [LCD], AX
DEC CX
JNZ loop
HALT
