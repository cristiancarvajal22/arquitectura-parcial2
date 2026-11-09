const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({});
for(const file of ['mmu.js','mmu-state.js','mmu-access.js','fifo.js','coherence.js','swap.js','ram.js'])vm.runInContext(fs.readFileSync('.test-deps/'+file,'utf8'),context);
vm.runInContext(fs.readFileSync('src/memory/page-coherence.js','utf8'),context);
const api=context.PageCoherence({validateSnapshot:context.mmuValidateSnapshot,resolveAccess:context.mmuResolveAccess,fifo:context.PageFifo,
 swapValidate:context.swapValidate,readPage:context.swapReadPage,saveFrame:context.swapSaveFrame,invalidate:context.CacheCoherence.invalidate});
const copy=x=>JSON.parse(JSON.stringify(x));
function initial(){let s=JSON.parse(fs.readFileSync('docs/examples/core/reset.snapshot.json','utf8'));
 s.ram=copy(context.PhysicalRam.reset());s.profile.ioMap.keyboard={va:480,pa:224,length:8};s.profile.ioMap.lcd={va:488,pa:232,length:8};s.io.keyboard.basePa=224;s.io.lcd.basePa=232;
 return context.swapAttachImage(s,Array.from({length:512},(_,i)=>Math.floor(i/32)));}
function load(s,vpn){let p=api.prepare(s,vpn);return p.status==='resident'?p.state:api.finish(s,p,copy(p.bytes)).state;}
function access(s,va,kind='read',io=false,endpoint=null){return api.markAccess(s,{va,kind,io,endpoint});}
function warm(s,pa){for(const key of ['l1i','l1d'])s.caches[key]={valid:true,tag:Math.floor(pa/8),dirty:false,bytes:s.ram.bytes.slice(pa-pa%8,pa-pa%8+8)};
 s.caches.l2.lines[0]=copy(s.caches.l1d);s.caches.l2.fifo=[0];}
test('read and fetch mark Reference even when the cache is hot',()=>{for(const kind of ['read','fetch']){let s=load(initial(),0);warm(s,0);let r=access(s,4,kind);assert.equal(r.state.mmu.pages[0].referenced,true);assert.equal(r.state.mmu.pages[0].dirty,false);assert.equal(s.mmu.pages[0].referenced,false);}});
test('committed write marks Dirty and Reference on a hot cache',()=>{let s=load(initial(),0);warm(s,0);s.ram=context.PhysicalRam.write(s.ram,4,99).ram;let r=access(s,4,'write');assert.equal(r.state.mmu.pages[0].dirty,true);assert.equal(r.state.mmu.pages[0].referenced,true);});
test('I/O bypass does not dirty/reference the reserved page',()=>{let s=initial(),r=access(s,480,'read',true,'KBD');assert.equal(r.cacheable,false);assert.deepEqual(copy(r.state.mmu.pages[15]),copy(s.mmu.pages[15]));assert.throws(()=>access(s,480,'write',true,'KBD'),/IO_PROTECTED/);});
test('absent page returns pending with no mutations',()=>{let s=initial(),r=access(s,100);assert.equal(r.status,'pending');assert.deepEqual(copy(r.state),copy(s));});
test('dirty write -> FIFO eviction -> reload preserves all 32 bytes',()=>{let s=load(initial(),0);for(let i=0;i<32;i++)s.ram=context.PhysicalRam.write(s.ram,i,200+i).ram;s=access(s,4,'write').state;warm(s,0);
 for(let v=1;v<=6;v++)s=load(s,v);let before=copy(s),plan=api.prepare(s,7);assert.equal(plan.decision.victim,0);assert.equal(plan.trace[0].kind,'swap-save');assert.equal(plan.trace[1].kind,'invalidate-frame');assert.equal(plan.state.caches.l1d.valid,false);assert.equal(plan.state.caches.l1i.valid,false);assert.equal(plan.state.caches.l2.lines[0].valid,false);
 assert.deepEqual(copy(s),before);s=api.finish(s,plan,copy(plan.bytes)).state;assert.equal(s.mmu.pages[0].present,false);assert.equal(s.ram.bytes[4],7);
 s=load(s,0);const pfn=s.mmu.pages[0].pfn;assert.deepEqual(copy(s.ram.bytes.slice(pfn*32,pfn*32+32)),Array.from({length:32},(_,i)=>200+i));assert.equal(s.ram.bytes.length,256);assert.equal(s.ram.frames[7].vpn,15);});
test('frame invalidation preserves neighboring cache lines and FIFO entries',()=>{let s=initial();for(let i=0;i<7;i++)s=load(s,i);warm(s,0);s.caches.l2.lines[1]={valid:true,tag:4,dirty:false,bytes:Array(8).fill(1)};s.caches.l2.fifo.push(1);const p=api.prepare(s,7);assert.equal(p.state.caches.l2.lines[1].valid,true);assert.deepEqual(copy(p.state.caches.l2.fifo),[1]);});
test('stale, altered or incomplete loads never modify the current snapshot',()=>{let s=initial(),p=api.prepare(s,0),before=copy(s);assert.throws(()=>api.finish(s,p,Array(31).fill(0)),/INCOMPLETE_TRANSFER/);assert.throws(()=>api.finish(s,p,Array(32)),/INCOMPLETE_TRANSFER/);let altered=copy(p);altered.state.ram.bytes[0]=99;assert.throws(()=>api.finish(s,altered,p.bytes),/ALTERED/);let changed=copy(s);changed.revision++;assert.throws(()=>api.finish(changed,p,p.bytes),/STALE/);assert.deepEqual(copy(s),before);});
test('dirty cache blocks frame reuse instead of losing writeback',()=>{let s=initial();for(let i=0;i<7;i++)s=load(s,i);warm(s,0);s.caches.l1d.dirty=true;assert.throws(()=>api.prepare(s,7),/CACHE_WRITEBACK_REQUIRED/);assert.equal(s.ram.frames[0].vpn,0);});
test('resident lookup and repeated reset remain deterministic',()=>{let s=load(initial(),0);let p=api.prepare(s,0);assert.equal(p.status,'resident');assert.deepEqual(copy(p.state),copy(s));assert.deepEqual(copy(initial()),copy(initial()));});
test('frame reuse cancels an L2 fill even without valid resident lines',()=>{let s=initial();s.caches.l2.generation=5;const p=api.prepare(s,0);assert.equal(p.state.caches.l2.generation,6);assert.equal(s.caches.l2.generation,5);});
