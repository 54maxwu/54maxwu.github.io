/* ============================================================
 * 天知道 · 八字核心層 (Layer 1)
 * 十神 / 身強弱 / 用神(扶抑+調候+通關) / 十二長生 / 神煞 / 格局
 * ============================================================ */
import {
  GAN, ZHI, GAN_WX, GAN_YY, ZHI_WX, ZHI_YY, ZHI_CANGAN
} from "./engine-calendar.js";

/* 五行生剋 */
export const SHENG = {木:"火",火:"土",土:"金",金:"水",水:"木"};
export const KE    = {木:"土",土:"水",水:"火",火:"金",金:"木"};
export const shengBy = wx => Object.keys(SHENG).find(k=>SHENG[k]===wx); // 生我者
export const keBy    = wx => Object.keys(KE).find(k=>KE[k]===wx);       // 剋我者

/* ---------- 十神 ---------- */
export function tenGod(dayGan, other){
  if(!other || other==="—") return null;
  const dWx=GAN_WX[dayGan], oWx=GAN_WX[other];
  const same=(GAN_YY[dayGan]===GAN_YY[other]);
  if(oWx===dWx)        return same?"比肩":"劫財";
  if(SHENG[dWx]===oWx) return same?"食神":"傷官";
  if(KE[dWx]===oWx)    return same?"偏財":"正財";
  if(KE[oWx]===dWx)    return same?"七殺":"正官";
  if(SHENG[oWx]===dWx) return same?"偏印":"正印";
  return null;
}
export const SHISHEN_CLASS = {
  比肩:"比劫",劫財:"比劫",食神:"食傷",傷官:"食傷",
  偏財:"財星",正財:"財星",七殺:"官殺",正官:"官殺",偏印:"印星",正印:"印星"
};
/* 十神簡義（自己的文案，後續UI用） */
export const SHISHEN_DESC = {
  比肩:"同我之氣，主自我、競爭、兄弟手足、合夥",
  劫財:"異性同我，主進取、爭奪、冒險、破耗",
  食神:"我所生（順），主才華、福氣、口福、温和輸出",
  傷官:"我所生（逆），主聰明、表現、叛逆、傷官見官為禍",
  偏財:"我所剋（順），主流動財、機會財、慷慨、父緣",
  正財:"我所剋（逆），主正財、妻財、務實、節儉",
  七殺:"剋我（順），主魄力、壓力、權威、小人或貴人兩極",
  正官:"剋我（逆），主名譽、地位、責任、自律",
  偏印:"生我（順），主偏門學問、孤剋、直覺、繼母緣",
  正印:"生我（逆），主學識、庇蔭、母緣、名譽靠山"
};

/* ---------- 十二長生 ---------- */
/* 各天干「長生」起始地支（陽干順行、陰干逆行） */
const CHANGSHENG_START = {
  甲:"亥",丙:"寅",戊:"寅",庚:"巳",壬:"申",
  乙:"午",丁:"酉",己:"酉",辛:"子",癸:"卯"
};
const CHANGSHENG_NAMES = ["長生","沐浴","冠帶","臨官","帝旺","衰","病","死","墓","絕","胎","養"];
export function changSheng(dayGan, zhi){
  if(zhi==="—") return null;
  const start = CHANGSHENG_START[dayGan];
  const yang = (GAN_YY[dayGan]==="陽");
  let si = ZHI.indexOf(start), zi = ZHI.indexOf(zhi);
  let step = yang ? ((zi - si + 12) % 12) : ((si - zi + 12) % 12);
  return CHANGSHENG_NAMES[step];
}
/* 長生強弱權重（用於身強弱微調與旺衰顯示） */
const CS_VITALITY = {長生:3,沐浴:1,冠帶:2,臨官:4,帝旺:5,衰:1,病:0,死:-1,墓:0,絕:-2,胎:1,養:2};

/* ---------- 月令旺相休囚死（得令） ---------- */
export function getLing(dayWx, monthZhi){
  const mWx=ZHI_WX[monthZhi];
  if(mWx===dayWx)        return {state:"旺",score:3, note:"日主得月令當旺"};
  if(SHENG[mWx]===dayWx) return {state:"相",score:2, note:"月令生日主，次旺"};
  if(SHENG[dayWx]===mWx) return {state:"休",score:-1,note:"日主生月令，洩氣"};
  if(KE[dayWx]===mWx)    return {state:"囚",score:-1.5,note:"日主剋月令，受困"};
  if(KE[mWx]===dayWx)    return {state:"死",score:-2,note:"月令剋日主，最弱"};
  return {state:"平",score:0,note:""};
}

/* ============================================================
 * 身強弱（分數制，附明細）
 * 得令×3 + 得地(藏干通根) + 得勢(天干同類) + 月支長生微調
 * ============================================================ */
export function analyzeStrength(bz){
  const dayGan=bz.dGan, dayWx=GAN_WX[dayGan];
  const detail=[]; // 加減分明細
  const ling=getLing(dayWx, bz.mZhi);
  let score = ling.score*3;
  detail.push({item:`月令（${bz.mZhi}）${ling.state}`, val:ling.score*3, note:ling.note});

  // 得地：四支藏干
  const zhiList=[
    ["年支",bz.yZhi],["月支",bz.mZhi],["日支",bz.dZhi]
  ];
  if(bz.hourKnown) zhiList.push(["時支",bz.hZhi]);
  for(const [label,z] of zhiList){
    (ZHI_CANGAN[z]||[]).forEach(([g,w])=>{
      const gWx=GAN_WX[g];
      let v=0,kind="";
      if(gWx===dayWx){v=1.0*w;kind="同類(比劫)";}
      else if(SHENG[gWx]===dayWx){v=0.8*w;kind="生我(印)";}
      else if(SHENG[dayWx]===gWx){v=-0.5*w;kind="我生(食傷洩)";}
      else if(KE[dayWx]===gWx){v=-0.4*w;kind="我剋(財耗)";}
      else if(KE[gWx]===dayWx){v=-0.7*w;kind="剋我(官殺)";}
      if(v!==0) detail.push({item:`${label}藏${g}`, val:Math.round(v*100)/100, note:kind});
      score+=v;
    });
  }
  // 得勢：天干
  const ganList=[["年干",bz.yGan],["月干",bz.mGan]];
  if(bz.hourKnown) ganList.push(["時干",bz.hGan]);
  for(const [label,g] of ganList){
    if(g==="—") continue;
    const gWx=GAN_WX[g];
    let v=0,kind="";
    if(gWx===dayWx){v=1.0;kind="同類(比劫)";}
    else if(SHENG[gWx]===dayWx){v=0.8;kind="生我(印)";}
    else if(SHENG[dayWx]===gWx){v=-0.5;kind="我生(食傷洩)";}
    else if(KE[dayWx]===gWx){v=-0.4;kind="我剋(財耗)";}
    else if(KE[gWx]===dayWx){v=-0.7;kind="剋我(官殺)";}
    if(v!==0) detail.push({item:`${label}${g}`, val:v, note:kind});
    score+=v;
  }
  // 月支長生微調（小權重）
  const cs = changSheng(dayGan, bz.mZhi);
  if(cs){
    const v=(CS_VITALITY[cs]||0)*0.15;
    if(v!==0){ score+=v; detail.push({item:`日主於月支(${cs})`,val:Math.round(v*100)/100,note:"十二長生氣勢"}); }
  }

  score=Math.round(score*100)/100;
  let strength, level, abnormal=false;
  if(score>=14){strength="極強";level=5;abnormal=true;}
  else if(score>=4){strength="身強";level=4;}
  else if(score>-4){strength="中和";level=3;}
  else if(score>-12){strength="身弱";level=2;}
  else{strength="極弱";level=1;abnormal=true;}

  return {dayGan,dayWx,ling,score,strength,level,abnormal,detail};
}

/* ============================================================
 * 用神：扶抑 + 調候 + 通關
 * ============================================================ */
/* 調候用神簡表：依日主 + 月支(月令)，取最需要的調候五行
 * 規則化：寒(亥子丑)需火暖、暑(巳午未)需水潤，再依日主微調 */
function tiaohou(dayWx, monthZhi){
  const cold = ["亥","子","丑"].includes(monthZhi);
  const hot  = ["巳","午","未"].includes(monthZhi);
  const dry  = ["未","戌"].includes(monthZhi);
  const wet  = ["丑","辰"].includes(monthZhi);
  let need=[], reason="";
  if(cold){ need.push("火"); reason="生於寒月，氣候嚴寒，首取火調暖"; }
  else if(hot){ need.push("水"); reason="生於暑月，火土燥烈，首取水潤局"; }
  if(dry && !need.includes("水")){ need.push("水"); reason+=(reason?"；":"")+"土燥需水潤澤"; }
  if(wet && !need.includes("火")){ need.push("火"); reason+=(reason?"；":"")+"土濕需火暖土"; }
  return {need:[...new Set(need)], reason};
}

export function analyzeYongShen(bz, strengthInfo){
  const dayWx = GAN_WX[bz.dGan];
  const s = strengthInfo;
  let primary=[], avoid=[], method="", note="";

  // 扶抑
  if(s.strength==="身強"||s.strength==="極強"){
    method = "扶抑（身強宜剋洩耗）";
    primary = [SHENG[dayWx], KE[dayWx], keBy(dayWx)]; // 食傷洩、財耗、官殺剋
    avoid   = [dayWx, shengBy(dayWx)];                 // 忌比劫、印
    note = "日主偏旺，喜「食傷洩秀、財星耗身、官殺制身」，忌再添比劫與印星。";
    if(s.strength==="極強"){
      note += " 惟身過強近從旺，若全局無剋洩，反宜順其旺勢。";
    }
  } else if(s.strength==="身弱"||s.strength==="極弱"){
    method = "扶抑（身弱宜生扶）";
    primary = [dayWx, shengBy(dayWx)]; // 比劫幫身、印星生身
    avoid   = [SHENG[dayWx], KE[dayWx], keBy(dayWx)];
    note = "日主偏弱，喜「印星生身、比劫幫身」，忌食傷洩氣、財官剋洩耗身。";
    if(s.strength==="極弱"){
      note += " 惟身過弱近從弱，若印比無根，反宜順從旺神。";
    }
  } else {
    method = "中和（調候為先）";
    primary = [dayWx, SHENG[dayWx]];
    avoid   = [];
    note = "日主中和，扶抑空間小，以調候與通關取喜用，順勢微調即可。";
  }

  // 調候疊加
  const th = tiaohou(dayWx, bz.mZhi);
  if(th.need.length){
    note += ` 調候：${th.reason}。`;
    // 把調候五行提到 primary 前面（優先）
    primary = [...new Set([...th.need, ...primary])];
  }

  // 去重 + 解決矛盾：同一五行不可既喜用又忌神。
  // 調候用神優先：凡已列入喜用(primary)的五行，一律從忌神(avoid)中剔除。
  const primarySet = new Set([...new Set(primary)].filter(Boolean));
  const cleanAvoid = [...new Set(avoid)].filter(w=>w && !primarySet.has(w));
  if(avoid.some(w=>primarySet.has(w)) && th.need.length){
    note += " （註：因調候需要，原本扶抑要忌的「" + th.need.join("、") + "」改列為喜用，以調候為先。）";
  }

  return {
    method,
    primary: [...primarySet],
    avoid:   cleanAvoid,
    tiaohou: th,
    note
  };
}

/* ============================================================
 * 五行統計（含藏干權重）
 * ============================================================ */
export function wuxingTally(bz){
  const t={木:0,火:0,土:0,金:0,水:0};
  const add=(wx,v)=>{ if(t[wx]!=null) t[wx]+=v; };
  // 天干各1
  [bz.yGan,bz.mGan,bz.dGan].forEach(g=>add(GAN_WX[g],1));
  if(bz.hourKnown) add(GAN_WX[bz.hGan],1);
  // 地支藏干按權重
  const zs=[bz.yZhi,bz.mZhi,bz.dZhi]; if(bz.hourKnown) zs.push(bz.hZhi);
  zs.forEach(z=>(ZHI_CANGAN[z]||[]).forEach(([g,w])=>add(GAN_WX[g],w)));
  // 四捨五入
  for(const k in t) t[k]=Math.round(t[k]*100)/100;
  return t;
}

/* ============================================================
 * 神煞（全套）
 * 多以年支或日支起，部分以日干起
 * ============================================================ */
const PEACH = {申:"酉",子:"酉",辰:"酉", 寅:"卯",午:"卯",戌:"卯", 巳:"午",酉:"午",丑:"午", 亥:"子",卯:"子",未:"子"}; // 桃花(咸池)以年/日支三合局取
const HORSE = {申:"寅",子:"寅",辰:"寅", 寅:"申",午:"申",戌:"申", 巳:"亥",酉:"亥",丑:"亥", 亥:"巳",卯:"巳",未:"巳"}; // 驛馬
const HUAGAI= {申:"辰",子:"辰",辰:"辰", 寅:"戌",午:"戌",戌:"戌", 巳:"丑",酉:"丑",丑:"丑", 亥:"未",卯:"未",未:"未"}; // 華蓋
const JIANGXING={申:"子",子:"子",辰:"子", 寅:"午",午:"午",戌:"午", 巳:"酉",酉:"酉",丑:"酉", 亥:"卯",卯:"卯",未:"卯"}; // 將星
// 天乙貴人（以日干查，對應兩地支）
const TIANYI = {甲:["丑","未"],戊:["丑","未"],庚:["丑","未"],乙:["子","申"],己:["子","申"],
  丙:["亥","酉"],丁:["亥","酉"],壬:["卯","巳"],癸:["卯","巳"],辛:["寅","午"]};
// 文昌（日干查）
const WENCHANG = {甲:"巳",乙:"午",丙:"申",戊:"申",丁:"酉",己:"酉",庚:"亥",辛:"子",壬:"寅",癸:"卯"};
// 羊刃（日干查，陽干帝旺支）
const YANGREN = {甲:"卯",丙:"午",戊:"午",庚:"酉",壬:"子", 乙:"寅",丁:"巳",己:"巳",辛:"申",癸:"亥"};
// 祿神（日干臨官）
const LUSHEN = {甲:"寅",乙:"卯",丙:"巳",丁:"午",戊:"巳",己:"午",庚:"申",辛:"酉",壬:"亥",癸:"子"};
// 天德/月德（以月支查）
const TIANDE = {寅:"丁",卯:"申",辰:"壬",巳:"辛",午:"亥",未:"甲",申:"癸",酉:"寅",戌:"丙",亥:"乙",子:"巳",丑:"庚"};
const YUEDE  = {寅:"丙",午:"丙",戌:"丙", 申:"壬",子:"壬",辰:"壬", 亥:"甲",卯:"甲",未:"甲", 巳:"庚",酉:"庚",丑:"庚"};
// 劫煞、亡神（以年/日支三合局取）
const JIESHA = {申:"巳",子:"巳",辰:"巳", 寅:"亥",午:"亥",戌:"亥", 巳:"寅",酉:"寅",丑:"寅", 亥:"申",卯:"申",未:"申"};
const WANGSHEN={申:"亥",子:"亥",辰:"亥", 寅:"巳",午:"巳",戌:"巳", 巳:"申",酉:"申",丑:"申", 亥:"寅",卯:"寅",未:"寅"};
// 魁罡（日柱本身）
const KUIGANG = ["庚辰","庚戌","壬辰","戊戌"];
// 旬空（空亡）—— 依日柱所在旬
const XUNKONG = {
  甲子:["戌","亥"],甲戌:["申","酉"],甲申:["午","未"],甲午:["辰","巳"],甲辰:["寅","卯"],甲寅:["子","丑"]
};
function getXunKong(dGan,dZhi){
  // 求日柱在六十甲子的序，回推旬首
  const gi=GAN.indexOf(dGan), zi=ZHI.indexOf(dZhi);
  // 旬首天干一定是甲，找 zhi - gi 偏移
  const headZhiIdx = ((zi - gi)%12+12)%12;
  const headZhi = ZHI[headZhiIdx];
  const head = "甲"+headZhi;
  return XUNKONG[head] || [];
}

export function analyzeShenSha(bz){
  const list=[];
  const branches=[
    ["年支",bz.yZhi],["月支",bz.mZhi],["日支",bz.dZhi]
  ];
  if(bz.hourKnown) branches.push(["時支",bz.hZhi]);
  const allZhi = branches.map(b=>b[1]);
  const refSet = [bz.yZhi, bz.dZhi]; // 桃花驛馬等以年支或日支起，命中即算

  const checkByRef = (table,name,desc)=>{
    const targets=new Set(refSet.map(r=>table[r]).filter(Boolean));
    const hits=branches.filter(([,z])=>targets.has(z)).map(([p])=>p);
    if(hits.length) list.push({name,positions:hits,desc});
  };
  checkByRef(PEACH,"桃花","主魅力、情緣、人緣，旺則異性緣佳，過則易招情困");
  checkByRef(HORSE,"驛馬","主走動、遷移、變動，利出行求財、外地發展");
  checkByRef(HUAGAI,"華蓋","主才藝、孤高、宗教玄學緣，文藝與靈性天分");
  checkByRef(JIANGXING,"將星","主領導、權柄，逢吉則掌權，宜居要職");
  checkByRef(JIESHA,"劫煞","主突發、破耗、是非，須防意外損失");
  checkByRef(WANGSHEN,"亡神","主謀略、內斂，亦主暗耗、心事重");

  // 日干查（貴人/文昌/羊刃/祿）
  const checkByDayGan=(val,name,desc)=>{
    const arr = Array.isArray(val)?val:[val];
    const hits=branches.filter(([,z])=>arr.includes(z)).map(([p])=>p);
    if(hits.length) list.push({name,positions:hits,desc});
  };
  checkByDayGan(TIANYI[bz.dGan],"天乙貴人","第一吉神，主逢凶化吉、貴人扶持");
  checkByDayGan(WENCHANG[bz.dGan],"文昌","主聰慧、文采、考運，利讀書功名");
  checkByDayGan(YANGREN[bz.dGan],"羊刃","剛烈之刃，主魄力與衝勁，過則傷災刑剋");
  checkByDayGan(LUSHEN[bz.dGan],"祿神","主衣祿、實力，日主臨官得地之氣");

  // 天月德（查天干）
  const allGan=[bz.yGan,bz.mGan,bz.dGan]; if(bz.hourKnown) allGan.push(bz.hGan);
  if(TIANDE[bz.mZhi] && allGan.includes(TIANDE[bz.mZhi]))
    list.push({name:"天德貴人",positions:["天干"],desc:"逢凶化吉、行善得福之吉神"});
  if(YUEDE[bz.mZhi] && allGan.includes(YUEDE[bz.mZhi]))
    list.push({name:"月德貴人",positions:["天干"],desc:"主慈祥、福德、化解災厄"});

  // 魁罡（日柱）
  if(KUIGANG.includes(bz.dGan+bz.dZhi))
    list.push({name:"魁罡",positions:["日柱"],desc:"主聰明果斷、性烈掌權，喜身旺忌刑沖"});

  // 空亡
  const kong=getXunKong(bz.dGan,bz.dZhi);
  const kongHits=branches.filter(([,z])=>kong.includes(z)).map(([p])=>p);
  if(kongHits.length) list.push({name:"空亡(旬空)",positions:kongHits,desc:"該柱之氣落空，吉減力、凶亦減，逢沖反實"});

  // 童子命（依季節月支＋日/時支查法，另含年命納音五行版）
  if(isTongZi(bz)) list.push({name:"童子命",positions:["日支/時支"],desc:"民俗稱前世帶仙佛之緣的命，多主聰慧靈秀、宗教緣深、感情與健康易有波折，宜以修德行善看待，不必恐慌"});

  return list;
}

/* 童子命判定：兩套查法命中其一即算（民俗神煞，僅供參考） */
function isTongZi(bz){
  const dz=bz.dZhi, hz=bz.hourKnown?bz.hZhi:null;
  const hit=(arr)=>arr.includes(dz)||(hz&&arr.includes(hz));
  // 季節版（以月支判春夏秋冬）
  const m=bz.mZhi;
  const springAutumn=["寅","卯","辰","申","酉","戌"].includes(m); // 春＋秋
  const winterSummer=["亥","子","丑","巳","午","未"].includes(m);  // 冬＋夏
  if(springAutumn && hit(["寅","子"])) return true;
  if(winterSummer && hit(["卯","未","辰"])) return true;
  // 年命納音五行版（金木午卯、水火酉戌、土辰巳）
  const wx=(bz.nayin&&bz.nayin.year||"").slice(-1); // 納音末字＝五行
  if((wx==="金"||wx==="木") && hit(["午","卯"])) return true;
  if((wx==="水"||wx==="火") && hit(["酉","戌"])) return true;
  if(wx==="土" && hit(["辰","巳"])) return true;
  return false;
}

/* ============================================================
 * 格局判定（正格 + 特殊格局）
 * ============================================================ */
export function analyzePattern(bz, strengthInfo, tally){
  const dayGan=bz.dGan, dayWx=GAN_WX[dayGan];
  // 月支主氣十神（取格優先看月令本氣）
  const monthMain = (ZHI_CANGAN[bz.mZhi]||[])[0];
  const monthGod = monthMain ? tenGod(dayGan, monthMain[0]) : null;

  const patterns=[];

  // --- 特殊格局：從格 / 化氣（先判，因會推翻正格）---
  const s=strengthInfo;
  if(s.strength==="極弱"){
    // 從弱：看最旺之神
    const sorted=Object.entries(tally).sort((a,b)=>b[1]-a[1]);
    const dominant=sorted[0][0];
    if(dominant===KE[dayWx]) patterns.push({name:"從財格",type:"特殊",desc:"日主極弱無根，順從財星之旺勢，喜財及食傷生財，忌印比助身破格"});
    else if(dominant===keBy(dayWx)) patterns.push({name:"從殺格",type:"特殊",desc:"日主極弱，順從官殺之勢，喜官殺財，忌印比"});
    else if(dominant===SHENG[dayWx]) patterns.push({name:"從兒格",type:"特殊",desc:"日主極弱，順從食傷洩秀，喜食傷財，忌印星"});
  }
  if(s.strength==="極強"){
    // 從旺/從強
    if(s.ling.state==="旺"||s.ling.state==="相")
      patterns.push({name:"從旺／專旺格",type:"特殊",desc:"滿盤比劫印綬，日主旺極，宜順其勢，喜比劫印，忌官殺剋身"});
  }

  // --- 正格（八格，依月令透干）---
  if(monthGod){
    const gName = monthGod==="比肩"||monthGod==="劫財"
      ? "建祿／月劫格"
      : monthGod+"格";
    const cls=SHISHEN_CLASS[monthGod];
    const descMap={
      正官格:"以正官為用，主貴氣、名譽、規矩，喜財生官、印護官，忌傷官見官",
      七殺格:"以七殺為用，主權威、魄力，喜食神制殺或印化殺，忌財黨殺攻身",
      正財格:"以正財為用，主務實、理財，喜身旺任財、食傷生財，忌比劫奪財",
      偏財格:"以偏財為用，主機會財、慷慨，喜身旺、官星護財，忌比劫爭財",
      正印格:"以正印為用，主學識、庇蔭，喜官殺生印，忌財星壞印",
      偏印格:"以偏印(梟神)為用，主偏才、直覺，喜身弱用印，忌食神被奪(梟印奪食)",
      食神格:"以食神為用，主才華、福氣，喜身旺生食、財來流通，忌偏印奪食",
      傷官格:"以傷官為用，主聰明、表現力，喜傷官生財或佩印，忌傷官見官",
      "建祿／月劫格":"月令逢比劫，身旺之造，喜財官食傷流通發越，忌再逢比劫印綬"
    };
    patterns.push({name:gName,type:"正格",monthGod,cls,desc:descMap[gName]||`以${monthGod}立格`});
  }

  return {
    monthGod,
    monthMainGan: monthMain?monthMain[0]:null,
    patterns: patterns.length?patterns:[{name:"普通格局",type:"普通",desc:"月令未透清純之神，以日主旺衰扶抑取用為主"}]
  };
}

/* ============================================================
 * 主整合：完整八字分析
 * ============================================================ */
export function fullBaziAnalysis(bz){
  // 十神標註（四柱天干 + 地支藏干）
  const annotate = (gan,zhi) => ({
    gan, ganGod: tenGod(bz.dGan,gan),
    zhi,
    cangan: (ZHI_CANGAN[zhi]||[]).map(([g,w])=>({gan:g,weight:w,god:tenGod(bz.dGan,g)})),
    changSheng: changSheng(bz.dGan, zhi),
    nayin: null
  });
  const chart = {
    year: annotate(bz.yGan,bz.yZhi),
    month: annotate(bz.mGan,bz.mZhi),
    day: annotate(bz.dGan,bz.dZhi),
    hour: bz.hourKnown ? annotate(bz.hGan,bz.hZhi) : null
  };
  chart.year.nayin=bz.nayin.year; chart.month.nayin=bz.nayin.month;
  chart.day.nayin=bz.nayin.day; if(chart.hour) chart.hour.nayin=bz.nayin.hour;
  // 日干自己不算十神（為日主本身）
  chart.day.ganGod = "日主";

  const tally = wuxingTally(bz);
  const strength = analyzeStrength(bz);
  const yong = analyzeYongShen(bz, strength);
  const shensha = analyzeShenSha(bz);
  const pattern = analyzePattern(bz, strength, tally);

  // 十神分類統計
  const godTally={比劫:0,食傷:0,財星:0,官殺:0,印星:0};
  const addGod=(g,w)=>{ if(!g||g==="日主")return; const c=SHISHEN_CLASS[g]; if(c)godTally[c]+=w; };
  [chart.year,chart.month,chart.hour].forEach(p=>{ if(p) addGod(p.ganGod,1); });
  [chart.year,chart.month,chart.day,chart.hour].forEach(p=>{
    if(!p)return; p.cangan.forEach(c=>addGod(c.god, c.weight*0.6));
  });
  for(const k in godTally) godTally[k]=Math.round(godTally[k]*100)/100;

  const branchRel = analyzeBranchRel(bz, tally);

  return { bz, chart, tally, strength, yong, shensha, pattern, godTally, branchRel };
}

/* ============================================================
 * 地支互動：六合 / 三合(局) / 六沖 / 相刑 / 六害 / 天羅地網
 *   逐一比對四柱地支兩兩關係，回傳命中清單（含柱位）。
 * ============================================================ */
const LIUHE = {子:"丑",丑:"子",寅:"亥",亥:"寅",卯:"戌",戌:"卯",辰:"酉",酉:"辰",巳:"申",申:"巳",午:"未",未:"午"};
const LIUHE_WX = {"子丑":"土","寅亥":"木","卯戌":"火","辰酉":"金","巳申":"水","午未":"土"}; // 合化五行
const LIUCHONG = {子:"午",午:"子",丑:"未",未:"丑",寅:"申",申:"寅",卯:"酉",酉:"卯",辰:"戌",戌:"辰",巳:"亥",亥:"巳"};
const LIUHAI_B = {子:"未",未:"子",丑:"午",午:"丑",寅:"巳",巳:"寅",卯:"辰",辰:"卯",申:"亥",亥:"申",酉:"戌",戌:"酉"};
/* 三合局：每組三支 → 合化五行 */
const SANHE_SETS = [
  {zhi:["申","子","辰"],wx:"水"},
  {zhi:["亥","卯","未"],wx:"木"},
  {zhi:["寅","午","戌"],wx:"火"},
  {zhi:["巳","酉","丑"],wx:"金"}
];
/* 相刑：三刑(無恩之刑/恃勢之刑/無禮之刑) + 自刑 */
const XING_GROUPS = [
  {set:["寅","巳","申"],name:"無恩之刑",note:"寅巳申三刑，主恩中招怨、易因熱心反惹麻煩，常見人事是非與健康勞損。"},
  {set:["丑","戌","未"],name:"恃勢之刑",note:"丑戌未三刑，主仗勢欺人或被勢所壓，多與爭產、官非、固執起衝突有關。"}
];
const XING_PAIR = {子:"卯",卯:"子"}; // 子卯相刑（無禮之刑）
const ZIXING = ["辰","午","酉","亥"]; // 自刑（同字相見）

function pillarPairs(bz){
  const arr=[["年",bz.yZhi],["月",bz.mZhi],["日",bz.dZhi]];
  if(bz.hourKnown) arr.push(["時",bz.hZhi]);
  return arr;
}
/* 兩柱是否相鄰（年月、月日、日時為緊貼） */
function isAdjacent(posA,posB){
  const order=["年","月","日","時"];
  return Math.abs(order.indexOf(posA)-order.indexOf(posB))===1;
}

/* 天干本氣祿（臨官）地支：用於判斷祿/比劫是否入網 */
const LU_BRANCH = {甲:"寅",乙:"卯",丙:"巳",戊:"巳",丁:"午",己:"午",庚:"申",辛:"酉",壬:"亥",癸:"子"};

export function analyzeBranchRel(bz, tally){
  const pills=pillarPairs(bz);
  const out={ liuhe:[], sanhe:[], chong:[], xing:[], hai:[], tianluo:null };

  // —— 兩兩比對：六合/六沖/六害 ——
  for(let i=0;i<pills.length;i++)for(let j=i+1;j<pills.length;j++){
    const [pa,za]=pills[i], [pb,zb]=pills[j];
    const adj=isAdjacent(pa,pb);
    if(LIUHE[za]===zb){
      const wx=LIUHE_WX[za+zb]||LIUHE_WX[zb+za]||"";
      out.liuhe.push({a:za,b:zb,posA:pa,posB:pb,wx,adj});
    }
    if(LIUCHONG[za]===zb) out.chong.push({a:za,b:zb,posA:pa,posB:pb,adj});
    if(LIUHAI_B[za]===zb) out.hai.push({a:za,b:zb,posA:pa,posB:pb,adj});
  }

  // —— 三合局：四支中是否齊三 / 半合(齊二且含子午卯酉旺神) ——
  const zhiList=pills.map(p=>p[1]);
  SANHE_SETS.forEach(s=>{
    const hit=s.zhi.filter(z=>zhiList.includes(z));
    if(hit.length===3) out.sanhe.push({zhi:s.zhi.slice(),wx:s.wx,full:true,have:hit});
    else if(hit.length===2){
      // 半合：含「子午卯酉」旺神之一者較有力
      const wang=["子","午","卯","酉"].find(w=>hit.includes(w));
      if(wang) out.sanhe.push({zhi:s.zhi.slice(),wx:s.wx,full:false,have:hit});
    }
  });

  // —— 相刑：三刑 / 子卯刑 / 自刑 ——
  XING_GROUPS.forEach(g=>{
    const hit=g.set.filter(z=>zhiList.includes(z));
    if(hit.length>=2) out.xing.push({type:hit.length===3?"三刑全":"半刑",name:g.name,have:hit,note:g.note});
  });
  for(let i=0;i<pills.length;i++)for(let j=i+1;j<pills.length;j++){
    const za=pills[i][1], zb=pills[j][1];
    if(XING_PAIR[za]===zb) out.xing.push({type:"子卯刑",name:"無禮之刑",have:[za,zb],note:"子卯相刑，主禮數欠周、易因情緒或言語失和，常見家庭或感情上的摩擦。"});
  }
  ZIXING.forEach(z=>{ if(zhiList.filter(x=>x===z).length>=2) out.xing.push({type:"自刑",name:z+"自刑",have:[z,z],note:z+"自刑，主自我內耗、鑽牛角尖，易自尋煩惱、自己跟自己過不去。"}); });

  // —— 天羅地網：辰巳(地網) / 戌亥(天門·天羅) 同見 ——
  const has=z=>zhiList.includes(z);
  const diWang=(has("辰")&&has("巳"));   // 地網
  const tianLuo=(has("戌")&&has("亥"));  // 天羅
  if(diWang||tianLuo){
    const factors=[];   // 加重凶性的要素（四要素）
    // 要素1：五行失衡（土水火的剋制）。地網辰巳=土晦火、天羅戌亥=土剋水。
    let imbalance=null;
    if(tally){
      const vals=Object.values(tally); const avg=vals.reduce((x,y)=>x+y,0)/5;
      if(tianLuo && tally["土"]>avg*1.6 && tally["水"]<avg*0.7) imbalance="土旺剋水（天羅戌亥，水被困）";
      else if(diWang && tally["水"]>avg*1.6 && tally["火"]<avg*0.7) imbalance="水旺剋火（地網辰巳，火被晦）";
      else if(diWang && tally["土"]>avg*1.6 && tally["火"]<avg*0.7) imbalance="土旺晦火（地網辰巳，火氣受困）";
      if(imbalance) factors.push({k:"五行失衡",v:imbalance});
    }
    // 要素2：位置緊貼（束縛之支需相鄰，網才鋪得開）
    const netSet=tianLuo?["戌","亥"]:["辰","巳"];
    let adjNet=false;
    for(let i=0;i<pills.length-1;i++){
      const a=pills[i][1], b=pills[i+1][1];
      if(netSet.includes(a)&&netSet.includes(b)&&a!==b){adjNet=true;break;}
    }
    if(adjNet) factors.push({k:"位置緊貼",v:`${netSet[0]}${netSet[1]}相鄰成網，束縛力較強`});
    // 要素3：日主祿/比劫入網（壬癸見亥、丙丁見巳等，本體被困）
    let luIn=null;
    if(bz.dGan){
      const dWx=GAN_WX[bz.dGan];
      const lu=LU_BRANCH[bz.dGan];           // 日主之祿
      if(lu && netSet.includes(lu) && zhiList.includes(lu)) luIn=`日主 ${bz.dGan} 之祿「${lu}」落在網中（本體受困）`;
      else {
        // 比劫：同五行的地支祿位也算
        const sameLu=Object.keys(LU_BRANCH).filter(g=>GAN_WX[g]===dWx).map(g=>LU_BRANCH[g]);
        const hit=netSet.find(z=>sameLu.includes(z)&&zhiList.includes(z));
        if(hit) luIn=`日主同類（比劫）祿位「${hit}」入網`;
      }
      if(luIn) factors.push({k:"日主祿比入網",v:luIn});
    }
    // 凶性等級：要素越多越凶（0=純束縛/修行緣、1-2=中、3+=高）
    const level = factors.length>=3?"高":factors.length>=1?"中":"低";
    out.tianluo={ diWang, tianLuo,
      both:diWang&&tianLuo,
      have:zhiList.filter(z=>["辰","巳","戌","亥"].includes(z)),
      factors, level, imbalance, adjNet, luIn };
  }

  return out;
}
