"""Verified Wikimedia Commons line symbols, with source links and no invented marks."""
import pathlib,json,hashlib,urllib.parse
root=pathlib.Path(__file__).parent
specs={
 'A':('浅草线','Toei Asakusa line symbol.svg'),
 'KK':('京急线','Number prefix Keikyū.svg'),
 'KS':('京成线','Number prefix Keisei.svg'),
 'HS':('北总线','Number prefix Hokusō.svg'),
 'shibayama':('芝山铁道线','Number prefix Shibayama.svg'),
 'F':('副都心线','Logo of Tokyo Metro Fukutoshin Line.svg'),
 'TJ':('东武东上线','Tobu Tojo Line (TJ) symbol.svg'),
 'SI':('西武池袋线及直通支线','SeibuIkebukuro.svg'),
 'TY':('东急东横线','Tokyu TY line symbol.svg'),
 'SH':('东急新横滨线','Tokyu SH line symbol.svg'),
 'SO':('相铁线','Sotetsu line symbol.svg'),
 'MM':('港未来线','Minatomirai Line symbol.svg'),
 'tokaido':('东海道新干线','Shinkansen jrc.svg'),
 'sanyo':('山阳新干线','Shinkansen jrw.svg'),
 'JC':('中央快速／青梅线','JR JC line symbol.svg'),
 'N':('南北线','Logo of Tokyo Metro Namboku Line.svg'),
 'I':('三田线','Toei Mita line symbol.svg'),
 'SR':('埼玉体育场线','Saitama Stadium Line symbol.svg'),
 'MG':('东急目黑线','Tokyu MG line symbol.svg'),
 'H':('日比谷线','Logo of Tokyo Metro Hibiya Line.svg'),
 'Z':('半藏门线','Logo of Tokyo Metro Hanzōmon Line.svg'),
 'DT':('东急田园都市线','Tokyu DT line symbol.svg'),
 'TS':('东武晴空树线','Tobu Skytree Line (TS) symbol.svg'),
 'TI':('东武伊势崎线','Tobu Isesaki Line (TI) symbol.svg'),
 'TN':('东武日光线','Tobu Nikko Line (TN) symbol.svg'),
 'OH':('小田急小田原线','Odakyu odawara.svg'),
 'OT':('小田急多摩线','Odakyu tama.svg'),
 'OE':('小田急江之岛线','Odakyu enoshima.svg'),
 'C':('千代田线','Logo of Tokyo Metro Chiyoda Line.svg'),
 'JL':('JR常磐缓行线','JR JL line symbol.svg'),
 'S':('都营新宿线','Toei Shinjuku line symbol.svg'),
 'KO':('京王线','Number prefix Keio-line.svg')}
lines={
 'Toei.Asakusa':'A','Keikyu.Main':'KK','Keikyu.Airport':'KK','Keikyu.Zushi':'KK','Keikyu.Kurihama':'KK',
 'Keisei.Main':'KS','Keisei.Oshiage':'KS','Keisei.HigashiNarita':'KS','Keisei.NaritaSkyAccess':'KS','Hokuso.Hokuso':'HS','Shibayama.Shibayama':'shibayama',
 'f-metro':'F','f-yurakucho':'Y','f-tobu':'TJ','f-seibu-link':'SI','f-seibu-main':'SI','f-seibu-chichibu':'SI','f-toyoko':'TY','f-tokyu-sh':'SH','f-sotetsu-sh':'SO','f-sotetsu-main':'SO','f-sotetsu-izumino':'SO','f-minato':'MM',
 'tokaido':'tokaido','sanyo':'sanyo','chuo-main':'JC','chuo-ome':'JC',
 'nm-namboku':'N','nm-mita':'I','nm-saitama':'SR','nm-meguro':'MG','nm-tokyushinyokohama':'SH','nm-sotetsushinyokohama':'SO','nm-sotetsumain':'SO','nm-sotetsuizumino':'SO',
 'hz-hibiya':'H','hz-metro':'Z','hz-denentoshi':'DT','hz-skytree':'TS','hz-isesaki':'TI','hz-nikko':'TN',
 'od-odawara':'OH','od-tama':'OT','od-enoshima':'OE','od-chiyoda':'C','od-joban':'JL',
 'sj-metro':'S','sj-main':'KO','sj-new':'KO','sj-sagamihara':'KO','sj-takao':'KO'}
symbols={}
for key,(name,file) in specs.items():
 canonical=file.replace(' ','_');h=hashlib.md5(canonical.encode()).hexdigest()
 symbols[key]={'name':name,'code':'SR' if key=='shibayama' else '' if key in ['tokaido','sanyo'] else key,'src':'https://upload.wikimedia.org/wikipedia/commons/'+h[0]+'/'+h[:2]+'/'+urllib.parse.quote(canonical),'source':'https://commons.wikimedia.org/wiki/File:'+urllib.parse.quote(canonical),'file':file}
# Render the Y line code directly so the badge is available with the static map.
symbols['Y']={'name':'有乐町线','code':'Y','color':'#C1A470','source':'https://www.tokyometro.jp/station/line_yurakucho/index.html'}
config={'symbols':symbols,'lines':lines}
(root/'dist/rail-symbols.js').write_text('globalThis.RAIL_SYMBOLS = '+json.dumps(config,ensure_ascii=False,separators=(',',':'))+';\n')
(root/'dist/SYMBOL-SOURCES.json').write_text(json.dumps(list(symbols.values()),ensure_ascii=False,indent=2)+'\n')
print(len(symbols),'symbols for',len(lines),'physical lines; future unassigned lines use operator logos')
