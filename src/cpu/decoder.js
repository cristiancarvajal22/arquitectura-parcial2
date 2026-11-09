/**
 * Decodificador de la ISA propuesta en P2-002.
 * Compatible con JavaScript y Google Apps Script.
 * No modifica registros, memoria ni los bytes recibidos.
 *
 * Es una función interna: su resultado no sustituye
 * el formato Result de las APIs del contrato compartido.
 */
function cpuDecodeInstruction(bytes) {
  function invalid(message) {
    return {
      ok: false,
      error: {
        code: "INVALID_OPERAND",
        message: message
      }
    };
  }

  if (!Array.isArray(bytes) || bytes.length !== 4) {
    return invalid("La instrucción debe contener cuatro bytes.");
  }

  for (var i = 0; i < bytes.length; i++) {
    if (!Number.isInteger(bytes[i]) ||
        bytes[i] < 0 || bytes[i] > 255) {
      return invalid("Byte inválido en la posición " + i + ".");
    }
  }

  var registers = ["AX", "BX", "CX", "DX"];

  // Formatos:
  // none: sin operandos
  // ri: registro e inmediato
  // rr: dos registros
  // r: un registro
  // ra: registro y dirección
  // a: dirección de salto
  var definitions = {
    0x00: { mnemonic: "HALT", format: "none" },
    0x01: { mnemonic: "NOP", format: "none" },
    0x10: { mnemonic: "MOV", format: "ri" },
    0x11: { mnemonic: "MOV", format: "rr" },
    0x20: { mnemonic: "LOAD", format: "ra" },
    0x21: { mnemonic: "STORE", format: "ra" },
    0x30: { mnemonic: "ADD", format: "rr" },
    0x31: { mnemonic: "SUB", format: "rr" },
    0x32: { mnemonic: "INC", format: "r" },
    0x33: { mnemonic: "DEC", format: "r" },
    0x34: { mnemonic: "CMP", format: "rr" },
    0x35: { mnemonic: "CMP", format: "ri" },
    0x40: { mnemonic: "AND", format: "rr" },
    0x41: { mnemonic: "OR", format: "rr" },
    0x42: { mnemonic: "XOR", format: "rr" },
    0x43: { mnemonic: "NOT", format: "r" },
    0x50: { mnemonic: "JMP", format: "a" },
    0x51: { mnemonic: "JZ", format: "a" },
    0x52: { mnemonic: "JNZ", format: "a" },
    0x60: { mnemonic: "IN", format: "r" },
    0x61: { mnemonic: "OUT", format: "r" }
  };

  var opcode = bytes[0];
  var a = bytes[1];
  var b = bytes[2];
  var c = bytes[3];
  var definition = definitions[opcode];

  if (!definition) {
    return invalid("Opcode desconocido: " + opcode + ".");
  }

  var format = definition.format;
  var usesRegister = ["ri", "rr", "r", "ra"].indexOf(format) !== -1;

  if (usesRegister && a > 3) {
    return invalid("El código de registro debe estar entre 0 y 3.");
  }

  if (format === "none" && (a !== 0 || b !== 0 || c !== 0)) {
    return invalid("La instrucción no admite operandos.");
  }

  if (format === "r" && (b !== 0 || c !== 0)) {
    return invalid("Los campos B y C deben valer cero.");
  }

  if (format === "ri" && c !== 0) {
    return invalid("El campo C debe valer cero.");
  }

  if (format === "rr" && (b > 3 || c !== 0)) {
    return invalid("Registro fuente inválido o campo C distinto de cero.");
  }

  if (format === "a" && a !== 0) {
    return invalid("El campo A del salto debe valer cero.");
  }

  var address = null;
  if (format === "ra" || format === "a") {
    if (c > 1) {
      return invalid("La dirección debe caber en nueve bits.");
    }
    address = b + 256 * c;
  }

  return {
    ok: true,
    instruction: {
      opcode: opcode,
      mnemonic: definition.mnemonic,
      format: format,
      length: 4,
      register: usesRegister ? registers[a] : null,
      sourceRegister: format === "rr" ? registers[b] : null,
      immediate: format === "ri" ? b : null,
      address: address
    }
  };
}
