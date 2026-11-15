// 擊殺回放的時間軸（elapsed＝回放播了幾秒 → 回到陣亡前後的第幾秒，0＝致命一擊）
//   鏡頭一 0.0～2.2  擊殺者：越肩鏡頭，0.2× 慢動作
//   鏡頭二 2.2～4.4  子彈時間：追著子彈飛，約 0.16×
//   鏡頭三 4.4～4.8  命中定格（hit-stop）
//   鏡頭四 4.8～結束  倒下：低角度環繞，從 0.2× 慢慢加速回接近正常速度（speed ramp）
export const SHOT = { bullet: 2.2, impact: 4.4, fall: 4.8, fade: 8.9 };
export const REPLAY_DURATION = 9.4;
// 陣亡後還要繼續錄多久（倒下鏡頭最多播到這裡）
export const REPLAY_AFTER = 2.7;

export function replayTime(e) {
  if (e < SHOT.bullet) return -0.8 + Math.max(0, e) * 0.2;
  if (e < SHOT.impact) return -0.36 + (e - SHOT.bullet) * (0.36 / (SHOT.impact - SHOT.bullet));
  if (e < SHOT.fall) return 0;
  const u = e - SHOT.fall;
  return Math.min(REPLAY_AFTER - 0.05, 0.2 * u + 0.075 * u * u);
}

// 目前的播放速度（給畫面上的倍率字樣）
export function replaySpeed(e) {
  if (e < SHOT.bullet) return 0.2;
  if (e < SHOT.impact) return 0.36 / (SHOT.impact - SHOT.bullet);
  if (e < SHOT.fall) return 0;
  return 0.2 + 0.15 * (e - SHOT.fall);
}
