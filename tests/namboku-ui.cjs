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
 flush();assert.equal(requests.length,0);assert.equal(details.length,8);
 const system=details[4];assert(system.querySelector('.system-title').textContent.includes('南北'));
 assert.equal(system.querySelectorAll('.system-logos img').length,6);
 map.project=([lat,lng])=>point((lng-139)*1000,(36.2-lat)*800);selectSystem(system,true);assert.equal(requests.length,1);assert(requests[0].url.includes('namboku.'));await finish(requests[0]);
 assert.equal(vm.runInContext('rails.length',context),8);
 assert.equal(document.querySelectorAll('.station-hit').length,83);
 for(const name of ['目黒','白金台','白金高輪','赤羽岩淵','日吉','新横浜','西谷','二俣川'])assert.equal([...document.querySelectorAll('.station-hit')].filter(n=>n.dataset.station===name).length,1,name);
 document.querySelector('#display-mode-toggle').onclick();flush();assert.equal(requests.length,1);
 assert.equal(document.querySelectorAll('.simple-line').length,8);assert.equal(document.querySelectorAll('.simple-label').length,83);
 assert([...system.querySelectorAll('[data-service="true"]')].every(c=>c.disabled));
 for(const line of context.RAIL_LINE_CATALOG.filter(l=>l.system==='namboku'))assert.equal(document.querySelector('.simple-line[data-line="'+line.id+'"]').getAttribute('stroke'),line.color);
 document.querySelector('#none').onclick();flush();assert.equal(vm.runInContext('railStore.resources.size',context),0);
 console.log('PASS: new system loads on selection only, 6 line symbols, 8 lines / 83 stations, merged junctions, themed simple lines and all labels, disabled service menus and resource release.');
})().catch(e=>{console.error(e);process.exitCode=1});
