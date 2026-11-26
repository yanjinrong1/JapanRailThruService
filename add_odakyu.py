"""Own-railway geometry for the Odakyu/Chiyoda/Joban-local corridor."""
import json,pathlib,math,heapq,re
root=pathlib.Path(__file__).parent
src=pathlib.Path('/workspace/mini-tokyo/data');rr={r['id']:r for r in json.load(open(src/'railways.json'))};mini={s['id']:s for s in json.load(open(src/'stations.json'))}
def names(rid):return [mini[s]['title']['ja'].split('〈')[0] for s in rr[rid]['stations']]
metro=names('TokyoMetro.Chiyoda');metro=metro[metro.index('代々木上原'):]
specs=[
 ('Odawara','小田急小田原线','odOdakyu',[('小田急電鉄','小田原線')],names('Odakyu.Odawara')),
 ('Tama','小田急多摩线','odOdakyu',[('小田急電鉄','多摩線')],names('Odakyu.Tama')),
 ('Enoshima','小田急江之岛线（相模大野—藤泽）','odOdakyu',[('小田急電鉄','江ノ島線')],names('Odakyu.Enoshima')[:14]),
 ('EnoshimaSouth','小田急江之岛线（藤泽—片濑江之岛）','odOdakyu',[('小田急電鉄','江ノ島線')],names('Odakyu.Enoshima')[13:]),
 ('Metro','千代田线','odMetro',[('東京地下鉄','9号線千代田線')],metro[:metro.index('綾瀬')+1]),
 ('KitaAyase','千代田线北绫濑支线','odMetro',[('東京地下鉄','9号線千代田線')],['綾瀬','北綾瀬']),
 ('Joban','JR常磐缓行线','odJR',[('東日本旅客鉄道','常磐線')],names('JR-East.JobanLocal'))]
path=root/'data/odakyu-mlit-2024.json'
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
  hint=next((s['coord'] for s in mini.values() if s.get('railway')=='JR-East.JobanLocal' and normalize(s['title']['ja'])==normalize(name)),None) if key=='Joban' else None
  official=min(candidates,key=lambda s:dist((s['lng'],s['lat']),hint)) if hint else candidates[0];coord=snap(g,(official['lng'],official['lat']));nodes.append(coord)
  en=next((s['title']['en'] for s in mini.values() if normalize(s['title']['ja'])==normalize(name)),name)
  ss.append({'id':'OdakyuSystem.Station.'+normalize(name),'name':name,'en':en,'coord':list(coord)})
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
 result.append({'id':'OdakyuSystem.'+key,'name':title,'group':group,'coords':[list(p) for p in coords],'stations':ss,'geometrySources':[{'operator':op,'line':line,'dataset':'MLIT N02 2024'} for op,line in pairs]})
 print(key,len(coords),len(ss))
# Orient Odakyu inward, matching the Metro/JR outward running direction.
for route in result:
 if route['group']=='odOdakyu':route['coords'].reverse();route['stations'].reverse()
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
rs=json.load(open(root/'dist/rail-data.json'));rs=[r for r in rs if not r['id'].startswith('OdakyuSystem.')]+result
json.dump(rs,open(root/'dist/rail-data.json','w'),ensure_ascii=False,separators=(',',':'))
print('Unique Odakyu-corridor stations:',len(shared))
