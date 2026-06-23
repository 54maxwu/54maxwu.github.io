// Calibrated fusion — combine every layer of evidence into ONE number.
//
// The tool gathers signals of very different reliability: C2PA/metadata (near
// certain when present, but easily stripped), vendor byte signatures, the
// in-browser model (trustworthy but diffusion-biased), the frequency heuristic
// (noisy), and the forensic ELA/noise maps (about *editing*, not generation).
//
// Rather than show five disconnected verdicts, we combine them in log-odds
// space — each source pushes the probability up or down by an amount scaled to
// how much we trust it — and present a single calibrated % plus a transparent
// breakdown of who voted which way. A decisive provenance signal short-circuits
// the math (you can't out-argue an embedded C2PA "AI-generated" claim).

import { t } from './i18n.js';

const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

// inputs: { detections, freq, forensics, model }  (any may be null/absent)
export function computeFusion(inputs) {
    const { detections = [], freq = null, forensics = null, model = null } = inputs || {};
    const sources = [];

    // --- Decisive provenance signals (short-circuit) ---
    const strong = detections.filter(d => d.hit && d.category !== 'edit' && d.confidence === 'strong');
    const medium = detections.filter(d => d.hit && d.category !== 'edit' && d.confidence === 'medium');
    const weak = detections.filter(d => d.hit && d.category !== 'edit' && d.confidence === 'weak');
    const edits = detections.filter(d => d.hit && d.category === 'edit');

    let prob, label, conf, decisive = false;

    // log-odds accumulation for the soft path
    let logit = -1.2;                  // prior ≈ 23% (unknown image leans "not flagged")
    let evidence = 0;
    const add = (delta, srcKey, kind, detail) => {
        logit += delta;
        evidence += Math.abs(delta);
        sources.push({ key: srcKey, kind, delta, detail });
    };

    if (model && Number.isFinite(model.aiProb)) {
        // Small detectors are noisy in the middle of their range and notoriously
        // over-flag photos of documents/ID cards/screens (lamination glare, moiré
        // and recompression mimic "AI" texture stats). So the model only VOTES
        // when it is confidently one-sided — a dead-band: aiProb in [0.30, 0.78]
        // contributes nothing; outside it ramps to a capped ±1.5 log-odds push.
        // One model still can't reach "certain" alone — a second signal must agree.
        const p = model.aiProb;
        let delta = 0;
        if (p >= 0.78) delta = clamp((p - 0.78) / 0.22 * 1.5, 0, 1.5);
        else if (p <= 0.30) delta = clamp((p - 0.30) / 0.30 * 1.5, -1.5, 0);
        const neutral = Math.abs(delta) < 0.02;
        add(delta, 'fusion.src.model', 'model',
            neutral
                ? t('fusion.detail.modelNeutral', { pct: Math.round(p * 100) })
                : t('fusion.detail.model', { pct: Math.round(p * 100), dev: model.device || '—' }));
    }
    if (freq && freq.score) {
        const tot = clamp(freq.score.total, -4, 9);
        add(tot * 0.18, 'fusion.src.freq', 'freq',
            t('fusion.detail.freq', { total: freq.score.total }));
    }
    if (forensics && Number.isFinite(forensics.score)) {
        // Forensics mainly evidences *local editing*; modest push toward "altered".
        if (forensics.score >= 35) {
            add((forensics.score - 30) / 100 * 1.6, 'fusion.src.forensics', 'forensics',
                t('fusion.detail.forensics', { score: forensics.score }));
        }
    }
    for (const m of medium) add(1.2, 'fusion.src.marker', 'marker', m.title);
    for (const w of weak) add(0.4, 'fusion.src.weak', 'weak', w.title);
    for (const e of edits) add(0.25, 'fusion.src.edit', 'edit', e.title);

    if (strong.length) {
        decisive = true;
        prob = 98;
        label = t('fusion.label.confirmed');
        conf = 'strong';
        // surface the strong source(s) at the top of the breakdown
        for (const s of strong) sources.unshift({ key: 'fusion.src.provenance', kind: 'strong', delta: 4, detail: s.badgeText || s.title });
    } else {
        prob = Math.round(sigmoid(logit) * 100);
        if (evidence < 0.55) {
            label = t('fusion.label.inconclusive');
            conf = null;
        } else if (prob >= 70) { label = t('fusion.label.likelyAi'); conf = 'medium'; }
        else if (prob >= 45) { label = t('fusion.label.uncertain'); conf = 'weak'; }
        else { label = t('fusion.label.likelyReal'); conf = 'info'; }
    }

    return { prob, label, conf, decisive, evidence, sources, hasModel: !!model, hasForensics: !!forensics };
}

export function renderFusionSummary(container, fusion) {
    if (!container) return;
    const ringColor = fusion.prob >= 70 ? 'var(--danger)'
        : fusion.prob >= 45 ? 'var(--warn)'
        : fusion.decisive ? 'var(--danger)' : 'var(--success)';
    const deg = Math.round(fusion.prob * 3.6);

    const barsHtml = fusion.sources.length
        ? fusion.sources.map(s => {
            const mag = clamp(Math.abs(s.delta) / 3, 0.06, 1) * 100;
            const dir = s.delta >= 0 ? 'pos' : 'neg';
            return `
                <div class="fusion-src">
                    <div class="fusion-src-top">
                        <span class="fusion-src-name">${esc(t(s.key))}</span>
                        <span class="fusion-src-detail">${esc(s.detail || '')}</span>
                    </div>
                    <div class="fusion-bar"><span class="fusion-bar-fill fusion-${dir}" style="width:${mag.toFixed(0)}%"></span></div>
                </div>`;
        }).join('')
        : `<div class="freq-empty">${esc(t('fusion.noEvidence'))}</div>`;

    const pending = [];
    if (!fusion.hasModel) pending.push(t('fusion.pending.model'));
    if (!fusion.hasForensics) pending.push(t('fusion.pending.forensics'));
    const pendingHtml = pending.length
        ? `<div class="fusion-pending">${esc(t('fusion.pending.prefix'))} ${pending.map(esc).join(' · ')}</div>`
        : '';

    container.innerHTML = `
        <div class="fusion-card">
            <div class="fusion-gauge" style="background:conic-gradient(${ringColor} ${deg}deg, var(--border) ${deg}deg)">
                <div class="fusion-gauge-inner">
                    <span class="fusion-pct">${fusion.prob}<span class="fusion-pct-sign">%</span></span>
                    <span class="fusion-pct-label">${esc(t('fusion.aiLikelihood'))}</span>
                </div>
            </div>
            <div class="fusion-body">
                <div class="fusion-verdict ${fusion.conf ? 'conf-' + fusion.conf : ''}">${esc(fusion.label)}</div>
                <div class="fusion-sub">${esc(t('fusion.sub'))}</div>
                <div class="fusion-breakdown">${barsHtml}</div>
                ${pendingHtml}
            </div>
        </div>`;
}

function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
}
