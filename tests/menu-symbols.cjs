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
 flush();assert.equal(requests.length,0);assert.equal(Object.keys(context.RAIL_SYMBOLS.symbols).length,33);assert.equal(Object.keys(context.RAIL_SYMBOLS.lines).length,51);
 for(const line of context.RAIL_LINE_CATALOG){const symbol=context.RAIL_SYMBOLS.symbols[context.RAIL_SYMBOLS.lines[line.id]];assert(symbol,line.id);if(symbol.code==='Y'){assert.equal(symbol.color,'#C1A470');continue}assert(symbol.src.startsWith('https://upload.wikimedia.org/wikipedia/commons/'));assert(symbol.source.startsWith('https://commons.wikimedia.org/wiki/File:'))}
 const keys=node=>[...node.querySelectorAll('.line-symbol')].map(n=>n.dataset.symbol);
 assert.deepEqual(keys(details[0].querySelector('.system-logos')),['F','Y','SI','TJ','TY','SH','SO','MM']);
 assert.deepEqual(keys(details[3].querySelector('.system-logos')),['KK','A','KS','HS','shibayama']);
 assert.deepEqual(keys(details[1].querySelector('.system-logos')),['tokaido','sanyo']);assert.deepEqual(keys(details[7].querySelector('.system-logos')),['S','KO']);assert.deepEqual(keys(details[2].querySelector('.system-logos')),['JC']);
 assert.equal(details[7].querySelectorAll('.company')[1].querySelectorAll('.menu-symbols .line-symbol').length,1,'One KO symbol represents four Keio lines');
 for(const folder of details){const values=keys(folder.querySelector('.system-logos'));assert.equal(new Set(values).size,values.length);assert(folder.querySelectorAll('.company>summary .menu-symbols').length>0)}
 assert.equal(document.querySelectorAll('.system-logos .operator-logo').length,0,'Known lines use symbols, not company logos');
 const y=details[0].querySelector('.system-logos [data-symbol="Y"]');
 assert.equal(y.textContent,'Y');assert.equal(y.getAttribute('aria-label'),'有乐町线线路符号');assert.equal(y.querySelector('img'),null);
 const badge=vm.runInContext("menuSymbol(menuSymbolItems(['keikyu'])[0])",context),img=badge.querySelector('img');assert.equal(badge.dataset.symbol,'KK');assert.equal(img.alt,'京急线线路符号');img.onerror();assert(badge.classList.contains('operator-logo'));assert(img.src.includes('Keikyu_logo_small.svg'));img.onerror();assert(img.hidden);assert(!badge.querySelector('.logo-fallback').hidden);
 const unknown=vm.runInContext("menuSymbol({key:'operator:keikyu',group:'keikyu',lines:['未来地方线']})",context);assert(unknown.classList.contains('operator-logo'));assert(unknown.querySelector('img').src.includes('Keikyu_logo_small.svg'));unknown.querySelector('img').onerror();assert(!unknown.querySelector('.logo-fallback').hidden);
 const css=fs.readFileSync(root+'style.css','utf8');assert(css.includes('.system-logos .line-symbol{width:20px'));assert(css.includes('.company-title{min-width:0;flex:1;'));
 console.log('PASS: Commons source mapping for all 51 lines, 33 distinct symbols, matching first/second-level badges, deduplication, compact sizes, missing-symbol/operator/text fallbacks and zero geometry requests.');
})().catch(e=>{console.error(e);process.exitCode=1});
