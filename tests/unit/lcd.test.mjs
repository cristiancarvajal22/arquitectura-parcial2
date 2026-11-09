import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const context = vm.createContext({});

vm.runInContext(
  readFileSync(
    new URL("../../src/io/lcd.js", import.meta.url),
    "utf8"
  ),
  context
);

function snapshot() {
  return JSON.parse(readFileSync(
    new URL(
      "../../docs/examples/core/reset.snapshot.json",
      import.meta.url
    ),
    "utf8"
  ));
}

function transfer(state, value) {
  return {
    pa: state.io.lcd.basePa + state.io.lcd.cursor,
    signals: {
      Ld_LCD: true,
      Write: true,
      Read: false,
      IO: true,
      Clock: true
    },
    bus: {
      level: "driven",
      value,
      drivers: ["MDR"],
      receivers: ["LCD"]
    }
  };
}

function send(state, text) {
  let next = state;

  for (const character of text) {
    next = context.lcdReceive(
      next,
      transfer(next, character.charCodeAt(0))
    ).state;
  }

  return next;
}

test("el snapshot de reset tiene LCD vacío y cursor cero", () => {
  const display = context.lcdReadDisplay(snapshot());

  assert.equal(display.text, "        ");
  assert.equal(display.cursor, 0);
  assert.equal(display.bytes.length, 8);
});

test("un carácter cambia el byte real de RAM y avanza el cursor", () => {
  const state = snapshot();
  const next = send(state, "A");

  assert.equal(next.ram.bytes[state.io.lcd.basePa], 65);
  assert.equal(context.lcdReadDisplay(next).text, "A       ");
  assert.equal(next.io.lcd.cursor, 1);
  assert.equal(state.ram.bytes[state.io.lcd.basePa], snapshot().ram.bytes[state.io.lcd.basePa]);
});

test("ocho caracteres llenan el display y vuelven al cursor cero", () => {
  const next = send(snapshot(), "ABCDEFGH");

  assert.equal(context.lcdReadDisplay(next).text, "ABCDEFGH");
  assert.equal(next.io.lcd.cursor, 0);
});

test("el noveno carácter reemplaza la primera posición", () => {
  const next = send(snapshot(), "ABCDEFGHI");

  assert.equal(context.lcdReadDisplay(next).text, "IBCDEFGH");
  assert.equal(next.io.lcd.cursor, 1);
});

test("sin Load no cambia RAM ni cursor", () => {
  const state = snapshot();
  const operation = transfer(state, 65);
  operation.signals.Ld_LCD = false;

  const result = context.lcdReceive(state, operation);

  assert.equal(result.changed, false);
  assert.equal(JSON.stringify(result.state), JSON.stringify(state));
});

test("rechaza señales incompatibles sin modificar el estado", () => {
  const state = snapshot();
  const before = JSON.stringify(state);

  for (const [signal, value] of [
    ["Write", false],
    ["Read", true],
    ["IO", false],
    ["Clock", false]
  ]) {
    const operation = transfer(state, 65);
    operation.signals[signal] = value;

    assert.throws(() => context.lcdReceive(state, operation));
  }

  assert.equal(JSON.stringify(state), before);
});

test("rechaza High-Z, contención y ausencia de emisor", () => {
  const state = snapshot();

  for (const drivers of [[], ["MDR", "RAM"]]) {
    const operation = transfer(state, 65);
    operation.bus.drivers = drivers;

    assert.throws(() => context.lcdReceive(state, operation));
  }

  const operation = transfer(state, 65);
  operation.bus.level = "Z";
  assert.throws(() => context.lcdReceive(state, operation));
});

test("rechaza dirección, receptor y dato incorrectos", () => {
  const state = snapshot();

  const wrongAddress = transfer(state, 65);
  wrongAddress.pa += 1;
  assert.throws(() => context.lcdReceive(state, wrongAddress));

  const wrongReceiver = transfer(state, 65);
  wrongReceiver.bus.receivers = ["RAM"];
  assert.throws(() => context.lcdReceive(state, wrongReceiver));

  assert.throws(() =>
    context.lcdReceive(state, transfer(state, 256))
  );
});

test("el display refleja cambios del snapshot, sin buffer duplicado", () => {
  const state = snapshot();
  state.ram.bytes[state.io.lcd.basePa] = 90;

  assert.equal(context.lcdReadDisplay(state).text, "Z       ");
});

test("respeta otra reserva LCD válida del perfil", () => {
  const state = snapshot();
  state.io.lcd.basePa = 248;
  state.profile.ioMap.lcd.pa = 248;

  const next = send(state, "A");

  assert.equal(next.ram.bytes[248], 65);
  assert.equal(next.ram.bytes[232], state.ram.bytes[232]);
});

test("el procesamiento solo modifica video RAM y cursor", () => {
  const state = snapshot();
  const next = send(state, "A");
  const restored = JSON.parse(JSON.stringify(next));

  restored.ram.bytes[state.io.lcd.basePa] = state.ram.bytes[state.io.lcd.basePa];
  restored.io.lcd.cursor = 0;

  assert.equal(JSON.stringify(restored), JSON.stringify(state));
});
