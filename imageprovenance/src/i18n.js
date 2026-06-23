// i18n: zh/en dictionary + runtime switcher.
// Dynamic content (detection cards, frequency rules, log lines) calls t(key)
// at render time. Static text uses data-i18n[-attr] in HTML.

const STRINGS = {
    // Hero / empty-state
    'hero.title':           { zh: '追溯一張圖的來路',                                                  en: 'Trace where an image comes from' },
    'hero.sub':             { zh: '檢測 C2PA 憑證、AI 生成簽名、頻域水印痕跡。',                       en: 'Detect C2PA credentials, AI-generated signatures, and frequency-domain watermark traces.' },
    'hero.feature.c2pa':    { zh: 'C2PA / Content Credentials',                                       en: 'C2PA / Content Credentials' },
    'hero.feature.vendors': { zh: 'OpenAI · Google SynthID · Midjourney · SD',                        en: 'OpenAI · Google SynthID · Midjourney · SD' },
    'hero.feature.freq':    { zh: '65 項頻域特徵 + 啟發式打分',                                        en: '65 frequency features + heuristic scoring' },
    'hero.feature.clean':   { zh: '元數據清洗 / 相機 EXIF 偽裝',                                       en: 'Metadata stripping & camera EXIF spoofing' },

    // Topbar
    'topbar.github':        { zh: 'GitHub',                                                            en: 'GitHub' },
    'topbar.theme':         { zh: '切換主題',                                                          en: 'Toggle theme' },
    'topbar.lang':          { zh: '切換語言',                                                          en: 'Switch language' },

    // Upload
    'upload.text.html':     { zh: '拖拽圖片到此處<br>或 <strong>點擊選擇</strong>',                    en: 'Drag an image here<br>or <strong>click to select</strong>' },
    'upload.hint':          { zh: 'PNG · JPEG · WebP',                                                en: 'PNG · JPEG · WebP' },
    'upload.changeFile':    { zh: '換一張',                                                            en: 'Change' },

    // File meta
    'fm.type':              { zh: '類型',                                                              en: 'Type' },
    'fm.size':              { zh: '大小',                                                              en: 'Size' },
    'fm.dims':              { zh: '尺寸',                                                              en: 'Dims' },
    'fm.hash':              { zh: 'SHA-256',                                                          en: 'SHA-256' },

    // Result header
    'result.eyebrow':       { zh: '分析結果',                                                          en: 'Analysis' },
    'result.analyzing':     { zh: '正在分析',                                                          en: 'Analyzing' },
    'result.aiHit':         { zh: '發現 AI 來源憑證線索',                                              en: 'AI provenance signal found' },
    'result.aiClean':       { zh: '未發現 AI 來源憑證',                                                en: 'No AI provenance signal' },
    'result.aiHitSub':      { zh: '元數據中直接聲明或強烈指向 AI 生成工具。',                          en: 'Metadata explicitly declares or strongly points to an AI generator.' },
    'result.weakSub':       { zh: '未檢出元數據聲明的 AI 標記;僅有字節級啟發性異常,不足以判定。',     en: 'No metadata-level AI markers detected; only weak byte-level anomalies — insufficient to conclude.' },
    'result.editSub':       { zh: '未檢出 AI 生成標記,但圖片經過修圖軟件處理。',                       en: 'No AI markers detected, but the image has been touched by editing software.' },
    'result.cleanSub':      { zh: '元數據中沒有發現 AI 生成相關標記。',                                en: 'No AI-related markers were found in the metadata.' },
    'badge.hit':            { zh: '命中',                                                              en: 'HIT' },
    'badge.miss':           { zh: '未命中',                                                            en: 'CLEAN' },
    'badge.found':          { zh: '發現',                                                              en: 'Found' },
    'badge.notfound':       { zh: '未發現',                                                            en: 'Not found' },
    'badge.foundEdit':      { zh: '發現修圖痕跡',                                                      en: 'Edit traces' },
    'badge.foundMarker':    { zh: '發現標記',                                                          en: 'Marker found' },
    'badge.bytesC2PA':      { zh: '字節中含 C2PA 字符串',                                              en: 'C2PA string in bytes' },
    'badge.metadataAI':     { zh: '元數據命中 AI 生成工具',                                            en: 'Metadata names an AI tool' },
    'badge.metadataYes':    { zh: '存在元數據,但未命中 AI',                                           en: 'Metadata present, no AI marker' },
    'badge.metadataNone':   { zh: '無可讀元數據',                                                      en: 'No readable metadata' },
    'badge.wmSuspect':      { zh: '疑似水印',                                                          en: 'Watermark suspect' },
    'badge.wmClean':        { zh: '未檢測到異常',                                                      en: 'No anomaly' },
    'conf.strong':          { zh: '強證據',                                                            en: 'Strong' },
    'conf.medium':          { zh: '中等',                                                              en: 'Medium' },
    'conf.weak':            { zh: '弱',                                                                en: 'Weak' },
    'conf.info':            { zh: '提示',                                                              en: 'Note' },

    // Detection card (titles + canned descriptions)
    'det.detail.viewMore':  { zh: '查看詳情',                                                          en: 'View details' },
    'det.title.c2pa':       { zh: 'C2PA / Content Credentials',                                       en: 'C2PA / Content Credentials' },
    'det.desc.c2pa.aiType': { zh: '圖片嵌入了 C2PA 來源憑證,並明確聲明為算法生成內容。',              en: 'Image embeds a C2PA credential explicitly declaring algorithmic generation.' },
    'det.desc.c2pa.present':{ zh: '圖片嵌入了 C2PA 來源憑證。',                                        en: 'Image embeds a C2PA credential.' },
    'det.desc.c2pa.bytes':  { zh: '文件字節中出現 C2PA 相關字符串,但未發現完整 JUMBF 結構。',         en: 'C2PA-related strings present in bytes, but no full JUMBF structure.' },
    'det.desc.c2pa.none':   { zh: '沒有在字節中找到 C2PA/JUMBF 線索。',                                en: 'No C2PA / JUMBF traces in the bytes.' },
    'det.title.meta':       { zh: '結構化元數據 (EXIF / XMP / IPTC)',                                  en: 'Structured metadata (EXIF / XMP / IPTC)' },
    'det.desc.meta.aiHit':  { zh: '圖片元數據字段直接記錄了 AI 生成工具或標記。',                       en: 'Metadata fields explicitly name an AI generator or marker.' },
    'det.desc.meta.hasAny': { zh: '提取到的元數據字段未匹配 AI 生成標記。',                            en: 'Extracted metadata fields do not match any known AI marker.' },
    'det.desc.meta.empty':  { zh: '圖片幾乎不含元數據(可能被剝離)。',                                en: 'Image carries almost no metadata (likely stripped).' },
    'det.title.openai':     { zh: 'OpenAI / DALL·E / GPT',                                            en: 'OpenAI / DALL·E / GPT' },
    'det.desc.openai.miss': { zh: '沒有發現 OpenAI / DALL-E / ChatGPT 相關標記。',                    en: 'No OpenAI / DALL·E / ChatGPT markers found.' },
    'det.title.google':     { zh: 'Google / SynthID / Gemini',                                        en: 'Google / SynthID / Gemini' },
    'det.desc.google.miss': { zh: '沒有發現 Google / SynthID / Gemini 相關標記。',                     en: 'No Google / SynthID / Gemini markers found.' },
    'det.title.midjourney': { zh: 'Midjourney',                                                        en: 'Midjourney' },
    'det.desc.midjourney.miss':{ zh: '沒有發現 Midjourney 相關標記。',                                 en: 'No Midjourney markers found.' },
    'det.title.sd':         { zh: 'Stable Diffusion / ComfyUI / Flux',                                en: 'Stable Diffusion / ComfyUI / Flux' },
    'det.desc.sd.miss':     { zh: '沒有發現 Stable Diffusion / ComfyUI / Flux 相關標記。',            en: 'No Stable Diffusion / ComfyUI / Flux markers found.' },
    'det.title.adobe':      { zh: 'Adobe Firefly (AI)',                                               en: 'Adobe Firefly (AI)' },
    'det.desc.adobe.miss':  { zh: '沒有發現 Adobe Firefly 相關標記。',                                en: 'No Adobe Firefly markers found.' },
    'det.title.photoshop':  { zh: 'Photoshop / 修圖軟件 (非 AI)',                                     en: 'Photoshop / Edit software (non-AI)' },
    'det.desc.photoshop.miss':{ zh: '沒有發現 Photoshop / Lightroom 處理痕跡。',                       en: 'No Photoshop / Lightroom traces found.' },
    'det.title.pngtext':    { zh: 'PNG 文本塊 / 生成參數',                                            en: 'PNG text chunks / generation params' },
    'det.desc.pngtext.miss':{ zh: '沒有發現 PNG 文本塊中的生成參數。',                                en: 'No generation params found in PNG text chunks.' },
    'det.title.wm':         { zh: '像素級隱形水印(字節級啟發)',                                      en: 'Pixel-level invisible watermark (byte heuristic)' },
    'det.desc.wm.suspect':  { zh: '字節分佈偏離自然圖像模型,可能存在隱形水印。完整頻域分析將在"頻域"tab 提供。', en: 'Byte distribution deviates from natural-image models — possible invisible watermark. Full frequency analysis is in the Frequency tab.' },
    'det.desc.wm.clean':    { zh: '字節分佈符合自然圖像特徵,未發現明顯水印痕跡。',                    en: 'Byte distribution matches natural images — no obvious watermark traces.' },
    'det.foundOne':         { zh: '發現 ${kw}',                                                       en: 'Found ${kw}' },
    'det.cardKwHits':       { zh: '發現 ${list} 等相關標記。',                                        en: 'Found ${list} and related markers.' },
    'det.cardEditHits':     { zh: '檢測到 ${list} 修圖痕跡。',                                        en: 'Detected ${list} editing traces.' },

    // Tabs
    'tab.detect':   { zh: '溯源',     en: 'Detect' },
    'tab.freq':     { zh: '頻域',     en: 'Frequency' },
    'tab.meta':     { zh: '元數據',   en: 'Metadata' },
    'tab.convert':  { zh: '轉換',     en: 'Convert' },

    // Frequency tab
    'freq.runBtn':          { zh: '運行頻域分析',                                                       en: 'Run frequency analysis' },
    'freq.panelHint.html':  { zh: '提取 65 個頻域特徵:FFT 幅度譜、徑向功率譜、相位一致性、LSB 偏置、小波子帶能量……<br>在 Web Worker 中執行,不阻塞頁面。耗時約 1-3 秒。', en: 'Extracts 65 frequency features: FFT magnitude, radial power spectrum, phase consistency, LSB bias, wavelet sub-bands…<br>Runs in a Web Worker so the UI stays responsive. ~1-3 s.' },
    'freq.disclaimer.tag':  { zh: '非專業分析',                                                         en: 'Not lab-grade' },
    'freq.disclaimer.text': { zh: '僅供參考 · 基於啟發式規則,不等同於學術級分類器',                    en: 'Reference only · heuristic rules, not an academic classifier' },
    'freq.verdict.label':   { zh: '啟發式判定',                                                         en: 'Heuristic verdict' },
    'freq.score':           { zh: '得分 ${total} · 正向證據 ${pos} · 反向 ${neg}',                     en: 'Score ${total} · pros ${pos} · cons ${neg}' },
    'freq.timing':          { zh: '分析分辨率 ${side}×${side} · 用時 ${ms}ms',                         en: 'Resolution ${side}×${side} · took ${ms}ms' },
    'freq.viz.fft':         { zh: 'FFT 幅度譜(對數)',                                                 en: 'FFT magnitude (log)' },
    'freq.viz.radial':      { zh: '徑向功率譜',                                                         en: 'Radial power spectrum' },
    'freq.axis.low':        { zh: '低頻',                                                               en: 'Low' },
    'freq.axis.high':       { zh: '高頻',                                                               en: 'High' },
    'freq.votes.title':     { zh: '判定依據 (${n} 條觸發)',                                             en: 'Rules fired (${n})' },
    'freq.votes.empty':     { zh: '沒有規則被觸發,特徵落在正常範圍內。',                                en: 'No rules fired — all features are within normal range.' },
    'freq.features.summary':{ zh: '全部特徵值 (${n})',                                                  en: 'All feature values (${n})' },
    'freq.verdict.highAI':  { zh: '高度疑似 AI 生成',                                                   en: 'Highly likely AI-generated' },
    'freq.verdict.hasAI':   { zh: '存在 AI 特徵',                                                       en: 'AI-like characteristics' },
    'freq.verdict.weak':    { zh: '輕微可疑',                                                           en: 'Slightly suspicious' },
    'freq.verdict.real':    { zh: '更接近真實照片',                                                     en: 'Closer to a real photo' },
    'freq.verdict.unsure':  { zh: '特徵模糊,無法判定',                                                 en: 'Inconclusive features' },
    'freq.err':             { zh: '頻域分析失敗: ${msg}',                                               en: 'Frequency analysis failed: ${msg}' },

    // Convert tab
    'conv.sub':             { zh: '剝離 C2PA / AI 標記,重編碼並注入相機 EXIF,讓圖片看起來像真實相機拍的。', en: 'Strip C2PA / AI markers, re-encode, and inject camera EXIF so the image looks camera-native.' },
    'conv.group.phone':     { zh: '手機',                                                               en: 'Phone' },
    'conv.group.dslr':      { zh: '無反 / 單反',                                                        en: 'Mirrorless / DSLR' },
    'conv.group.compact':   { zh: '緊湊 / 膠片感',                                                      en: 'Compact / Film-look' },
    'conv.wm.toggle':       { zh: '擾動像素級隱形水印',                                                  en: 'Disrupt pixel-level invisible watermark' },
    'conv.wm.hint':         { zh: '多種技術組合降低 SynthID / Stable Signature / dwtDct 等水印可檢測性。用於學術魯棒性評估。', en: 'Combines multiple techniques to reduce detectability of SynthID, Stable Signature, dwtDct watermarks. For academic robustness evaluation.' },
    'conv.preset':          { zh: '預設',                                                               en: 'Preset' },
    'conv.preset.light':    { zh: '輕量',                                                               en: 'Light' },
    'conv.preset.rec':      { zh: '推薦',                                                               en: 'Recommended' },
    'conv.preset.strong':   { zh: '強力',                                                               en: 'Strong' },
    'conv.preset.ultra':    { zh: '極限',                                                               en: 'Extreme' },
    'conv.preset.custom':   { zh: '自定義',                                                             en: 'Custom' },
    'conv.intensity':       { zh: '強度',                                                               en: 'Intensity' },
    'conv.tech.geom':       { zh: '幾何微變換',                                                         en: 'Micro geometry' },
    'conv.tech.geom.desc':  { zh: '裁邊 0.3-1.5% 後 resize,破壞幾何對齊水印',                          en: 'Crop 0.3-1.5% then resize; breaks geometry-aligned watermarks' },
    'conv.tech.noise':      { zh: '高斯噪聲',                                                           en: 'Gaussian noise' },
    'conv.tech.noise.desc': { zh: '±2 至 ±6 灰度值,提升噪聲地板',                                      en: 'Adds ±2–±6 grayscale noise, raising the noise floor' },
    'conv.tech.unsharp':    { zh: '銳化補償',                                                           en: 'Unsharp mask' },
    'conv.tech.unsharp.desc':{ zh: '恢復噪聲/重採樣造成的視覺柔化',                                      en: 'Restores perceived sharpness after noise + resampling' },
    'conv.tech.doubleJpeg': { zh: '雙次 JPEG',                                                          en: 'Double JPEG' },
    'conv.tech.doubleJpeg.desc':{ zh: 'q=60-72 中間編碼,破壞 DCT 域水印',                              en: 'Mid-q 60-72 re-encode; breaks DCT-domain watermarks' },
    'conv.tech.chShift':    { zh: '通道位移',                                                           en: 'Channel shift' },
    'conv.tech.chShift.desc':{ zh: 'R/B 通道 ±1 像素,破壞跨通道對齊水印',                              en: 'R/B channel shift ±1 px; breaks cross-channel watermarks' },
    'conv.tech.bandNoise':  { zh: '低頻帶狀噪聲',                                                       en: 'Low-freq band noise' },
    'conv.tech.bandNoise.desc':{ zh: '粗網格平滑噪聲,擾動頻域中低頻',                                   en: 'Coarse-grid smooth noise; perturbs mid/low frequency band' },
    'conv.tech.fftPhase':   { zh: 'FFT 相位擾動',                                                       en: 'FFT phase perturbation' },
    'conv.tech.fftPhase.desc':{ zh: '真 2D-FFT 中頻相位 ±3-5°,直擊 SynthID,~500ms',                    en: 'Real 2D-FFT mid-band phase ±3-5°; targets SynthID, ~500 ms' },
    'conv.tech.median':     { zh: '中值濾波 3×3',                                                       en: 'Median filter 3×3' },
    'conv.tech.median.desc':{ zh: '破壞 LSB 隱寫與單像素噪聲水印',                                      en: 'Breaks LSB stego and single-pixel noise watermarks' },
    'conv.tech.badge.slow': { zh: '慢',                                                                 en: 'slow' },
    'conv.tech.badge.soft': { zh: '輕柔化',                                                             en: 'soft' },
    'conv.adv.summary':     { zh: '高級選項',                                                           en: 'Advanced options' },
    'conv.adv.note':        { zh: '默認即為推薦值,不改也行',                                           en: 'Defaults are recommended; fine to leave as-is' },
    'conv.adv.date':        { zh: '拍攝時間',                                                           en: 'Shoot time' },
    'conv.adv.date.now':    { zh: '現在 (推薦)',                                                        en: 'Now (recommended)' },
    'conv.adv.date.1h':     { zh: '1 小時前',                                                            en: '1 hour ago' },
    'conv.adv.date.1d':     { zh: '1 天前',                                                              en: '1 day ago' },
    'conv.adv.date.7d':     { zh: '1 周前',                                                              en: '1 week ago' },
    'conv.adv.date.30d':    { zh: '1 個月前',                                                            en: '1 month ago' },
    'conv.adv.date.365d':   { zh: '1 年前',                                                              en: '1 year ago' },
    'conv.adv.date.custom': { zh: '自定義…',                                                             en: 'Custom…' },
    'conv.adv.gps':         { zh: '地理位置',                                                           en: 'GPS' },
    'conv.adv.orient':      { zh: '方向',                                                               en: 'Orientation' },
    'conv.adv.orient.1':    { zh: '1 · 正常',                                                           en: '1 · Normal' },
    'conv.adv.orient.6':    { zh: '6 · 順時針 90°',                                                     en: '6 · Rotate 90° CW' },
    'conv.adv.orient.8':    { zh: '8 · 逆時針 90°',                                                     en: '8 · Rotate 90° CCW' },
    'conv.adv.orient.3':    { zh: '3 · 180°',                                                           en: '3 · 180°' },
    'conv.adv.quality':     { zh: 'JPEG 質量',                                                           en: 'JPEG quality' },
    'conv.adv.quality.rand':{ zh: '隨機 88-95 (推薦)',                                                   en: 'Random 88-95 (recommended)' },
    'conv.adv.quality.custom':{ zh: '自定義…',                                                           en: 'Custom…' },
    'conv.adv.iso':         { zh: 'ISO',                                                                 en: 'ISO' },
    'conv.adv.iso.ph':      { zh: '按相機默認',                                                           en: 'Camera default' },
    'conv.adv.fnum':        { zh: '光圈 f/',                                                             en: 'Aperture f/' },
    'conv.adv.shutter':     { zh: '快門 1/…',                                                             en: 'Shutter 1/…' },
    'conv.runBtn':          { zh: '開始轉換',                                                           en: 'Convert' },
    'conv.reanalyze':       { zh: '重新分析',                                                           en: 'Re-analyze' },
    'conv.download':        { zh: '下載 (${size})',                                                     en: 'Download (${size})' },
    'conv.processing':      { zh: '正在處理...',                                                         en: 'Processing...' },
    'conv.done':            { zh: '轉換完成',                                                           en: 'Conversion complete' },
    'conv.err':             { zh: '轉換失敗: ${msg}',                                                   en: 'Conversion failed: ${msg}' },

    // GPS presets
    'gps.none':             { zh: '不寫入 GPS (推薦)',                                                   en: 'No GPS (recommended)' },
    'gps.beijing':          { zh: '北京 · 故宮午門',                                                     en: 'Beijing · Forbidden City' },
    'gps.shanghai':         { zh: '上海 · 外灘',                                                         en: 'Shanghai · The Bund' },
    'gps.gz':               { zh: '廣州 · 小蠻腰',                                                       en: 'Guangzhou · Canton Tower' },
    'gps.shenzhen':         { zh: '深圳 · 平安金融中心',                                                 en: 'Shenzhen · Ping An Finance Centre' },
    'gps.chengdu':          { zh: '成都 · 春熙路',                                                       en: 'Chengdu · Chunxi Road' },
    'gps.hongkong':         { zh: '香港 · 維多利亞港',                                                   en: 'Hong Kong · Victoria Harbour' },
    'gps.tokyo':            { zh: '東京 · 澀谷站',                                                       en: 'Tokyo · Shibuya Stn' },
    'gps.nyc':              { zh: '紐約 · 時代廣場',                                                     en: 'New York · Times Square' },

    // Analysis log (progressive)
    'log.readBytes':        { zh: '讀取文件字節',                                                       en: 'Read file bytes' },
    'log.sha256':           { zh: '計算 SHA-256 指紋',                                                  en: 'Compute SHA-256' },
    'log.jumbf':            { zh: '掃描 JUMBF / C2PA 簽名容器',                                         en: 'Scan JUMBF / C2PA containers' },
    'log.exif':             { zh: '解析 EXIF / XMP / IPTC / ICC',                                       en: 'Parse EXIF / XMP / IPTC / ICC' },
    'log.markers':          { zh: '匹配 AI 生成標記庫',                                                 en: 'Match AI marker library' },
    'log.wmHeuristic':      { zh: '字節級水印啟發分析',                                                 en: 'Byte-level watermark heuristics' },
    'log.hits':             { zh: '命中 ${n} 項',                                                        en: '${n} hits' },
    'log.allNeg':           { zh: '全部陰性',                                                           en: 'all negative' },
    'log.jumbfHit':         { zh: '發現 ${n} 個 JUMBF box',                                              en: 'Found ${n} JUMBF boxes' },
    'log.jumbfNone':        { zh: '未發現',                                                             en: 'None found' },
    'log.fieldsCount':      { zh: '讀取到 ${n} 個字段',                                                  en: '${n} fields parsed' },
    'log.noMeta':           { zh: '無元數據',                                                           en: 'No metadata' },
    'log.err':              { zh: '分析失敗:${msg}',                                                   en: 'Analysis failed: ${msg}' },

    // Stats bar
    'stats.visits':         { zh: '訪問',                                                               en: 'Visits' },
    'stats.analyses':       { zh: '檢測',                                                               en: 'Analyses' },
    'stats.conversions':    { zh: '轉換',                                                               en: 'Conversions' },

    // Community card
    'comm.eyebrow':         { zh: '社群',                                                               en: 'Community' },
    'comm.title':           { zh: 'AI 電商微信交流群',                                                  en: 'AI E-commerce WeChat Group' },
    'comm.sub':             { zh: '掃碼加入討論 · AI 圖片工具 / 電商素材 / 自動化 / 工具鏈分享',         en: 'Scan to join · AI image tools / e-commerce assets / automation / toolchain sharing' },
    'comm.hint.html':       { zh: '點二維碼查看原圖,或在 <a href="https://github.com/863401402/image-provenance/issues" target="_blank" rel="noopener">GitHub Issues</a> 提醒更新', en: 'Tap the QR to open the full image, or ping on <a href="https://github.com/863401402/image-provenance/issues" target="_blank" rel="noopener">GitHub Issues</a> if it expired' },

    // Footer
    'foot.mit':             { zh: 'MIT · 開源於 <a href="https://github.com/863401402/image-provenance" target="_blank" rel="noopener">GitHub</a>', en: 'MIT · Open source on <a href="https://github.com/863401402/image-provenance" target="_blank" rel="noopener">GitHub</a>' },
    'foot.pitch':           { zh: '零構建 · 零後端 · 零上傳',                                           en: 'Zero build · Zero backend · Zero upload' },

    // SEO meta (rendered into document.title / meta[name=description]... on language change)
    'seo.title':            { zh: 'AI 圖片檢測 · C2PA / SynthID / Sora / Gemini / Midjourney 溯源 · Image Provenance',
                              en: 'AI Image Detector · C2PA / SynthID / Sora / Gemini / Midjourney Provenance · Image Provenance' },
    'seo.description':      { zh: '免費 AI 圖片檢測工具。100% 在瀏覽器裡運行,圖片不上傳。識別 C2PA / Content Credentials 來源憑證、Google SynthID 水印、OpenAI DALL·E / Sora / gpt-image / Nano Banana、Midjourney、Stable Diffusion / SDXL / Flux、Adobe Firefly 等 AI 生成簽名。提取 EXIF / XMP / IPTC / ICC 元數據,65 項頻域特徵啟發式分析,支持去除元數據、擾動水印、注入相機 EXIF 偽裝為真實照片。',
                              en: 'Free AI-image detector that runs 100% in your browser — images are never uploaded. Identifies C2PA / Content Credentials, Google SynthID, OpenAI DALL·E / Sora / gpt-image / Nano Banana, Midjourney, Stable Diffusion / SDXL / Flux, Adobe Firefly and more. Parses EXIF / XMP / IPTC / ICC, 65-feature frequency-domain heuristic analysis, metadata stripping, watermark disruption, fake camera EXIF injection.' },
    'seo.keywords':         { zh: 'AI 圖片檢測,AI 生成圖檢測,C2PA,SynthID,Sora,DALL-E,gpt-image,Nano Banana,Midjourney,Stable Diffusion,SDXL,Flux,ComfyUI,Adobe Firefly,Gemini,Imagen,EXIF 分析,頻域分析,圖像水印檢測,水印去除,圖像溯源,image forensics,AI image detector,synthetic image detection,EXIF viewer online,C2PA verifier,watermark removal,客戶端工具,零後端',
                              en: 'AI image detector, AI-generated image detection, C2PA verifier, Content Credentials, SynthID detector, Sora detection, DALL-E detection, gpt-image, Nano Banana, Midjourney detector, Stable Diffusion detector, SDXL, Flux, ComfyUI, Adobe Firefly, Gemini, Imagen, EXIF viewer online, XMP parser, IPTC, JUMBF, frequency analysis, FFT image analysis, image forensics, watermark detection, watermark removal, synthetic image detection, diffusion model detection, client-side tool, no upload' },
    'seo.ogTitle':          { zh: 'AI 圖片檢測 · C2PA / SynthID / Sora / Midjourney / DALL-E 溯源 · 瀏覽器運行不上傳',
                              en: 'AI Image Detector · C2PA / SynthID / Sora / Midjourney / DALL-E · Runs in your browser, no upload' },
    'seo.ogDescription':    { zh: '免費 AI 圖片檢測工具。識別 C2PA、Google SynthID、OpenAI DALL-E / Sora / gpt-image、Midjourney、Stable Diffusion、Flux、Adobe Firefly、Gemini 等 AI 生成簽名;讀取 EXIF / XMP 元數據;65 項頻域特徵分析。100% 客戶端,圖片不上傳。',
                              en: 'Free AI-image detector. Recognizes C2PA, Google SynthID, OpenAI DALL-E / Sora / gpt-image, Midjourney, Stable Diffusion, Flux, Adobe Firefly, Gemini signatures. Parses EXIF / XMP. 65-feature frequency analysis. 100% client-side, no upload.' },
    'seo.twDescription':    { zh: '瀏覽器內運行的免費 AI 圖片溯源 · C2PA / EXIF / 65 頻域特徵 · 零後端圖片不上傳',
                              en: 'Free in-browser AI image provenance · C2PA / EXIF / 65 frequency features · Zero backend, no upload' },

    // ===== New tabs =====
    'tab.model':            { zh: 'AI 模型',                                                            en: 'AI Model' },
    'tab.forensics':        { zh: '鑑識',                                                              en: 'Forensics' },

    // ===== Combined verdict (fusion) =====
    'fusion.aiLikelihood':  { zh: 'AI 可能性',                                                          en: 'AI likelihood' },
    'fusion.sub':           { zh: '綜合所有證據層的校準判定 · 拖入新圖會即時更新',                       en: 'Calibrated across every evidence layer · updates live as analyses finish' },
    'fusion.noEvidence':    { zh: '尚無有效證據,各項分析完成後會自動更新。',                            en: 'No usable evidence yet — this updates as each analysis finishes.' },
    'fusion.label.confirmed':   { zh: '確認 AI 生成 (來源憑證)',                                         en: 'Confirmed AI-generated (provenance)' },
    'fusion.label.likelyAi':    { zh: '很可能為 AI 生成 / 修圖',                                         en: 'Likely AI-generated / edited' },
    'fusion.label.uncertain':   { zh: '不確定,證據分歧',                                                en: 'Uncertain — mixed evidence' },
    'fusion.label.likelyReal':  { zh: '較可能為真實照片',                                                en: 'More likely a real photo' },
    'fusion.label.inconclusive':{ zh: '資料不足,無法判定',                                              en: 'Inconclusive — not enough signal' },
    'fusion.src.model':     { zh: 'AI 模型',                                                            en: 'AI model' },
    'fusion.src.freq':      { zh: '頻域啟發',                                                           en: 'Frequency heuristic' },
    'fusion.src.forensics': { zh: '區域鑑識',                                                           en: 'Forensics (ELA/noise)' },
    'fusion.src.marker':    { zh: '廠商標記',                                                           en: 'Vendor marker' },
    'fusion.src.weak':      { zh: '弱訊號',                                                             en: 'Weak signal' },
    'fusion.src.edit':      { zh: '修圖痕跡',                                                           en: 'Editing trace' },
    'fusion.src.provenance':{ zh: '來源憑證',                                                           en: 'Provenance' },
    'fusion.detail.model':  { zh: '模型判 AI ${pct}% · ${dev}',                                         en: 'model says AI ${pct}% · ${dev}' },
    'fusion.detail.freq':   { zh: '啟發得分 ${total}',                                                  en: 'heuristic score ${total}' },
    'fusion.detail.forensics':{ zh: '竄改分 ${score}',                                                  en: 'tamper score ${score}' },
    'fusion.pending.prefix':{ zh: '尚未執行:',                                                         en: 'Not yet run:' },
    'fusion.pending.model': { zh: 'AI 模型',                                                            en: 'AI model' },
    'fusion.pending.forensics':{ zh: '區域鑑識',                                                        en: 'Forensics' },

    // ===== AI model tab =====
    'model.tag':            { zh: '真模型',                                                             en: 'Real model' },
    'model.disclaimer':     { zh: '瀏覽器內運行的神經網路 · 首次需下載權重 (~100MB) · 圖片不上傳,僅下載模型',  en: 'A neural net running in your browser · first run downloads ~100MB of weights · the image is never uploaded, only the model is downloaded' },
    'model.runBtn':         { zh: '執行 AI 模型偵測',                                                   en: 'Run AI model detection' },
    'model.panelHint':      { zh: '載入 Organika/sdxl-detector (Swin),WebGPU 加速,結果並入綜合判定。',  en: 'Loads Organika/sdxl-detector (Swin), WebGPU-accelerated; result folds into the combined verdict.' },
    'model.stage.init':     { zh: '初始化…',                                                            en: 'Initializing…' },
    'model.stage.load':     { zh: '載入模型…',                                                          en: 'Loading model…' },
    'model.stage.download': { zh: '下載權重 ${pct}% · ${file}',                                         en: 'Downloading weights ${pct}% · ${file}' },
    'model.stage.fallback': { zh: 'WebGPU 不可用,改用 WASM…',                                          en: 'WebGPU unavailable, falling back to WASM…' },
    'model.stage.infer':    { zh: '推論中…',                                                            en: 'Running inference…' },
    'model.probLabel':      { zh: 'AI 機率',                                                            en: 'AI probability' },
    'model.classes':        { zh: '各類別分數',                                                          en: 'Class scores' },
    'model.device':         { zh: '運算後端:${dev}',                                                    en: 'Backend: ${dev}' },
    'model.resultDisclaimer':{ zh: '模型 ${id} · 後端 ${dev} · 偏向擴散模型(SD/SDXL),對其他生成器可能漏判,僅作一票。', en: 'Model ${id} · backend ${dev} · biased toward diffusion (SD/SDXL); may miss other generators — counts as one vote.' },
    'model.verdict.ai':     { zh: '判定為 AI 生成',                                                     en: 'Classified AI-generated' },
    'model.verdict.uncertain':{ zh: '不確定',                                                           en: 'Uncertain' },
    'model.verdict.real':   { zh: '判定為真實',                                                         en: 'Classified real' },
    'model.verdict.unknown':{ zh: '無法解析輸出',                                                       en: 'Could not parse output' },
    'model.retry':          { zh: '重試',                                                               en: 'Retry' },
    'model.err.unsupported':{ zh: '此瀏覽器不支援 WebAssembly,無法在本地執行模型。',                    en: 'This browser lacks WebAssembly support, so the model cannot run locally.' },
    'model.err.lib':        { zh: '無法載入 transformers.js(需要網路連線):${msg}',                    en: 'Failed to load transformers.js (needs network access): ${msg}' },
    'model.err.load':       { zh: '模型載入失敗:${msg}',                                               en: 'Model failed to load: ${msg}' },
    'model.err.run':        { zh: '模型執行失敗(首次需要網路下載權重):${msg}',                        en: 'Model run failed (first run needs network to download weights): ${msg}' },

    // ===== Forensics tab (ELA + noise) =====
    'forensics.tag':        { zh: '區域鑑識',                                                           en: 'Local forensics' },
    'forensics.disclaimer': { zh: 'ELA + 噪聲殘差,標出可能被局部修改/重繪的區域。對 JPEG 最有效;PNG/截圖結果僅供參考。', en: 'ELA + noise residual to localize possibly edited/inpainted regions. Most effective on JPEG; PNG/screenshots are indicative only.' },
    'forensics.runBtn':     { zh: '執行區域鑑識',                                                       en: 'Run local forensics' },
    'forensics.panelHint':  { zh: '誤差層級分析 (ELA) 與噪聲一致性檢查,定位竄改痕跡。',                  en: 'Error Level Analysis (ELA) and noise-consistency check to locate tampering.' },
    'forensics.running':    { zh: '正在做 ELA 重壓縮與噪聲分析…',                                        en: 'Running ELA recompression and noise analysis…' },
    'forensics.err':        { zh: '鑑識失敗:${msg}',                                                   en: 'Forensics failed: ${msg}' },
    'forensics.scoreLabel': { zh: '局部竄改可疑度',                                                      en: 'Local tampering suspicion' },
    'forensics.scoreDetail':{ zh: '可疑度 ${score} · ELA 熱點比 ${ratio} · 噪聲不均 ${cov}',             en: 'suspicion ${score} · ELA hotspot ratio ${ratio} · noise CoV ${cov}' },
    'forensics.res':        { zh: '分析分辨率 ${w}×${h} · ELA 品質 ${q}%',                              en: 'Analysis resolution ${w}×${h} · ELA quality ${q}%' },
    'forensics.verdict.high':   { zh: '存在明顯局部異常',                                                en: 'Clear localized anomaly' },
    'forensics.verdict.some':   { zh: '有輕微局部異常',                                                  en: 'Minor localized anomaly' },
    'forensics.verdict.low':    { zh: '未見明顯竄改痕跡',                                                en: 'No clear tampering trace' },
    'forensics.ela.title':  { zh: '誤差層級分析 (ELA)',                                                 en: 'Error Level Analysis (ELA)' },
    'forensics.ela.hint':   { zh: '重新壓縮後的差異 · 越亮代表該區誤差越大;一塊區域明顯比周圍亮 = 可能被貼上/重繪。', en: 'Difference after recompression · brighter = larger error; a patch much brighter than its surroundings may be pasted/inpainted.' },
    'forensics.noise.title':{ zh: '噪聲殘差圖',                                                          en: 'Noise residual' },
    'forensics.noise.hint': { zh: '高通濾波後的噪聲 · 真實照片噪聲均勻;若某區異常平滑(無顆粒)= 可能 AI 重繪。', en: 'High-pass noise · a real photo has even grain; a region that is abnormally smooth may be AI-inpainted.' },
};

let _lang = null;

function detectLang() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('lang');
    if (fromUrl === 'en' || fromUrl === 'zh') return fromUrl;
    const saved = localStorage.getItem('lang');
    if (saved === 'en' || saved === 'zh') return saved;
    return /^zh\b/i.test(navigator.language || '') ? 'zh' : 'en';
}

export function getLang() { return _lang ||= detectLang(); }

// 不再做 IP 地理偵測——瀏覽器 navigator.language 已能判斷,detectLang() 已處理。
// 保留 export 名稱避免 main.js 改動,呼叫等同 no-op。
export async function refineLangByIP() { /* no-op,改用 navigator.language */ }

export function t(key, vars) {
    const lang = getLang();
    const entry = STRINGS[key];
    if (!entry) return key;
    let s = entry[lang] ?? entry.zh ?? key;
    if (vars) for (const k in vars) s = s.replace('${' + k + '}', vars[k]);
    return s;
}

export function setLang(lang) {
    if (lang !== 'en' && lang !== 'zh') return;
    _lang = lang;
    localStorage.setItem('lang', lang);
    // sync URL (?lang=en for English; remove param for Chinese default)
    const url = new URL(window.location.href);
    if (lang === 'en') url.searchParams.set('lang', 'en');
    else url.searchParams.delete('lang');
    history.replaceState(null, '', url.toString());
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    applyI18n();
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

export function applyI18n() {
    const lang = getLang();
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.dataset.i18n;
        const txt = t(k);
        if (el.dataset.i18nHtml === '' || k.endsWith('.html')) el.innerHTML = txt;
        else el.textContent = txt;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
        // Format: "attrName:key,attrName:key"
        for (const pair of el.dataset.i18nAttr.split(',')) {
            const [attr, k] = pair.split(':');
            el.setAttribute(attr, t(k));
        }
    });
    // Sync title + meta description for SEO
    const title = t('seo.title');
    if (title && title !== 'seo.title') document.title = title;
    const setMeta = (sel, key) => {
        const el = document.querySelector(sel);
        if (!el) return;
        const v = t(key);
        if (v && v !== key) el.setAttribute('content', v);
    };
    setMeta('meta[name="description"]',  'seo.description');
    setMeta('meta[name="keywords"]',     'seo.keywords');
    setMeta('meta[property="og:title"]', 'seo.ogTitle');
    setMeta('meta[property="og:description"]', 'seo.ogDescription');
    setMeta('meta[name="twitter:title"]',       'seo.ogTitle');
    setMeta('meta[name="twitter:description"]', 'seo.twDescription');
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute('content', lang === 'zh' ? 'zh_CN' : 'en_US');
}

export { STRINGS };
