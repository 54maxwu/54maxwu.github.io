// 樹義國小校園對戰：角色事件 → 音效與畫面反應
//
// 掛到 Game 上（Object.assign(Game.prototype, events)），由 Actor／Player 在動作發生時呼叫。
// 玩家本人的聲音不定位（null），其他人的聲音放在他所在的位置。
import { audio } from './audio.js';

const where = (a) => (a.isPlayer ? null : a.pos.clone());
const surface = (a) => a.ground?.surface || 'metal';

export const events = {
  onJump(a) { audio.playJump(where(a)); },

  onLand(a, speed) { audio.playLand(where(a), surface(a), Math.min(1, speed / 10)); },

  onSlide(a) {
    if (a.isPlayer || this.hearable(a, 30)) audio.playSlide(where(a), surface(a));
  },

  onMantle(a, rise) {
    if (!a.isPlayer) return;
    audio.playJump(null);
    if (!a.weapon.reloading) this.vm.equip(a.weapon.id, 0.3 + rise * 0.2);   // 翻越時武器放低再舉起
  },

  // 跑步腳步聲：30 m 外聽不到；不是靜步的話，12 m 內的敵方電腦也會聽到
  onFootstep(a) {
    if (!a.isPlayer && !this.hearable(a, 30)) return;
    audio.playFootstep(where(a), surface(a), { run: true, crouch: a.crouch });
    if (!a.walk) this.alertBots(a.pos, a.team, 12, false);
  },

  onSwitch(a) {
    if (!a.isPlayer) return;
    this.vm.equip(a.weapon.id, a.weapon.def.draw);
    audio.playWeaponSwitch(a.weapon.id);
    this.hud.slots(a.inv, a.slot);
  },

  // 換彈音效依動畫節奏排程：一般槍是退匣、裝匣、（空匣時）拉槍機；泵動霰彈槍一發一發裝
  onReloadStart(a, empty) {
    if (!a.isPlayer) return;
    const d = a.weapon.def, t = this.time, id = d.id, dur = d.reload;
    this.vm.reload(dur, empty);
    const at = (k, part) => this.after(t + dur * k, () => audio.playReload(id, part));
    if (d.pump) {
      for (let i = 0; i < 4; i++) at(0.2 + i * 0.18, 'shell');
      if (empty) { at(0.87, 'boltback'); at(0.93, 'boltforward'); }
      return;
    }
    at(0.2, 'magout');
    at(0.6, 'magin');
    if (empty) { at(0.82, id === 'awm' ? 'bolt' : 'boltback'); at(0.88, 'boltforward'); }
  },

  onReloadDone() {},
  onScope(a) { if (a.isPlayer) audio.playScope(a.scoped > 0); },
  onDryFire(a) { if (a.isPlayer) audio.playDryFire(); },
  onGrenadeStart(a) {
    if (!a.isPlayer) return;
    this.vm.throwNade();
    audio.playGrenadePin();
  },

  hearable(a, range) { return a.pos.distanceTo(this.renderer.camera.position) <= range; },
};
