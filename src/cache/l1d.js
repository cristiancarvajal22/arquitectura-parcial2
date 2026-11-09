function l1dCreate() {
  return {
    valid: false,
    tag: null,
    dirty: false,
    bytes: [0, 0, 0, 0, 0, 0, 0, 0]
  };
}

function l1dValidate(line) {
  if (!line || typeof line.valid !== "boolean" ||
      line.dirty !== false ||
      !Array.isArray(line.bytes) || line.bytes.length !== 8) {
    throw new Error("Línea L1D inválida.");
  }

  if (line.valid) {
    if (!Number.isInteger(line.tag) || line.tag < 0 || line.tag > 31) {
      throw new Error("Tag físico inválido.");
    }
  } else if (line.tag !== null) {
    throw new Error("Una línea inválida debe tener tag nulo.");
  }

  for (var i = 0; i < 8; i++) {
    var value = line.bytes[i];

    if (!Number.isInteger(value) || value < 0 || value > 255) {
      throw new Error("Byte de caché inválido.");
    }
  }
}

function l1dValidateTranslation(translation, kind) {
  if (!translation || translation.ok !== true ||
      translation.status !== "translated" ||
      !Number.isInteger(translation.pa) ||
      translation.pa < 0 || translation.pa > 255 ||
      !translation.access ||
      translation.access.kind !== kind ||
      typeof translation.access.io !== "boolean" ||
      typeof translation.access.cacheable !== "boolean" ||
      translation.access.io === translation.access.cacheable) {
    throw new Error("Se necesita una traducción y permiso válidos.");
  }
}

function l1dRead(line, translation) {
  l1dValidate(line);
  l1dValidateTranslation(translation, "read");

  if (!translation.access.cacheable) {
    return { status: "bypass", route: "IO" };
  }

  var tag = Math.floor(translation.pa / 8);
  var offset = translation.pa % 8;

  if (line.valid && line.tag === tag) {
    return {
      status: "hit",
      route: "L1D",
      value: line.bytes[offset],
      tag: tag,
      offset: offset
    };
  }

  return {
    status: "miss",
    route: "L2",
    tag: tag,
    offset: offset,
    lineBasePa: tag * 8
  };
}

/**
 * Preparar la línea recibida desde L2.
 * El coordinador confirma los ocho bytes transferidos por el bus.
 */
function l1dFill(translation, bytes) {
  l1dValidateTranslation(translation, "read");

  if (!translation.access.cacheable) {
    throw new Error("No se permite cargar E/S en L1D.");
  }

  var line = {
    valid: true,
    tag: Math.floor(translation.pa / 8),
    dirty: false,
    bytes: Array.isArray(bytes) ? bytes.slice() : null
  };

  l1dValidate(line);
  return line;
}

/**
 * Write-through / no-write-allocate.
 * Aplicar lineAfterCommit solo cuando RAM confirme la escritura.
 */
function l1dPlanWrite(line, translation, value) {
  l1dValidate(line);
  l1dValidateTranslation(translation, "write");

  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new Error("El dato debe ser un byte.");
  }

  var nextLine = JSON.parse(JSON.stringify(line));

  if (!translation.access.cacheable) {
    return {
      status: "bypass",
      route: "IO",
      lineAfterCommit: nextLine
    };
  }

  var tag = Math.floor(translation.pa / 8);
  var hit = line.valid && line.tag === tag;

  if (hit) {
    nextLine.bytes[translation.pa % 8] = value;
  }

  return {
    status: hit ? "hit" : "miss",
    route: "RAM",
    allocate: false,
    lineAfterCommit: nextLine
  };
}

function l1dInvalidateFrame(line, pfn) {
  l1dValidate(line);

  if (!Number.isInteger(pfn) || pfn < 0 || pfn > 7) {
    throw new Error("Marco físico inválido.");
  }

  if (line.valid && Math.floor(line.tag / 4) === pfn) {
    return l1dCreate();
  }

  return JSON.parse(JSON.stringify(line));
}
