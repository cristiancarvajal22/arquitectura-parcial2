// Load an explicitly pinned repository module without modifying this checkout.
const {execFileSync}=require('node:child_process'),vm=require('node:vm'),path=require('node:path');
module.exports=function(sha,file){
 if(!/^[a-f0-9]{40}$/.test(sha)||!/^src\/[a-z0-9/-]+\.js$/.test(file))throw Error('Invalid pinned module');
 const source=execFileSync('git',['show',sha+':'+file],{cwd:path.resolve(__dirname,'../..'),encoding:'utf8'});
 const context={module:{exports:{}},JSON,Number,Array,Object,Set,Error,RangeError};
 vm.runInNewContext(source,context,{filename:file,timeout:5000});return context.module.exports;
};
