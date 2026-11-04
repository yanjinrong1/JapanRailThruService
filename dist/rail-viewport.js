// Screen-space line clipping prevents offscreen national routes from being
// subdivided/tessellated at street-level zoom. Retain source order for termini.
globalThis.RailViewport={
 contains(rect,p){return !rect||(p.x>=rect[0]&&p.y>=rect[1]&&p.x<=rect[2]&&p.y<=rect[3])},
 clip(points,rect){if(!rect)return points.length>1?[points]:[];const chunks=[];let current=[];
  const flush=()=>{if(current.length>1)chunks.push(current);current=[]};
  for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],dx=b.x-a.x,dy=b.y-a.y;let low=0,high=1,valid=true;
   const values=[[-dx,a.x-rect[0]],[dx,rect[2]-a.x],[-dy,a.y-rect[1]],[dy,rect[3]-a.y]];
   for(const [p,q]of values){if(p===0){if(q<0){valid=false;break}}else{const t=q/p;if(p<0)low=Math.max(low,t);else high=Math.min(high,t);if(low>high){valid=false;break}}}
   if(!valid){flush();continue}
   const lerp=t=>({x:a.x+t*dx,y:a.y+t*dy,order:a.order+t*(b.order-a.order)}),start=lerp(low),end=lerp(high);
   if(current.length&&Math.hypot(current.at(-1).x-start.x,current.at(-1).y-start.y)>1e-5)flush();
   if(!current.length)current.push(start);if(Math.hypot(current.at(-1).x-end.x,current.at(-1).y-end.y)>1e-6)current.push(end);
   if(high<1)flush();
  }flush();return chunks;
 },
 trim(points,normals,end=Infinity){const result=[];for(let i=0;i<points.length;i++){const p=points[i],n=normals[i];if(p.order<=end){result.push({p,n});continue}if(i>0&&points[i-1].order<end){const a=points[i-1],na=normals[i-1],t=(end-a.order)/(p.order-a.order);result.push({p:{x:a.x+t*(p.x-a.x),y:a.y+t*(p.y-a.y)},n:{x:na.x+t*(n.x-na.x),y:na.y+t*(n.y-na.y)}})}break}return result}
};
