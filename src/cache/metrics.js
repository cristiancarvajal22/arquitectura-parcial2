function cacheMetricsCreate() {
  return {
    l1i: { hits: 0, misses: 0 },
    l1d: { hits: 0, misses: 0 },
    l2: { hits: 0, misses: 0 }
  };
}

function cacheMetricsBeginRequest(requestId) {
  if (typeof requestId !== "string" || !requestId.length) {
    throw new Error("requestId inválido.");
  }

  return { requestId: requestId, lookups: [] };
}

function cacheMetricsValidate(metrics) {
  var levels = ["l1i", "l1d", "l2"];

  for (var i = 0; i < levels.length; i++) {
    var counters = metrics && metrics[levels[i]];

    if (!counters ||
        !Number.isSafeInteger(counters.hits) ||
        !Number.isSafeInteger(counters.misses) ||
        counters.hits < 0 || counters.misses < 0) {
      throw new Error("Contadores inválidos: " + levels[i]);
    }
  }
}

/**
 * Una llamada por consulta real a una caché.
 *
 * lookupId identifica la consulta, no la dirección de memoria.
 * Al reanudar una petición se conserva accounting.
 * Una nueva consulta legítima necesita un lookupId nuevo.
 *
 * No modifica las entradas.
 */
function cacheMetricsRecord(metrics, accounting, lookup) {
  cacheMetricsValidate(metrics);

  if (!accounting ||
      typeof accounting.requestId !== "string" ||
      !accounting.requestId.length ||
      !Array.isArray(accounting.lookups) ||
      !lookup ||
      lookup.requestId !== accounting.requestId) {
    throw new Error("Petición de caché inválida o desactualizada.");
  }

  if (["l1i", "l1d", "l2"].indexOf(lookup.level) === -1 ||
      ["hit", "miss"].indexOf(lookup.outcome) === -1 ||
      typeof lookup.lookupId !== "string" ||
      !lookup.lookupId.length) {
    throw new Error("Consulta de caché inválida.");
  }

  var nextMetrics = JSON.parse(JSON.stringify(metrics));
  var nextAccounting = JSON.parse(JSON.stringify(accounting));

  for (var i = 0; i < accounting.lookups.length; i++) {
    var previous = accounting.lookups[i];

    if (previous.level === lookup.level &&
        previous.lookupId === lookup.lookupId) {
      if (previous.outcome !== lookup.outcome) {
        throw new Error("Una consulta repetida cambió su resultado.");
      }

      return {
        metrics: nextMetrics,
        accounting: nextAccounting,
        counted: false
      };
    }
  }

  var field = lookup.outcome === "hit" ? "hits" : "misses";

  if (nextMetrics[lookup.level][field] === Number.MAX_SAFE_INTEGER) {
    throw new Error("Desbordamiento del contador.");
  }

  nextMetrics[lookup.level][field] += 1;

  nextAccounting.lookups.push({
    lookupId: lookup.lookupId,
    level: lookup.level,
    outcome: lookup.outcome
  });

  return {
    metrics: nextMetrics,
    accounting: nextAccounting,
    counted: true
  };
}

function cacheMetricsRates(metrics) {
  cacheMetricsValidate(metrics);

  var result = {};
  var levels = ["l1i", "l1d", "l2"];

  for (var i = 0; i < levels.length; i++) {
    var level = levels[i];
    var hits = metrics[level].hits;
    var misses = metrics[level].misses;
    var total = hits + misses;

    if (!Number.isSafeInteger(total)) {
      throw new Error("Total de consultas fuera de rango.");
    }

    result[level] = {
      hits: hits,
      misses: misses,
      total: total,
      hitRate: total === 0 ? 0 : hits / total
    };
  }

  return result;
}
