"""Publish independently fetchable railway systems and a lightweight search index."""
import json,pathlib,hashlib
root=pathlib.Path(__file__).parent;out=root/'dist';data=json.load(open(out/'rail-data.json'));folder=out/'systems';folder.mkdir(exist_ok=True)
parts={'fukutoshin':[],'shinkansen':[],'chuo':[],'keikyu':[]}
for r in data:
 key='fukutoshin' if r['id'].startswith('Fukutoshin.') else 'shinkansen' if r['id'].startswith('Shinkansen.') else 'chuo' if r['id'].startswith('JR-East.Chuo.') else 'keikyu'
 x=[p[0] for p in r['coords']];y=[p[1] for p in r['coords']];r['bounds']=[min(x),min(y),max(x),max(y)];parts[key].append(r)
manifest={};index={}
for key,rows in parts.items():
 raw=json.dumps(rows,ensure_ascii=False,separators=(',',':'));sha=hashlib.sha256(raw.encode()).hexdigest()[:12];filename=f'{key}.{sha}.json';(folder/filename).write_text(raw)
 manifest[key]={'url':'systems/'+filename,'stations':len(set(s['name'] for r in rows for s in r['stations']))}
 for r in rows:
  for s in r['stations']:
   k=(s['name'],s['en']);entry=index.setdefault(k,{'name':s['name'],'en':s['en'],'systems':[]})
   if key not in entry['systems']:entry['systems'].append(key)
catalog=json.load(open(root/'line-catalog.json'))
(out/'rail-systems.js').write_text('globalThis.RAIL_SYSTEM_FILES = '+json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+';\n'+'globalThis.RAIL_LINE_CATALOG = '+json.dumps(catalog,ensure_ascii=False,separators=(',',':'))+';\n')
(out/'rail-search-index.json').write_text(json.dumps(list(index.values()),ensure_ascii=False,separators=(',',':')))
current={item['url'].split('/')[-1] for item in manifest.values()}
for p in folder.glob('*.json'):
 if p.name not in current:p.unlink()
print({k:{'stations':v['stations'],'bytes':(out/v['url']).stat().st_size} for k,v in manifest.items()})
