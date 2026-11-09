/**
 * Dibuja una vista del snapshot recibido.
 * No modifica el estado del CPU, la RAM ni la tabla de páginas.
 */
function mmuRenderSnapshot(state) {
  var validation = mmuValidateSnapshot(state);

  if (!validation.ok) {
    throw new Error(validation.error.message);
  }

  var table = mmuPageTableRows(state.mmu.pages);

  if (!table.ok) {
    throw new Error(table.error.message);
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error("Ejecuta desde el proyecto vinculado a la planilla.");
  }

  // Pestaña dedicada a esta vista.
  var sheetName = "MMU_P2_011";
  var sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  var rows = [
    ["Tabla de páginas · MMU", "", "", "", "", ""],
    [
      "Perfil",
      state.profile.id,
      "Estado del perfil",
      state.profile.status,
      "",
      ""
    ],
    [
      "Marcos reemplazables",
      validation.replaceableFrameCount,
      "RAM (bytes)",
      256,
      "Espacio virtual (bytes)",
      512
    ],
    [
      "Vista del snapshot recibido; no ejecuta el simulador.",
      "", "", "", "", ""
    ]
  ].concat(table.rows);

  // Mostrar PFN nulo como celda vacía.
  // Conservar textos como textos, incluso si empiezan con "=".
  rows = rows.map(function (row) {
    return row.map(function (value) {
      if (value === null || value === undefined) {
        return "";
      }

      if (typeof value === "string" && value.charAt(0) === "=") {
        return "'" + value;
      }

      return value;
    });
  });

  sheet.getRange(1, 1, rows.length, 6).setValues(rows);

  sheet.getRange("A1:F1")
    .setFontWeight("bold")
    .setFontSize(14);

  sheet.getRange("A5:F5")
    .setBackground("#243746")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold");

  sheet.getRange("A6:F21")
    .setNumberFormat("0")
    .setHorizontalAlignment("center");

  var backgrounds = state.mmu.pages.map(function (page) {
    var color = page.pinned
      ? "#FFF2CC"
      : page.present ? "#E2F0D9" : "#F2F2F2";

    return [color, color, color, color, color, color];
  });

  sheet.getRange("A6:F21").setBackgrounds(backgrounds);
  sheet.setFrozenRows(5);
  sheet.setColumnWidths(1, 6, 155);
  sheet.setColumnWidth(1, 230);

  spreadsheet.setActiveSheet(sheet);
  SpreadsheetApp.flush();

  console.log("Vista MMU actualizada con 16 páginas.");
}

/**
 * Prueba manual de la vista con un snapshot JSON.
 * No inicia Run/Step ni aprueba el perfil.
 */
function mmuPreviewJson() {
  var ui = SpreadsheetApp.getUi();

  var response = ui.prompt(
    "Vista de prueba MMU",
    "Pega el contenido completo de reset.snapshot.json.",
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  var state;

  try {
    state = JSON.parse(response.getResponseText());
  } catch (error) {
    throw new Error("El texto pegado no es un JSON válido.");
  }

  mmuRenderSnapshot(state);
}
