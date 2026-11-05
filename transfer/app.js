const $ = id => document.getElementById(id);
const API = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? location.protocol + '//' + location.hostname + ':8787'
  : 'https://quick-transfer.54maxwu.workers.dev';
const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const normalize = code => code.toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
const valid = code => /^[0-9A-HJKMNP-TV-Z]{20}$/.test(code);
const LIMIT = 128 * 1024 * 1024;
const CHUNK = 16 * 1024;
const status = value => {
  $('status').textContent = value === '尚未配對' ? '' : value;
  $('pair-status').textContent = value;
};
let session, connection, files = [], transfer, timer, downloads = [];

function showDialog(id) {
  const dialog = $(id);
  for (const open of document.querySelectorAll('dialog[open]')) {
    if (open !== dialog) open.close();
  }
  if (!dialog.open) dialog.showModal();
}

const size = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KiB' : (n / 1048576).toFixed(1) + ' MiB';
function inviteURL(code) {
  const url = new URL(location.href);
  url.search = '';
  url.hash = code;
  return url.href;
}

function resetTransfer(message) {
  clearTimeout(timer);
  transfer = undefined;
  $('incoming').hidden = true;
  $('cancel').hidden = true;
  if (message) progress(message);
  updateControls();
}
function progress(message, value) {
  showDialog('receive-dialog');
  $('activity').hidden = false;
  $('transfer-status').textContent = message;
  $('progress').hidden = value === undefined;
  if (value !== undefined) $('progress').value = value;
}
function updateControls() {
  const paired = connection?.channel?.readyState === 'open';
  $('device').hidden = !paired;
  $('empty').hidden = paired;
  $('send-controls').disabled = !paired || !!transfer;
  $('send-files').disabled = !files.length;
}
function closeConnection(message) {
  const previous = connection;
  connection = undefined;
  if (previous) {
    clearTimeout(previous.deadline);
    previous.channel?.close();
    previous.pc.close();
  }
  resetTransfer(transfer ? '傳輸中斷。重新配對後請再試一次。' : undefined);
  if (message) status(message);
}
function leave(message = '尚未配對') {
  const previous = session;
  session = undefined;
  clearTimeout(previous?.deadline);
  previous?.ws.close();
  closeConnection(message);
  $('setup').hidden = false;
  $('room').hidden = true;
  $('relay').value = '';
  $('code').value = '';
  history.replaceState(null, '', location.pathname + location.search);
}

function openRoom(code) {
  if (session) return;
  if (!window.RTCPeerConnection || !window.isSecureContext) {
    status('此瀏覽器或頁面無法使用 WebRTC。請用新版瀏覽器開啟 HTTPS 網頁。');
    return;
  }
  const relay = $('relay').value;
  $('relay').value = '';
  const ws = new WebSocket(API.replace(/^http/, 'ws') + '/room/' + code);
  const current = session = { ws, relay, epoch: 0 };
  current.deadline = setTimeout(() => {
    if (current === session) leave('配對服務連線逾時，請稍後再試。');
  }, 12000);
  const url = inviteURL(code);
  history.replaceState(null, '', url);
  $('room-code').textContent = code.match(/.{5}/g).join('-');
  $('qr').replaceChildren();
  window.jQuery?.('#qr').qrcode({ render: 'canvas', text: url, size: 144, quiet: 4, fill: '#101c27', background: '#fff' });
  $('setup').hidden = true;
  $('room').hidden = false;
  $('invite').hidden = false;
  $('copy').textContent = '複製邀請連結';
  status('正在連線至配對服務…');
  ws.addEventListener('message', async event => {
    if (current !== session) return;
    clearTimeout(current.deadline);
    const msg = JSON.parse(event.data);
    const handlingEpoch = current.epoch + (msg.type === 'pair' ? 1 : 0);
    try {
      if (msg.type === 'ready') status('等待另一台裝置加入');
      if (msg.type === 'full') leave('這個房間已有兩台裝置，請建立新邀請。');
      if (msg.type === 'left') {
        current.epoch++;
        closeConnection('對方已離開，等待重新加入。');
        $('invite').hidden = false;
      }
      if (msg.type === 'pair') {
        current.epoch++;
        closeConnection('已找到裝置，正在建立加密連線…');
        $('invite').hidden = true;
        current.negotiation = negotiate(current, msg.offer);
        await current.negotiation;
      }
      if (msg.type === 'offer' || msg.type === 'answer') {
        const epoch = current.epoch;
        const ctx = await current.negotiation;
        if (!ctx || ctx !== connection || epoch !== current.epoch) return;
        await ctx.pc.setRemoteDescription({ type: msg.type, sdp: msg.sdp });
        if (msg.type === 'offer') await sendDescription(ctx, await ctx.pc.createAnswer());
      }
    } catch {
      if (current === session && current.epoch === handlingEpoch && current.ws.readyState === WebSocket.OPEN)
        leave('無法建立連線。請重新加入，或確認兩台裝置的中繼密碼。');
    }
  });
  ws.addEventListener('close', () => {
    if (current === session) leave('配對服務已斷線。請確認服務已部署，並重新加入。');
  });
}

async function negotiate(current, offer) {
  const epoch = current.epoch;
  const iceServers = [{ urls: 'stun:stun.cloudflare.com:3478' }];
  if (current.relay) {
    const response = await fetch(API + '/turn', {
      method: 'POST', headers: { Authorization: 'Bearer ' + current.relay }, signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) {
      if (current === session && current.epoch === epoch) leave(response.status === 403 ? '中繼密碼不正確。' : '中繼服務尚未設定或暫時無法使用。');
      return;
    }
    iceServers.push(...(await response.json()).iceServers);
  }
  if (current !== session || current.epoch !== epoch) return;
  const pc = new RTCPeerConnection({ iceServers });
  const ctx = connection = { pc, current };
  ctx.deadline = setTimeout(() => {
    if (ctx === connection) leave('連線逾時。若兩台裝置在不同網路，請試用中繼密碼後重新加入。');
  }, 45000);
  pc.onconnectionstatechange = () => {
    if (ctx !== connection) return;
    if (pc.connectionState === 'failed') leave('網路阻擋了連線。請試用中繼密碼後重新加入。');
    if (pc.connectionState === 'disconnected') status('連線暫時中斷，等待恢復…');
    if (pc.connectionState === 'connected' && ctx.channel?.readyState === 'open') showRoute(ctx);
  };
  pc.ondatachannel = event => bindChannel(ctx, event.channel);
  if (offer) {
    bindChannel(ctx, pc.createDataChannel('transfer'));
    await sendDescription(ctx, await pc.createOffer());
  }
  return ctx;
}

async function sendDescription(ctx, description) {
  if (ctx !== connection) return;
  const { pc, current } = ctx;
  await pc.setLocalDescription(description);
  if (pc.iceGatheringState !== 'complete') await new Promise(resolve => {
    const end = () => {
      clearTimeout(timeout);
      pc.removeEventListener('icegatheringstatechange', check);
      resolve();
    };
    const check = () => { if (pc.iceGatheringState === 'complete') end(); };
    const timeout = setTimeout(end, 9000);
    pc.addEventListener('icegatheringstatechange', check);
  });
  if (ctx === connection) current.ws.send(JSON.stringify(pc.localDescription));
}

async function showRoute(ctx) {
  let route = '已配對';
  try {
    const stats = await ctx.pc.getStats();
    const transport = [...stats.values()].find(x => x.selectedCandidatePairId);
    const pair = transport && stats.get(transport.selectedCandidatePairId);
    if (pair) {
      const relayed = [pair.localCandidateId, pair.remoteCandidateId].some(id => stats.get(id)?.candidateType === 'relay');
      route = relayed ? '已配對 · Cloudflare 中繼' : '已配對 · 裝置直連';
    }
  } catch { /* Some browsers omit connection details. */ }
  if (ctx === connection && ctx.channel.readyState === 'open' && ctx.pc.connectionState === 'connected') status(route);
}

function bindChannel(ctx, channel) {
  if (ctx.channel) { channel.close(); return; }
  ctx.channel = channel;
  channel.binaryType = 'arraybuffer';
  channel.onopen = () => {
    if (ctx !== connection) return;
    clearTimeout(ctx.deadline);
    status('已配對');
    $('pair-dialog').close();
    updateControls();
    showRoute(ctx);
  };
  channel.onclose = () => {
    if (ctx === connection) closeConnection('裝置連線已結束。若對方未重新加入，請離開後再次配對。');
  };
  channel.onmessage = event => {
    if (ctx !== connection) return;
    try {
      if (typeof event.data === 'string') control(JSON.parse(event.data));
      else receiveChunk(event.data);
    } catch {
      if (transfer) cancelTransfer('傳輸格式不符，已停止。');
    }
  };
}

function send(message) {
  connection.channel.send(JSON.stringify(message));
}
function armTimeout() {
  clearTimeout(timer);
  timer = setTimeout(() => { if (transfer) cancelTransfer('等待逾時，請重新傳送。'); }, 90000);
}
function cancelTransfer(message = '已取消傳輸。') {
  try { send({ type: 'cancel', id: transfer.id }); }
  catch { /* The connection may already have closed. */ }
  resetTransfer(message);
}
function start(payload) {
  if (transfer || connection?.channel?.readyState !== 'open') return;
  const id = crypto.randomUUID();
  const info = payload.files
    ? { files: payload.files.map(file => ({ name: file.name, size: file.size })) }
    : { length: payload.text.length };
  transfer = { id, ...payload, direction: 'out', phase: 'pending' };
  try { send({ type: 'offer', id, ...info }); }
  catch { resetTransfer('無法送出請求，請重新配對。'); return; }
  $('cancel').hidden = false;
  progress('等待對方接受…');
  armTimeout();
  updateControls();
}

function control(msg) {
  if (!msg || typeof msg.id !== 'string' || !/^[\da-f-]{36}$/.test(msg.id)) return;
  if (msg.type === 'offer') {
    const metadata = msg.files;
    const isFiles = Array.isArray(metadata);
    const validFiles = isFiles && metadata.length >= 1 && metadata.length <= 20 &&
      metadata.every(f => f && typeof f.name === 'string' && f.name.length > 0 && f.name.length <= 255 &&
        Number.isSafeInteger(f.size) && f.size >= 0 && f.size <= LIMIT);
    const total = validFiles ? metadata.reduce((n, f) => n + f.size, 0) : 0;
    if (transfer || (isFiles ? !validFiles || total > LIMIT : !Number.isInteger(msg.length) || msg.length < 1 || msg.length > 8000)) {
      send({ type: 'reject', id: msg.id });
      return;
    }
    transfer = { id: msg.id, direction: 'in', phase: 'pending', metadata: isFiles ? metadata : null,
      length: msg.length, total, done: 0, index: 0, offset: 0, chunks: [], received: [] };
    $('offer').textContent = isFiles ? '對方想傳送 ' + metadata.length + ' 個檔案（' + size(total) + '）：' +
      metadata.map(f => f.name).join('、') : '對方想傳送一則文字訊息。';
    $('incoming').hidden = false;
    progress('等待你確認');
    if (document.hidden && window.Notification?.permission === 'granted') {
      try { new Notification('裝置快傳', { body: '有一筆傳送請求。' }); }
      catch { /* Some mobile browsers require a service worker for notifications. */ }
    }
    armTimeout();
    updateControls();
    return;
  }
  const job = transfer;
  if (!job || msg.id !== job.id) return;
  if (msg.type === 'cancel' || msg.type === 'reject') {
    resetTransfer(msg.type === 'cancel' ? '對方已取消傳輸。' : '對方未接受傳送請求。');
    return;
  }
  if (msg.type === 'accept' && job.direction === 'out' && job.phase === 'pending') {
    job.phase = 'active';
    transmit(job).catch(() => { if (job === transfer) cancelTransfer('傳輸失敗，請再試一次。'); });
  }
  if (msg.type === 'done' && job.direction === 'out' && job.phase === 'ending')
    resetTransfer('對方已收到。');
  if (job.direction !== 'in' || job.phase !== 'active') return;
  if (msg.type === 'text' && !job.metadata) {
    if (typeof msg.text !== 'string' || msg.text.length !== job.length) throw Error();
    const line = document.createElement('pre');
    line.textContent = msg.text;
    const copy = document.createElement('button');
    copy.textContent = '複製文字';
    copy.onclick = () => navigator.clipboard.writeText(msg.text).then(() => {
      copy.textContent = '已複製';
    }, () => { copy.textContent = '無法複製，請手動選取'; });
    clearDownloads();
    $('received').append(line, copy);
    received(job);
  }
  if (msg.type === 'file-end' && job.metadata) {
    const meta = job.metadata[job.index];
    if (!meta || job.offset !== meta.size) throw Error();
    job.received.push({ name: meta.name, blob: new Blob(job.chunks, { type: 'application/octet-stream' }) });
    job.chunks = [];
    job.offset = 0;
    job.index++;
    armTimeout();
  }
  if (msg.type === 'end' && job.metadata) {
    if (job.index !== job.metadata.length) throw Error();
    clearDownloads();
    for (const file of job.received) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(file.blob);
      downloads.push(link.href);
      link.download = file.name.replace(/[\/\\\x00-\x1f\x7f]/g, '_');
      link.textContent = '下載 ' + file.name + '（' + size(file.blob.size) + '）';
      $('received').append(link);
    }
    received(job);
  }
}

function clearDownloads() {
  downloads.forEach(url => URL.revokeObjectURL(url));
  downloads = [];
  $('received').replaceChildren();
}
function received(job) {
  send({ type: 'done', id: job.id });
  resetTransfer('接收完成。');
}
function receiveChunk(chunk) {
  const job = transfer;
  if (!job || job.direction !== 'in' || job.phase !== 'active' || !job.metadata) return;
  const meta = job.metadata[job.index];
  if (!meta || !(chunk instanceof ArrayBuffer) || chunk.byteLength < 1 || chunk.byteLength > CHUNK ||
      job.offset + chunk.byteLength > meta.size) throw Error();
  job.chunks.push(chunk);
  job.offset += chunk.byteLength;
  job.done += chunk.byteLength;
  progress('正在接收… ' + size(job.done) + ' / ' + size(job.total), job.done / job.total);
  armTimeout();
}
async function transmit(job) {
  const channel = connection.channel;
  armTimeout();
  if (job.files) {
    const total = job.files.reduce((n, file) => n + file.size, 0);
    let done = 0;
    for (const file of job.files) {
      if (job !== transfer) return;
      for (let i = 0; i < file.size; i += CHUNK) {
        while (channel.bufferedAmount > 512 * 1024 && job === transfer && channel.readyState === 'open')
          await new Promise(resolve => setTimeout(resolve, 30));
        if (job !== transfer || channel.readyState !== 'open') return;
        const bytes = await file.slice(i, i + CHUNK).arrayBuffer();
        if (job !== transfer) return;
        channel.send(bytes);
        done += bytes.byteLength;
        if (i % (16 * CHUNK) === 0 || done === total)
          progress('正在傳送… ' + size(done) + ' / ' + size(total), done / total);
        armTimeout();
      }
      send({ type: 'file-end', id: job.id });
    }
  }
  if (job !== transfer) return;
  job.phase = 'ending';
  send(job.files ? { type: 'end', id: job.id } : { type: 'text', id: job.id, text: job.text });
  progress('等待對方確認收妥…');
}

function select(list) {
  files = Array.from(list);
  const total = files.reduce((n, f) => n + f.size, 0);
  if (files.length > 20 || total > LIMIT || files.some(f => !f.name || f.name.length > 255)) {
    files = [];
    $('files').value = '';
    $('selection').textContent = '檔案超過數量、大小或檔名長度限制。';
  } else $('selection').textContent = files.length ? '已選擇 ' + files.length + ' 個檔案（' + size(total) + '）' : '';
  updateControls();
}

$('create').onclick = () => openRoom(Array.from(crypto.getRandomValues(new Uint8Array(20)), n => alphabet[n & 31]).join(''));
$('join').onsubmit = event => {
  event.preventDefault();
  const code = normalize($('code').value);
  if (valid(code)) openRoom(code); else status('請確認配對碼為 20 個字元。');
};
$('copy').onclick = async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    $('copy').textContent = '已複製邀請連結';
  } catch { window.prompt('複製這個邀請連結', location.href); }
};
$('leave').onclick = () => leave();
$('files').onchange = () => select($('files').files);
$('send-files').onclick = () => { if (files.length) start({ files }); };
$('text-form').onsubmit = event => {
  event.preventDefault();
  const text = $('message').value;
  if (text.trim() && text.length <= 8000) start({ text });
};
$('accept').onclick = () => {
  if (transfer?.direction !== 'in' || transfer.phase !== 'pending') return;
  transfer.phase = 'active';
  $('incoming').hidden = true;
  $('cancel').hidden = false;
  progress('等待資料…', 0);
  armTimeout();
  send({ type: 'accept', id: transfer.id });
};
$('reject').onclick = () => {
  if (transfer?.direction !== 'in' || transfer.phase !== 'pending') return;
  send({ type: 'reject', id: transfer.id });
  resetTransfer('已拒絕傳送。');
};
$('cancel').onclick = () => { if (transfer) cancelTransfer(); };
for (const type of ['dragenter', 'dragover', 'dragleave', 'drop']) {
  $('drop').addEventListener(type, event => {
    event.preventDefault();
    const enabled = !$('send-controls').disabled;
    $('drop').classList.toggle('over', enabled && (type === 'dragenter' || type === 'dragover'));
    if (enabled && type === 'drop' && event.dataTransfer.files.length) {
      $('files').value = '';
      select(event.dataTransfer.files);
    }
  });
}
const initial = normalize(location.hash.slice(1));
const showPair = () => showDialog('pair-dialog');
const showJoin = () => {
  showPair();
  if (!$('setup').hidden) $('code').focus();
};
$('open-pair').onclick = $('radar').onclick = showPair;
$('open-join').onclick = $('visibility').onclick = showJoin;
$('device').onclick = () => showDialog(transfer ? 'receive-dialog' : 'send-dialog');
for (const close of document.querySelectorAll('dialog .close')) {
  close.onclick = () => close.closest('dialog').close();
}
const root = document.documentElement;
const savedTheme = localStorage.getItem('transfer-theme');
if (savedTheme) root.dataset.theme = savedTheme;
$('theme').onclick = () => {
  const dark = root.dataset.theme === 'dark' ||
    (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  root.dataset.theme = dark ? 'light' : 'dark';
  localStorage.setItem('transfer-theme', root.dataset.theme);
};
$('device-name').textContent = localStorage.getItem('transfer-device-name') || '我的裝置';
$('rename').onclick = () => {
  const name = window.prompt('更改裝置名稱', $('device-name').textContent)?.trim().slice(0, 32);
  if (!name) return;
  $('device-name').textContent = name;
  localStorage.setItem('transfer-device-name', name);
};
$('notify').onclick = async () => {
  const permission = await window.Notification?.requestPermission();
  $('notification-text').textContent = permission === 'granted' ? '已啟用傳送請求通知。' : '傳送請求會在網頁中顯示。';
  showDialog('notification-dialog');
};
if (valid(initial)) {
  $('code').value = initial.match(/.{5}/g).join('-');
  status('已讀取邀請，按「加入」開始配對。');
  showJoin();
} else {
  status('尚未配對');
}
window.addEventListener('pagehide', () => { session?.ws.close(); });
