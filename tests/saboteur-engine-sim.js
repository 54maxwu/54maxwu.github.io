// 矮人礦坑 規則引擎煙霧測試：
//   從 矮人礦坑.html 抽出 /*==ENGINE-START==*/../*==ENGINE-END==*/ 引擎，
//   全 AI 跑大量完整牌局，驗證不變量。用法：node tests/saboteur-engine-sim.js
// 不變量：
//   - AI 產生的每一手都合法（applyMove ok）
//   - 每回合在步數上限內結束、每局恰好 3 回合
//   - 金塊總量守恆（玩家累計 + 金堆 = 44）
//   - 破壞者分贓不超付（單人 4、2-3 人各 3、4 人各 2）
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', '矮人礦坑.html'), 'utf8');
const s = src.indexOf('/*==ENGINE-START==*/');
const e = src.indexOf('/*==ENGINE-END==*/');
if (s < 0 || e < 0) { console.error('FAIL: engine markers not found'); process.exit(1); }
const enginePath = path.join(__dirname, '.engine.extracted.js');
fs.writeFileSync(enginePath, src.slice(s, e) + '\nmodule.exports = SAB;\n');
const SAB = require(enginePath);

let fail = 0, illegal = 0, stalls = 0, overpay = 0;
const winBy = { gold: 0, exhaust: 0 };
const SEEDS = 200;

for (let seed = 1; seed <= SEEDS; seed++) {
  for (let n = 4; n <= 8; n++) {
    const names = Array.from({ length: n }, (_, i) => 'P' + i);
    const G = SAB.newGame(names, names.map(() => true), (seed * 977 + n) >>> 0);
    let rounds = 0;
    while (G.phase !== 'end') {
      SAB.newRound(G);
      rounds++;
      let moves = 0;
      while (G.phase === 'play') {
        const mv = SAB.aiChooseMove(G, G.turn);
        const r = SAB.applyMove(G, G.turn, mv);
        if (!r.ok) {
          illegal++;
          console.error('ILLEGAL AI MOVE', { seed, n, err: r.err, mv });
          const fb = G.players[G.turn].hand.length ? { type: 'discard', hi: 0 } : { type: 'pass' };
          if (!SAB.applyMove(G, G.turn, fb).ok) { console.error('STUCK'); fail++; break; }
        }
        if (++moves > 5000) { stalls++; console.error('STALL', { seed, n, round: G.round }); break; }
      }
      const res = G.lastResult;
      if (res) {
        winBy[res.why] = (winBy[res.why] || 0) + 1;
        if (res.why !== 'gold') {
          const sabN = res.roles.filter(x => x === 'sab').length;
          const per = sabN === 1 ? 4 : (sabN <= 3 ? 3 : 2);
          for (const sh of res.shares) if (sh.gold > per) { overpay++; console.error('OVERPAY', { seed, n, sh, per }); }
        }
      }
      if (rounds > 3) { console.error('rounds>3!', { seed, n }); fail++; break; }
    }
    const total = G.players.reduce((a, p) => a + p.gold, 0) + G.goldPile.reduce((a, v) => a + v, 0);
    if (total !== 44) { console.error('GOLD NOT CONSERVED', { seed, n, total }); fail++; }
  }
}

try { fs.unlinkSync(enginePath); } catch (err) {}
console.log(`games: ${SEEDS * 5}  rounds: ${winBy.gold + winBy.exhaust}  dig(gold): ${winBy.gold}  sab(exhaust): ${winBy.exhaust}`);
console.log(`illegal: ${illegal}  stalls: ${stalls}  overpay: ${overpay}  hard fails: ${fail}`);
const bad = fail + illegal + stalls + overpay;
console.log(bad ? 'FAIL' : 'PASS');
process.exit(bad ? 1 : 0);
