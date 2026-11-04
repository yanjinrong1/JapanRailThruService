const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(__dirname+'/../dist/lazy-rail-data.js','utf8');
const c=vm.createContext({AbortController});vm.runInContext(`
globalThis.requests=0;globalThis.fail=false;
globalThis.fetch=function(){if(this!==globalThis)throw new TypeError("Failed to execute 'fetch' on 'Window': Illegal invocation");requests++;return Promise.resolve({ok:!fail,status:fail?503:200,json:async()=>[{id:'loaded'}]})};`,c);
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
 vm.runInContext(code.replace('fetcher.bind(globalThis)','fetcher'),c);vm.runInContext("globalThis.broken=new RailDataStore({one:{url:'one.json'}});broken.setWanted(['one'])",c);await tick();assert.equal(c.broken.snapshot().states.one.status,'error');assert(c.broken.snapshot().states.one.error.includes('Illegal invocation'));assert.equal(c.requests,0,'Wrong receiver fails before a network request');
 vm.runInContext(code,c);vm.runInContext("globalThis.fixed=new RailDataStore({one:{url:'one.json'}});fixed.setWanted(['one'])",c);await tick();assert.equal(c.fixed.snapshot().states.one.status,'loaded');assert.equal(c.fixed.snapshot().rails[0].id,'loaded');assert.equal(c.requests,1);
 c.fixed.setWanted([]);c.fail=true;c.fixed.setWanted(['one']);await tick();assert.equal(c.fixed.snapshot().states.one.error,'HTTP 503');c.fail=false;c.fixed.retry('one');await tick();assert.equal(c.fixed.snapshot().states.one.status,'loaded');assert.equal(c.requests,3);
 console.log('PASS: reproduced old browser Illegal invocation before network dispatch; fixed Window receiver permits load and retry; genuine HTTP failure remains visible.');
})().catch(e=>{console.error(e);process.exitCode=1});
