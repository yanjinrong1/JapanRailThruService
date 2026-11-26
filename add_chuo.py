import json,pathlib,math,heapq
root=pathlib.Path(__file__).parent
src=pathlib.Path('/workspace/mini-tokyo/data');rr={r['id']:r for r in json.load(open(src/'railways.json'))};st={s['id']:s for s in json.load(open(src/'stations.json'))}
sections=json.load(open(root/'data/chuo-ome-mlit-2024.json'))
def dist(a,b):return math.hypot((a[0]-b[0])*.81,a[1]-b[1])*111000
def build_graph(line):
 g={}
 for s in sections:
  if s['line']!=line:continue
  ps=[tuple(p) for p in s['coordinates']]
  for a,b in zip(ps,ps[1:]):g.setdefault(a,{})[b]=dist(a,b);g.setdefault(b,{})[a]=dist(a,b)
 return g
def route(g,stations):
 nodes=[min(g,key=lambda p:dist(p,s['coord'])) for s in stations];out=[]
 for start,end in zip(nodes,nodes[1:]):
  q=[(0,start)];cost={start:0};prev={}
  while q:
   d,p=heapq.heappop(q)
   if p==end:break
   if d!=cost[p]:continue
   for n,w in g[p].items():
    nd=d+w
    if nd<cost.get(n,math.inf):cost[n]=nd;prev[n]=p;heapq.heappush(q,(nd,n))
  assert end in cost,('disconnected',start,end)
  path=[end]
  while path[-1]!=start:path.append(prev[path[-1]])
  path.reverse();out.extend(path if not out else path[1:])
 return [list(p) for p in out]
def station_list(rid):return [st[s] for s in rr[rid]['stations']]
main=station_list('JR-East.ChuoRapid');west=station_list('JR-East.Chuo');west=west[1:next(i for i,s in enumerate(west) if s['title']['ja']=='大月')+1];ome=station_list('JR-East.Ome')[:13]
i=next(i for i,s in enumerate(main) if s['title']['ja']=='立川');g=build_graph('中央線');og=build_graph('青梅線')
# Pin the rapid-line station to the southern 7/8 platform track, not the
# middle Tozai turnback stub. Insert a projected station node into that edge.
a=(139.66735,35.7056);b=(139.66482,35.70551)
x=139.66594;t=(x-a[0])/(b[0]-a[0]);nakano=(x,a[1]+t*(b[1]-a[1]))
assert b in g[a]
del g[a][b];del g[b][a]
for endpoint in (a,b):g.setdefault(nakano,{})[endpoint]=dist(nakano,endpoint);g[endpoint][nakano]=dist(nakano,endpoint)
next(s for s in main if s['title']['ja']=='中野')['coord']=list(nakano)
new=[]
for rid,name,ss,graph in [('JR-East.Chuo.Trunk','中央快速线（东京—立川）',main[:i+1],g),('JR-East.Chuo.West','中央线（立川—大月）',main[i:]+west[1:],g),('JR-East.Chuo.Ome','青梅线（立川—青梅）',ome,og)]:
 cs=(route(build_graph('東北線'),ss[:2])+route(graph,ss[1:])) if rid.endswith('.Trunk') else route(graph,ss)
 out={'id':rid,'name':name,'coords':cs,'stations':[{'id':s['id'],'name':s['title']['ja'],'en':s['title']['en'],'coord':s['coord']} for s in ss],'geometrySources':[{'operator':'東日本旅客鉄道','line':'青梅線' if graph is og else '中央線','dataset':'MLIT N02 2024'}]}
 new.append(out);print(rid,len(cs),len(ss),ss[0]['title']['ja'],ss[-1]['title']['ja'])
# One physical Tachikawa junction shared by all three railway sections.
junction=new[0]['coords'][-1]
for r in new:
 for s in r['stations']:
  if s['name']=='立川':s['coord']=junction[:]
 if r is not new[0]:r['coords'][0]=junction[:]
rs=json.load(open(root/'dist/rail-data.json'));rs=[r for r in rs if not r['id'].startswith('JR-East.Chuo.')]+new
json.dump(rs,open(root/'dist/rail-data.json','w'),ensure_ascii=False,separators=(',',':'))
