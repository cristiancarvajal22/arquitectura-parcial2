const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const files=['buses/arbiter.js','buses/microword.js','cpu/registers-alu.js',
 'cpu/decoder.js','cpu/microcode.js','memory/ram.js','memory/fifo.js','memory/swap.js',
 'memory/mmu.js','memory/mmu-state.js','memory/mmu-access.js','cache/l1i.js',
 'cache/l1d.js','cache/l2.js','cache/coherence.js','cache/metrics.js','io/keyboard.js',
 'io/lcd.js','assembler/parser.js','core/machine.js'];
function machine(){const c=vm.createContext({console});for(const file of files)vm.runInContext(fs.readFileSync(path.join(root,'src',file),'utf8'),c,{filename:file});return c.P2Machine;}
function execute(api,state,max=30000){const events=[];for(let i=0;i<max;i++){
 const r=api.step(state,{requestId:'test-'+state.revision,expectedRevision:state.revision});
 if(r.status==='rejected')throw new Error(JSON.stringify(r.error));state=r.state;events.push(...r.events);
 if(r.status==='pending'||state.execution.mode==='halted')return {state,events,status:r.status};
 }throw new Error('Execution limit');}
module.exports={machine,execute,files,root};
