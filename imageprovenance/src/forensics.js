// Local tamper-localization forensics — Error Level Analysis (ELA) + noise residual.
//
// Unlike the frequency tab (global heuristics), these methods are SPATIAL: they
// highlight *where* an image was likely altered — which is exactly what catches
// AI retouching / inpainting / splicing, since those edits change only a region
// and leave a recompression / noise-floor seam behind.
//
// 100% on-canvas, no upload, no model. See renderForensicsPanel for the UI.

import { t } from './i18n.js';

const MAX_SIDE = 1024;   // downscale huge images for responsiveness

async function bitmapFromFile(file) {
    const blob = file instanceof Blob ? file : new Blob([file]);
    return await createImageBitmap(blob);
}

function fitCanvas(bitmap) {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0, w, h);
    return { canvas, ctx, w, h };
}

function canvasToJpegBitmap(canvas, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) { reject(new Error('toBlob failed')); return; }
                createImageBitmap(blob).then(resolve, reject);
            },
            'image/jpeg', quality,
        );
    });
}

// ---- Error Level Analysis -------------------------------------------------
// Re-save the image as JPEG at a known quality, then measure the per-pixel
// difference. Untouched areas have already "settled" at the JPEG quantization
// grid and barely change; freshly painted/edited areas change more, glowing
// brighter. A region that glows clearly above its surroundings is suspicious.
async function computeELA(srcCanvas, srcCtx, w, h, quality, amplify) {
    const recompressed = await canvasToJpegBitmap(srcCanvas, quality);
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    const tctx = tmp.getContext('2d', { willReadFrequently: true });
    tctx.drawImage(recompressed, 0, 0, w, h);
    recompressed.close?.();

    const a = srcCtx.getImageData(0, 0, w, h).data;
    const b = tctx.getImageData(0, 0, w, h).data;
    const out = tctx.createImageData(w, h);
    const od = out.data;

    // Per-pixel max-channel error → grayscale heat (hot colormap applied in viz).
    const errMap = new Float32Array(w * h);
    let sum = 0, max = 0;
    for (let i = 0, p = 0; i < a.length; i += 4, p++) {
        const dr = Math.abs(a[i] - b[i]);
        const dg = Math.abs(a[i + 1] - b[i + 1]);
        const db = Math.abs(a[i + 2] - b[i + 2]);
        const e = Math.max(dr, dg, db);
        errMap[p] = e;
        sum += e;
        if (e > max) max = e;
    }
    const mean = sum / (w * h);

    // Block-wise statistics to score *localized* anomalies. We tile into ~24px
    // blocks, take each block's mean error, then look at how the brightest
    // blocks stand out from the median — a seam/inpaint shows as a few hot
    // blocks against an otherwise uniform field.
    const block = 24;
    const bx = Math.ceil(w / block), by = Math.ceil(h / block);
    const blockMeans = new Float32Array(bx * by);
    for (let yb = 0; yb < by; yb++) {
        for (let xb = 0; xb < bx; xb++) {
            let bs = 0, bn = 0;
            const x0 = xb * block, y0 = yb * block;
            for (let y = y0; y < Math.min(y0 + block, h); y++) {
                for (let x = x0; x < Math.min(x0 + block, w); x++) {
                    bs += errMap[y * w + x]; bn++;
                }
            }
            blockMeans[yb * bx + xb] = bn ? bs / bn : 0;
        }
    }
    const sorted = Array.from(blockMeans).sort((p, q) => p - q);
    const median = sorted[Math.floor(sorted.length / 2)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    // Ratio of the hottest blocks to the typical block. >~3 means a region is
    // re-compressing very differently from the rest → possible local edit.
    const hotspotRatio = median > 0.5 ? p95 / median : (p95 > 4 ? 4 : 1);

    // Render: amplify error and apply a perceptual "hot" ramp (black→red→yellow→white).
    const gain = amplify / Math.max(mean, 1);
    for (let p = 0; p < errMap.length; p++) {
        const v = Math.min(1, errMap[p] * gain / 255 * 8);
        const [r, g, bb] = hot(v);
        const i = p * 4;
        od[i] = r; od[i + 1] = g; od[i + 2] = bb; od[i + 3] = 255;
    }
    return { imageData: out, mean, max, hotspotRatio, quality };
}

// ---- Noise residual -------------------------------------------------------
// High-pass the luminance (image minus a blurred copy). A real photo has a
// fairly uniform sensor-noise floor everywhere; AI generation and heavy
// retouching flatten the noise locally, so an inpainted patch shows up as a
// suspiciously *smooth* hole in an otherwise grainy residual map.
function computeNoise(srcCtx, w, h) {
    const d = srcCtx.getImageData(0, 0, w, h).data;
    const gray = new Float32Array(w * h);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
        gray[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    }
    // Separable 5-tap box blur as the low-pass reference.
    const blur = boxBlur(gray, w, h, 2);
    const res = new Float32Array(w * h);
    let sumAbs = 0;
    for (let p = 0; p < res.length; p++) {
        res[p] = gray[p] - blur[p];
        sumAbs += Math.abs(res[p]);
    }
    const meanAbs = sumAbs / res.length || 1;

    // Block-wise local noise energy → coefficient of variation across blocks.
    // Real photos: noise energy roughly constant (low CoV). Spliced/inpainted:
    // some blocks far quieter or louder (high CoV).
    const block = 32;
    const bx = Math.ceil(w / block), by = Math.ceil(h / block);
    const energies = [];
    for (let yb = 0; yb < by; yb++) {
        for (let xb = 0; xb < bx; xb++) {
            let s = 0, n = 0;
            const x0 = xb * block, y0 = yb * block;
            for (let y = y0; y < Math.min(y0 + block, h); y++) {
                for (let x = x0; x < Math.min(x0 + block, w); x++) {
                    const v = res[y * w + x]; s += v * v; n++;
                }
            }
            if (n) energies.push(Math.sqrt(s / n));
        }
    }
    const eMean = energies.reduce((s, v) => s + v, 0) / (energies.length || 1);
    const eVar = energies.reduce((s, v) => s + (v - eMean) ** 2, 0) / (energies.length || 1);
    const cov = eMean > 0.01 ? Math.sqrt(eVar) / eMean : 0;

    // Render residual centered at mid-gray, amplified.
    const out = srcCtx.createImageData(w, h);
    const od = out.data;
    const gain = 6;
    for (let p = 0; p < res.length; p++) {
        const v = Math.max(0, Math.min(255, 128 + res[p] * gain));
        const i = p * 4;
        od[i] = od[i + 1] = od[i + 2] = v; od[i + 3] = 255;
    }
    return { imageData: out, meanAbs, cov };
}

function boxBlur(src, w, h, r) {
    const tmp = new Float32Array(w * h);
    const out = new Float32Array(w * h);
    const win = 2 * r + 1;
    // horizontal
    for (let y = 0; y < h; y++) {
        let acc = 0;
        for (let x = -r; x <= r; x++) acc += src[y * w + clamp(x, 0, w - 1)];
        for (let x = 0; x < w; x++) {
            tmp[y * w + x] = acc / win;
            const add = src[y * w + clamp(x + r + 1, 0, w - 1)];
            const sub = src[y * w + clamp(x - r, 0, w - 1)];
            acc += add - sub;
        }
    }
    // vertical
    for (let x = 0; x < w; x++) {
        let acc = 0;
        for (let y = -r; y <= r; y++) acc += tmp[clamp(y, 0, h - 1) * w + x];
        for (let y = 0; y < h; y++) {
            out[y * w + x] = acc / win;
            const add = tmp[clamp(y + r + 1, 0, h - 1) * w + x];
            const sub = tmp[clamp(y - r, 0, h - 1) * w + x];
            acc += add - sub;
        }
    }
    return out;
}

const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

function hot(t) {
    // Black → red → orange → yellow → white
    t = clamp(t, 0, 1);
    const stops = [
        [0, 0, 0], [120, 0, 0], [230, 60, 0], [255, 180, 0], [255, 255, 200],
    ];
    const s = t * (stops.length - 1);
    const i = Math.floor(s), f = s - i;
    if (i >= stops.length - 1) return stops[stops.length - 1];
    const [r0, g0, b0] = stops[i], [r1, g1, b1] = stops[i + 1];
    return [r0 + (r1 - r0) * f, g0 + (g1 - g0) * f, b0 + (b1 - b0) * f];
}

// Public: run both analyses. Returns raw maps + stats + a 0..100 suspicion
// score for fusion. Heavy work; call off the click handler with a spinner.
export async function runForensics(file, opts = {}) {
    const quality = opts.quality ?? 0.9;
    const amplify = opts.amplify ?? 20;
    const bitmap = await bitmapFromFile(file);
    try {
        const { canvas, ctx, w, h } = fitCanvas(bitmap);
        const ela = await computeELA(canvas, ctx, w, h, quality, amplify);
        const noise = computeNoise(ctx, w, h);

        // Suspicion: blend ELA hotspot localization with noise inhomogeneity.
        // Both are weak on their own; only sharp localization counts.
        const elaSig = clamp((ela.hotspotRatio - 2) / 4, 0, 1);     // ratio 2→6 maps 0→1
        const noiseSig = clamp((noise.cov - 0.45) / 0.7, 0, 1);     // cov 0.45→1.15 maps 0→1
        const score = Math.round((elaSig * 0.6 + noiseSig * 0.4) * 100);

        return {
            w, h, quality,
            ela: { imageData: ela.imageData, mean: ela.mean, max: ela.max, hotspotRatio: ela.hotspotRatio },
            noise: { imageData: noise.imageData, meanAbs: noise.meanAbs, cov: noise.cov },
            score,
            elaSig, noiseSig,
        };
    } finally {
        bitmap.close?.();
    }
}

function verdictOf(score) {
    if (score >= 60) return { key: 'forensics.verdict.high', conf: 'medium' };
    if (score >= 35) return { key: 'forensics.verdict.some', conf: 'weak' };
    return { key: 'forensics.verdict.low', conf: 'info' };
}

export function renderForensicsPanel(container, result) {
    const v = verdictOf(result.score);
    container.innerHTML = `
        <div class="freq-disclaimer">
            <span class="freq-disclaimer-tag">${esc(t('forensics.tag'))}</span>
            <span>${esc(t('forensics.disclaimer'))}</span>
        </div>
        <div class="freq-head">
            <div class="freq-verdict conf-${v.conf}">
                <span class="freq-verdict-label">${esc(t('forensics.scoreLabel'))}</span>
                <span class="freq-verdict-value">${esc(t(v.key))}</span>
                <span class="freq-score">${esc(t('forensics.scoreDetail', {
                    score: result.score,
                    ratio: result.ela.hotspotRatio.toFixed(2),
                    cov: result.noise.cov.toFixed(2),
                }))}</span>
            </div>
            <div class="freq-timing">${esc(t('forensics.res', { w: result.w, h: result.h, q: Math.round(result.quality * 100) }))}</div>
        </div>
        <div class="freq-viz forensics-viz">
            <div class="freq-viz-box">
                <div class="freq-viz-title">${esc(t('forensics.ela.title'))}</div>
                <canvas id="elaCanvas"></canvas>
                <div class="freq-viz-hint">${esc(t('forensics.ela.hint'))}</div>
            </div>
            <div class="freq-viz-box">
                <div class="freq-viz-title">${esc(t('forensics.noise.title'))}</div>
                <canvas id="noiseCanvas"></canvas>
                <div class="freq-viz-hint">${esc(t('forensics.noise.hint'))}</div>
            </div>
        </div>
    `;
    paint(container.querySelector('#elaCanvas'), result.ela.imageData);
    paint(container.querySelector('#noiseCanvas'), result.noise.imageData);
}

function paint(canvas, imageData) {
    if (!canvas) return;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d').putImageData(imageData, 0, 0);
}

function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
}
