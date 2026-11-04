import json,hashlib,pathlib,urllib.parse
root=pathlib.Path(__file__).parent
T=[['fStrain','S-TRAIN','土休日 · 座位指定','#1ac5a5'],['fFLiner','Fライナー','跨公司速达服务 · 区间内种别变化','#39b96a'],['fLimited','特急','Limited Express','#ee9d38'],['fCommuterLimited','通勤特急','Commuter Limited Express','#a36bd2'],['fRapidExpress','快速急行','Rapid Express','#6474e6'],['fExpress','急行','Express','#f16665'],['fCommuter','通勤急行','Commuter Express','#e8b83d'],['fRapid','快速','Rapid','#48c0d3'],['fSemi','準急','Semi Express','#c6a64a'],['fLocal','各駅停車','Local','#5599e6']]
def logo(filename):
 h=hashlib.md5(filename.encode()).hexdigest();return 'https://upload.wikimedia.org/wikipedia/commons/'+h[0]+'/'+h[:2]+'/'+urllib.parse.quote(filename)
groups={
'fMetro':{'name':'东京Metro · 副都心线','en':'TOKYO METRO','services':['fStrain','fFLiner','fExpress','fCommuter','fLocal'],'logo':logo('Tokyo_Metro_combined_logo.svg')},
'fSeibu':{'name':'西武 · 池袋线及直通支线','en':'SEIBU','services':['fStrain','fFLiner','fRapidExpress','fRapid','fSemi','fLocal'],'logo':logo('SeibuRailway_logo.svg')},
'fTobu':{'name':'东武 · 东上线','en':'TOBU TOJO','services':['fFLiner','fRapidExpress','fExpress','fLocal'],'logo':logo('Tobu_group_logo.svg')},
'fTokyu':{'name':'东急 · 东横／新横滨线','en':'TOKYU','services':['fStrain','fFLiner','fLimited','fCommuterLimited','fExpress','fLocal'],'logo':logo('TokyuLogotype.svg')},
'fSotetsu':{'name':'相铁 · 新横滨／本线／泉野','en':'SOTETSU','services':['fLimited','fCommuterLimited','fLocal'],'logo':logo('SOTETSU_logo_horizontal.svg')},
'fMinato':{'name':'横滨高速 · 港未来线','en':'MINATOMIRAI','services':['fStrain','fFLiner','fLimited','fCommuterLimited','fExpress','fLocal'],'logo':logo('YMRC_logomark.svg')}}
routes={}
def add(key,**rules):
 routes['Fukutoshin.'+key]={'services':list(rules),'stops':{t:('*' if v=='*' else v.split(',')) for t,v in rules.items()}}
metro_fast='小竹向原,池袋,新宿三丁目,明治神宮前,渋谷'
add('MetroNorth',fFLiner='和光市,小竹向原',fExpress='和光市,小竹向原',fCommuter='*',fLocal='*')
add('MetroCore',fStrain='池袋,新宿三丁目,渋谷',fFLiner=metro_fast,fExpress=metro_fast,fCommuter=metro_fast,fLocal='*')
add('SeibuLink',fStrain='',fFLiner='小竹向原,練馬',fRapidExpress='小竹向原,練馬',fRapid='*',fSemi='*',fLocal='*')
fast='練馬,石神井公園,ひばりヶ丘,所沢,小手指,入間市,飯能'
rapid='練馬,石神井公園,ひばりヶ丘,東久留米,清瀬,秋津,所沢,西所沢,小手指,狭山ヶ丘,武蔵藤沢,稲荷山公園,入間市,仏子,元加治,飯能'
semi='練馬,石神井公園,大泉学園,保谷,ひばりヶ丘,東久留米,清瀬,秋津,所沢,西所沢,小手指,狭山ヶ丘,武蔵藤沢,稲荷山公園,入間市,仏子,元加治,飯能'
add('SeibuMain',fStrain='石神井公園,所沢,入間市,飯能',fFLiner=fast,fRapidExpress=fast,fRapid=rapid,fSemi=semi,fLocal='*')
add('SeibuChichibu',fStrain='飯能,西武秩父',fLocal='*');routes['Fukutoshin.SeibuChichibu']['partial']={'fStrain':['横瀬']}
add('SeibuSayama',fRapid='*',fSemi='*',fLocal='*');routes['Fukutoshin.SeibuSayama']['note']='狭山线直通为部分／活动日班次，并非每班副都心线列车均直达西武球场前。'
tobu_fast='和光市,朝霞台,川越,川越市,霞ヶ関,鶴ヶ島,若葉,坂戸,北坂戸,高坂,東松山,森林公園,つきのわ,武蔵嵐山,小川町'
tobu_exp='和光市,朝霞,朝霞台,志木,ふじみ野,川越,川越市,霞ヶ関,鶴ヶ島,若葉,坂戸,北坂戸,高坂,東松山,森林公園,つきのわ,武蔵嵐山,小川町'
add('Tobu',fFLiner=tobu_fast,fRapidExpress=tobu_fast,fExpress=tobu_exp,fLocal='*')
limited='渋谷,中目黒,自由が丘,武蔵小杉,菊名,横浜'
add('Toyoko',fStrain='渋谷,自由が丘,横浜',fFLiner=limited,fLimited=limited,fCommuterLimited=limited+',日吉',fExpress='渋谷,中目黒,学芸大学,自由が丘,田園調布,多摩川,武蔵小杉,日吉,綱島,菊名,横浜',fLocal='*')
# Only Toyoko-facing services; do not add Meguro local/express layers.
add('TokyuShinYokohama',fExpress='*')
add('SotetsuShinYokohama',fLimited='*',fCommuterLimited='*',fLocal='*')
add('SotetsuMain',fLimited='西谷,二俣川,大和,海老名',fCommuterLimited='西谷,鶴ヶ峰,二俣川,大和,海老名',fLocal='*')
add('SotetsuIzumino',fLimited='二俣川,いずみ野,湘南台',fCommuterLimited='二俣川,いずみ野,湘南台',fLocal='*')
add('Minatomirai',fStrain='横浜,みなとみらい,元町・中華街',fFLiner='横浜,みなとみらい,元町・中華街',fLimited='横浜,みなとみらい,元町・中華街',fCommuterLimited='横浜,みなとみらい,馬車道,日本大通り,元町・中華街',fExpress='横浜,みなとみらい,馬車道,日本大通り,元町・中華街',fLocal='*')
config={'types':T,'groups':groups,'routes':routes,'sources':['https://www.tokyometro.jp/lang_tcn/station/line_fukutoshin/index.html','https://www.seiburailway.jp/railway/station/','https://www.tobu.co.jp/railway/guide/line/tojo_line.html','https://www.tokyu.co.jp/railway/map/','https://www.sotetsu.co.jp/train/stations/','https://www.mm21railway.co.jp/lp/']}
(root/'dist/fukutoshin.js').write_text('globalThis.FUKUTOSHIN = '+json.dumps(config,ensure_ascii=False,separators=(',',':'))+';\n')
