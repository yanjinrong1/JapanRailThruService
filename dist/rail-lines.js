// Physical line definitions are independent of the detailed train-service keys.
globalThis.RailLineModel={
 stationName(name){return name.replace(/[（(〈<].*?[)）〉>]/g,'').trim()},
 parts(line,rows){const result=[];for(const part of line.parts){const spec=typeof part==='string'?{route:part}:part,r=rows.find(r=>r.id===spec.route);if(!r)continue;if(!spec.from&&!spec.to){result.push(r);continue}const first=spec.from?r.stations.findIndex(s=>s.name===spec.from):0,last=spec.to?r.stations.findIndex(s=>s.name===spec.to):r.stations.length-1;if(first<0||last<first)continue;const distance=(a,b)=>(a[0]-b[0])**2*.66+(a[1]-b[1])**2,nearest=p=>r.coords.reduce((best,c,i)=>distance(c,p)<distance(r.coords[best],p)?i:best,0),a=nearest(r.stations[first].coord),b=nearest(r.stations[last].coord);result.push({...r,coords:r.coords.slice(a,b+1),stations:r.stations.slice(first,last+1)})}return result}
};
