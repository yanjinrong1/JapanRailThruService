const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context=vm.createContext({AbortController,console});vm.runInContext(fs.readFileSync(__dirname+'/../dist/lazy-rail-data.js','utf8'),context);
const requests=[],changes=[],fetcher=(url,{signal})=>new Promise(resolve=>requests.push({url,signal,resolve}));
const files={one:{url:'one.json'},two:{url:'two.json'}};
const store=new context.RailDataStore(files,{fetcher,onChange:s=>changes.push(s)});
const finish=async(request,rows,ok=true)=>{request.resolve({ok,status:ok?200:503,json:async()=>rows});await new Promise(r=>setImmediate(r))};
(async()=>{
 assert.equal(requests.length,0,'Bootstrap must not fetch railway geometry');store.setWanted(['one']);assert.equal(requests.length,1);assert.equal(requests[0].url,'one.json');assert.equal(store.snapshot().rails.length,0);store.setWanted(['one']);assert.equal(requests.length,1,'Do not duplicate an inflight fetch');await finish(requests[0],[{id:'first'}]);assert.equal(store.snapshot().rails.length,1);
 store.setWanted([]);assert.equal(store.records.size,0);assert.equal(store.snapshot().rails.length,0,'Release hidden geometry immediately');
 store.setWanted(['one']);const stale=requests[1];store.setWanted([]);assert(stale.signal.aborted);store.setWanted(['one']);assert.equal(requests.length,3);await finish(stale,[{id:'stale'}]);assert.equal(store.snapshot().rails.length,0,'Stale completion must not restore released data');await finish(requests[2],[{id:'fresh'}]);assert.equal(store.snapshot().rails[0].id,'fresh');
 store.setWanted(['one','two']);assert.equal(requests.length,4);await finish(requests[3],[],false);assert.equal(store.snapshot().states.two.status,'error');store.setWanted(['one','two']);assert.equal(requests.length,4,'Failure must not spin into retry loop');store.retry('two');assert.equal(requests.length,5);await finish(requests[4],[{id:'second'}]);assert.equal(store.snapshot().rails.length,2);store.destroy();assert.equal(store.records.size,0);assert.equal(store.snapshot().rails.length,0);
 console.log('PASS: no initial geometry fetch, explicit system-only requests, inflight deduplication, abort/release, close/reopen race protection and recoverable errors.');
})().catch(e=>{console.error(e);process.exitCode=1});
