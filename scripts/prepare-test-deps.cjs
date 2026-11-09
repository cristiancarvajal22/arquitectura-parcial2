const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),target=path.join(root,'.test-deps');fs.mkdirSync(target,{recursive:true});
for(const file of fs.readdirSync(path.join(root,'tests/dependencies'))){if(!file.endsWith('.json'))continue;
 for(const item of JSON.parse(fs.readFileSync(path.join(root,'tests/dependencies',file),'utf8'))){
  const data=cp.execFileSync('git',['cat-file','blob',item.blob],{cwd:root});fs.writeFileSync(path.join(target,item.file),data);
 }
}
console.log('Pinned team dependencies restored from original Git blobs.');
