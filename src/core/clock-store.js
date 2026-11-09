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
