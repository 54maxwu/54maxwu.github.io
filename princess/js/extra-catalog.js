/* ---------- catalogue expansion: more options, new categories, colour shades ---------- */
function addOpts(k, arr) { CATS[k].options.push(...O(arr)); }

addOpts('eyeShape', [['tiny', '小豆眼'], ['cat', '貓咪眼'], ['teary', '淚汪汪'], ['happyClosed', '開心><']]);
addOpts('iris', [['galaxyIris', '星河'], ['flowerIris', '花瓣'], ['heartIris', '愛心環'], ['gem', '寶石']]);
addOpts('pupil', [['butterfly', '蝴蝶'], ['crown', '皇冠'], ['music', '音符'], ['cross', '十字星'], ['drop', '水滴'], ['starHollow', '空心星']]);
addOpts('highlight', [['flower', '花朵光'], ['butterfly', '蝴蝶光'], ['window', '窗格光'], ['ring', '光圈'], ['triple', '三連光']]);
addOpts('lashes', [[9, '稀疏'], [10, '粉紅'], [11, '藍色'], [12, '彩虹']]);
addOpts('eyeliner', [['mint', '薄荷'], ['silver', '銀色'], ['rainbow', '彩虹'], ['doubleWing', '雙翼'], ['puppy', '下垂'], ['graphic', '浮動線']]);
addOpts('brows', [['round', '圓眉'], ['tiny', '小短眉'], ['star', '星星眉'], ['cloud', '雲朵眉'], ['pink', '粉紅眉'], ['purple', '紫色眉']]);
addOpts('skin', [['#fde3d3', '奶茶'], ['#f7d4c4', '蜜桃膚'], ['#efc0a0', '暖杏'], ['#d99a6c', '蜂蜜'], ['#a86b45', '肉豆蔻'], ['#7a4a2e', '可可豆'], ['#ffe9f2', '櫻花白'], ['#fff3d9', '月光金']]);
addOpts('shadowStyle', [['heart', '愛心'], ['ombreUp', '漸層'], ['sparkleCrease', '閃線'], ['dots', '點點'], ['galaxy', '星空'], ['pastelDuo', '粉藍雙色']]);
addOpts('highlighter', [['gold', '金色光'], ['rose', '玫瑰光'], ['moon', '月光'], ['nose', '鼻樑光'], ['forehead', '額頭光']]);
addOpts('blushStyle', [['oval', '大橢圓'], ['diagonal', '斜刷'], ['strawberry', '草莓'], ['moon', '月亮'], ['cloud', '雲朵'], ['triple', '三點']]);
addOpts('lipStyle', [['fang', '小虎牙'], ['tongue', '吐舌頭'], ['kiss', '飛吻'], ['wavy', '害羞'], ['omega', 'ω嘴'], ['bigHeart', '大愛心唇']]);
addOpts('facePaint', [['crownForehead', '額間皇冠'], ['heartForehead', '額間愛心'], ['bunnyNose', '兔鼻子'], ['catNose', '貓鼻子'], ['starsCheeks', '星星臉頰'], ['sunMoon', '日月'],
  ['cloudCheek', '雲朵'], ['leafVine', '葉藤'], ['pearlDrops', '珍珠點'], ['galaxyCheek', '星河']]);
addOpts('sticker', [['bunny', '兔兔'], ['cat', '貓咪'], ['star2', '雙星'], ['gemHeart', '寶石心'], ['crescentStars', '星月'], ['bandage', 'OK繃'], ['flowerTrio', '三朵花'], ['droplet', '水滴'],
  ['cupcake', '杯子蛋糕'], ['lollipop', '棒棒糖'], ['shell', '貝殼'], ['snowflake', '雪花'], ['leaf', '葉子'], ['candy', '糖果'], ['note2', '雙音符']]);
addOpts('hairStyle', [['longTwin', '超長雙馬尾'], ['lowTwin', '低雙馬尾'], ['drills', '螺旋雙馬尾'], ['shortTwin', '短雙馬尾'], ['halfTwin', '半紮雙尾'], ['bunLong', '丸子長髮'],
  ['messyBun', '慵懶丸子'], ['sideSwept', '側撥長髮'], ['fluffyLong', '蓬鬆長髮'], ['wavyBob', '波浪短髮']]);
addOpts('bangs', [['zigzag', '鋸齒瀏海'], ['longBlunt', '長齊瀏海'], ['ahoge', '呆毛'], ['heartAhoge', '愛心呆毛'], ['sideClip', '夾起瀏海']]);
addOpts('hairAcc', [['rainbowClips', '彩虹夾'], ['cherryClips', '櫻桃夾'], ['starPins', '星星夾'], ['bunnyClip', '兔兔夾'], ['pearlComb', '珍珠梳'], ['miniWreath', '小花冠'],
  ['leafPins', '葉子夾'], ['snowPins', '雪花夾'], ['crystalPins', '水晶夾'], ['heartChain', '愛心鍊'], ['ribbonBraid', '緞帶編'], ['goldLeaves', '金葉']]);
addOpts('dress', [['bellGown', '鐘形禮服'], ['ruffleTier', '荷葉層層'], ['nightSky', '月夜長裙'], ['grecian', '希臘女神'], ['sunflower', '向日葵裙'], ['lolita', '蘿莉塔'], ['sailor', '水手洋裝'], ['pinafore', '圍裙洋裝']]);
addOpts('fabric', [['iridescent', '虹彩'], ['chiffon', '雪紡'], ['laceOverlay', '蕾絲罩'], ['sequin', '亮片珠'], ['metallic', '金屬光']]);
addOpts('pattern', [['strawberries', '草莓'], ['cherries', '櫻桃'], ['bunnies', '兔兔'], ['paws', '肉球'], ['notes', '音符'], ['crowns', '皇冠'], ['diamonds', '鑽石'], ['zigzag', '鋸齒'],
  ['waves', '波浪'], ['leaves', '葉子'], ['sakura', '櫻花'], ['gingham', '野餐格']]);
addOpts('skirtDeco', [['bowsBig', '大蝴蝶結'], ['pearlScatter', '珍珠點點'], ['starHem', '星星邊'], ['rainbowHem', '彩虹邊'], ['candies', '糖果'], ['shells', '貝殼'], ['snowflakes', '雪花'],
  ['leafHem', '葉子邊'], ['tulle', '紗裙罩'], ['bells', '小鈴鐺']]);
addOpts('shawl', [['bolero', '小外套'], ['puffBolero', '泡泡短外套'], ['fairyCape', '精靈披風'], ['ermine', '皇家披風'], ['ribbonCape', '緞帶披肩'], ['laceCollar', '蕾絲圓領'], ['sailorCollar', '水手領'], ['scarf', '小圍巾']]);
addOpts('crown', [['roseGold', '玫瑰金冠'], ['silverCrown', '銀冠'], ['tallCrown', '高皇冠'], ['miniCrown', '小斜冠'], ['gemCrown', '寶石冠'], ['flowerTiara', '花冠冕'], ['snowTiara', '雪花冠'],
  ['foxEars', '狐狸耳'], ['blackCatEars', '黑貓耳'], ['sheepHorns', '綿羊角'], ['bunnyBow', '兔耳蝴蝶結'], ['fairyHat', '精靈帽'], ['sunHat', '草帽'], ['bonnet', '軟帽'], ['flowerHat', '花朵帽']]);
addOpts('earrings', [['starDrop', '星星墜'], ['heartHoop', '愛心圈'], ['pearlCluster', '珍珠串'], ['lollipop', '棒棒糖'], ['key', '鑰匙'], ['music', '音符'], ['moonStar', '星月'],
  ['cat', '貓咪'], ['bunny', '兔兔'], ['leaf', '葉子'], ['gemHoop', '寶石圈'], ['clover', '幸運草']]);
addOpts('necklace', [['lockHeart', '愛心鎖'], ['moonPearl', '月亮珍珠'], ['clover', '幸運草'], ['music', '音符'], ['rose', '玫瑰'], ['gemCollar', '寶石頸圈'], ['bunny', '兔兔'],
  ['pearlDrop', '珍珠墜'], ['sunflower', '向日葵'], ['snowflake', '雪花'], ['rainbow', '彩虹'], ['tripleStar', '三顆星']]);
addOpts('glasses', [['tinyRound', '小圓框'], ['ovalPink', '粉橢圓'], ['starSun', '星星墨鏡'], ['heartSun', '愛心墨鏡'], ['clear', '透明框'], ['bunnyMask', '兔兔面具'], ['cloudFrame', '雲朵框'], ['goldWire', '金絲框']]);
addOpts('gloves', [['mint', '薄荷手套'], ['blue', '藍緞手套'], ['goldGlove', '金色手套'], ['bowGlove', '蝴蝶結手套'], ['pearlGlove', '珍珠手套'], ['furCuff', '毛毛袖口'], ['heartBracelet', '愛心手鍊'], ['moonBracelet', '月亮手鍊']]);
addOpts('wings', [['tinyFairy', '小精靈'], ['goldAngel', '金色天使'], ['blueButterfly', '藍蝴蝶'], ['flowerWings', '花朵'], ['laceWings', '蕾絲'], ['smallHearts', '小愛心'], ['crystalStars', '星光'],
  ['featherBlue', '藍羽'], ['auroraWings', '極光'], ['sakuraWings', '櫻花']]);
addOpts('aura', [['confetti', '彩色紙花'], ['ribbons', '飄帶'], ['crowns', '小皇冠'], ['clovers', '幸運草'], ['leaves', '落葉'], ['moonStars', '星月'], ['rainbowArc', '彩虹橋'], ['sparkleRing', '光環'], ['candy', '糖果雨'], ['lanterns', '孔明燈']]);
addOpts('held', [['flowerWand', '花朵棒'], ['teacup', '茶杯'], ['perfume', '香水瓶'], ['bunnyPlush', '兔兔娃娃'], ['sunflower', '向日葵'], ['tulips', '鬱金香'], ['bubbleTea', '珍珠奶茶'], ['donut', '甜甜圈'],
  ['strawberry', '大草莓'], ['musicBox', '音樂盒'], ['crownCushion', '皇冠枕'], ['letter', '情書'], ['paintBrush', '畫筆'], ['starBalloon', '星星氣球'], ['kite', '風箏']]);
addOpts('pet', [['blackCat', '黑貓'], ['grayCat', '灰貓'], ['brownBunny', '棕兔'], ['goldenPuppy', '金毛狗'], ['pinkBear', '粉紅熊'], ['redPanda', '小熊貓'], ['duckling', '小鴨'], ['mouse', '小老鼠'],
  ['piggy', '小豬'], ['turtle', '小烏龜'], ['alpaca', '羊駝'], ['hedgehog', '刺蝟']]);
addOpts('bg', [['sunflowerField', '向日葵田'], ['tulipField', '鬱金香'], ['balloonSky', '熱氣球'], ['bakery', '甜點店'], ['library', '魔法書房'], ['waterfall', '彩虹瀑布'], ['nightCastle', '夜晚城堡'],
  ['pastelTown', '粉彩小鎮'], ['mushroom', '蘑菇村'], ['starPier', '星光碼頭']]);
addOpts('frame', [['butterflies', '蝴蝶'], ['candy', '糖果'], ['leaves', '葉子'], ['sakura', '櫻花'], ['snowflakes', '雪花'], ['bows', '蝴蝶結'], ['rainbow', '彩虹'], ['polaroid', '拍立得'], ['mirror', '梳妝鏡'], ['neon', '霓虹愛心']]);

/* light / deep shade of every plain colour */
function addShades(k) {
  const seen = new Set(), out = [];
  const push = (o) => { if (!seen.has(o.v)) { seen.add(o.v); out.push(o); } };
  CATS[k].options.forEach(o => {
    push(o);
    if (o.v == null || isSpecial(o.v)) return;
    const L = lum(o.v);
    if (L < 0.93) push({ v: shade(o.v, 38), n: '淺' + o.n, css: null });
    if (L > 0.12) push({ v: shade(o.v, -28), n: '深' + o.n, css: null });
  });
  CATS[k].options = out;
}
['eyeColor', 'eyeshadow', 'blush', 'lips', 'hairColor', 'hairStreak', 'dressColor', 'dressTone'].forEach(addShades);

/* brand-new categories */
Object.assign(CATS, {
  eyeColor2: { name: '異色瞳', type: 'color', none: true, noneLabel: '同左眼', focus: [232, 200], options: CATS.eyeColor.options.slice() },
  faceShape: { name: '臉型', type: 'preview', view: '100 90 200 210', focus: [200, 220], options: O([
    ['round', '圓臉'], ['chubby', '肉肉臉'], ['mochi', '麻糬臉'], ['oval', '鵝蛋臉'], ['heart', '愛心臉'], ['small', '小臉']]) },
  ears: { name: '耳朵', type: 'preview', view: '66 130 110 120', focus: [120, 200], options: O([
    ['normal', '一般'], ['tiny', '小耳朵'], ['elf', '精靈耳'], ['longElf', '長精靈耳'], ['fairy', '粉尖精靈'], ['fin', '人魚鰭耳']]) },
  belt: { name: '腰帶', type: 'preview', view: '130 350 140 100', focus: [200, 404], options: O([
    ['none', '無'], ['ribbon', '緞帶'], ['pearl', '珍珠'], ['chain', '金鍊'], ['flower', '花朵'], ['gem', '寶石'], ['bowFront', '大蝴蝶結'], ['starBuckle', '星星扣'],
    ['heartBuckle', '愛心扣'], ['lace', '蕾絲'], ['corset', '綁帶'], ['rainbow', '彩虹'], ['butterfly', '蝴蝶'], ['sashTails', '飄帶'], ['crystal', '水晶']]) },
  socks: { name: '襪子', type: 'preview', view: '140 440 120 150', focus: [200, 530], options: O([
    ['none', '無'], ['white', '白長襪'], ['lace', '蕾絲短襪'], ['stripes', '條紋襪'], ['pinkTights', '粉紅褲襪'], ['hearts', '愛心褲襪'], ['stars', '星星褲襪'],
    ['ribbon', '綁帶襪'], ['frilly', '荷葉短襪'], ['lilac', '紫褲襪'], ['rainbow', '彩虹襪'], ['dots', '點點褲襪']]) },
  shoes: { name: '鞋子', type: 'preview', view: '150 520 100 80', focus: [200, 575], options: O([
    ['none', '光腳'], ['maryJane', '瑪莉珍'], ['glass', '玻璃鞋'], ['ballet', '芭蕾鞋'], ['boots', '短靴'], ['heels', '高跟鞋'], ['ribbonHeels', '緞帶高跟'], ['bunny', '兔兔鞋'],
    ['heartShoes', '愛心鞋'], ['star', '星星鞋'], ['sneakers', '球鞋'], ['fluffy', '毛毛拖'], ['crystal', '水晶鞋'], ['flower', '花朵鞋'], ['sandals', '涼鞋'], ['rainboots', '雨靴'], ['wingShoes', '翅膀鞋']]) },
  props: { name: '道具', type: 'preview', view: '0 0 400 600', focus: [330, 530], options: O([
    ['none', '無'], ['gifts', '禮物堆'], ['cake', '大蛋糕'], ['teaSet', '茶具'], ['books', '書堆'], ['chest', '寶箱'], ['vanity', '梳妝台'], ['musicBox', '音樂盒'],
    ['candyJar', '糖果罐'], ['roseBush', '玫瑰叢'], ['lamp', '星星燈'], ['crystalBall', '水晶球'], ['balloons', '氣球束'], ['potions', '魔法藥水'], ['flowerPot', '花盆'], ['castleModel', '城堡模型']]) },
  photoSticker: { name: '照片貼紙', type: 'preview', view: '0 0 400 600', focus: [200, 60], options: O([
    ['none', '無'], ['princess', 'Princess'], ['love', 'LOVE'], ['sweet', 'Sweet'], ['heartCorner', '愛心角'], ['starBurst', '星星爆'], ['crownBadge', '皇冠章'], ['happy', 'Happy Day'],
    ['ribbonBanner', '緞帶標語'], ['dreamy', 'Dreamy'], ['cute', 'Cute!'], ['kiss', '唇印'], ['sparkleCorners', '閃光角'], ['date', '日期章'], ['bubbles', '對話框'], ['paws', '腳印']]) },
});

/* place the new categories into the steps */
const stepById = (id) => STEPS.find(s => s.id === id);
stepById('eyes').cats.splice(2, 0, 'eyeColor2');
stepById('makeup').cats.unshift('faceShape', 'ears');
stepById('dress').cats.push('belt', 'socks', 'shoes');
stepById('bg').cats.push('props', 'photoSticker');
Object.assign(DEFAULT, { eyeColor2: null, faceShape: 'round', ears: 'normal', belt: 'none', socks: 'none', shoes: 'maryJane', props: 'none', photoSticker: 'none' });
