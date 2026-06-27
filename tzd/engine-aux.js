/* ============================================================
 * 天知道 · 輔助層 (Layer 4)
 * 生肖(三合六合六沖相刑相害) / 星座(太陽+上升) / 姓名五格三才
 * ============================================================ */
import { ZHI, GAN } from "./engine-calendar.js";

/* ---------- 生肖 ---------- */
export const SHENGXIAO = ["鼠","牛","虎","兔","龍","蛇","馬","羊","猴","雞","狗","豬"];
export const SX_TRAIT = {
  鼠:"機敏靈活、善於應變，財路多元，惟稍欠耐性",
  牛:"勤懇踏實、堅毅可靠，根基厚實，惟略顯固執",
  虎:"果敢有衝勁、領袖氣場強，惟易衝動、不服管束",
  兔:"溫和細膩、人緣通達、品味佳，惟偏謹慎保守",
  龍:"志氣高遠、自信大器、貴人運強，惟易過於理想",
  蛇:"思慮深沉、謀定後動、直覺敏銳，惟略多疑",
  馬:"熱情奔放、行動力強、social能手，惟易三分鐘熱度",
  羊:"柔韌有恆、富藝術感與同理心，惟易猶豫多慮",
  猴:"聰穎多變、機智過人、應變極快，惟易投機浮動",
  雞:"勤勉精明、條理分明、注重細節，惟易挑剔好辯",
  狗:"忠義可靠、責任心重、守正不阿，惟易操心多慮",
  豬:"寬厚隨和、知足有福、衣食無缺，惟略缺危機感"
};
const ZHI2SX = z => SHENGXIAO[ZHI.indexOf(z)];

/* 地支關係表 */
const SANHE = {申:["子","辰"],子:["申","辰"],辰:["申","子"], 寅:["午","戌"],午:["寅","戌"],戌:["寅","午"],
  亥:["卯","未"],卯:["亥","未"],未:["亥","卯"], 巳:["酉","丑"],酉:["巳","丑"],丑:["巳","酉"]};
const LIUHE = {子:"丑",丑:"子",寅:"亥",亥:"寅",卯:"戌",戌:"卯",辰:"酉",酉:"辰",巳:"申",申:"巳",午:"未",未:"午"};
const LIUCHONG = {子:"午",午:"子",丑:"未",未:"丑",寅:"申",申:"寅",卯:"酉",酉:"卯",辰:"戌",戌:"辰",巳:"亥",亥:"巳"};
const LIUHAI = {子:"未",未:"子",丑:"午",午:"丑",寅:"巳",巳:"寅",卯:"辰",辰:"卯",申:"亥",亥:"申",酉:"戌",戌:"酉"};
const XIANG_XING = {子:["卯"],卯:["子"], 寅:["巳"],巳:["申"],申:["寅"], 丑:["戌"],戌:["未"],未:["丑"],
  辰:["辰"],午:["午"],酉:["酉"],亥:["亥"]}; // 含自刑

export function shengXiaoInfo(yearZhi){
  const sx=ZHI2SX(yearZhi);
  const he3=SANHE[yearZhi]?.map(ZHI2SX)||[];
  const he6=ZHI2SX(LIUHE[yearZhi]);
  const chong=ZHI2SX(LIUCHONG[yearZhi]);
  const hai=ZHI2SX(LIUHAI[yearZhi]);
  const xing=(XIANG_XING[yearZhi]||[]).map(ZHI2SX);
  return {
    sx, zhi:yearZhi, trait:SX_TRAIT[sx],
    sanhe:he3,        // 三合（最佳助力）
    liuhe:he6,        // 六合（貴人）
    chong,            // 六沖（最不合）
    hai,              // 相害
    xing              // 相刑/自刑
  };
}

/* 兩生肖關係（合盤用） */
export function sxRelation(zhiA, zhiB){
  if(LIUCHONG[zhiA]===zhiB) return {type:"六沖",level:-2,desc:"生肖相沖，個性、節奏差異大，需多包容磨合"};
  if((XIANG_XING[zhiA]||[]).includes(zhiB) && zhiA!==zhiB) return {type:"相刑",level:-1,desc:"生肖相刑，易因小事生摩擦，宜就事論事"};
  if(LIUHAI[zhiA]===zhiB) return {type:"相害",level:-1,desc:"生肖相害，相處易有暗耗，需坦誠溝通"};
  if(LIUHE[zhiA]===zhiB) return {type:"六合",level:2,desc:"生肖六合，天生投緣、互為貴人，相處融洽"};
  if((SANHE[zhiA]||[]).includes(zhiB)) return {type:"三合",level:2,desc:"生肖三合，志趣相投、彼此助力，是極佳組合"};
  if(zhiA===zhiB) return {type:"同肖",level:1,desc:"同生肖，氣味相投、容易理解，惟也易同質競爭"};
  return {type:"平",level:0,desc:"生肖無特殊刑沖合害，relationship 看其餘命理因素"};
}

/* ---------- 星座 ---------- */
export function sunSign(m,d){
  const z=[["摩羯",1,20],["水瓶",2,19],["雙魚",3,20],["牡羊",4,20],["金牛",5,21],
   ["雙子",6,21],["巨蟹",7,22],["獅子",8,23],["處女",9,23],["天秤",10,23],
   ["天蠍",11,22],["射手",12,21],["摩羯",12,31]];
  for(const[s,mm,dd]of z){ if(m<mm||(m===mm&&d<=dd)) return s; }
  return "摩羯";
}
export const SIGN_TRAIT={
  摩羯:"務實堅毅、目標導向、晚運漸盛，是天生的長期主義者",
  水瓶:"獨立創新、思想超前、博愛理性，走在時代前面",
  雙魚:"敏感多情、直覺靈通、想像力豐沛，富藝術與同理心",
  牡羊:"衝勁十足、直率果決、先機在握，是行動派先鋒",
  金牛:"穩健務實、重視安穩、審美佳，善聚財守成",
  雙子:"靈活善言、好奇多元、學習力強，多方發展",
  巨蟹:"重情顧家、敏感體貼、防衛心強，內守有福",
  獅子:"自信大器、熱情慷慨、舞台運強，天生領袖魅力",
  處女:"細膩精準、analytical、追求完美，務實謹慎",
  天秤:"和諧優雅、善於協調、重視關係，貴人緣佳",
  天蠍:"深沉專注、洞察力強、愛恨分明，爆發力驚人",
  射手:"樂觀好奇、嚮往自由、行運遼闊，是天生的探險家"
};
/* 簡易上升星座（需出生時間）：以出生月日定太陽宮，每2小時推進一宮 */
const SIGNS12=["牡羊","金牛","雙子","巨蟹","獅子","處女","天秤","天蠍","射手","摩羯","水瓶","雙魚"];
export function risingSign(m,d,hour){
  if(hour==null||hour<0) return null;
  const sun=sunSign(m,d);
  // 以日出約6點時上升≈太陽星座，每2小時推進一宮（近似法）
  let base=SIGNS12.indexOf(sun);
  if(base<0) base=0;
  const steps=Math.floor(((hour-6+24)%24)/2);
  return SIGNS12[(base+steps)%12];
}

/* ---------- 姓名五格 + 三才 ---------- */
/* 常用姓氏與名字筆畫（康熙字典筆畫，部分） */
const STROKES = {
  "王":5,"李":7,"張":11,"陳":16,"林":8,"黃":12,"劉":15,"吳":7,"蔡":17,"楊":13,
  "許":11,"鄭":19,"謝":17,"郭":15,"洪":10,"曾":12,"廖":14,"賴":16,"徐":10,"周":8,
  "葉":15,"蘇":22,"莊":13,"江":7,"呂":7,"何":7,"羅":20,"高":10,"潘":16,"簡":18,
  "朱":6,"鍾":17,"游":13,"彭":12,"詹":13,"胡":11,"施":9,"沈":8,"余":7,"盧":16,
  "梁":11,"趙":14,"顏":18,"柯":9,"翁":10,"魏":18,"孫":10,"戴":18,"范":11,"方":4,
  "宋":7,"鄧":19,"杜":7,"侯":9,"曹":11,"溫":14,"薛":19,"丁":2,"馬":10,"董":15,
  "袁":10,"鄒":17,"傅":12,"馮":12,"卓":8,"藍":20,"古":5,
  // 常用名字
  "志":7,"明":8,"華":14,"成":7,"嘉":14,"宇":6,"婷":12,"雅":12,"安":6,"家":10,
  "佳":8,"如":6,"芳":10,"麗":19,"君":7,"文":4,"國":11,"建":9,"偉":11,"強":11,
  "傑":12,"廷":7,"睿":14,"晴":12,"妍":7,"晨":11,"涵":12,"語":14,"宏":7,"宗":8,
  "宜":8,"宸":10,"展":10,"峰":10,"玲":10,"珊":10,"珍":10,"琪":13,"琳":13,"瑋":14,
  "瑜":14,"瑞":14,"哲":10,"思":9,"慧":15,"敏":11,"政":9,"昌":8,"星":9,"春":9,
  "智":12,"杰":8,"柏":9,"森":12,"榮":14,"樂":15,"欣":8,"正":5,"永":5,"清":12,
  "淑":12,"湘":13,"源":14,"潔":16,"祥":11,"福":14,"秀":7,"程":12,"穎":16,"立":5,
  "維":14,"翔":12,"翰":16,"聖":13,"芬":10,"芷":10,"若":11,"茹":12,"萱":15,"蓉":16,
  "薇":19,"裕":13,"誠":14,"豪":14,"賢":15,"軒":10,"辰":7,"逸":15,"鈞":12,"銘":14,
  "鋒":15,"雯":12,"靖":13,"靜":16,"飛":9,"龍":16,"鳳":14,"心":4,"恩":10,"育":10
};
function estimateStroke(ch){
  // 無資料時的保守估計（盡量不亂猜，回傳中性值並標記）
  if(!ch) return {n:8, est:true};
  const n = 8 + (ch.charCodeAt(0)%9);
  return {n, est:true};
}
function strokeOf(ch){
  if(STROKES[ch]!=null) return {n:STROKES[ch], est:false};
  return estimateStroke(ch);
}
function strokeWx(n){const r=n%10;
  if(r===1||r===2)return"木"; if(r===3||r===4)return"火";
  if(r===5||r===6)return"土"; if(r===7||r===8)return"金"; return"水";}

/* 81 數理吉凶 (3=大吉 2=半吉 1=凶) */
const LUCK81={
 1:3,3:3,5:3,6:3,7:3,8:3,11:3,13:3,15:3,16:3,17:3,18:3,21:3,23:3,24:3,25:3,
 29:3,31:3,32:3,33:3,35:3,37:3,38:2,39:3,41:3,45:3,47:3,48:3,52:3,57:3,61:3,
 63:3,65:3,67:3,68:3,81:3,
 2:1,4:1,9:1,10:1,12:1,14:1,19:1,20:1,22:1,26:2,27:2,28:1,30:2,34:1,36:1,
 40:2,42:2,43:2,44:1,46:1,49:2,50:2,51:2,53:1,54:1,55:2,56:1,58:2,59:1,60:1,
 62:1,64:1,66:1,69:1,70:1,71:2,72:1,73:2,74:1,75:2,76:1,77:2,78:1,79:1,80:1
};
function luck81(n){ let k=((n-1)%80)+1; return LUCK81[k]||2; }
export function luckText(v){return v===3?"大吉":v===2?"半吉":v===1?"凶":"中"; }

/* 三才配置（天人地三才五行相生剋） */
const SHENG={木:"火",火:"土",土:"金",金:"水",水:"木"};
const KE={木:"土",土:"水",水:"火",火:"金",金:"木"};
function sancaiLuck(t,r,d){
  // 相生為吉，相剋為凶
  let good=0;
  if(SHENG[t]===r||t===r) good++; if(SHENG[r]===d||r===d) good++;
  let bad=0;
  if(KE[t]===r||KE[r]===t) bad++; if(KE[r]===d||KE[d]===r) bad++;
  if(good>=2) return {luck:"吉",desc:"三才相生，基礎穩固、運勢順遂"};
  if(bad>=2) return {luck:"凶",desc:"三才相剋，根基動盪、易生波折，宜後天調補"};
  if(good>bad) return {luck:"半吉",desc:"三才大致相生，整體尚佳，略有小阻"};
  return {luck:"平",desc:"三才生剋參半，運勢平穩中帶起伏"};
}

export function nameAnalysis(name){
  const chars=[...(name||"")].filter(c=>c.trim());
  if(chars.length===0) return null;
  const info=chars.map(c=>{const s=strokeOf(c); return {c,...s,wx:strokeWx(s.n)};});
  const sk=info.map(i=>i.n);
  const total=sk.reduce((a,b)=>a+b,0);
  const hasEstimate=info.some(i=>i.est);

  // 五格（單姓單名/雙名通用法）
  let tian,ren,di,wai;
  if(chars.length===1){            // 單字名罕見，補1
    tian=sk[0]+1; ren=sk[0]+1; di=1+1; wai=2;
  } else if(chars.length===2){     // 單姓單名
    tian=sk[0]+1; ren=sk[0]+sk[1]; di=sk[1]+1; wai=2;
  } else {                          // 單姓雙名（最常見）或更多
    tian=sk[0]+1;
    ren=sk[0]+sk[1];
    di=sk[1]+sk[2];
    wai=Math.max(1, total - ren + 1);
  }
  const grids=[
    {name:"天格",num:tian,wx:strokeWx(tian),luck:luck81(tian),meaning:"祖蔭根基，先天賦予"},
    {name:"人格",num:ren,wx:strokeWx(ren),luck:luck81(ren),meaning:"一生主運，性格核心"},
    {name:"地格",num:di,wx:strokeWx(di),luck:luck81(di),meaning:"前半生運、根基與子女緣"},
    {name:"外格",num:wai,wx:strokeWx(wai),luck:luck81(wai),meaning:"社交人際、外在助力"},
    {name:"總格",num:total,wx:strokeWx(total),luck:luck81(total),meaning:"中晚年運、人生總成"}
  ];
  // 三才 = 天人地的五行
  const sancai=sancaiLuck(strokeWx(tian),strokeWx(ren),strokeWx(di));
  // 分數：五格吉凶平均
  const score=Math.round(grids.reduce((a,g)=>a+g.luck,0)/grids.length/3*100);

  return {
    chars:info, total, grids,
    sancai:{ wx:[strokeWx(tian),strokeWx(ren),strokeWx(di)], ...sancai },
    nameWx:info.map(i=>i.wx),
    score, hasEstimate
  };
}
