const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/../dist/app.js','utf8'),all=JSON.parse(fs.readFileSync(__dirname+'/../dist/rail-data.json','utf8')),fuk=all.filter(r=>r.id.startsWith('Namboku.'));
const c=vm.createContext({document:{querySelector(){return {}}},localStorage:{getItem:()=>null},console});vm.runInContext(fs.readFileSync(__dirname+'/../dist/namboku.js','utf8'),c);vm.runInContext(source.slice(0,source.indexOf('let rails=')),c);
assert.equal(fuk.length,8);assert.equal(new Set(fuk.flatMap(r=>r.stations.map(s=>s.name))).size,83);
const route=k=>fuk.find(r=>r.id==='Namboku.'+k),kind=(key,name,type)=>{const r=route(key),station=r.stations.find(s=>s.name===name);assert(station,name);return c.stopKind(r,station,type)};
for(const k of ['Namboku','Mita','Saitama'])for(const s of route(k).stations)assert.equal(kind(k,s.name,'nmLocal'),2);
assert.equal(kind('Meguro','不動前','nmExpress'),0);assert.equal(kind('Meguro','武蔵小山','nmExpress'),2);assert.equal(kind('Meguro','新丸子','nmExpress'),0);assert.equal(kind('Meguro','多摩川','nmExpress'),2);
assert.equal(kind('SotetsuMain','鶴ヶ峰','nmLimited'),0);assert.equal(kind('SotetsuMain','鶴ヶ峰','nmCommuterLimited'),2);assert(!c.covers(route('SotetsuMain'),route('SotetsuMain').stations.find(s=>s.name==='大和'),'nmCommuterLimited'));
assert.equal(kind('SotetsuIzumino','緑園都市','nmLimited'),0);assert.equal(kind('SotetsuIzumino','いずみ野','nmCommuterLimited'),2);
for(const k of ['TokyuShinYokohama','SotetsuShinYokohama','SotetsuMain','SotetsuIzumino']){const r=route(k),original=all.find(r=>r.id==='Fukutoshin.'+k);assert.deepEqual(r.coords,original.coords);assert.deepEqual(r.stations,original.stations)}
const distance=(a,b)=>Math.hypot((a[0]-b[0])*.81,a[1]-b[1])*111000;
for(const r of fuk){let prev=-1;for(const s of r.stations){const i=r.coords.reduce((best,p,i)=>distance(p,s.coord)<distance(r.coords[best],s.coord)?i:best,0);assert(distance(r.coords[i],s.coord)<.1,r.name+': '+s.name);assert(i>prev,r.name+': station order '+s.name);prev=i}assert(r.coords.every((p,i)=>!i||distance(p,r.coords[i-1])<1500),r.name+' unexpected jump')}
assert(route('Meguro').geometrySources.every(s=>s.operator==='東急電鉄'));assert.equal(route('Meguro').stations.length,13);assert.equal(route('Mita').stations.at(-1).name,'西高島平');assert.equal(route('Saitama').stations.at(-1).name,'浦和美園');
console.log('PASS: 83 stations, own-operator geometry, continuous ordered station anchors, reused southern geometry, express skips, Metro all stops and commuter-limited bounds.');
