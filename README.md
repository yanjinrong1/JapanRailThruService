# Japan rail through-service atlas
Buildless Leaflet + SVG app. `dist/` is the deployed static directory.
Geometry/station data extracted from nagix/mini-tokyo-3d (MIT, license included).
Reference-image stop patterns are a prototype, not a live timetable. Each operating section has its own services; no invented full-length through train pairing.
Run `python make_data.py` with the upstream data checkout to regenerate geometry.
Sites helper is absent in this execution environment; source synchronization and tar packaging use the local publish-source.py equivalent.

## Chuo / Ome system
Tokyo–Tachikawa, Tachikawa–Otsuki and Tachikawa–Ome only (44 unique stations).
Six service layers include local, rapid, Chuo/Ome special rapid, and commuter rapid/special rapid. Holiday Rapid and historical Limited Express Ome have been removed.
Rapid weekdays/holidays can be switched; weekday commuter directions are labeled. No Chuo-Sobu local, Tozai, Musashino, Fujikyu, Kofu or Ome–Okutama geometry is added.
`add_chuo.py` routes through ordered station waypoints using MLIT N02 2024 JR East railway graphs. Tokyo–Kanda is administratively part of the Tohoku Line in N02, used only to connect Chuo Rapid's Tokyo terminus. No Tohoku passenger service layer is added.

Nakano uses the southern MLIT rapid-line platform edge (7/8), with a projected station graph node to avoid the central turnback stub. Tachikawa uses one shared junction coordinate and one rendered station marker across the three railway sections.

## Tokaido / Sanyo Shinkansen
35 distinct stations from Tokyo to Hakata, split at one shared Shin-Osaka junction. Only Nozomi, Hikari and Kodama, selectable per operator (JR Central / JR West).
`add_shinkansen.py` builds one connected graph using only operator-filtered MLIT N02 2024 Tokaido Shinkansen / Sanyo Shinkansen sections. Station projections are inserted into that graph. Conventional railways and roads are excluded.
Stop modes follow the supplied diagrams: fixed within the train's operating section, selected trains, or pass. Selected stops use small lane dots; fixed stops use station capsules. These are aggregate service patterns, not a promise of a Tokyo–Hakata through train (particularly Kodama). No Mizuho, Sakura, Tsubame or Kyushu extension.

## Fukutoshin and Yurakucho through-service system

The 副都心线・有乐町线系统 menu follows ObsidianVault’s `副都心线-有乐町线系统.md` (blob `982846aadafc9eb9137e651acead3a2eb2c0499c`). It has 12 physical lines, 13 map sections and 132 station markers in simplified mode. The Metro lines use the same track geometry between Wakoshi and Kotake-mukaihara, then run separately to Shibuya and Shin-kiba. Ikebukuro F09 and Y09 have distinct map markers, search results and station cards.

The western connections are Tobu Tojo from Wakoshi to Ogawamachi and Seibu Yurakucho and Ikebukuro from Kotake-mukaihara via Nerima to Hanno. The southern connections are Toyoko, Tokyu and Sotetsu Shin-Yokohama, Sotetsu Main and Izumino, and Minatomirai. The Hanno–Seibu-Chichibu extension shows holiday S-TRAIN service only.

The weekday S-TRAIN runs from Tokorozawa to Toyosu and stops at Shakujii-koen, Iidabashi and Yurakucho along the way. The holiday S-TRAIN uses the Fukutoshin, Toyoko and Minatomirai corridor. F-Liner retains its own selectable overlay. Regenerate service rules with `python build_fukutoshin_config.py` and geometry with `python add_fukutoshin.py /path/to/mini-tokyo-3d/data`. The geometry generator traces operator-filtered MLIT N02 2024 tracks and snaps stations onto the continuous running lines.

## Lazy loading / bounded rendering
On startup all system folders are collapsed and there are zero railway geometry requests, even with a previous selection saved. Opening/checking/focusing a system loads only its hashed `dist/systems/*.json` file. Collapsing it removes active layers, aborts pending requests, drops retained geometry and clears SVG on the next animation frame; saved service preferences are restored on reopen. Search fetches a lightweight name-only index on first use and loads geometry only after selecting a result. Global Select All explicitly loads all four systems.

`split_rail_data.py` writes independent files and metadata; the publishing helper regenerates them before committing/package creation. `rail-data.json` remains a regeneration source and is not fetched by the app. `lazy-rail-data.js` prevents stale/aborted responses from restoring released systems and supports manual retry.

`rail-viewport.js` clips raw lines to a 96px padded viewport before smoothing or SVG creation. Separate visible chunks remain separate; source order preserves service termini. Offscreen station hit targets are omitted. Normals are reused, overlapping map events are coalesced with requestAnimationFrame, and MapLibre tile cache is limited to 48 tiles per source / two zoom levels.

Node regression tests cover lifecycle, race conditions, interval geometry and all systems. The DOM lifecycle test uses test-only `linkedom` (not shipped): `RAIL_DOM_MODULE=/path/to/linkedom node tests/lazy-ui.cjs`. A simulated zoom-18 Shinagawa viewport reduced smoothed Shinkansen points from 243412 to 192 (99.92% fewer), with six paths and one station marker. This is a geometry workload measurement, not measured browser memory usage.

## Detailed / simplified display mode
A global accessible switch in the map header selects detailed service lanes or simplified physical railway lines. `line-catalog.json` defines 27 physical lines across all four systems and is included in the lightweight metadata by `split_rail_data.py`. `rail-lines.js` selects the existing verified geometry without adding routes. Metro Fukutoshin North/Core and Chuo Trunk/West are merged by physical identity. Seibu Hanno–Agano belongs to Ikebukuro Line; Agano–Seibu-Chichibu belongs to Chichibu Line.

Simplified mode renders one themed path per line, single physical station markers, and a label for every visible station (including stations skipped by detailed express services). The viewport clipping and system-level lazy loader remain active. Station details list physical lines, not train services. Service controls are disabled/hidden and replaced by line selectors within each operator folder.

Detailed preferences (`rail-selected`) and simplified line preferences (`rail-lines-selected`) are separate. Switching modes retains the currently enabled systems, restores each mode's selections, and does not fetch unrelated systems. Collapsing a system still releases its data. The global Select All / Clear actions operate within the current mode.

Tests: `rail-lines.cjs` checks physical-line identity, theme metadata, source geometry and station coverage. `simple-mode.cjs` (test-only linkedom dependency as above) exercises the actual app switch, menu disablement, all 132 Fukutoshin and Yurakucho labels, independent preferences, station detail content and lazy release.

## Menu expansion versus selection (current interaction)
Top-level folder expansion is presentation-only: opening/closing a folder never changes checkboxes, active map layers or data loading. Checkboxes alone load/show or hide/release a system, and do not force folders open/closed. Explicit focus/search actions still activate their target system. This supersedes the earlier collapse-to-release interaction described above. The switch thumb uses a CSS pseudo-element centered at 50% height, isolated from generic header span styling.

## 南北线・三田线系统

新增8条物理线路、83个唯一站点：南北线、三田线、埼玉体育场线、东急目黑线、东急新横滨线、相铁新横滨线、相铁本线西谷—海老名、相铁泉野线二俣川—湘南台。详细模式按运营区间显示各停／急行／特急／通勤特急；精简模式按本线主题色显示全部站名。通勤特急为相铁泉野线方向平日早高峰上行，二俣川—海老名不绘制该服务。

`add_namboku.py`以N02 2024运营公司／线路过滤构图、投影站点并检查顺序；目黑线田园调布以南在N02中归入东横线，仅取到日吉的并行铁路走廊。南北／三田共用隧道采用一致坐标。`build_namboku_config.py`生成停站配置和8条精简模式线路。停站来源包括[东京Metro](https://www.tokyometro.jp/station/line_namboku/index.html)、[都营](https://www.kotsu.metro.tokyo.jp/subway/stops/)、[埼玉高速铁路](https://www.s-rail.co.jp/line/)、[东急](https://www.tokyu.co.jp/railway/map/)、[相铁](https://www.sotetsu.co.jp/train/stations/izumino/)。

`split_rail_data.py`把两个系统共用的新横滨／相铁4段抽到单个内容哈希资源。`RailDataStore`按引用计数加载，仅请求一次；别名保留独立系统／运营公司键，但直接共用坐标和站点数组。取消勾选最后一个使用者才释放，折叠菜单不改变地图选择。

新增验证：`tests/namboku.cjs`、`tests/namboku-ui.cjs`、`tests/shared-loading.cjs`，覆盖轨迹／站序、急行通过站、通勤特急范围、共用站合并、83站精简标签、延迟加载、共享数组引用与失败重试。DOM测试需设置`RAIL_DOM_MODULE`为linkedom模块路径，或在Node可解析范围安装linkedom。

精简模式站名分级：与详细模式一致，在zoom<11时只标注代表性急行／特急停站；没有选择性速达服务的长线路采用主要换乘站与端点。zoom>=11恢复全部站名。站点标记和点击详情不受影响，筛选不依赖详细模式服务勾选，不额外加载数据。

## 半藏门线系统

5条线路、72个物理站点：东急田园都市线中央林间—涩谷、半藏门线涩谷—押上、东武晴空树线押上—东武动物公园、伊势崎线至久喜、日光线至南栗桥。东武只显示急行／准急，精简模式包含所有物理站点。田园都市线准急采用2019年调整后的停站（涩谷—二子玉川、长津田—中央林间各停），不沿用旧参考图。半藏门线内三项种别图层均各停，不推断跨公司车次配对。

`add_hanzomon.py`使用N02 2024按公司／线路过滤的连续铁路图，押上—曳舟不绕浅草。`build_hanzomon_config.py`生成3家运营公司及停站规则、精简线路配置；`split_rail_data.py`生成独立按需数据。`tests/hanzomon.cjs`和`tests/hanzomon-ui.cjs`覆盖轨迹站序、分支范围、停站、站点合并及两种模式。来源为[东京Metro](https://www.tokyometro.jp/station/line_hanzomon/index.html)、[东急](https://www.tokyu.co.jp/railway/map/)、[东急停站调整](https://www.tokyu.co.jp/company/news/pdf/20190807-3-1.pdf)、[东武](https://www.tobu.co.jp/railway/guide/route_map/)。

全局线条粗细：右下角图层菜单的细／粗选项，`rail-line-style`保存偏好，默认细（1.9px／间距3.6px），粗沿用京急系统原始参数（3.1px／间距6px）。所有系统及详细／精简模式统一应用，站点尺寸同步调整。副都心菜单内的局部设置已移除，旧局部偏好不覆盖新的全局默认。

## 小田急・千代田・常磐缓行线系统

5条物理线路、102个唯一站点。小田急小田原线至小田原、多摩线至唐木田、江之岛线至片濑江之岛；千代田线含北绫濑支线，常磐缓行线至取手。最多六条小田急服务线，同种合并：快速急行、急行、通勤急行、准急、通勤准急、各停。通勤急行／准急分别与急行／准急同色但独立选择；地铁与JR各一个各停图层。不含特急／箱根登山线。

按提供的2025停站图及官方调整：快速急行停开成；准急停喜多见、和泉多摩川。准急绘制代代木上原—本厚木，通勤准急至伊势原；通勤急行为多摩线—新宿，通勤类仅平日早高峰上行；江之岛快速急行止于藤泽。范围通过配置双端裁剪，不把彩线画到服务运行范围之外。常磐取手缓行段主要早晚运营，不将停站图解释成任意端点都有全程直通。

`add_odakyu.py`对N02 2024过滤自家铁路图，藤泽折返分两段追踪，地铁去除上游数据的町田／成城语境站，JR只保留常磐缓行14站至取手。`build_odakyu_config.py`生成规则与精简线路。来源：[小田急官方图](https://odakyu-global.com/assets/file/routemap.pdf)、[2025调整](https://www.odakyu.jp/news/h3de7600000005ka-att/h3de7600000005kh.pdf)、[千代田线](https://www.tokyometro.jp/station/line_chiyoda/index.html)、[JR](https://www.jreast.co.jp/map/)。新增测试覆盖102站／7轨迹段、双端裁剪、折返、通勤服务范围、两种模式、缩放标签与按需加载。

## 都营新宿线系统

按用户上传的《都营新宿线系统.pdf》note制作五条线路：都营新宿线、京王本线、新线、相模原线、高尾线。都营普通／急行，京王特急／急行／区间急行／快速／各停；特急新宿始发，不进入京王新线及都营段。本八幡—桥本走都营—新线—笹塚—调布—相模原线，各公司区间可变更种别。参考图中的井之头线、竞马场线、动物园线、Liner均不因出现在图片中而加入范围。

新宿按用户后续要求分京王本线／新线两个站区，独立坐标及内部标识，地图都简洁标注“新宿”。共有72个站点位置（含两个新宿站区），不将站区数称为物理车站数。`add_shinjuku.py`选择对应站区的N02锚点，MLIT将新线归类京王线，但初台、幡谷及新线新宿站序独立追踪，合并笹塚、调布、北野的共用锚点。`build_shinjuku_config.py`生成规则与精简模式目录。

来源：[京王官方线路图](https://www.keio.co.jp/global/routes/)、[京王2023线路概要](https://www.keio.co.jp/company/corporate/summary/corporate_manual/pdf/2023/2023_p017_p018.pdf)、[都营新宿线](https://www.kotsu.metro.tokyo.jp/subway/shinjuku/)。新增`shinjuku.cjs`及`shinjuku-ui.cjs`检查范围、两处新宿站区、新线不显示特急、急行通过站、普通停站、精简标签和按需加载。

## 菜单线路符号

一、二级菜单优先显示Wikimedia Commons线路符号，`build_symbols.py`维护32种图标与51条现有物理线路的对应，生成`dist/rail-symbols.js`及`dist/SYMBOL-SOURCES.json`。一级按系统、二级按线路组收集图标，同一个记号只显示一次（例如京王KO、相铁SO、中央／青梅JC）。没有映射的未来线路使用所属公司的Logo；线路图片失败也回退公司Logo，再失败时显示文字。图标使用独立的20／22px容器，普通公司Logo备用容器保留34px。

图标来自[Wikimedia Commons日本铁路图标目录](https://commons.wikimedia.org/wiki/Category:Rapid_transit_icons_of_Greater_Tokyo)及[新干线目录](https://commons.wikimedia.org/wiki/Category:Rapid_transit_icons_of_Shinkansen)，每个文件来源／许可页面见`SYMBOL-SOURCES.json`。外链SVG按需加载，不增加铁路几何请求。`tests/menu-symbols.cjs`覆盖所有对应关系、去重、两级菜单及备用流程。

## 半藏门系统更新：日比谷线直通

根据ObsidianVault的`半藏门线系统.md`（blob `8c765f3a983c0e96e298b7c9ccb70c566977d6e7`）更新：半藏门线内仅各停；东急急行／准急／各停、东武半藏门直通急行／准急至久喜／南栗桥。日比谷线中目黑—北千住22站全部各停，经东武北千住—东武动物公园各停。TH-LINER与参考图中更远区间不在note服务范围内。新系统6条物理线路、93个站名。

新增N02地铁2号线轨迹，北千住统一接点；东武各停使用双端范围裁剪，不画到押上支线、久喜或南栗桥。半藏门与日比谷各自一个二级菜单，均仅一项各停；H线路符号加入两级菜单并保持去重。旧的半藏门急行／准急偏好移除。按需加载、精简模式与全局粗细保留。

Published UI version is v30. Increment the header version on every subsequent published update to match the Sites version number.


## Cloudflare Pages

Connect this GitHub repository in Cloudflare Workers & Pages using a Pages project.
Choose production branch `main`, framework preset `None`, leave the build command empty, and set the build output directory to `dist`. Use the repository root as the root directory. The committed static files are ready to publish.

`wrangler.jsonc` declares the Pages output directory for Wrangler deployments. For a direct upload after authenticating with Cloudflare, run `npx wrangler pages deploy dist --project-name japan-rail-through-services`. Use your actual Pages project name if different.

The map runs entirely in the browser. It needs no runtime environment variables or server functions. Railway system JSON files, vendor assets and scripts are served from `dist` using relative URLs.
