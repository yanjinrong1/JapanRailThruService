"""Replace Kamata–Tobe with an operator-filtered Keikyu track graph (MLIT N02 2024)."""
import json,math,heapq,pathlib
root=pathlib.Path(__file__).parent
sections=json.load(open(root/'data/keikyu-main-mlit-2024.json'))
assert all(s['operator']=='京浜急行電鉄' and s['line']=='本線' for s in sections)
def distance(a,b):return math.hypot((a[0]-b[0])*.81,a[1]-b[1])*111000
graph={}
for section in sections:
 cs=[tuple(p) for p in section['coordinates']]
 for a,b in zip(cs,cs[1:]):
  graph.setdefault(a,{})[b]=distance(a,b);graph.setdefault(b,{})[a]=distance(a,b)
rails=json.load(open(root/'dist/rail-data.json'));rail=next(r for r in rails if r['id']=='Keikyu.Main')
stations={s['name']:s for s in rail['stations']}
start=min(graph,key=lambda p:distance(p,stations['京急蒲田']['coord']));end=min(graph,key=lambda p:distance(p,stations['戸部']['coord']))
queue=[(0,start)];cost={start:0};parent={}
while queue:
 d,p=heapq.heappop(queue)
 if p==end:break
 if d!=cost[p]:continue
 for q,w in graph[p].items():
  nd=d+w
  if nd<cost.get(q,math.inf):cost[q]=nd;parent[q]=p;heapq.heappush(queue,(nd,q))
assert end in parent,'Keikyu graph disconnected; never substitute another operator'
path=[end]
while path[-1]!=start:path.append(parent[path[-1]])
path.reverse()
cs=rail['coords'];a=min(range(len(cs)),key=lambda i:distance(cs[i],start));b=min(range(len(cs)),key=lambda i:distance(cs[i],end));assert a<b
rail['coords']=cs[:a]+[list(p) for p in path]+cs[b+1:]
rail['geometrySources']=[{'section':'京急蒲田–戸部（横浜を含む）','operator':'京浜急行電鉄','line':'本線','dataset':'MLIT N02 2024','source':'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2024.html'}]
for s in rail['stations'][11:27]:
 # A correct own-track route must pass close to every intermediate Keikyu station.
 best=min(distance(p,s['coord']) for p in rail['coords']);assert best<100,(s['name'],best)
print(f'Replaced {b-a+1} schematic vertices with {len(path)} Keikyu-only vertices; length {cost[end]/1000:.2f} km')
json.dump(rails,open(root/'dist/rail-data.json','w'),ensure_ascii=False,separators=(',',':'))
