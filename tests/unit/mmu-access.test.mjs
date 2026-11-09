import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const context = vm.createContext({});

for (const file of ["mmu.js", "mmu-state.js", "mmu-access.js"]) {
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

function resolve(state, va, kind, io = false, endpoint = null) {
  return context.mmuResolveAccess(state, {
    va, kind, io, endpoint
  });
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

test("traduce memoria ordinaria como cacheable", () => {
  const state = snapshot();
  mapPage(state, 3, 2);

  for (const kind of ["fetch", "read", "write"]) {
    const result = resolve(state, 100, kind);

    assert.equal(result.ok, true);
    assert.equal(result.status, "translated");
    assert.equal(result.pa, 68);
    assert.equal(result.access.cacheable, true);
    assert.equal(result.access.io, false);
  }
});

test("una página ordinaria ausente informa pageFault", () => {
  const result = resolve(snapshot(), 100, "read");

  assert.equal(result.ok, true);
  assert.equal(result.status, "pageFault");
  assert.equal(result.pa, null);
});

test("los ocho bytes de KBD se leen sin caché", () => {
  const state = snapshot();
  const map = state.profile.ioMap.keyboard;

  for (let offset = 0; offset < 8; offset++) {
    const result = resolve(
      state, map.va + offset, "read", true, "KBD"
    );

    assert.equal(result.ok, true);
    assert.equal(result.pa, map.pa + offset);
    assert.equal(result.access.cacheable, false);
    assert.equal(result.access.endpoint, "KBD");
  }
});

test("los ocho bytes de LCD admiten E/S explícita sin caché", () => {
  const state = snapshot();
  const map = state.profile.ioMap.lcd;

  for (const kind of ["read", "write"]) {
    for (let offset = 0; offset < 8; offset++) {
      const result = resolve(
        state, map.va + offset, kind, true, "LCD"
      );

      assert.equal(result.ok, true);
      assert.equal(result.pa, map.pa + offset);
      assert.equal(result.access.cacheable, false);
    }
  }
});

test("rechaza acceso ordinario y endpoint equivocado en E/S", () => {
  const state = snapshot();
  const va = state.profile.ioMap.lcd.va;

  for (const result of [
    resolve(state, va, "read"),
    resolve(state, va, "write"),
    resolve(state, va, "write", true, "KBD")
  ]) {
    assert.equal(result.ok, false);
    assert.equal(result.error.code, "IO_PROTECTED");
  }
});

test("la CPU no puede escribir en KBD", () => {
  const state = snapshot();
  const result = resolve(
    state, state.profile.ioMap.keyboard.va, "write", true, "KBD"
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "IO_PROTECTED");
});

test("rechaza fetch en toda la página dedicada a E/S", () => {
  const state = snapshot();

  for (let va = 480; va <= 511; va++) {
    const result = resolve(state, va, "fetch");

    assert.equal(result.ok, false);
    assert.equal(result.error.code, "FETCH_FROM_IO");
  }
});

test("rechaza los bytes reservados sin periférico", () => {
  const state = snapshot();

  // En el snapshot ilustrativo: KBD empieza en VA 496.
  for (let va = 480; va < 496; va++) {
    const result = resolve(state, va, "read");

    assert.equal(result.ok, false);
    assert.equal(result.error.code, "IO_PROTECTED");
  }
});

test("rechaza IO dirigido a memoria ordinaria", () => {
  const result = resolve(snapshot(), 100, "read", true, "KBD");

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "IO_PROTECTED");
});

test("rechaza reservas superpuestas o físicamente incorrectas", () => {
  const overlap = snapshot();
  overlap.profile.ioMap.lcd = {
    ...overlap.profile.ioMap.keyboard
  };
  assert.equal(context.mmuValidateIoMap(overlap).ok, false);

  const wrongPa = snapshot();
  wrongPa.profile.ioMap.lcd.pa = 0;
  assert.equal(context.mmuValidateIoMap(wrongPa).ok, false);
});

test("rechaza un controlador que no coincide con el perfil", () => {
  const state = snapshot();
  state.io.lcd.basePa = 0;

  assert.equal(context.mmuValidateIoMap(state).ok, false);
});

test("rechaza solicitudes inválidas sin modificar el snapshot", () => {
  const state = snapshot();
  const before = JSON.stringify(state);

  const invalidRequests = [
    { va: 512, kind: "read", io: false, endpoint: null },
    { va: "100", kind: "read", io: false, endpoint: null },
    { va: 100, kind: "unknown", io: false, endpoint: null },
    { va: 100, kind: "read", io: 0, endpoint: null },
    { va: 100, kind: "read", io: true, endpoint: "OTHER" }
  ];

  for (const request of invalidRequests) {
    assert.equal(
      context.mmuResolveAccess(state, request).ok,
      false
    );
  }

  assert.equal(JSON.stringify(state), before);
});

test("los accesos válidos tampoco modifican el snapshot", () => {
  const state = snapshot();
  mapPage(state, 3, 2);
  const before = JSON.stringify(state);

  resolve(state, 100, "read");
  resolve(state, state.profile.ioMap.keyboard.va, "read", true, "KBD");
  resolve(state, state.profile.ioMap.lcd.va, "write", true, "LCD");

  assert.equal(JSON.stringify(state), before);
});
