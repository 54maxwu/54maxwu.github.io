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

/* 輔星/雜曜亮度與類型對照（type→白話標籤、給 UI 上色用） */
export const STAR_TYPE_LABEL = {
  soft:"吉輔",     // 左輔右弼文昌文曲等六吉
  tough:"凶煞",    // 擎羊陀羅火星鈴星等六煞
  adjective:"雜曜",
  flower:"桃花",
  helper:"助曜",
  lucun:"祿存",
  tianma:"天馬"
};
/* 博士十二神白話（隨祿存起，順逆排）*/
export const BOSHI12_DESC = {
  博士:"聰明、才學，主智慧",力士:"權勢、爭強",青龍:"喜慶、財氣",小耗:"小破財、耗損",
  將軍:"威武、衝勁",奏書:"文書、福氣",飛廉:"小人、是非",喜神:"喜事、人緣",
  病符:"疾病、晦氣",大耗:"大破財、變動",伏兵:"暗中阻礙、小人",官符:"官非、口舌"
};

/* 把單一宮位物件轉成精簡資料（主星/輔星/雜曜/各神煞/大限小限/標記） */
function packPalace(p, name){
  if(!p) return {name, desc:PALACE_DESC[name], majorStars:[], minorStars:[], adjStars:[], empty:true};
  const major=(p.majorStars||[]).map(s=>({
    name:s.name, brightness:s.brightness||"", mutagen:s.mutagen||"",
    desc:STAR_DESC[s.name]||""
  }));
  const minor=(p.minorStars||[]).map(s=>({
    name:s.name, brightness:s.brightness||"", mutagen:s.mutagen||"", type:s.type||""
  }));
  const adj=(p.adjectiveStars||[]).map(s=>({name:s.name, type:s.type||"adjective"}));
  return {
    name: name||p.name,
    heavenlyStem:p.heavenlyStem, earthlyBranch:p.earthlyBranch,
    desc:PALACE_DESC[name||p.name],
    majorStars:major, minorStars:minor, adjStars:adj,
    // —— 排盤明細（iztro 原生，對齊專業排盤軟體）——
    changsheng12: p.changsheng12||"",   // 長生十二神（長生沐浴冠帶…）
    boshi12: p.boshi12||"",             // 博士十二神（博士力士青龍…）
    jiangqian12: p.jiangqian12||"",     // 將前十二神（將星攀鞍歲驛…）
    suiqian12: p.suiqian12||"",         // 歲前十二神（歲建晦氣喪門…）
    decadal: p.decadal?{range:p.decadal.range, stem:p.decadal.heavenlyStem, branch:p.decadal.earthlyBranch}:null, // 大限
    ages: p.ages||[],                  // 小限歲數（虛歲列表）
    isBodyPalace: !!p.isBodyPalace,    // 是否身宮
    isOriginalPalace: !!p.isOriginalPalace, // 是否來因宮
    empty: major.length===0
  };
}

/* 從 iztro astrolabe 物件萃取十二宮結構（含全套排盤明細） */
export function extractZiwei(astrolabe){
  if(!astrolabe) return null;
  try{
    const palaces = PALACE_ORDER.map(name=>{
      let p;
      try{ p = astrolabe.palace(name); }catch(e){ p=null; }
      return packPalace(p, name);
    });
    // 來因宮（生年天干所落之宮）：標出宮名
    let originPalace="";
    palaces.forEach(p=>{ if(p.isOriginalPalace) originPalace=p.name; });
    return {
      palaces,
      soul: astrolabe.soul,         // 命主
      body: astrolabe.body,         // 身主
      fiveElementsClass: astrolabe.fiveElementsClass,  // 五行局
      sign: astrolabe.sign,
      zodiac: astrolabe.zodiac,
      lunarDate: astrolabe.lunarDate,
      chineseDate: astrolabe.chineseDate,
      earthlyBranchOfSoulPalace: astrolabe.earthlyBranchOfSoulPalace,
      earthlyBranchOfBodyPalace: astrolabe.earthlyBranchOfBodyPalace,
      originPalace
    };
  }catch(e){
    return null;
  }
}

/* 從 astrolabe 算指定日期的運限（大限/小限/流年/流月/流日）。
 * 回傳各 scope 的：命宮所在地支、十二宮輪轉名、四化星、流曜分布。
 * dateStr: "YYYY-M-D"；timeIdx: 時辰序 0-12（流時用，可省）。*/
export function buildHoroscope(astrolabe, dateStr, timeIdx){
  if(!astrolabe || typeof astrolabe.horoscope!=="function") return null;
  try{
    const h = astrolabe.horoscope(dateStr, timeIdx==null?0:timeIdx);
    const PN_ORDER=["命宮","兄弟","夫妻","子女","財帛","疾厄","遷移","僕役","官祿","田宅","福德","父母"];
    // 把 iztro 一個 scope（含 palaceNames / mutagen / stars[index] / 起始 branch+index）整理好
    const pack=(sc)=>{
      if(!sc) return null;
      // sc.palaceNames：以「地支序」為索引，列出該運限下每個地支宮的「運限宮名」
      // sc.index：該運限命宮落在第幾個地支宮（0=寅起算依 iztro 內部，用 palaceNames 對應即可）
      const stars=(sc.stars||[]).map(arr=>(arr||[]).map(s=>({name:s.name, type:s.type||""})));
      return {
        name: sc.name||"",
        stem: sc.heavenlyStem||"", branch: sc.earthlyBranch||"",
        index: sc.index,
        palaceNames: sc.palaceNames||[],   // 運限十二宮名（依地支序）
        mutagen: sc.mutagen||[],           // 該運限四化星 [祿,權,科,忌]
        stars,                             // 該運限飛入的流曜（依地支序）
        nominalAge: sc.nominalAge,         // 小限虛歲
        decStar: sc.yearlyDecStar||null    // 流年的歲前/將前十二神（流年限定）
      };
    };
    return {
      solarDate: h.solarDate, lunarDate: h.lunarDate,
      decadal: pack(h.decadal),   // 大限
      age: pack(h.age),           // 小限
      yearly: pack(h.yearly),     // 流年
      monthly: pack(h.monthly),   // 流月
      daily: pack(h.daily),       // 流日
      hourly: pack(h.hourly)      // 流時
    };
  }catch(e){
    return null;
  }
}
