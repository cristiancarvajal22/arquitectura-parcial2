; Code uses pages 0..1. Data crosses eleven additional pages.
; VA 128 must retain 42 after dirty eviction and reload.
MOV AX, 42
STORE [128], AX
LOAD BX, [160]
LOAD BX, [192]
LOAD BX, [224]
LOAD BX, [256]
LOAD BX, [288]
LOAD BX, [320]
LOAD BX, [352]
LOAD BX, [384]
LOAD BX, [416]
LOAD BX, [448]
LOAD DX, [128]
HALT
