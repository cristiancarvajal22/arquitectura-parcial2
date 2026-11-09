; Defense variant: only MOV CX, 5 changes to MOV CX, 6. Expected AX=21.
MOV AX, 0
MOV BX, 1
MOV CX, 6
MOV DX, 0
loop: ADD AX, BX
INC BX
INC DX
CMP DX, CX
JNZ loop
STORE [300], AX
HALT
