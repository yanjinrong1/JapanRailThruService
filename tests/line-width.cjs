// DOM integration harness (linkedom is test-only, outside the shipped app).
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{parseHTML}=require(process.env.RAIL_DOM_MODULE||'linkedom');
const root=__dirname+'/../dist/',{document,window}=parseHTML(fs.readFileSync(root+'index.html','utf8'));
const overlay=document.createElement('div');overlay.className='leaflet-overlay-pane';overlay.innerHTML='<svg></svg>';document.body.append(overlay);
const zoomActions=[];const requests=[],storage=new Map(),frames=new Map();let frame=0;
const point=(x,y)=>({x,y,subtract(p){return point(this.x-p.x,this.y-p.y)}}),map={zoomIn(){zoomActions.push(1);return this},zoomOut(){zoomActions.push(-1);return this},setView(){return this},fitBounds(){return this},getZoom:()=>13,getPixelOrigin:()=>point(0,0),project:([lat,lng])=>point(lng*1000,-lat*1000),getSize:()=>point(1000,800),layerPointToContainerPoint:p=>p,on(){},removeLayer(){}};
const layer=()=>({addTo(){return this}}),L={map:()=>map,point,control:{zoom:()=>layer()},svg:layer,tileLayer:layer,DomEvent:{disableClickPropagation(){},disableScrollPropagation(){}}};
const context=vm.createContext({document,window:{},L,AbortController,console,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame:fn=>{frames.set(++frame,fn);return frame},testFetchResult:(url,options)=>{if(url.includes('shared-south.'))return Promise.resolve({ok:true,json:async()=>JSON.parse(fs.readFileSync(root+url,'utf8'))});requests.push({url,options});if(url==='rail-search-index.json')return Promise.resolve({ok:true,json:async()=>JSON.parse(fs.readFileSync(root+url,'utf8'))});return new Promise(resolve=>requests.at(-1).resolve=resolve)}});
vm.runInContext("globalThis.fetch=function(...args){if(this!==globalThis)throw new TypeError('Illegal invocation');return testFetchResult(...args)}",context);
for(const file of ['fukutoshin.js','namboku.js','hanzomon.js','odakyu.js','shinjuku.js','rail-systems.js','lazy-rail-data.js','rail-viewport.js','rail-lines.js','rail-symbols.js','app.js'])vm.runInContext(fs.readFileSync(root+file,'utf8'),context,{filename:file});
const flush=()=>{const queue=[...frames.values()];frames.clear();queue.forEach(fn=>fn())};const tick=()=>new Promise(r=>setImmediate(r));
const finish=async request=>{request.resolve({ok:true,json:async()=>JSON.parse(fs.readFileSync(root+request.url,'utf8'))});await tick();flush()};
const details=[...document.querySelectorAll('#tree>details')],selectSystem=(node,checked)=>{node.open=checked;node.dispatchEvent(new window.Event('toggle'));const input=node.querySelector('summary input');input.checked=checked;input.onchange()};
(async()=>{
 flush();assert.equal(requests.length,0);assert.equal(document.querySelectorAll('[name="fuk-line-style"]').length,0);
 const fine=document.querySelector('[name="line-style"][value="fine"]'),thick=document.querySelector('[name="line-style"][value="thick"]');assert(fine.checked);assert(!thick.checked);assert(fine.closest('#layer-panel'));
 for(const network of ['fukutoshin','namboku','hanzomon',null])for(const zoom of [9,13,18])assert.equal(vm.runInContext('displayMetrics('+zoom+','+JSON.stringify(network)+').width',context),1.9);
 document.querySelector('#layers').onclick();assert(!document.querySelector('#layer-panel').hidden);
 map.project=([lat,lng])=>point((lng-139)*1000,(36.2-lat)*800);selectSystem(details[0],true);await finish(requests[0]);
 thick.checked=true;thick.onchange();flush();assert.equal(storage.get('rail-line-style'),'thick');assert.equal(requests.length,1);
 for(const network of ['fukutoshin','namboku','hanzomon',null])assert.equal(vm.runInContext('displayMetrics(10,'+JSON.stringify(network)+').width',context),3.1);
 assert([...document.querySelectorAll('.rail-routes .rail-line')].some(n=>n.getAttribute('stroke-width')==='3.1'));
 document.querySelector('#display-mode-toggle').onclick();flush();assert([...document.querySelectorAll('.simple-line')].every(n=>n.getAttribute('stroke-width')==='3.1'));
 fine.checked=true;fine.onchange();flush();assert([...document.querySelectorAll('.simple-line')].every(n=>n.getAttribute('stroke-width')==='1.9'));assert.equal(storage.get('rail-line-style'),'fine');assert.equal(requests.length,1);
 const source=fs.readFileSync(root+'app.js','utf8'),persisted=vm.createContext({document:{querySelector(){return {}}},localStorage:{getItem:k=>k==='rail-line-style'?'thick':null}});vm.runInContext(source.slice(0,source.indexOf('let rails=')),persisted);vm.runInContext(source.slice(source.indexOf('function displayMetrics'),source.indexOf('function normal')),persisted);assert.equal(persisted.displayMetrics(12).width,3.1);
 console.log('PASS: default global fine, original coarse width, all networks and both modes, persistent selection, no geometry reload, right-hand menu and removed Fukutoshin control.');
})().catch(e=>{console.error(e);process.exitCode=1});
