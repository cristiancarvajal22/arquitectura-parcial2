import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Cargar el mismo archivo que se utilizará en Apps Script,
// sin exigir exportaciones específicas de Node.
const source = readFileSync(
  new URL("../../src/cpu/decoder.js", import.meta.url),
  "utf8"
);

const context = vm.createContext({});
vm.runInContext(source, context);
const decode = context.cpuDecodeInstruction;

test("reconoce todos los opcodes propuestos", () => {
  const cases = [
    [[0x00, 0, 0, 0], "HALT"],
    [[0x01, 0, 0, 0], "NOP"],
    [[0x10, 0, 7, 0], "MOV"],
    [[0x11, 0, 1, 0], "MOV"],
    [[0x20, 0, 0x2C, 1], "LOAD"],
    [[0x21, 0, 0x2C, 1], "STORE"],
    [[0x30, 0, 1, 0], "ADD"],
    [[0x31, 0, 1, 0], "SUB"],
    [[0x32, 0, 0, 0], "INC"],
    [[0x33, 0, 0, 0], "DEC"],
    [[0x34, 0, 1, 0], "CMP"],
    [[0x35, 0, 7, 0], "CMP"],
    [[0x40, 0, 1, 0], "AND"],
    [[0x41, 0, 1, 0], "OR"],
    [[0x42, 0, 1, 0], "XOR"],
    [[0x43, 0, 0, 0], "NOT"],
    [[0x50, 0, 0, 0], "JMP"],
    [[0x51, 0, 0, 0], "JZ"],
    [[0x52, 0, 0, 0], "JNZ"],
    [[0x60, 0, 0, 0], "IN"],
    [[0x61, 0, 0, 0], "OUT"]
  ];

  for (const [bytes, mnemonic] of cases) {
    const result = decode(bytes);
    assert.equal(result.ok, true, `Opcode ${bytes[0]}`);
    assert.equal(result.instruction.mnemonic, mnemonic);
    assert.equal(result.instruction.length, 4);
  }
});

test("distingue los cuatro registros y el inmediato", () => {
  const registers = ["AX", "BX", "CX", "DX"];

  for (let index = 0; index < registers.length; index++) {
    const result = decode([0x10, index, 255, 0]);
    assert.equal(result.ok, true);
    assert.equal(result.instruction.register, registers[index]);
    assert.equal(result.instruction.immediate, 255);
  }

  const result = decode([0x30, 2, 3, 0]);
  assert.equal(result.instruction.register, "CX");
  assert.equal(result.instruction.sourceRegister, "DX");
});

test("conserva direcciones de nueve bits sin truncarlas", () => {
  for (const address of [0, 255, 256, 300, 511]) {
    const low = address % 256;
    const high = Math.floor(address / 256);
    const result = decode([0x20, 0, low, high]);

    assert.equal(result.ok, true);
    assert.equal(result.instruction.address, address);
  }
});

test("rechaza instrucciones mal formadas", () => {
  const invalidCases = [
    null,
    [],
    [0x10, 0, 7],
    [0x10, 0, 7, 0, 0],
    [0xFF, 0, 0, 0],       // Opcode desconocido.
    [0x10, 4, 7, 0],       // Registro inválido.
    [0x11, 0, 4, 0],       // Fuente inválida.
    [0x10, 0, "7", 0],     // No convertir cadenas.
    [0x10, 0, 256, 0],     // Byte fuera de rango.
    [0x10, 0, -1, 0],
    [0x10, 0, 1.5, 0],
    [0x10, 0, NaN, 0],
    [0x00, 1, 0, 0],       // HALT no lleva operandos.
    [0x32, 0, 1, 0],       // INC no utiliza B.
    [0x10, 0, 7, 1],       // MOV inmediato no utiliza C.
    [0x30, 0, 1, 1],       // ADD no utiliza C.
    [0x50, 1, 0, 0],       // Salto no utiliza A.
    [0x20, 0, 0, 2]        // Dirección mayor de nueve bits.
  ];

  for (const bytes of invalidCases) {
    const result = decode(bytes);
    assert.equal(result.ok, false);
    assert.equal(result.error.code, "INVALID_OPERAND");
  }
});

test("decodifica el programa de ejemplo de P2-002", () => {
  const program = [
    [0x10, 0, 7, 0],
    [0x10, 1, 5, 0],
    [0x30, 0, 1, 0],
    [0x21, 0, 0x2C, 1],
    [0x00, 0, 0, 0]
  ];

  const instructions = program.map(bytes => {
    const result = decode(bytes);
    assert.equal(result.ok, true);
    return result.instruction;
  });

  assert.equal(instructions[0].immediate, 7);
  assert.equal(instructions[1].immediate, 5);
  assert.equal(instructions[2].sourceRegister, "BX");
  assert.equal(instructions[3].address, 300);
  assert.equal(instructions[4].mnemonic, "HALT");
});

test("no modifica los bytes recibidos", () => {
  const bytes = Object.freeze([0x10, 0, 7, 0]);
  assert.equal(decode(bytes).ok, true);
  assert.deepEqual(bytes, [0x10, 0, 7, 0]);
});
