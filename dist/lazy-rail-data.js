// Only selected systems retain railway geometry. A stale or aborted response
// must never restore a system the visitor has just closed.
globalThis.RailDataStore=class RailDataStore {
 constructor(files,{fetcher=globalThis.fetch,onChange=()=>{}}={}){this.files=files;this.fetcher=fetcher.bind(globalThis);this.onChange=onChange;this.records=new Map();this.wanted=new Set()}
 snapshot(){return {rails:[...this.records.values()].flatMap(r=>r.data||[]),states:Object.fromEntries([...this.records].map(([key,r])=>[key,{status:r.status,error:r.error||null}]))}}
 emit(){this.onChange(this.snapshot())}
 setWanted(keys){this.wanted=new Set(keys);for(const [key,record]of this.records){if(!this.wanted.has(key)){record.controller?.abort();record.data=null;this.records.delete(key)}}for(const key of this.wanted){if(this.files[key]&&!this.records.has(key))this.load(key)}this.emit()}
 load(key){const record={status:'loading',data:null,controller:new AbortController()};this.records.set(key,record);this.emit();record.promise=(async()=>{try{const response=await this.fetcher(this.files[key].url,{signal:record.controller.signal});if(!response.ok)throw Error('HTTP '+response.status);const rows=await response.json();if(!Array.isArray(rows))throw Error('Invalid railway data');if(this.records.get(key)!==record||!this.wanted.has(key))return;record.status='loaded';record.data=rows;record.controller=null;this.emit()}catch(error){if(this.records.get(key)!==record||!this.wanted.has(key))return;record.status='error';record.data=null;record.controller=null;record.error=error?.message?String(error.message).slice(0,180):'加载失败，请重试';this.emit()}finally{record.promise=null}})()}
 retry(key){if(!this.wanted.has(key))return;const old=this.records.get(key);if(old?.status==='loading')return;this.records.delete(key);this.load(key)}
 destroy(){this.wanted.clear();for(const r of this.records.values()){r.controller?.abort();r.data=null}this.records.clear();this.emit()}
};
