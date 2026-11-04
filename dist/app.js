const $=s=>document.querySelector(s), ns='http://www.w3.org/2000/svg';
const types=[['local','普通','Local','#df777e'],['airport','エアポート快特','Airport Limited Express','#edaa39'],['rapid','快速','Rapid · 京成','#b95caa'],['express','急行','Express','#51a8cc'],['commuter','通勤特急','Commuter Express · 京成','#28b7d0'],['limited','特急','Limited Express','#ed6d59'],['access','アクセス特急','Access Express · 京成','#ec8d31'],['kaitoku','快特・快速特急','Limited Express','#28a887'],['liner','モーニング・イブニングライナー','Morning / Eveningliner','#77758b'],['sky','スカイライナー','Skyliner','#3977a2']];
types.push(['cLocal','普通','Local · 立川—大月／青梅','#3a42b0'],['cCommuterSpecial','通勤特快','Commuter Special Rapid · 平日上行','#e82643'],['cSpecial','中央特快','Chūō Special Rapid','#1592d1'],['cOmeSpecial','青梅特快','Ōme Special Rapid','#14ad64'],['cCommuterRapid','通勤快速','Commuter Rapid · 平日下行','#9855bd'],['cRapid','快速','Rapid · 平日／土休日停站切换','#ec873e']);
types.push(['nNozomi','のぞみ · Nozomi','希望号 · 主要站停靠','#b3bd14'],['nHikari','ひかり · Hikari','光号 · 部分停站依班次','#f2464d'],['nKodama','こだま · Kodama','回声号 · 区间内各站停靠','#6a7bff']);
const shinkansenStops={
 Tokaido:{nNozomi:{always:'東京,品川,新横浜,名古屋,京都,新大阪',partial:''},nHikari:{always:'東京,品川,新横浜,名古屋,京都,新大阪',partial:'小田原,熱海,三島,静岡,浜松,豊橋,岐阜羽島,米原'}},
 Sanyo:{nNozomi:{always:'新大阪,新神戸,岡山,広島,小倉,博多',partial:'西明石,姫路,福山,徳山,新山口'},nHikari:{always:'新大阪,新神戸,姫路,岡山,福山,広島,小倉,博多',partial:'西明石,相生,新倉敷,新尾道,三原,東広島,新岩国,徳山,新山口,厚狭,新下関'}}
};
// 2 = fixed stop within the train's operating section; 1 = selected trains; 0 = pass.
function stopKind(r,station,t){if(r.id.startsWith('Fukutoshin.')){const rule=fukConfig.routes[r.id],stops=rule?.stops[t];return stops==='*'||stops?.includes(station.name)?2:rule?.partial?.[t]?.includes(station.name)?1:0}if(!r.id.startsWith('Shinkansen.'))return stop(r,station,t)?2:0;if(t==='nKodama')return 2;const rules=shinkansenStops[r.id.split('.')[1]]?.[t];return rules?.always.split(',').includes(station.name)?2:rules?.partial.split(',').includes(station.name)?1:0}
const fukConfig=globalThis.FUKUTOSHIN||{types:[],groups:{},routes:{},sources:[]};types.push(...fukConfig.types);
const lineCatalog=globalThis.RAIL_LINE_CATALOG||[];
let displayMode=localStorage.getItem('rail-display-mode')==='simple'?'simple':'detailed';
const isSimple=()=>displayMode==='simple';
const lineIdsForKeys=keys=>lineCatalog.filter(line=>keys.some(key=>key.startsWith(line.group+':'))).map(line=>line.id);
const systemLineIds=id=>lineCatalog.filter(line=>line.system===id).map(line=>line.id);
const modeKeys=id=>isSimple()?systemLineIds(id):systemKeys(id);
const simplePreferences=new Set(JSON.parse(localStorage.getItem('rail-lines-selected')||'null')||lineCatalog.map(line=>line.id));
let simpleActive=new Set();
let fukLineStyle=localStorage.getItem('rail-fuk-line-style')||'fine';
let dayMode=localStorage.getItem('rail-day-mode')||'weekday';
const chuoTrunkStops={cCommuterSpecial:new Set('東京,神田,御茶ノ水,四ツ谷,新宿,国分寺,立川'.split(',')),cSpecial:new Set('東京,神田,御茶ノ水,四ツ谷,新宿,中野,三鷹,国分寺,立川'.split(',')),cOmeSpecial:new Set('東京,神田,御茶ノ水,四ツ谷,新宿,中野,三鷹,国分寺,立川'.split(',')),cCommuterRapid:new Set('東京,神田,御茶ノ水,四ツ谷,新宿,中野,荻窪,吉祥寺,三鷹,国分寺,立川'.split(','))};
function chuoStop(r,s,t){if(r.id.endsWith('.Trunk')){if(t==='cRapid')return dayMode==='weekday'||!['高円寺','阿佐ケ谷','西荻窪'].includes(s.name);return chuoTrunkStops[t]?.has(s.name)||false}if(r.id.endsWith('.Ome')){return true}if(t==='cCommuterSpecial')return !['日野','豊田','西八王子'].includes(s.name);return true}
// 快特・快速特急 is one legend family; the reference has ten swatches, including both Liner families.
const defs={keikyu:['local','airport','express','limited','kaitoku'],asakusa:['local','airport'],keisei:['local','express','rapid','commuter','limited','access','kaitoku','liner','sky']};
defs.chuo=['cLocal','cCommuterSpecial','cSpecial','cOmeSpecial','cCommuterRapid','cRapid'];
defs.shinkCentral=['nNozomi','nHikari','nKodama'];defs.shinkWest=['nNozomi','nHikari','nKodama'];
for(const [g,info] of Object.entries(fukConfig.groups))defs[g]=info.services;
const groupNames={keikyu:['京急电铁','KEIKYU'],asakusa:['都营浅草线','TOEI ASAKUSA'],keisei:['京成・北总・芝山','KEISEI NETWORK']};
groupNames.chuo=['JR东日本 · 中央／青梅','JR EAST'];
groupNames.shinkCentral=['JR东海 · 东海道新干线','JR CENTRAL'];groupNames.shinkWest=['JR西日本 · 山阳新干线','JR WEST'];
for(const [g,info] of Object.entries(fukConfig.groups))groupNames[g]=[info.name,info.en];
const stopSets={
kaitoku:'泉岳寺,品川,京急蒲田,京急川崎,横浜,上大岡,金沢文庫,金沢八景,横須賀中央,堀ノ内,京急久里浜,YRP野比,京急長沢,津久井浜,三浦海岸,三崎口,羽田空港第３ターミナル,羽田空港第１・第２ターミナル,京成上野,日暮里,青砥,京成高砂,京成八幡,京成船橋,京成津田沼,八千代台,勝田台,京成佐倉,京成成田,空港第２ビル,成田空港',
limited:'泉岳寺,品川,青物横丁,平和島,京急蒲田,京急川崎,京急鶴見,神奈川新町,横浜,日ノ出町,上大岡,金沢文庫,金沢八景,追浜,汐入,横須賀中央,堀ノ内,京急大津,馬堀海岸,浦賀,京急久里浜,YRP野比,京急長沢,津久井浜,三浦海岸,三崎口,京成上野,日暮里,青砥,京成高砂,京成八幡,京成船橋,京成津田沼,八千代台,勝田台,京成佐倉,大佐倉,京成酒々井,宗吾参道,公津の杜,京成成田,空港第２ビル,成田空港',
express:'泉岳寺,品川,青物横丁,立会川,平和島,京急蒲田,京急川崎,京急鶴見,神奈川新町,京急東神奈川,横浜,日ノ出町,井土ヶ谷,弘明寺,上大岡,杉田,能見台,金沢文庫,金沢八景',
rapid:'京成上野,日暮里,千住大橋,青砥,京成高砂,京成小岩,京成八幡,東中山,京成船橋,船橋競馬場,京成津田沼,京成大久保,実籾,八千代台,京成大和田,勝田台,志津,ユーカリが丘,京成臼井,京成佐倉,大佐倉,京成酒々井,宗吾参道,公津の杜,京成成田,空港第２ビル,成田空港',
commuter:'京成上野,日暮里,青砥,京成高砂,京成八幡,京成船橋,京成津田沼,八千代台,勝田台,志津,ユーカリが丘,京成臼井,京成佐倉,大佐倉,京成酒々井,宗吾参道,公津の杜,京成成田,空港第２ビル,成田空港',
airport:'泉岳寺,品川,羽田空港第３ターミナル,羽田空港第１・第２ターミナル,三田,大門,新橋,日本橋,東日本橋,浅草,押上',
access:'押上(スカイツリー前),京成上野,日暮里,青砥,京成高砂,東松戸,新鎌ヶ谷,千葉ニュータウン中央,印旛日本医大,成田湯川,空港第２ビル,成田空港',
liner:'京成上野,日暮里,青砥,京成高砂,京成船橋,八千代台,勝田台,京成佐倉,京成成田,空港第２ビル,成田空港',sky:'京成上野,日暮里,空港第２ビル,成田空港'};
for(const k in stopSets)stopSets[k]=new Set(stopSets[k].split(','));
function group(r){if(r.id.startsWith('Fukutoshin.'))return r.group;if(r.id==='Shinkansen.Tokaido')return 'shinkCentral';if(r.id==='Shinkansen.Sanyo')return 'shinkWest';if(r.id.startsWith('JR-East.Chuo.'))return 'chuo';return r.id.startsWith('Keikyu')?'keikyu':r.id.startsWith('Toei')?'asakusa':'keisei'}
function available(r,t){const id=r.id;if(id.startsWith('Fukutoshin.'))return fukConfig.routes[id]?.services.includes(t)||false;if(fukConfig.types.some(x=>x[0]===t))return false;if(id.startsWith('Shinkansen.'))return ['nNozomi','nHikari','nKodama'].includes(t);if(['nNozomi','nHikari','nKodama'].includes(t))return false;if(id.startsWith('JR-East.Chuo.')){if(id.endsWith('.Trunk'))return defs.chuo.includes(t)&&t!=='cLocal';if(id.endsWith('.West'))return ['cLocal','cRapid','cSpecial','cCommuterRapid','cCommuterSpecial'].includes(t);return defs.chuo.includes(t)&&t!=='cSpecial'}if(defs.chuo.includes(t))return false;if(id==='Toei.Asakusa')return ['local','airport'].includes(t);if(id.startsWith('Keikyu')){if(t==='airport')return ['Keikyu.Main','Keikyu.Airport'].includes(id);if(t==='express')return ['Keikyu.Main','Keikyu.Airport','Keikyu.Zushi'].includes(id);if(t==='kaitoku')return id!=='Keikyu.Zushi';return ['local','limited'].includes(t)}if(id==='Keisei.NaritaSkyAccess')return ['access','sky'].includes(t);if(id==='Hokuso.Hokuso')return ['local','express','limited'].includes(t);if(id==='Keisei.Oshiage')return ['local','rapid','commuter','limited','kaitoku','access'].includes(t);if(id==='Keisei.Main')return ['local','rapid','commuter','limited','kaitoku','liner'].includes(t);return ['local'].includes(t)}
function covers(r,s,t){if(r.id==='Keikyu.Main'){let i=r.stations.findIndex(x=>x.id===s.id);if(t==='airport')return i<=11;if(t==='express')return i<=38}return true}
function stop(r,s,t){if(r.id.startsWith('Fukutoshin.'))return stopKind(r,s,t)>0;if(r.id.startsWith('Shinkansen.'))return stopKind(r,s,t)>0;if(group(r)==='chuo')return chuoStop(r,s,t);if(!covers(r,s,t))return false;if(t==='local')return true;if(r.id==='Keisei.Oshiage')return t==='rapid'||t==='local'||['青砥','押上(スカイツリー前)'].includes(s.name);if(r.id==='Hokuso.Hokuso'){if(t==='limited')return ['京成高砂','東松戸','新鎌ヶ谷','千葉ニュータウン中央','印西牧の原','印旛日本医大'].includes(s.name);return ['京成高砂','東松戸','新鎌ヶ谷','千葉ニュータウン中央','印西牧の原','印旛日本医大'].includes(s.name)}if(r.id==='Keikyu.Airport'&&['express','limited'].includes(t))return true;if(r.id==='Keikyu.Zushi'&&['express','limited'].includes(t))return true;if(r.id==='Keikyu.Kurihama'&&t==='limited')return true;return stopSets[t]?.has(s.name)||false}
const systemConfigs=[{name:'副都心线',groups:Object.keys(fukConfig.groups),logos:Object.keys(fukConfig.groups),focus:'fukutoshin'},{name:'东海道・山阳新干线',groups:['shinkCentral','shinkWest'],logos:['shinkCentral','shinkWest'],focus:'shinkansen'},{name:'中央快速线系统',groups:['chuo'],logos:['chuo'],focus:'chuo'},{name:'京急・浅草・京成系统',groups:['keikyu','asakusa','keisei'],logos:['keikyu','asakusa','keisei'],focus:'keikyu'}];
const systemKeys=id=>{const config=systemConfigs.find(s=>s.focus===id);return config?config.groups.flatMap(g=>defs[g].map(t=>g+':'+t)):[]};
const selectionPreferences=new Set(JSON.parse(localStorage.getItem('rail-selected')||'null')||Object.entries(defs).flatMap(([g,ts])=>ts.map(t=>g+':'+t)));
selectionPreferences.delete('chuo:cHoliday');selectionPreferences.delete('chuo:cOmeLimited');
let rails=[],active=new Set(),labelOn=true,dark=false;
const systemNodes=new Map();let systemStates={},searchIndex=null,searchIndexPromise=null,searchVersion=0;
if(window.maplibregl&&typeof maplibregl.setWorkerCount==='function')maplibregl.setWorkerCount(2);
const map=L.map('map',{zoomControl:false,preferCanvas:false}).setView([35.61,139.9],10);let tile,baseGeneration=0;
const baseStyles={dark:'https://tiles.openfreemap.org/styles/dark',positron:'https://tiles.openfreemap.org/styles/positron',osm:null};
const osmAttribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
const vectorAttribution='<a href="https://openfreemap.org/">OpenFreeMap</a> · © <a href="https://openmaptiles.org/">OpenMapTiles</a> · '+osmAttribution;
function basemap(style){
 if(!(style in baseStyles))style='dark';
 const generation=++baseGeneration;let message='地图数据来自 OpenStreetMap';
 if(style!=='osm'&&(!window.maplibregl||(typeof maplibregl.supported==='function'&&!maplibregl.supported()))){style='osm';message='当前浏览器不支持矢量底图，已使用 OSM 标准地图。'}
 if(tile)map.removeLayer(tile);
 dark=style==='dark';document.body.classList.toggle('dark-map',dark);
 document.querySelectorAll('[name="basemap"]').forEach(r=>r.checked=r.value===style);
 localStorage.setItem('rail-basemap',style);$('#layer-status').textContent=message;
 try{
  if(style==='osm')tile=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:osmAttribution}).addTo(map);
  else {tile=L.maplibreGL({style:baseStyles[style],interactive:false,attribution:vectorAttribution,maxTileCacheSize:48,maxTileCacheZoomLevels:2,fadeDuration:0}).addTo(map);tile.getMaplibreMap().on('error',()=>{if(generation===baseGeneration)$('#layer-status').textContent='底图资源加载遇到问题，可切换 OSM 标准地图。'});}
 }catch(error){if(style!=='osm'){basemap('osm');$('#layer-status').textContent='矢量底图暂不可用，已使用 OSM 标准地图。';return}console.error(error)}
 draw();
}

L.svg({padding:1}).addTo(map);const svg=document.querySelector('.leaflet-overlay-pane svg'),root=document.createElementNS(ns,'g');svg.appendChild(root);svg.style.pointerEvents='none';
function el(tag,attrs,parent=root){let e=document.createElementNS(ns,tag);for(let [k,v]of Object.entries(attrs))e.setAttribute(k,v);parent.appendChild(e);return e}
// Preserve subpixel coordinates: Leaflet's latLngToLayerPoint rounds to whole pixels,
// which amplifies tiny direction changes when several lanes are offset.
function point(c){const p=map.project([c[1],c[0]],map.getZoom()).subtract(map.getPixelOrigin());return {x:p.x,y:p.y}}
function displayMetrics(zoom,network){if(network==='fukutoshin'&&fukLineStyle==='fine')return {gap:3.6,width:1.9,casing:3.1,station:5,stationInner:3.2};return {gap:6,width:3.1,casing:5.5,station:7,stationInner:4.5}}
function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)}
function simplify(points,tolerance){if(points.length<3)return points;const keep=new Set([0,points.length-1]),stack=[[0,points.length-1]];while(stack.length){const [a,b]=stack.pop();let far=tolerance,index=-1;for(let i=a+1;i<b;i++){const d=segmentDistance(points[i],points[a],points[b]);if(d>far){far=d;index=i}}if(index!==-1){keep.add(index);stack.push([a,index],[index,b])}}return [...keep].sort((a,b)=>a-b).map(i=>points[i])}
function smoothCenterline(points,zoom,anchors=[]){
 // Simplify each station-to-station section independently, preserving its ends.
 const tolerance=Math.max(.3,Math.min(10,1.5*2**((14-zoom)*.65)));
 const pinned=new Set([0,points.length-1]);
 for(const anchor of anchors){let best=Infinity,index=0;points.forEach((p,i)=>{const d=Math.hypot(p.x-anchor.x,p.y-anchor.y);if(d<best){best=d;index=i}});pinned.add(index)}
 const boundaries=[...pinned].sort((a,b)=>a-b);let ps=[];
 for(let i=1;i<boundaries.length;i++){const section=simplify(points.slice(boundaries[i-1],boundaries[i]+1),tolerance);ps.push(...(i===1?section:section.slice(1)))}
 ps=ps.filter((p,i)=>i===0||Math.hypot(p.x-ps[i-1].x,p.y-ps[i-1].y)>.000001);
 if(ps.length<2)return ps;
 // Rounded cubic segments pass through every retained point, including stations.
 const result=[ps[0]];
 for(let i=0;i<ps.length-1;i++){
  const a=ps[i],b=ps[i+1],before=ps[Math.max(0,i-1)],after=ps[Math.min(ps.length-1,i+2)],length=Math.hypot(b.x-a.x,b.y-a.y);
  const tangent=(p,q,limit)=>{const dx=q.x-p.x,dy=q.y-p.y,n=Math.hypot(dx,dy)||1;return{x:dx/n*limit,y:dy/n*limit}};
  const u=tangent(before,b,Math.min(length,Math.hypot(a.x-before.x,a.y-before.y)||length)*.28),v=tangent(a,after,Math.min(length,Math.hypot(after.x-b.x,after.y-b.y)||length)*.28);
  const c={x:a.x+u.x,y:a.y+u.y},d={x:b.x-v.x,y:b.y-v.y},steps=Math.max(4,Math.min(32,Math.ceil(length/4)));
  for(let j=1;j<=steps;j++){const t=j/steps,k=1-t;result.push({order:a.order+t*(b.order-a.order),x:k*k*k*a.x+3*k*k*t*c.x+3*k*t*t*d.x+t*t*t*b.x,y:k*k*k*a.y+3*k*k*t*c.y+3*k*t*t*d.y+t*t*t*b.y})}
 }
 return result;
}
function normal(p,i){const direction=(a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1;return{x:-dy/l,y:dx/l}};const incoming=direction(p[Math.max(0,i-1)],p[i]),outgoing=direction(p[i],p[Math.min(p.length-1,i+1)]);if(i===0)return outgoing;if(i===p.length-1)return incoming;let x=incoming.x+outgoing.x,y=incoming.y+outgoing.y,l=Math.hypot(x,y);if(l<.001)return outgoing;x/=l;y/=l;const miter=Math.min(1.6,1/Math.max(.1,x*outgoing.x+y*outgoing.y));return{x:x*miter,y:y*miter}}
function nearest(points,p,normals=null){let best={d:Infinity};for(let i=0;i<points.length-1;i++){let a=points[i],b=points[i+1],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1))),q={x:a.x+t*dx,y:a.y+t*dy},d=Math.hypot(q.x-p.x,q.y-p.y);if(d<best.d){const na=normals?normals[i]:normal(points,i),nb=normals?normals[i+1]:normal(points,i+1);best={...q,d,n:{x:na.x*(1-t)+nb.x*t,y:na.y*(1-t)+nb.y*t}}}}return best}
function draw(){if(isSimple())drawSimple();else drawDetailed()}
function drawSimple(){
 root.replaceChildren();const clipping=globalThis.RailViewport,model=globalThis.RailLineModel;if(!model)return;let rect=null;if(clipping&&typeof map.containerPointToLayerPoint==='function'){const nw=map.containerPointToLayerPoint(L.point(0,0)),size=map.getSize();rect=[nw.x-96,nw.y-96,nw.x+size.x+96,nw.y+size.y+96]}
 const routes=el('g',{'class':'simple-routes'}),stations=el('g',{'class':'simple-stations'}),points=new Map();
 for(const line of lineCatalog.filter(line=>simpleActive.has(line.id))){const paths=[];
  for(const r of model.parts(line,rails)){const raw=r.coords.map((c,i)=>({...point(c),order:i})),anchors=r.stations.map(s=>point(s.coord)).filter(p=>!clipping||clipping.contains(rect,p));const chunks=(clipping?clipping.clip(raw,rect):[raw]).map(chunk=>smoothCenterline(chunk,map.getZoom(),anchors)).filter(ps=>ps.length>1);if(!chunks.length)continue;
   for(const ps of chunks)paths.push(ps.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+','+p.y.toFixed(1)).join(''));
   for(const station of r.stations){const target=point(station.coord);if(clipping&&!clipping.contains(rect,target))continue;const q=chunks.map(ps=>nearest(ps,target)).reduce((best,q)=>q.d<best.d?q:best,{d:Infinity});if(!Number.isFinite(q.x))continue;const key=line.system+'|'+model.stationName(station.name);if(!points.has(key))points.set(key,{station,line,x:station.junction?target.x:q.x,y:station.junction?target.y:q.y})}
  }
  if(paths.length){const d=paths.join('');el('path',{d,class:'rail-line simple-line-casing','data-line':line.id,stroke:dark?'#14232e':'#fff','stroke-width':6},routes);el('path',{d,class:'rail-line simple-line','data-line':line.id,stroke:line.color,'stroke-width':3.3},routes)}
 }
 const used=[];
 for(const {station,line,x,y}of points.values()){const group=el('g',{'class':'station-hit','data-station':station.name,'data-network':line.system,'pointer-events':'all'},stations);el('circle',{cx:x,cy:y,r:3.3,fill:'#fff',stroke:dark?'#bacbd3':'#3d564b','stroke-width':1.3},group);el('circle',{cx:x,cy:y,r:8,fill:'transparent'},group);group.addEventListener('click',()=>showLineStation(station.name,line.system));const title=el('title',{},group);title.textContent=station.name;
  const screen=map.layerPointToContainerPoint(L.point(x,y)),size=map.getSize();if(screen.x<0||screen.y<0||screen.x>size.x||screen.y>size.y)continue;const width=station.name.length*10+4,candidates=[[10,3],[-width-10,3],[10,-10],[-width-10,-10],[10,17],[-width-10,17],[10,-23],[-width-10,-23]];let placement=candidates[0];for(const candidate of candidates){const rect=[screen.x+candidate[0],screen.y+candidate[1]-10,screen.x+candidate[0]+width,screen.y+candidate[1]+3];if(!used.some(a=>a[0]<rect[2]&&a[2]>rect[0]&&a[1]<rect[3]&&a[3]>rect[1])){placement=candidate;break}}const [dx,dy]=placement;used.push([screen.x+dx,screen.y+dy-10,screen.x+dx+width,screen.y+dy+3]);const label=el('text',{x:x+dx,y:y+dy,class:'station-label simple-label','data-station-label':station.name});label.textContent=station.name;
 }
 if(typeof updateRailStatus==='function')updateRailStatus();
}
function showLineStation(name,system=null){const model=globalThis.RailLineModel;if(!model)return;const found=[];let station=null;for(const line of lineCatalog.filter(line=>simpleActive.has(line.id)&&(!system||line.system===system))){for(const part of model.parts(line,rails)){const s=part.stations.find(s=>model.stationName(s.name)===model.stationName(name));if(s){station=station||s;found.push(line);break}}}if(!station)return;$('#detail').innerHTML=`<button class="close" aria-label="关闭">×</button><h2>${station.name}</h2><div class="english">${station.en}</div>${found.map(line=>`<div class="stoprow"><span class="swatch" style="background:${line.color}"></span><span>${line.name}</span></div>`).join('')}<p class="detailnote">精简模式按线路显示全部站点，不区分列车服务及其停站种别。</p>`;$('#detail').hidden=false;$('#detail .close').onclick=()=>$('#detail').hidden=true;map.setView([station.coord[1],station.coord[0]],Math.max(13,map.getZoom()));
}
function drawDetailed(){
 root.replaceChildren();const clipping=globalThis.RailViewport;let rect=null;if(clipping&&typeof map.containerPointToLayerPoint==='function'){const nw=map.containerPointToLayerPoint(L.point(0,0)),size=map.getSize();rect=[nw.x-96,nw.y-96,nw.x+size.x+96,nw.y+size.y+96]}const routeRoot=el('g',{'class':'rail-routes'}),stationRoot=el('g',{'class':'rail-stations'});let labels=[],scene=[];
 for(const r of rails){const g=group(r),ts=types.filter(t=>available(r,t[0])&&active.has(g+':'+t[0]));if(!ts.length)continue;
  const isFuk=r.id.startsWith('Fukutoshin.'),metrics=displayMetrics(map.getZoom(),isFuk?'fukutoshin':null),raw=r.coords.map((c,i)=>({...point(c),order:i})),anchors=r.stations.map(s=>point(s.coord)).filter(p=>!clipping||clipping.contains(rect,p));
  const chunks=(clipping?clipping.clip(raw,rect):[raw]).map(points=>{const bounds=points.reduce((b,p)=>[Math.min(b[0],p.x),Math.min(b[1],p.y),Math.max(b[2],p.x),Math.max(b[3],p.y)],[Infinity,Infinity,-Infinity,-Infinity]);const local=anchors.filter(p=>p.x>=bounds[0]-16&&p.x<=bounds[2]+16&&p.y>=bounds[1]-16&&p.y<=bounds[3]+16);const ps=smoothCenterline(points,map.getZoom(),local);return {ps,normals:ps.map((_,i)=>normal(ps,i))}}).filter(chunk=>chunk.ps.length>1);if(!chunks.length)continue;
  const laneTypes=r.id.startsWith('Shinkansen.')?types.filter(t=>defs.shinkCentral.includes(t[0])&&['shinkCentral','shinkWest'].some(g=>active.has(g+':'+t[0]))):g==='chuo'?types.filter(t=>defs.chuo.includes(t[0])&&active.has('chuo:'+t[0])):ts;
  const offsets=ts.map(t=>(laneTypes.indexOf(t)-(laneTypes.length-1)/2)*metrics.gap);scene.push({r,g,ts,chunks,offsets,laneTypes,metrics,isFuk});
  for(let j=0;j<ts.length;j++){const t=ts[j];let end=Infinity;if(r.id==='Keikyu.Main'&&['airport','express'].includes(t[0])){const target=point(r.stations[t[0]==='airport'?11:38].coord);let best=Infinity;raw.forEach((p,i)=>{const d=Math.hypot(p.x-target.x,p.y-target.y);if(d<best){best=d;end=i}})}
   const parts=[];for(const chunk of chunks){const items=clipping?clipping.trim(chunk.ps,chunk.normals,end):chunk.ps.map((p,i)=>({p,n:chunk.normals[i]})).filter(item=>item.p.order<=end);if(items.length<2)continue;parts.push(items.map(({p,n},i)=>(i?'L':'M')+(p.x+n.x*offsets[j]).toFixed(1)+','+(p.y+n.y*offsets[j]).toFixed(1)).join(''))}if(!parts.length)continue;
   const d=parts.join('');el('path',{d,class:'rail-line',stroke:dark?'#20333c':'#fff','stroke-width':metrics.casing},routeRoot);el('path',{d,class:'rail-line',stroke:t[3],'stroke-width':metrics.width},routeRoot);
  }
 }
 const seen=new Set();
 for(const entry of scene){const {r,g,ts,chunks,offsets,laneTypes,metrics,isFuk}=entry;
  for(const station of r.stations){if(clipping&&!clipping.contains(rect,point(station.coord)))continue;const junction=(g==='chuo'&&station.name==='立川')||(r.id.startsWith('Shinkansen.')&&station.name==='新大阪')||(isFuk&&station.junction),key=(isFuk?'fuk:':g==='chuo'?'chuo:':'shink:')+station.name;if(junction&&seen.has(key))continue;
   let markerTypes=ts,markerOffsets=offsets,tier=t=>stopKind(r,station,t[0]);
   if(junction){if(isFuk){const peers=scene.filter(e=>e.isFuk&&e.r.stations.some(s=>s.id===station.id));markerTypes=types.filter(t=>peers.some(e=>e.ts.includes(t)));tier=t=>Math.max(...peers.map(e=>{const s=e.r.stations.find(s=>s.id===station.id);return e.ts.includes(t)?stopKind(e.r,s,t[0]):0}))}else{markerTypes=laneTypes;tier=()=>2}markerOffsets=markerTypes.map((_,i)=>(i-(markerTypes.length-1)/2)*metrics.gap)}
   const stopped=markerTypes.map((t,i)=>tier(t)===2?i:-1).filter(i=>i>=0),partial=markerTypes.map((t,i)=>tier(t)===1?i:-1).filter(i=>i>=0);if(!stopped.length&&!partial.length)continue;
   const q=chunks.map(chunk=>nearest(chunk.ps,point(station.coord),chunk.normals)).reduce((best,q)=>q.d<best.d?q:best,{d:Infinity});if(!Number.isFinite(q.x))continue;if(junction){seen.add(key);const p=point(station.coord);q.x=p.x;q.y=p.y;}
   const sg=el('g',{'class':'station-hit','pointer-events':'all','data-station':station.name,'data-network':isFuk?'fukutoshin':g},stationRoot),pos=i=>({x:q.x+q.n.x*markerOffsets[i],y:q.y+q.n.y*markerOffsets[i]});
   const runs=[];for(const i of stopped){const last=runs.at(-1);if(last&&last.at(-1)===i-1)last.push(i);else runs.push([i])}
   for(const run of runs){const a=pos(run[0]),b=pos(run.at(-1));el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#3a5146','stroke-width':metrics.station,'stroke-linecap':'round'},sg);el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#fff','stroke-width':metrics.stationInner,'stroke-linecap':'round'},sg)}
   for(const i of partial){const p=pos(i);el('circle',{cx:p.x,cy:p.y,r:isFuk&&fukLineStyle==='fine'?1.7:2.3,fill:markerTypes[i][3],stroke:dark?'#e3eaf0':'#fff','stroke-width':1,'class':'partial-stop'},sg)}
   el('circle',{cx:q.x,cy:q.y,r:Math.max(7,markerTypes.length*metrics.gap/2),fill:'transparent'},sg);sg.addEventListener('click',()=>showStation(station.name,isFuk?'fukutoshin':null));const title=el('title',{},sg);title.textContent=station.name;
   const p=map.layerPointToContainerPoint(L.point(q.x,q.y));if(p.x>0&&p.y>0&&p.x<map.getSize().x-40&&p.y<map.getSize().y-20)labels.push({s:station,q,p,major:stopped.length>1});
  }
 }
 if(labelOn){const used=[];labels.sort((a,b)=>Number(b.major)-Number(a.major));for(const {s,q,p} of labels){if(map.getZoom()<11&&!['品川','横浜','押上','青砥','京成上野','成田空港','三崎口','羽田空港第１・第２ターミナル','京成津田沼','京成高砂','泉岳寺','京成成田','東京','新宿','立川','八王子','高尾','大月','青梅','拝島','新横浜','静岡','浜松','名古屋','京都','新大阪','新神戸','岡山','広島','小倉','博多','小川町','森林公園','川越','和光市','飯能','西武秩父','所沢','練馬','小竹向原','池袋','新宿三丁目','渋谷','日吉','西谷','二俣川','湘南台','海老名','元町・中華街'].includes(s.name))continue;
  const width=s.name.length*11+10,rect=[p.x+12,p.y-10,p.x+width+12,p.y+5];if(used.some(a=>a[0]<rect[2]&&a[2]>rect[0]&&a[1]<rect[3]&&a[3]>rect[1]))continue;used.push(rect);const e=el('text',{x:q.x+14,y:q.y+3,class:'station-label'});e.textContent=s.name;
 }}
 if(typeof updateRailStatus==='function')updateRailStatus();
}
function updateModeControls(){document.body.classList.toggle('simple-mode',isSimple());const toggle=$('#display-mode-toggle');if(toggle){toggle.setAttribute('aria-checked',String(isSimple()));toggle.title=isSimple()?'切换至详细服务模式':'切换至精简线路模式'}const labels=$('#labels');if(labels){labels.disabled=isSimple();labels.title=isSimple()?'精简模式显示全部站名':'站名开关'}document.querySelectorAll('[data-service="true"]').forEach(c=>c.disabled=isSimple());document.querySelectorAll('[data-line-ids]').forEach(c=>c.disabled=!isSimple());document.querySelectorAll('[data-counter-group]').forEach(n=>{const g=n.dataset.counterGroup;n.textContent=isSimple()?lineCatalog.filter(line=>line.group===g).length:defs[g].length})}
function refresh(){localStorage.setItem('rail-selected',JSON.stringify([...selectionPreferences]));localStorage.setItem('rail-lines-selected',JSON.stringify([...simplePreferences]));$('#count').textContent=isSimple()?`已选 ${simpleActive.size} 条线路`:`已选 ${active.size} 个服务图层`;document.querySelectorAll('[data-keys]').forEach(c=>{const saved=JSON.parse(c.dataset.keys),keys=isSimple()&&c.dataset.service!=='true'?lineIdsForKeys(saved):saved,chosen=isSimple()&&c.dataset.service!=='true'?simpleActive:active,n=keys.filter(k=>chosen.has(k)).length;c.checked=keys.length>0&&n===keys.length;c.indeterminate=n>0&&n<keys.length});document.querySelectorAll('[data-line-ids]').forEach(c=>{const keys=JSON.parse(c.dataset.lineIds),n=keys.filter(k=>simpleActive.has(k)).length;c.checked=n===keys.length;c.indeterminate=n>0&&n<keys.length});updateModeControls();syncRailSystems();scheduleDraw()}
function selectedSystemIds(){const chosen=isSimple()?simpleActive:active;return systemConfigs.filter(config=>modeKeys(config.focus).some(key=>chosen.has(key))).map(config=>config.focus)}
function setDisplayMode(next){if(!['simple','detailed'].includes(next)||next===displayMode)return;const selected=selectedSystemIds();displayMode=next;localStorage.setItem('rail-display-mode',displayMode);const chosen=isSimple()?simpleActive:active,prefs=isSimple()?simplePreferences:selectionPreferences;chosen.clear();for(const id of selected){const keys=modeKeys(id),saved=keys.filter(key=>prefs.has(key));for(const key of saved.length?saved:keys)chosen.add(key)}$('#detail').hidden=true;$('#detail').replaceChildren();refresh()}
function activateSystem(id,{only=false}={}){const keys=modeKeys(id);if(!keys.length)return Promise.resolve();const chosen=isSimple()?simpleActive:active,prefs=isSimple()?simplePreferences:selectionPreferences;if(only){chosen.clear();for(const [key,node]of systemNodes)if(key!==id)node.details.open=false}
 if(!keys.some(key=>chosen.has(key))){const remembered=keys.filter(key=>prefs.has(key));for(const key of remembered.length?remembered:keys){chosen.add(key);prefs.add(key)}}
 const node=systemNodes.get(id);if(node)node.details.open=true;refresh();if(systemStates[id]?.status==='error')railStore.retry(id);return railStore.records.get(id)?.promise||Promise.resolve()}
function deactivateSystem(id){const chosen=isSimple()?simpleActive:active;for(const key of modeKeys(id))chosen.delete(key);$('#detail').hidden=true;$('#detail').replaceChildren();refresh()}
function checkbox(keys,service=false){const c=document.createElement('input');c.type='checkbox';c.dataset.keys=JSON.stringify(keys);c.dataset.service=String(service);c.setAttribute('aria-label',service?'显示或隐藏服务':'显示或隐藏线路组');c.addEventListener('click',e=>e.stopPropagation());c.onchange=()=>{if(isSimple()&&service)return;const actual=isSimple()?lineIdsForKeys(keys):keys,chosen=isSimple()?simpleActive:active,prefs=isSimple()?simplePreferences:selectionPreferences;for(const key of actual){if(c.checked){chosen.add(key);prefs.add(key)}else{chosen.delete(key);prefs.delete(key)}}refresh()};return c}
function lineCheckbox(line){const c=document.createElement('input');c.type='checkbox';c.dataset.lineIds=JSON.stringify([line.id]);c.setAttribute('aria-label','显示或隐藏'+line.name);c.onchange=()=>{if(!isSimple())return;if(c.checked){simpleActive.add(line.id);simplePreferences.add(line.id);}else{simpleActive.delete(line.id);simplePreferences.delete(line.id)}refresh()};return c}
let drawFrame=null;
function scheduleDraw(){if(drawFrame!==null)return;drawFrame=requestAnimationFrame(()=>{drawFrame=null;draw()})}
function updateRailStatus(){const states=Object.values(systemStates),loading=states.filter(s=>s.status==='loading').length,errors=states.filter(s=>s.status==='error').length,loaded=states.filter(s=>s.status==='loaded').length;$('#status').textContent=loading?'正在按需加载 '+loading+' 个系统…':errors?'有 '+errors+' 个系统加载失败，可在菜单重试':loaded?'已加载 '+loaded+' 个系统 · '+new Set(rails.flatMap(r=>r.stations.map(s=>s.name))).size+' 个站名 · 仅绘制视野内线路':'勾选系统以加载线路 · 取消勾选即释放';
 for(const config of systemConfigs){const node=systemNodes.get(config.focus);if(!node)continue;const state=systemStates[config.focus];node.status.textContent=state?.status==='loading'?'加载中…':state?.status==='loaded'?'已加载 · 取消勾选可释放':state?.status==='error'?'加载失败：'+state.error:'未加载 · 勾选后加载';node.retry.hidden=state?.status!=='error';node.details.dataset.loadState=state?.status||'unloaded'}
}
function syncRailSystems(){railStore.setWanted(selectedSystemIds())}
const operatorLogos={
 shinkCentral:{name:'JR东海',src:'https://upload.wikimedia.org/wikipedia/commons/6/6c/JR_Central_logo.svg',fallback:'JR东海'},
 shinkWest:{name:'JR西日本',src:'https://upload.wikimedia.org/wikipedia/commons/4/46/JR_West_logo.svg',fallback:'JR西日本'},
 chuo:{name:'JR东日本',src:'https://upload.wikimedia.org/wikipedia/commons/3/30/JR_East_logo.svg',fallback:'JR東日本'},
 keikyu:{name:'京急电铁',src:'https://upload.wikimedia.org/wikipedia/commons/b/b0/Keikyu_logo_small.svg',fallback:'KEIKYU'},
 asakusa:{name:'都营交通',src:'https://upload.wikimedia.org/wikipedia/commons/4/43/Toei_Transportation_combined_logo.svg',fallback:'都営交通'},
 keisei:{name:'京成电铁',src:'https://upload.wikimedia.org/wikipedia/commons/b/b8/Keisei_Logo.svg',fallback:'京成'}
};
for(const [g,info] of Object.entries(fukConfig.groups))operatorLogos[g]={name:info.name,src:info.logo,fallback:info.en};
function operatorLogo(group){const info=operatorLogos[group],badge=document.createElement('span'),img=document.createElement('img'),fallback=document.createElement('span');badge.className='operator-logo operator-'+group;badge.title=info.name;img.src=info.src;img.alt=info.name+' logo';img.width=48;img.height=18;img.decoding='async';img.loading='lazy';img.referrerPolicy='no-referrer';fallback.textContent=info.fallback;fallback.hidden=true;fallback.className='logo-fallback';img.onerror=()=>{img.hidden=true;fallback.hidden=false};badge.append(img,fallback);return badge}
function tree(){
 const systems=systemConfigs;
 for(const config of systems){if(!config.groups.length)continue;const all=config.groups.flatMap(g=>defs[g].map(t=>g+':'+t)),system=document.createElement('details');system.open=false;if(config.focus==='fukutoshin')system.className='fuk-system';const sum=document.createElement('summary');sum.className='system-summary';const title=document.createElement('span');title.className='system-title';title.textContent=config.name;const logos=document.createElement('span');logos.className='system-logos';logos.append(...config.logos.map(operatorLogo));sum.append(checkbox(all),title,logos);system.append(sum);const loadState=document.createElement('div');loadState.className='system-load-state';const loadText=document.createElement('span'),retry=document.createElement('button');retry.textContent='重试';retry.hidden=true;retry.onclick=()=>railStore.retry(config.focus);loadState.append(loadText,retry);system.append(loadState);systemNodes.set(config.focus,{details:system,status:loadText,retry});
 const focus=document.createElement('button');focus.className='system-focus';focus.textContent='定位此系统 ↗';focus.onclick=()=>view(config.focus);system.append(focus);
 if(config.focus==='fukutoshin'){const only=document.createElement('button');only.className='system-focus';only.textContent='仅显示副都心线系统';only.onclick=()=>{activateSystem(config.focus,{only:true});view('fukutoshin')};system.append(only);const control=document.createElement('div');control.className='day-modes';control.innerHTML='<span>线条</span><label><input type="radio" name="fuk-line-style" value="fine"> 精细</label><label><input type="radio" name="fuk-line-style" value="standard"> 标准</label>';control.querySelectorAll('input').forEach(input=>{input.checked=input.value===fukLineStyle;input.onchange=()=>{fukLineStyle=input.value;localStorage.setItem('rail-fuk-line-style',fukLineStyle);draw()}});system.append(control);const note=document.createElement('p');note.className='system-note';note.textContent='各公司区间种别可变化；Fライナー为独立图层，S-TRAIN仅土休日。不展开有乐町线、目黑线。';system.append(note)}
 if(config.focus==='shinkansen'){const note=document.createElement('p');note.className='system-note';note.textContent='东京—博多 · 大站点条：固定停靠；小圆点：部分班次停靠。种别不代表单班列车全程运行。';system.append(note)}
 if(config.focus==='chuo'){const modes=document.createElement('div');modes.className='day-modes';modes.innerHTML='<span>快速停站</span><label><input type="radio" name="day-mode" value="weekday"> 平日</label><label><input type="radio" name="day-mode" value="holiday"> 土休日</label>';modes.querySelectorAll('input').forEach(input=>{input.checked=input.value===dayMode;input.onchange=()=>{dayMode=input.value;localStorage.setItem('rail-day-mode',dayMode);draw();if(!$('#detail').hidden)$('#detail').hidden=true}});system.append(modes);const note=document.createElement('p');note.className='system-note';note.textContent='东京—大月／青梅 · 六类服务 · 立川分岔';system.append(note)}
 for(const g of config.groups){const ts=defs[g],d=document.createElement('details');d.className='company';d.open=true;const sm=document.createElement('summary');sm.append(checkbox(ts.map(t=>g+':'+t)),operatorLogo(g),document.createTextNode(groupNames[g][0]));const n=document.createElement('span');n.className='num';n.dataset.counterGroup=g;n.textContent=ts.length;sm.append(n);d.append(sm);
 const lineOptions=document.createElement('div');lineOptions.className='line-options';for(const line of lineCatalog.filter(line=>line.group===g)){const label=document.createElement('label');label.className='line-entry';const swatch=document.createElement('span');swatch.className='swatch';swatch.style.background=line.color;const name=document.createElement('span');name.textContent=line.name;label.append(lineCheckbox(line),swatch,name);lineOptions.append(label)}d.append(lineOptions);
 for(const id of ts){const t=types.find(x=>x[0]===id),l=document.createElement('label');l.className='service';l.dataset.search=t[1]+t[2]+groupNames[g][0];l.append(checkbox([g+':'+id],true));const sw=document.createElement('span');sw.className='swatch';sw.style.background=t[3];const text=document.createElement('span');text.innerHTML=`<b>${t[1]}</b><small>${t[2]}</small>`;l.append(sw,text);d.append(l)}system.append(d)}$('#tree').append(system)}refresh();
}
function showStation(name,network=null){if(isSimple()){showLineStation(name,network);return}let matches=rails.filter(r=>r.stations.some(s=>s.name===name)&&(!network||network!=='fukutoshin'||r.id.startsWith('Fukutoshin.')));if(!matches.length)return;let s=matches[0].stations.find(s=>s.name===name);let rows=[],seenServices=new Set();for(let r of matches)for(let t of types.filter(t=>available(r,t[0])&&covers(r,r.stations.find(x=>x.name===name),t[0]))){const key=(r.id.startsWith('Fukutoshin.')?'fuk:':group(r)+':')+t[0];if((group(r)==='chuo'||r.id.startsWith('Shinkansen.')||r.id.startsWith('Fukutoshin.'))&&seenServices.has(r.id.startsWith('Shinkansen.')?'shink:'+t[0]:key))continue;seenServices.add(r.id.startsWith('Shinkansen.')?'shink:'+t[0]:key);let st=r.stations.find(x=>x.name===name);rows.push(`<div class="stoprow ${stop(r,st,t[0])?'':'pass'}"><span class="swatch" style="background:${t[3]}"></span><span>${t[1]}<small style="display:block;margin:3px 0 0;font-size:9px">${r.name}</small></span><small>${stopKind(r,st,t[0])===1?'部分班次停靠':stopKind(r,st,t[0])===2?'停靠（运行区间内）':'通过'}</small></div>`)}$('#detail').innerHTML=`<button class="close" aria-label="关闭">×</button><h2>${s.name}</h2><div class="english">${s.en}</div>${rows.join('')}<p class="detailnote">${matches.some(r=>r.id.startsWith('Fukutoshin.'))?'副都心线系统展示各区间停站模式，不保证任意两端均有直通班次。Fライナー跨公司会变更种别；S-TRAIN仅土休日，池袋有上下客限制；狭山支线直通按活动日／班次运行。':matches.some(r=>r.id.startsWith('Shinkansen.'))?'新干线小圆点表示部分班次停靠；仅在该班列车的运行区间内适用。Kodama 不表示存在东京—博多全程直通班次。请按具体车次确认。':'种别停站模式，包含隐藏图层。中央快速当前为'+(dayMode==='weekday'?'平日':'土休日')+'模式；通勤特快为平日上行、通勤快速为平日下行。'}非实时列车列表。</p>`;$('#detail').hidden=false;$('#detail .close').onclick=()=>$('#detail').hidden=true;map.setView([s.coord[1],s.coord[0]],Math.max(13,map.getZoom()));}
const railStore=new RailDataStore(globalThis.RAIL_SYSTEM_FILES||{},{onChange:state=>{rails=state.rails;systemStates=state.states;updateRailStatus();scheduleDraw()}});
async function getSearchIndex(){if(searchIndex)return searchIndex;if(!searchIndexPromise)searchIndexPromise=fetch('rail-search-index.json').then(r=>{if(!r.ok)throw Error('Search unavailable');return r.json()}).then(rows=>searchIndex=rows).catch(error=>{searchIndexPromise=null;throw error});return searchIndexPromise}
const views={network:[[33.4,130.3],[36.12,140.43]],fukutoshin:[[35.28,139.05],[36.1,139.8]],shinkansen:[[33.4,130.3],[35.85,139.9]],keikyu:[[35.21,139.55],[35.86,140.43]],chuo:[[35.57,138.91],[35.84,139.79]],tokyo:[[35.625,139.715],[35.74,139.84]],haneda:[[35.535,139.71],[35.59,139.81]],narita:[[35.72,140.27],[35.84,140.43]]};function view(v){if(systemConfigs.some(c=>c.focus===v))activateSystem(v);map.fitBounds(views[v],{padding:[50,65]});document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===v))}document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));$('#fit').onclick=()=>view('network');$('#zoom-in').onclick=()=>map.zoomIn();$('#zoom-out').onclick=()=>map.zoomOut();$('#labels').onclick=()=>{labelOn=!labelOn;draw()};$('#menu').onclick=()=>document.body.classList.toggle('menu-open');map.on('click',()=>document.body.classList.remove('menu-open'));map.on('moveend zoomend resize',scheduleDraw);$('#all').onclick=()=>{const chosen=isSimple()?simpleActive:active,prefs=isSimple()?simplePreferences:selectionPreferences,keys=isSimple()?lineCatalog.map(line=>line.id):Object.entries(defs).flatMap(([g,ts])=>ts.map(t=>g+':'+t));chosen.clear();for(const key of keys){chosen.add(key);prefs.add(key)}refresh()};$('#none').onclick=()=>{(isSimple()?simpleActive:active).clear();(isSimple()?simplePreferences:selectionPreferences).clear();$('#detail').hidden=true;$('#detail').replaceChildren();refresh()};$('#display-mode-toggle').onclick=()=>setDisplayMode(isSimple()?'detailed':'simple');$('#about').onclick=()=>$('#info').showModal();$('#info .close').onclick=()=>$('#info').close();$('#search').oninput=async e=>{const version=++searchVersion,term=e.target.value.trim().toLowerCase();document.querySelectorAll('.service').forEach(l=>l.style.display=term&&!l.dataset.search.toLowerCase().includes(term)?'none':'');$('#results').replaceChildren();if(!term)return;
 try{const index=await getSearchIndex();if(version!==searchVersion)return;const found=index.filter(s=>(s.name+s.en).toLowerCase().includes(term)).slice(0,6);for(const station of found){const system=station.systems.find(id=>selectedSystemIds().includes(id))||station.systems[0],config=systemConfigs.find(c=>c.focus===system),b=document.createElement('button');b.textContent=station.name+' · '+station.en+' · '+config.name;b.onclick=async()=>{b.disabled=true;await activateSystem(system);showStation(station.name,system==='fukutoshin'?'fukutoshin':null);document.body.classList.remove('menu-open');b.disabled=false};$('#results').append(b)}}catch(error){if(version===searchVersion)$('#results').textContent='搜索暂不可用，请展开系统浏览。'}
};
// Build only the lightweight menus. No railway geometry is fetched on startup.
tree();map.fitBounds(views.tokyo,{padding:[50,65]});

function layerMenu(open){$('#layer-panel').hidden=!open;$('#layers').setAttribute('aria-expanded',String(open))}
$('#layers').onclick=()=>layerMenu($('#layer-panel').hidden);
$('#layer-close').onclick=()=>layerMenu(false);
document.querySelectorAll('[name="basemap"]').forEach(r=>r.onchange=()=>basemap(r.value));
document.addEventListener('keydown',e=>{if(e.key==='Escape')layerMenu(false)});
L.DomEvent.disableClickPropagation($('#layer-panel'));
L.DomEvent.disableScrollPropagation($('#layer-panel'));
basemap(localStorage.getItem('rail-basemap')||'dark');
