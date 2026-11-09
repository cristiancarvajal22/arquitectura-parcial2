const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const log=cp.execFileSync('git',['log','--no-merges','--format=%H%x09%an%x09%aI%x09%s','origin/develop..HEAD'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean).map(line=>{
 const [sha,author,date,...subject]=line.split('\t');return {sha,author,date,subject:subject.join('\t')};});
const authors={};for(const commit of log)authors[commit.author]=(authors[commit.author]||0)+1;
const own=log.filter(c=>c.author==='marceloaguilera777');
const result={scope:'origin/develop..HEAD; non-merge commits only',sourceCommit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),authors,marceloCommits:own,
 review:'Peer review, oral rehearsal and actual Sheets deployment are not inferred from commit counts.'};
fs.writeFileSync(path.join(root,'docs/evidence/marcelo-commits.json'),JSON.stringify(result,null,2)+'\n');
console.log('Real non-merge commits:',JSON.stringify(authors));
