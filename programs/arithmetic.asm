; Sum 1..5 using all four registers. Expected AX=15, BX=6, CX=5, DX=5.
MOV AX, 0
MOV BX, 1
MOV CX, 5
MOV DX, 0
loop: ADD AX, BX
INC BX
INC DX
CMP DX, CX
JNZ loop
STORE [300], AX
HALT
