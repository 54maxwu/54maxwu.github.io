// In-browser AI-image classifier — a *real* trained model, not a heuristic.
//
// Loads transformers.js (Hugging Face) from a CDN on first use and runs a ViT
// image-classification model entirely client-side via WebGPU (falling back to
// WASM). The image is never uploaded — only the quantized model weights are
// downloaded, once, then cached by the browser.
//
// Model: onnx-community/ai-source-detector-ONNX. Unlike a binary SDXL-vs-one-
// realset detector, it has an explicit "real" class plus per-generator classes
// (stable_diffusion / midjourney / dalle / other_ai), so it generalizes better
// to ordinary photos and yields a vendor breakdown. Still just one opinion —
// small detectors can misfire on compressed/phone photos — so fusion.js shrinks
// and CAPS this vote rather than letting it dominate.

import { t } from './i18n.js';

// Pin a version so behavior is reproducible. ESM build, browser-ready.
const TRANSFORMERS_CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.2';
const MODEL_ID = 'onnx-community/ai-source-detector-ONNX';

let _libPromise = null;   // resolves to the transformers module
let _pipePromise = null;  // resolves to the classification pipeline
let _device = null;

function aiLabel(label) {
    return /art|ai|fake|gener|synth|diffus|machine|sdxl|midjourney|dalle|flux/i.test(label);
}
function realLabel(label) {
    return /human|real|photo|authentic|natural|genuine/i.test(label);
}

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

export async function getPipeline(onProgress = () => {}) {
    if (_pipePromise) return _pipePromise;
    _pipePromise = (async () => {
        const lib = await loadLib();
        const wantGpu = !!navigator.gpu;
        _device = wantGpu ? 'webgpu' : 'wasm';
        // WebGPU runs fp16 well (~half the download); WASM uses the q8 quantized
        // weights (~25MB) for a fast, broadly-compatible load.
        const dtypeFor = (dev) => dev === 'webgpu' ? 'fp16' : 'q8';
        const opts = {
            device: _device,
            dtype: dtypeFor(_device),
            progress_callback: (p) => {
                if (!p) return;
                // 'progress' events carry loaded/total → real percentage. Other
                // events ('initiate'/'download'/'done') have no total, so map them
                // to a generic "loading" message instead of a bogus undefined%.
                if (p.status === 'progress' && p.total) {
                    onProgress({
                        status: 'download',
                        file: p.file,
                        pct: Math.round((p.loaded / p.total) * 100),
                    });
                } else {
                    onProgress({ status: 'loading', file: p.file });
                }
            },
        };
        try {
            return await lib.pipeline('image-classification', MODEL_ID, opts);
        } catch (err) {
            // WebGPU can fail on some drivers — retry once on WASM.
            if (_device === 'webgpu') {
                _device = 'wasm';
                onProgress({ status: 'fallback' });
                return await lib.pipeline('image-classification', MODEL_ID, { ...opts, device: 'wasm', dtype: dtypeFor('wasm') });
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
        // Default top_k returns the top classes; this model has 2 labels, so we
        // get both. (Avoids depending on the topk/top_k option name across versions.)
        const raw = await pipe(url);
        const labels = (Array.isArray(raw) ? raw : [raw]).map(r => ({
            label: String(r.label), score: Number(r.score),
        }));
        // Derive a single AI probability. This model has FOUR AI classes vs ONE
        // "real" class, so probability mass naturally splits across the AI
        // buckets — using 1 − P(real) would systematically over-flag real photos
        // (it did: a photo whose top-1 class was "real" still scored 71% AI).
        // Instead pit the strongest single AI class head-to-head against "real":
        //   aiProb = maxAI / (maxAI + real)
        // For a binary artificial/human model the two scores sum to 1, so this
        // reduces to P(artificial) — fully backward-compatible.
        const real = labels.find(l => realLabel(l.label));
        const aiClasses = labels.filter(l => aiLabel(l.label) && !realLabel(l.label));
        let aiProb = null;
        if (real && aiClasses.length) {
            const maxAi = Math.max(...aiClasses.map(l => l.score));
            const denom = maxAi + real.score;
            aiProb = denom > 0 ? maxAi / denom : null;
        } else if (aiClasses.length) {
            aiProb = Math.max(...aiClasses.map(l => l.score));
        } else if (real) {
            aiProb = 1 - real.score;
        } else {
            const top = labels.slice().sort((a, b) => b.score - a.score)[0];
            aiProb = top && aiLabel(top.label) ? top.score : (top ? 1 - top.score : null);
        }
        return { aiProb, labels, device: _device, modelId: MODEL_ID };
    } finally {
        URL.revokeObjectURL(url);
    }
}

export function getDevice() { return _device; }
