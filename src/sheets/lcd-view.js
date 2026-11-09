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
