"""User note scope: Toei local/express and five Keio service families."""
import json,pathlib,hashlib,urllib.parse
root=pathlib.Path(__file__).parent
rows=json.load(open(root/'dist/rail-data.json'))
def logo(f):
 h=hashlib.md5(f.encode()).hexdigest();return 'https://upload.wikimedia.org/wikipedia/commons/'+h[0]+'/'+h[:2]+'/'+urllib.parse.quote(f)
def names(k):return [s['name'] for s in next(r for r in rows if r['id']=='ShinjukuSystem.'+k)['stations']]
types=[['sjLimited','特急','Special Express · 京王新宿始发','#dd007f'],['sjExpress','急行','Express · 京王区间','#009e7a'],['sjSection','区間急行','Semi Express · 京王区间','#c6c500'],['sjRapid','快速','Rapid · 京王区间','#004681'],['sjLocal','各駅停車','Local · 京王区间','#929292'],['sjToeiExpress','急行','Express · 都营新宿线','#e60012'],['sjToeiLocal','普通','Local · 都营新宿线','#aabc1e']]
groups={
 'sjToei':{'name':'都营 · 新宿线','en':'TOEI SHINJUKU','services':['sjToeiExpress','sjToeiLocal'],'logo':logo('Toei_Transportation_combined_logo.svg')},
 'sjKeio':{'name':'京王 · 本线／新线／相模原／高尾','en':'KEIO','services':['sjLimited','sjExpress','sjSection','sjRapid','sjLocal'],'logo':logo('KeioRailway_logo.svg')}}
routes={}
def add(k,**rules):routes['ShinjukuSystem.'+k]={'services':list(rules),'stops':{t:'*' if v=='*' else v.split(',') for t,v in rules.items()}}
add('Metro',sjToeiExpress='新線新宿,市ヶ谷,神保町,馬喰横山,森下,大島,船堀,本八幡',sjToeiLocal='*')
limited='新宿,笹塚,明大前,千歳烏山,調布,府中,分倍河原,聖蹟桜ヶ丘,高幡不動,北野,京王八王子'
express='新宿,笹塚,明大前,桜上水,千歳烏山,つつじヶ丘,調布,東府中,府中,分倍河原,聖蹟桜ヶ丘,高幡不動,北野,京王八王子'
main=names('Main');west=main[main.index('調布'):]
section=','.join(['新宿','笹塚','明大前','桜上水','千歳烏山','仙川','つつじヶ丘']+west)
rapid=','.join(['新宿','笹塚','明大前','下高井戸','桜上水','八幡山','千歳烏山','仙川','つつじヶ丘']+west)
add('Main',sjLimited=limited,sjExpress=express,sjSection=section,sjRapid=rapid,sjLocal='*')
add('New',sjExpress='*',sjSection='*',sjRapid='*',sjLocal='*')
saga='調布,京王稲田堤,京王永山,京王多摩センター,南大沢,橋本'
add('Sagamihara',sjLimited=saga,sjExpress=saga,sjSection='*',sjRapid='*',sjLocal='*')
add('Takao',sjLimited='北野,めじろ台,高尾,高尾山口',sjExpress='*',sjSection='*',sjRapid='*',sjLocal='*')
c={'types':types,'groups':groups,'routes':routes,'sources':['https://www.keio.co.jp/global/routes/','https://www.keio.co.jp/company/corporate/summary/corporate_manual/pdf/2023/2023_p017_p018.pdf','https://www.kotsu.metro.tokyo.jp/subway/shinjuku/']}
(root/'dist/shinjuku.js').write_text('globalThis.SHINJUKU = '+json.dumps(c,ensure_ascii=False,separators=(',',':'))+';\n')
lines=[l for l in json.load(open(root/'line-catalog.json')) if l['system']!='shinjuku']
for key,name,g,color in [('Metro','都营新宿线','sjToei','#b0be1e'),('Main','京王本线','sjKeio','#dd007f'),('New','京王新线','sjKeio','#dd007f'),('Sagamihara','京王相模原线','sjKeio','#dd007f'),('Takao','京王高尾线','sjKeio','#dd007f')]:lines.append({'id':'sj-'+key.lower(),'system':'shinjuku','group':g,'name':name,'color':color,'parts':['ShinjukuSystem.'+key]})
(root/'line-catalog.json').write_text(json.dumps(lines,ensure_ascii=False,indent=2)+'\n')
