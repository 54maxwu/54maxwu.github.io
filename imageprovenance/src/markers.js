// Provenance marker signatures. Split from detect.js so the rules are
// reviewable without wading through scoring logic.

export const MARKERS = [
    {
        id: 'c2pa',
        title: 'C2PA / Content Credentials',
        keywords: ['C2PA', 'JUMBF', 'caBX', 'c2pa.manifest', 'contentcredentials',
                   'urn:uuid:', 'jumbf', 'activeManifest', 'claim.v2', 'c2pa_rs', 'c2pa.hash'],
        hitDesc: found => `文件中出現 ${found.map(f=>f.keyword).join('、')} 等結構/字符串。`,
        missDesc: '沒有在字節中找到 C2PA/JUMBF 線索。',
    },
    {
        id: 'openai',
        title: 'OpenAI / DALL·E / GPT',
        keywords: ['OpenAI', 'openai', 'DALL-E', 'dall-e', 'DALLE', 'dalle',
                   'gpt-image', 'GPT-image', 'chatgpt', 'ChatGPT', 'openai.com'],
        hitDesc: found => `發現 ${found.map(f=>f.keyword).join('、')} 相關標記。`,
        missDesc: '沒有發現 OpenAI / DALL-E / ChatGPT 相關標記。',
    },
    {
        id: 'google',
        title: 'Google / SynthID / Gemini',
        keywords: ['Google', 'SynthID', 'Gemini', 'Imagen', 'Nano Banana',
                   'nanobanana', 'DeepMind', 'google.com', 'gemini'],
        hitDesc: found => `發現 ${found.map(f=>f.keyword).join('、')} 相關標記。`,
        missDesc: '沒有發現 Google / SynthID / Gemini 相關標記。',
    },
    {
        id: 'midjourney',
        title: 'Midjourney',
        keywords: ['Midjourney', 'midjourney', 'MIDJOURNEY', 'mj-api', 'midj'],
        hitDesc: () => '發現 Midjourney 相關標記。',
        missDesc: '沒有發現 Midjourney 相關標記。',
    },
    {
        id: 'sd',
        title: 'Stable Diffusion / ComfyUI / Flux',
        keywords: ['StableDiffusion', 'stable-diffusion', 'ComfyUI', 'comfyui',
                   'Flux', 'FLUX', 'Automatic1111', 'A1111', 'InvokeAI', 'Fooocus',
                   'stable_diffusion', 'diffusion_model'],
        hitDesc: found => `發現 ${found.map(f=>f.keyword).join('、')} 相關標記。`,
        missDesc: '沒有發現 Stable Diffusion / ComfyUI / Flux 相關標記。',
    },
    {
        id: 'adobe',
        title: 'Adobe Firefly (AI)',
        // 只匹配 Firefly 特定標記。Adobe / Photoshop 字樣在正常修圖、甚至
        // ICC 色彩配置文件(版權字段 "Adobe Systems Incorporated")中都會出現,
        // 不能當 AI 證據 —— 否則連微信截圖都會被誤判。
        keywords: ['Firefly', 'adobe_firefly', 'AdobeFirefly', 'adobefirefly'],
        hitDesc: found => `發現 ${found.map(f=>f.keyword).join('、')} (Adobe 生成式 AI)。`,
        missDesc: '沒有發現 Adobe Firefly 相關標記。',
    },
    {
        id: 'photoshop',
        title: 'Photoshop / 修圖軟件 (非 AI)',
        category: 'edit',  // 'edit' 類別不計入 AI 命中
        // Photoshop 自身寫入的元數據。注意不要用純 "Adobe"(ICC 裡就有)。
        keywords: ['Adobe Photoshop', 'photoshop:', 'Photoshop CC', 'Photoshop CS',
                   'Adobe ImageReady', 'Lightroom Classic', 'Adobe Lightroom'],
        hitThreshold: 1,
        hitDesc: found => `檢測到 ${found.map(f=>f.keyword).join('、')} 修圖痕跡。`,
        missDesc: '沒有發現 Photoshop / Lightroom 處理痕跡。',
    },
    {
        id: 'pngtext',
        title: 'PNG 文本塊 / 生成參數',
        keywords: ['tEXt', 'iTXt', 'zTXt', 'parameters', 'prompt', 'negative_prompt',
                   'Steps:', 'Sampler:', 'CFG scale', 'Seed:', 'workflow'],
        hitThreshold: 2,
        hitDesc: found => `發現 ${found.map(f=>f.keyword).join('、')} 等生成參數標記。`,
        missDesc: '沒有發現 PNG 文本塊中的生成參數。',
    },
];
