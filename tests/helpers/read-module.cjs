// Load the integrated checkout so tests exercise the delivered source.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
module.exports=function(file){
 if(!/^src\/[a-z0-9/-]+\.js$/.test(file))throw Error('Invalid module path');
 const source=fs.readFileSync(path.join(__dirname,'../..',file),'utf8');
 const target={exports:{}};
 new vm.Script('(function(module,require){\n'+source+'\n})',{filename:file}).runInThisContext()(target,require('node:module').createRequire(path.join(__dirname,'../..',file)));
 return target.exports;
};
