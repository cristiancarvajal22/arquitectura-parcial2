/** Bound spreadsheet entry points. Source/catalog remain outside CPU state. */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Simulador')
    .addItem('1. Preparar hojas','simSetup').addItem('2. Seleccionar programa','simSelect')
    .addItem('Guardar fuente en catálogo','simSave').addItem('Verificar fuente','simVerify')
    .addItem('3. Cargar / Reset','simLoad').addSeparator()
    .addItem('Step (una instrucción)','simStep').addItem('Run (8 instrucciones)','simRun')
    .addItem('Pausar entre lotes','simPause').addItem('Reset del programa cargado','simReset')
    .addItem('Ingresar teclado','simKeyboard').addItem('Editar byte de RAM','simEditRam')
    .addItem('Redibujar estado','simRefresh').addToUi();
  if (typeof P2_InstallMenu === 'function') P2_InstallMenu();
}
function simSheet(name){var book=SpreadsheetApp.getActiveSpreadsheet();return book.getSheetByName(name)||book.insertSheet(name);}
function simStore(){var p=PropertiesService.getScriptProperties();
  return clockPropertyStore({getProperty:function(k){return p.getProperty('SIM:'+k);},
    setProperty:function(k,v){p.setProperty('SIM:'+k,v);},
    setProperties:function(values){var mapped={};Object.keys(values).forEach(function(k){mapped['SIM:'+k]=values[k];});p.setProperties(mapped);}});
}
function simLocked(action){var lock=LockService.getScriptLock();if(!lock.tryLock(1000))throw Error('Otra operación está en curso.');
  try{return action();}finally{lock.releaseLock();}}
function simEngine(){return Simulator(SIM_RESET);}
function simHeader(range){range.setBackground('#17365D').setFontColor('#FFFFFF').setFontWeight('bold');}
function simText(value){return typeof value==='string'&&value.charAt(0)==='='?"'"+value:value;}
function simSetup(){simLocked(function(){
  var catalog=simSheet('Catalogo'),editor=simSheet('Editor');
  if(catalog.getLastRow()===0){catalog.getRange(1,1,1,2).setValues([['Programa','Fuente ASM']]);
    catalog.getRange(2,1,SIM_PROGRAMS.length,2).setValues(SIM_PROGRAMS.map(function(p){return [p.name,p.source];}));}
  editor.getRange('A2').setValue('Programa del catálogo');
  if(!editor.getRange('B2').getValue())editor.getRange('B2').setValue(SIM_PROGRAMS[0].name);
  editor.getRange('A4').setValue('Estado');editor.getRange('A6').setValue('Fuente ASM editable →');
  editor.getRange('A1').setValue('Los Anunakis | Arquitectura');
  simHeader(editor.getRange('A1:B1'));simHeader(catalog.getRange('A1:B1'));
  editor.getRange('B6').setWrap(true);editor.setColumnWidth(2,600);editor.setRowHeight(6,320);
  simSheet('Estado');simSheet('Traza');
  editor.getRange('B4').setValue('Selecciona un programa y usa el menú Simulador.');
});onOpen();}
function simSelect(){simLocked(function(){var e=simSheet('Editor'),name=String(e.getRange('B2').getValue()),c=simSheet('Catalogo');
  var rows=c.getDataRange().getValues(),row=rows.slice(1).find(function(r){return r[0]===name;});
  if(!row)throw Error('Programa no encontrado en Catalogo: '+name);
  e.getRange('B6').setValue(row[1]);e.getRange('B4').setValue('Fuente seleccionada; todavía no cargada.');});}
function simSave(){simLocked(function(){var e=simSheet('Editor'),c=simSheet('Catalogo'),name=String(e.getRange('B2').getValue()).trim();
  if(!name||name.charAt(0)==='=')throw Error('Nombre inválido');
  var source=String(e.getRange('B6').getValue());if(source.trim().charAt(0)==='=')throw Error('La fuente debe ser texto ASM.');
  var rows=c.getDataRange().getValues(),index=rows.findIndex(function(r,i){return i>0&&r[0]===name;});
  c.getRange(index<0?c.getLastRow()+1:index+1,1,1,2).setValues([[name,source]]);
  e.getRange('B4').setValue('Fuente guardada; el estado de CPU no cambió.');});}
function simVerify(){var e=simSheet('Editor'),r=AsmParser.assemble(String(e.getRange('B6').getValue()),0);
  e.getRange('B4').setValue(r.ok?'Fuente válida: '+r.bytes.length+' bytes':r.errors.map(function(x){return 'Línea '+x.line+': '+x.message;}).join('\n'));return r;}
function simLoad(){simLocked(function(){var e=simSheet('Editor'),r=simEngine().load(String(e.getRange('B6').getValue()));
  if(!r.ok){e.getRange('B4').setValue(r.errors.map(function(x){return 'Línea '+x.line+': '+x.message;}).join('\n'));return;}
  simStore().save(r.state);simRender(r.state,[]);e.getRange('B4').setValue('Cargado: CPU reiniciada y cachés vacías.');});}
function simExecute(limit){simLocked(function(){var store=simStore(),s=store.load();if(!s)throw Error('Primero carga un programa.');
  var r=simEngine().run(s,limit);if(r.status==='error')throw Error(r.error);
  store.save(r.state);simRender(r.state,r.events);
  simSheet('Editor').getRange('B4').setValue(r.status==='waiting'?'Esperando teclado':r.status==='halted'?'HALT':'Pausado tras '+limit+' instrucciones');});}
function simStep(){simExecute(1);}
function simRun(){simExecute(8);}
function simPause(){simLocked(function(){
  var s=simStore().load();if(!s)throw Error('Primero carga un programa.');
  simSheet('Editor').getRange('B4').setValue(s.execution.mode==='halted'?'HALT':'Pausado entre lotes');
});}
function simReset(){simLocked(function(){
  var store=simStore(),s=store.load();if(!s)throw Error('Primero carga un programa.');
  var reset=simEngine().load(s.runtime.source);
  if(!reset.ok)throw Error('No se pudo reiniciar el programa cargado.');
  store.save(reset.state);simRender(reset.state,[]);
  simSheet('Editor').getRange('B4').setValue('Reiniciado desde la fuente cargada.');
});}
function simRefresh(){simLocked(function(){
  var s=simStore().load();if(!s)throw Error('Primero carga un programa.');
  simRender(s,s.runtime.lastTrace||[]);
});}
function simEditRam(){
  var ui=SpreadsheetApp.getUi(),answer=ui.prompt('Editar RAM','PA decimal y byte separados por un espacio. Ejemplo: 2 77',ui.ButtonSet.OK_CANCEL);
  if(answer.getSelectedButton()!==ui.Button.OK)return;
  var parts=answer.getResponseText().trim().match(/^(\d+)\s+(\d+)$/);
  if(!parts)throw Error('Escribe dos enteros decimales.');
  simLocked(function(){
    var store=simStore(),s=store.load();if(!s)throw Error('Primero carga un programa.');
    var result=simEngine().editRam(s,Number(parts[1]),Number(parts[2]));
    store.save(result.state);simRender(result.state,result.events);
  });
}
function simKeyboard(){var ui=SpreadsheetApp.getUi(),answer=ui.prompt('Teclado','Hasta 8 caracteres ASCII imprimibles',ui.ButtonSet.OK_CANCEL);
  if(answer.getSelectedButton()!==ui.Button.OK)return;
  simLocked(function(){var store=simStore(),s=store.load();if(!s)throw Error('Primero carga un programa.');
    var chars=answer.getResponseText();if(chars.length>8-s.io.keyboard.count)throw Error('No hay espacio suficiente en la cola.');
    for(var i=0;i<chars.length;i++){var r=KeyboardQueue.enqueue(s,chars[i],s.revision);if(r.status!=='completed')throw Error('Cola llena');s=r.state;}
    store.save(s);simRender(s,s.runtime.lastTrace||[]);});}
function simRender(s,events){var sheet=simSheet('Estado');sheet.clearContents();
  var rows=[['SIMULADOR — LOS ANUNAKIS',''],['Modo',s.execution.mode],['PC',s.cpu.pc],['MAR',s.cpu.mar],['MDR',s.cpu.mdr],
    ['IR',s.cpu.ir.bytes.join(' ')],['AX',s.cpu.registers.AX],['BX',s.cpu.registers.BX],['CX',s.cpu.registers.CX],['DX',s.cpu.registers.DX],
    ['ZF / CF / SF',[s.cpu.flags.ZF,s.cpu.flags.CF,s.cpu.flags.SF].join(' / ')],['Instrucciones',s.runtime.instructions],
    ['LCD',simText(lcdReadDisplay(s).text)],['Teclado',simText(KeyboardQueue.view(s).text)],['Page faults',s.metrics.pageFaults],
    ['Cola FIFO (PFN)',s.mmu.fifo.join(' → ')||'Vacía'],['Cabeza FIFO (PFN)',s.mmu.fifo.length?s.mmu.fifo[0]:'—'],
    ['KBD head / tail / count',[s.io.keyboard.head,s.io.keyboard.tail,s.io.keyboard.count].join(' / ')]];
  sheet.getRange(1,1,rows.length,2).setValues(rows);
  simHeader(sheet.getRange('A1:B1'));sheet.setFrozenRows(1);
  var rates=cacheMetricsRates(s.metrics);sheet.getRange(1,4,4,4).setValues([['Caché','Hits','Misses','Hit rate']].concat(['l1i','l1d','l2'].map(function(k){return [k,rates[k].hits,rates[k].misses,rates[k].hitRate];})));
  sheet.getRange(7,4,17,5).setValues([['VPN','Presente','PFN','Dirty','Ref']].concat(s.mmu.pages.map(function(p){return [p.vpn,p.present,p.pfn===null?'—':p.pfn,p.dirty,p.referenced];})));
  sheet.getRange(26,4,7,4).setValues([['Línea','Válida','Tag','Bytes']].concat([{name:'L1I',line:s.caches.l1i},{name:'L1D',line:s.caches.l1d}].concat(s.caches.l2.lines.map(function(l,i){return {name:'L2-'+i,line:l};})).map(function(x){return [x.name,x.line.valid,x.line.tag===null?'—':x.line.tag,x.line.bytes.join(' ')];})));
  sheet.getRange(35,1,33,9).setValues([['PA','+0','+1','+2','+3','+4','+5','+6','+7']].concat(Array.from({length:32},function(_,i){
    var base=i*8;return [base].concat(s.ram.bytes.slice(base,base+8).map(function(value){
      return value+' / '+value.toString(16).toUpperCase().padStart(2,'0');
    }));
  })));
  sheet.getRange('A34').setValue('RAM · decimal / hexadecimal · PA 224–231 KBD · 232–239 LCD');
  ['D1:G1','D7:H7','D26:G26','A35:I35'].forEach(function(a1){simHeader(sheet.getRange(a1));});
  var t=simSheet('Traza');t.clearContents();t.setFrozenRows(1);
  var header=[['Orden','Evento','Segmento','Emisor','Receptor','VA','PA','Valor','Señales activas','Detalle']];
  t.getRange(1,1,1,10).setValues(header);simHeader(t.getRange('A1:J1'));
  if(events.length)t.getRange(2,1,events.length,10).setValues(events.map(function(e,i){
    return [i+1,e.kind,e.segment||'',e.from||'',e.to||'',e.va??'',e.pa??'',e.value??'',
      Object.keys(e.signals||{}).filter(function(name){return e.signals[name]===true;}).join(', '),JSON.stringify(e)];
  }));
  t.setColumnWidth(9,250);t.setColumnWidth(10,500);sheet.setColumnWidth(2,250);
}
