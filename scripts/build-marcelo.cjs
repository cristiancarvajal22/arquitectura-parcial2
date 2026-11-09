const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const files=require('../tests/helpers/machine.cjs').files.concat([
 'assembler/catalog.js','core/clock.js','core/clock-store.js',
 'sheets/lcd-view.js','sheets/marcelo-app.js'
]);
const out='/** Generated from src by scripts/build-marcelo.cjs. No credentials. */\n'+files.map(file=>
 '\n// ===== '+file+' =====\n'+fs.readFileSync(path.join(root,'src',file),'utf8').replace(/\r\n/g,'\n')).join('\n')+'\nfunction onOpen(){P2_InstallMenu();}\n';
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
const target=path.join(root,'dist/SimuladorP2.gs');
if(process.argv.includes('--check')){
 if(!fs.existsSync(target)||fs.readFileSync(target,'utf8').replace(/\r\n/g,'\n')!==out)throw new Error('Regenerate dist/SimuladorP2.gs');
}else fs.writeFileSync(target,out);
new (require('node:vm').Script)(out,{filename:'SimuladorP2.gs'});
console.log('Apps Script bundle verified:',Buffer.byteLength(out),'bytes');
