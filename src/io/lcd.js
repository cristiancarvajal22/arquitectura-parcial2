function lcdValidateState(state) {
  var lcd = state && state.io && state.io.lcd;
  var ram = state && state.ram && state.ram.bytes;
  var map = state && state.profile &&
    state.profile.ioMap && state.profile.ioMap.lcd;

  if (!lcd || !map ||
      lcd.length !== 8 || map.length !== 8 ||
      !Number.isInteger(lcd.basePa) ||
      lcd.basePa < 0 || lcd.basePa + 8 > 256 ||
      map.pa !== lcd.basePa ||
      !Number.isInteger(lcd.cursor) ||
      lcd.cursor < 0 || lcd.cursor > 7 ||
      !Array.isArray(ram) || ram.length !== 256) {
    throw new Error("Estado LCD o reserva de RAM inválidos.");
  }

  for (var i = 0; i < ram.length; i++) {
    if (!Number.isInteger(ram[i]) || ram[i] < 0 || ram[i] > 255) {
      throw new Error("Byte de RAM inválido.");
    }
  }
}

/**
 * Propuesta de actualización local para una transferencia del bus.
 * No modifica el snapshot recibido.
 *
 * El coordinador debe validar todos los segmentos y confirmar
 * el nuevo estado junto con revisión y evento.
 */
function lcdReceive(state, transfer) {
  lcdValidateState(state);

  if (!transfer || !transfer.signals ||
      typeof transfer.signals.Ld_LCD !== "boolean") {
    throw new Error("Falta la señal Ld_LCD.");
  }

  var next = JSON.parse(JSON.stringify(state));

  if (!transfer.signals.Ld_LCD) {
    return { changed: false, state: next };
  }

  var signals = transfer.signals;

  if (signals.Write !== true ||
      signals.Read !== false ||
      signals.IO !== true ||
      signals.Clock !== true) {
    throw new Error("OUT requiere Write, IO y Clock; Read debe estar apagado.");
  }

  var bus = transfer.bus;

  if (!bus || bus.level === "Z" ||
      !Array.isArray(bus.drivers) || bus.drivers.length !== 1 ||
      !Array.isArray(bus.receivers) ||
      bus.receivers.indexOf("LCD") === -1 ||
      !Number.isInteger(bus.value) ||
      bus.value < 0 || bus.value > 255) {
    throw new Error("El LCD requiere un byte y un único emisor de bus.");
  }

  var lcd = state.io.lcd;
  var address = lcd.basePa + lcd.cursor;

  if (transfer.pa !== address) {
    throw new Error("La dirección no coincide con la posición del cursor.");
  }

  next.ram.bytes[address] = bus.value;
  next.io.lcd.cursor = (lcd.cursor + 1) % 8;

  return {
    changed: true,
    state: next,
    write: {
      pa: address,
      before: state.ram.bytes[address],
      after: bus.value
    }
  };
}

/**
 * Vista derivada exclusivamente de los ocho bytes de RAM.
 * 0 se muestra vacío; ASCII 32..126 como carácter;
 * otros bytes se muestran como "·".
 */
function lcdReadDisplay(state) {
  lcdValidateState(state);

  var bytes = state.ram.bytes.slice(
    state.io.lcd.basePa,
    state.io.lcd.basePa + 8
  );

  var characters = bytes.map(function (value) {
    if (value === 0) return " ";
    if (value >= 32 && value <= 126) {
      return String.fromCharCode(value);
    }
    return "·";
  });

  return {
    bytes: bytes,
    characters: characters,
    text: characters.join(""),
    cursor: state.io.lcd.cursor
  };
}
