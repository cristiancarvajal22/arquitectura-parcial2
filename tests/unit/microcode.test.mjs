import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const context = vm.createContext({});

// El planificador utiliza el decodificador.
for (const file of ["decoder.js", "microcode.js"]) {
  const source = readFileSync(
    new URL("../../src/cpu/" + file, import.meta.url),
    "utf8"
  );
  vm.runInContext(source, context);
}

function plan(bytes) {
  // Convertir a objetos del contexto de pruebas.
  return JSON.parse(JSON.stringify(
    context.cpuBuildExecutionPlan(bytes)
  ));
}

function operations(result) {
  assert.equal(result.ok, true);
  return result.steps.map(step => step.operation);
}

test("MOV selecciona correctamente inmediato y registro", () => {
  const immediate = plan([0x10, 2, 7, 0]);

  assert.deepEqual(operations(immediate), [
    "TRANSFER_TO_REGISTER",
    "ADVANCE_PC"
  ]);

  assert.deepEqual(immediate.steps[0].parameters, {
    destination: "CX",
    source: { kind: "immediate", value: 7 }
  });

  const register = plan([0x11, 0, 3, 0]);

  assert.deepEqual(register.steps[0].parameters, {
    destination: "AX",
    source: { kind: "register", name: "DX" }
  });
});

test("LOAD solicita una lectura antes de esperar y capturar", () => {
  const result = plan([0x20, 2, 0x2C, 1]);

  assert.deepEqual(operations(result), [
    "PREPARE_ADDRESS",
    "REQUEST_READ",
    "WAIT_READ",
    "CAPTURE_RESPONSE_IN_MDR",
    "TRANSFER_TO_REGISTER",
    "ADVANCE_PC"
  ]);

  assert.equal(result.steps[0].parameters.address, 300);
  assert.equal(result.steps[4].parameters.destination, "CX");
});

test("STORE prepara dirección y dato antes de solicitar escritura", () => {
  const result = plan([0x21, 3, 0x2C, 1]);

  assert.deepEqual(operations(result), [
    "PREPARE_ADDRESS",
    "TRANSFER_TO_REGISTER",
    "REQUEST_WRITE",
    "WAIT_WRITE",
    "ADVANCE_PC"
  ]);

  assert.equal(result.steps[0].parameters.address, 300);
  assert.equal(result.steps[1].parameters.destination, "MDR");
  assert.equal(result.steps[1].parameters.source.name, "DX");
});

test("CMP actualiza flags sin escribir un registro", () => {
  const result = plan([0x35, 2, 0, 0]);

  assert.deepEqual(operations(result), [
    "CAPTURE_ALU_A",
    "CAPTURE_ALU_B",
    "EVALUATE_ALU",
    "COMMIT_FLAGS",
    "ADVANCE_PC"
  ]);

  assert.equal(result.steps[1].parameters.source.value, 0);
});

test("los saltos distinguen sus condiciones sin avance adicional", () => {
  const cases = [
    [0x50, "always"],
    [0x51, "ZF_SET"],
    [0x52, "ZF_CLEAR"]
  ];

  for (const [opcode, condition] of cases) {
    const result = plan([opcode, 0, 0x20, 1]);

    assert.deepEqual(operations(result), ["RESOLVE_BRANCH"]);
    assert.equal(result.steps[0].parameters.condition, condition);
    assert.equal(result.steps[0].parameters.address, 288);
  }
});

test("IN y OUT separan solicitud y espera", () => {
  const input = plan([0x60, 3, 0, 0]);
  const output = plan([0x61, 3, 0, 0]);

  assert.deepEqual(operations(input), [
    "REQUEST_INPUT",
    "WAIT_INPUT",
    "CAPTURE_RESPONSE_IN_MDR",
    "TRANSFER_TO_REGISTER",
    "ADVANCE_PC"
  ]);

  assert.deepEqual(operations(output), [
    "TRANSFER_TO_REGISTER",
    "REQUEST_OUTPUT",
    "WAIT_OUTPUT",
    "ADVANCE_PC"
  ]);

  assert.equal(input.steps[0].parameters.endpoint, "KBD");
  assert.equal(output.steps[1].parameters.endpoint, "LCD");
});

test("HALT no incluye un avance de PC", () => {
  assert.deepEqual(
    operations(plan([0x00, 0, 0, 0])),
    ["HALT"]
  );
});

test("rechaza instrucciones inválidas sin crear un plan", () => {
  const result = plan([0xFF, 0, 0, 0]);

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "INVALID_OPERAND");
  assert.equal(result.steps, undefined);
});

test("el plan es serializable y no modifica la entrada", () => {
  const bytes = Object.freeze([0x30, 0, 1, 0]);
  const result = plan(bytes);

  assert.equal(result.ok, true);
  assert.deepEqual(bytes, [0x30, 0, 1, 0]);

  result.steps.forEach((step, index) => {
    assert.equal(step.index, index);
  });

  assert.deepEqual(
    JSON.parse(JSON.stringify(result)),
    result
  );
});
