// In-browser AI-image classifier — a *real* trained model, not a heuristic.
//
// Loads transformers.js (Hugging Face) from a CDN on first use and runs a Swin
// image-classification model (Organika/sdxl-detector) entirely client-side via
// WebGPU (falling back to WASM). The image is never uploaded — only the model
// weights are downloaded, once, then cached by the browser.
//
// This is one model's opinion. It is strongest on diffusion imagery (SD/SDXL)
// and can miss other generators, so fusion.js treats it as a heavy vote, not a
// verdict. Kept on a dedicated tab because the first run pulls ~100MB of weights.

import { t } from './i18n.js';

// Pin a version so behavior is reproducible. ESM build, browser-ready.
const TRANSFORMERS_CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.2';
const MODEL_ID = 'Organika/sdxl-detector';

let _libPromise = null;   // resolves to the transformers module
let _pipePromise = null;  // resolves to the classification pipeline
let _device = null;

function aiLabel(label) {
    return /art|\bai\b|fake|gener|synth|diffus|machine/i.test(label);
}
function realLabel(label) {
    return /human|real|photo|authentic|natural/i.test(label);
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
        const opts = {
            device: _device,
            dtype: 'fp32',
            progress_callback: (p) => {
                if (p && p.status === 'progress' && p.total) {
                    onProgress({
                        status: 'download',
                        file: p.file,
                        pct: Math.round((p.loaded / p.total) * 100),
                    });
                } else if (p && p.status) {
                    onProgress({ status: p.status, file: p.file });
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
                return await lib.pipeline('image-classification', MODEL_ID, { ...opts, device: 'wasm' });
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
        // Derive a single AI probability: prefer an explicit AI-class score;
        // otherwise 1 - realScore; otherwise the top label's polarity.
        let aiProb = null;
        const ai = labels.find(l => aiLabel(l.label));
        const real = labels.find(l => realLabel(l.label));
        if (ai) aiProb = ai.score;
        else if (real) aiProb = 1 - real.score;
        else {
            const top = labels.slice().sort((a, b) => b.score - a.score)[0];
            aiProb = top && aiLabel(top.label) ? top.score : (top ? 1 - top.score : null);
        }
        return { aiProb, labels, device: _device, modelId: MODEL_ID };
    } finally {
        URL.revokeObjectURL(url);
    }
}

export function getDevice() { return _device; }
