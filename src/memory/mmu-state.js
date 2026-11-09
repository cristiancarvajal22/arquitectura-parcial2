/**
 * Valida la relación entre páginas, marcos y reservas del perfil.
 * Depende de mmu.js.
 *
 * No modifica el snapshot ni aprueba perfiles.
 * Validar un ejemplo no autoriza Run/Step de producción.
 */
function mmuValidateSnapshot(state) {
  function invalid(message) {
    return mmuError("INVALID_PROFILE", message);
  }

  if (!state || state.schemaVersion !== 1 ||
      !state.profile || !state.ram || !state.mmu) {
    return invalid("Snapshot incompleto o versión no compatible.");
  }

  var sizes = state.profile.sizes;
  var expectedSizes = {
    ramBytes: 256,
    virtualBytes: 512,
    pageBytes: 32,
    frameCount: 8,
    pageCount: 16
  };

  if (!sizes) {
    return invalid("Faltan los tamaños del perfil.");
  }

  var names = Object.keys(expectedSizes);

  for (var i = 0; i < names.length; i++) {
    var name = names[i];

    if (sizes[name] !== expectedSizes[name]) {
      return invalid("Tamaño incompatible: " + name + ".");
    }
  }

  var pages = state.mmu.pages;
  var pageValidation = mmuValidatePageTable(pages);

  if (!pageValidation.ok) {
    return pageValidation;
  }

  var frames = state.ram.frames;
  var ram = state.ram.bytes;

  if (!Array.isArray(frames) || frames.length !== 8) {
    return invalid("RAM debe describir exactamente ocho marcos.");
  }

  if (!Array.isArray(ram) || ram.length !== 256) {
    return invalid("RAM debe contener exactamente 256 bytes.");
  }

  for (var address = 0; address < ram.length; address++) {
    if (!Number.isInteger(ram[address]) ||
        ram[address] < 0 || ram[address] > 255) {
      return invalid("Byte de RAM inválido en " + address + ".");
    }
  }

  // Comprobar la relación desde marcos hacia páginas.
  for (var pfn = 0; pfn < 8; pfn++) {
    var frame = frames[pfn];

    if (!frame || frame.pfn !== pfn ||
        typeof frame.pinned !== "boolean") {
      return invalid("Descriptor inválido para el marco " + pfn + ".");
    }

    if (frame.vpn === null) {
      if (frame.pinned) {
        return invalid("Un marco protegido no puede estar libre.");
      }
      continue;
    }

    if (!Number.isInteger(frame.vpn) ||
        frame.vpn < 0 || frame.vpn > 15) {
      return invalid("VPN inválida en el marco " + pfn + ".");
    }

    var page = pages[frame.vpn];

    if (!page.present || page.pfn !== pfn ||
        page.pinned !== frame.pinned) {
      return invalid("Marco y página no coinciden en PFN " + pfn + ".");
    }
  }

  // Comprobar también desde páginas hacia marcos.
  for (var vpn = 0; vpn < 16; vpn++) {
    var entry = pages[vpn];

    if (entry.present) {
      var assignedFrame = frames[entry.pfn];

      if (assignedFrame.vpn !== vpn ||
          assignedFrame.pinned !== entry.pinned) {
        return invalid("Página sin marco coherente: VPN " + vpn + ".");
      }
    }
  }

  var mappings = state.profile.pinnedMappings;

  if (!Array.isArray(mappings)) {
    return invalid("Faltan los mapeos protegidos del perfil.");
  }

  var pinnedVpns = {};
  var pinnedPfns = {};

  for (var m = 0; m < mappings.length; m++) {
    var mapping = mappings[m];

    if (!mapping ||
        !Number.isInteger(mapping.vpn) ||
        mapping.vpn < 0 || mapping.vpn > 15 ||
        !Number.isInteger(mapping.pfn) ||
        mapping.pfn < 0 || mapping.pfn > 7) {
      return invalid("Mapeo protegido fuera de rango.");
    }

    if (pinnedVpns[mapping.vpn] || pinnedPfns[mapping.pfn]) {
      return invalid("Mapeo protegido duplicado.");
    }

    pinnedVpns[mapping.vpn] = true;
    pinnedPfns[mapping.pfn] = true;

    var pinnedPage = pages[mapping.vpn];

    if (!pinnedPage.present || !pinnedPage.pinned ||
        pinnedPage.pfn !== mapping.pfn) {
      return invalid("El estado no respeta un mapeo protegido.");
    }
  }

  // No admitir protecciones que no estén declaradas en el perfil.
  for (var v = 0; v < 16; v++) {
    if (pages[v].pinned !== Boolean(pinnedVpns[v])) {
      return invalid("Protección de página distinta del perfil.");
    }
  }

  var replaceableFrames = [];

  for (var f = 0; f < 8; f++) {
    if (!frames[f].pinned) {
      replaceableFrames.push(f);
    }
  }

  return {
    ok: true,
    replaceableFrames: replaceableFrames,
    replaceableFrameCount: replaceableFrames.length
  };
}
