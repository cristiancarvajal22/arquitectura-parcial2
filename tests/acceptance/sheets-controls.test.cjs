const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Execute the generated deployment package with in-memory Sheets services.
const bundle = fs.readFileSync('dist/Simulador.gs', 'utf8');
function workbook() {
  const tabs = new Map();
  const properties = new Map();
  let prompt = '';
  const ui = {
    Button: {OK:'ok'}, ButtonSet: {OK_CANCEL:'ok-cancel'},
    prompt: () => ({getSelectedButton: () => 'ok', getResponseText: () => prompt}),
    createMenu() { return {addItem(){return this;},addSeparator(){return this;},addToUi(){}}; }
  };
  const book = {
    getSheetByName: name => tabs.get(name),
    insertSheet(name) {
      const cells = new Map();
      const range = (row, col, height = 1, width = 1) => ({
        setValue(value){return this.setValues([[value]]);},
        setValues(values){
          assert.equal(values.length,height);
          values.forEach((line,y)=>{
            assert.equal(line.length,width);
            line.forEach((value,x)=>cells.set([row+y,col+x].join(','),value));
          });
          return this;
        },
        getValue(){return this.getValues()[0][0];},
        getValues(){
          return Array.from({length:height},(_,y)=>Array.from({length:width},(_,x)=>cells.get([row+y,col+x].join(','))??''));
        },
        setWrap(){return this;},setBackground(){return this;},
        setFontColor(){return this;},setFontWeight(){return this;}
      });
      const tab = {
        clearContents:()=>cells.clear(), setColumnWidth(){}, setRowHeight(){}, setFrozenRows(){},
        getLastRow:()=>Math.max(0,...Array.from(cells.keys(),key=>Number(key.split(',')[0]))),
        getDataRange(){return range(1,1,Math.max(1,this.getLastRow()),2);},
        getRange(a,b,h,w){
          if(typeof a==='number')return range(a,b,h,w);
          const [,startCol,startRow,endCol,endRow]=a.match(/^([A-Z])(\d+)(?::([A-Z])(\d+))?$/);
          const col = startCol.charCodeAt(0)-64;
          return range(Number(startRow),col,endRow?Number(endRow)-Number(startRow)+1:1,endCol?endCol.charCodeAt(0)-64-col+1:1);
        }
      };
      tabs.set(name,tab);
      return tab;
    }
  };
  const api = vm.createContext({
    SpreadsheetApp: {getActiveSpreadsheet:()=>book,getUi:()=>ui},
    LockService: {getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},
    PropertiesService:{getScriptProperties:()=>({
      getProperty:key=>properties.get(key)??null,
      setProperty:(key,value)=>properties.set(key,value),
      setProperties:values=>Object.entries(values).forEach(([key,value])=>properties.set(key,value))
    })}
  });
  vm.runInContext(bundle,api);
  api.simSetup();
  return {api,tabs,answer:value=>{prompt=value;}};
}

for (const program of ['Aritmetica','Eco','Memoria']) {
  for (const control of ['simStep','simRun']) {
    test(program+' reaches HALT through '+control+' after a reset',()=>{
      const {api,tabs,answer}=workbook();
      const editor=tabs.get('Editor');
      editor.getRange('B2').setValue(program);
      api.simSelect();
      api.simLoad();
      api.simPause();
      api.simReset();
      if(program==='Eco'){
        api[control]();
        if(control==='simStep')api[control]();
        assert.equal(editor.getRange('B4').getValue(),'Esperando teclado');
        answer('ABCDEFGH');api.simKeyboard();
      }
      let state;
      for(let i=0;i<100;i++){
        api[control]();
        state=api.simStore().load();
        if(state.execution.mode==='halted')break;
      }
      assert.equal(state.execution.mode,'halted');
      assert.equal(tabs.get('Estado').getRange('B2').getValue(),'halted');
      assert.ok(tabs.get('Traza').getLastRow()>1);
      if(program==='Aritmetica'){
        assert.deepEqual(JSON.parse(JSON.stringify(state.cpu.registers)),{AX:15,BX:6,CX:5,DX:5});
        const pa=state.mmu.pages[9].pfn*32+12;
        assert.equal(state.ram.bytes[pa],15);
      }else if(program==='Eco'){
        assert.equal(tabs.get('Estado').getRange('B13').getValue(),'ABCDEFGH');
        assert.equal(state.io.keyboard.count,0);
      }else{
        assert.equal(state.cpu.registers.DX,42);
        assert.ok(state.metrics.pageFaults>8);
      }
    });
  }
}

test('keyboard text starting with equals is written as a literal',()=>{
  const {api,tabs,answer}=workbook();
  tabs.get('Editor').getRange('B2').setValue('Eco');
  api.simSelect();api.simLoad();
  answer('=1+2');api.simKeyboard();
  assert.equal(tabs.get('Estado').getRange('B14').getValue(),"'=1+2");
  assert.equal(api.simStore().load().io.keyboard.count,4);
});
