import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(
  new URL("../../src/memory/mmu.js", import.meta.url),
  "utf8"
);

const context = vm.createContext({});
vm.runInContext(source, context);

function createTable() {
  const result = context.mmuCreatePageTable([
    { vpn: 15, pfn: 7 }
  ]);

  assert.equal(result.ok, true);
  return JSON.parse(JSON.stringify(result.pages));
}

function mapPage(pages, vpn, pfn) {
  pages[vpn] = {
    vpn,
    present: true,
    pfn,
    dirty: false,
    referenced: false,
    pinned: false
  };
}

test("crea 16 páginas y conserva el mapeo protegido", () => {
  const pages = createTable();

  assert.equal(pages.length, 16);
  assert.equal(pages[15].present, true);
  assert.equal(pages[15].pfn, 7);
  assert.equal(pages[15].pinned, true);

  for (let vpn = 0; vpn < 15; vpn++) {
    assert.equal(pages[vpn].present, false);
    assert.equal(pages[vpn].pfn, null);
  }
});

test("traduce las direcciones frontera exigidas", () => {
  const pages = createTable();

  mapPage(pages, 0, 2);
  mapPage(pages, 1, 4);
  mapPage(pages, 7, 0);
  mapPage(pages, 8, 6);

  const cases = [
    // VA, VPN, desplazamiento, PFN, PA.
    [0,   0,  0, 2, 64],
    [31,  0, 31, 2, 95],
    [32,  1,  0, 4, 128],
    [255, 7, 31, 0, 31],
    [256, 8,  0, 6, 192],
    [511, 15, 31, 7, 255]
  ];

  for (const [va, vpn, offset, pfn, pa] of cases) {
    const result = context.mmuTranslate(pages, va);

    assert.equal(result.ok, true);
    assert.equal(result.status, "translated");
    assert.equal(result.vpn, vpn);
    assert.equal(result.offset, offset);
    assert.equal(result.pfn, pfn);
    assert.equal(result.pa, pa);
  }
});

test("detecta página ausente sin inventar una dirección física", () => {
  const result = context.mmuTranslate(createTable(), 100);

  assert.equal(result.ok, true);
  assert.equal(result.status, "pageFault");
  assert.equal(result.vpn, 3);
  assert.equal(result.offset, 4);
  assert.equal(result.pfn, null);
  assert.equal(result.pa, null);
});

test("rechaza direcciones virtuales inválidas", () => {
  for (const va of [-1, 512, 1.5, "32", null, NaN, Infinity]) {
    const result = context.mmuTranslate(createTable(), va);

    assert.equal(result.ok, false);
    assert.equal(result.error.code, "OUT_OF_RANGE");
  }
});

test("rechaza dos páginas presentes en el mismo marco", () => {
  const pages = createTable();
  mapPage(pages, 0, 2);
  mapPage(pages, 1, 2);

  assert.equal(context.mmuValidatePageTable(pages).ok, false);
  assert.equal(context.mmuTranslate(pages, 0).ok, false);
});

test("rechaza tablas incompletas, desordenadas y flags inválidos", () => {
  const incomplete = createTable();
  incomplete.pop();
  assert.equal(context.mmuValidatePageTable(incomplete).ok, false);

  const unordered = createTable();
  unordered[0].vpn = 1;
  assert.equal(context.mmuValidatePageTable(unordered).ok, false);

  const invalidFlag = createTable();
  invalidFlag[0].present = 0;
  assert.equal(context.mmuValidatePageTable(invalidFlag).ok, false);
});

test("rechaza marcos inválidos y páginas ausentes inconsistentes", () => {
  for (const pfn of [-1, 8, 1.5, "2", null]) {
    const pages = createTable();
    mapPage(pages, 0, pfn);
    assert.equal(context.mmuValidatePageTable(pages).ok, false);
  }

  for (const field of ["pfn", "dirty", "referenced", "pinned"]) {
    const pages = createTable();
    pages[0][field] = field === "pfn" ? 0 : true;
    assert.equal(context.mmuValidatePageTable(pages).ok, false);
  }
});

test("rechaza reservas duplicadas o fuera de rango", () => {
  const invalidMappings = [
    null,
    [{ vpn: 16, pfn: 0 }],
    [{ vpn: 15, pfn: 8 }],
    [{ vpn: 15, pfn: 7 }, { vpn: 15, pfn: 6 }],
    [{ vpn: 14, pfn: 7 }, { vpn: 15, pfn: 7 }]
  ];

  for (const mappings of invalidMappings) {
    assert.equal(context.mmuCreatePageTable(mappings).ok, false);
  }
});

test("prepara encabezado y 16 filas para la tabla visible", () => {
  const result = context.mmuPageTableRows(createTable());

  assert.equal(result.ok, true);
  assert.equal(result.rows.length, 17);
  assert.equal(result.rows[0].join(","), "VPN,P,PFN,Dirty,Reference,Protegida");
  assert.equal(result.rows[16].join(","), "15,1,7,0,0,1");
});

test("traducción y presentación no modifican la tabla", () => {
  const pages = createTable();
  mapPage(pages, 0, 2);
  const before = JSON.stringify(pages);

  context.mmuTranslate(pages, 0);
  context.mmuTranslate(pages, 100);
  context.mmuPageTableRows(pages);

  assert.equal(JSON.stringify(pages), before);
});
