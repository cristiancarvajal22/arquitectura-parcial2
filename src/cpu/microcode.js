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
