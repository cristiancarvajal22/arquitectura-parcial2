const {test}=require('node:test'),assert=require('node:assert/strict');
const asm=require('../../src/assembler/parser.js');
test('ejemplo ISA produce bytes exactos',()=>{
 const p=asm.assemble('MOV AX, 7\nMOV BX, 5\nADD AX, BX\nSTORE [300], AX\nHALT');
 assert.equal(p.ok,true);assert.deepEqual(p.bytes,[16,0,7,0,16,1,5,0,48,0,1,0,33,0,44,1,0,0,0,0]);
});
test('etiquetas futuras y origen sin alineación',()=>{
 const p=asm.assemble('inicio: jmp fin\nNOP\nfin: JNZ inicio\nHALT',30);
 assert.equal(p.ok,true);assert.deepEqual(p.labels,{INICIO:30,FIN:38});
 assert.deepEqual(p.bytes.slice(0,4),[80,0,38,0]);assert.equal(p.instructions[2].address,38);
});
const forms=[['MOV DX, AX',[17,3,0,0]],['LOAD CX, [0x12C]',[32,2,44,1]],
 ['SUB AX, BX',[49,0,1,0]],['INC AX',[50,0,0,0]],['DEC BX',[51,1,0,0]],
 ['CMP CX, DX',[52,2,3,0]],['CMP AX, 0FFh',[53,0,255,0]],
 ['AND AX, BX',[64,0,1,0]],['OR AX, BX',[65,0,1,0]],['XOR AX, BX',[66,0,1,0]],
 ['NOT DX',[67,3,0,0]],['IN AX, [KBD]',[96,0,0,0]],['OUT [LCD], DX',[97,3,0,0]],
 ['LOAD BX, [KBD]',[32,1,224,1]],['STORE [LCD], CX',[33,2,232,1]]];
for(const [source,bytes] of forms)test(source,()=>{const p=asm.assemble(source);assert.equal(p.ok,true);assert.deepEqual(p.bytes,bytes);});
const bad=['x: NOP\nx: HALT','JMP ausente','MAGIC AX','MOV AX, 256','MOV EX, 1',
 'IN AX, [LCD]','OUT [KBD], AX','STORE [480], AX','LOAD AX, [496]',
 'ADD AX,','HALT 1','MOV AX 1','JMP 1','LOAD AX, [512]','MOV AX, -1'];
for(const source of bad)test('error sin bytes parciales: '+source,()=>{
 const p=asm.assemble('NOP\n'+source);assert.equal(p.ok,false);assert.deepEqual(p.bytes,[]);assert.deepEqual(p.instructions,[]);
 assert.ok(p.errors.every(e=>e.line>=2&&e.message.length>0));
});
test('límite de programa, etiqueta al final y salto condicional',()=>{
 assert.equal(asm.assemble('HALT',476).ok,true);assert.equal(asm.assemble('HALT',477).ok,false);
 assert.equal(asm.assemble('JMP fin\nfin:').ok,false);
 assert.deepEqual(asm.assemble('JZ 0').bytes,[81,0,0,0]);
 assert.equal(asm.assemble('NOP\n'.repeat(121)).ok,false);
});
test('comentarios, CRLF, espacios, hex y entradas inválidas',()=>{
 assert.deepEqual(asm.assemble(' ; comment\r\n mov ax, 0x80 ; value\r\n').bytes,[16,0,128,0]);
 assert.equal(asm.assemble(null).ok,false);assert.equal(asm.assemble('HALT',-1).ok,false);
 assert.equal(asm.assemble('constructor: HALT\nJMP constructor').ok,true);
});
