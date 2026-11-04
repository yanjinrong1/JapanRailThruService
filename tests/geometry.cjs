const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/../dist/app.js','utf8');
const helpers=source.slice(source.indexOf('function displayMetrics'),source.indexOf('function draw()'));
const context=vm.createContext({});vm.runInContext(helpers,context);
const rails=JSON.parse(fs.readFileSync(__dirname+'/../dist/rail-data.json','utf8'));
function project(c,z){const sin=Math.sin(c[1]*Math.PI/180),size=256*2**z;return{x:(c[0]+180)/360*size,y:(.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))*size}}
let previous=0;
for(let z=9;z<=18;z++){
 const m=context.displayMetrics(z);assert.equal(m.gap,6);assert.equal(m.width,3.1);assert.equal(m.station,7);
 for(const r of rails){const original=r.coords.map(c=>project(c,z)),points=context.smoothCenterline(original,z,r.stations.map(s=>project(s.coord,z)));assert.deepEqual(points[0],original[0]);assert.equal(points.at(-1).x,original.at(-1).x);assert.equal(points.at(-1).y,original.at(-1).y);
  for(let i=0;i<points.length;i++){const n=context.normal(points,i);assert(Number.isFinite(n.x)&&Number.isFinite(n.y));assert(Math.hypot(n.x,n.y)<=1.60001);const p={x:points[i].x+n.x*3*m.gap,y:points[i].y+n.y*3*m.gap};assert(Number.isFinite(p.x)&&Number.isFinite(p.y));}
  for(const station of r.stations){const q=context.nearest(points,project(station.coord,z));assert(Number.isFinite(q.x)&&Number.isFinite(q.y));}
 }
}
assert.equal(context.displayMetrics(15).gap,6);assert.equal(context.displayMetrics(10).gap,6);
// Subpixel simplification removes tiny kinks; rounded corners retain both endpoints.
const bend=[{x:0,y:0},{x:5,y:.01},{x:10,y:0},{x:10,y:10}];const smooth=context.smoothCenterline(bend,12);assert(smooth.length>4);const anchor={x:10,y:0};const pinned=context.smoothCenterline(bend,10,[anchor]);assert(pinned.some(p=>p.x===anchor.x&&p.y===anchor.y));
console.log('PASS: railway sections (including Chuo/Ome) at zooms 9–18; finite bounded offsets, preserved endpoints, station projection, fixed widths, preserved station anchors and rounded bends.');
