/* ============================================================
 * 天知道 · 合盤層 (Layer 5)
 * 雙人八字配對：日主生剋 / 生肖合沖 / 五行互補 / 十神互動 / 用神互助
 * ============================================================ */
import { GAN_WX, GAN_YY } from "./engine-calendar.js";
import { SHENG, KE, tenGod, SHISHEN_DESC } from "./engine-bazi.js";
import { sxRelation } from "./engine-aux.js";

/* 日主生剋關係解讀 */
function dayMasterRelation(ganA, ganB){
  const wxA=GAN_WX[ganA], wxB=GAN_WX[ganB];
  const sameYY=GAN_YY[ganA]===GAN_YY[ganB];
  if(wxA===wxB){
    return {type:"比和", level: sameYY?1:2,
      desc: sameYY?"雙方同性同氣，理念相近、易懂彼此，惟需防競爭與各持己見"
                 :"雙方同氣而陰陽相濟，志同道合又能互補，是相知相惜的組合"};
  }
  if(SHENG[wxA]===wxB) return {type:"我生對方",level:1,desc:`你（${wxA}）生對方（${wxB}），你較願付出照顧，宜注意付出與回報的平衡`};
  if(SHENG[wxB]===wxA) return {type:"對方生我",level:2,desc:`對方（${wxB}）生你（${wxA}），對方多予你滋養支持，你能從這段關係得到力量`};
  if(KE[wxA]===wxB) return {type:"我剋對方",level:0,desc:`你（${wxA}）剋對方（${wxB}），你在關係中較主導，宜溫柔以待、避免壓制`};
  if(KE[wxB]===wxA) return {type:"對方剋我",level:0,desc:`對方（${wxB}）剋你（${wxA}），對方較主導，你需要的是被尊重而非被管束`};
  return {type:"平",level:1,desc:"日主關係平和"};
}

/* 五行互補：A 缺的 B 是否補得上 */
function wuxingComplement(tallyA, tallyB){
  const wxs=["木","火","土","金","水"];
  // 找A最弱兩行
  const weakA=[...wxs].sort((a,b)=>tallyA[a]-tallyA[b]).slice(0,2);
  const weakB=[...wxs].sort((a,b)=>tallyB[a]-tallyB[b]).slice(0,2);
  // B在A弱項上是否充足（>平均）
  const avgB=wxs.reduce((s,w)=>s+tallyB[w],0)/5;
  const avgA=wxs.reduce((s,w)=>s+tallyA[w],0)/5;
  let aGetFromB=weakA.filter(w=>tallyB[w]>avgB);
  let bGetFromA=weakB.filter(w=>tallyA[w]>avgA);
  const score=(aGetFromB.length+bGetFromA.length); // 0~4
  return {
    weakA, weakB, aGetFromB, bGetFromA, score,
    desc: score>=3 ? "雙方五行高度互補，你缺的對方有、對方缺的你有，是天作之合的補位關係"
        : score===2 ? "雙方五行有不錯的互補，彼此能補足部分欠缺"
        : score===1 ? "五行互補有限，部分能互助，部分需各自留意"
        : "五行互補較弱，相同的欠缺需要彼此提醒、共同補強"
  };
}

/* 用神互助：B 的五行是否落在 A 的喜用 */
function yongMutual(yongA, tallyB, yongB, tallyA){
  const wxs=["木","火","土","金","水"];
  const avgB=wxs.reduce((s,w)=>s+tallyB[w],0)/5;
  const avgA=wxs.reduce((s,w)=>s+tallyA[w],0)/5;
  const bHelpsA=yongA.primary.filter(w=>tallyB[w]>avgB);
  const aHelpsB=yongB.primary.filter(w=>tallyA[w]>avgA);
  // 是否踩到對方忌神
  const bHurtsA=yongA.avoid.filter(w=>tallyB[w]>avgB*1.3);
  const aHurtsB=yongB.avoid.filter(w=>tallyA[w]>avgA*1.3);
  const score=(bHelpsA.length+aHelpsB.length) - (bHurtsA.length+aHurtsB.length)*0.5;
  return {
    bHelpsA, aHelpsB, bHurtsA, aHurtsB, score,
    desc: score>=2 ? "對方的五行氣場正補你所需之喜用，彼此是命理上的旺運貴人，能互相帶旺"
        : score>=1 ? "對方在你的喜用上有一定助力，相處有助運勢"
        : score<=-1 ? "雙方氣場部分相沖（踩到彼此忌神），需有意識地給對方空間與包容"
        : "用神互助普通，關係的好壞更取決於彼此經營"
  };
}

/* 十神互動：對方日主在你命中是什麼十神（關係定位） */
function shishenInteraction(dGanA, dGanB){
  const aSeesB=tenGod(dGanA, dGanB); // 對方對你而言是什麼十神
  const bSeesA=tenGod(dGanB, dGanA);
  const roleDesc=(god)=>{
    if(!god) return "氣場相近";
    const map={
      正官:"對方像你的「正官」——帶來規範感與責任，是能讓你穩定、進入承諾的對象",
      七殺:"對方像你的「七殺」——帶來壓力也帶來成長，是讓你又愛又敬、被推著前進的對象",
      正財:"對方像你的「正財」——務實穩定、可掌握，是適合長久經營、過日子的對象",
      偏財:"對方像你的「偏財」——帶來新鮮與機會感，相處輕鬆但需用心守住",
      正印:"對方像你的「正印」——給你滋養與安全感，是會照顧你、像靠山的對象",
      偏印:"對方像你的「偏印」——獨特而有距離美，吸引你也需要彼此空間",
      食神:"對方像你的「食神」——讓你放鬆、開心、有口福，相處愉快自在",
      傷官:"對方像你的「傷官」——才華洋溢、讓你眼睛一亮，刺激但需磨合脾性",
      比肩:"對方像你的「比肩」——像戰友、像兄弟姊妹，理解彼此但要分清你我",
      劫財:"對方像你的「劫財」——氣場強烈、亦敵亦友，吸引中帶著拉扯"
    };
    return map[god]||SHISHEN_DESC[god];
  };
  return { aSeesB, bSeesA, aDesc:roleDesc(aSeesB), bDesc:roleDesc(bSeesA) };
}

/* ============================================================
 * 主合盤函式
 * @param A,B  fullBaziAnalysis 的結果（含 bz, tally, yong）
 * ============================================================ */
export function coupleAnalysis(A, B){
  const dayRel = dayMasterRelation(A.bz.dGan, B.bz.dGan);
  const sxRel  = sxRelation(A.bz.yZhi, B.bz.yZhi);
  const comp   = wuxingComplement(A.tally, B.tally);
  const yong   = yongMutual(A.yong, B.tally, B.yong, A.tally);
  const shishen= shishenInteraction(A.bz.dGan, B.bz.dGan);

  // 綜合契合度（加權 0-100）
  // 日主關係 25% + 生肖 20% + 五行互補 25% + 用神互助 30%
  const dayScore  = (dayRel.level/2)*100;          // 0~100
  const sxScore   = ((sxRel.level+2)/4)*100;        // -2~2 → 0~100
  const compScore = (comp.score/4)*100;             // 0~100
  const yongScore = Math.max(0,Math.min(100,(yong.score+1)/3*100));
  const overall = Math.round(
    dayScore*0.25 + sxScore*0.20 + compScore*0.25 + yongScore*0.30
  );
  const grade =
    overall>=85 ? {label:"天作之合",hint:"命理契合度極高，是難得的良緣，珍惜彼此"} :
    overall>=70 ? {label:"佳偶良配",hint:"整體相當契合，用心經營能長長久久"} :
    overall>=55 ? {label:"互補成長",hint:"有契合也有差異，差異正是彼此成長的養分"} :
    overall>=40 ? {label:"磨合有緣",hint:"需要較多包容與溝通，緣分要靠雙方一起守"} :
                  {label:"挑戰之緣",hint:"命理差異較大，但命理非絕對，真心與努力能改寫"};

  // 相處建議
  const advice=[];
  if(dayRel.level<=0) advice.push(dayRel.desc.split("，").slice(-1)[0]);
  if(sxRel.level<0) advice.push(sxRel.desc.split("，").slice(-1)[0]);
  if(yong.bHurtsA.length||yong.aHurtsB.length) advice.push("注意彼此忌神相沖，情緒上來時給對方一點空間");
  if(comp.score>=2) advice.push("善用五行互補的優勢，分工合作會比單打獨鬥更順");
  if(advice.length===0) advice.push("命理基礎良好，把握相處節奏、真誠以待即可");

  return {
    overall, grade,
    dayRel, sxRel, comp, yong, shishen,
    breakdown:{ day:Math.round(dayScore), sx:Math.round(sxScore),
                complement:Math.round(compScore), yong:Math.round(yongScore) },
    advice
  };
}
