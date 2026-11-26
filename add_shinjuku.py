"""Own-railway geometry for Toei Shinjuku and Keio, keeping both Shinjuku platforms distinct."""
import json,pathlib,math,heapq,re
root=pathlib.Path(__file__).parent
src=pathlib.Path('/workspace/mini-tokyo/data');rr={r['id']:r for r in json.load(open(src/'railways.json'))};mini={s['id']:s for s in json.load(open(src/'stations.json'))}
def names(rid):return [mini[s]['title']['ja'].split('〈')[0] for s in rr[rid]['stations']]
specs=[
 ('Metro','都营新宿线','sjToei',[('東京都','10号線新宿線')],names('Toei.Shinjuku')),
 ('Main','京王本线','sjKeio',[('京王電鉄','京王線')],names('Keio.Keio')),
 ('New','京王新线','sjKeio',[('京王電鉄','京王線')],names('Keio.KeioNew')),
 ('Sagamihara','京王相模原线','sjKeio',[('京王電鉄','相模原線')],names('Keio.Sagamihara')[1:]),
 ('Takao','京王高尾线','sjKeio',[('京王電鉄','高尾線')],names('Keio.Takao')[1:])]
path=root/'data/shinjuku-mlit-2024.json'
if not path.exists():
 allowed=set(pair for spec in specs for pair in spec[3]);sections=[s for s in json.load(open('/workspace/mlit-json/data/sections.json')) if (s['operator'],s['line']) in allowed];stations=[s for s in json.load(open('/workspace/mlit-json/data/stations.json')) if (s['operator'],s['line']) in allowed]
 json.dump({'sections':sections,'stations':stations},open(path,'w'),ensure_ascii=False,separators=(',',':'))
data=json.load(open(path))
def dist(a,b):return math.hypot((a[0]-b[0])*.81,a[1]-b[1])*111000
def normalize(name):return name.split('〈')[0].split('<')[0].replace('ケ','ヶ').replace('・','').replace(' ', '')
def graph_for(pairs):
 g={}
 for s in data['sections']:
  if (s['operator'],s['line']) not in pairs:continue
  ps=[tuple(p) for p in s['coordinates']]
  for a,b in zip(ps,ps[1:]):g.setdefault(a,{})[b]=dist(a,b);g.setdefault(b,{})[a]=dist(a,b)
 return g
def snap(g,c):
 best=None
 for a,edges in g.items():
  for b in edges:
   dx=(b[0]-a[0])*.81;dy=b[1]-a[1];t=max(0,min(1,((c[0]-a[0])*.81*dx+(c[1]-a[1])*dy)/(dx*dx+dy*dy or 1)));p=(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);d=dist(c,p)
   if best is None or d<best[0]:best=(d,a,b,p)
 d,a,b,p=best
 assert d<220,('station too far from own railway',c,d)
 if dist(p,a)<.01:return a
 if dist(p,b)<.01:return b
 del g[a][b];del g[b][a]
 for q in (a,b):g.setdefault(p,{})[q]=dist(p,q);g[q][p]=dist(p,q)
 return p
def shortest(g,a,b):
 q=[(0,a)];cost={a:0};prev={}
 while q:
  d,p=heapq.heappop(q)
  if p==b:break
  if d!=cost[p]:continue
  for n,w in g[p].items():
   nd=d+w
   if nd<cost.get(n,math.inf):cost[n]=nd;prev[n]=p;heapq.heappush(q,(nd,n))
 assert b in cost,('disconnected own-operator graph',a,b)
 out=[b]
 while out[-1]!=a:out.append(prev[out[-1]])
 return list(reversed(out))
result=[]
for key,title,group,pairs,station_names in specs:
 g=graph_for(pairs);ss=[];nodes=[]
 for name in station_names:
  candidates=[s for s in data['stations'] if normalize(s['name'])==normalize(name) and (s['operator'],s['line']) in pairs]
  assert candidates,(key,name)
  # MLIT station midpoints keep snapping on the operator's own platforms.
  railway={'Metro':'Toei.Shinjuku','Main':'Keio.Keio','New':'Keio.KeioNew','Sagamihara':'Keio.Sagamihara','Takao':'Keio.Takao'}[key]
  hint=next(s['coord'] for s in mini.values() if s.get('railway')==railway and normalize(s['title']['ja'])==normalize(name))
  official=min(candidates,key=lambda s:dist((s['lng'],s['lat']),hint));coord=snap(g,(official['lng'],official['lat']));nodes.append(coord)
  en=next((s['title']['en'] for s in mini.values() if normalize(s['title']['ja'])==normalize(name)),name)
  display='新線新宿' if name=='新宿' and key in ['Metro','New'] else name
  ss.append({'id':'ShinjukuSystem.Station.'+normalize(display),'name':display,**({'displayName':'新宿'} if display=='新線新宿' else {}),'en':'Shinsen-Shinjuku' if display=='新線新宿' else en,'coord':list(coord)})
 # First trace the continuous running line. Station markers are projected onto
 # that path, so a nearby siding/platform stub cannot force a train to reverse.
 coords=shortest(g,nodes[0],nodes[-1]);insertions={};previous=-1
 for station in ss:
  c=station['coord'];best=None
  for i,(a,b) in enumerate(zip(coords,coords[1:])):
   dx=(b[0]-a[0])*.81;dy=b[1]-a[1];t=max(0,min(1,((c[0]-a[0])*.81*dx+(c[1]-a[1])*dy)/(dx*dx+dy*dy or 1)));p=(a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1]));d=dist(c,p)
   if best is None or d<best[0]:best=(d,i,t,p)
  d,i,t,p=best;assert d<220,(key,station['name'],d);assert i+t>=previous-.001,(key,station['name'],'wrong station order');previous=i+t
  station['coord']=list(p);insertions.setdefault(i,[]).append((t,p))
 dense=[]
 for i,a in enumerate(coords[:-1]):
  if not dense or dist(a,dense[-1])>.001:dense.append(a)
  for t,p in sorted(insertions.get(i,[])):
   if dist(p,dense[-1])>.001:dense.append(p)
 if dist(coords[-1],dense[-1])>.001:dense.append(coords[-1])
 coords=dense
 result.append({'id':'ShinjukuSystem.'+key,'name':title,'group':group,'coords':[list(p) for p in coords],'stations':ss,'geometrySources':[{'operator':op,'line':line,'dataset':'MLIT N02 2024'} for op,line in pairs]})
 print(key,len(coords),len(ss))
# Trace westward out of the Toei line, preserving consistent offsets through the New Line.
for route in result:
 if route['id']=='ShinjukuSystem.Metro':route['coords'].reverse();route['stations'].reverse()
# Borders / junctions share one physical marker; keep unrelated stations separate.
shared={}
for r in result:
 for s in r['stations']:
  shared.setdefault(s['id'],[]).append((r,s))
for station_id,entries in shared.items():
 if len(entries)<2:continue
 # Prefer the Metro / trunk railway's platform coordinate at operator boundaries.
 canonical=entries[0][1]['coord'][:]
 for r,s in entries:
  old=s['coord'][:];index=min(range(len(r['coords'])),key=lambda i:dist(r['coords'][i],old))
  assert dist(old,canonical)<180,(s['name'],dist(old,canonical))
  r['coords'][index]=canonical[:];s['coord']=canonical[:];s['junction']=True
rs=json.load(open(root/'dist/rail-data.json'));rs=[r for r in rs if not r['id'].startswith('ShinjukuSystem.')]+result
json.dump(rs,open(root/'dist/rail-data.json','w'),ensure_ascii=False,separators=(',',':'))
print('Unique Shinjuku-corridor stations:',len(shared))
