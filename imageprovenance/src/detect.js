// Provenance detection: JUMBF + structured metadata + byte-level keyword search.
// Returns a list of detection cards plus a merged metadata snapshot.

import { bytesToString } from './utils.js';
import { parseMetadata, sniffJumbf, getGenerationHints } from './metadata.js';
import { detectWatermarkFFT } from './watermark-detect.js';
import { MARKERS } from './markers.js';

function findWithContext(str, keywords) {
    const results = [];
    const seen = new Set();
    for (const kw of keywords) {
        const lk = kw.toLowerCase();
        if (seen.has(lk)) continue;
        const idx = str.indexOf(kw);
        if (idx !== -1) {
            seen.add(lk);
            const start = Math.max(0, idx - 30);
            const end = Math.min(str.length, idx + kw.length + 30);
            const context = str.substring(start, end).replace(/[\x00-\x08\x0e-\x1f]/g, '.');
            results.push({ keyword: kw, context });
        }
    }
    return results;
}

function detailOf(found) {
    return found.map(f => `[${f.keyword}] …${f.context}…`).join('\n');
}

function card(title, hit, badgeText, desc, detail, confidence) {
    return {
        title, hit,
        badgeText,
        badgeClass: hit ? 'badge-hit' : 'badge-clean',
        desc,
        detail: detail || null,
        confidence: confidence || null,
    };
}

export async function runAllDetections(uint8) {
    const str = bytesToString(uint8);
    const [meta, jumbf] = await Promise.all([parseMetadata(uint8), Promise.resolve(sniffJumbf(uint8))]);
    const detections = [];

    // --- 1. C2PA (structured: JUMBF box + DigitalSourceType) ---
    {
        const m = MARKERS.find(x => x.id === 'c2pa');
        const found = findWithContext(str, m.keywords);
        const hit = jumbf.present || found.length > 0;
        const aiType = jumbf.digitalSourceType && ['trainedAlgorithmicMedia',
            'compositeWithTrainedAlgorithmicMedia', 'algorithmicMedia', 'dataDrivenMedia']
            .includes(jumbf.digitalSourceType);
        let badgeText, desc, confidence;
        if (aiType) {
            badgeText = `C2PA 聲明為 AI 生成 (${jumbf.digitalSourceType})`;
            desc = '圖片嵌入了 C2PA 來源憑證,並明確聲明為算法生成內容。';
            confidence = 'strong';
        } else if (jumbf.present) {
            badgeText = `C2PA 存在 (${jumbf.digitalSourceType || '來源未聲明'})`;
            desc = '圖片嵌入了 C2PA 來源憑證。' + (jumbf.labels.length ? ` Labels: ${jumbf.labels.join(', ')}` : '');
            confidence = 'strong';
        } else if (found.length > 0) {
            badgeText = '字節中含 C2PA 字符串';
            desc = '文件字節中出現 C2PA 相關字符串,但未發現完整 JUMBF 結構。';
            confidence = 'weak';
        } else {
            badgeText = '未發現';
            desc = m.missDesc;
        }
        const details = [];
        if (jumbf.present) details.push(`JUMBF boxes: ${jumbf.indices.length}  |  labels: ${jumbf.labels.join(', ') || '-'}  |  DigitalSourceType: ${jumbf.digitalSourceType || '-'}`);
        if (found.length) details.push(detailOf(found));
        detections.push(card(m.title, hit, badgeText, desc, details.join('\n\n') || null, confidence));
    }

    // --- 2. Structured metadata (EXIF/XMP/IPTC/ICC via exifr) ---
    {
        const hints = getGenerationHints(meta);
        const aiStrings = /Gemini|Imagen|SynthID|Midjourney|Stable\s*Diffusion|ComfyUI|DALL|OpenAI|Firefly|Adobe Firefly|trainedAlgorithmicMedia/i;
        const hit = hints.some(h => aiStrings.test(String(h.value)));
        const hasAny = hints.length > 0;
        const metaLine = hints.map(h => `${h.label}: ${h.value}`).join('\n');
        detections.push(card(
            '結構化元數據 (EXIF / XMP / IPTC)',
            hit,
            hit ? '元數據命中 AI 生成工具' : hasAny ? '存在元數據,但未命中 AI' : '無可讀元數據',
            hit ? '圖片元數據字段直接記錄了 AI 生成工具或標記。'
                : hasAny ? '提取到的元數據字段未匹配 AI 生成標記。'
                : '圖片幾乎不含元數據(可能被剝離)。',
            metaLine || null,
            hit ? 'strong' : null,
        ));
    }

    // --- 3-7. Keyword-based per-vendor markers ---
    for (const m of MARKERS) {
        if (m.id === 'c2pa') continue; // handled above
        const found = findWithContext(str, m.keywords);
        const threshold = m.hitThreshold || 1;
        const hit = found.length >= threshold;
        const isEdit = m.category === 'edit';
        detections.push({
            ...card(
                m.title, hit,
                hit ? (isEdit ? '發現修圖痕跡' : '發現標記') : '未發現',
                hit ? m.hitDesc(found) : m.missDesc,
                found.length ? detailOf(found) : null,
                hit ? (isEdit ? 'info' : 'medium') : null,
            ),
            category: m.category || 'ai',
        });
    }

    // --- 8. Byte-level invisible watermark heuristic ---
    {
        const wm = detectWatermarkFFT(uint8);
        detections.push(card(
            '像素級隱形水印(字節級啟發)',
            wm.suspicious,
            wm.suspicious ? `疑似水印 (異常度 ${wm.score}%)` : '未檢測到異常',
            wm.suspicious
                ? '字節分佈偏離自然圖像模型,可能存在隱形水印。完整頻域分析將在"頻域"tab 提供。'
                : '字節分佈符合自然圖像特徵,未發現明顯水印痕跡。',
            `異常度: ${wm.score}%\n高頻比: ${wm.highFreqRatio.toFixed(4)}\n中頻峰值: ${wm.midFreqPeaks}\nLSB偏移: ${wm.lsbBias.toFixed(4)}`,
            wm.suspicious ? 'weak' : null,
        ));
    }

    return { detections, meta, jumbf };
}
