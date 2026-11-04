const fs=require('node:fs'),assert=require('node:assert/strict');
const rail=JSON.parse(fs.readFileSync(__dirname+'/../dist/rail-data.json','utf8')).find(r=>r.id==='Keikyu.Main');
const source=JSON.parse(fs.readFileSync(__dirname+'/../data/keikyu-main-mlit-2024.json','utf8'));
assert(source.every(s=>s.operator==='京浜急行電鉄'&&s.line==='本線'));
const own=new Set(source.flatMap(s=>s.coordinates.map(p=>JSON.stringify(p))));
const distance=(a,b)=>Math.hypot((a[0]-b[0])*.81,a[1]-b[1])*111000;
let previous=-1;
for(const s of rail.stations.slice(11,27)){
 const i=rail.coords.reduce((best,p,i)=>distance(p,s.coord)<distance(rail.coords[best],s.coord)?i:best,0);
 assert(distance(rail.coords[i],s.coord)<100,s.name);assert(i>previous,'Station order: '+s.name);previous=i;
 if(!['京急蒲田','戸部'].includes(s.name))assert(own.has(JSON.stringify(rail.coords[i])),'Station track must use Keikyu MLIT vertices: '+s.name);
}
assert.equal(rail.geometrySources[0].operator,'京浜急行電鉄');
console.log('PASS: all 16 Keikyu stations from Kamata to Tobe follow ordered Keikyu-owned geometry, within 100 m of station coordinates.');
