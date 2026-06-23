// In-browser AI-image detector — CLIP zero-shot.
//
// Loads transformers.js from a CDN on first use and runs CLIP
// (Xenova/clip-vit-base-patch16) entirely client-side via WebGPU (falling back
// to WASM). The image is never uploaded — only the model weights are, once.
//
// Why CLIP zero-shot instead of a tiny fine-tuned classifier: the small SDXL/
// generator classifiers badly over-flag real-world photos (documents, ID cards,
// screenshots) because they overfit to one generator's artifacts. CLIP carries
// broad world knowledge, so we ask it to compare each image against natural-
// language descriptions of "a real photograph" vs "an AI-generated image",
// averaged over several prompt phrasings. It is still just one opinion — and
// zero-shot detection is far from perfect — so fusion.js gates it behind a
// confidence dead-band and caps its influence.

import { t } from './i18n.js';

// Pin a version so behavior is reproducible. ESM build, browser-ready.
const TRANSFORMERS_CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.2';
const MODEL_ID = 'Xenova/clip-vit-base-patch16';

// Balanced prompt pairs. Each pair is scored independently (clean 2-way softmax)
// and the AI-side scores are averaged, so no single phrasing dominates.
const PROMPT_PAIRS = [
    { ai: 'an AI-generated image',                    real: 'a real photograph' },
    { ai: 'a synthetic image created by AI',          real: 'a natural photo taken with a camera' },
    { ai: 'a computer-generated picture',             real: 'an authentic real-world photograph' },
    { ai: 'an image made by a diffusion model',       real: 'a genuine photo of a real scene' },
];

let _libPromise = null;   // resolves to the transformers module
let _pipePromise = null;  // resolves to the zero-shot pipeline
let _device = null;

async function loadLib() {
    if (_libPromise) return _libPromise;
    // Dynamic import via a runtime variable so the bundler leaves it external
    // and it is fetched lazily from the CDN at click time.
    const url = TRANSFORMERS_CDN;
    _libPromise = import(/* @vite-ignore */ url).then((mod) => {
        // We fetch weights from the HF hub, not from local disk.
        if (mod.env) mod.env.allowLocalModels = false;
        return mod;
    }).catch((err) => {
        _libPromise = null;
        throw new Error(t('model.err.lib', { msg: err.message || err }));
    });
    return _libPromise;
}

export function modelSupported() {
    return typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined';
}

const dtypeFor = (dev) => dev === 'webgpu' ? 'fp16' : 'q8';

export async function getPipeline(onProgress = () => {}) {
    if (_pipePromise) return _pipePromise;
    _pipePromise = (async () => {
        const lib = await loadLib();
        const wantGpu = !!navigator.gpu;
        _device = wantGpu ? 'webgpu' : 'wasm';
        const opts = {
            device: _device,
            dtype: dtypeFor(_device),
            progress_callback: (p) => {
                if (!p) return;
                // 'progress' events carry loaded/total → real percentage. Other
                // events ('initiate'/'download'/'done') have no total, so map them
                // to a generic "loading" message instead of a bogus undefined%.
                if (p.status === 'progress' && p.total) {
                    onProgress({ status: 'download', file: p.file, pct: Math.round((p.loaded / p.total) * 100) });
                } else {
                    onProgress({ status: 'loading', file: p.file });
                }
            },
        };
        try {
            return await lib.pipeline('zero-shot-image-classification', MODEL_ID, opts);
        } catch (err) {
            // WebGPU can fail on some drivers — retry once on WASM.
            if (_device === 'webgpu') {
                _device = 'wasm';
                onProgress({ status: 'fallback' });
                return await lib.pipeline('zero-shot-image-classification', MODEL_ID, { ...opts, device: 'wasm', dtype: dtypeFor('wasm') });
            }
            throw err;
        }
    })().catch((err) => {
        _pipePromise = null;
        throw new Error(t('model.err.load', { msg: err.message || err }));
    });
    return _pipePromise;
}

// Classify a File/Blob. Returns { aiProb (0..1), labels:[{label,score}], device }.
export async function classifyImage(file, onProgress = () => {}) {
    const pipe = await getPipeline(onProgress);
    onProgress({ status: 'infer' });
    const url = URL.createObjectURL(file);
    try {
        const pairScores = [];
        for (const pair of PROMPT_PAIRS) {
            const res = await pipe(url, [pair.ai, pair.real]);
            const arr = Array.isArray(res) ? res : [res];
            const aiEntry = arr.find(r => r.label === pair.ai);
            // Zero-shot softmaxes over the two candidates, so this is P(ai | pair).
            if (aiEntry) pairScores.push(Number(aiEntry.score));
        }
        const aiProb = pairScores.length
            ? pairScores.reduce((s, v) => s + v, 0) / pairScores.length
            : null;
        // Expose a transparent two-class summary plus per-prompt AI scores.
        const labels = [
            { label: t('model.clip.aiClass'), score: aiProb ?? 0, ai: true },
            { label: t('model.clip.realClass'), score: aiProb == null ? 0 : 1 - aiProb, ai: false },
        ];
        const detail = pairScores.map((s, i) => ({
            label: `${t('model.clip.prompt')} #${i + 1}`, score: s, ai: true,
        }));
        return { aiProb, labels, detail, device: _device, modelId: MODEL_ID, kind: 'clip' };
    } finally {
        URL.revokeObjectURL(url);
    }
}

export function getDevice() { return _device; }
