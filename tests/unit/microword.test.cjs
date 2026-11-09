const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({});['src/buses/microword.js','src/ui/microword-sheet.js'].forEach(f=>vm.runInContext(fs.readFileSync(f,'utf8'),ctx));
const clone=x=>JSON.parse(JSON.stringify(x));
function event(active,driver,receiver,segment='internalData'){
 const signals=Object.fromEntries(Array.from(ctx.microWordSignals).map(s=>[s,active.includes(s)]));
 return {result:'committed',controlWord:null,signals,segments:Object.entries({internalAddress:9,externalAddress:8,internalData:8,externalData:8}).map(([name,widthBits])=>({name,widthBits,
 level:name===segment?'driven':'Z',value:name===segment?42:null,driver:name===segment?driver:null,receivers:name===segment?[receiver]:[]}))};}
const cases=[
 ['fetch',['En_PC','Ld_MAR','Clock'],'PC','MAR','internalAddress',67117312],
 ['ALU',['En_ALU','Ld_AX','Clock'],'ALU','AX','internalData',67174402],
 ['read',['En_RAM','Ld_MDR','Read','Mem_R','Clock'],'RAM','MDR','externalData',352616448],
 ['write',['En_MDR','Ld_RAM','Write','Mem_W','Clock'],'MDR','RAM','externalData',638074880],
 ['IN',['En_KBD','Ld_MDR','Read','IO','Clock'],'KBD','MDR','externalData',219185152],
 ['OUT',['En_MDR','Ld_LCD','Write','IO','Clock'],'MDR','LCD','externalData',243286016]
];
test('projects the existing repository PC-to-MAR event without changes',()=>{
 const e=JSON.parse(fs.readFileSync('docs/examples/core/pc-to-mar.event.json','utf8'));
 assert.equal(ctx.microWordView(e).word,67117312);
});
for(const [name,active,d,r,seg,expected] of cases)test(name+' bits, actions and no mutation',()=>{const e=event(active,d,r,seg),before=clone(e),v=ctx.microWordView(e);
 assert.equal(v.word,expected);assert.equal(v.binary.length,30);assert.equal(parseInt(v.binary,2),expected);assert.equal(v.rows.filter(r=>r[2]===1).length,active.length);
 assert.equal(v.rows.find(r=>r[1]==='En_'+d)[4],'DRIVING');assert.deepEqual(e,before);});
test('inactive drivers High-Z, inactive loads HOLD, not bus zero',()=>{const v=ctx.microWordView(event(['En_PC','Ld_MAR','Clock'],'PC','MAR','internalAddress'));
 assert.equal(v.rows.find(r=>r[1]==='En_AX')[4],'High-Z');assert.equal(v.rows.find(r=>r[1]==='Ld_AX')[4],'HOLD');});
test('reject mismatch, unknown signals, conflicting control and invalid driver',()=>{let e=event(['En_PC','Ld_MAR','Clock'],'PC','MAR','internalAddress');
 e.controlWord=1;assert.throws(()=>ctx.microWordView(e),/WORD_MISMATCH/);e.controlWord=null;e.signals.Read=true;e.signals.Write=true;assert.throws(()=>ctx.microWordView(e),/INVALID_CONTROL/);
 e.signals.Read=false;e.signals.Write=false;e.signals.En_PC=false;assert.throws(()=>ctx.microWordView(e),/INVALID_DRIVER/);});
test('reject High-Z with receivers and missing segments',()=>{const e=event(['En_PC','Ld_MAR','Clock'],'PC','MAR','internalAddress');
 e.segments[1].receivers=['MAR'];assert.throws(()=>ctx.microWordView(e),/INVALID_HIGH_Z/);e.segments.pop();e.segments[1].receivers=[];assert.throws(()=>ctx.microWordView(e),/MISSING_SEGMENT/);});
test('Sheets adapter writes full table, colors, and validates before drawing',()=>{let rows,colors,calls=0;const sheet={getRange:()=>({setValues:r=>{rows=r;calls++;},setBackgrounds:c=>{colors=c;}}),setFrozenRows:()=>{}};
 const book={getSheetByName:()=>sheet};let e=event(['En_PC','Ld_MAR','Clock'],'PC','MAR','internalAddress');ctx.microWordRender(e,book);
 assert.equal(rows.length,34);assert.equal(colors.length,30);assert.equal(rows[2][1][0],"'");e.controlWord=0;assert.throws(()=>ctx.microWordRender(e,book));assert.equal(calls,1);});
