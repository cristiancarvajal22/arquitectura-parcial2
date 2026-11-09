/** Generated from src by scripts/build-marcelo.cjs. No credentials. */

// ===== buses/arbiter.js =====
'use strict';

// Pure bus transaction kernel. Apps Script can use the global BusArbiter;
// Node uses the guarded export below. No spreadsheet or network side effects.
var BusArbiter = (function () {
  var blockedKeys = ['__proto__', 'prototype', 'constructor'];

  function fail(code, message, details) {
    var error = new Error(message);
    error.busCode = code;
    error.details = details || {};
    throw error;
  }

  function record(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  }

  function name(value) {
    return typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_]*$/.test(value)
      && blockedKeys.indexOf(value) === -1;
  }

  function width(value) {
    if (!Number.isInteger(value) || value < 1 || value > 32) {
      fail('INVALID_WIRING', 'A bus or port width must be an integer from 1 to 32.', { widthBits: value });
    }
  }

  function unsigned(value, bits, details) {
    if (!Number.isInteger(value) || value < 0 || value >= Math.pow(2, bits)) {
      fail('OUT_OF_RANGE', 'Value does not fit the unsigned width.', details);
    }
  }

  // Explicit JSON copying rejects unsupported data instead of silently losing it.
  function copy(value, ancestors) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (!Array.isArray(value) && !record(value)) fail('INVALID_STATE', 'State must contain only JSON data.');
    if (ancestors.indexOf(value) !== -1) fail('INVALID_STATE', 'Circular state is not supported.');
    var chain = ancestors.concat([value]);
    if (Array.isArray(value)) {
      var array = [];
      for (var i = 0; i < value.length; i++) {
        if (!Object.prototype.hasOwnProperty.call(value, i)) fail('INVALID_STATE', 'Sparse arrays are not supported.');
        array.push(copy(value[i], chain));
      }
      return array;
    }
    var result = {};
    Object.keys(value).forEach(function (key) {
      if (blockedKeys.indexOf(key) !== -1) fail('INVALID_STATE', 'Unsafe state key.', { key: key });
      result[key] = copy(value[key], chain);
    });
    return result;
  }

  function readPath(state, path) {
    if (!Array.isArray(path) || path.length === 0
      || path[0] === 'buses' || path[0] === 'revision') {
      fail('INVALID_WIRING', 'Port paths must refer to existing data, not bus metadata.');
    }
    var value = state;
    path.forEach(function (key) {
      if (Array.isArray(value) && (!Number.isInteger(key) || key < 0 || key >= value.length)) {
        fail('INVALID_WIRING', 'An array port must address an existing element, not array metadata.', { path: path });
      }
      if (!(name(key) || (Number.isInteger(key) && key >= 0))
        || value === null || typeof value !== 'object'
        || !Object.prototype.hasOwnProperty.call(value, key)) {
        fail('INVALID_WIRING', 'Port path does not exist.', { path: path });
      }
      value = value[key];
    });
    return value;
  }

  /**
   * transfer(state, wiring, signals, expectedRevision)
   * wiring.segments: {name: {widthBits, domain}}
   * wiring.ports: [{name, segment, path: [...], widthBits}]
   * signals: optional En_NAME / Ld_NAME boolean keys; omitted means false.
   * Returns completed {state, event}, or rejected {error}; inputs never mutate.
   */
  function transfer(state, wiring, signals, expectedRevision) {
    try {
      if (!record(state) || !Number.isSafeInteger(state.revision) || state.revision < 0
        || state.revision === Number.MAX_SAFE_INTEGER || !record(state.buses)) {
        fail('INVALID_STATE', 'Expected JSON state with buses and a nonnegative revision.');
      }
      if (expectedRevision !== state.revision) fail('STALE_REVISION', 'The observed state is outdated.');
      if (!record(wiring) || !record(wiring.segments) || !Array.isArray(wiring.ports)
        || !record(signals) || Object.keys(wiring.segments).length === 0) {
        fail('INVALID_WIRING', 'Segments, ports and signals are required.');
      }
      var original = copy(state, []);
      var buses = {};
      Object.keys(wiring.segments).forEach(function (segment) {
        var spec = wiring.segments[segment];
        if (!name(segment) || !record(spec)
          || ['virtual', 'physical', 'data', 'control'].indexOf(spec.domain) === -1) {
          fail('INVALID_WIRING', 'Invalid segment descriptor.', { segment: segment });
        }
        width(spec.widthBits);
        buses[segment] = { widthBits: spec.widthBits, domain: spec.domain,
          level: 'Z', value: null, drivers: [], receivers: [] };
      });
      var portNames = new Set();
      var allowedSignals = new Set();
      var ports = wiring.ports.map(function (port) {
        if (!record(port) || !name(port.name) || portNames.has(port.name)
          || !Object.prototype.hasOwnProperty.call(buses, port.segment)) {
          fail('INVALID_WIRING', 'Port name must be unique and its segment must exist.');
        }
        width(port.widthBits);
        portNames.add(port.name);
        allowedSignals.add('En_' + port.name);
        allowedSignals.add('Ld_' + port.name);
        var value = readPath(original, port.path);
        unsigned(value, port.widthBits, { port: port.name, value: value });
        return { name: port.name, segment: port.segment, path: port.path.slice(),
          widthBits: port.widthBits, value: value };
      });
      Object.keys(signals).forEach(function (key) {
        if (!allowedSignals.has(key) || typeof signals[key] !== 'boolean') {
          fail('INVALID_SIGNALS', 'Unknown signal or non-boolean signal value.', { signal: key });
        }
      });
      var normalized = {};
      allowedSignals.forEach(function (key) {
        normalized[key] = Object.prototype.hasOwnProperty.call(signals, key) && signals[key];
      });
      ports.forEach(function (port) {
        if (normalized['En_' + port.name]) buses[port.segment].drivers.push(port.name);
        if (normalized['Ld_' + port.name]) buses[port.segment].receivers.push(port.name);
      });
      // Resolve every segment before preparing any capture. Equal values still contend.
      Object.keys(buses).forEach(function (segment) {
        var bus = buses[segment];
        if (bus.drivers.length > 1) {
          fail('BUS_CONTENTION', 'More than one driver is enabled.', { segment: segment, drivers: bus.drivers });
        }
        if (bus.drivers.length === 0 && bus.receivers.length > 0) {
          fail('NO_BUS_DRIVER', 'An enabled receiver cannot capture High-Z.', { segment: segment });
        }
        if (bus.drivers.length === 1) {
          var source = ports.find(function (port) { return port.name === bus.drivers[0]; });
          unsigned(source.value, bus.widthBits, { segment: segment, value: source.value });
          bus.level = 'driven';
          bus.value = source.value;
        }
      });
      var paths = new Set();
      var captures = [];
      ports.forEach(function (port) {
        if (!normalized['Ld_' + port.name]) return;
        var value = buses[port.segment].value;
        unsigned(value, port.widthBits, { port: port.name, value: value });
        var key = JSON.stringify(port.path.map(String));
        if (paths.has(key)) fail('MULTIPLE_LOADS', 'Two receivers target the same state location.', { path: port.path });
        paths.add(key);
        captures.push({ port: port.name, segment: port.segment, path: port.path,
          before: port.value, after: value });
      });
      // Only now commit to a detached copy. A caller can swap this state once.
      var next = copy(original, []);
      captures.forEach(function (capture) {
        var target = next;
        capture.path.slice(0, -1).forEach(function (key) { target = target[key]; });
        target[capture.path[capture.path.length - 1]] = capture.after;
      });
      next.buses = buses;
      next.revision += 1;
      return { status: 'completed', state: next, event: {
        kind: 'bus-transfer', revisionBefore: original.revision, revisionAfter: next.revision,
        signals: normalized, segments: copy(buses, []), captures: captures
      } };
    } catch (error) {
      if (!error.busCode) throw error;
      return { status: 'rejected', error: { code: error.busCode,
        message: error.message, details: error.details } };
    }
  }

  return { transfer: transfer };
}());

if (typeof module !== 'undefined' && module.exports) module.exports = BusArbiter;


// ===== buses/microword.js =====
/** P2-009. Encoding proposed in #3; never marks a profile ready. */
var microWordSignals = Object.freeze([
  'En_AX','Ld_AX','En_BX','Ld_BX','En_CX','Ld_CX','En_DX','Ld_DX',
  'En_PC','Ld_PC','En_IR','Ld_IR','En_MAR','Ld_MAR','En_MDR','Ld_MDR',
  'En_ALU','Ld_ALU','En_RAM','Ld_RAM','En_KBD','Ld_KBD','En_LCD','Ld_LCD',
  'Read','Write','Clock','IO','Mem_R','Mem_W'
]);
function microWordView(event) {
  if (!event || event.result !== 'committed' || !event.signals || !Array.isArray(event.segments)) {
    throw new Error('INVALID_EVENT');
  }
  var s = event.signals, word = 0;
  if (Object.keys(s).length !== 30) throw new Error('INVALID_SIGNALS');
  microWordSignals.forEach(function (name, bit) {
    if (typeof s[name] !== 'boolean') throw new Error('INVALID_SIGNALS');
    if (s[name]) word += Math.pow(2, bit);
  });
  if ((s.Read && s.Write) || (s.Mem_R && s.Mem_W) ||
      (s.IO && (s.Mem_R || s.Mem_W)) ||
      (s.Mem_R && !s.Read) || (s.Mem_W && !s.Write)) throw new Error('INVALID_CONTROL');
  if (event.controlWord !== null && event.controlWord !== word) throw new Error('WORD_MISMATCH');
  var names = {}, drivers = {}, receivers = {};
  var widths = {internalAddress:9, externalAddress:8, internalData:8, externalData:8};
  event.segments.forEach(function (seg) {
    if (!seg || typeof seg.name !== 'string' || names[seg.name]) throw new Error('INVALID_SEGMENT');
    names[seg.name] = true;
    if (seg.name === 'internalControl' || seg.name === 'externalControl') return;
    if (!Object.prototype.hasOwnProperty.call(widths, seg.name) || seg.widthBits !== widths[seg.name] ||
        !Array.isArray(seg.receivers) || new Set(seg.receivers).size !== seg.receivers.length) throw new Error('INVALID_SEGMENT');
    if (seg.level === 'Z') {
      if (seg.driver !== null || seg.value !== null || seg.receivers.length) throw new Error('INVALID_HIGH_Z');
    } else {
      if (seg.level !== 'driven' || typeof seg.driver !== 'string' || s['En_' + seg.driver] !== true ||
          !Number.isInteger(seg.value) || seg.value < 0 || seg.value >= Math.pow(2, seg.widthBits)) throw new Error('INVALID_DRIVER');
      drivers[seg.driver] = true;
      seg.receivers.forEach(function (r) {
        if (s['Ld_' + r] !== true) throw new Error('INVALID_RECEIVER');
        receivers[r] = true;
      });
    }
  });
  Object.keys(widths).forEach(function (name) { if (!names[name]) throw new Error('MISSING_SEGMENT'); });
  var rows = microWordSignals.map(function (name, bit) {
    var enable = name.indexOf('En_') === 0, load = name.indexOf('Ld_') === 0;
    var endpoint = enable || load ? name.slice(3) : 'Control';
    if (s[name] && enable && !drivers[endpoint]) throw new Error('UNOBSERVED_DRIVER');
    if (s[name] && load && !receivers[endpoint]) throw new Error('UNOBSERVED_LOAD');
    return [bit, name, s[name] ? 1 : 0, endpoint,
      enable ? (s[name] ? 'DRIVING' : 'High-Z') : load ? (s[name] ? 'CAPTURE' : 'HOLD') : (s[name] ? 'ON' : 'OFF')];
  });
  return { word: word, binary: word.toString(2).padStart(30, '0'), rows: rows,
    encoding: 'proposal-30-v1', derived: event.controlWord === null };
}


// ===== cpu/registers-alu.js =====
'use strict';
var CpuAlu = (function () {
  var names = ['AX', 'BX', 'CX', 'DX'];
  function integer(value, max, name) {
    if (!Number.isInteger(value) || value < 0 || value > max) throw new RangeError(name + ': 0..' + max);
  }
  function reset() {
    return {registers:{AX:0,BX:0,CX:0,DX:0},pc:0,mar:0,mdr:0,
      ir:{bytes:[0,0,0,0],decoded:null,loadedBytes:0},
      flags:{ZF:false,CF:false,SF:false},alu:{a:0,b:0,result:0,operation:null}};
  }
  function validate(cpu) {
    names.forEach(function (r) { integer(cpu.registers[r],255,r); });
    integer(cpu.pc,511,'PC'); integer(cpu.mar,511,'MAR'); integer(cpu.mdr,255,'MDR');
    if (!Array.isArray(cpu.ir.bytes) || cpu.ir.bytes.length !== 4) throw new Error('IR requiere cuatro bytes');
    for (var i=0;i<4;i++) integer(cpu.ir.bytes[i],255,'IR');
    integer(cpu.ir.loadedBytes,4,'IR.loadedBytes');
    ['ZF','CF','SF'].forEach(function(f){if(typeof cpu.flags[f] !== 'boolean') throw new Error('Flag inválido: '+f);});
    return true;
  }
  // Pure combinational ALU: callers must capture result on the bus before committing CPU state.
  function evaluate(operation, a, b, flags) {
    integer(a,255,'A'); integer(b,255,'B');
    if (!flags || typeof flags.CF !== 'boolean') throw new Error('CF booleano requerido');
    var raw, carry=false;
    switch(operation) {
      case 'ADD': raw=a+b; carry=raw>255; break;
      case 'INC': raw=a+1; carry=raw>255; break;
      case 'SUB': case 'CMP': raw=a-b; carry=raw<0; break;
      case 'DEC': raw=a-1; carry=raw<0; break;
      case 'AND': raw=a&b; break;
      case 'OR': raw=a|b; break;
      case 'XOR': raw=a^b; break;
      case 'NOT': raw=~a; carry=flags.CF; break;
      default: throw new Error('Operación ALU desconocida: '+operation);
    }
    var result=raw&255;
    return {a:a,b:b,result:result,operation:operation,writeResult:operation!=='CMP',
      flags:{ZF:result===0,CF:carry,SF:(result&128)!==0}};
  }
  function snapshot(cpu) { validate(cpu); return JSON.parse(JSON.stringify(cpu)); }
  return {reset:reset,validate:validate,evaluate:evaluate,snapshot:snapshot};
}());
if(typeof module!=='undefined' && module.exports) module.exports=CpuAlu;


// ===== cpu/decoder.js =====
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


// ===== cpu/microcode.js =====
/**
 * Construye el plan de ejecución de una instrucción.
 * Depende de cpuDecodeInstruction, definido en decoder.js.
 *
 * Devuelve datos serializables. No modifica el estado.
 * Los nombres de operaciones son internos del planificador;
 * no sustituyen las señales ni las APIs del contrato.
 */
function cpuBuildExecutionPlan(bytes) {
  var decoded = cpuDecodeInstruction(bytes);

  if (!decoded.ok) {
    return decoded;
  }

  var instruction = decoded.instruction;
  var steps = [];

  function add(operation, parameters) {
    steps.push({
      index: steps.length,
      operation: operation,
      parameters: parameters
    });
  }

  var register = instruction.register;
  var sourceRegister = instruction.sourceRegister;
  var mnemonic = instruction.mnemonic;

  switch (mnemonic) {
    case "HALT":
      add("HALT", {});
      break;

    case "NOP":
      add("ADVANCE_PC", {});
      break;

    case "MOV":
      add("TRANSFER_TO_REGISTER", {
        destination: register,
        source: sourceRegister !== null
          ? { kind: "register", name: sourceRegister }
          : { kind: "immediate", value: instruction.immediate }
      });
      add("ADVANCE_PC", {});
      break;

    case "LOAD":
      add("PREPARE_ADDRESS", {
        address: instruction.address
      });
      add("REQUEST_READ", {});
      add("WAIT_READ", {});
      add("CAPTURE_RESPONSE_IN_MDR", {});
      add("TRANSFER_TO_REGISTER", {
        destination: register,
        source: { kind: "register", name: "MDR" }
      });
      add("ADVANCE_PC", {});
      break;

    case "STORE":
      add("PREPARE_ADDRESS", {
        address: instruction.address
      });
      add("TRANSFER_TO_REGISTER", {
        destination: "MDR",
        source: { kind: "register", name: register }
      });
      add("REQUEST_WRITE", {});
      add("WAIT_WRITE", {});
      add("ADVANCE_PC", {});
      break;

    case "ADD":
    case "SUB":
    case "AND":
    case "OR":
    case "XOR":
    case "CMP":
    case "INC":
    case "DEC":
    case "NOT":
      add("CAPTURE_ALU_A", {
        source: { kind: "register", name: register }
      });

      if (mnemonic !== "NOT") {
        var sourceB;

        if (mnemonic === "INC" || mnemonic === "DEC") {
          sourceB = { kind: "immediate", value: 1 };
        } else if (instruction.format === "ri") {
          sourceB = {
            kind: "immediate",
            value: instruction.immediate
          };
        } else {
          sourceB = { kind: "register", name: sourceRegister };
        }

        add("CAPTURE_ALU_B", { source: sourceB });
      }

      add("EVALUATE_ALU", { mnemonic: mnemonic });
      add("COMMIT_FLAGS", { mnemonic: mnemonic });

      if (mnemonic !== "CMP") {
        add("TRANSFER_TO_REGISTER", {
          destination: register,
          source: { kind: "aluResult" }
        });
      }

      add("ADVANCE_PC", {});
      break;

    case "JMP":
    case "JZ":
    case "JNZ":
      add("RESOLVE_BRANCH", {
        condition: mnemonic === "JMP"
          ? "always"
          : mnemonic === "JZ" ? "ZF_SET" : "ZF_CLEAR",
        address: instruction.address
      });
      break;

    case "IN":
      add("REQUEST_INPUT", { endpoint: "KBD" });
      add("WAIT_INPUT", {});
      add("CAPTURE_RESPONSE_IN_MDR", {});
      add("TRANSFER_TO_REGISTER", {
        destination: register,
        source: { kind: "register", name: "MDR" }
      });
      add("ADVANCE_PC", {});
      break;

    case "OUT":
      add("TRANSFER_TO_REGISTER", {
        destination: "MDR",
        source: { kind: "register", name: register }
      });
      add("REQUEST_OUTPUT", { endpoint: "LCD" });
      add("WAIT_OUTPUT", {});
      add("ADVANCE_PC", {});
      break;

    default:
      return {
        ok: false,
        error: {
          code: "INVALID_OPERAND",
          message: "No existe microsecuencia para " + mnemonic
        }
      };
  }

  return {
    ok: true,
    instruction: instruction,
    steps: steps
  };
}


// ===== memory/ram.js =====
'use strict';
var PhysicalRam=(function(){
 function range(n,max,label){if(!Number.isInteger(n)||n<0||n>max)throw new RangeError(label+': 0..'+max);}
 function reset(){return {bytes:Array.from({length:256},function(_,i){return i>=232&&i<240?32:0;}),
  frames:Array.from({length:8},function(_,pfn){return {pfn:pfn,vpn:pfn===7?15:null,pinned:pfn===7};})};}
 function validate(ram){
  if(!ram||!Array.isArray(ram.bytes)||ram.bytes.length!==256)throw new Error('RAM requiere 256 bytes');
  for(var i=0;i<256;i++)range(ram.bytes[i],255,'byte');
  if(!Array.isArray(ram.frames)||ram.frames.length!==8)throw new Error('RAM requiere ocho marcos');
  var seen=[];
  for(var p=0;p<8;p++){
   var f=ram.frames[p];if(!f||f.pfn!==p||f.pinned!==(p===7))throw new Error('Marco inválido');
   if(p===7&&f.vpn!==15)throw new Error('Marco 7 fijado a página 15');
   if(f.vpn!==null){range(f.vpn,p===7?15:14,'VPN');if(seen.indexOf(f.vpn)!==-1)throw new Error('VPN duplicada');seen.push(f.vpn);}
  }
 }
 function region(pa){range(pa,255,'PA');return pa<224?'ram':pa<232?'kbd':pa<240?'lcd':'reserved';}
 function access(pa,actor,write){
  var kind=region(pa);actor=actor||'program';
  if(['program','keyboard','lcd','cache','loader'].indexOf(actor)===-1)throw new Error('Actor desconocido');
  if(kind==='reserved')throw new Error('Zona reservada');
  if(actor==='keyboard'&&kind!=='kbd'||actor==='lcd'&&kind!=='lcd')throw new Error('Fuera del dispositivo');
  if((actor==='cache'||actor==='loader')&&kind!=='ram')throw new Error('E/S no cacheable ni cargable');
  if(write&&kind==='kbd'&&actor!=='keyboard')throw new Error('KBD solo admite escritura del controlador');
  return kind;
 }
 function read(ram,pa,actor){validate(ram);access(pa,actor,false);return ram.bytes[pa];}
 function write(ram,pa,value,actor){
  validate(ram);range(value,255,'valor');var kind=access(pa,actor,true);
  var next=JSON.parse(JSON.stringify(ram)),before=next.bytes[pa];next.bytes[pa]=value;
  return {ram:next,event:{pa:pa,before:before,after:value,region:kind,cacheable:kind==='ram',
   requiresCacheCoherence:kind==='ram'}};
 }
 // A display projection only; reserved bytes are visible but remain inaccessible to programs.
 function rows(ram){validate(ram);return ram.bytes.map(function(value,pa){return {pa:pa,pfn:Math.floor(pa/32),
  offset:pa%32,region:region(pa),decimal:value,hex:value.toString(16).toUpperCase().padStart(2,'0')};});}
 return {reset:reset,validate:validate,region:region,read:read,write:write,rows:rows};
}());
if(typeof module!=='undefined'&&module.exports)module.exports=PhysicalRam;


// ===== memory/fifo.js =====
'use strict';
var PageFifo=(function(){
 function range(n,max){if(!Number.isInteger(n)||n<0||n>max)throw new RangeError('Fuera de rango');}
 function reset(){return {revision:0,queue:[],frames:Array.from({length:8},function(_,pfn){
  return {pfn:pfn,vpn:pfn===7?15:null,pinned:pfn===7};})};}
 function validate(s){
  range(s.revision,Number.MAX_SAFE_INTEGER);
  if(!Array.isArray(s.frames)||s.frames.length!==8||!Array.isArray(s.queue))throw new Error('Estado FIFO inválido');
  var pages=[],eligible=[];
  s.frames.forEach(function(f,i){
   if(!f||f.pfn!==i||typeof f.pinned!=='boolean')throw new Error('Marco inválido');
   if(i===7&&(f.vpn!==15||!f.pinned))throw new Error('Marco de E/S protegido');
   if(f.vpn!==null){range(f.vpn,i===7?15:14);if(pages.indexOf(f.vpn)!==-1)throw new Error('Página duplicada');pages.push(f.vpn);}
   if(!f.pinned&&f.vpn!==null)eligible.push(i);
  });
  if(s.queue.length!==eligible.length||new Set(s.queue).size!==s.queue.length||
    s.queue.some(function(p){return eligible.indexOf(p)===-1;}))throw new Error('Cola inconsistente');
 }
 // Selection does not evict or mutate. MMU must flush dirty data and invalidate caches first.
 function select(s,vpn){
  validate(s);range(vpn,15);
  var hit=s.frames.find(function(f){return f.vpn===vpn;});
  if(hit)return {revision:s.revision,vpn:vpn,pfn:hit.pfn,victim:null,reason:'hit'};
  var free=s.frames.find(function(f){return !f.pinned&&f.vpn===null;});
  if(free)return {revision:s.revision,vpn:vpn,pfn:free.pfn,victim:null,reason:'free'};
  if(!s.queue.length)throw new Error('No hay marcos reemplazables');
  var victim=s.frames[s.queue[0]];
  return {revision:s.revision,vpn:vpn,pfn:victim.pfn,victim:victim.vpn,reason:'fifo'};
 }
 // Call only after the coordinator completes the eviction/load transaction.
 function commit(s,decision){
  var current=select(s,decision.vpn);
  if(['revision','vpn','pfn','victim','reason'].some(function(k){return current[k]!==decision[k];}))throw new Error('Decisión obsoleta o alterada');
  var next=JSON.parse(JSON.stringify(s));
  if(current.reason==='hit')return next;
  if(s.revision===Number.MAX_SAFE_INTEGER)throw new Error('Revisión agotada');
  next.queue=next.queue.filter(function(p){return p!==current.pfn;});next.queue.push(current.pfn);
  next.frames[current.pfn].vpn=current.vpn;next.revision++;validate(next);return next;
 }
 function view(s,vpn){validate(s);return {queue:s.queue.map(function(p){return {pfn:p,vpn:s.frames[p].vpn};}),
  head:s.queue.length?s.frames[s.queue[0]].vpn:null,decision:vpn===undefined?null:select(s,vpn),
  excluded:s.frames.filter(function(f){return f.pinned;}).map(function(f){return {pfn:f.pfn,vpn:f.vpn,reason:'pinned'};})};}
 return {reset:reset,validate:validate,select:select,commit:commit,view:view};
}());
if(typeof module!=='undefined'&&module.exports)module.exports=PageFifo;


// ===== memory/swap.js =====
/** P2-012. Pure backing-store operations; no RAM, MMU or bus side effects. */
function swapBytes(bytes, length) {
  if (!Array.isArray(bytes) || bytes.length !== length) throw new Error('INVALID_LENGTH');
  for (var i = 0; i < length; i++) {
    if (!Number.isInteger(bytes[i]) || bytes[i] < 0 || bytes[i] > 255) throw new Error('INVALID_BYTE');
  }
}
function swapVpn(vpn) {
  if (!Number.isInteger(vpn) || vpn < 0 || vpn >= 16) throw new Error('INVALID_VPN');
}
function swapValidate(store) {
  if (!store || !Array.isArray(store.pages) || !Array.isArray(store.initialPages) ||
      store.pages.length !== 16 || store.initialPages.length !== 16) throw new Error('INVALID_STORE');
  for (var i = 0; i < 16; i++) {
    swapBytes(store.pages[i], 32);
    swapBytes(store.initialPages[i], 32);
  }
}
function swapCreate(image) {
  if (image === undefined) image = Array(512).fill(0);
  swapBytes(image, 512);
  var initial = [];
  for (var i = 0; i < 16; i++) initial.push(image.slice(i * 32, (i + 1) * 32));
  return { initialPages: initial, pages: initial.map(function (p) { return p.slice(); }) };
}
function swapReadPage(store, vpn) {
  swapValidate(store); swapVpn(vpn);
  return store.pages[vpn].slice();
}
function swapWritePage(store, vpn, bytes) {
  swapValidate(store); swapVpn(vpn); swapBytes(bytes, 32);
  var next = JSON.parse(JSON.stringify(store));
  next.pages[vpn] = bytes.slice();
  return next;
}
/** Global reset is empty; restoring the loaded program is a separate operation. */
function swapReset() { return swapCreate(); }
function swapRestoreImage(store) {
  swapValidate(store);
  return swapCreate([].concat.apply([], store.initialPages));
}
/** Explicit migration of the existing schemaVersion 1 snapshot. */
function swapAttachImage(state, image) {
  if (!state || state.schemaVersion !== 1 || !state.ram) throw new Error('INVALID_STATE');
  swapBytes(state.ram.bytes, 256);
  var store = swapCreate(image);
  var next = JSON.parse(JSON.stringify(state));
  next.swap = store;
  return next;
}
/** Stage a page save on a copy. The coordinator commits it with its event. */
function swapSaveFrame(state, vpn, pfn) {
  swapVpn(vpn);
  if (!state || state.schemaVersion !== 1 || !state.profile ||
      !Array.isArray(state.profile.pinnedMappings) || !state.ram || !state.mmu ||
      !Array.isArray(state.ram.frames) || state.ram.frames.length !== 8 ||
      !Array.isArray(state.mmu.pages) || state.mmu.pages.length !== 16 ||
      !Number.isInteger(pfn) || pfn < 0 || pfn > 7) throw new Error('INVALID_STATE');
  swapBytes(state.ram.bytes, 256);
  var frame = state.ram.frames[pfn], page = state.mmu.pages[vpn];
  if (!frame || !page || frame.pfn !== pfn || page.vpn !== vpn ||
      frame.vpn !== vpn || page.pfn !== pfn || page.present !== true) throw new Error('INVALID_MAPPING');
  if (frame.pinned !== false || page.pinned !== false || state.profile.pinnedMappings.some(function (m) {
    return !m || m.vpn === vpn || m.pfn === pfn;
  })) throw new Error('IO_PROTECTED');
  var store = swapWritePage(state.swap, vpn, state.ram.bytes.slice(pfn * 32, pfn * 32 + 32));
  var next = JSON.parse(JSON.stringify(state));
  next.swap = store;
  return next;
}


// ===== memory/mmu.js =====
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


// ===== memory/mmu-state.js =====
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


// ===== memory/mmu-access.js =====
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


// ===== cache/l1i.js =====
'use strict';
var InstructionCache=(function(){
 function integer(n,max){if(!Number.isInteger(n)||n<0||n>max)throw new Error('Valor fuera de rango');}
 function reset(){return {lineBytes:8,valid:false,tag:null,dirty:false,bytes:Array(8).fill(0),generation:0};}
 function validate(c){
  if(c.lineBytes!==8||typeof c.valid!=='boolean'||c.dirty!==false||!Array.isArray(c.bytes)||c.bytes.length!==8)throw new Error('L1I inválida');
  for(var i=0;i<8;i++)integer(c.bytes[i],255);
  integer(c.generation,Number.MAX_SAFE_INTEGER-1);
  if(c.valid)integer(c.tag,27);else if(c.tag!==null)throw new Error('Tag inválido');
 }
 // PA must already be translated by MMU for every byte, including page crossings.
 function lookup(c,pa,kind){
  validate(c);integer(pa,255);
  if(kind!=='fetch')return {status:'bypass',reason:'not-fetch'};
  if(pa>=224)return {status:'rejected',reason:'non-executable-io'};
  var tag=Math.floor(pa/8),offset=pa%8;
  if(c.valid&&c.tag===tag)return {status:'hit',byte:c.bytes[offset]};
  return {status:'miss',request:{kind:'read-line',level:'L2',basePa:tag*8,length:8,generation:c.generation},offset:offset};
 }
 function fill(c,request,response){
  validate(c);
  if(request.kind!=='read-line'||request.level!=='L2'||request.length!==8||request.generation!==c.generation)throw new Error('Solicitud obsoleta o inválida');
  integer(request.basePa,216);if(request.basePa%8!==0)throw new Error('Línea no alineada');
  if(response.basePa!==request.basePa||!Array.isArray(response.bytes)||response.bytes.length!==8)throw new Error('Respuesta L2 incorrecta');
  for(var i=0;i<8;i++)integer(response.bytes[i],255);
  return {lineBytes:8,valid:true,tag:request.basePa/8,dirty:false,bytes:response.bytes.slice(),generation:c.generation+1};
 }
 function invalidate(c){validate(c);var n=reset();n.generation=c.generation+1;return n;}
 return {reset:reset,validate:validate,lookup:lookup,fill:fill,invalidate:invalidate};
}());
if(typeof module!=='undefined'&&module.exports)module.exports=InstructionCache;


// ===== cache/l1d.js =====
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


// ===== cache/l2.js =====
/** Four physical lines, FIFO independent of page FIFO. Read-only line service. */
var UnifiedL2=(function(){
  function clone(x){return JSON.parse(JSON.stringify(x));}
  function byte(v){if(!Number.isInteger(v)||v<0||v>255)throw new Error('INVALID_BYTE');}
  function address(pa){if(!Number.isInteger(pa)||pa<0||pa>=224)throw new Error('NON_CACHEABLE_ADDRESS');}
  function reset(){return {lines:Array.from({length:4},function(){return {valid:false,tag:null,dirty:false,bytes:Array(8).fill(0)};}),fifo:[],generation:0};}
  function validate(c){
    if(!c||!Array.isArray(c.lines)||c.lines.length!==4||!Array.isArray(c.fifo))throw new Error('INVALID_L2');
    if(c.generation!==undefined&&(!Number.isSafeInteger(c.generation)||c.generation<0||c.generation>=Number.MAX_SAFE_INTEGER))throw new Error('INVALID_GENERATION');
    var tags=[],valid=[];
    for(var i=0;i<4;i++){
      var l=c.lines[i];
      if(!l||typeof l.valid!=='boolean'||l.dirty!==false||!Array.isArray(l.bytes)||l.bytes.length!==8)throw new Error('INVALID_LINE');
      for(var j=0;j<8;j++)byte(l.bytes[j]);
      if(l.valid){if(!Number.isInteger(l.tag)||l.tag<0||l.tag>27||tags.indexOf(l.tag)!==-1)throw new Error('INVALID_TAG');tags.push(l.tag);valid.push(i);}
      else if(l.tag!==null)throw new Error('INVALID_TAG');
    }
    if(c.fifo.length!==valid.length||new Set(c.fifo).size!==c.fifo.length||c.fifo.some(function(i){return !Number.isInteger(i)||valid.indexOf(i)===-1;}))throw new Error('INVALID_FIFO');
  }
  function lookup(c,pa){validate(c);address(pa);var tag=Math.floor(pa/8),index=c.lines.findIndex(function(l){return l.valid&&l.tag===tag;});
    return index<0?{status:'miss',basePa:tag*8}:{status:'hit',index:index,basePa:tag*8,byte:c.lines[index].bytes[pa%8],bytes:c.lines[index].bytes.slice()};}
  function begin(c,basePa){validate(c);address(basePa);if(basePa%8!==0)throw new Error('UNALIGNED_LINE');
    if(lookup(c,basePa).status==='hit')throw new Error('ALREADY_PRESENT');
    return {basePa:basePa,baseline:clone(c),bytes:[]};}
  function accept(c,fill,transfer){validate(c);
    if(!fill||JSON.stringify(c)!==JSON.stringify(fill.baseline))throw new Error('STALE_FILL');
    address(fill.basePa);if(fill.basePa%8!==0||!Array.isArray(fill.bytes)||fill.bytes.length>=8)throw new Error('INVALID_FILL');
    for(var i=0;i<fill.bytes.length;i++)byte(fill.bytes[i]);
    if(!transfer||transfer.pa!==fill.basePa+fill.bytes.length)throw new Error('OUT_OF_ORDER_TRANSFER');byte(transfer.value);
    var next=clone(fill);next.bytes.push(transfer.value);
    if(next.bytes.length<8)return {status:'pending',fill:next,cache:clone(c)};
    var updated=clone(c),slot=updated.lines.findIndex(function(l){return !l.valid;}),victim=null;
    if(slot<0){slot=updated.fifo.shift();victim=updated.lines[slot].tag;}
    updated.lines[slot]={valid:true,tag:fill.basePa/8,dirty:false,bytes:next.bytes.slice()};updated.fifo.push(slot);updated.generation=(c.generation||0)+1;validate(updated);
    return {status:'completed',cache:updated,response:{basePa:fill.basePa,bytes:next.bytes.slice()},victimTag:victim,index:slot};
  }
  /** Convenience transaction: callback must stage bus transfers, never persist itself. */
  function readLine(c,request,readBusByte){
    if(!request||request.kind!=='read-line'||request.level!=='L2'||request.length!==8)throw new Error('INVALID_REQUEST');
    address(request.basePa);if(request.basePa%8!==0)throw new Error('UNALIGNED_LINE');
    var result=lookup(c,request.basePa),events=[{kind:'cache-lookup',level:'l2',basePa:request.basePa,result:result.status}];
    if(result.status==='hit')return {status:'completed',cache:clone(c),response:{basePa:request.basePa,bytes:result.bytes},events:events,metrics:{hits:1,misses:0}};
    if(typeof readBusByte!=='function')throw new Error('BUS_REQUIRED');
    var fill=begin(c,request.basePa),accepted;
    for(var i=0;i<8;i++){
      var transfer=readBusByte(request.basePa+i);
      if(!transfer||!transfer.event)throw new Error('MISSING_BUS_EVENT');
      accepted=accept(c,fill,transfer);events.push({kind:'line-byte',level:'l2',pa:transfer.pa,value:transfer.value,bus:clone(transfer.event)});
      if(accepted.status==='pending')fill=accepted.fill;
    }
    events.push({kind:'line-filled',level:'l2',basePa:request.basePa,index:accepted.index,victimTag:accepted.victimTag});
    return {status:'completed',cache:accepted.cache,response:accepted.response,events:events,metrics:{hits:0,misses:1}};
  }
  function invalidate(c,start,length){validate(c);address(start);
    if(!Number.isInteger(length)||length<1||start+length>224)throw new Error('INVALID_RANGE');
    var next=clone(c),first=Math.floor(start/8),last=Math.floor((start+length-1)/8);
    next.lines.forEach(function(l){if(l.valid&&l.tag>=first&&l.tag<=last){l.valid=false;l.tag=null;l.dirty=false;}});
    next.fifo=next.fifo.filter(function(i){return next.lines[i].valid;});
    next.generation=(c.generation||0)+1;validate(next);return next;
  }
  return {reset:reset,validate:validate,lookup:lookup,begin:begin,accept:accept,readLine:readLine,invalidate:invalidate};
}());
if(typeof module!=='undefined'&&module.exports)module.exports=UnifiedL2;


// ===== cache/coherence.js =====
'use strict';
var CacheCoherence=(function(){
 function range(n,max){if(!Number.isInteger(n)||n<0||n>max)throw new Error('Rango inválido');}
 function entries(c){
  if(!c.l2||!Array.isArray(c.l2.lines)||c.l2.lines.length!==4||!Array.isArray(c.l2.fifo))throw new Error('L2 requiere cuatro líneas y FIFO');
  var all=[{level:'l1i',index:null,line:c.l1i},{level:'l1d',index:null,line:c.l1d}];
  c.l2.lines.forEach(function(line,index){all.push({level:'l2',index:index,line:line});});
  all.forEach(function(e){var l=e.line;
   if(!l||typeof l.valid!=='boolean'||typeof l.dirty!=='boolean'||!Array.isArray(l.bytes)||l.bytes.length!==8)throw new Error('Línea inválida');
   for(var i=0;i<8;i++)range(l.bytes[i],255);
   if(l.valid)range(l.tag,27);else if(l.tag!==null||l.dirty)throw new Error('Línea inválida conserva tag/dirty');
   if(e.level==='l1i'&&l.dirty)throw new Error('L1I no puede ser dirty');
  });
  if(new Set(c.l2.fifo).size!==c.l2.fifo.length)throw new Error('FIFO duplicado');
  c.l2.fifo.forEach(function(i){range(i,3);if(!c.l2.lines[i].valid)throw new Error('FIFO apunta a línea inválida');});
  return all;
 }
 // Ranges are physical. Aliased virtual addresses therefore invalidate the same copies.
 function invalidate(c,start,length){
  range(start,223);range(length,224);if(length===0||start+length>224)throw new Error('Rango de memoria ordinaria requerido');
  var all=entries(c),first=Math.floor(start/8),last=Math.floor((start+length-1)/8);
  var affected=all.filter(function(e){return e.line.valid&&e.line.tag>=first&&e.line.tag<=last;});
  var dirty=affected.filter(function(e){return e.line.dirty;});
  if(dirty.length)return {status:'needs-writeback',lines:dirty.map(function(e){return {level:e.level,index:e.index,basePa:e.line.tag*8,bytes:e.line.bytes.slice()};})};
  var next=JSON.parse(JSON.stringify(c));
  affected.forEach(function(e){var l=e.level==='l2'?next.l2.lines[e.index]:next[e.level];l.valid=false;l.tag=null;l.dirty=false;});
  next.l2.fifo=next.l2.fifo.filter(function(i){return next.l2.lines[i].valid;});
  // Cancel any outstanding L1I fill, including a miss whose old resident line is unrelated.
  if(next.l1i.generation!==undefined){range(next.l1i.generation,Number.MAX_SAFE_INTEGER-1);next.l1i.generation++;}
  return {status:'completed',caches:next,invalidated:affected.map(function(e){return {level:e.level,index:e.index};})};
 }
 function route(pa){range(pa,255);return pa<224?'cacheable':pa<240?'io-bypass':'reserved';}
 return {invalidate:invalidate,route:route};
}());
if(typeof module!=='undefined'&&module.exports)module.exports=CacheCoherence;


// ===== cache/metrics.js =====
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


// ===== io/keyboard.js =====
'use strict';
var KeyboardQueue=(function(){
 function validate(s){
  var k=s.io.keyboard;
  if(!Number.isSafeInteger(s.revision)||s.revision<0||s.revision>=Number.MAX_SAFE_INTEGER-1)throw new Error('Revisión inválida');
  if(!Array.isArray(s.ram.bytes)||s.ram.bytes.length!==256)throw new Error('RAM inválida');
  for(var i=0;i<256;i++)if(!Number.isInteger(s.ram.bytes[i])||s.ram.bytes[i]<0||s.ram.bytes[i]>255)throw new Error('Byte inválido');
  if(k.basePa!==224||k.capacity!==8||!Number.isInteger(k.head)||!Number.isInteger(k.tail)||!Number.isInteger(k.count)||
   k.head<0||k.head>7||k.tail<0||k.tail>7||k.count<0||k.count>8||k.tail!==(k.head+k.count)%8)throw new Error('Punteros KBD inválidos');
 }
 function resetMetadata(){return {basePa:224,capacity:8,head:0,tail:0,count:0};}
 function enqueue(s,character,expectedRevision){
  validate(s);if(expectedRevision!==s.revision)throw new Error('Estado obsoleto');
  if(typeof character!=='string'||character.length!==1||character.charCodeAt(0)<32||character.charCodeAt(0)>126)throw new Error('Solo un carácter ASCII imprimible (32..126)');
  if(s.io.keyboard.count===8)return {status:'full'};
  var next=JSON.parse(JSON.stringify(s)),k=next.io.keyboard;
  next.ram.bytes[k.basePa+k.tail]=character.charCodeAt(0);k.tail=(k.tail+1)%8;k.count++;next.revision++;
  return {status:'completed',state:next};
 }
 // Inject the bus arbiter. Both transfers and queue consumption are one detached transaction.
 function consume(s,register,expectedRevision,arbiter){
  validate(s);if(expectedRevision!==s.revision)throw new Error('Estado obsoleto');
  if(['AX','BX','CX','DX'].indexOf(register)===-1)throw new Error('Registro inválido');
  if(!s.io.keyboard.count)return {status:'waiting'};
  var wiring={segments:{externalData:{widthBits:8,domain:'data'},internalData:{widthBits:8,domain:'data'}},ports:[
   {name:'KBD',segment:'externalData',path:['ram','bytes',224+s.io.keyboard.head],widthBits:8},
   {name:'MDR_IN',segment:'externalData',path:['cpu','mdr'],widthBits:8},
   {name:'MDR',segment:'internalData',path:['cpu','mdr'],widthBits:8},
   {name:register,segment:'internalData',path:['cpu','registers',register],widthBits:8}]};
  var first=arbiter.transfer(s,wiring,{En_KBD:true,Ld_MDR_IN:true},s.revision);
  if(first.status!=='completed')return first;
  var signals={En_MDR:true};signals['Ld_'+register]=true;
  var second=arbiter.transfer(first.state,wiring,signals,first.state.revision);
  if(second.status!=='completed')return second;
  var k=second.state.io.keyboard;k.head=(k.head+1)%8;k.count--;
  return {status:'completed',state:second.state,events:[first.event,second.event]};
 }
 function view(s){validate(s);var k=s.io.keyboard;return {head:k.head,tail:k.tail,count:k.count,
  full:k.count===8,empty:k.count===0,text:Array.from({length:k.count},function(_,i){return String.fromCharCode(s.ram.bytes[224+(k.head+i)%8]);}).join('')};}
 return {resetMetadata:resetMetadata,enqueue:enqueue,consume:consume,view:view,validate:validate};
}());
if(typeof module!=='undefined'&&module.exports)module.exports=KeyboardQueue;


// ===== io/lcd.js =====
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

  if (!bus || bus.level !== "driven" ||
      !Array.isArray(bus.drivers) || bus.drivers.length !== 1 ||
      typeof bus.drivers[0] !== "string" || !bus.drivers[0].length ||
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


// ===== assembler/parser.js =====
'use strict';
var AsmParser=(function(){
 var registers=['AX','BX','CX','DX'];
 var binary={ADD:0x30,SUB:0x31,AND:0x40,OR:0x41,XOR:0x42};
 var unary={INC:0x32,DEC:0x33,NOT:0x43};
 var jumps={JMP:0x50,JZ:0x51,JNZ:0x52};
 function own(obj,key){return Object.prototype.hasOwnProperty.call(obj,key);}
 function number(token){
  if(/^\d+$/.test(token))return Number(token);
  if(/^0x[0-9a-f]+$/i.test(token))return parseInt(token.slice(2),16);
  if(/^[0-9][0-9a-f]*h$/i.test(token))return parseInt(token.slice(0,-1),16);
  throw new Error('Número inválido: '+token);
 }
 function bounded(n,max,label){if(!Number.isSafeInteger(n)||n<0||n>max)throw new Error(label+' fuera de rango 0..'+max);return n;}
 function reg(token){var r=registers.indexOf(token.toUpperCase());if(r<0)throw new Error('Registro inválido: '+token);return r;}
 function assemble(source,origin){
  var errors=[],labels=Object.create(null),instructions=[],bytes=[];origin=origin===undefined?0:origin;
  function error(line,message){errors.push({line:line,message:message});}
  try{bounded(origin,479,'Origen');if(typeof source!=='string')throw new Error('El código debe ser texto');}
  catch(e){return {ok:false,bytes:[],instructions:[],labels:{},errors:[{line:0,message:e.message}]};}
  var pc=origin;
  source.split(/\r?\n/).forEach(function(raw,index){
   var line=index+1,text=raw.split(';')[0].trim(),match;
   if(!text)return;
   while((match=/^([A-Za-z_][A-Za-z0-9_]*):/.exec(text))){
    var label=match[1].toUpperCase();
    if(own(labels,label))error(line,'Etiqueta duplicada: '+label);
    else if(registers.indexOf(label)!==-1||label==='KBD'||label==='LCD')error(line,'Etiqueta reservada: '+label);
    else labels[label]=pc;
    text=text.slice(match[0].length).trim();
   }
   if(!text)return;
   var parts=/^(\S+)(?:\s+(.*))?$/.exec(text);
   var operands=parts[2]===undefined?[]:parts[2].split(',').map(function(p){return p.trim();});
   instructions.push({line:line,address:pc,mnemonic:parts[1].toUpperCase(),operands:operands});pc+=4;
   if(pc>480)error(line,'Programa invade la página reservada de E/S');
  });
  var starts=instructions.map(function(i){return i.address;});
  function address(token){var key=token.toUpperCase();
   if(key==='KBD')return 480;if(key==='LCD')return 488;
   if(own(labels,key))return bounded(labels[key],511,'Dirección');
   if(/^[A-Za-z_]/.test(token))throw new Error('Etiqueta ausente: '+token);
   return bounded(number(token),511,'Dirección');
  }
  function memory(token,write){
   var match=/^\[\s*([^\[\]]+?)\s*\]$/.exec(token);if(!match)throw new Error('Se esperaba [dirección]');
   var a=address(match[1].trim());if(a>=496)throw new Error('Dirección reservada');
   if(write&&a>=480&&a<488)throw new Error('STORE sobre KBD no permitido');return a;
  }
  instructions.forEach(function(ins){
   try{
    var op=ins.mnemonic,p=ins.operands,out,a;
    function count(n){if(p.length!==n||p.some(function(x){return !x;}))throw new Error(op+' requiere '+n+' operandos');}
    function encoded(code,r,addr){return [code,r,addr%256,Math.floor(addr/256)];}
    if(op==='HALT'||op==='NOP'){count(0);out=[op==='HALT'?0:1,0,0,0];}
    else if(op==='MOV'||op==='CMP'){
     count(2);var rd=reg(p[0]),rs=registers.indexOf(p[1].toUpperCase());
     out=[op==='MOV'?(rs<0?0x10:0x11):(rs<0?0x35:0x34),rd,rs<0?bounded(number(p[1]),255,'Inmediato'):rs,0];
    }else if(own(binary,op)){count(2);out=[binary[op],reg(p[0]),reg(p[1]),0];}
    else if(own(unary,op)){count(1);out=[unary[op],reg(p[0]),0,0];}
    else if(op==='LOAD'){count(2);out=encoded(0x20,reg(p[0]),memory(p[1],false));}
    else if(op==='STORE'){count(2);out=encoded(0x21,reg(p[1]),memory(p[0],true));}
    else if(own(jumps,op)){count(1);a=address(p[0]);if(starts.indexOf(a)===-1)throw new Error('Salto no apunta al inicio de una instrucción');out=encoded(jumps[op],0,a);}
    else if(op==='IN'){count(2);if(!/^\[\s*KBD\s*\]$/i.test(p[1]))throw new Error('IN requiere rd, [KBD]');out=[0x60,reg(p[0]),0,0];}
    else if(op==='OUT'){count(2);if(!/^\[\s*LCD\s*\]$/i.test(p[0]))throw new Error('OUT requiere [LCD], rs');out=[0x61,reg(p[1]),0,0];}
    else throw new Error('Instrucción desconocida: '+op);
    ins.bytes=out;bytes.push.apply(bytes,out);
   }catch(e){error(ins.line,e.message);}
  });
  if(errors.length)return {ok:false,bytes:[],instructions:[],labels:{},errors:errors};
  return {ok:true,origin:origin,bytes:bytes,instructions:instructions,labels:Object.assign({},labels),errors:[]};
 }
 return {assemble:assemble};
}());
if(typeof module!=='undefined'&&module.exports)module.exports=AsmParser;


// ===== core/machine.js =====
/* Integration coordinator, Marcelo: #5 #8 #11 #17 #20 #23 #26 #29 #32 #35.
 * Pure JSON motor. One step commits at most one physical bus transfer.
 * Existing team modules retain their authorship in the merged Git history.
 */
var P2Machine = (function () {
  'use strict';
  var SIGNALS = microWordSignals.concat(['En_L1I','Ld_L1I','En_L1D','Ld_L1D',
    'En_L2','Ld_L2','En_SWAP','Ld_SWAP','En_MMU','Ld_MMU']);
  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function fail(code, message) { var e = new Error(message || code); e.code = code; throw e; }
  function byte(v) { if (!Number.isInteger(v) || v < 0 || v > 255) fail('OUT_OF_RANGE'); }
  function signals(active) { var s={}; SIGNALS.forEach(function(k){s[k]=false;});
    Object.keys(active||{}).forEach(function(k){if(!Object.prototype.hasOwnProperty.call(s,k)||typeof active[k]!=='boolean')fail('INVALID_SIGNALS',k);s[k]=active[k];});
    s.Clock=true;if(s.Read&&s.Write||s.Mem_R&&s.Mem_W||s.IO&&(s.Mem_R||s.Mem_W))fail('INVALID_CONTROL');return s; }
  function buses() { var b={}; [['internalAddress',9,'virtual'],['externalAddress',8,'physical'],
    ['internalData',8,'data'],['externalData',8,'data'],['internalControl',40,'control'],['externalControl',40,'control']]
    .forEach(function(x){b[x[0]]={widthBits:x[1],domain:x[2],level:'Z',value:null,drivers:[],receivers:[]};});return b; }
  function profile(approved) { return {id:'team-integration-40-v1',status:approved===true?'ready':'proposal',pendingIssues:approved===true?[]:[3],
    sizes:{ramBytes:256,virtualBytes:512,pageBytes:32,frameCount:8,pageCount:16,lineBytes:8,l2Lines:4},
    widths:{register:8,pc:9,mar:9,mdr:8,irMaxBytes:4,internalControl:40,externalControl:40},
    ioMap:{keyboard:{va:480,pa:224,length:8},lcd:{va:488,pa:232,length:8}},pinnedMappings:[{vpn:15,pfn:7}],
    cachePolicy:{addressing:'physical',l2Replacement:'FIFO',write:'write-through',allocate:'no-write-allocate'},
    controlEncoding:SIGNALS.slice()}; }
  function create(p) {
    if(!p||p.id!=='team-integration-40-v1')fail('INVALID_PROFILE');
    var cpu=CpuAlu.reset(); cpu.alu.addressResult=0;
    cpu.control={phase:'idle',microStep:0,word:null,signals:signals({}),machine:{phase:'fetch',stage:'address',instructionStart:0,execIndex:0,sequence:0}};
    SIGNALS.forEach(function(k){cpu.control.signals[k]=false;});
    var stats=cacheMetricsCreate();stats.pageFaults=0;stats.committedMicroSteps=0;
    return {schemaVersion:1,profile:copy(p),revision:0,cpu:cpu,buses:buses(),ram:PhysicalRam.reset(),
      mmu:{pages:mmuCreatePageTable(p.pinnedMappings).pages,fifo:[],fault:null},swap:swapCreate(),
      caches:{l1i:InstructionCache.reset(),l1d:l1dCreate(),l2:UnifiedL2.reset()},
      io:{keyboard:KeyboardQueue.resetMetadata(),lcd:{basePa:232,length:8,cursor:0}},
      clock:{cycle:0,microStep:0,phase:'idle'},execution:{mode:'idle',pendingRequest:null,lastError:null,memoryReceipt:null},
      metrics:stats,lastEvent:null,program:{source:'',starts:[],sourceMap:[],origin:0}};
  }
  function check(s) {
    var v=mmuValidateIoMap(s); if(!v.ok)fail(v.error.code,v.error.message);
    if(!Number.isSafeInteger(s.revision)||s.revision<0||s.revision>=Number.MAX_SAFE_INTEGER)fail('INVALID_STATE');
    if(s.profile.id!=='team-integration-40-v1'||s.profile.ioMap.keyboard.va!==480||s.profile.ioMap.keyboard.pa!==224||s.profile.ioMap.lcd.va!==488||s.profile.ioMap.lcd.pa!==232)fail('INVALID_PROFILE','El coordinador integrado usa el mapa de equipo 224/232.');
    [s.clock.cycle,s.clock.microStep,s.metrics.committedMicroSteps].forEach(function(v){if(!Number.isSafeInteger(v)||v<0||v>=Number.MAX_SAFE_INTEGER)fail('INVALID_COUNTER');});
    if(s.lastEvent&&(s.lastEvent.revisionAfter!==s.revision||!Number.isSafeInteger(s.lastEvent.id)||s.lastEvent.id<1))fail('INVALID_EVENT');
    PageFifo.validate({revision:s.revision,frames:s.ram.frames,queue:s.mmu.fifo});
    CpuAlu.validate(s.cpu);UnifiedL2.validate(s.caches.l2);InstructionCache.validate(s.caches.l1i);l1dValidate(s.caches.l1d);
    swapValidate(s.swap);
  }
  function set(s,path,value){var t=s;path.slice(0,-1).forEach(function(k){t=t[k];});t[path[path.length-1]]=value;}
  function changes(a,b,path,out){if(JSON.stringify(a)===JSON.stringify(b))return;
    if(a!==null&&b!==null&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)){
      var keys=Array.from(new Set(Object.keys(a).concat(Object.keys(b))));keys.forEach(function(k){if(!path&&k==='lastEvent')return;changes(a[k],b[k],path?path+'.'+k:k,out);});
    }else {var change={path:path,before:a===undefined?null:a,after:b===undefined?null:b};if(b===undefined)change.deleted=true;out.push(change);}}
  function port(name,segment,path,width){return {name:name,segment:segment,path:path,widthBits:width};}
  function tx(s,ctx,ports,active,pa){
    var spec={segments:{internalAddress:{widthBits:9,domain:'virtual'},externalAddress:{widthBits:8,domain:'physical'},
      internalData:{widthBits:8,domain:'data'},externalData:{widthBits:8,domain:'data'}},ports:ports.slice()};
    if(pa!==null&&pa!==undefined){s.cpu.alu.addressResult=pa;spec.ports.push(port('MMU','externalAddress',['cpu','alu','addressResult'],8));active.En_MMU=true;ctx.pa=pa;}
    ctx.signals=signals(active);var en={};spec.ports.forEach(function(p){['En_','Ld_'].forEach(function(prefix){en[prefix+p.name]=ctx.signals[prefix+p.name];});});
    var r=BusArbiter.transfer(s,spec,en,s.revision);if(r.status==='rejected')fail(r.error.code,r.error.message);
    r.event.captures.forEach(function(c){set(s,c.path,c.after);});s.buses=r.state.buses;ctx.transferred=true;
  }
  function addressTo(s,ctx,value,destination){
    if(!Number.isInteger(value)||value<0||value>511)fail('OUT_OF_RANGE');s.cpu.alu.addressResult=value;
    var active={En_ALU:true};active['Ld_'+destination]=true;
    tx(s,ctx,[port('ALU','internalAddress',['cpu','alu','addressResult'],9),
      port(destination,'internalAddress',['cpu',destination.toLowerCase()],9)],active,null);
  }
  function transferRegister(s,ctx,destination,source){
    var sourceName,path;
    if(source.kind==='register'){sourceName=source.name;path=sourceName==='MDR'?['cpu','mdr']:['cpu','registers',sourceName];}
    else if(source.kind==='immediate'){sourceName='IR';path=['cpu','ir','bytes',2];if(s.cpu.ir.bytes[2]!==source.value)fail('INVALID_OPERAND');}
    else if(source.kind==='aluResult'){sourceName='ALU';path=['cpu','alu','result'];}else fail('INVALID_OPERAND');
    var destPath=destination==='MDR'?['cpu','mdr']:['cpu','registers',destination];
    var ports=[port(sourceName,'internalData',path,8)];
    // A loopback capture uses one endpoint, not two ports with duplicate names.
    if(sourceName===destination){var active={};active['En_'+sourceName]=true;active['Ld_'+sourceName]=true;tx(s,ctx,ports,active,null);}
    else {ports.push(port(destination,'internalData',destPath,8));var sig={};sig['En_'+sourceName]=true;sig['Ld_'+destination]=true;tx(s,ctx,ports,sig,null);}
  }
  function commit(before,next,ctx,id,status,value){
    var sig=ctx.signals||signals({});if(!ctx.transferred)next.buses=buses();
    var word=0;SIGNALS.forEach(function(k,i){if(sig[k])word+=Math.pow(2,i);});
    ['internalControl','externalControl'].forEach(function(k){next.buses[k]={widthBits:40,domain:'control',level:'driven',value:word,drivers:['UC'],receivers:[]};});
    next.revision=before.revision+1;next.clock={cycle:before.clock.cycle+1,microStep:before.clock.microStep+1,phase:ctx.kind};
    next.cpu.control.phase=ctx.kind;next.cpu.control.microStep=next.clock.microStep;next.cpu.control.signals=sig;next.cpu.control.word=word;
    next.metrics.committedMicroSteps=before.metrics.committedMicroSteps+1;
    var delta=[];changes(before,next,'',delta);
    var event={schemaVersion:1,id:before.lastEvent?before.lastEvent.id+1:1,requestId:id,
      revisionBefore:before.revision,revisionAfter:next.revision,cycle:next.clock.cycle,microStep:next.clock.microStep,
      phase:ctx.kind,kind:ctx.kind,signals:copy(sig),controlWord:word,segments:Object.keys(next.buses).map(function(k){var b=next.buses[k];return {name:k,widthBits:b.widthBits,level:b.level,value:b.value,driver:b.drivers.length?b.drivers[0]:null,receivers:b.receivers.slice()};}),
      va:ctx.va===undefined?null:ctx.va,pa:ctx.pa===undefined?null:ctx.pa,bytes:ctx.bytes||[],changes:delta,result:'committed'};
    if(ctx.lookup)event.lookup=ctx.lookup;next.lastEvent=copy(event);
    return {status:status||'completed',requestId:id,state:next,events:[event],value:value===undefined?null:value};
  }
  function lookup(s,m,level,outcome,ctx){var r=cacheMetricsRecord(s.metrics,m.accounting,{requestId:m.requestId,lookupId:level,level:level,outcome:outcome});
    s.metrics=r.metrics;m.accounting=r.accounting;ctx.lookup={level:level,outcome:outcome,counted:r.counted};}
  function startMemory(s,kind,va,io,endpoint,id){
    if(s.execution.pendingRequest!==null)fail('BUSY');
    s.execution.pendingRequest={requestId:id,kind:kind,va:va,io:io,endpoint:endpoint,stage:'translate',
      accounting:cacheMetricsBeginRequest(id),index:0,buffer:Array(8).fill(0)};s.execution.memoryReceipt=null;
  }
  function finishMemory(s,m){s.execution.memoryReceipt={requestId:m.requestId,value:m.kind==='write'?null:s.cpu.mdr};s.execution.pendingRequest=null;}
  function cachePort(level,index){if(level==='l2')return ['caches','l2','lines',index];return ['caches',level];}
  function memoryTick(s,ctx){
    var m=s.execution.pendingRequest;if(!m)fail('UNKNOWN_REQUEST');ctx.va=m.va;ctx.kind='memory-'+m.stage;
    if(m.stage==='translate'){
      var tr=mmuResolveAccess(s,{va:m.va,kind:m.kind,io:m.io,endpoint:m.endpoint});if(!tr.ok)fail(tr.error.code,tr.error.message);
      if(tr.status==='pageFault'){
        var d=PageFifo.select({revision:s.revision,frames:s.ram.frames,queue:s.mmu.fifo},tr.vpn);
        m.vpn=tr.vpn;m.pfn=d.pfn;m.victim=d.victim;m.victimDirty=d.victim!==null&&s.mmu.pages[d.victim].dirty;m.index=0;m.stage=m.victimDirty?'save-page':'invalidate';
        s.mmu.fault={requestId:m.requestId,vpn:m.vpn,victimPfn:m.pfn,stage:m.stage,transferredBytes:0};s.metrics.pageFaults++;ctx.kind='page-fault';return false;
      }
      m.translation=tr;m.pa=tr.pa;m.level=m.kind==='fetch'?'l1i':'l1d';m.stage=!tr.access.cacheable?'io':m.kind==='write'?'write-l1':'lookup-l1';return false;
    }
    if(m.stage==='save-page'){
      var from=m.pfn*32+m.index;tx(s,ctx,[port('RAM','externalData',['ram','bytes',from],8),port('SWAP','externalData',['swap','pages',m.victim,m.index],8)],{En_RAM:true,Ld_SWAP:true,Read:true,Mem_R:true},from);
      ctx.bytes=[s.ram.bytes[from]];m.index++;s.mmu.fault.transferredBytes=m.index;if(m.index===32){m.index=0;m.stage='invalidate';}return false;
    }
    if(m.stage==='invalidate'){
      var inv=CacheCoherence.invalidate(s.caches,m.pfn*32,32);if(inv.status!=='completed')fail('CACHE_WRITEBACK_REQUIRED');s.caches=inv.caches;
      if(m.victim!==null)s.mmu.pages[m.victim]={vpn:m.victim,present:false,pfn:null,dirty:false,referenced:false,pinned:false};
      s.ram.frames[m.pfn].vpn=null;s.mmu.fifo=s.mmu.fifo.filter(function(p){return p!==m.pfn;});m.stage='load-page';m.index=0;s.mmu.fault.stage='load-page';s.mmu.fault.transferredBytes=0;return false;
    }
    if(m.stage==='load-page'){
      var pa=m.pfn*32+m.index;tx(s,ctx,[port('SWAP','externalData',['swap','pages',m.vpn,m.index],8),port('RAM','externalData',['ram','bytes',pa],8)],{En_SWAP:true,Ld_RAM:true,Write:true,Mem_W:true},pa);
      ctx.bytes=[s.ram.bytes[pa]];m.index++;s.mmu.fault.transferredBytes=m.index;if(m.index===32)m.stage='install-page';return false;
    }
    if(m.stage==='install-page'){
      var fs={revision:s.revision,frames:s.ram.frames,queue:s.mmu.fifo};var decision=PageFifo.select(fs,m.vpn);if(decision.pfn!==m.pfn)fail('STALE_REPLACEMENT');
      var installed=PageFifo.commit(fs,decision);s.ram.frames=installed.frames;s.mmu.fifo=installed.queue;
      s.mmu.pages[m.vpn]={vpn:m.vpn,present:true,pfn:m.pfn,dirty:false,referenced:false,pinned:false};s.mmu.fault=null;m.stage='translate';return false;
    }
    ctx.pa=m.pa;
    if(m.stage==='io'){
      if(m.kind==='read'){
        if(m.consume&&s.io.keyboard.count===0)return 'waiting';
        var k=s.io.keyboard;if(m.consume)m.pa=k.basePa+k.head;
        var inputSignals={Ld_MDR:true,Read:true,IO:true};inputSignals['En_'+m.endpoint]=true;
        tx(s,ctx,[port(m.endpoint,'externalData',['ram','bytes',m.pa],8),port('MDR','externalData',['cpu','mdr'],8)],inputSignals,m.pa);
        if(m.consume){k.head=(k.head+1)%8;k.count--;}
      }else{
        var lcd=s.io.lcd,proposal=null;if(m.advanceCursor){m.pa=lcd.basePa+lcd.cursor;
          var trf={pa:m.pa,signals:{Ld_LCD:true,Write:true,Read:false,IO:true,Clock:true},bus:{level:'driven',value:s.cpu.mdr,drivers:['MDR'],receivers:['LCD']}};
          proposal=lcdReceive(s,trf);}
        tx(s,ctx,[port('MDR','externalData',['cpu','mdr'],8),port('LCD','externalData',['ram','bytes',m.pa],8)],{En_MDR:true,Ld_LCD:true,Write:true,IO:true},m.pa);
        if(proposal)s.io.lcd.cursor=proposal.state.io.lcd.cursor;
      }
      ctx.bytes=[s.cpu.mdr];finishMemory(s,m);return true;
    }
    if(m.stage==='lookup-l1'){
      var result=m.level==='l1i'?InstructionCache.lookup(s.caches.l1i,m.pa,'fetch'):l1dRead(s.caches.l1d,m.translation);
      lookup(s,m,m.level,result.status,ctx);m.stage=result.status==='hit'?'deliver':'lookup-l2';return false;
    }
    if(m.stage==='lookup-l2'){
      var l2=UnifiedL2.lookup(s.caches.l2,m.pa);lookup(s,m,'l2',l2.status,ctx);m.basePa=Math.floor(m.pa/8)*8;m.index=0;
      if(l2.status==='hit'){m.slot=l2.index;m.stage='fill-l1';s.caches[m.level].valid=false;s.caches[m.level].tag=null;}
      else {m.fill=UnifiedL2.begin(s.caches.l2,m.basePa);m.stage='fill-l2';}return false;
    }
    if(m.stage==='fill-l2'){
      var fillPa=m.basePa+m.index;tx(s,ctx,[port('RAM','externalData',['ram','bytes',fillPa],8),port('L2','externalData',['execution','pendingRequest','buffer',m.index],8)],{En_RAM:true,Ld_L2:true,Read:true,Mem_R:true},fillPa);
      var accepted=UnifiedL2.accept(s.caches.l2,m.fill,{pa:fillPa,value:m.buffer[m.index]});ctx.bytes=[m.buffer[m.index]];m.index++;
      if(accepted.status==='completed'){s.caches.l2=accepted.cache;m.slot=accepted.index;m.index=0;m.stage='fill-l1';s.caches[m.level].valid=false;s.caches[m.level].tag=null;delete m.fill;}
      else m.fill=accepted.fill;return false;
    }
    if(m.stage==='fill-l1'){
      var target=m.level==='l1i'?'L1I':'L1D',sig={En_L2:true,Read:true};sig['Ld_'+target]=true;
      tx(s,ctx,[port('L2','externalData',cachePort('l2',m.slot).concat(['bytes',m.index]),8),port(target,'externalData',cachePort(m.level).concat(['bytes',m.index]),8)],sig,m.basePa+m.index);
      ctx.bytes=[s.caches[m.level].bytes[m.index]];m.index++;if(m.index===8){s.caches[m.level].valid=true;s.caches[m.level].tag=m.basePa/8;if(m.level==='l1i')s.caches.l1i.generation++;m.stage='deliver';}return false;
    }
    if(m.stage==='deliver'){
      var name=m.level==='l1i'?'L1I':'L1D',sig={Ld_MDR:true,Read:true};sig['En_'+name]=true;
      tx(s,ctx,[port(name,'externalData',cachePort(m.level).concat(['bytes',m.pa%8]),8),port('MDR','externalData',['cpu','mdr'],8)],sig,m.pa);
      s.mmu.pages[m.translation.vpn].referenced=true;ctx.bytes=[s.cpu.mdr];finishMemory(s,m);return true;
    }
    if(m.stage==='write-l1'){var wr=l1dPlanWrite(s.caches.l1d,m.translation,s.cpu.mdr);lookup(s,m,'l1d',wr.status,ctx);m.stage='write-l2';return false;}
    if(m.stage==='write-l2'){var hit=UnifiedL2.lookup(s.caches.l2,m.pa);lookup(s,m,'l2',hit.status,ctx);m.slot=hit.status==='hit'?hit.index:null;m.stage='write-ram';return false;}
    if(m.stage==='write-ram'){
      tx(s,ctx,[port('MDR','externalData',['cpu','mdr'],8),port('RAM','externalData',['ram','bytes',m.pa],8)],{En_MDR:true,Ld_RAM:true,Write:true,Mem_W:true},m.pa);
      var pg=s.mmu.pages[m.translation.vpn];pg.dirty=true;pg.referenced=true;
      if(s.caches.l1i.valid&&s.caches.l1i.tag===Math.floor(m.pa/8))s.caches.l1i=InstructionCache.invalidate(s.caches.l1i);
      m.stage='write-copy-l1';return false;
    }
    if(m.stage==='write-copy-l1'){
      if(s.caches.l1d.valid&&s.caches.l1d.tag===Math.floor(m.pa/8))tx(s,ctx,[port('MDR','externalData',['cpu','mdr'],8),port('L1D','externalData',['caches','l1d','bytes',m.pa%8],8)],{En_MDR:true,Ld_L1D:true,Write:true},m.pa);
      m.stage='write-copy-l2';return false;
    }
    if(m.stage==='write-copy-l2'){
      if(m.slot!==null)tx(s,ctx,[port('MDR','externalData',['cpu','mdr'],8),port('L2','externalData',cachePort('l2',m.slot).concat(['bytes',m.pa%8]),8)],{En_MDR:true,Ld_L2:true,Write:true},m.pa);
      finishMemory(s,m);return true;
    }
    fail('INVALID_STAGE',m.stage);
  }
  function cpuTick(s,ctx){
    var m=s.cpu.control.machine;ctx.kind='cpu-'+m.phase+'-'+m.stage;
    if(m.phase==='fetch'){
      if(m.stage==='address'){
        if(s.cpu.ir.loadedBytes===0){if(s.program.starts.indexOf(s.cpu.pc)===-1)fail('INVALID_INSTRUCTION_BOUNDARY');m.instructionStart=s.cpu.pc;}
        ctx.va=s.cpu.pc;tx(s,ctx,[port('PC','internalAddress',['cpu','pc'],9),port('MAR','internalAddress',['cpu','mar'],9)],{En_PC:true,Ld_MAR:true},null);m.stage='request';
      }else if(m.stage==='request'){startMemory(s,'fetch',s.cpu.mar,false,null,'fetch-'+m.sequence+'-'+s.cpu.ir.loadedBytes);m.stage='wait';}
      else if(m.stage==='wait'){var done=memoryTick(s,ctx);if(done==='waiting')return 'waiting';if(done===true)m.stage='ir';}
      else if(m.stage==='ir'){
        tx(s,ctx,[port('MDR','internalData',['cpu','mdr'],8),port('IR','internalData',['cpu','ir','bytes',s.cpu.ir.loadedBytes],8)],{En_MDR:true,Ld_IR:true},null);s.cpu.ir.loadedBytes++;m.stage='increment';
      }else if(m.stage==='increment'){addressTo(s,ctx,s.cpu.pc+1,'PC');m.stage=s.cpu.ir.loadedBytes===4?'decode':'address';}
      else if(m.stage==='decode'){var d=cpuDecodeInstruction(s.cpu.ir.bytes);if(!d.ok)fail(d.error.code,d.error.message);s.cpu.ir.decoded=d.instruction;m.steps=cpuBuildExecutionPlan(s.cpu.ir.bytes).steps;m.execIndex=0;m.phase='execute';m.stage='operation';}
      else fail('INVALID_STAGE');return false;
    }
    var op=m.steps[m.execIndex];if(!op)fail('INVALID_STAGE');ctx.kind='cpu-'+op.operation.toLowerCase().replace(/_/g,'-');var p=op.parameters;
    switch(op.operation){
      case 'TRANSFER_TO_REGISTER':transferRegister(s,ctx,p.destination,p.source);break;
      case 'CAPTURE_ALU_A':case 'CAPTURE_ALU_B':{
        var source=p.source,sourceName,path;
        if(source.kind==='register'){sourceName=source.name;path=['cpu','registers',sourceName];}
        else {sourceName='IR';path=['cpu','ir','bytes',2];if(source.value===1&&(s.cpu.ir.decoded.mnemonic==='INC'||s.cpu.ir.decoded.mnemonic==='DEC')){sourceName='ALU';s.cpu.alu.result=1;path=['cpu','alu','result'];}}
        var target=op.operation==='CAPTURE_ALU_A'?'a':'b';
        // INC/DEC select the ALU's hardwired constant-one input, not a bus load.
        if(sourceName==='ALU'){s.cpu.alu[target]=1;}
        else tx(s,ctx,[port(sourceName,'internalData',path,8),port('ALU','internalData',['cpu','alu',target],8)],(function(){var a={Ld_ALU:true};a['En_'+sourceName]=true;return a;}()),null);
        break;}
      case 'EVALUATE_ALU':{var alu=CpuAlu.evaluate(p.mnemonic,s.cpu.alu.a,s.cpu.alu.b,s.cpu.flags);s.cpu.alu.result=alu.result;s.cpu.alu.operation=p.mnemonic;m.flags=alu.flags;break;}
      case 'COMMIT_FLAGS':s.cpu.flags=copy(m.flags);break;
      case 'PREPARE_ADDRESS':addressTo(s,ctx,p.address,'MAR');break;
      case 'REQUEST_READ':startMemory(s,'read',s.cpu.mar,s.cpu.mar>=480,s.cpu.mar>=480?(s.cpu.mar<488?'KBD':'LCD'):null,'data-'+m.sequence);break;
      case 'REQUEST_WRITE':startMemory(s,'write',s.cpu.mar,s.cpu.mar>=480,s.cpu.mar>=480?(s.cpu.mar<488?'KBD':'LCD'):null,'data-'+m.sequence);break;
      case 'REQUEST_INPUT':startMemory(s,'read',s.profile.ioMap.keyboard.va,true,'KBD','io-'+m.sequence);s.execution.pendingRequest.consume=true;break;
      case 'REQUEST_OUTPUT':startMemory(s,'write',s.profile.ioMap.lcd.va,true,'LCD','io-'+m.sequence);s.execution.pendingRequest.advanceCursor=true;break;
      case 'WAIT_READ':case 'WAIT_WRITE':case 'WAIT_INPUT':case 'WAIT_OUTPUT':{var done=memoryTick(s,ctx);if(done==='waiting')return 'waiting';if(done!==true)return false;break;}
      case 'CAPTURE_RESPONSE_IN_MDR':transferRegister(s,ctx,'MDR',{kind:'register',name:'MDR'});break;
      case 'RESOLVE_BRANCH':{
        var take=p.condition==='always'||p.condition==='ZF_SET'&&s.cpu.flags.ZF||p.condition==='ZF_CLEAR'&&!s.cpu.flags.ZF;
        if(take){if(s.program.starts.indexOf(p.address)===-1)fail('INVALID_INSTRUCTION_BOUNDARY');addressTo(s,ctx,p.address,'PC');}break;}
      case 'HALT':addressTo(s,ctx,m.instructionStart,'PC');s.execution.mode='halted';break;
      case 'ADVANCE_PC':break;
      default:fail('INVALID_MICROCODE',op.operation);
    }
    m.execIndex++;
    if(m.execIndex===m.steps.length&&s.execution.mode!=='halted'){
      s.cpu.ir={bytes:[0,0,0,0],loadedBytes:0,decoded:null};m.phase='fetch';m.stage='address';m.sequence++;delete m.steps;delete m.flags;
    }
    return false;
  }
  function step(state,request){
    try{
      var before=copy(state);check(before);
      if(!request||typeof request.requestId!=='string'||!request.requestId.length)fail('INVALID_REQUEST');
      if(before.lastEvent&&before.lastEvent.requestId===request.requestId){if(request.expectedRevision!==before.lastEvent.revisionBefore)fail('REQUEST_ID_REUSE');return {status:'completed',requestId:request.requestId,state:before,events:[],value:null,replayed:true};}
      if(request.expectedRevision!==before.revision)fail('STALE_REVISION');
      if(before.profile.status!=='ready'||before.profile.pendingIssues.length)fail('INVALID_PROFILE');
      if(before.execution.mode==='halted')fail('HALTED');
      var next=copy(before),ctx={};var waiting=cpuTick(next,ctx);
      if(waiting==='waiting')return {status:'pending',requestId:request.requestId,state:before,events:[],reason:'keyboard-empty'};
      return commit(before,next,ctx,request.requestId);
    }catch(e){return {status:'rejected',requestId:request?request.requestId:null,error:{code:e.code||'INVALID_STATE',message:e.message,details:{}}};}
  }
  function load(state,source,origin){
    var parsed=AsmParser.assemble(source,origin);if(!parsed.ok)return {status:'rejected',error:{code:'ASSEMBLY_ERROR',message:'Código inválido',details:parsed.errors}};
    if(!parsed.instructions.length)return {status:'rejected',error:{code:'EMPTY_PROGRAM',message:'Programa vacío'}};
    var next=create(state.profile),image=Array(512).fill(0);parsed.bytes.forEach(function(b,i){image[parsed.origin+i]=b;});next.swap=swapCreate(image);
    next.cpu.pc=parsed.origin;next.program={source:source,origin:parsed.origin,starts:parsed.instructions.map(function(i){return i.address;}),sourceMap:parsed.instructions.map(function(i){return {line:i.line,address:i.address,bytes:i.bytes.slice()};})};
    var ctx={kind:'program-load'};return commit(state,next,ctx,'load-'+state.revision);
  }
  function type(state,text){
    try{check(state);if(typeof text!=='string'||!text.length||text.length+state.io.keyboard.count>8)fail('KBD_FULL');
      for(var i=0;i<text.length;i++)if(text.charCodeAt(i)<32||text.charCodeAt(i)>126)fail('INVALID_CHARACTER');
      var current=copy(state),events=[];
      for(var j=0;j<text.length;j++){
        var before=copy(current),ctx={kind:'keyboard-input'};current.io.keyboard.inputValue=text.charCodeAt(j);var k=current.io.keyboard,pa=k.basePa+k.tail;
        tx(current,ctx,[port('KBD','externalData',['io','keyboard','inputValue'],8),port('RAM','externalData',['ram','bytes',pa],8)],{En_KBD:true,Ld_RAM:true,Write:true,IO:true},pa);
        k.tail=(k.tail+1)%8;k.count++;delete k.inputValue;var result=commit(before,current,ctx,'kbd-'+before.revision);current=result.state;events.push(result.events[0]);
      }
      return {status:'completed',state:current,events:events,value:null};
    }catch(e){return {status:'rejected',error:{code:e.code||'INVALID_STATE',message:e.message}};}
  }
  function run(state,limit){var current=copy(state),events=[],r;if(!Number.isInteger(limit)||limit<1||limit>50000)fail('INVALID_BATCH');
    for(var i=0;i<limit;i++){r=step(current,{requestId:'step-'+current.revision,expectedRevision:current.revision});if(r.status==='rejected')return r;current=r.state;events=events.concat(r.events);if(r.status==='pending'||current.execution.mode==='halted')break;}
    return {status:r.status,state:current,events:events,value:null};}
  function editPage(state,vpn,patch){
    try{check(state);if(state.execution.pendingRequest||state.execution.mode==='running')fail('BUSY');
      if(!Number.isInteger(vpn)||vpn<0||vpn>15||!patch||Object.keys(patch).some(function(k){return k!=='referenced'&&k!=='dirty';}))fail('INVALID_OPERAND');
      var page=state.mmu.pages[vpn];if(!page.present||page.pinned)fail('IO_PROTECTED');
      if(patch.referenced!==undefined&&typeof patch.referenced!=='boolean'||patch.dirty!==undefined&&patch.dirty!==true)fail('INVALID_OPERAND','Dirty solo puede marcarse; limpiarlo requiere guardar en Swap.');
      var next=copy(state);Object.keys(patch).forEach(function(k){next.mmu.pages[vpn][k]=patch[k];});
      return commit(state,next,{kind:'page-table-edit'},'edit-'+state.revision);
    }catch(e){return {status:'rejected',error:{code:e.code||'INVALID_STATE',message:e.message}};}
  }
  function editRam(state,pa,value){
    try {
      check(state);
      var phase=state.cpu.control.machine;
      if(state.execution.pendingRequest||state.execution.mode==='running'||
        phase.phase!=='fetch'||phase.stage!=='address'||state.cpu.ir.loadedBytes!==0)
        fail('BUSY','Pausa al inicio de una instrucción para editar RAM.');
      if(!Number.isInteger(pa)||pa<0||pa>255)fail('OUT_OF_RANGE');
      byte(value);
      if(PhysicalRam.region(pa)!=='ram')fail('IO_PROTECTED');
      var vpn=state.ram.frames[Math.floor(pa/32)].vpn;
      if(vpn===null)fail('UNMAPPED_FRAME');
      var update=PhysicalRam.write(state.ram,pa,value,'loader');
      var invalidated=CacheCoherence.invalidate(state.caches,pa,1);
      if(invalidated.status!=='completed')fail('CACHE_WRITEBACK_REQUIRED');
      var next=copy(state);
      next.ram=update.ram;
      next.caches=invalidated.caches;
      next.mmu.pages[vpn].dirty=true;
      next.mmu.pages[vpn].referenced=true;
      return commit(state,next,{kind:'ram-edit',va:vpn*32+pa%32,pa:pa,bytes:[value]},'ram-edit-'+state.revision);
    } catch(e) {
      return {status:'rejected',error:{code:e.code||'INVALID_STATE',message:e.message}};
    }
  }
  return {profile:profile,create:create,check:check,step:step,load:load,type:type,run:run,editPage:editPage,editRam:editRam,signals:SIGNALS.slice()};
}());


// ===== assembler/catalog.js =====
/** Three reproducible programs; every demo runs through the same CPU motor. */
var P2Catalog = (function () {
  var arithmetic='MOV AX, 0\nMOV BX, 7\nMOV CX, 5\nMOV DX, 0\nloop: ADD AX, BX\nINC DX\nDEC CX\nCMP CX, 0\nJNZ loop\nSTORE [300], AX\nHALT';
  var echo='MOV CX, 8\nloop: IN DX, [KBD]\nOUT [LCD], DX\nDEC CX\nCMP CX, 0\nJNZ loop\nHALT';
  var scattered=[];
  [256,288,320,352,384,416,448].forEach(function(address,index){scattered.push('MOV AX, '+(65+index),'STORE ['+address+'], AX');});
  [256,288,320,352,384,416,448].forEach(function(address){scattered.push('LOAD DX, ['+address+']');});
  scattered.push('HALT');
  var entries=[{id:'arithmetic',name:'Aritmética · 7 × 5',source:arithmetic,expected:'AX=35; DX=5; VA 300=35'},
    {id:'echo',name:'Eco · teclado a LCD',source:echo,input:'ABCDEFGH',expected:'LCD=ABCDEFGH; cola vacía; cursor=0'},
    {id:'scattered',name:'Accesos dispersos · FIFO y Swap',source:scattered.join('\n'),expected:'DX=71; Page Faults y guardado de páginas Dirty'}];
  return {list:function(){return JSON.parse(JSON.stringify(entries));},get:function(id){var entry=entries.find(function(e){return e.id===id;});if(!entry)throw new Error('UNKNOWN_PROGRAM');return JSON.parse(JSON.stringify(entry));}};
}());


// ===== core/clock.js =====
/** P2-006. Inject pure motor/reset functions; persist only confirmed batches. */
function clockClone(value) { return JSON.parse(JSON.stringify(value)); }
function clockCheck(state) {
  if (!state || state.schemaVersion !== 1 || !state.profile || !state.execution || !state.clock ||
      !state.cpu || !state.cpu.control || !state.cpu.control.signals ||
      !Number.isSafeInteger(state.revision) || state.revision < 0 ||
      !Number.isSafeInteger(state.clock.cycle) || state.clock.cycle < 0 ||
      !Number.isSafeInteger(state.clock.microStep) || state.clock.microStep < 0) throw new Error('INVALID_STATE');
}
function clockController(store, lock, motor, resetter) {
  function locked(fn) {
    if (!lock.tryLock(0)) throw new Error('BUSY');
    try { return fn(); } finally { lock.releaseLock(); }
  }
  function initialize() {
    return locked(function () {
      var existing = store.load();
      if (existing) return clockClone(existing);
      var state = resetter(); clockCheck(state);
      var record = {epoch: 1, sequence: 0, state: state, receipt: null};
      store.save(record); return clockClone(record);
    });
  }
  function dispatch(request) {
    return locked(function () {
      var record = store.load();
      if (!record) throw new Error('NOT_INITIALIZED');
      if (!request || !Number.isSafeInteger(request.sequence) || request.sequence < 1 ||
          !Number.isSafeInteger(request.expectedRevision) || request.expectedRevision < 0 ||
          ['step','run','pause','reset'].indexOf(request.action) === -1) throw new Error('INVALID_REQUEST');
      var limit = request.action === 'run' ? request.limit : 1;
      if (!Number.isInteger(limit) || limit < 1 || limit > 8) throw new Error('INVALID_BATCH');
      var key = JSON.stringify([request.epoch, request.sequence, request.expectedRevision, request.action, limit]);
      if (record.receipt && record.receipt.key === key) return clockClone(record.receipt.result);
      if (request.epoch !== record.epoch) throw new Error('STALE_SESSION');
      if (request.sequence !== record.sequence + 1) throw new Error('STALE_REQUEST');
      if (request.expectedRevision !== record.state.revision) throw new Error('STALE_REVISION');
      var next = clockClone(record.state), events = [], status = 'completed';
      clockCheck(next);
      function mode(value) {
        if (next.execution.mode === value) return;
        var before = next.execution.mode, rev = next.revision;
        next.execution.mode = value; next.revision++;
        var event = {schemaVersion:1, id: next.lastEvent ? next.lastEvent.id + 1 : 1,
          requestId: record.epoch + ':' + request.sequence + ':mode', kind:'execution-control',
          revisionBefore:rev, revisionAfter:next.revision, cycle:next.clock.cycle,
          microStep:next.clock.microStep, phase:next.clock.phase,
          signals:clockClone(next.cpu.control.signals), controlWord:next.cpu.control.word,
          segments:[], va:null, pa:null, bytes:[], result:'committed',
          changes:[{path:'execution.mode',before:before,after:value},{path:'revision',before:rev,after:next.revision}]};
        next.lastEvent=event; events.push(clockClone(event));
      }
      if (request.action === 'reset') {
        next = resetter(); clockCheck(next);
        if (next.revision !== 0 || next.execution.pendingRequest !== null) throw new Error('INVALID_RESET');
        record.epoch++; record.sequence=0;
      } else {
        if (request.action === 'pause') {
          if (['halted','error'].indexOf(next.execution.mode) !== -1) throw new Error('RESET_REQUIRED');
          mode('paused');
        }
        else {
          if (next.profile.status !== 'ready' || !Array.isArray(next.profile.pendingIssues) || next.profile.pendingIssues.length) throw new Error('INVALID_PROFILE');
          if (next.execution.mode === 'halted') throw new Error('HALTED');
          if (['idle','paused','running'].indexOf(next.execution.mode) === -1) throw new Error('RESET_REQUIRED');
          if (request.action === 'step' && next.execution.mode === 'running') throw new Error('PAUSE_FIRST');
          mode(request.action === 'run' ? 'running' : 'paused');
          for (var i=0; i<limit; i++) {
            var result = motor(clockClone(next), {requestId:record.epoch+':'+request.sequence+':'+i,
              expectedRevision:next.revision});
            if (!result || result.status === 'rejected') throw new Error(result && result.error ? result.error.code : 'INVALID_MOTOR');
            if (['completed','pending'].indexOf(result.status) === -1 || !Array.isArray(result.events)) throw new Error('INVALID_MOTOR');
            clockCheck(result.state);
            if (result.state.revision < next.revision || result.state.revision > next.revision + 1 ||
                (result.status === 'completed' && result.state.revision !== next.revision+1)) throw new Error('INVALID_MOTOR_REVISION');
            if (result.state.revision === next.revision && JSON.stringify(result.state) !== JSON.stringify(next)) throw new Error('UNVERSIONED_CHANGE');
            next = clockClone(result.state); events = events.concat(clockClone(result.events));
            status = result.status;
            if (status === 'pending' || next.execution.mode === 'halted') break;
          }
        }
        record.sequence = request.sequence;
      }
      var output = {status:status, epoch:record.epoch, sequence:record.sequence, state:next, events:events};
      record.state=next; record.receipt={key:key,result:output};
      store.save(record); // The UI receives no events before durable publication succeeds.
      return clockClone(output);
    });
  }
  return {initialize:initialize, dispatch:dispatch, read:function () { return locked(function () { return clockClone(store.load()); }); }};
}


// ===== core/clock-store.js =====
/** Two slots, ASCII chunks and a final manifest. All calls require the same lock. */
function clockPropertyStore(properties) {
  var prefix='P2_CLOCK_';
  function manifest() {
    var raw=properties.getProperty(prefix+'HEAD');
    if (raw === null) return null;
    var m=JSON.parse(raw);
    if (!m || ![0,1].includes(m.slot) || !Number.isInteger(m.count) || m.count<1 || m.count>20) throw new Error('CORRUPT_STORE');
    return m;
  }
  function load() {
    var m=manifest(); if (!m) return null;
    var raw='';
    for (var i=0;i<m.count;i++) {
      var chunk=properties.getProperty(prefix+m.slot+'_'+i);
      if (chunk===null) throw new Error('CORRUPT_STORE');
      raw+=chunk;
    }
    return JSON.parse(raw);
  }
  function save(record) {
    var raw=JSON.stringify(record).replace(/[\u007f-\uffff]/g,function(c){return '\\u'+c.charCodeAt(0).toString(16).padStart(4,'0');});
    var count=Math.ceil(raw.length/7000);
    if (count<1 || count>20) throw new Error('STORE_TOO_LARGE');
    var current=manifest(), slot=current ? 1-current.slot : 0, values={};
    for (var i=0;i<count;i++) values[prefix+slot+'_'+i]=raw.slice(i*7000,(i+1)*7000);
    properties.setProperties(values, false);
    // A failed chunk write never advances HEAD. A retry overwrites the inactive slot.
    properties.setProperty(prefix+'HEAD',JSON.stringify({slot:slot,count:count}));
  }
  return {load:load,save:save};
}
function clockAppsScript(motor, resetter) {
  return clockController(clockPropertyStore(PropertiesService.getScriptProperties()),
    LockService.getScriptLock(), motor, resetter);
}


// ===== sheets/lcd-view.js =====
/**
 * Vista del LCD derivada del snapshot.
 * No escribe en la RAM ni ejecuta OUT.
 */
function lcdRenderSnapshot(state) {
  var display = lcdReadDisplay(state);
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error("No hay una planilla vinculada.");
  }

  var sheet = spreadsheet.getSheetByName("LCD_P2_023");

  if (!sheet) {
    sheet = spreadsheet.insertSheet("LCD_P2_023");
  }

  sheet.getRange("A1").setValue("LCD · 8 caracteres");
  sheet.getRange("A2").setValue("Vista del snapshot recibido");
  sheet.getRange("A3:B3").setValues([
    ["Cursor (0–7)", display.cursor]
  ]);

  // Prefijo de texto para que caracteres como "=" no sean fórmulas.
  var characters = display.characters.map(function (character) {
    return "'" + character;
  });

  sheet.getRange("A5:H5")
    .setNumberFormat("@")
    .setValues([characters])
    .setFontSize(24)
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setBackground("#D9EAD3");

  sheet.getRange("A6:H6").setValues([
    ["Byte 0", "Byte 1", "Byte 2", "Byte 3",
     "Byte 4", "Byte 5", "Byte 6", "Byte 7"]
  ]);

  sheet.getRange("A7:H7")
    .setNumberFormat("0")
    .setValues([display.bytes]);

  sheet.setColumnWidths(1, 8, 90);

  console.log("Vista LCD actualizada.");
}


// ===== sheets/marcelo-app.js =====
/** Shared bound-sheet application. State is stored once, under the clock lock. */
function P2_Clock() {
  return clockAppsScript(P2Machine.step,function(){
    var previous=clockPropertyStore(PropertiesService.getScriptProperties()).load();
    return P2Machine.create(previous?previous.state.profile:P2Machine.profile(false));
  });
}
function P2_InstallMenu(){SpreadsheetApp.getUi().createMenu('Simulador P2')
  .addItem('Preparar y abrir controles','P2_Setup').addItem('Abrir controles','P2_OpenControls').addToUi();}
function P2_Setup(){var record=P2_Clock().initialize();P2_Render(record.state);P2_EnsureSheet('Traza');
  var editor=P2_EnsureSheet('Editor');if(!editor.getRange('A2').getValue())P2_WriteEditor(P2Catalog.get('arithmetic').source);
  P2_InstallMenu();P2_OpenControls();}
function P2_EnsureSheet(name){var ss=SpreadsheetApp.getActiveSpreadsheet();return ss.getSheetByName(name)||ss.insertSheet(name);}
function P2_EnsureGrid(sheet,rows,columns){
  var currentRows=sheet.getMaxRows(),currentColumns=sheet.getMaxColumns();
  if(currentRows<rows)sheet.insertRowsAfter(currentRows,rows-currentRows);
  if(currentColumns<columns)sheet.insertColumnsAfter(currentColumns,columns-currentColumns);
}
function P2_Read(){return P2_Clock().read();}
function P2_Change(action,payload){
  var lock=LockService.getScriptLock();if(!lock.tryLock(0))throw new Error('BUSY');
  var store=clockPropertyStore(PropertiesService.getScriptProperties()),record,result;
  try{record=store.load();if(!record)throw new Error('Primero ejecuta P2_Setup.');
    if(payload&&payload.expectedRevision!==undefined&&payload.expectedRevision!==record.state.revision)throw new Error('STALE_REVISION');
    if(action==='activate'){
      if(record.state.execution.pendingRequest)throw new Error('BUSY');
      record.state=P2Machine.create(P2Machine.profile(true));record.epoch++;record.sequence=0;record.receipt=null;result={state:record.state,events:[]};
    }else if(action==='load'){
      result=P2Machine.load(record.state,payload.source,payload.origin||0);
      if(result.status==='rejected')throw new Error(JSON.stringify(result.error));
      record.state=result.state;record.epoch++;record.sequence=0;record.receipt=null;
    }else if(action==='type'){
      result=P2Machine.type(record.state,payload.text);if(result.status==='rejected')throw new Error(JSON.stringify(result.error));
      record.state=result.state;record.sequence++;record.receipt=null;
    }else if(action==='editPage'){
      result=P2Machine.editPage(record.state,payload.vpn,{referenced:payload.referenced});if(result.status==='rejected')throw new Error(JSON.stringify(result.error));
      record.state=result.state;record.sequence++;record.receipt=null;
    }else if(action==='editRam'){
      result=P2Machine.editRam(record.state,payload.pa,payload.value);if(result.status==='rejected')throw new Error(JSON.stringify(result.error));
      record.state=result.state;record.sequence++;record.receipt=null;
    }else throw new Error('INVALID_ACTION');
    store.save(record);
  }finally{lock.releaseLock();}
  P2_AppendEvents(result.events,record.epoch);P2_Render(record.state);return record;
}
function P2_Dispatch(request){var output=P2_Clock().dispatch(request);P2_AppendEvents(output.events,output.epoch);P2_Render(output.state);return P2_Read();}
function P2_LoadDemo(id,expectedRevision){var entry=P2Catalog.get(id);var record=P2_Change('load',{source:entry.source,origin:0,expectedRevision:expectedRevision});P2_WriteEditor(entry.source);return record;}
function P2_LoadEditor(expectedRevision){var sheet=P2_EnsureSheet('Editor');var lines=sheet.getRange(2,1,Math.max(1,sheet.getLastRow()-1),1).getDisplayValues().map(function(r){return r[0];});
  return P2_Change('load',{source:lines.join('\n'),origin:0,expectedRevision:expectedRevision});}
function P2_WriteEditor(source){var sheet=P2_EnsureSheet('Editor');sheet.getRange('A1').setValue('Ensamblador: una línea por celda; carga desde el panel');
  sheet.getRange(2,1,Math.max(1,sheet.getLastRow()-1),1).clearContent();var rows=source.split('\n').map(function(line){return ["'"+line];});
  sheet.getRange(2,1,rows.length,1).setNumberFormat('@').setValues(rows);sheet.setColumnWidth(1,650);}
function P2_Render(state){
  var cpu=P2_EnsureSheet('CPU'),c=state.cpu;
  var registers=[['Registro','Decimal','Hexadecimal']];['AX','BX','CX','DX'].forEach(function(k){registers.push([k,c.registers[k],c.registers[k].toString(16).toUpperCase().padStart(2,'0')]);});
  [['PC',c.pc],['MAR',c.mar],['MDR',c.mdr]].forEach(function(x){registers.push([x[0],x[1],x[1].toString(16).toUpperCase().padStart(x[0]==='MDR'?2:3,'0')]);});
  cpu.getRange('A1').setValue('Los Anunakis · Computadora de 8 bits');cpu.getRange('A2:D2').setValues([['Estado',state.execution.mode,'Perfil',state.profile.status]]);
  cpu.getRange(4,1,registers.length,3).setValues(registers);cpu.getRange('E4:F9').setValues([['Indicador','Valor'],['ZF',c.flags.ZF?1:0],['CF',c.flags.CF?1:0],['SF',c.flags.SF?1:0],['Ciclo',state.clock.cycle],['Micro paso',state.clock.microStep]]);
  cpu.getRange('A14:B16').setValues([['Fase',state.clock.phase],['IR (bytes)',c.ir.bytes.map(function(b){return b.toString(16).padStart(2,'0');}).join(' ')],['Instrucción',c.ir.decoded?c.ir.decoded.mnemonic:'']]);
  var busRows=[['Segmento','Nivel','Valor','Emisor','Receptores']];Object.keys(state.buses).forEach(function(k){var b=state.buses[k];busRows.push([k,b.level,b.value===null?'High-Z':b.value,b.drivers.join(', '),b.receivers.join(', ')]);});
  cpu.getRange(19,1,busRows.length,5).setValues(busRows);cpu.setColumnWidth(1,230);cpu.setColumnWidths(2,5,130);
  var mmu=P2_EnsureSheet('MMU_P2_011'),rows=mmuPageTableRows(state.mmu.pages).rows;
  mmu.getRange('A1').setValue('Tabla de páginas · estado activo');mmu.getRange('A2:D2').setValues([['Marcos reemplazables',7,'FIFO',state.mmu.fifo.join(' → ')]]);
  var fault=state.mmu.fault;mmu.getRange('A3:F3').setValues([fault?['PAGE FAULT',fault.vpn,'PFN',fault.victimPfn,fault.stage,fault.transferredBytes+'/32']:['Sin Page Fault','','','','','']]);
  mmu.getRange('A3:F3').setBackground(fault?'#F4CCCC':'#E2F0D9');mmu.getRange(5,1,17,6).setValues(rows.map(function(r){return r.map(function(v){return v===null?'':v;});}));mmu.setFrozenRows(5);
  var pending=state.execution.pendingRequest;
  mmu.getRange('E2:F2').setValues([['Offset',pending?pending.va%32:'']]);
  mmu.getRange('A4:F4').setValues([['Víctima VPN',fault&&pending&&pending.victim!==null?pending.victim:'','Dirty víctima',fault&&pending?pending.victimDirty:false,'VA',pending?pending.va:'']]);
  mmu.getRange('G2:H3').setValues([
    ['Cabeza FIFO (PFN)',state.mmu.fifo.length?state.mmu.fifo[0]:'Vacía'],
    ['Selección',fault&&pending?(pending.victim===null?'Marco libre':'Víctima FIFO'):'—']
  ]);
  mmu.getRange('A6:F21').setBackgrounds(state.mmu.pages.map(function(p){var color=p.pinned?'#FFF2CC':fault&&fault.vpn===p.vpn?'#F4CCCC':p.present?'#E2F0D9':'#F2F2F2';return Array(6).fill(color);}));
  var ram=P2_EnsureSheet('RAM'),grid=[['PA'].concat(Array.from({length:16},function(_,i){return i.toString(16).toUpperCase();}))];
  for(var row=0;row<16;row++)grid.push([(row*16).toString(16).toUpperCase().padStart(2,'0')].concat(state.ram.bytes.slice(row*16,row*16+16).map(function(b){return b.toString(16).toUpperCase().padStart(2,'0');})));
  ram.getRange(1,1,17,17).setNumberFormat('@').setValues(grid);ram.setColumnWidths(1,17,44);
  var decimal=[['PA decimal'].concat(Array.from({length:16},function(_,i){return '+'+i;}))];
  for(var r=0;r<16;r++)decimal.push([r*16].concat(state.ram.bytes.slice(r*16,r*16+16)));
  ram.getRange(21,1,17,17).setValues(decimal);
  ram.getRange('A19').setValue('E0–E7 teclado · E8–EF LCD · F0–FF reservado');
  var swap=P2_EnsureSheet('Swap'),swapRows=[['VPN'].concat(Array.from({length:32},function(_,i){return i;}))];
  P2_EnsureGrid(swap,17,33);
  state.swap.pages.forEach(function(page,vpn){swapRows.push([vpn].concat(page));});swap.getRange(1,1,17,33).setValues(swapRows);swap.setColumnWidths(1,33,38);
  var cache=P2_EnsureSheet('Caches'),rates=cacheMetricsRates(state.metrics),stats=[['Nivel','Hits','Misses','Hit rate']];
  ['l1i','l1d','l2'].forEach(function(k){stats.push([k.toUpperCase(),rates[k].hits,rates[k].misses,rates[k].hitRate]);});cache.getRange('A1:D4').setValues(stats);cache.getRange('D2:D4').setNumberFormat('0.00%');
  var lines=[['Línea','Válida','Tag','Dirty','B0','B1','B2','B3','B4','B5','B6','B7']];
  [['L1I',state.caches.l1i],['L1D',state.caches.l1d]].concat(state.caches.l2.lines.map(function(l,i){return ['L2-'+i,l];})).forEach(function(x){lines.push([x[0],x[1].valid?1:0,x[1].tag===null?'':x[1].tag,x[1].dirty?1:0].concat(x[1].bytes));});
  cache.getRange(6,1,7,12).setValues(lines);cache.getRange('A14:D14').setValues([['FIFO L2',state.caches.l2.fifo.join(' → '),'Page Faults',state.metrics.pageFaults]]);
  lcdRenderSnapshot(state);P2_EnsureSheet('LCD_P2_023').getRange('A2').setValue('Video RAM · estado activo del simulador');
  var k=KeyboardQueue.view(state),kbd=P2_EnsureSheet('Teclado');kbd.getRange('A1:B5').setValues([['Cola de teclado',"'"+k.text],['Cantidad',k.count],['Head',k.head],['Tail',k.tail],['Capacidad',8]]);
  var control=P2_EnsureSheet('Señales'),sigrows=[['Bit','Señal','Activa','Estado']];P2Machine.signals.forEach(function(k,i){sigrows.push([i,k,state.cpu.control.signals[k]?1:0,k.indexOf('En_')===0?(state.cpu.control.signals[k]?'Conduce':'High-Z'):'']);});
  control.getRange(1,1,sigrows.length,4).setValues(sigrows);
  var word=state.cpu.control.word;
  control.getRange('F1:G2').setValues([['Palabra (decimal)',word===null?'—':word],
    ['Palabra (40 bits)',word===null?'—':"'"+word.toString(2).padStart(40,'0')]]);
  control.getRange(2,3,P2Machine.signals.length,1).setBackgrounds(sigrows.slice(1).map(function(row){
    return [row[2]?'#D9EAD3':'#F2F2F2'];
  }));
  [cpu,mmu,cache,control].forEach(function(sh){sh.getRange(sh===mmu?'A5:F5':sh===cpu?'A4:C4':sh===cache?'A1:D1':'A1:D1').setFontWeight('bold').setBackground('#243746').setFontColor('#FFFFFF');});
}
function P2_AppendEvents(events,epoch){if(!events.length)return;var sheet=P2_EnsureSheet('Traza');
  if(!sheet.getRange('A1').getValue())sheet.getRange('A1:M1').setValues([['Época','Evento','Revisión','Ciclo','Fase','VA','PA','Bytes','Emisores','Receptores','Señales','Micro-palabra','Cambios JSON']]);
  var last=sheet.getLastRow()>1?sheet.getRange(sheet.getLastRow(),1,1,2).getValues()[0]:[0,0];
  var fresh=events.filter(function(e){return last[0]!==epoch||e.id>last[1];});if(!fresh.length)return;
  var rows=fresh.map(function(e){return [epoch,e.id,e.revisionAfter,e.cycle,e.kind,e.va===null?'':e.va,e.pa===null?'':e.pa,e.bytes.join(' '),
    e.segments.filter(function(b){return b.driver;}).map(function(b){return b.name+':'+b.driver;}).join(' | '),
    e.segments.filter(function(b){return b.receivers.length;}).map(function(b){return b.name+':'+b.receivers.join(',');}).join(' | '),
    Object.keys(e.signals).filter(function(k){return e.signals[k];}).join(' '),e.controlWord===null?'':e.controlWord,JSON.stringify(e.changes)];});
  var start=sheet.getLastRow()+1;
  P2_EnsureGrid(sheet,start+rows.length-1,13);
  sheet.getRange(start,1,rows.length,13).setValues(rows);sheet.setFrozenRows(1);
}
function P2_OpenControls(){SpreadsheetApp.getUi().showSidebar(HtmlService.createHtmlOutput(P2_Sidebar()).setTitle('Simulador · controles'));}
function P2_Sidebar(){return '<!doctype html><html><head><base target="_top"><style>body{font:14px Arial;padding:12px;color:#243746}button,select,input{padding:9px;margin:4px 0;width:100%;box-sizing:border-box}button{cursor:pointer}pre{white-space:pre-wrap;font-size:12px}.row{display:flex;gap:6px}.row button{width:50%}#lcd{font:24px monospace;letter-spacing:3px;background:#d9ead3;padding:12px;white-space:pre}#error{color:#a31515}</style></head><body><h3>Los Anunakis · CPU de 8 bits</h3><div id="status">Conectando…</div><pre id="lcd">        </pre><button onclick="change(\'activate\',{})">Activar configuración del equipo</button><select id="demo"><option value="arithmetic">Aritmética 7 × 5</option><option value="echo">Eco de ocho caracteres</option><option value="scattered">Fallos de página y caché</option></select><button onclick="loadDemo()">Cargar demo</button><button onclick="loadEditor()">Cargar código de la hoja Editor</button><div class="row"><button onclick="dispatch(\'step\')">STEP</button><button onclick="startRun()">RUN</button></div><div class="row"><button onclick="pause()">PAUSA</button><button onclick="reset()">RESET</button></div><input id="kbd" maxlength="8" placeholder="Teclado: hasta 8 caracteres"><button onclick="typeText()">Enviar al teclado</button><hr><label>Página a inspeccionar</label><input id="vpn" type="number" min="0" max="15" value="0"><button onclick="editReference()">Alternar Reference (en pausa)</button><hr><label for="pa">Editar byte de RAM en pausa</label><input id="pa" type="number" min="0" max="223" placeholder="Dirección física decimal"><input id="byte" type="number" min="0" max="255" placeholder="Byte decimal"><button onclick="editRam()">Aplicar byte</button><pre id="details"></pre><p id="error"></p><script>let record=null,busy=false,running=false,pendingAction=null;function error(e){busy=false;running=false;document.getElementById("error").textContent=e.message||String(e);google.script.run.withSuccessHandler(r=>{show(r);document.getElementById("error").textContent=e.message||String(e);}).P2_Read();}function show(r){record=r;busy=false;if(!r)return;if(pendingAction){let action=pendingAction;pendingAction=null;dispatch(action);return;}let s=r.state;document.getElementById("error").textContent="";document.getElementById("status").textContent=s.execution.mode+" · "+s.profile.status+" · ciclo "+s.clock.cycle;document.getElementById("lcd").textContent=s.ram.bytes.slice(s.io.lcd.basePa,s.io.lcd.basePa+8).map(b=>b>=32&&b<=126?String.fromCharCode(b):" ").join("");document.getElementById("details").textContent=JSON.stringify(s.cpu.registers)+"\\n"+s.clock.phase+"\\nFIFO: "+s.mmu.fifo.join(",")+(s.mmu.fault?"\\nPAGE FAULT: "+JSON.stringify(s.mmu.fault):"");if(running&&s.execution.mode!=="halted"){if(s.execution.pendingRequest&&s.execution.pendingRequest.stage==="io"&&s.execution.pendingRequest.consume&&s.io.keyboard.count===0){running=false;return;}setTimeout(()=>dispatch("run"),150);}else running=false;}function dispatch(action){if(busy||!record)return;busy=true;google.script.run.withSuccessHandler(show).withFailureHandler(error).P2_Dispatch({action:action,epoch:record.epoch,sequence:record.sequence+1,expectedRevision:record.state.revision,limit:8});}function startRun(){running=true;dispatch("run");}function pause(){running=false;if(busy){pendingAction="pause";return;}dispatch("pause");}function reset(){running=false;if(busy){pendingAction="reset";return;}dispatch("reset");}function change(action,payload){if(busy||!record)return;running=false;busy=true;payload.expectedRevision=record.state.revision;google.script.run.withSuccessHandler(show).withFailureHandler(error).P2_Change(action,payload);}function loadDemo(){if(busy||!record)return;running=false;busy=true;google.script.run.withSuccessHandler(show).withFailureHandler(error).P2_LoadDemo(document.getElementById("demo").value,record.state.revision);}function loadEditor(){if(busy||!record)return;running=false;busy=true;google.script.run.withSuccessHandler(show).withFailureHandler(error).P2_LoadEditor(record.state.revision);}function typeText(){change("type",{text:document.getElementById("kbd").value});}function editRam(){let pa=document.getElementById("pa").valueAsNumber,value=document.getElementById("byte").valueAsNumber;if(!Number.isInteger(pa)||!Number.isInteger(value)){document.getElementById("error").textContent="Escribe una dirección y un byte enteros.";return;}change("editRam",{pa:pa,value:value});}function editReference(){if(!record)return;let vpn=Number(document.getElementById("vpn").value);if(!Number.isInteger(vpn)||vpn<0||vpn>15)return;change("editPage",{vpn:vpn,referenced:!record.state.mmu.pages[vpn].referenced});}google.script.run.withSuccessHandler(show).withFailureHandler(error).P2_Read();</script></body></html>';}

function onOpen(){P2_InstallMenu();}
