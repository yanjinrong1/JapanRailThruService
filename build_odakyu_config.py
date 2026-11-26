"""Six merged Odakyu service families plus one Metro and one JR service."""
import json,pathlib,hashlib,urllib.parse
root=pathlib.Path(__file__).parent
rows=json.load(open(root/'dist/rail-data.json'))
def names(k):return [s['name'] for s in next(r for r in rows if r['id']=='OdakyuSystem.'+k)['stations']]
def logo(f):
 h=hashlib.md5(f.encode()).hexdigest();return 'https://upload.wikimedia.org/wikipedia/commons/'+h[0]+'/'+h[:2]+'/'+urllib.parse.quote(f)
types=[['odRapid','快速急行','Rapid Express','#ee9700'],['odExpress','急行','Express','#e64b0a'],['odCommuterExpress','通勤急行','Commuter Express · 平日早高峰上行','#e64b0a'],['odSemi','準急','Semi Express','#009c73'],['odCommuterSemi','通勤準急','Commuter Semi Express · 平日早高峰上行','#009c73'],['odLocal','各駅停車','Local · 小田急','#006aa9'],['odMetroLocal','各駅停車','Local · 千代田线','#00a67d'],['odJRLocal','各駅停車','Local · 常磐缓行线','#7d858b']]
groups={
 'odOdakyu':{'name':'小田急 · 小田原／多摩／江之岛线','en':'ODAKYU','services':[t[0] for t in types[:6]],'logo':logo('Odakyu_electric_railway_company_logos.svg')},
 'odMetro':{'name':'东京Metro · 千代田线','en':'TOKYO METRO','services':['odMetroLocal'],'logo':logo('Tokyo_Metro_combined_logo.svg')},
 'odJR':{'name':'JR东日本 · 常磐缓行线','en':'JR EAST','services':['odJRLocal'],'logo':logo('JR_East_logo.svg')}}
routes={}
def add(k,**rules):routes['OdakyuSystem.'+k]={'services':list(rules),'stops':{t:'*' if v=='*' else v.split(',') for t,v in rules.items()}}
main=names('Odawara');west=main[:main.index('本厚木')+1] # generator is oriented inward
exp='新宿,代々木上原,下北沢,経堂,成城学園前,登戸,向ヶ丘遊園,新百合ヶ丘,町田,相模大野,海老名,'+','.join(west)
rapid='新宿,代々木上原,下北沢,登戸,新百合ヶ丘,町田,相模大野,海老名,本厚木,愛甲石田,伊勢原,鶴巻温泉,東海大学前,秦野,渋沢,新松田,開成,小田原'
semi='代々木上原,下北沢,経堂,千歳船橋,祖師ヶ谷大蔵,'+','.join(main[main.index('本厚木'):main.index('成城学園前')+1])
commsemi='代々木上原,下北沢,経堂,成城学園前,'+','.join(main[main.index('伊勢原'):main.index('登戸')+1])
add('Odawara',odRapid=rapid,odExpress=exp,odCommuterExpress='新宿,代々木上原,下北沢,成城学園前,向ヶ丘遊園,新百合ヶ丘',odSemi=semi,odCommuterSemi=commsemi,odLocal='*')
routes['OdakyuSystem.Odawara']['ranges']={'odSemi':['代々木上原','本厚木'],'odCommuterSemi':['代々木上原','伊勢原'],'odCommuterExpress':['新宿','新百合ヶ丘']}
add('Tama',odRapid='新百合ヶ丘,栗平,小田急永山,小田急多摩センター,唐木田',odExpress='*',odCommuterExpress='新百合ヶ丘,栗平,小田急永山,小田急多摩センター,唐木田',odLocal='*')
add('Enoshima',odRapid='相模大野,中央林間,大和,湘南台,藤沢',odExpress='相模大野,中央林間,大和,長後,湘南台,藤沢',odLocal='*')
add('EnoshimaSouth',odExpress='*',odLocal='*')
add('Metro',odMetroLocal='*');add('KitaAyase',odMetroLocal='*');add('Joban',odJRLocal='*')
c={'types':types,'groups':groups,'routes':routes,'sources':['https://odakyu-global.com/assets/file/routemap.pdf','https://www.odakyu.jp/station/','https://www.tokyometro.jp/station/line_chiyoda/index.html','https://www.jreast.co.jp/map/']}
(root/'dist/odakyu.js').write_text('globalThis.ODAKYU = '+json.dumps(c,ensure_ascii=False,separators=(',',':'))+';\n')
lines=[l for l in json.load(open(root/'line-catalog.json')) if l['system']!='odakyu']
for key,name,g,color,parts in [('odawara','小田急小田原线','odOdakyu','#0085cd',['Odawara']),('tama','小田急多摩线','odOdakyu','#0085cd',['Tama']),('enoshima','小田急江之岛线','odOdakyu','#0085cd',['Enoshima','EnoshimaSouth']),('chiyoda','千代田线','odMetro','#00a67d',['Metro','KitaAyase']),('joban','JR常磐缓行线','odJR','#9ca0a6',['Joban'])]:lines.append({'id':'od-'+key,'system':'odakyu','group':g,'name':name,'color':color,'parts':['OdakyuSystem.'+p for p in parts]})
(root/'line-catalog.json').write_text(json.dumps(lines,ensure_ascii=False,indent=2)+'\n')
