/** Copy this and microword.js into a bound Apps Script project. */
function microWordRender(event, spreadsheet) {
  var view = microWordView(event); // Validate completely before touching the sheet.
  var book = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  if (!book) throw new Error('NO_SPREADSHEET');
  var sheet = book.getSheetByName('MICROPALABRA_P2_009') || book.insertSheet('MICROPALABRA_P2_009');
  var rows = [
    ['Micro-palabra / Control word', '', '', '', ''],
    ['Encoding', view.encoding, 'Pending team approval', '', ''],
    ['Binary b29..b0', "'" + view.binary, 'Decimal', view.word, view.derived ? 'Derived from signals' : 'Matches event'],
    ['Bit', 'Signal', 'Value', 'Component', 'Buffer / action']
  ].concat(view.rows);
  sheet.getRange(1, 1, rows.length, 5).setValues(rows);
  sheet.getRange(5, 1, 30, 5).setBackgrounds(view.rows.map(function (r) {
    return Array(5).fill(r[2] ? '#D9EAD3' : '#EEEEEE');
  }));
  sheet.setFrozenRows(4);
  return view;
}
