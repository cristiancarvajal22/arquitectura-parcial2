const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {files,root}=require('../helpers/machine.cjs');
function environment(){
 const properties=new Map(),sheets=new Map();let held=false;
 function sheet(name){if(sheets.has(name))return sheets.get(name);const cells=new Map();
  const s={name,getRange(row,col,rows=1,cols=1){if(typeof row==='string'){
   const m=/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/.exec(row);if(!m)throw new Error('Bad A1 '+row);
   const column=x=>[...x].reduce((v,c)=>v*26+c.charCodeAt(0)-64,0);row=Number(m[2]);col=column(m[1]);rows=m[4]?Number(m[4])-row+1:1;cols=m[3]?column(m[3])-col+1:1;}
   const range={setValues(values){assert.equal(values.length,rows);for(let r=0;r<rows;r++){assert.equal(values[r].length,cols);for(let c=0;c<cols;c++)cells.set((row+r)+','+(col+c),values[r][c]);}return range;},
    setValue(v){cells.set(row+','+col,v);return range;},getValue(){const v=cells.get(row+','+col);return v===undefined?'':v;},
    getValues(){return Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>{const v=cells.get((row+r)+','+(col+c));return v===undefined?'':typeof v==='string'&&v.startsWith("'")?v.slice(1):v;}));},
    getDisplayValues(){return range.getValues().map(r=>r.map(String));},clearContent(){for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)cells.delete((row+r)+','+(col+c));return range;}};
   for(const method of ['setNumberFormat','setFontWeight','setFontSize','setHorizontalAlignment','setBackground','setBackgrounds','setFontColor'])range[method]=()=>range;
   return range;},getLastRow(){return Math.max(1,...[...cells.keys()].map(k=>Number(k.split(',')[0])));},
   setFrozenRows(){},setColumnWidths(){},setColumnWidth(){},cells};sheets.set(name,s);return s;}
 const spreadsheet={getSheetByName:n=>sheets.get(n)||null,insertSheet:sheet,setActiveSheet(){}};
 const props={getProperty:k=>properties.has(k)?properties.get(k):null,setProperty(k,v){properties.set(k,v);},setProperties(values){for(const [k,v]of Object.entries(values))properties.set(k,v);}};
 const ui={createMenu(){return {addItem(){return this;},addToUi(){}};},showSidebar(){}};
 const c=vm.createContext({console,SpreadsheetApp:{getActiveSpreadsheet:()=>spreadsheet,getUi:()=>ui,flush(){}},
  PropertiesService:{getScriptProperties:()=>props},LockService:{getScriptLock:()=>({tryLock(){if(held)return false;held=true;return true;},releaseLock(){held=false;}})},HtmlService:{createHtmlOutput:html=>({setTitle(){return this;}})}});
 for(const file of files.concat(['assembler/catalog.js','core/clock.js','core/clock-store.js','sheets/lcd-view.js','sheets/app.js']))vm.runInContext(fs.readFileSync(path.join(root,'src',file),'utf8'),c,{filename:file});
 return {c,sheets,properties};
}
test('Sheets setup, persistent load, actual OUT, render and coherent reset',()=>{
 const {c,sheets}=environment();c.P2_Setup();let record=c.P2_Read();assert.equal(record.state.profile.status,'proposal');
 record=c.P2_Change('activate',{});assert.equal(record.state.profile.status,'ready');
 record=c.P2_Change('load',{source:'MOV DX, 65\nOUT [LCD], DX\nHALT',expectedRevision:record.state.revision});
 for(let i=0;i<100&&record.state.execution.mode!=='halted';i++)record=c.P2_Dispatch({action:'run',epoch:record.epoch,sequence:record.sequence+1,expectedRevision:record.state.revision,limit:8});
 assert.equal(record.state.execution.mode,'halted');assert.equal(record.state.ram.bytes[232],65);
 assert.equal(sheets.get('LCD_P2_023').getRange('A5').getValues()[0][0],'A');
 assert.ok(sheets.get('Traza').getLastRow()>100);assert.equal(sheets.get('MMU_P2_011').getRange('A21').getValue(),15);
 const previous=record;record=c.P2_Dispatch({action:'reset',epoch:record.epoch,sequence:record.sequence+1,expectedRevision:record.state.revision});
 assert.equal(record.epoch,previous.epoch+1);assert.equal(record.state.profile.status,'ready');assert.equal(record.state.metrics.l1i.hits,0);assert.equal(record.state.cpu.pc,0);assert.equal(record.state.io.lcd.cursor,0);
 assert.equal(sheets.get('LCD_P2_023').getRange('A5').getValues()[0][0],' ');
});
test('sidebar client script compiles and does not use blocking prompt',()=>{
 const {c}=environment();const html=c.P2_Sidebar();new vm.Script(html.match(/<script>([\s\S]*)<\/script>/)[1]);assert.ok(!html.includes('ui.prompt'));
});
test('editor load rejects invalid source without changing persistent state',()=>{
 const {c}=environment();c.P2_Setup();let record=c.P2_Change('activate',{});const before=JSON.stringify(c.P2_Read());
 assert.throws(()=>c.P2_Change('load',{source:'MOV AX, 999',expectedRevision:record.state.revision}));assert.equal(JSON.stringify(c.P2_Read()),before);
});
