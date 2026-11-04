# 日本铁路直通服务地图 · v1

在真实铁路地图上查看线路和列车服务，支持详细／精简模式、按运营公司筛选、停站详情以及按需加载。

在线网站：[轨道之间](https://japan-rail-through-services.yanjinrong1.chatgpt.site)。本仓库保存当前 v1 完整网页源码及数据处理脚本；网站继续托管在 GPT Sites。

## 本地运行

网页无需构建或 API key，直接启动静态文件服务器：

```sh
python3 -m http.server 8000 --directory dist
```

打开 http://localhost:8000 。请通过 HTTP 服务器访问，以便加载线路分包。

## 现有系统

- 京急・浅草・京成：京急各支线、浅草线、京成、北总、芝山。
- 中央快速／青梅：东京—大月、东京—青梅；不含青梅—奥多摩。
- 东海道・山阳新干线：东京—博多，仅 Nozomi、Hikari、Kodama。
- 副都心线：东京Metro、西武、东武、东急东横／新横滨、相铁、横滨高速铁路的直通走廊；不展开 Metro 有乐町线或东急目黑线。

停站展示为种别／区间模式，不是实时班次，也不表示任意两端都有一班全程直通列车。部分停靠、S-TRAIN 上下客限制及活动日支线须按具体车次确认。

## 交互与性能

- **详细**：平行服务线及各服务的停站；**精简**：线路主题色及全部站名，服务菜单停用。
- 一级菜单的展开／收起仅整理菜单；勾选才加载和显示，取消勾选才隐藏并释放数据。
- 两种模式分别保留勾选偏好。
- 线路按系统分包、按需加载；视野外路径先裁剪再绘制。
- 底图可选 OpenFreeMap Dark、Positron 和 OSM 标准地图，地图资源需联网。

## 目录

| 路径 | 内容 |
| --- | --- |
| `dist/` | 可直接部署的静态网站，含已缓存的线路数据及前端库 |
| `dist/systems/` | 按系统分拆、带内容哈希的线路数据 |
| `line-catalog.json` | 精简模式的实际线路、主题色和区间定义 |
| `data/` | 用于线路校正的 MLIT N02 数据快照 |
| `add_*.py`、`repair_keikyu.py` | 各系统的铁路轨迹生成／校正 |
| `build_fukutoshin_config.py` | 副都心线服务配置 |
| `split_rail_data.py` | 分包、线路元数据和站名搜索索引生成 |
| `tests/` | 轨迹、停站、加载、模式和菜单交互检查 |

## 测试

需要 Node.js 20+；仅测试依赖 `linkedom`，生产网页没有 npm 运行时依赖。

```sh
npm install
npm test
```

## 更新数据

仅修改前端样式或交互，无需重新生成数据。修改现有总数据或线路目录后，重新分包：

```sh
python3 split_rail_data.py
```

完整重新生成需要 [Mini Tokyo 3D](https://github.com/nagix/mini-tokyo-3d) 的原始数据目录：

```sh
git clone --depth 1 https://github.com/nagix/mini-tokyo-3d.git ../mini-tokyo
python3 make_data.py
```

也可通过 `MINI_TOKYO_DATA_DIR` 指定该项目的 `data/` 目录。MLIT 校正快照已包含在本仓库；如重新下载原始 MLIT JSON，可通过 `MLIT_DATA_DIR` 指定。

## 数据与第三方资源

- 基础轨迹及车站：Mini Tokyo 3D，MIT 许可见 `dist/DATA-LICENSE.txt`。
- 校正轨迹：加工日本国土交通省「国土数値情報 鉄道データ N02（2024）」。来源与条款见 [DATA-SOURCES.md](DATA-SOURCES.md)。
- Leaflet 1.9.4、MapLibre GL JS 4.7.1、MapLibre GL Leaflet 0.0.22：源码已随静态网站保留，第三方许可见 `dist/vendor/`。
- 底图与 logo 的来源链接见网站中的「数据来源与说明」。标志仅用于识别运营公司。

GPT Sites 项目标识及临时发布辅助脚本未包含在本次 GitHub 导出中。本仓库不包含 API key 或发布凭据；修改 GitHub 源码不会自动部署现有 GPT Sites 网站。
