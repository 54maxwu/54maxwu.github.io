# 影像溯源分析儀 / Image Provenance Lab

純前端、100% 在瀏覽器裡跑的影像溯源工具。圖片不上傳,完全離線運作。

靈感取自 [863401402/image-provenance](https://github.com/863401402/image-provenance) 的精簡實作版本。

## 功能

- **元數據解析** — EXIF / XMP / IPTC / ICC / JFIF / GPS 全展開
- **C2PA / Content Credentials 偵測** — 掃 JUMBF magic bytes 與 c2pa 標籤
- **AI 生成簽名偵測** — Midjourney, DALL-E, Sora, Stable Diffusion, Flux, Firefly, SynthID, Imagen, NovelAI, Runway, Leonardo, Ideogram, Recraft, Nano Banana 等 20+ 種
- **AI 模型偵測(真模型)** — transformers.js 在瀏覽器內跑 `Organika/sdxl-detector`(Swin),WebGPU 加速、失敗退回 WASM。輸出校準 AI 機率。**圖片不上傳,只下載模型權重**(首次 ~100MB,之後瀏覽器快取)
- **區域鑑識(竄改定位)** — ELA(誤差層級分析)+ 噪聲殘差圖,空間定位被局部修改/AI 重繪(inpainting)的區域;分塊統計出 0–100 竄改可疑度。純 canvas
- **頻域分析** — Web Worker 跑 2D FFT、viridis 對數頻譜熱圖、log-log 徑向譜、啟發式打分
- **綜合判定(校準融合)** — 在 log-odds 空間把上述每層證據按可信度加權成單一 AI 可能性 %,附廠商拆分長條圖與每票理由;強來源憑證短路、證據不足時誠實顯示「資料不足」
- **GPS 隱私警告** — 自動標出座標並提供 OpenStreetMap 連結
- **SHA-256 雜湊** — 用 Web Crypto API
- **JSON 匯出** — 完整報告

> 說明:除「AI 模型偵測」首次需連網下載權重外,其餘全部 100% 本地離線運作;即使是模型偵測,圖片本身也不上傳,只從 CDN / HF Hub 下載模型。

## 使用

**直接雙擊 `index.html` 即可** — 不需要任何 server。

(Worker 透過 inline `<script>` + Blob URL 載入,所以 `file://` 協定下也能跑。)

接著拖入圖片、點擊上傳、或 `Ctrl+V` 貼上即可。

## 檔案結構

```
.
├── index.html            # 主頁面 + 分頁結構
├── src/
│   ├── main.js           # 進入點:上傳、分頁、編排各分析、渲染
│   ├── detect.js         # 來源偵測(JUMBF + 結構化元數據 + 字節關鍵字)
│   ├── forensics.js      # 區域鑑識:ELA + 噪聲殘差(竄改定位)
│   ├── aimodel.js        # 瀏覽器內 AI 模型(transformers.js,懶載入)
│   ├── fusion.js         # 校準融合:把各層證據合成單一 AI 可能性 %
│   ├── frequency/        # 頻域 Web Worker(2D FFT、徑域譜、特徵、打分)
│   ├── convert.js        # 元數據清洗 + 相機 EXIF 偽裝 + 水印擾動
│   ├── i18n.js           # zh / en 字典
│   ├── styles.css        # 全部樣式
│   └── bundle.js         # esbuild 打包輸出(實際載入的檔案)
└── README.md
```

`src/bundle.js` 由 esbuild 從 `src/main.js` 打包而成。改完 `src/` 任何模組後要重建:

```bash
npm install      # 首次:裝 esbuild(devDependency)
npm run build    # 產生 src/bundle.js
# 或 npm run watch 自動重建
```

頻域 Worker 透過 inline 字串 + `Blob` URL 建立,所以 `file://` 直接開也能跑。

## 準確性說明

證據分層、可信度不同,工具把它們**校準融合**成一個 % 並列出每票理由——不要盲信單一數字:

- **強訊號**(C2PA、明確的 AI 軟體簽名)幾乎不會錯,但**可被剝離**——沒有不代表是真。
- **AI 模型**(Swin / SDXL-detector)是真正訓練過的分類器,對擴散模型(SD/SDXL)最準,但**偏向擴散**,對其他生成器可能漏判,只當一票。首次需連網下載權重。
- **區域鑑識(ELA / 噪聲)**擅長定位**局部修改 / AI 重繪**;對 JPEG 最有效,PNG / 截圖僅供參考,易受重壓縮干擾。
- **頻域分析**對現代擴散模型二分類約 **70–85%**(參考 Corvi 2023),可被簡單後處理破壞。
- **元數據可被偽造也可被剝離** — 有相機元數據也不代表是真實照片。

工具的價值在多層證據疊加 + 透明可解釋,而非任何單一分數。

## 授權

MIT
