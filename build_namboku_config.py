"""Stop patterns for the Namboku/Mita through-service corridor."""
import json,pathlib,hashlib,urllib.parse
root=pathlib.Path(__file__).parent
f=json.load(open(root/'dist/rail-data.json'))
def logo(filename):
 h=hashlib.md5(filename.encode()).hexdigest();return 'https://upload.wikimedia.org/wikipedia/commons/'+h[0]+'/'+h[:2]+'/'+urllib.parse.quote(filename)
T=[['nmCommuterLimited','通勤特急','Commuter Limited Express · 平日早高峰上行','#a36bd2'],['nmLimited','特急','Limited Express · 相铁区间','#e84d64'],['nmExpress','急行','Express · 东急区间','#ef6b53'],['nmLocal','各駅停車','Local · 各运营区间','#009fbe']]
groups={
 'nmMetro':{'name':'东京Metro · 南北线','en':'TOKYO METRO','services':['nmLocal'],'logo':logo('Tokyo_Metro_combined_logo.svg')},
 'nmMita':{'name':'都营 · 三田线','en':'TOEI MITA','services':['nmLocal'],'logo':logo('Toei_Transportation_combined_logo.svg')},
 'nmSaitama':{'name':'埼玉高速 · 埼玉体育场线','en':'SAITAMA RAILWAY','services':['nmLocal'],'logo':logo('Saitama_Railway_Logo.svg')},
 'nmTokyu':{'name':'东急 · 目黑／新横滨线','en':'TOKYU','services':['nmExpress','nmLocal'],'logo':logo('TokyuLogotype.svg')},
 'nmSotetsu':{'name':'相铁 · 新横滨／本线／泉野','en':'SOTETSU','services':['nmCommuterLimited','nmLimited','nmLocal'],'logo':logo('SOTETSU_logo_horizontal.svg')}}
routes={}
def add(key,**rules):routes['Namboku.'+key]={'services':list(rules),'stops':{t:('*' if v=='*' else v.split(',')) for t,v in rules.items()}}
for key in ['Namboku','Mita','Saitama']:add(key,nmLocal='*')
add('Meguro',nmExpress='目黒,武蔵小山,大岡山,田園調布,多摩川,武蔵小杉,日吉',nmLocal='*')
add('TokyuShinYokohama',nmExpress='*',nmLocal='*')
add('SotetsuShinYokohama',nmCommuterLimited='*',nmLimited='*',nmLocal='*')
add('SotetsuMain',nmCommuterLimited='西谷,鶴ヶ峰,二俣川',nmLimited='西谷,二俣川,大和,海老名',nmLocal='*')
add('SotetsuIzumino',nmCommuterLimited='二俣川,いずみ野,湘南台',nmLimited='二俣川,いずみ野,湘南台',nmLocal='*')
routes['Namboku.SotetsuMain']['ends']={'nmCommuterLimited':'二俣川'}
config={'types':T,'groups':groups,'routes':routes,'sources':['https://www.tokyometro.jp/station/line_namboku/index.html','https://www.kotsu.metro.tokyo.jp/subway/stops/','https://www.s-rail.co.jp/line/','https://www.tokyu.co.jp/railway/map/','https://www.sotetsu.co.jp/train/stations/']}
(root/'dist/namboku.js').write_text('globalThis.NAMBOKU = '+json.dumps(config,ensure_ascii=False,separators=(',',':'))+';\n')
catalog=json.load(open(root/'line-catalog.json'));catalog=[l for l in catalog if l['system']!='namboku']
for key,name,color,group in [('Namboku','南北线','#00ac9b','nmMetro'),('Mita','三田线','#006ab8','nmMita'),('Saitama','埼玉体育场线','#2351a5','nmSaitama'),('Meguro','东急目黑线','#009cd2','nmTokyu'),('TokyuShinYokohama','东急新横滨线','#9b008b','nmTokyu'),('SotetsuShinYokohama','相铁新横滨线','#0079c2','nmSotetsu'),('SotetsuMain','相铁本线（西谷—海老名）','#0079c2','nmSotetsu'),('SotetsuIzumino','相铁泉野线','#0079c2','nmSotetsu')]:
 catalog.append({'id':'nm-'+key.lower(),'system':'namboku','group':group,'name':name,'color':color,'parts':['Namboku.'+key]})
(root/'line-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
