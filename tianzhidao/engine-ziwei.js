/* ============================================================
 * 天知道 · 紫微斗數層 (Layer 3)
 * 依賴瀏覽器全域 iztro (CDN)，十二宮全解 + 四化 + 三方四正
 * 在 Node 無 iztro 時退回 null（由 UI 判斷顯示）
 * ============================================================ */

export const PALACE_ORDER = ["命宮","兄弟","夫妻","子女","財帛","疾厄","遷移","僕役","官祿","田宅","福德","父母"];
export const PALACE_DESC = {
  命宮:"先天性格、人生主軸與整體格局",
  兄弟:"手足、同儕、合夥與人際支援",
  夫妻:"婚姻、感情、配偶特質與互動",
  子女:"子女、晚輩、創造力與桃花",
  財帛:"理財能力、財運來源與金錢觀",
  疾厄:"健康、體質、情緒與壓力反應",
  遷移:"外出運、人際際遇與外在表現",
  僕役:"部屬、朋友、人脈與助力(交友宮)",
  官祿:"事業、職涯、地位與工作表現",
  田宅:"不動產、家庭環境與守財能力",
  福德:"福報、精神生活、興趣與晚年",
  父母:"父母緣、長輩、上司與文書學業"
};
/* 主星簡義（自己的文案） */
export const STAR_DESC = {
  紫微:"帝王之星，主尊貴、領導、自尊，喜輔星相佐",
  天機:"智慧之星，主機敏、謀略、善變、宗教緣",
  太陽:"光明之星，主博愛、付出、名聲、男性緣",
  武曲:"財星將星，主剛毅、執行、財帛、決斷",
  天同:"福德之星，主溫和、享福、人緣、孩子氣",
  廉貞:"次桃花囚星，主多才、變動、公關、感情豐富",
  天府:"財庫之星，主穩重、保守、能容、善理財",
  太陰:"財星母星，主溫柔、細膩、田宅、女性緣",
  貪狼:"桃花慾望之星，主多才多藝、交際、慾望、運動",
  巨門:"暗星口星，主口才、研究、是非、專業",
  天相:"印星輔佐，主忠誠、協調、衣食、貴氣",
  天梁:"蔭星壽星，主庇蔭、原則、長者風、化解",
  七殺:"將星，主剛烈、開創、衝勁、獨立",
  破軍:"耗星，主開創、變革、破舊立新、波動"
};
/* 四化簡義 */
export const SIHUA_DESC = {
  祿:"化祿—財祿、順遂、好處所在，主增益",
  權:"化權—權力、能力、掌控，主強勢發揮",
  科:"化科—名聲、貴人、文書，主聲譽與化解",
  忌:"化忌—執著、阻礙、是非，主牽絆與功課所在"
};

/* 從 iztro astrolabe 物件萃取十二宮結構 */
export function extractZiwei(astrolabe){
  if(!astrolabe) return null;
  try{
    const palaces = PALACE_ORDER.map(name=>{
      let p;
      try{ p = astrolabe.palace(name); }catch(e){ p=null; }
      if(!p) return {name, desc:PALACE_DESC[name], majorStars:[], minorStars:[], empty:true};
      const major=(p.majorStars||[]).map(s=>({
        name:s.name, brightness:s.brightness||"", mutagen:s.mutagen||"",
        desc:STAR_DESC[s.name]||""
      }));
      const minor=(p.minorStars||[]).map(s=>({name:s.name, mutagen:s.mutagen||""}));
      const adj=(p.adjectiveStars||[]).map(s=>s.name);
      return {
        name, heavenlyStem:p.heavenlyStem, earthlyBranch:p.earthlyBranch,
        desc:PALACE_DESC[name],
        majorStars:major, minorStars:minor, adjStars:adj,
        empty: major.length===0
      };
    });
    return {
      palaces,
      soul: astrolabe.soul,         // 命主
      body: astrolabe.body,         // 身主
      fiveElementsClass: astrolabe.fiveElementsClass,  // 五行局
      sign: astrolabe.sign,
      zodiac: astrolabe.zodiac,
      earthlyBranchOfSoulPalace: astrolabe.earthlyBranchOfSoulPalace,
      earthlyBranchOfBodyPalace: astrolabe.earthlyBranchOfBodyPalace
    };
  }catch(e){
    return null;
  }
}
