const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync('src/memory/swap.js','utf8'),ctx);
const copy=x=>JSON.parse(JSON.stringify(x));
test('16 pages of 32 bytes, separate initial image and writable backing store',()=>{const image=Array.from({length:512},(_,i)=>i%256),s=ctx.swapCreate(image);
 assert.equal(s.pages.length,16);assert.ok(s.pages.every(p=>p.length===32));s.pages[0][0]=77;image[32]=99;
 assert.equal(s.initialPages[0][0],0);assert.equal(s.pages[1][0],32);});
test('modified page roundtrip preserves all 32 bytes and neighbors',()=>{let s=ctx.swapCreate();const before=copy(s),data=Array.from({length:32},(_,i)=>255-i);
 const n=ctx.swapWritePage(s,3,data);assert.deepEqual(copy(ctx.swapReadPage(n,3)),data);
 assert.deepEqual(copy(s),before);for(let i=0;i<16;i++)if(i!==3)assert.deepEqual(copy(n.pages[i]),before.pages[i]);
 data[0]=0;const read=ctx.swapReadPage(n,3);read[1]=0;assert.equal(n.pages[3][0],255);assert.equal(n.pages[3][1],254);});
test('reset is empty, reload restores image rather than dirty backing',()=>{const image=Array(512).fill(9),s=ctx.swapCreate(image),n=ctx.swapWritePage(s,4,Array(32).fill(7));
 assert.equal(ctx.swapRestoreImage(n).pages[4][0],9);assert.equal(ctx.swapReset().pages[4][0],0);assert.equal(n.pages[4][0],7);});
test('all page boundaries 0..15 copy exactly',()=>{let s=ctx.swapCreate();for(let i=0;i<16;i++)s=ctx.swapWritePage(s,i,Array(32).fill(i));
 for(let i=0;i<16;i++)assert.deepEqual(copy(ctx.swapReadPage(s,i)),Array(32).fill(i));});
test('bad VPN and lengths reject without mutation',()=>{const s=ctx.swapCreate(),before=copy(s);for(const vpn of [-1,16,0.5,'2',NaN])assert.throws(()=>ctx.swapReadPage(s,vpn),/INVALID_VPN/);
 for(const n of [0,31,33])assert.throws(()=>ctx.swapWritePage(s,0,Array(n).fill(0)),/INVALID_LENGTH/);assert.deepEqual(copy(s),before);});
test('invalid bytes and sparse arrays are rejected',()=>{for(const value of [-1,256,0.5,'3',undefined,NaN]){let p=Array(32).fill(0);p[31]=value;assert.throws(()=>ctx.swapWritePage(ctx.swapCreate(),0,p),/INVALID_BYTE/);}
 assert.throws(()=>ctx.swapCreate(Array(512)),/INVALID_BYTE/);assert.throws(()=>ctx.swapCreate(Array(511).fill(0)),/INVALID_LENGTH/);});
function fixture(){return JSON.parse(fs.readFileSync('docs/examples/core/reset.snapshot.json','utf8'));}
test('attach image keeps RAM at 256 bytes and preserves CPU/MMU',()=>{const s=fixture(),before=copy(s),n=ctx.swapAttachImage(s,Array(512).fill(1));assert.equal(n.ram.bytes.length,256);
 assert.deepEqual(copy(n.ram),copy(s.ram));assert.deepEqual(copy(n.cpu),s.cpu);assert.deepEqual(copy(n.mmu),copy(s.mmu));assert.deepEqual(copy(s),before);});
test('save mapped frame preserves RAM, page table and initial image',()=>{let s=ctx.swapAttachImage(fixture());s.ram.frames[6]={pfn:6,vpn:3,pinned:false};s.mmu.pages[3]={vpn:3,pfn:6,present:true,pinned:false,dirty:true,referenced:true};
 for(let i=0;i<32;i++)s.ram.bytes[192+i]=i+100;let before=copy(s),n=ctx.swapSaveFrame(s,3,6);
 assert.deepEqual(copy(n.swap.pages[3]),copy(s.ram.bytes.slice(192,224)));assert.deepEqual(copy(n.ram),copy(s.ram));assert.deepEqual(copy(n.mmu),copy(s.mmu));assert.deepEqual(copy(s),before);assert.ok(n.swap.initialPages[3].every(x=>x===0));});
test('saving pinned I/O or a mismatched frame is rejected',()=>{const s=ctx.swapAttachImage(fixture());assert.throws(()=>ctx.swapSaveFrame(s,15,7),/IO_PROTECTED/);assert.throws(()=>ctx.swapSaveFrame(s,3,6),/INVALID_MAPPING/);});
test('corrupt backing store rejects before writing',()=>{const s=ctx.swapCreate();s.pages[5].pop();assert.throws(()=>ctx.swapWritePage(s,1,Array(32).fill(7)),/INVALID_LENGTH/);});
