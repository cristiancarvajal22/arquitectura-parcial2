import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const context = vm.createContext({});

for (const file of ["mmu.js", "mmu-state.js"]) {
  const source = readFileSync(
    new URL("../../src/memory/" + file, import.meta.url),
    "utf8"
  );
  vm.runInContext(source, context);
}

function snapshot() {
  return JSON.parse(readFileSync(
    new URL(
      "../../docs/examples/core/reset.snapshot.json",
      import.meta.url
    ),
    "utf8"
  ));
}

function validate(state) {
  return context.mmuValidateSnapshot(state);
}

function mapPage(state, vpn, pfn) {
  state.mmu.pages[vpn] = {
    vpn,
    present: true,
    pfn,
    dirty: false,
    referenced: false,
    pinned: false
  };

  state.ram.frames[pfn] = {
    pfn,
    vpn,
    pinned: false
  };
}

test("el snapshot inicial tiene siete marcos reemplazables", () => {
  const result = validate(snapshot());

  assert.equal(result.ok, true);
  assert.equal(result.replaceableFrameCount, 7);
  assert.equal(result.replaceableFrames.join(","), "0,1,2,3,4,5,6");
});

test("acepta un mapeo coherente y traduce su dirección", () => {
  const state = snapshot();
  mapPage(state, 3, 2);

  assert.equal(validate(state).ok, true);

  const result = context.mmuTranslate(state.mmu.pages, 100);

  assert.equal(result.status, "translated");
  assert.equal(result.vpn, 3);
  assert.equal(result.offset, 4);
  assert.equal(result.pa, 68);
});

test("rechaza una página cuyo marco no la reconoce", () => {
  const state = snapshot();
  mapPage(state, 3, 2);
  state.ram.frames[2].vpn = null;

  assert.equal(validate(state).ok, false);
});

test("rechaza un marco que apunta a una página ausente", () => {
  const state = snapshot();
  state.ram.frames[2].vpn = 3;

  assert.equal(validate(state).ok, false);
});

test("rechaza dos páginas sobre un mismo marco", () => {
  const state = snapshot();
  mapPage(state, 3, 2);

  state.mmu.pages[4] = {
    vpn: 4,
    present: true,
    pfn: 2,
    dirty: false,
    referenced: false,
    pinned: false
  };

  assert.equal(validate(state).ok, false);
});

test("rechaza eliminar la protección exigida por el perfil", () => {
  const state = snapshot();
  state.mmu.pages[15].pinned = false;
  state.ram.frames[7].pinned = false;

  assert.equal(validate(state).ok, false);
});

test("rechaza protecciones no declaradas en el perfil", () => {
  const state = snapshot();
  mapPage(state, 3, 2);
  state.mmu.pages[3].pinned = true;
  state.ram.frames[2].pinned = true;

  assert.equal(validate(state).ok, false);
});

test("rechaza reservas duplicadas o fuera de rango", () => {
  const cases = [
    [{ vpn: 15, pfn: 7 }, { vpn: 15, pfn: 7 }],
    [{ vpn: 16, pfn: 7 }],
    [{ vpn: 15, pfn: 8 }]
  ];

  for (const mappings of cases) {
    const state = snapshot();
    state.profile.pinnedMappings = mappings;

    assert.equal(validate(state).ok, false);
  }
});

test("rechaza RAM adicional y bytes inválidos", () => {
  const extraRam = snapshot();
  extraRam.ram.bytes.push(0);
  assert.equal(validate(extraRam).ok, false);

  const invalidByte = snapshot();
  invalidByte.ram.bytes[0] = 256;
  assert.equal(validate(invalidByte).ok, false);
});

test("rechaza versión, tamaños y descriptores incompatibles", () => {
  const wrongVersion = snapshot();
  wrongVersion.schemaVersion = 2;
  assert.equal(validate(wrongVersion).ok, false);

  const wrongSize = snapshot();
  wrongSize.profile.sizes.ramBytes = 512;
  assert.equal(validate(wrongSize).ok, false);

  const wrongFrame = snapshot();
  wrongFrame.ram.frames[0].pfn = 1;
  assert.equal(validate(wrongFrame).ok, false);
});

test("validar no modifica el snapshot ni aprueba el perfil", () => {
  const state = snapshot();
  const before = JSON.stringify(state);

  assert.equal(validate(state).ok, true);
  assert.equal(JSON.stringify(state), before);
  assert.equal(state.profile.status, "proposal");
});
