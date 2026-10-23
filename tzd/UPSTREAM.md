# TZD 紫微資料整合

上游：https://github.com/Renhuai123/ziwei-doushu

固定版本：`1059c347231c636bd86ddb78fd8ed430d5de8d2a`（2026-10-23 取得）。

## 已接入

- 真太陽時：上游 NOAA 均時差、經度差及秒級時辰邊界。
- 本命排盤：上游 generateChart，統一星曜、四化、亮度、魁鉞、截空與大耗等加工規則。
- 四種亮度、四種閏月口徑及紫微晚子時當日／次日；與八字日柱選項分開。
- 嚴格格局判定：成立、加分、破格、來源；命盤摘要也採同一份結果。舊 47 格局保留為術語辭典。
- 四化飛入與宮干自化：獨立呈現，不混入上游倪派格局論斷。
- 夫妻宮知識補充；合盤的兩人命盤頁也可開啟各自的紫微進階資料。
- 三本古籍資料的章節節錄、全文檢索與繁簡轉換。上游整理內容含現代說明，不標成校勘原刻全文。
- 同日基礎 iztro 與上游加工命盤的差異明細。這是規則比對，不是命理準確率的驗證。
- v4.0 資料集：1950–2026，674,976 張盤 × 13 主題。來源壓縮檔逐一核對 SHA-256；轉為月份索引及共用主題段落字典，按需讀取，不需後端。

## 資料口徑與邊界

資料集是本命盤的確定性解讀，採 2026-10-15 亮度口徑（現代修正 v2），與上游 10-20 改為全書派的預設值有差異。查詢使用已校正及依紫微子時規則處理的排盤日期與時辰，不會再校正資料集一次。1950–2026 以外仍可排盤，但沒有此資料集解讀。

上游 `db-analysis.ts` 的完整 14 主星 × 13 主題斷語庫是未公開的占位檔；不以空檔宣稱提供完整知識圖譜。TZD 保留自己的星曜辭典，補上上游有公開的夫妻宮知識、格局依據及發布資料集。上游 AI prompt、API 與會員系統也未公開，本次無法移植。

中國夏令時工具隨原始碼保存，未自動減時；台灣出生表單不可套用中國大陸歷史表。原始出生時間若為夏令時，須先確認地區及當時記錄口徑。

## 授權

原始碼 MIT，見 `vendor/ziwei-doushu/LICENSE`。解讀資料 CC BY 4.0，來源與作者標註在頁面，完整條款見 `vendor/ziwei-doushu/DATASET-LICENSE`；解讀中的倪海廈引文不屬於該資料授權，需依上游的引文例外處理。未批次匯入非商用逐字稿目錄 `docs/tianji-ziwei/`。古籍按上游標示為公版；上游整理版本及修改另由程式授權涵蓋。

排盤依賴 iztro 2.5.8、lunar-javascript 1.7.3；繁簡轉換 opencc-js 1.0.5。授權檔見 `vendor/licenses/`。瀏覽器資產已打包在 `vendor/generated/`，無需外部 CDN。

## 重建與驗證

```powershell
npm ci --prefix tzd/tools --ignore-scripts
node tzd/tools/build-upstream.mjs
node --test tzd/tools/upstream.test.mjs
```

完整解讀資料來源清單為 `tools/release-assets.json`，已保存官方校驗表 `vendor/ziwei-doushu/DATASET-SHA256SUMS.txt`。執行：

```powershell
node tzd/tools/import-all.mjs
node tzd/tools/compact-dataset.mjs
node tzd/tools/optimize-index.mjs
node --test tzd/tools/dataset.test.mjs
```

匯入器需要 Node 25 的 zstd 支援。壓縮檔和中間月份字典不進版控；最終 `data/interpretations-v4/` 必須隨靜態站一起發布。每次更換上游版本或資料集必須重新驗證，不在瀏覽器執行時靜默追隨 main。

## 閱讀與載入優化

總覽、紫微摘要與格局卡片共用 `reading-model.js`。有破格條件時，先顯示限制，不再直接顯示完整吉格的肯定論斷。首頁改為本命風格、本命格局、目前查看運限三個重點，每點可展開判斷依據。移除首頁綜評分數與上游命盤的宮位強弱排名，宮位詳解改列三方四正的實際星曜。

本命資料集與動態大限／流年分開標示，原資料的「今年／當前大限」不當作即時運限。切換紫微年份時，重點卡片的年份與四化同步更新。

月份索引採 `topic-sequences-v2`，重複段落序列只儲存一次，解讀文字不變；讀取器仍相容 v1。主題字典記憶體快取上限三個，支援 Cache Storage 時另快取最多八份最近讀取資源，儲存空間不可用時改為直接讀取。

完整資料由 442,969,702 bytes 縮至 321,799,880 bytes（約省 27.4%），仍保留 674,976 張命盤與全部 13 主題。全量日期／索引檢查與官方來源文字抽樣還原檢查通過。

驗證閱讀一致性與格式轉換：`node --test tzd/tools/reading.test.mjs`。
