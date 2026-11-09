/**
 * Clasificación y permisos de acceso para la MMU.
 * Depende de mmu.js y mmu-state.js.
 *
 * No ejecuta transferencias ni cambia el snapshot.
 * io=true expresa la intención de acceso:
 * el módulo de buses debe activar y validar la señal IO real.
 */

function mmuValidateIoMap(state) {
  var validation = mmuValidateSnapshot(state);

  if (!validation.ok) {
    return validation;
  }

  var ioMap = state.profile.ioMap;

  if (!ioMap || !ioMap.keyboard || !ioMap.lcd) {
    return mmuError("INVALID_PROFILE", "Falta el mapa de E/S.");
  }

  var definitions = [
    { name: "KBD", map: ioMap.keyboard },
    { name: "LCD", map: ioMap.lcd }
  ];

  var usedVirtual = {};
  var usedPhysical = {};
  var zones = [];

  for (var i = 0; i < definitions.length; i++) {
    var definition = definitions[i];
    var map = definition.map;

    if (map.length !== 8 ||
        !Number.isInteger(map.va) ||
        !Number.isInteger(map.pa) ||
        map.va < 0 || map.va + 8 > 512 ||
        map.pa < 0 || map.pa + 8 > 256) {
      return mmuError(
        "INVALID_PROFILE",
        "Reserva inválida para " + definition.name + "."
      );
    }

    for (var offset = 0; offset < 8; offset++) {
      var va = map.va + offset;
      var pa = map.pa + offset;

      if (usedVirtual[va] || usedPhysical[pa]) {
        return mmuError(
          "INVALID_PROFILE",
          "Las reservas de teclado y LCD se superponen."
        );
      }

      usedVirtual[va] = true;
      usedPhysical[pa] = true;

      var page = state.mmu.pages[Math.floor(va / 32)];

      if (!page.present || !page.pinned ||
          page.pfn * 32 + va % 32 !== pa) {
        return mmuError(
          "INVALID_PROFILE",
          "La reserva " + definition.name +
          " no coincide con una página protegida."
        );
      }
    }

    zones.push({
      endpoint: definition.name,
      va: map.va,
      pa: map.pa,
      length: 8
    });
  }

  // Los controladores deben apuntar a la misma RAM que el perfil.
  if (!state.io || !state.io.keyboard || !state.io.lcd ||
      state.io.keyboard.basePa !== ioMap.keyboard.pa ||
      state.io.keyboard.capacity !== 8 ||
      state.io.lcd.basePa !== ioMap.lcd.pa ||
      state.io.lcd.length !== 8) {
    return mmuError(
      "INVALID_PROFILE",
      "Los controladores de E/S no coinciden con el perfil."
    );
  }

  return { ok: true, zones: zones };
}

/**
 * request:
 * {
 *   va: dirección virtual,
 *   kind: "fetch" | "read" | "write",
 *   io: booleano,
 *   endpoint: null | "KBD" | "LCD"
 * }
 *
 * Política propuesta de integración:
 * - Acceso ordinario: io=false, endpoint=null.
 * - E/S: io=true y endpoint correcto.
 * - La CPU no escribe en la cola del teclado.
 * - El resto de las páginas dedicadas a E/S queda reservado.
 */
function mmuResolveAccess(state, request) {
  if (!request ||
      !Number.isInteger(request.va) ||
      request.va < 0 || request.va > 511) {
    return mmuError(
      "OUT_OF_RANGE",
      "La dirección debe ser un entero entre 0 y 511."
    );
  }

  if (["fetch", "read", "write"].indexOf(request.kind) === -1 ||
      typeof request.io !== "boolean" ||
      [null, "KBD", "LCD"].indexOf(request.endpoint) === -1) {
    return mmuError(
      "INVALID_OPERAND",
      "Tipo de acceso, señal IO o endpoint inválido."
    );
  }

  var validation = mmuValidateIoMap(state);

  if (!validation.ok) {
    return validation;
  }

  var zone = null;
  var reservedPage = false;
  var vpn = Math.floor(request.va / 32);

  for (var i = 0; i < validation.zones.length; i++) {
    var candidate = validation.zones[i];

    var firstPage = Math.floor(candidate.va / 32);
    var lastPage = Math.floor(
      (candidate.va + candidate.length - 1) / 32
    );

    if (vpn >= firstPage && vpn <= lastPage) {
      reservedPage = true;
    }

    if (request.va >= candidate.va &&
        request.va < candidate.va + candidate.length) {
      zone = candidate;
    }
  }

  if (reservedPage && request.kind === "fetch") {
    return mmuError(
      "FETCH_FROM_IO",
      "No se permite buscar instrucciones en páginas de E/S."
    );
  }

  if (reservedPage && zone === null) {
    return mmuError(
      "IO_PROTECTED",
      "Dirección reservada sin periférico."
    );
  }

  if (zone !== null) {
    if (!request.io || request.endpoint !== zone.endpoint) {
      return mmuError(
        "IO_PROTECTED",
        "El acceso requiere IO y el endpoint correcto."
      );
    }

    if (zone.endpoint === "KBD" && request.kind === "write") {
      return mmuError(
        "IO_PROTECTED",
        "La CPU no puede escribir en la cola del teclado."
      );
    }
  } else if (request.io || request.endpoint !== null) {
    return mmuError(
      "IO_PROTECTED",
      "La dirección no pertenece al periférico solicitado."
    );
  }

  var translated = mmuTranslate(state.mmu.pages, request.va);

  if (!translated.ok) {
    return translated;
  }

  translated.access = {
    kind: request.kind,
    io: zone !== null,
    endpoint: zone === null ? null : zone.endpoint,
    cacheable: zone === null
  };

  return translated;
}
