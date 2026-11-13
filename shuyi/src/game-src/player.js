// 樹義國小校園對戰：玩家（鍵盤滑鼠輸入、第一人稱鏡頭、陣亡鏡頭）
//
// 對外介面（其餘移動、射擊邏輯繼承自 Actor）
//   bind(canvas)          綁定輸入事件（整局只綁一次，事件永遠轉給目前的玩家物件）
//   update(dt)            讀輸入 → 轉視角 → 移動 → 武器 → 鏡頭
//   startDeathCam(killer) 陣亡後鏡頭拉到身後上方、看向擊殺者
// 外部會讀寫的欄位
//   keys（按住中的鍵）、pressed（這一幀按下的鍵）、mouse、touch、touchLook、lookDX / lookDY
import * as THREE from 'three';
import { Actor } from './actor.js';

// 移動鍵：[前後, 左右]
const MOVE = {
  KeyW: [1, 0], ArrowUp: [1, 0],
  KeyS: [-1, 0], ArrowDown: [-1, 0],
  KeyD: [0, 1], ArrowRight: [0, 1],
  KeyA: [0, -1], ArrowLeft: [0, -1],
};
// 這些鍵在遊戲中按下時不讓瀏覽器做預設動作（捲動、切焦點…）
const SWALLOW = new Set(['Tab', 'Space', 'KeyB', 'KeyF', 'KeyQ', 'ControlLeft', 'ControlRight', 'ArrowUp', 'ArrowDown']);
const CTRL_SWALLOW = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR']);   // Ctrl+W 會關分頁
const SLOT_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];
const MOUSE_SENS = 0.0022;   // 每像素弧度（再乘使用者靈敏度）
const _head = new THREE.Vector3();

export class Player extends Actor {
  constructor(game, o) {
    super(game, { ...o, isPlayer: true });
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { l: false, r: false, lp: false, rp: false, dx: 0, dy: 0, wheel: 0 };
    this.touch = { mx: 0, mz: 0, fire: false, jump: false, crouch: false };
    this.lookDX = 0; this.lookDY = 0;
    this.bobT = 0; this.land = 0; this.camRoll = 0;
    this.deathCam = null;
  }

  bind(canvas) {
    const g = this.game;
    if (g._inputBound) return;
    g._inputBound = true;
    const active = () => (g.playing ? g.player : null);   // 遊戲中才接收
    const any = () => g.player;                           // 放開鍵、失焦一律處理，避免卡鍵

    addEventListener('keydown', (e) => {
      const p = active();
      if (!p) return;
      if (SWALLOW.has(e.code) || (e.ctrlKey && CTRL_SWALLOW.has(e.code))) e.preventDefault();
      if (e.repeat) return;
      p.keys.add(e.code);
      p.pressed.add(e.code);
    });
    addEventListener('keyup', (e) => any()?.keys.delete(e.code));
    addEventListener('blur', () => {
      const p = any();
      if (p) { p.keys.clear(); p.mouse.l = p.mouse.r = false; }
    });

    canvas.addEventListener('mousedown', (e) => {
      const p = active();
      if (!p) return;
      if (!g.locked && !g.touchMode) { g.lock(); return; }   // 第一下只用來鎖定滑鼠
      if (e.button === 0) { p.mouse.l = true; p.mouse.lp = true; }
      if (e.button === 2) { p.mouse.r = true; p.mouse.rp = true; }
    });
    addEventListener('mouseup', (e) => {
      const p = any();
      if (!p) return;
      if (e.button === 0) p.mouse.l = false;
      if (e.button === 2) p.mouse.r = false;
    });
    addEventListener('contextmenu', (e) => e.preventDefault());
    addEventListener('mousemove', (e) => {
      const p = active();
      if (!p || !g.locked) return;
      // 部分瀏覽器在鎖定瞬間會回報一筆超大的位移，丟掉
      if (Math.abs(e.movementX) > 400 || Math.abs(e.movementY) > 400) return;
      p.mouse.dx += e.movementX;
      p.mouse.dy += e.movementY;
    });
    addEventListener('wheel', (e) => {
      const p = active();
      if (p && g.locked) p.mouse.wheel += Math.sign(e.deltaY);
    }, { passive: true });
  }

  consumePressed(code) {
    const had = this.pressed.has(code);
    this.pressed.delete(code);
    return had;
  }

  update(dt) {
    const g = this.game;

    // 視角：滑鼠＋觸控，開鏡時依放大倍率降低靈敏度
    let dx = this.mouse.dx, dy = this.mouse.dy;
    this.mouse.dx = this.mouse.dy = 0;
    if (this.touchLook) { dx += this.touchLook.x; dy += this.touchLook.y; this.touchLook.x = this.touchLook.y = 0; }
    this.lookDX += dx; this.lookDY += dy;   // game.loop 每幀歸零（一幀可能跑好幾個模擬步）

    if (this.alive) {
      const zoomK = this.scoped ? g.renderer.camera.fov / g.opts.fov : 1;
      const k = g.opts.sens * MOUSE_SENS * zoomK;
      this.yaw -= dx * k;
      this.pitch = THREE.MathUtils.clamp(this.pitch - dy * k, -1.5, 1.5);

      this.readMovement(dt);
      this.readWeapon(dt);
      if (this.consumePressed('KeyF')) g.vm.inspect();
    } else {
      this.pressed.delete('KeyR');
      this.mouse.lp = this.mouse.rp = false;
    }
    if (this.consumePressed('KeyB')) g.toggleLoadout();
    this.pressed.clear();
    this.updateCamera(dt);
  }

  readMovement(dt) {
    let fwd = this.touch.mz, right = this.touch.mx;
    for (const code of this.keys) {
      const m = MOVE[code];
      if (m) { fwd += m[0]; right += m[1]; }
    }
    fwd = THREE.MathUtils.clamp(fwd, -1, 1);       // W 和 ↑ 同時按不會變兩倍速
    right = THREE.MathUtils.clamp(right, -1, 1);
    // 轉成世界方向（yaw = 0 時面向 -Z）
    const s = Math.sin(this.yaw), c = Math.cos(this.yaw);
    const wx = -s * fwd + c * right, wz = -c * fwd - s * right;
    const K = this.keys;
    const jump = K.has('Space') || this.touch.jump;
    const crouch = K.has('ControlLeft') || K.has('ControlRight') || this.touch.crouch;
    this.walk = K.has('ShiftLeft') || K.has('ShiftRight');
    this.move(dt, wx, wz, jump, crouch, this.walk);
    this.touch.jump = false;   // 觸控跳躍是「按一下」
  }

  // 換槍目標：數字鍵 > Q（上一把）> 滾輪；手雷用完就跳過
  pickSlot() {
    let sw = null;
    SLOT_KEYS.forEach((code, i) => { if (this.consumePressed(code)) sw = i; });
    if (this.consumePressed('KeyQ')) sw = this.lastSlot;
    if (this.mouse.wheel) {
      const step = this.mouse.wheel > 0 ? 1 : -1;
      this.mouse.wheel = 0;
      let n = this.slot;
      for (let tries = 0; tries < 4; tries++) {
        n = (n + step + 4) % 4;
        if (this.inv[n] && !this.isEmptyNade(n)) break;
      }
      sw = n;
    }
    if (sw !== null && this.isEmptyNade(sw)) { this.game.hud.toast('沒有手雷了', 1.2); sw = null; }
    return sw;
  }

  isEmptyNade(slot) {
    const w = this.inv[slot];
    return !!w && w.def.type === 'grenade' && w.mag <= 0;
  }

  readWeapon(dt) {
    const sw = this.pickSlot();
    const firePressed = this.mouse.lp || this.touch.firePressed;
    const altPressed = this.mouse.rp;
    this.mouse.lp = this.mouse.rp = false;
    this.touch.firePressed = false;
    this.weaponUpdate(dt, {
      fire: this.mouse.l || this.touch.fire, firePressed,
      alt: this.mouse.r, altPressed,
      reload: this.consumePressed('KeyR'),
      sw,
    });
  }

  updateCamera(dt) {
    const g = this.game, cam = g.renderer.camera;

    if (!this.alive) {
      const dc = this.deathCam;
      if (dc) {
        dc.t += dt;
        const k = Math.min(1, dc.t * 1.2), e = 1 - Math.pow(1 - k, 3);   // ease-out：先快後慢
        cam.position.lerpVectors(dc.from, dc.to, e);
        if (dc.killer?.alive) dc.look.lerp(dc.killer.soldier.headWorld(_head), Math.min(1, dt * 3));
        cam.lookAt(dc.look);
      }
      cam.fov += (g.opts.fov - cam.fov) * Math.min(1, dt * 8);
      cam.updateProjectionMatrix();
      return;
    }

    // 走路晃動：上下兩拍、左右一拍（8 字形），開鏡時幾乎不晃
    const sp = this.onGround ? this.speed : 0;
    if (sp > 0.5) this.bobT += dt * (6 + sp * 0.9);
    const amt = Math.min(1, sp / 6) * (this.scoped ? 0.2 : 1);
    const bobY = Math.abs(Math.sin(this.bobT)) * 0.028 * amt;
    const bobX = Math.cos(this.bobT) * 0.012 * amt;

    // 落地下沉：落下越快沉越多
    if (this.landed && this.landSpeed > 3) this.land = Math.min(0.14, this.landSpeed * 0.012);
    this.land *= Math.exp(-dt * 7);

    const shake = g.fx.shake * 0.06;
    const jitter = () => (Math.random() - 0.5) * shake;
    this.eye(cam.position);
    const s = Math.sin(this.yaw), c = Math.cos(this.yaw);
    cam.position.x += c * bobX + jitter();
    cam.position.y += bobY - this.land + jitter();
    cam.position.z += -s * bobX;

    // 側移與滑鏟時鏡頭微傾
    const strafe = (this.keys.has('KeyA') ? 1 : 0) - (this.keys.has('KeyD') ? 1 : 0);
    const rollTarget = strafe * 0.008 + (this.slideT > 0 ? 0.05 : 0);
    this.camRoll += (rollTarget - this.camRoll) * Math.min(1, dt * 6);

    cam.rotation.order = 'YXZ';
    cam.rotation.set(this.pitch + this.punchP * 0.75 + this.aimPunch, this.yaw + this.punchY * 0.75, this.camRoll);

    // 視野：狙擊鏡兩段放大，開鏡瞬間切換、關鏡平滑還原
    const w = this.weapon;
    const fov = w && w.def.type === 'sniper' && this.scoped ? w.def.zoom[this.scoped - 1] : g.opts.fov;
    cam.fov += (fov - cam.fov) * (this.scoped ? 1 : Math.min(1, dt * 10));
    cam.updateProjectionMatrix();
  }

  startDeathCam(killer) {
    const cam = this.game.renderer.camera;
    const head = this.pos.clone().add(new THREE.Vector3(0, 1.2, 0));
    // 往身後上方拉開 2.2 m，碰到牆就停在牆前
    const back = new THREE.Vector3(Math.sin(this.yaw) * 2.2, 1.4, Math.cos(this.yaw) * 2.2);
    const dist = back.length();
    back.divideScalar(dist);
    const hit = this.game.world.raycast(head.x, head.y, head.z, back.x, back.y, back.z, dist, 'move');
    const to = head.clone().addScaledVector(back, hit ? Math.max(0.2, hit.t - 0.35) : dist);
    this.deathCam = {
      t: 0, from: cam.position.clone(), to,
      look: this.pos.clone().add(new THREE.Vector3(0, 0.4, 0)),
      killer: killer && killer !== this ? killer : null,
    };
    this.soldier.root.visible = true;
  }
}
