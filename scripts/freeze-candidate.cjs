const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
if(Date.now()>=Date.parse('2026-11-09T14:00:00Z'))throw new Error('Cierre 10:00 Bolivia alcanzado: no generar otra entrega.');
const text=fs.readFileSync(path.join(root,'dist/SimuladorP2.gs'),'utf8').replace(/\r\n/g,'\n');
const demos=JSON.parse(fs.readFileSync(path.join(root,'docs/evidence/integration/demos.json'),'utf8'));
const tap=fs.readFileSync(path.join(root,'integration.tap'),'utf8');
const tests=Number(tap.match(/^# tests (\d+)/m)[1]),passed=Number(tap.match(/^# pass (\d+)/m)[1]),failed=Number(tap.match(/^# fail (\d+)/m)[1]);
if(tests!==passed||failed!==0)throw new Error('La candidata requiere una regresion completa aprobada.');
const manifest={kind:'review-candidate-not-main-release',sourceCommit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
 deadline:'2026-11-09T10:00:00-04:00',bundle:'dist/SimuladorP2.gs',bundleSha256LF:crypto.createHash('sha256').update(text).digest('hex'),
 node:process.version,localRegression:{tests:tests,passed:passed,failed:failed},demos:demos.map(d=>({id:d.demo,microSteps:d.microSteps,registers:d.registers,lcd:d.lcd})),
 liveSpreadsheet:'https://docs.google.com/spreadsheets/d/1VhOJ5jGlvC1rMByyLyrB1OWXCSWokwGDJDajLnvnqLE/edit',
 pending:['Verify integrated build in the real spreadsheet','Peer approval and merge into develop','Verify access from another account','Review develop-to-main release','Marcelo performs oral rehearsal']};
fs.mkdirSync(path.join(root,'release'),{recursive:true});fs.writeFileSync(path.join(root,'release/candidate.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Candidate checksum:',manifest.bundleSha256LF);
