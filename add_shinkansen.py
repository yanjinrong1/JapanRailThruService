"""MLIT N02: only Tokaido/Sanyo Shinkansen geometry; no conventional lines."""
import json,pathlib,math,heapq
root=pathlib.Path(__file__).parent;data=json.load(open(root/'data/shinkansen-mlit-2024.json'))
orders=[('Shinkansen.Tokaido','東海道新幹線','東海旅客鉄道','東京,品川,新横浜,小田原,熱海,三島,新富士,静岡,掛川,浜松,豊橋,三河安城,名古屋,岐阜羽島,米原,京都,新大阪'),('Shinkansen.Sanyo','山陽新幹線','西日本旅客鉄道','新大阪,新神戸,西明石,姫路,相生,岡山,新倉敷,福山,新尾道,三原,東広島,広島,新岩国,徳山,新山口,厚狭,新下関,小倉,博多')]
def dist(a,b):return math.hypot((a[0]-b[0])*.82,a[1]-b[1])*111000
g={}
for s in data['sections']:
 assert (s['operator'],s['line']) in [('東海旅客鉄道','東海道新幹線'),('西日本旅客鉄道','山陽新幹線')]
 cs=[tuple(p) for p in s['coordinates']]
 for a,b in zip(cs,cs[1:]):g.setdefault(a,{})[b]=dist(a,b);g.setdefault(b,{})[a]=dist(a,b)
def snap(coord):
 best=None
 for a,edges in g.items():
  for b in edges:
   dx=(b[0]-a[0])*.82;dy=b[1]-a[1];t=max(0,min(1,(((coord[0]-a[0])*.82)*dx+(coord[1]-a[1])*dy)/(dx*dx+dy*dy or 1)))
   p=(a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1]));d=dist(p,coord)
   if best is None or d<best[0]:best=(d,a,b,p)
 _,a,b,p=best
 if dist(p,a)<.01:return a
 if dist(p,b)<.01:return b
 del g[a][b];del g[b][a]
 for q in (a,b):g.setdefault(p,{})[q]=dist(p,q);g[q][p]=dist(p,q)
 return p
english=dict(zip('東京,品川,新横浜,小田原,熱海,三島,新富士,静岡,掛川,浜松,豊橋,三河安城,名古屋,岐阜羽島,米原,京都,新大阪,新神戸,西明石,姫路,相生,岡山,新倉敷,福山,新尾道,三原,東広島,広島,新岩国,徳山,新山口,厚狭,新下関,小倉,博多'.split(','),'Tokyo,Shinagawa,Shin-Yokohama,Odawara,Atami,Mishima,Shin-Fuji,Shizuoka,Kakegawa,Hamamatsu,Toyohashi,Mikawa-Anjo,Nagoya,Gifu-Hashima,Maibara,Kyoto,Shin-Osaka,Shin-Kobe,Nishi-Akashi,Himeji,Aioi,Okayama,Shin-Kurashiki,Fukuyama,Shin-Onomichi,Mihara,Higashi-Hiroshima,Hiroshima,Shin-Iwakuni,Tokuyama,Shin-Yamaguchi,Asa,Shin-Shimonoseki,Kokura,Hakata'.split(',')))
stations={};nodes={}

for rid,line,operator,names in orders:
 for name in names.split(','):
  if name in stations:continue
  candidates=[s for s in data['stations'] if s['name']==name and s['line']==line and s['operator']==operator]
  assert candidates,name
  s=candidates[0];nodes[name]=snap((s['lng'],s['lat']));stations[name]={'id':'Shinkansen.Station.'+name,'name':name,'en':english[name],'coord':list(nodes[name])}
def route(start,end):
 q=[(0,start)];cost={start:0};prev={}
 while q:
  d,p=heapq.heappop(q)
  if p==end:break
  if d!=cost[p]:continue
  for n,w in g[p].items():
   nd=d+w
   if nd<cost.get(n,math.inf):cost[n]=nd;prev[n]=p;heapq.heappush(q,(nd,n))
 assert end in cost,'Disconnected Shinkansen graph: never substitute road/conventional rail'
 path=[end]
 while path[-1]!=start:path.append(prev[path[-1]])
 return list(reversed(path))
new=[]
for rid,line,operator,names in orders:
 names=names.split(',');path=route(nodes[names[0]],nodes[names[-1]])
 # All station anchors must lie on the same continuous, operator-filtered line.
 for name in names:assert nodes[name] in path,name
 new.append({'id':rid,'name':line,'coords':[list(p) for p in path],'stations':[stations[name] for name in names],'geometrySources':[{'operator':operator,'line':line,'dataset':'MLIT N02 2024','source':'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2024.html'}]})
 print(rid,len(path),len(names))
rs=json.load(open(root/'dist/rail-data.json'));rs=[r for r in rs if not r['id'].startswith('Shinkansen.')]+new
json.dump(rs,open(root/'dist/rail-data.json','w'),ensure_ascii=False,separators=(',',':'))
