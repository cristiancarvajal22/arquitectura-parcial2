import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const context = vm.createContext({});
vm.runInContext(
  readFileSync(
    new URL("../../src/cache/l1d.js", import.meta.url),
    "utf8"
  ),
  context
);

function access(pa, kind = "read", io = false) {
  return {
    ok: true,
    status: "translated",
    pa,
    access: { kind, io, cacheable: !io }
  };
}

test("una línea vacía produce miss y solicita L2", () => {
  const result = context.l1dRead(context.l1dCreate(), access(196));

  assert.equal(result.status, "miss");
  assert.equal(result.route, "L2");
  assert.equal(result.tag, 24);
  assert.equal(result.offset, 4);
  assert.equal(result.lineBasePa, 192);
});

test("llenado de ocho bytes y lectura repetida", () => {
  const line = context.l1dFill(
    access(196),
    [10, 11, 12, 13, 14, 15, 16, 17]
  );

  for (let pa = 192; pa <= 199; pa++) {
    const result = context.l1dRead(line, access(pa));
    assert.equal(result.status, "hit");
    assert.equal(result.value, 10 + pa - 192);
  }

  assert.equal(context.l1dRead(line, access(200)).status, "miss");
});

test("escritura hit actualiza la copia propuesta y exige RAM", () => {
  const line = context.l1dFill(access(196), Array(8).fill(0));
  const result = context.l1dPlanWrite(line, access(196, "write"), 65);

  assert.equal(result.status, "hit");
  assert.equal(result.route, "RAM");
  assert.equal(result.lineAfterCommit.dirty, false);
  assert.equal(line.bytes[4], 0);

  const read = context.l1dRead(result.lineAfterCommit, access(196));
  assert.equal(read.value, 65);
});

test("escritura miss no asigna ni reemplaza una línea", () => {
  const line = context.l1dFill(access(0), Array(8).fill(7));
  const before = JSON.stringify(line);
  const result = context.l1dPlanWrite(line, access(196, "write"), 65);

  assert.equal(result.status, "miss");
  assert.equal(result.allocate, false);
  assert.equal(result.route, "RAM");
  assert.equal(JSON.stringify(result.lineAfterCommit), before);
  assert.equal(JSON.stringify(line), before);
});

test("E/S evita L1D y no permite llenado", () => {
  const line = context.l1dCreate();

  // Cubre los ocho bytes de ambos periféricos del perfil ilustrativo.
  for (let pa = 240; pa <= 255; pa++) {
    assert.equal(
      context.l1dRead(line, access(pa, "read", true)).status,
      "bypass"
    );

    const result = context.l1dPlanWrite(
      line, access(pa, "write", true), 65
    );

    assert.equal(result.route, "IO");
    assert.equal(result.lineAfterCommit.valid, false);

    assert.throws(() =>
      context.l1dFill(access(pa, "read", true), Array(8).fill(0))
    );
  }
});

test("invalida únicamente líneas del marco reutilizado", () => {
  const line = context.l1dFill(access(196), Array(8).fill(5));

  assert.equal(context.l1dInvalidateFrame(line, 6).valid, false);
  assert.equal(context.l1dInvalidateFrame(line, 5).valid, true);
  assert.equal(line.valid, true);
});

test("maneja los extremos físicos 0 y 255", () => {
  for (const pa of [0, 255]) {
    const line = context.l1dFill(access(pa), Array(8).fill(9));
    assert.equal(context.l1dRead(line, access(pa)).value, 9);
  }
});

test("rechaza direcciones, datos y líneas inválidos", () => {
  const line = context.l1dCreate();

  for (const pa of [-1, 256, 1.5, "10"]) {
    assert.throws(() => context.l1dRead(line, access(pa)));
  }

  assert.throws(() =>
    context.l1dFill(access(0), [1, 2])
  );

  assert.throws(() =>
    context.l1dPlanWrite(line, access(0, "write"), 256)
  );

  assert.throws(() =>
    context.l1dRead(line, access(0, "fetch"))
  );

  assert.throws(() =>
    context.l1dRead(line, { ok: true, status: "pageFault" })
  );
});
