// 樹義國小校園對戰：程式進入點
import { Game } from './game.js';

function showBootError(err) {
  console.error(err);
  const msg = err?.message || String(err);
  const box = document.getElementById('loadTxt');
  if (box) box.textContent = `無法啟動遊戲：${msg}。請改用新版 Chrome、Edge 或 Safari，並確認瀏覽器已開啟 WebGL。`;
}

new Game().init().catch(showBootError);
