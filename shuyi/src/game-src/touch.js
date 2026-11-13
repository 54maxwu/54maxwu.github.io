// 樹義國小校園對戰：手機觸控操作
//
// 對外介面
//   new TouchControls(game)：觸控裝置（或網址加 ?touch）時啟用，在 #touch 圖層建立操作介面
//   .enabled：是否啟用
// 寫入目前玩家（game.player）的欄位
//   touch.mx / touch.mz      搖桿左右／前後（-1..1）
//   touch.fire / firePressed 按住開火／這一幀剛按下
//   touch.jump / touch.crouch
//   touchLook.x / .y          視角拖曳量（像素，玩家端再乘靈敏度）
//   pressed.add('KeyR' | 'KeyQ' | 'Digit4')、mouse.rp（開鏡）
//
// 操作方式
//   左半邊：手指放下的位置就是搖桿中心（浮動搖桿），放開歸零
//   右半邊：拖曳轉視角；按住開火鍵時也可以直接拖曳瞄準

const STICK_R = 56;        // 搖桿最大位移（px）
const DEAD = 0.12;         // 搖桿死區
const LOOK_GAIN = 1.5;     // 視角基本倍率
const LOOK_ACCEL = 0.5;    // 快速甩動時額外加成

// 按鍵：id、文字、類別（決定位置與大小，見 style.css 的 #touch 段落）
const BUTTONS = [
  { id: 'fire', label: '開火', cls: 'big fire' },
  { id: 'fire2', label: '開火', cls: 'fire2' },
  { id: 'jump', label: '跳', cls: 'jump' },
  { id: 'crouch', label: '蹲', cls: 'crouch' },
  { id: 'scope', label: '開鏡', cls: 'scope' },
  { id: 'reload', label: '換彈', cls: 'reload' },
  { id: 'swap', label: '切槍', cls: 'swap' },
  { id: 'nade', label: '手雷', cls: 'nade' },
];

export class TouchControls {
  constructor(game) {
    this.game = game;
    this.enabled = matchMedia('(pointer:coarse)').matches || new URLSearchParams(location.search).has('touch');
    if (!this.enabled) return;

    this.root = document.getElementById('touch');
    this.root.classList.remove('hidden');
    this.root.classList.add('on');

    // 浮動搖桿
    this.base = el('div', 'stick');
    this.knob = el('div', 'knob');
    this.base.appendChild(this.knob);
    this.root.appendChild(this.base);

    this.btn = {};
    for (const b of BUTTONS) {
      const e = el('div', 'tbtn ' + b.cls);
      e.textContent = b.label;
      e.dataset.id = b.id;
      this.root.appendChild(e);
      this.btn[b.id] = e;
    }

    this.stickId = null; this.sx = 0; this.sy = 0;
    this.looks = new Map();      // pointerId → 上一個位置（視角拖曳，可以多指）
    this.held = new Map();       // pointerId → 按鍵 id

    const opt = { passive: false };
    window.addEventListener('pointerdown', (e) => this.down(e), opt);
    window.addEventListener('pointermove', (e) => this.move(e), opt);
    window.addEventListener('pointerup', (e) => this.up(e), opt);
    window.addEventListener('pointercancel', (e) => this.up(e), opt);
    window.addEventListener('blur', () => this.releaseAll());
  }

  get player() { return this.game.playing ? this.game.player : null; }

  // 只處理落在遊戲畫面或觸控圖層上的手指，選單、暫停畫面照常點擊
  owns(e) {
    if (e.pointerType !== 'touch') return false;
    const t = e.target;
    return t === this.game.renderer?.renderer?.domElement || t?.id === 'c' || this.root.contains(t);
  }

  down(e) {
    if (!this.owns(e)) return;
    const p = this.player;
    if (!p) return;
    e.preventDefault();
    this.btn.crouch.classList.toggle('lit', !!p.touch.crouch);   // 重生後玩家物件會換新
    const id = e.target?.dataset?.id;
    if (id) { this.held.set(e.pointerId, id); this.press(id, p); e.target.classList.add('down'); }
    if (id === 'fire' || id === 'fire2') { this.looks.set(e.pointerId, { x: e.clientX, y: e.clientY }); return; }
    if (id) return;
    if (e.clientX < innerWidth * 0.42 && this.stickId === null) {
      this.stickId = e.pointerId; this.sx = e.clientX; this.sy = e.clientY;
      this.base.style.left = e.clientX + 'px'; this.base.style.top = e.clientY + 'px';
      this.base.classList.add('active');
      this.setKnob(0, 0);
    } else {
      this.looks.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
  }

  move(e) {
    if (e.pointerType !== 'touch') return;
    const p = this.player;
    if (e.pointerId === this.stickId) {
      e.preventDefault();
      let dx = (e.clientX - this.sx) / STICK_R, dy = (e.clientY - this.sy) / STICK_R;
      const L = Math.hypot(dx, dy);
      if (L > 1) { dx /= L; dy /= L; }
      this.setKnob(dx, dy);
      // 死區外重新映射到 0..1，小幅推動也能慢慢走
      const m = Math.min(1, L), k = m < DEAD ? 0 : (m - DEAD) / (1 - DEAD) / (m || 1);
      if (p) { p.touch.mx = dx * k; p.touch.mz = -dy * k; }
      return;
    }
    const last = this.looks.get(e.pointerId);
    if (!last) return;
    e.preventDefault();
    const dx = e.clientX - last.x, dy = e.clientY - last.y;
    last.x = e.clientX; last.y = e.clientY;
    if (!p) return;
    const speed = Math.min(1, Math.hypot(dx, dy) / 30);
    const gain = LOOK_GAIN * (1 + speed * LOOK_ACCEL);
    const L = p.touchLook || (p.touchLook = { x: 0, y: 0 });
    L.x += dx * gain; L.y += dy * gain;
  }

  up(e) {
    if (e.pointerType !== 'touch') return;
    const p = this.player;
    if (e.pointerId === this.stickId) {
      this.stickId = null;
      this.base.classList.remove('active');
      if (p) { p.touch.mx = 0; p.touch.mz = 0; }
    }
    this.looks.delete(e.pointerId);
    const id = this.held.get(e.pointerId);
    if (id) {
      this.held.delete(e.pointerId);
      this.btn[id]?.classList.remove('down');
      if ((id === 'fire' || id === 'fire2') && p && ![...this.held.values()].some((v) => v === 'fire' || v === 'fire2')) p.touch.fire = false;
    }
  }

  press(id, p) {
    switch (id) {
      case 'fire': case 'fire2':
        p.touch.fire = true; p.touch.firePressed = true;
        navigator.vibrate?.(6);
        break;
      case 'jump': p.touch.jump = true; break;
      case 'crouch':
        p.touch.crouch = !p.touch.crouch;
        this.btn.crouch.classList.toggle('lit', p.touch.crouch);
        break;
      case 'scope': p.mouse.rp = true; break;
      case 'reload': p.pressed.add('KeyR'); break;
      case 'swap': p.pressed.add('KeyQ'); break;
      case 'nade': p.pressed.add('Digit4'); break;
    }
  }

  setKnob(dx, dy) {
    this.knob.style.transform = `translate(calc(-50% + ${dx * STICK_R}px), calc(-50% + ${dy * STICK_R}px))`;
  }

  releaseAll() {
    const p = this.player;
    this.stickId = null; this.looks.clear(); this.held.clear();
    this.base?.classList.remove('active');
    for (const b of Object.values(this.btn || {})) b.classList.remove('down');
    if (p) { p.touch.mx = p.touch.mz = 0; p.touch.fire = false; }
  }
}

function el(tag, cls) {
  const e = document.createElement(tag);
  e.className = cls;
  return e;
}
