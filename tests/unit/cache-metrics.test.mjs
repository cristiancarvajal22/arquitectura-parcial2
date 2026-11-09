import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const context = vm.createContext({});

vm.runInContext(
  readFileSync(
    new URL("../../src/cache/metrics.js", import.meta.url),
    "utf8"
  ),
  context
);

function scenario(requestId = "request-1") {
  let metrics = context.cacheMetricsCreate();
  let accounting = context.cacheMetricsBeginRequest(requestId);

  return {
    record(level, outcome, lookupId) {
      const result = context.cacheMetricsRecord(
        metrics,
        accounting,
        { requestId, lookupId, level, outcome }
      );

      metrics = result.metrics;
      accounting = result.accounting;
      return result.counted;
    },
    rates() {
      return context.cacheMetricsRates(metrics);
    }
  };
}

test("tasas iniciales y denominador cero", () => {
  const rates = scenario().rates();

  for (const level of ["l1i", "l1d", "l2"]) {
    assert.equal(rates[level].total, 0);
    assert.equal(rates[level].hitRate, 0);
  }
});

test("secuencia fría/caliente cuenta L2 solo cuando se consulta", () => {
  const run = scenario();

  // Primer acceso: falla L1D y falla L2.
  run.record("l1d", "miss", "access-1");
  run.record("l2", "miss", "access-1");

  // Segundo acceso: acierta L1D; no se consulta L2.
  run.record("l1d", "hit", "access-2");

  // Tercer acceso: falla L1D y acierta L2.
  run.record("l1d", "miss", "access-3");
  run.record("l2", "hit", "access-3");

  const rates = run.rates();

  assert.equal(rates.l1d.hits, 1);
  assert.equal(rates.l1d.misses, 2);
  assert.equal(rates.l1d.hitRate, 1 / 3);
  assert.equal(rates.l2.total, 2);
  assert.equal(rates.l2.hitRate, 0.5);
  assert.equal(rates.l1i.total, 0);
});

test("reanudar una consulta no duplica su contabilización", () => {
  const run = scenario();

  assert.equal(run.record("l1d", "miss", "before-fault"), true);
  assert.equal(run.record("l1d", "miss", "before-fault"), false);
  assert.equal(run.rates().l1d.misses, 1);

  // Si realmente se hace otra búsqueda tras la recarga,
  // tiene su propio identificador y sí se cuenta.
  assert.equal(run.record("l1d", "hit", "after-fault"), true);
  assert.equal(run.rates().l1d.total, 2);
});

test("los niveles tienen contadores independientes", () => {
  const run = scenario();

  run.record("l1i", "hit", "fetch-1");

  assert.equal(run.rates().l1i.hits, 1);
  assert.equal(run.rates().l1d.total, 0);
  assert.equal(run.rates().l2.total, 0);
});

test("rechaza un resultado contradictorio para la misma consulta", () => {
  const run = scenario();
  run.record("l1d", "miss", "lookup-1");

  assert.throws(() => run.record("l1d", "hit", "lookup-1"));
  assert.equal(run.rates().l1d.misses, 1);
});

test("rechaza peticiones antiguas, niveles y resultados inválidos", () => {
  const metrics = context.cacheMetricsCreate();
  const accounting = context.cacheMetricsBeginRequest("current");

  for (const lookup of [
    { requestId: "old", lookupId: "1", level: "l1d", outcome: "hit" },
    { requestId: "current", lookupId: "1", level: "l3", outcome: "hit" },
    { requestId: "current", lookupId: "1", level: "l2", outcome: "other" }
  ]) {
    assert.throws(() =>
      context.cacheMetricsRecord(metrics, accounting, lookup)
    );
  }
});

test("reset de contadores crea valores nuevos en cero", () => {
  const run = scenario();
  run.record("l2", "miss", "lookup-1");

  const reset = context.cacheMetricsRates(context.cacheMetricsCreate());

  assert.equal(reset.l2.total, 0);
  assert.equal(reset.l2.hitRate, 0);
  assert.equal(run.rates().l2.misses, 1);
});

test("no modifica las entradas y devuelve datos serializables", () => {
  const metrics = context.cacheMetricsCreate();
  const accounting = context.cacheMetricsBeginRequest("request-1");
  const before = JSON.stringify({ metrics, accounting });

  const result = context.cacheMetricsRecord(metrics, accounting, {
    requestId: "request-1",
    lookupId: "lookup-1",
    level: "l1d",
    outcome: "hit"
  });

  assert.equal(JSON.stringify({ metrics, accounting }), before);
  assert.equal(JSON.parse(JSON.stringify(result)).metrics.l1d.hits, 1);
});
