// Frequency-tab rendering — FFT heatmap, radial curve, feature table, verdict.

export function renderFrequencyPanel(container, result) {
    const { features, viz, score, timing, side } = result;
    container.innerHTML = `
        <div class="freq-disclaimer">
            <span class="freq-disclaimer-tag">非專業分析</span>
            <span>僅供參考 · 基於 12 條啟發式規則,不等同於學術級分類器。對現代擴散模型(SD/DALL-E/Gemini/Flux)誤判率較高。</span>
        </div>
        <div class="freq-head">
            <div class="freq-verdict ${score.confidence ? 'conf-' + score.confidence : ''}">
                <span class="freq-verdict-label">啟發式判定</span>
                <span class="freq-verdict-value">${escHtml(score.verdict)}</span>
                <span class="freq-score">得分 ${score.total} · 正向證據 ${score.positive} · 反向 ${score.negative}</span>
            </div>
            <div class="freq-timing">分析分辨率 ${side}×${side} · 用時 ${Math.round(timing.features + timing.score)}ms</div>
        </div>
        <div class="freq-viz">
            <div class="freq-viz-box">
                <div class="freq-viz-title">FFT 幅度譜(對數域)</div>
                <canvas id="fftCanvas" width="256" height="256"></canvas>
                <div class="freq-viz-hint">DC 在中心 · 越亮表示該頻率分量能量越強 · AI 圖像傾向於看起來更"乾淨"(少隨機噪聲)</div>
            </div>
            <div class="freq-viz-box">
                <div class="freq-viz-title">徑向功率譜</div>
                <canvas id="radialCanvas" width="320" height="160"></canvas>
                <div class="freq-viz-hint">橫軸 = 頻率,縱軸 = 對數功率 · 真實照片約呈 1/f 衰減;AI 圖像常偏平坦或異常峰值</div>
            </div>
        </div>
        <div class="freq-votes">
            <div class="freq-subtitle">判定依據(${score.votes.length} 條規則觸發)</div>
            ${score.votes.length === 0
                ? '<div class="freq-empty">沒有規則被觸發,特徵落在正常範圍內。</div>'
                : score.votes.map(v => `
                    <div class="freq-vote ${v.weight > 0 ? 'vote-pos' : 'vote-neg'}">
                        <span class="vote-weight">${v.weight > 0 ? '+' : ''}${v.weight}</span>
                        <span class="vote-reason">${escHtml(v.reason)}</span>
                    </div>
                `).join('')}
        </div>
        <details class="freq-features">
            <summary>全部特徵值 (${Object.keys(features).length})</summary>
            <table class="freq-table">
                ${Object.entries(features).map(([k, v]) => `
                    <tr><td>${escHtml(k)}</td><td>${typeof v === 'number' ? v.toFixed(4) : v}</td></tr>
                `).join('')}
            </table>
        </details>
    `;
    drawFftHeatmap(container.querySelector('#fftCanvas'), viz.fftMag128);
    drawRadialCurve(container.querySelector('#radialCanvas'), viz.radial64);
}

function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
}

function drawFftHeatmap(canvas, mag128) {
    const ctx = canvas.getContext('2d');
    const N = 128, dst = canvas.width;
    // log-scale and normalize
    const logVals = new Float32Array(mag128.length);
    let maxV = 0;
    for (let i = 0; i < mag128.length; i++) { logVals[i] = Math.log(1 + mag128[i]); if (logVals[i] > maxV) maxV = logVals[i]; }
    const img = ctx.createImageData(dst, dst);
    const scale = dst / N;
    for (let y = 0; y < dst; y++) {
        for (let x = 0; x < dst; x++) {
            const sx = Math.floor(x / scale), sy = Math.floor(y / scale);
            const v = maxV > 0 ? logVals[sy * N + sx] / maxV : 0;
            const [r, g, b] = viridis(v);
            const i = (y * dst + x) * 4;
            img.data[i] = r; img.data[i+1] = g; img.data[i+2] = b; img.data[i+3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);
}

function drawRadialCurve(canvas, radial) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const styles = getComputedStyle(document.documentElement);
    const bg = styles.getPropertyValue('--surface-alt').trim() || '#fafafa';
    const grid = styles.getPropertyValue('--border').trim() || '#e0e0e0';
    const curve = styles.getPropertyValue('--text').trim() || '#0a0a0b';
    const label = styles.getPropertyValue('--text-muted').trim() || '#666';
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const N = radial.length;
    const pad = 28;
    const logR = Array.from(radial, v => Math.log(Math.max(v, 1e-6)));
    let lo = Infinity, hi = -Infinity;
    for (let i = 1; i < N; i++) { if (logR[i] < lo) lo = logR[i]; if (logR[i] > hi) hi = logR[i]; }
    const span = hi - lo || 1;
    ctx.strokeStyle = grid; ctx.lineWidth = 1;
    for (let k = 1; k < 4; k++) {
        const y = pad + (h - 2*pad) * (k / 4);
        ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
    }
    ctx.strokeStyle = curve; ctx.lineWidth = 1.75; ctx.beginPath();
    for (let i = 1; i < N; i++) {
        const px = pad + (w - 2*pad) * (i - 1) / (N - 2);
        const py = (h - pad) - (h - 2*pad) * (logR[i] - lo) / span;
        if (i === 1) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = label; ctx.font = '10px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText('低頻', pad - 4, h - 8);
    ctx.fillText('高頻', w - pad - 20, h - 8);
    ctx.fillText('log(power)', 2, 12);
}

function viridis(t) {
    // Simple viridis approximation (5-stop gradient)
    t = Math.max(0, Math.min(1, t));
    const stops = [
        [68, 1, 84], [59, 82, 139], [33, 144, 141], [93, 201, 99], [253, 231, 37],
    ];
    const s = t * (stops.length - 1);
    const i = Math.floor(s), f = s - i;
    if (i >= stops.length - 1) return stops[stops.length - 1];
    const [r0,g0,b0] = stops[i], [r1,g1,b1] = stops[i+1];
    return [r0 + (r1-r0)*f, g0 + (g1-g0)*f, b0 + (b1-b0)*f];
}
