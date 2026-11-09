const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {machine,execute,root}=require('../tests/helpers/machine.cjs');
const c=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'src/assembler/catalog.js'),'utf8'),c);
const output=path.join(root,'docs/evidence/integration');fs.mkdirSync(output,{recursive:true});
const programs=path.join(root,'programs');fs.mkdirSync(programs,{recursive:true});
const results=[];
for(const demo of c.P2Catalog.list()){
 const api=machine();let loaded=api.load(api.create(api.profile(true)),demo.source);
 if(loaded.status!=='completed')throw new Error(JSON.stringify(loaded.error));
 let state=loaded.state;
 if(demo.input){const r=api.type(state,demo.input);if(r.status!=='completed')throw new Error('Keyboard input failed');state=r.state;}
 const run=execute(api,state,30000);if(run.state.execution.mode!=='halted')throw new Error('Demo did not halt: '+demo.id);
 const lcd=run.state.ram.bytes.slice(232,240).map(b=>String.fromCharCode(b)).join('');
 if(demo.id==='arithmetic'&&(run.state.cpu.registers.AX!==35||run.state.cpu.registers.DX!==5))throw new Error('Arithmetic mismatch');
 if(demo.id==='echo'&&(lcd!=='ABCDEFGH'||run.state.io.keyboard.count!==0))throw new Error('Echo mismatch');
 if(demo.id==='scattered'&&(run.state.cpu.registers.DX!==71||!run.events.some(e=>e.kind==='memory-save-page')))throw new Error('Page-fault mismatch');
 const trace=run.events.map(e=>({id:e.id,cycle:e.cycle,kind:e.kind,requestId:e.requestId,va:e.va,pa:e.pa,bytes:e.bytes,
  signals:Object.keys(e.signals).filter(k=>e.signals[k]),segments:e.segments.filter(s=>s.level!=='Z').map(s=>({name:s.name,value:s.value,driver:s.driver,receivers:s.receivers})),lookup:e.lookup||null}));
 const summary={demo:demo.id,environment:'Node.js local, real integrated motor; not a Google Sheets deployment claim',
  programSha256:crypto.createHash('sha256').update(demo.source).digest('hex'),microSteps:run.events.length,
  registers:run.state.cpu.registers,metrics:run.state.metrics,lcd:lcd,keyboardCount:run.state.io.keyboard.count,
  haltedAt:run.state.cpu.pc,expected:demo.expected};
 if(!process.argv.includes('--check')){
  fs.writeFileSync(path.join(programs,demo.id+'.asm'),demo.source+'\n');
  fs.writeFileSync(path.join(programs,demo.id+'.bytes.json'),JSON.stringify(loaded.state.program.sourceMap,null,2)+'\n');
  fs.writeFileSync(path.join(output,demo.id+'.trace.json'),JSON.stringify(trace)+'\n');
  fs.writeFileSync(path.join(output,demo.id+'.final.json'),JSON.stringify(run.state,null,2)+'\n');
 }
 results.push(summary);console.log(demo.id,run.events.length+' microsteps','PASS');
}
if(!process.argv.includes('--check'))fs.writeFileSync(path.join(output,'demos.json'),JSON.stringify(results,null,2)+'\n');
