const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm');
const ctx=vm.createContext({});
['clock.js','clock-store.js'].forEach(f=>vm.runInContext(fs.readFileSync('src/core/'+f,'utf8'),ctx));
const copy=x=>JSON.parse(JSON.stringify(x));
function state(){return {schemaVersion:1,profile:{status:'ready',pendingIssues:[]},revision:0,
  cpu:{control:{signals:{Clock:false},word:null}},clock:{cycle:0,microStep:0,phase:'idle'},
  execution:{mode:'idle',pendingRequest:null},lastEvent:null};}
function motor(s,r){s.revision++;s.clock.cycle++;s.clock.microStep++;return {status:'completed',state:s,events:[]};}
function harness(m=motor){let data=null, held=false;const store={load:()=>copy(data),save:x=>{data=copy(x);}};
 const lock={tryLock:()=>{if(held)return false;held=true;return true;},releaseLock:()=>{held=false;}};
 const c=ctx.clockController(store,lock,m,state); c.initialize();
 const send=(action,limit=1)=>{let v=c.read();return c.dispatch({epoch:v.epoch,sequence:v.sequence+1,expectedRevision:v.state.revision,action,limit});};
 return {c,send,store,lock};}
test('step advances once; retry returns same durable receipt',()=>{const h=harness();let q={epoch:1,sequence:1,expectedRevision:0,action:'step'};
 const a=h.c.dispatch(q), b=h.c.dispatch(q);assert.equal(a.state.clock.cycle,1);assert.deepEqual(copy(a),copy(b));});
test('run is bounded; pause/resume preserves progress',()=>{const h=harness();assert.equal(h.send('run',8).state.clock.cycle,8);
 assert.throws(()=>h.send('step'),/PAUSE_FIRST/);h.send('pause');assert.equal(h.send('step').state.clock.cycle,9);
 assert.equal(h.send('run',2).state.clock.cycle,11);assert.throws(()=>h.send('run',9),/INVALID_BATCH/);});
test('stale requests and busy lock do not mutate',()=>{const h=harness();h.send('step');let before=copy(h.c.read());
 assert.throws(()=>h.c.dispatch({epoch:1,sequence:2,expectedRevision:0,action:'step'}),/STALE_REVISION/);
 h.lock.tryLock();assert.throws(()=>h.c.dispatch({}),/BUSY/);h.lock.releaseLock();assert.deepEqual(copy(h.c.read()),before);});
test('pending wait persists; reset discards it and invalidates old session',()=>{const h=harness((s,r)=>{s.revision++;s.execution.pendingRequest={requestId:'keyboard'};return {status:'pending',state:s,events:[]};});
 assert.equal(h.send('run',8).status,'pending');let out=h.send('reset');assert.equal(out.state.execution.pendingRequest,null);assert.equal(out.epoch,2);
 assert.throws(()=>h.c.dispatch({epoch:1,sequence:3,expectedRevision:0,action:'step'}),/STALE_SESSION/);});
test('motor failure rolls back whole uncommitted batch and releases lock',()=>{let n=0;const h=harness((s,r)=>{if(++n===2)throw Error('FAULT');return motor(s,r);});
 let before=copy(h.c.read());assert.throws(()=>h.send('run',3),/FAULT/);assert.deepEqual(copy(h.c.read()),before);h.send('step');});
test('proposal cannot execute and halted cannot be resumed by pause',()=>{const h=harness();let r=h.c.read();r.state.profile.status='proposal';h.store.save(r);assert.throws(()=>h.send('step'),/INVALID_PROFILE/);
 r.state.profile.status='ready';r.state.execution.mode='halted';h.store.save(r);assert.throws(()=>h.send('pause'),/RESET_REQUIRED/);h.send('reset');});
function props(){let values={};return {values,getProperty:k=>values[k]??null,setProperty:(k,v)=>{values[k]=v;},setProperties:o=>Object.assign(values,o)};}
test('chunk store roundtrip across reload and Unicode, each chunk <=7000 bytes',()=>{const p=props(),s=ctx.clockPropertyStore(p);let value={text:'á😀'.repeat(6000)};s.save(value);
 assert.deepEqual(copy(ctx.clockPropertyStore(p).load()),value);assert.ok(Object.values(p.values).every(v=>Buffer.byteLength(v)<=7000));});
test('partial chunk failure preserves published snapshot; retry recovers',()=>{const p=props(),s=ctx.clockPropertyStore(p);s.save({value:1});const original=p.setProperties;
 p.setProperties=o=>{p.values[Object.keys(o)[0]]=Object.values(o)[0];throw Error('DISK');};assert.throws(()=>s.save({value:'x'.repeat(20000)}),/DISK/);assert.equal(s.load().value,1);
 p.setProperties=original;s.save({value:2});assert.equal(s.load().value,2);});
test('manifest failure preserves old state and oversized save is rejected',()=>{const p=props(),s=ctx.clockPropertyStore(p);s.save({v:1});p.setProperty=()=>{throw Error('HEAD');};
 assert.throws(()=>s.save({v:2}),/HEAD/);assert.equal(s.load().v,1);assert.throws(()=>s.save({v:'x'.repeat(140001)}),/STORE_TOO_LARGE/);});
test('snapshot from actual contract persists without changing its contents',()=>{const p=props(),s=ctx.clockPropertyStore(p);
 const snapshot=JSON.parse(fs.readFileSync('docs/examples/core/reset.snapshot.json','utf8'));s.save({epoch:1,sequence:0,state:snapshot,receipt:null});assert.deepEqual(copy(s.load().state),snapshot);});
