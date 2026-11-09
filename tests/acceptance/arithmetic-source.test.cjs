const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'../..',p),'utf8');
const parser=require('../helpers/read-module.cjs')('src/assembler/parser.js');
test('ambas demos ensamblan y difieren en un solo byte inmediato',()=>{
 const x=parser.assemble(read('programs/arithmetic.asm')),y=parser.assemble(read('programs/arithmetic-variant.asm'));
 a.equal(x.ok,true);a.equal(y.ok,true);a.equal(x.bytes.length,44);
 a.deepEqual(Array.from(x.bytes.slice(16,20)),[48,0,1,0]);a.deepEqual(Array.from(x.bytes.slice(32,36)),[82,0,16,0]);
 a.deepEqual(Array.from(x.bytes.slice(36,44)),[33,0,44,1,0,0,0,0]);
 const changes=[];for(let i=0;i<x.bytes.length;i++)if(x.bytes[i]!==y.bytes[i])changes.push(i);
 a.deepEqual(changes,[10]);a.equal(x.bytes[10],5);a.equal(y.bytes[10],6);
});
test('catálogo y oráculo conservan rangos y resultados calculados',()=>{
 const catalog=JSON.parse(read('programs/catalog.json')),e=JSON.parse(read('programs/arithmetic.expected.json'));
 a.equal(catalog.programs.length,2);for(const p of catalog.programs){a.equal(parser.assemble(read(p.source)).bytes.length,p.codeBytes);a.ok(p.dataRanges[0].start>=p.codeBytes);}
 a.equal(e.final.AX,5*6/2);a.equal(e.variantFinal.AX,6*7/2);a.equal(e.instructionCount,4+5*5+2);
 a.deepEqual(e.iterations.map(x=>x.AX),[1,3,6,10,15]);
});
