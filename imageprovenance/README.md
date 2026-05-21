# 影像溯源分析儀 / Image Provenance Lab

純前端、100% 在瀏覽器裡跑的影像溯源工具。圖片不上傳,完全離線運作。

靈感取自 [863401402/image-provenance](https://github.com/863401402/image-provenance) 的精簡實作版本。

## 功能

- **元數據解析** — EXIF / XMP / IPTC / ICC / JFIF / GPS 全展開
- **C2PA / Content Credentials 偵測** — 掃 JUMBF magic bytes 與 c2pa 標籤
- **AI 生成簽名偵測** — Midjourney, DALL-E, Sora, Stable Diffusion, Flux, Firefly, SynthID, Imagen, NovelAI, Runway, Leonardo, Ideogram, Recraft, Nano Banana 等 20+ 種
- **頻域分析** — Web Worker 跑 2D FFT、viridis 對數頻譜熱圖、log-log 徑向譜、5 條啟發式規則
- **GPS 隱私警告** — 自動標出座標並提供 OpenStreetMap 連結
- **SHA-256 雜湊** — 用 Web Crypto API
- **JSON 匯出** — 完整報告

## 使用

**直接雙擊 `index.html` 即可** — 不需要任何 server。

(Worker 透過 inline `<script>` + Blob URL 載入,所以 `file://` 協定下也能跑。)

接著拖入圖片、點擊上傳、或 `Ctrl+V` 貼上即可。

## 檔案結構

```
.
├── index.html       # 主頁面 + CSS + 內嵌的 worker 程式碼
├── app.js           # 主應用邏輯(元數據解析、訊號偵測、UI 渲染)
├── README.md
└── lib/
    ├── exifr.js     # MIT 授權,作者 MikeKovarik(本地)
    └── piexif.js    # MIT 授權,作者 hMatoba(本地,預留供未來注入 EXIF 用)
```

註:`worker.js` 的內容已嵌進 `index.html` 的 `<script type="javascript/worker">` 區塊裡,
透過 `Blob` + `URL.createObjectURL` 建立 Worker — 這樣 `file://` 直接開也能用。
原始 `worker.js` 仍保留作為參考。

## 準確性說明

- **強訊號**(C2PA、明確的 AI 軟體簽名)幾乎不會錯。
- **頻域分析**對現代擴散模型的二分類準確率約 **70–85%**(參考 Corvi 2023)。可被簡單的後處理破壞,不能單獨作為證據。
- **元數據可被偽造也可被剝離** — 沒有元數據不代表是 AI 生成,有相機元數據也不代表是真實照片。

工具的價值在三層證據疊加,不要盲信任何單一數字。

## 授權

MIT
