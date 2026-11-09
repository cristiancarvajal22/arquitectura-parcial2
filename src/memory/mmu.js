/**
 * Traducción de direcciones y validación de tabla de páginas.
 *
 * Funciones internas: no modifican RAM, cachés ni el estado recibido.
 * Las reservas se reciben del perfil acordado; no se fijan aquí.
 */

function mmuError(code, message) {
  return {
    ok: false,
    error: { code: code, message: message }
  };
}

function mmuValidatePageTable(pages) {
  if (!Array.isArray(pages) || pages.length !== 16) {
    return mmuError(
      "INVALID_PROFILE",
      "La tabla debe contener exactamente 16 entradas."
    );
  }

  var occupiedFrames = {};

  for (var vpn = 0; vpn < 16; vpn++) {
    var page = pages[vpn];

    if (!page || page.vpn !== vpn) {
      return mmuError(
        "INVALID_PROFILE",
        "Entrada inválida o desordenada para VPN " + vpn + "."
      );
    }

    var flags = ["present", "dirty", "referenced", "pinned"];

    for (var i = 0; i < flags.length; i++) {
      if (typeof page[flags[i]] !== "boolean") {
        return mmuError(
          "INVALID_PROFILE",
          "El campo " + flags[i] + " debe ser booleano en VPN " + vpn + "."
        );
      }
    }

    if (!page.present) {
      if (page.pfn !== null || page.dirty ||
          page.referenced || page.pinned) {
        return mmuError(
          "INVALID_PROFILE",
          "Una página ausente debe tener PFN nulo y flags desactivados."
        );
      }

      continue;
    }

    if (!Number.isInteger(page.pfn) || page.pfn < 0 || page.pfn > 7) {
      return mmuError(
        "INVALID_PROFILE",
        "El marco de VPN " + vpn + " debe estar entre 0 y 7."
      );
    }

    if (occupiedFrames[page.pfn] !== undefined) {
      return mmuError(
        "INVALID_PROFILE",
        "Dos páginas presentes utilizan el marco " + page.pfn + "."
      );
    }

    occupiedFrames[page.pfn] = vpn;
  }

  return { ok: true };
}

/**
 * pinnedMappings: lista explícita de objetos {vpn, pfn}.
 * Ejemplo de uso, sujeto al perfil aprobado:
 * mmuCreatePageTable([{vpn: 15, pfn: 7}]).
 *
 * Esta función crea la tabla; el coordinador también debe mantener
 * coherentes ram.frames y el perfil.
 */
function mmuCreatePageTable(pinnedMappings) {
  if (!Array.isArray(pinnedMappings)) {
    return mmuError(
      "INVALID_PROFILE",
      "Debe recibirse una lista explícita de mapeos protegidos."
    );
  }

  var pages = [];

  for (var vpn = 0; vpn < 16; vpn++) {
    pages.push({
      vpn: vpn,
      present: false,
      pfn: null,
      dirty: false,
      referenced: false,
      pinned: false
    });
  }

  for (var i = 0; i < pinnedMappings.length; i++) {
    var mapping = pinnedMappings[i];

    if (!mapping ||
        !Number.isInteger(mapping.vpn) ||
        mapping.vpn < 0 || mapping.vpn > 15 ||
        !Number.isInteger(mapping.pfn) ||
        mapping.pfn < 0 || mapping.pfn > 7) {
      return mmuError(
        "INVALID_PROFILE",
        "Mapeo protegido inválido."
      );
    }

    if (pages[mapping.vpn].present) {
      return mmuError(
        "INVALID_PROFILE",
        "VPN protegida repetida: " + mapping.vpn + "."
      );
    }

    pages[mapping.vpn] = {
      vpn: mapping.vpn,
      present: true,
      pfn: mapping.pfn,
      dirty: false,
      referenced: false,
      pinned: true
    };
  }

  var validation = mmuValidatePageTable(pages);

  if (!validation.ok) {
    return validation;
  }

  return { ok: true, pages: pages };
}

/**
 * Resuelve la traducción sin modificar Reference ni Dirty.
 * Esos cambios se confirman con el acceso real y su evento.
 *
 * Detectar una página ausente no inicia por sí solo FIFO ni Swap.
 */
function mmuTranslate(pages, va) {
  if (!Number.isInteger(va) || va < 0 || va > 511) {
    return mmuError(
      "OUT_OF_RANGE",
      "La dirección virtual debe ser un entero entre 0 y 511."
    );
  }

  var validation = mmuValidatePageTable(pages);

  if (!validation.ok) {
    return validation;
  }

  var vpn = Math.floor(va / 32);
  var offset = va % 32;
  var page = pages[vpn];

  if (!page.present) {
    return {
      ok: true,
      status: "pageFault",
      va: va,
      vpn: vpn,
      offset: offset,
      pfn: null,
      pa: null
    };
  }

  return {
    ok: true,
    status: "translated",
    va: va,
    vpn: vpn,
    offset: offset,
    pfn: page.pfn,
    pa: page.pfn * 32 + offset
  };
}

/**
 * Prepara las columnas de la tabla visible.
 * La conexión con Google Sheets debe dibujar estas filas.
 */
function mmuPageTableRows(pages) {
  var validation = mmuValidatePageTable(pages);

  if (!validation.ok) {
    return validation;
  }

  var rows = [["VPN", "P", "PFN", "Dirty", "Reference", "Protegida"]];

  for (var i = 0; i < pages.length; i++) {
    var page = pages[i];

    rows.push([
      page.vpn,
      page.present ? 1 : 0,
      page.pfn,
      page.dirty ? 1 : 0,
      page.referenced ? 1 : 0,
      page.pinned ? 1 : 0
    ]);
  }

  return { ok: true, rows: rows };
}
