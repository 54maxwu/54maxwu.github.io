// Public usage stats via counterapi.dev v2.
// Each counter maps to a real user event; numbers render at the bottom
// of the page. Fails silently if the API is unreachable.
//
// The workspace is set to 'Publicly Accessible' on counterapi.dev,
// which means NO Authorization header is sent. This matters: with the
// header, the browser triggers a CORS preflight that counterapi's
// Cloudflare layer rejects (it doesn't whitelist 'Authorization' in
// Access-Control-Allow-Headers). Without it, the request becomes a
// "simple" CORS request and just works.

const WORKSPACE = 'image-provenance';
const API = 'https://api.counterapi.dev/v2';

const COUNTERS = [
    { key: 'image-provenance-visits',      label: '訪問', el: 'statVisits' },
    { key: 'image-provenance-analyses',    label: '檢測', el: 'statAnalyses' },
    { key: 'image-provenance-conversions', label: '轉換', el: 'statConversions' },
];

const SESSION_KEY = 'ip_visited';

async function readCounter(key) {
    try {
        const r = await fetch(`${API}/${WORKSPACE}/${key}`);
        if (!r.ok) return null;
        const data = await r.json();
        return data?.data?.up_count ?? data?.count ?? data?.value ?? null;
    } catch { return null; }
}

async function bumpCounter(key) {
    try {
        const r = await fetch(`${API}/${WORKSPACE}/${key}/up`);
        if (!r.ok) return null;
        const data = await r.json();
        return data?.data?.up_count ?? data?.count ?? data?.value ?? null;
    } catch { return null; }
}

function renderCount(elId, val) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = val != null ? val.toLocaleString() : '—';
}

// Public bump helpers called from main.js event handlers.
export async function trackAnalysis()  { const n = await bumpCounter('image-provenance-analyses');    renderCount('statAnalyses', n); }
export async function trackConversion(){ const n = await bumpCounter('image-provenance-conversions'); renderCount('statConversions', n); }

// Called once on page load — bump visits (session-guarded) then fetch
// all four current totals for display.
export async function initStats() {
    const bar = document.getElementById('statsBar');
    if (!bar) return;
    bar.classList.remove('hidden');

    const firstVisit = !sessionStorage.getItem(SESSION_KEY);
    if (firstVisit) {
        const n = await bumpCounter('image-provenance-visits');
        renderCount('statVisits', n);
        sessionStorage.setItem(SESSION_KEY, '1');
    } else {
        readCounter('image-provenance-visits').then(n => renderCount('statVisits', n));
    }
    // Fetch the other three in parallel
    COUNTERS.slice(1).forEach(({ key, el }) => {
        readCounter(key).then(n => renderCount(el, n));
    });
}
