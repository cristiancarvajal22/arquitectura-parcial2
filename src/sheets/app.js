/** Shared bound-sheet application. State is stored once, under the clock lock. */
function P2_Clock() {
  return clockAppsScript(P2Machine.step,function(){
    var previous=clockPropertyStore(PropertiesService.getScriptProperties()).load();
    return P2Machine.create(previous?previous.state.profile:P2Machine.profile(false));
  });
}
function onOpen(){SpreadsheetApp.getUi().createMenu('Simulador P2')
  .addItem('Preparar y abrir controles','P2_Setup').addItem('Abrir controles','P2_OpenControls').addToUi();}
function P2_Setup(){var record=P2_Clock().initialize();P2_Render(record.state);P2_EnsureSheet('Traza');
  var editor=P2_EnsureSheet('Editor');if(!editor.getRange('A2').getValue())P2_WriteEditor(P2Catalog.get('arithmetic').source);
  onOpen();P2_OpenControls();}
function P2_EnsureSheet(name){var ss=SpreadsheetApp.getActiveSpreadsheet();return ss.getSheetByName(name)||ss.insertSheet(name);}
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
  cpu.getRange('A1').setValue('Computadora de 8 bits · Cristian / Marcelo / Joseph');cpu.getRange('A2:D2').setValues([['Estado',state.execution.mode,'Perfil',state.profile.status]]);
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
  mmu.getRange('A6:F21').setBackgrounds(state.mmu.pages.map(function(p){var color=p.pinned?'#FFF2CC':fault&&fault.vpn===p.vpn?'#F4CCCC':p.present?'#E2F0D9':'#F2F2F2';return Array(6).fill(color);}));
  var ram=P2_EnsureSheet('RAM'),grid=[['PA'].concat(Array.from({length:16},function(_,i){return i.toString(16).toUpperCase();}))];
  for(var row=0;row<16;row++)grid.push([(row*16).toString(16).toUpperCase().padStart(2,'0')].concat(state.ram.bytes.slice(row*16,row*16+16).map(function(b){return b.toString(16).toUpperCase().padStart(2,'0');})));
  ram.getRange(1,1,17,17).setNumberFormat('@').setValues(grid);ram.setColumnWidths(1,17,44);
  var swap=P2_EnsureSheet('Swap'),swapRows=[['VPN'].concat(Array.from({length:32},function(_,i){return i;}))];
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
  sheet.getRange(sheet.getLastRow()+1,1,rows.length,13).setValues(rows);sheet.setFrozenRows(1);
}
function P2_OpenControls(){SpreadsheetApp.getUi().showSidebar(HtmlService.createHtmlOutput(P2_Sidebar()).setTitle('Simulador · controles'));}
function P2_Sidebar(){return '<!doctype html><html><head><base target="_top"><style>body{font:14px Arial;padding:12px;color:#243746}button,select,input{padding:9px;margin:4px 0;width:100%;box-sizing:border-box}button{cursor:pointer}pre{white-space:pre-wrap;font-size:12px}.row{display:flex;gap:6px}.row button{width:50%}#lcd{font:24px monospace;letter-spacing:3px;background:#d9ead3;padding:12px;white-space:pre}#error{color:#a31515}</style></head><body><h3>CPU de 8 bits</h3><div id="status">Conectando…</div><pre id="lcd">        </pre><button onclick="change(\'activate\',{})">Activar configuración del equipo</button><select id="demo"><option value="arithmetic">Aritmética 7 × 5</option><option value="echo">Eco de ocho caracteres</option><option value="scattered">Fallos de página y caché</option></select><button onclick="loadDemo()">Cargar demo</button><button onclick="loadEditor()">Cargar código de la hoja Editor</button><div class="row"><button onclick="dispatch(\'step\')">STEP</button><button onclick="startRun()">RUN</button></div><div class="row"><button onclick="pause()">PAUSA</button><button onclick="reset()">RESET</button></div><input id="kbd" maxlength="8" placeholder="Teclado: hasta 8 caracteres"><button onclick="typeText()">Enviar al teclado</button><hr><label>Página a inspeccionar</label><input id="vpn" type="number" min="0" max="15" value="0"><button onclick="editReference()">Alternar Reference (en pausa)</button><pre id="details"></pre><p id="error"></p><script>let record=null,busy=false,running=false,pendingAction=null;function error(e){busy=false;running=false;document.getElementById("error").textContent=e.message||String(e);google.script.run.withSuccessHandler(r=>{show(r);document.getElementById("error").textContent=e.message||String(e);}).P2_Read();}function show(r){record=r;busy=false;if(!r)return;if(pendingAction){let action=pendingAction;pendingAction=null;dispatch(action);return;}let s=r.state;document.getElementById("error").textContent="";document.getElementById("status").textContent=s.execution.mode+" · "+s.profile.status+" · ciclo "+s.clock.cycle;document.getElementById("lcd").textContent=s.ram.bytes.slice(s.io.lcd.basePa,s.io.lcd.basePa+8).map(b=>b>=32&&b<=126?String.fromCharCode(b):" ").join("");document.getElementById("details").textContent=JSON.stringify(s.cpu.registers)+"\\n"+s.clock.phase+"\\nFIFO: "+s.mmu.fifo.join(",")+(s.mmu.fault?"\\nPAGE FAULT: "+JSON.stringify(s.mmu.fault):"");if(running&&s.execution.mode!=="halted"){if(s.execution.pendingRequest&&s.execution.pendingRequest.stage==="io"&&s.execution.pendingRequest.consume&&s.io.keyboard.count===0){running=false;return;}setTimeout(()=>dispatch("run"),150);}else running=false;}function dispatch(action){if(busy||!record)return;busy=true;google.script.run.withSuccessHandler(show).withFailureHandler(error).P2_Dispatch({action:action,epoch:record.epoch,sequence:record.sequence+1,expectedRevision:record.state.revision,limit:8});}function startRun(){running=true;dispatch("run");}function pause(){running=false;if(busy){pendingAction="pause";return;}dispatch("pause");}function reset(){running=false;if(busy){pendingAction="reset";return;}dispatch("reset");}function change(action,payload){if(busy||!record)return;running=false;busy=true;payload.expectedRevision=record.state.revision;google.script.run.withSuccessHandler(show).withFailureHandler(error).P2_Change(action,payload);}function loadDemo(){if(busy||!record)return;running=false;busy=true;google.script.run.withSuccessHandler(show).withFailureHandler(error).P2_LoadDemo(document.getElementById("demo").value,record.state.revision);}function loadEditor(){if(busy||!record)return;running=false;busy=true;google.script.run.withSuccessHandler(show).withFailureHandler(error).P2_LoadEditor(record.state.revision);}function typeText(){change("type",{text:document.getElementById("kbd").value});}function editReference(){if(!record)return;let vpn=Number(document.getElementById("vpn").value);if(!Number.isInteger(vpn)||vpn<0||vpn>15)return;change("editPage",{vpn:vpn,referenced:!record.state.mmu.pages[vpn].referenced});}google.script.run.withSuccessHandler(show).withFailureHandler(error).P2_Read();</script></body></html>';}
