import json,pathlib
src=pathlib.Path('/workspace/mini-tokyo/data'); out=pathlib.Path(__file__).parent/'dist'
raw=json.load(open(src/'coordinates.json')); rails=json.load(open(src/'railways.json')); stations={s['id']:s for s in json.load(open(src/'stations.json'))}
ids=['Keikyu.Main','Keikyu.Airport','Keikyu.Zushi','Keikyu.Kurihama','Toei.Asakusa','Keisei.Oshiage','Keisei.Main','Keisei.NaritaSkyAccess','Hokuso.Hokuso','Keisei.HigashiNarita','Shibayama.Shibayama']
cs={r['id']:[p[:2] for sub in r['sublines'] if sub.get('opacity',1)!=0 for p in sub.get('coords',[])] for r in raw['railways']}
result=[]
for r in rails:
 if r['id'] not in ids:continue
 rid=r['id']; ss=[stations[s] for s in r['stations']]; coords=cs[rid]
 if rid=='Hokuso.Hokuso':coords=cs['Keisei.NaritaSkyAccess']
 # Context stations in upstream data are excluded from branch geometry.
 if rid=='Keikyu.Airport':ss=ss[1:]
 if rid=='Keikyu.Kurihama':ss=ss[1:]
 def near(p):return min(range(len(coords)),key=lambda i:(coords[i][0]-p[0])**2*.66+(coords[i][1]-p[1])**2)
 indexes=[near(s['coord']) for s in ss]
 # Railway vertices, clipped to endpoints, retain curves between stations.
 a,b=indexes[0],indexes[-1]; path=coords[min(a,b):max(a,b)+1]
 if a>b:path=path[::-1]
 result.append({'id':rid,'name':r['title']['ja'],'coords':path,'stations':[{'id':s['id'],'name':s['title']['ja'],'en':s['title']['en'],'coord':s['coord']} for s in ss]})
json.dump(result,open(out/'rail-data.json','w'),ensure_ascii=False,separators=(',',':'))
print([(r['id'],len(r['coords']),len(r['stations'])) for r in result])
# Fill shared-track gaps with the referenced railway geometry, never road routes.
import math
def dist(a,b):return math.hypot((a[0]-b[0])*.81,a[1]-b[1])*111
for r in result:
 fixed=[]
 for a,b in zip(r['coords'],r['coords'][1:]):
  fixed.append(a)
  if dist(a,b)<.5:continue
  options=[]
  for name,points in cs.items():
   if name==r['id'] or len(points)<3:continue
   ia=min(range(len(points)),key=lambda i:dist(a,points[i])); ib=min(range(len(points)),key=lambda i:dist(b,points[i])); err=dist(a,points[ia])+dist(b,points[ib])
   if err>.5 or ia==ib:continue
   seg=points[min(ia,ib):max(ia,ib)+1];seg=seg if ia<ib else seg[::-1]
   length=sum(dist(x,y) for x,y in zip(seg,seg[1:]))
   if length<dist(a,b)*2:options.append((err,seg))
  if options:fixed.extend(min(options,key=lambda v:v[0])[1])
 fixed.append(r['coords'][-1]);r['coords']=fixed
json.dump(result,open(out/'rail-data.json','w'),ensure_ascii=False,separators=(',',':'))
# Always restore the operator-verified Keikyu section after generating schematic data.
import subprocess,sys
subprocess.run([sys.executable,str(pathlib.Path(__file__).parent/'repair_keikyu.py')],check=True)

subprocess.run([sys.executable,str(pathlib.Path(__file__).parent/'add_chuo.py')],check=True)
subprocess.run([sys.executable,str(pathlib.Path(__file__).parent/'add_shinkansen.py')],check=True)
subprocess.run([sys.executable,str(pathlib.Path(__file__).parent/'add_fukutoshin.py')],check=True)
subprocess.run([sys.executable,str(pathlib.Path(__file__).parent/'build_fukutoshin_config.py')],check=True)

# Add the Namboku/Mita corridor after Fukutoshin shared geometry exists.
import runpy
runpy.run_path(str(pathlib.Path(__file__).parent/"add_namboku.py"))
runpy.run_path(str(pathlib.Path(__file__).parent/"build_namboku_config.py"))

subprocess.run([sys.executable,str(pathlib.Path(__file__).parent/'add_hanzomon.py')],check=True)
subprocess.run([sys.executable,str(pathlib.Path(__file__).parent/'build_hanzomon_config.py')],check=True)

subprocess.run([sys.executable,str(pathlib.Path(__file__).parent/'add_odakyu.py')],check=True)
subprocess.run([sys.executable,str(pathlib.Path(__file__).parent/'build_odakyu_config.py')],check=True)

subprocess.run([sys.executable,str(pathlib.Path(__file__).parent/'add_shinjuku.py')],check=True)
subprocess.run([sys.executable,str(pathlib.Path(__file__).parent/'build_shinjuku_config.py')],check=True)
