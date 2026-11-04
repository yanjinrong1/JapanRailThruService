const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/../dist/app.js','utf8');const rails=JSON.parse(fs.readFileSync(__dirname+'/../dist/rail-data.json','utf8'));
const chuo=rails.filter(r=>r.id.startsWith('JR-East.Chuo.'));
assert.equal(chuo.length,3);assert.deepEqual(chuo.map(r=>r.stations.at(-1).name),['立川','大月','青梅']);assert.equal(new Set(chuo.flatMap(r=>r.stations.map(s=>s.name))).size,44);assert(!chuo.some(r=>r.stations.some(s=>['奥多摩','甲府','宮ノ平','千葉','大宮'].includes(s.name))));
const c=vm.createContext({document:{querySelector(){return {}}},localStorage:{getItem:()=>null},console});vm.runInContext(source.slice(0,source.indexOf('let rails=')),c);
const trunk=chuo[0],west=chuo[1],ome=chuo[2];const station=(r,name)=>{let s=r.stations.find(s=>s.name===name);assert(s,name);return s};
function stops(r,name,t){return c.stop(r,station(r,name),t)}
assert(stops(trunk,'高円寺','cRapid'));vm.runInContext("dayMode='holiday'",c);assert(!stops(trunk,'高円寺','cRapid'));assert(stops(trunk,'荻窪','cRapid'));assert(!stops(trunk,'新宿','cLocal'));assert(!c.available(trunk,'cLocal'));
assert(!stops(trunk,'中野','cCommuterSpecial'));assert(stops(trunk,'国分寺','cCommuterSpecial'));assert(!stops(west,'日野','cCommuterSpecial'));assert(stops(west,'八王子','cCommuterSpecial'));assert(stops(west,'大月','cSpecial'));
for(const s of ome.stations)assert(c.stop(ome,s,'cOmeSpecial'));
vm.runInContext("if(defs.chuo.length!==6||types.some(t=>['cHoliday','cOmeLimited'].includes(t[0])))throw Error('Removed services still present')",c);
assert(!c.available(west,'cOmeLimited'));assert(!c.available(west,'cOmeSpecial'));assert(!c.available(ome,'cSpecial'));assert(c.available(rails.find(r=>r.id==='Keisei.Main'),'commuter'));
for(const r of chuo){assert(r.geometrySources[0].operator==='東日本旅客鉄道');let prev=-1;for(const s of r.stations){const dist=p=>Math.hypot((p[0]-s.coord[0])*.81,p[1]-s.coord[1])*111000;const i=r.coords.reduce((b,p,i)=>dist(p)<dist(r.coords[b])?i:b,0);assert(dist(r.coords[i])<150,s.name);assert(i>=prev,s.name);prev=i}}
console.log('PASS: 44 Chuo/Ome stations, scope limits, weekday/holiday rapid, branch availability, commuter skips, six retained service types, JR-owned ordered geometry and existing Keisei commuter service.');

const nakano=station(trunk,'中野');assert(nakano.coord[1]<35.70565,'Nakano must anchor to southern 7/8 platform track');
const local=trunk.coords.filter(p=>p[0]>139.664&&p[0]<139.668&&p[1]>35.705&&p[1]<35.707);assert(local.every(p=>p[1]<35.70565));for(let i=1;i<local.length;i++)assert(local[i][0]<=local[i-1][0],'Nakano route must not backtrack');
const junctions=chuo.map(r=>station(r,'立川').coord);assert(junctions.every(p=>JSON.stringify(p)===JSON.stringify(junctions[0])));
const nodes=[];Object.assign(c,{railData:chuo,nodes,root:{replaceChildren(){}},el:(tag,attrs)=>{const n={tag,attrs,addEventListener(){}};nodes.push(n);return n},point:p=>({x:p[0]*10000,y:-p[1]*10000}),map:{getZoom:()=>14,layerPointToContainerPoint:p=>p,getSize:()=>({x:100,y:100})},L:{point:(x,y)=>({x,y})}});
vm.runInContext(source.slice(source.indexOf('function displayMetrics'),source.indexOf('function refresh()')),c);vm.runInContext("let rails=railData,active=new Set(defs.chuo.map(t=>'chuo:'+t)),labelOn=false,dark=true;draw()",c);assert.equal(nodes.filter(n=>n.attrs['data-station']==='立川').length,1,'Render exactly one Tachikawa marker');
console.log('PASS: Nakano 7/8 platform geometry without backtracking, shared Tachikawa anchor and exactly one rendered junction marker.');
