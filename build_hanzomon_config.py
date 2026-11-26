"""Hanzomon corridor: section stop patterns, operators and simple line catalog."""
import json,pathlib,hashlib,urllib.parse
root=pathlib.Path(__file__).parent
rows=json.load(open(root/'dist/rail-data.json'))
def logo(f):
 h=hashlib.md5(f.encode()).hexdigest();return 'https://upload.wikimedia.org/wikipedia/commons/'+h[0]+'/'+h[:2]+'/'+urllib.parse.quote(f)
types=[['hzExpress','急行','Express · 各运营区间','#e74d59'],['hzSemi','準急','Semi Express · 各运营区间','#41a45a'],['hzLocal','各駅停車','Local · 各运营区间','#2687dc']]
groups={
 'hzMetro':{'name':'东京Metro · 半藏门线','en':'TOKYO METRO','services':['hzLocal'],'logo':logo('Tokyo_Metro_combined_logo.svg')},
 'hzHibiya':{'name':'东京Metro · 日比谷线','en':'TOKYO METRO HIBIYA','services':['hzLocal'],'logo':logo('Tokyo_Metro_combined_logo.svg')},
 'hzTokyu':{'name':'东急 · 田园都市线','en':'TOKYU','services':['hzExpress','hzSemi','hzLocal'],'logo':logo('TokyuLogotype.svg')},
 'hzTobu':{'name':'东武 · 晴空树／伊势崎／日光线','en':'TOBU','services':['hzExpress','hzSemi','hzLocal'],'logo':logo('Tobu_group_logo.svg')}}
routes={}
def add(k,**rules):routes['Hanzomon.'+k]={'services':list(rules),'stops':{t:'*' if v=='*' else v.split(',') for t,v in rules.items()}}
add('Metro',hzLocal='*')
add('Hibiya',hzLocal='*')
exp='渋谷,三軒茶屋,二子玉川,溝の口,鷺沼,たまプラーザ,あざみ野,青葉台,長津田,南町田グランベリーパーク,中央林間'
# Current semi-express: all stops Shibuya--Futako-Tamagawa and Nagatsuta--Chuo-Rinkan.
den=next(r for r in rows if r['id']=='Hanzomon.DenEnToshi')['stations'];names=[s['name'] for s in den]
if names[0]!='渋谷':names.reverse()
semi=','.join(dict.fromkeys(names[:names.index('二子玉川')+1]+exp.split(',')+names[names.index('長津田'):]))
add('DenEnToshi',hzExpress=exp,hzSemi=semi,hzLocal='*')
fast='押上,曳舟,北千住,西新井,草加,新越谷,越谷,せんげん台,春日部,東武動物公園'
trunk=next(r for r in rows if r['id']=='Hanzomon.Skytree');nn=[s['name'] for s in trunk['stations']]
semi=','.join(dict.fromkeys(fast.split(',')+nn[nn.index('越谷'):]))
add('Skytree',hzExpress=fast,hzSemi=semi,hzLocal=','.join(nn[nn.index('北千住'):]))
routes['Hanzomon.Skytree']['ranges']={'hzLocal':['北千住','東武動物公園']}
add('Isesaki',hzExpress='*',hzSemi='*');add('Nikko',hzExpress='*',hzSemi='*')
c={'types':types,'groups':groups,'routes':routes,'sources':['https://www.tokyometro.jp/station/line_hibiya/index.html','https://www.tokyometro.jp/station/line_hanzomon/index.html','https://www.tokyu.co.jp/railway/map/','https://www.tokyu.co.jp/company/news/pdf/20190807-3-1.pdf','https://www.tobu.co.jp/railway/guide/route_map/']}
(root/'dist/hanzomon.js').write_text('globalThis.HANZOMON = '+json.dumps(c,ensure_ascii=False,separators=(',',':'))+';\n')
lines=[l for l in json.load(open(root/'line-catalog.json')) if l['system']!='hanzomon']
for k,n,g,color in [('Hibiya','日比谷线','hzHibiya','#b5b5ac'),('Metro','半藏门线','hzMetro','#8f76d6'),('DenEnToshi','东急田园都市线','hzTokyu','#00a88f'),('Skytree','东武晴空树线（押上—东武动物公园）','hzTobu','#0f6db5'),('Isesaki','东武伊势崎线（至久喜）','hzTobu','#e5283c'),('Nikko','东武日光线（至南栗桥）','hzTobu','#f29b15')]:lines.append({'id':'hz-'+k.lower(),'system':'hanzomon','group':g,'name':n,'color':color,'parts':['Hanzomon.'+k]})
(root/'line-catalog.json').write_text(json.dumps(lines,ensure_ascii=False,indent=2)+'\n')
