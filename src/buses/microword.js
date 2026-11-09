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
