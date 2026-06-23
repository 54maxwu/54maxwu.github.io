// Local image-forensics suite — tamper localization with NO model, NO upload.
//
// The strongest *classical* (non-learned) forensics that can run 100% in-canvas.
// Each method attacks manipulation from a different physical angle, and they
// cross-check each other — a real edit usually trips more than one:
//
//   1. ELA (Error Level Analysis)   — recompression error; pasted/painted areas
//                                      settle differently in the JPEG grid.
//   2. Noise inconsistency          — sensor-noise floor is uniform in a genuine
//                                      photo; a splice/inpaint leaves a noise seam.
//   3. JPEG ghost (JPEG only)       — a region previously saved at a different
//                                      quality reveals a "ghost" minimum.
//   4. Copy-move / clone detection  — duplicated blocks (cloned to hide or repeat
//                                      content) sharing one translation vector.
//
// Learned SOTA (TruFor, CAT-Net, MantraNet) is stronger but needs a server/model;
// this is the best you can do offline. Results are file-type aware: PNG/screenshots
// have no JPEG history, so ELA/ghost are down-weighted or marked N/A.

import { t } from './i18n.js';

const MAX_SIDE = 768;
const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

let _scratch = null;
function scratchCtx(w, h) {
    if (!_scratch) _scratch = document.createElement('canvas');
    _scratch.width = w; _scratch.height = h;
    return _scratch.getContext('2d', { willReadFrequently: true });
}
function makeImageData(w, h) { return scratchCtx(w, h).createImageData(w, h); }

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
        canvas.toBlob((blob) => {
            if (!blob) { reject(new Error('toBlob failed')); return; }
            createImageBitmap(blob).then(resolve, reject);
        }, 'image/jpeg', quality);
    });
}

// ---------- colour ramps ----------
function hot(t) {
    t = clamp(t, 0, 1);
    const s = [[0,0,0],[120,0,0],[230,60,0],[255,180,0],[255,255,210]];
    const f = t * (s.length - 1), i = Math.floor(f), k = f - i;
    if (i >= s.length - 1) return s[s.length - 1];
    return [s[i][0]+(s[i+1][0]-s[i][0])*k, s[i][1]+(s[i+1][1]-s[i][1])*k, s[i][2]+(s[i+1][2]-s[i][2])*k];
}
function turbo(t) {
    // green(normal) → yellow → red(anomalous)
    t = clamp(t, 0, 1);
    const s = [[16,120,60],[120,180,40],[235,210,40],[235,120,30],[200,30,30]];
    const f = t * (s.length - 1), i = Math.floor(f), k = f - i;
    if (i >= s.length - 1) return s[s.length - 1];
    return [s[i][0]+(s[i+1][0]-s[i][0])*k, s[i][1]+(s[i+1][1]-s[i][1])*k, s[i][2]+(s[i+1][2]-s[i][2])*k];
}

// ---------- shared primitives ----------
function toGray(rgba, w, h) {
    const g = new Float32Array(w * h);
    for (let i = 0, p = 0; i < rgba.length; i += 4, p++)
        g[p] = 0.299 * rgba[i] + 0.587 * rgba[i+1] + 0.114 * rgba[i+2];
    return g;
}
function boxBlur(src, w, h, r) {
    const tmp = new Float32Array(w * h), out = new Float32Array(w * h), win = 2*r+1;
    const cl = (v, hi) => v < 0 ? 0 : v > hi ? hi : v;
    for (let y = 0; y < h; y++) {
        let acc = 0;
        for (let x = -r; x <= r; x++) acc += src[y*w + cl(x, w-1)];
        for (let x = 0; x < w; x++) { tmp[y*w+x] = acc/win; acc += src[y*w + cl(x+r+1, w-1)] - src[y*w + cl(x-r, w-1)]; }
    }
    for (let x = 0; x < w; x++) {
        let acc = 0;
        for (let y = -r; y <= r; y++) acc += tmp[cl(y, h-1)*w + x];
        for (let y = 0; y < h; y++) { out[y*w+x] = acc/win; acc += tmp[cl(y+r+1, h-1)*w + x] - tmp[cl(y-r, h-1)*w + x]; }
    }
    return out;
}
const percentile = (arr, p) => {
    const s = Float32Array.from(arr).sort();
    return s[clamp(Math.floor(s.length * p), 0, s.length - 1)] || 0;
};

// ========================= 1. ELA =========================
async function methodELA(canvas, ctx, w, h, quality) {
    const recomp = await canvasToJpegBitmap(canvas, quality);
    const tctx = scratchCtx(w, h);
    tctx.drawImage(recomp, 0, 0, w, h);
    recomp.close?.();
    const a = ctx.getImageData(0, 0, w, h).data;
    const b = tctx.getImageData(0, 0, w, h).data;
    const err = new Float32Array(w * h);
    for (let i = 0, p = 0; i < a.length; i += 4, p++)
        err[p] = Math.max(Math.abs(a[i]-b[i]), Math.abs(a[i+1]-b[i+1]), Math.abs(a[i+2]-b[i+2]));

    // Localized score: tile into blocks, compare brightest blocks to the median.
    const blk = 16, bx = Math.ceil(w/blk), by = Math.ceil(h/blk);
    const bmean = blockReduce(err, w, h, blk, (s, n) => s / n);
    const med = percentile(bmean, 0.5), p95 = percentile(bmean, 0.95);
    const hotspotRatio = med > 0.5 ? p95 / med : (p95 > 4 ? 4 : 1);

    // Display: normalize to the 99th percentile (not the mean) so textured photos
    // don't blow out to solid orange; gamma lifts faint regions.
    const norm = Math.max(percentile(err, 0.99), 6);
    const img = makeImageData(w, h), d = img.data;
    for (let p = 0; p < err.length; p++) {
        const v = Math.pow(clamp(err[p] / norm, 0, 1), 0.7);
        const [r, g, bb] = hot(v); const i = p*4;
        d[i]=r; d[i+1]=g; d[i+2]=bb; d[i+3]=255;
    }
    const sig = clamp((hotspotRatio - 2) / 4, 0, 1);
    return { id: 'ela', imageData: img, score: Math.round(sig*100), sig,
             stats: { hotspotRatio, quality }, bx, by };
}

// =================== 2. Noise inconsistency ===================
function methodNoise(ctx, w, h) {
    const rgba = ctx.getImageData(0, 0, w, h).data;
    const gray = toGray(rgba, w, h);
    const res = new Float32Array(w * h);
    const lp = boxBlur(gray, w, h, 2);
    for (let p = 0; p < res.length; p++) res[p] = gray[p] - lp[p];

    const blk = 16, bx = Math.ceil(w/blk), by = Math.ceil(h/blk);
    const energy = new Float32Array(bx * by);   // local noise std per block
    for (let yb = 0; yb < by; yb++) for (let xb = 0; xb < bx; xb++) {
        let s = 0, n = 0;
        for (let y = yb*blk; y < Math.min(yb*blk+blk, h); y++)
            for (let x = xb*blk; x < Math.min(xb*blk+blk, w); x++) { const v = res[y*w+x]; s += v*v; n++; }
        energy[yb*bx+xb] = n ? Math.sqrt(s/n) : 0;
    }
    const med = percentile(energy, 0.5) || 1;
    // anomaly per block = relative deviation from the median noise floor
    const anom = new Float32Array(bx * by);
    let anomCount = 0;
    for (let i = 0; i < energy.length; i++) {
        anom[i] = Math.abs(energy[i] - med) / med;
        if (anom[i] > 0.6) anomCount++;
    }
    // contiguity: anomalous blocks that touch other anomalous blocks are far more
    // suspicious than isolated speckle (which is just texture).
    let contig = 0;
    for (let yb = 0; yb < by; yb++) for (let xb = 0; xb < bx; xb++) {
        if (anom[yb*bx+xb] <= 0.6) continue;
        const nb = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => {
            const nx = xb+dx, ny = yb+dy;
            return nx>=0&&nx<bx&&ny>=0&&ny<by && anom[ny*bx+nx] > 0.6;
        });
        if (nb) contig++;
    }
    const cov = stdOf(energy) / med;
    const sig = clamp(0.5*clamp((cov-0.35)/0.6,0,1) + 0.5*clamp(contig/(bx*by*0.06),0,1), 0, 1);

    // Render block anomaly heatmap, scaled up to image size.
    const img = makeImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const bi = Math.floor(y/blk)*bx + Math.floor(x/blk);
        const [r, g, bb] = turbo(clamp(anom[bi]/1.4, 0, 1));
        const i = (y*w+x)*4; d[i]=r; d[i+1]=g; d[i+2]=bb; d[i+3]=255;
    }
    return { id: 'noise', imageData: img, score: Math.round(sig*100), sig,
             stats: { cov, contig, anomCount } };
}

// ===================== 3. JPEG ghost =====================
async function methodGhost(canvas, w, h, onProgress) {
    const qualities = [55, 62, 70, 76, 82, 88, 94];
    const blk = 8, bx = Math.ceil(w/blk), by = Math.ceil(h/blk);
    const orig = canvas.getContext('2d').getImageData(0, 0, w, h).data;
    const perQ = [];   // block-mean error map per quality
    for (let qi = 0; qi < qualities.length; qi++) {
        const bmp = await canvasToJpegBitmap(canvas, qualities[qi] / 100);
        const tctx = scratchCtx(w, h); tctx.drawImage(bmp, 0, 0, w, h); bmp.close?.();
        const rc = tctx.getImageData(0, 0, w, h).data;
        const diff = new Float32Array(w * h);
        for (let i = 0, p = 0; i < orig.length; i += 4, p++)
            diff[p] = Math.abs(orig[i]-rc[i]) + Math.abs(orig[i+1]-rc[i+1]) + Math.abs(orig[i+2]-rc[i+2]);
        perQ.push(blockReduce(diff, w, h, blk, (s, n) => s / n));
        onProgress?.(0.3 + 0.5 * (qi+1)/qualities.length);
    }
    // For each block pick the quality minimizing recompression error.
    const argmin = new Int8Array(bx * by);
    for (let i = 0; i < bx*by; i++) {
        let best = Infinity, bq = 0;
        for (let qi = 0; qi < qualities.length; qi++) if (perQ[qi][i] < best) { best = perQ[qi][i]; bq = qi; }
        argmin[i] = bq;
    }
    // The dominant argmin-quality is the image's true last-save quality.
    const hist = new Array(qualities.length).fill(0);
    for (const v of argmin) hist[v]++;
    const mode = hist.indexOf(Math.max(...hist));
    // Blocks whose ghost minimum sits at a *different* quality and cluster together
    // signal a region with a separate compression history → splice.
    let devContig = 0, devCount = 0;
    for (let yb = 0; yb < by; yb++) for (let xb = 0; xb < bx; xb++) {
        const i = yb*bx+xb;
        if (Math.abs(argmin[i] - mode) < 2) continue;
        devCount++;
        const nb = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => {
            const nx=xb+dx, ny=yb+dy;
            return nx>=0&&nx<bx&&ny>=0&&ny<by && Math.abs(argmin[ny*bx+nx]-mode) >= 2;
        });
        if (nb) devContig++;
    }
    const sig = clamp(devContig / (bx*by*0.04), 0, 1);
    // Render argmin-quality map (viridis-ish via hot on normalized q index).
    const img = makeImageData(w, h), d = img.data;
    const range = qualities.length - 1 || 1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const bi = Math.floor(y/blk)*bx + Math.floor(x/blk);
        const dev = Math.abs(argmin[bi]-mode) >= 2;
        const [r,g,bb] = dev ? [220,40,40] : grayRamp(argmin[bi]/range);
        const i = (y*w+x)*4; d[i]=r; d[i+1]=g; d[i+2]=bb; d[i+3]=255;
    }
    return { id: 'ghost', imageData: img, score: Math.round(sig*100), sig,
             stats: { modeQuality: qualities[mode], devCount, devContig } };
}
function grayRamp(t){ const v = Math.round(40 + 180*clamp(t,0,1)); return [v,v,v]; }

// ================== 4. Copy-move / clone ==================
function methodClone(ctx, w, h) {
    const rgba = ctx.getImageData(0, 0, w, h).data;
    const gray = toGray(rgba, w, h);
    const B = 16, stride = 8;
    const feats = [];   // { f:Int, x, y }
    for (let y = 0; y + B <= h; y += stride) {
        for (let x = 0; x + B <= w; x += stride) {
            // 4×4 average-pool feature + variance gate (skip flat blocks → sky/wall)
            const f = new Float32Array(16); let mean = 0, m2 = 0, cnt = 0;
            for (let cy = 0; cy < 4; cy++) for (let cx = 0; cx < 4; cx++) {
                let s = 0;
                for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 4; xx++) {
                    const v = gray[(y+cy*4+yy)*w + (x+cx*4+xx)]; s += v;
                }
                const avg = s/16; f[cy*4+cx] = avg;
                cnt++; const delta = avg-mean; mean += delta/cnt; m2 += delta*(avg-mean);
            }
            const variance = m2/cnt;
            if (variance < 12) continue;             // too uniform to match reliably
            feats.push({ f, x, y });
        }
    }
    // Lexicographic sort on quantized features so near-duplicates become neighbours.
    const Q = 4;
    feats.forEach(b => { b.key = Array.from(b.f, v => Math.round(v/Q)); });
    feats.sort((a, b) => { for (let i = 0; i < 16; i++) if (a.key[i] !== b.key[i]) return a.key[i]-b.key[i]; return 0; });

    const minDist = 24, eps2 = 18*18, WIN = 6;
    const shiftMap = new Map();   // "dx,dy" -> [pairs]
    for (let i = 0; i < feats.length; i++) {
        for (let j = i+1; j <= Math.min(i+WIN, feats.length-1); j++) {
            const A = feats[i], C = feats[j];
            const dx = C.x-A.x, dy = C.y-A.y;
            if (dx*dx+dy*dy < minDist*minDist) continue;
            let dist2 = 0; for (let k = 0; k < 16; k++) { const dd = A.f[k]-C.f[k]; dist2 += dd*dd; if (dist2 > eps2) break; }
            if (dist2 > eps2) continue;
            const key = `${dx},${dy}`;
            (shiftMap.get(key) || shiftMap.set(key, []).get(key)).push([A.x, A.y, C.x, C.y]);
        }
    }
    // Keep only translation vectors with strong support (a real clone region is
    // many adjacent blocks sharing ONE offset; random texture matches don't).
    const MIN_SUPPORT = 12;
    let matches = [];
    for (const [, pairs] of shiftMap) if (pairs.length >= MIN_SUPPORT) matches = matches.concat(pairs);
    const sig = clamp(matches.length / 40, 0, 1);

    // Dim original as the backdrop; overlay drawn at render time.
    const img = makeImageData(w, h), d = img.data;
    for (let i = 0; i < rgba.length; i += 4) {
        const g = (rgba[i]*0.299 + rgba[i+1]*0.587 + rgba[i+2]*0.114) * 0.55 + 30;
        d[i]=d[i+1]=d[i+2]=g; d[i+3]=255;
    }
    return { id: 'clone', imageData: img, score: Math.round(sig*100), sig,
             stats: { matchPairs: matches.length, blocks: feats.length },
             overlay: matches.slice(0, 500), blockSize: B };
}

// ---------- helpers ----------
function blockReduce(map, w, h, blk, fn) {
    const bx = Math.ceil(w/blk), by = Math.ceil(h/blk), out = new Float32Array(bx*by);
    for (let yb = 0; yb < by; yb++) for (let xb = 0; xb < bx; xb++) {
        let s = 0, n = 0;
        for (let y = yb*blk; y < Math.min(yb*blk+blk, h); y++)
            for (let x = xb*blk; x < Math.min(xb*blk+blk, w); x++) { s += map[y*w+x]; n++; }
        out[yb*bx+xb] = fn(s, n);
    }
    return out;
}
function stdOf(arr) {
    let m = 0; for (const v of arr) m += v; m /= arr.length;
    let s = 0; for (const v of arr) s += (v-m)*(v-m);
    return Math.sqrt(s/arr.length);
}

// ===================== orchestration =====================
export async function runForensics(file, opts = {}, onProgress = () => {}) {
    const quality = opts.quality ?? 0.9;
    const isJpeg = /jpe?g/i.test(file.type || '') || /jpe?g/i.test(file.name || '');
    const bitmap = await bitmapFromFile(file);
    try {
        const { canvas, ctx, w, h } = fitCanvas(bitmap);
        onProgress(0.05);
        const methods = [];

        const ela = await methodELA(canvas, ctx, w, h, quality);
        ela.applicable = true; ela.confidence = isJpeg ? 'normal' : 'low';
        methods.push(ela); onProgress(0.25);

        const noise = methodNoise(ctx, w, h);
        noise.applicable = true; noise.confidence = 'normal';
        methods.push(noise); onProgress(0.3);

        if (isJpeg) {
            const ghost = await methodGhost(canvas, w, h, onProgress);
            ghost.applicable = true; ghost.confidence = 'normal';
            methods.push(ghost);
        } else {
            methods.push({ id: 'ghost', applicable: false, score: 0, sig: 0, stats: {} });
        }
        onProgress(0.85);

        const clone = methodClone(ctx, w, h);
        clone.applicable = true; clone.confidence = 'normal';
        methods.push(clone);
        onProgress(0.97);

        // File-type-aware aggregate. ELA/ghost trust depends on JPEG history.
        const weights = isJpeg
            ? { ela: 0.20, noise: 0.28, ghost: 0.30, clone: 0.22 }
            : { ela: 0.10, noise: 0.55, ghost: 0.00, clone: 0.35 };
        let wsum = 0, acc = 0;
        for (const m of methods) {
            if (!m.applicable) continue;
            const wt = weights[m.id] || 0; wsum += wt; acc += wt * (m.sig || 0);
        }
        let score = Math.round((wsum ? acc/wsum : 0) * 100);
        // A confirmed clone region is strong standalone evidence — floor the score.
        if (clone.sig > 0.25) score = Math.max(score, 55 + Math.round(clone.sig*35));
        score = clamp(score, 0, 100);

        onProgress(1);
        return { w, h, isJpeg, quality, methods, score };
    } finally {
        bitmap.close?.();
    }
}

function verdictOf(score) {
    if (score >= 60) return { key: 'forensics.verdict.high', conf: 'medium' };
    if (score >= 35) return { key: 'forensics.verdict.some', conf: 'weak' };
    return { key: 'forensics.verdict.low', conf: 'info' };
}

// ===================== rendering =====================
const METHOD_META = {
    ela:   { title: 'forensics.ela.title',   hint: 'forensics.ela.hint' },
    noise: { title: 'forensics.noise.title', hint: 'forensics.noise.hint' },
    ghost: { title: 'forensics.ghost.title', hint: 'forensics.ghost.hint' },
    clone: { title: 'forensics.clone.title', hint: 'forensics.clone.hint' },
};

export function renderForensicsPanel(container, result) {
    const v = verdictOf(result.score);
    const cards = result.methods.map(m => {
        const meta = METHOD_META[m.id];
        if (!m.applicable) {
            return `<div class="freq-viz-box forensic-card forensic-na">
                <div class="freq-viz-title">${esc(t(meta.title))} <span class="forensic-badge na">${esc(t('forensics.na'))}</span></div>
                <div class="forensic-na-msg">${esc(t('forensics.naMsg'))}</div>
            </div>`;
        }
        const sc = m.score;
        const cls = sc >= 60 ? 'hi' : sc >= 35 ? 'mid' : 'lo';
        const confBadge = m.confidence === 'low'
            ? `<span class="forensic-badge low">${esc(t('forensics.lowConf'))}</span>` : '';
        return `<div class="freq-viz-box forensic-card">
            <div class="freq-viz-title">${esc(t(meta.title))} ${confBadge}<span class="forensic-score forensic-${cls}">${sc}</span></div>
            <canvas data-method="${m.id}"></canvas>
            <div class="forensic-stats">${esc(statLine(m))}</div>
            <div class="freq-viz-hint">${esc(t(meta.hint))}</div>
        </div>`;
    }).join('');

    container.innerHTML = `
        <div class="freq-disclaimer">
            <span class="freq-disclaimer-tag">${esc(t('forensics.tag'))}</span>
            <span>${esc(t('forensics.disclaimer'))}</span>
        </div>
        <div class="freq-head">
            <div class="freq-verdict conf-${v.conf}">
                <span class="freq-verdict-label">${esc(t('forensics.scoreLabel'))}</span>
                <span class="freq-verdict-value">${result.score} · ${esc(t(v.key))}</span>
                <span class="freq-score">${esc(t('forensics.res', { w: result.w, h: result.h, q: Math.round(result.quality*100) }))} · ${result.isJpeg ? 'JPEG' : 'PNG/' + esc(t('forensics.lossless'))}</span>
            </div>
        </div>
        <div class="freq-viz forensic-grid">${cards}</div>`;

    for (const m of result.methods) {
        if (!m.applicable || !m.imageData) continue;
        const canvas = container.querySelector(`canvas[data-method="${m.id}"]`);
        if (!canvas) continue;
        canvas.width = m.imageData.width; canvas.height = m.imageData.height;
        const cx = canvas.getContext('2d');
        cx.putImageData(m.imageData, 0, 0);
        if (m.id === 'clone' && m.overlay) drawCloneOverlay(cx, m.overlay, m.blockSize);
    }
}

function drawCloneOverlay(cx, pairs, B) {
    cx.lineWidth = 1.2; cx.strokeStyle = 'rgba(0,229,255,0.9)';
    cx.fillStyle = 'rgba(0,229,255,0.18)';
    for (const [x1, y1, x2, y2] of pairs) {
        cx.fillRect(x1, y1, B, B); cx.fillRect(x2, y2, B, B);
        cx.beginPath(); cx.moveTo(x1+B/2, y1+B/2); cx.lineTo(x2+B/2, y2+B/2); cx.stroke();
    }
}

function statLine(m) {
    const s = m.stats || {};
    if (m.id === 'ela')   return t('forensics.ela.stat',   { ratio: (s.hotspotRatio||0).toFixed(2) });
    if (m.id === 'noise') return t('forensics.noise.stat', { cov: (s.cov||0).toFixed(2), contig: s.contig||0 });
    if (m.id === 'ghost') return t('forensics.ghost.stat', { q: s.modeQuality||'—', dev: s.devContig||0 });
    if (m.id === 'clone') return t('forensics.clone.stat', { pairs: s.matchPairs||0 });
    return '';
}

function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
