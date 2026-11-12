# 樹義國小校園對戰：原始碼

網頁版位於上一層：`../index.html` + `../game-app.js`，皆由本目錄打包產生，請勿直接修改。

## 更新流程

```bash
cd shuyi/src
npm install      # 第一次或依賴版本變更時（three 0.186.0、esbuild 0.28.2）
# 修改原始碼 …
npm run build    # 輸出 ../index.html 與 ../game-app.js（JS 連結附內容雜湊，避免瀏覽器沿用舊檔）
```

本機測試：在 repo 根目錄啟動任一靜態伺服器，開啟 `/shuyi/`。網址參數 `?q=low|medium|high` 可指定畫質。

## 檔案

| 檔案 | 內容 |
|---|---|
| `campus-real.js` | 1:1 校園場景：建築、教室與堂號／班級門牌、樓梯、中庭、操場、樂群樓、圍牆；同時產生碰撞體 |
| `campus-map.js` | 場景選擇、導航網格、出生點、小地圖、所在位置標籤、AI 目標點 |
| `campus-physics.js` | 碰撞射線加速與多樓層導航（`clearY` 讓實際比例樓梯可通行） |
| `campus-env.js`、`campus-lighting.js` | 光照、陰影與天空 |
| `campus-labels.js` | 景點浮動名稱 |
| `campus-visuals.js` | 舊 Minecraft 方塊場景載入器（`?world=voxel` 用；網頁版未附地圖資料，正式場景不使用） |
| `game-src/` | 遊戲本體：角色與服裝（`character.js`）、隊伍與 AI（`bots.js`）、介面（`hud.js`）、槍械、音效、渲染 |
| `data/osm-campus.json` | 校地與建築外框原始資料（© OpenStreetMap 貢獻者，ODbL） |

## 常改的地方

- 教室堂號與班級：`campus-real.js` 中各棟的 `names`（格式 `'堂號|班級'`，例如 `'齊陽堂|6-6'`），以及各樓層 `segs`。資料依「臺中市南區樹義國民小學 115 學年度各類教室分配位置圖（1150720）」。新學年度更新這裡即可。
- 隊伍名稱與編號：`game-src/bots.js` 的 `TEAM_PREFIX`；隊名在 `game-src/hud.js` 的 `TEAM_CN`。
- 服裝：`game-src/character.js` 的 `OUTFIT`（顏色）與 `buildGeometry`（形狀）。BL 女生隊穿制服，GR 男生隊穿體育服。

## 資料來源與授權

- 尺寸與位置：© OpenStreetMap 貢獻者（ODbL）。
- 校園配置、堂號、景點：臺中市南區樹義國民小學 https://tanghao.neocities.org/ （CC BY-NC-SA），以及學校公告的教室分配位置圖。
- 遊戲引擎（槍械、角色骨架、HUD、音效）改編自 https://github.com/riba2534/claude-opus-5-5-demo 。該專案未附授權條款。
