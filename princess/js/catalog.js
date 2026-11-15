/* ---------- every selectable option ---------- */
const O = (arr) => arr.map(([v, n]) => ({ v, n, css: isSpecial(v) ? specialCss(v) : null }));
const SPECIAL_OPTS = [['rainbow', '彩虹'], ['unicorn', '獨角獸'], ['galaxy', '銀河'], ['mermaid', '人魚'], ['sunset', '夕陽'], ['cotton', '棉花糖'], ['aurora', '極光'], ['peach', '蜜桃']];

const CATS = {
  /* ===== eyes ===== */
  eyeShape: { name: '眼型', type: 'preview', view: '120 150 160 90', focus: [200, 198], options: O([
    ['round', '圓圓眼'], ['big', '大眼睛'], ['doll', '洋娃娃'], ['almond', '杏仁眼'], ['droopy', '小狗眼'], ['sleepy', '睡美人'], ['smile', '笑咪咪'], ['wink', '眨眨眼']]) },
  eyeColor: { name: '瞳色', type: 'color', focus: [200, 198], options: O([
    ['#6b4226', '棕色'], ['#a0672d', '琥珀'], ['#3a7bd5', '藍色'], ['#79c7ff', '冰藍'], ['#5fd4ff', '水晶藍'], ['#1f4e9e', '深藍'], ['#9fa8ff', '長春花'], ['#3fa66b', '綠色'],
    ['#7ed957', '嫩綠'], ['#b8f5c8', '薄荷'], ['#2bb3a3', '湖水'], ['#8e5bd6', '紫色'], ['#c39bff', '淡紫'], ['#e0568f', '粉色'], ['#ff8fc7', '櫻粉'], ['#ffb3e6', '粉晶'],
    ['#d93a3a', '紅寶石'], ['#ff9f5a', '夕陽'], ['#f2b134', '金色'], ['#e0e0f0', '銀月'], ['#8a8fa3', '灰色'], ['#2b2b2b', '黑色']]) },
  iris: { name: '虹膜', type: 'preview', view: '146 180 44 40', focus: [200, 198], options: O([
    ['gradient', '漸層'], ['plain', '單色'], ['ring', '雙環'], ['rays', '放射'], ['dual', '雙色'], ['crystal', '水晶']]) },
  pupil: { name: '瞳孔', type: 'preview', view: '146 180 44 40', focus: [200, 198], options: O([
    ['round', '圓圓'], ['star', '星星'], ['heart', '愛心'], ['sparkle', '閃亮'], ['flower', '花朵'], ['diamond', '鑽石'], ['cat', '貓眼'],
    ['galaxy', '銀河'], ['moon', '月亮'], ['ring', '光環'], ['clover', '幸運草'], ['snow', '雪花']]) },
  highlight: { name: '眼神光', type: 'preview', view: '146 180 44 40', focus: [200, 198], options: O([
    ['sparkle', '閃閃'], ['round', '圓點'], ['star', '星光'], ['heart', '愛心光'], ['double', '雙光'], ['moon', '月光'], ['cross', '十字光'], ['cluster', '碎鑽'], ['big', '水汪汪']]) },
  lashes: { name: '睫毛', type: 'preview', view: '120 150 160 90', focus: [200, 186], options: O([
    [0, '無'], [1, '自然'], [2, '濃密'], [3, '洋娃娃'], [4, '捲翹'], [5, '紫色'], [6, '金粉'], [7, '羽毛'], [8, '下睫毛']]) },
  eyeliner: { name: '眼線', type: 'preview', view: '120 160 160 70', focus: [200, 192], options: O([
    ['none', '無'], ['thin', '細眼線'], ['wing', '上揚'], ['cat', '貓眼'], ['double', '上下'], ['smoky', '煙燻'], ['glitter', '金粉'], ['dotted', '點點'],
    ['heartTip', '愛心尾'], ['starTip', '星星尾'], ['blue', '藍色'], ['pink', '粉色'], ['purple', '紫色'], ['gold', '金色']]) },
  brows: { name: '眉毛', type: 'preview', view: '125 122 150 76', focus: [200, 156], options: O([
    ['natural', '自然'], ['arched', '挑眉'], ['straight', '平眉'], ['thick', '濃眉'], ['thin', '細眉'], ['soft', '無辜眉'], ['wave', '波浪'], ['short', '短眉'],
    ['feather', '羽毛眉'], ['dots', '麻呂眉'], ['heart', '愛心眉'], ['angry', '帥氣眉']]) },

  /* ===== face makeup ===== */
  skin: { name: '膚色', type: 'color', focus: [200, 190], options: O([
    ['#fff5f8', '珍珠'], ['#fff0e6', '瓷白'], ['#ffe8d9', '白皙'], ['#ffd9c2', '粉嫩'], ['#f9cfb0', '象牙'], ['#f5c7a1', '自然'], ['#eab48c', '蜜糖'], ['#e0a77c', '小麥'],
    ['#c98e63', '焦糖'], ['#b87a52', '健康'], ['#9a6440', '肉桂'], ['#8a5638', '可可'], ['#6b3f27', '巧克力'], ['#f3e6ff', '月光紫'], ['#e6f4ff', '冰雪藍'], ['#e6fbef', '精靈綠']]) },
  eyeshadow: { name: '眼影', type: 'color', none: true, focus: [200, 186], options: O([
    ['#ff9ccf', '粉紅'], ['#ffc2dd', '櫻花'], ['#ffd6f5', '珍珠粉'], ['#ff9ec7', '草莓'], ['#ff5fa2', '桃紅'], ['#d6c2ff', '夢幻紫'], ['#c79bff', '薰衣草'], ['#9d6bff', '紫晶'],
    ['#5a3e7a', '夜紫'], ['#b8f0ff', '冰晶'], ['#7fc8ff', '天空藍'], ['#4f8dff', '海洋'], ['#9effe0', '人魚'], ['#7ee0b5', '薄荷'], ['#3fbf8f', '翡翠'], ['#fff0b3', '月光'],
    ['#ffd166', '金色'], ['#ffe9a8', '香檳'], ['#ff8a65', '蜜桃'], ['#ffb347', '橘子'], ['#ff6b6b', '珊瑚紅'], ['#b5838d', '玫瑰棕'], ['#a0522d', '大地'], ['#c0c0d0', '銀灰']]) },
  shadowStyle: { name: '眼影樣式', type: 'preview', view: '120 145 160 85', focus: [200, 186], needs: ['eyeshadow', '#c79bff'], options: O([
    ['soft', '柔和'], ['glitter', '亮片'], ['stars', '星星'], ['smoky', '煙燻'], ['duo', '雙色'], ['double', '深淺'], ['halo', '光暈'], ['fade', '暈染'], ['wing', '飛翼'], ['rainbow', '彩虹']]) },
  highlighter: { name: '打亮', type: 'preview', view: '110 170 180 90', focus: [200, 215], options: O([
    ['none', '無'], ['glow', '光澤'], ['dewy', '水光'], ['pearl', '珍珠光'], ['glitter', '亮粉'], ['starry', '星光'], ['holo', '幻彩']]) },
  blush: { name: '腮紅', type: 'color', none: true, focus: [200, 235], options: O([
    ['#ff8fab', '草莓'], ['#ffab91', '蜜桃'], ['#f48fb1', '玫瑰'], ['#ce93d8', '紫羅蘭'], ['#ffcc80', '杏桃'], ['#ff6f91', '西瓜'], ['#ffb3c6', '棉花糖'], ['#ffc4e1', '櫻花粉'],
    ['#ff9ec7', '糖果'], ['#e0b3ff', '丁香'], ['#e57373', '楓紅'], ['#ff9e7a', '珊瑚'], ['#ffb5a7', '蜜桃粉'], ['#d4a5a5', '豆沙'], ['#ffd1dc', '嬰兒粉'], ['#b39ddb', '藕紫'], ['#ff80ab', '泡泡糖'], ['#f8a5c2', '櫻桃花']]) },
  blushStyle: { name: '腮紅樣式', type: 'preview', view: '110 200 180 70', focus: [200, 235], needs: ['blush', '#ff8fab'], options: O([
    ['round', '圓圓'], ['heart', '愛心'], ['lines', '害羞線'], ['wide', '曬傷妝'], ['star', '星星'], ['dots', '點點'], ['swirl', '漩渦'], ['flower', '花朵'], ['sparkle', '閃亮']]) },
  lips: { name: '口紅', type: 'color', none: true, focus: [200, 256], options: O([
    ['#ff4d6d', '櫻桃紅'], ['#ff7eb6', '芭比粉'], ['#ff85c0', '蜜糖粉'], ['#ffa8d2', '粉晶'], ['#e0568f', '莓果'], ['#ff5c8a', '玫瑰'], ['#ff8a65', '珊瑚'], ['#ff9a76', '蜜桃橘'],
    ['#b5179e', '葡萄紫'], ['#c46bff', '夢幻紫'], ['#c9184a', '正紅'], ['#f4a6a6', '裸粉'], ['#ff9ebb', '草莓牛奶'], ['#d6336c', '玫紅'], ['#a4133c', '酒紅'], ['#ff6f61', '番茄'],
    ['#ffb4a2', '蜜桃'], ['#e5989b', '豆沙'], ['#e8a0bf', '芋泥'], ['#9d4edd', '紫羅蘭'], ['#7b2cbf', '深紫'], ['#ff477e', '糖果'], ['#ffc8dd', '淡粉'], ['#c77dff', '薰衣草'],
    ['#f08080', '西瓜'], ['#8b2635', '莓果棕'], ['#4cc9f0', '冰藍'], ['#ffd60a', '金色']]) },
  lipStyle: { name: '唇型', type: 'preview', view: '172 236 56 40', focus: [200, 256], options: O([
    ['normal', '微笑'], ['glossy', '水潤'], ['glitter', '亮片唇'], ['ombre', '咬唇'], ['twoTone', '雙色'], ['heart', '愛心唇'], ['pout', '嘟嘟'], ['tiny', '櫻桃小嘴'],
    ['smile', '開心'], ['grin', '大笑'], ['ooh', '驚訝'], ['cat', '貓咪嘴']]) },

  /* ===== face art ===== */
  facePaint: { name: '臉部彩繪', type: 'preview', view: '100 100 200 170', focus: [200, 200], options: O([
    ['none', '無'], ['fairyDots', '精靈點點'], ['starTrail', '星星軌跡'], ['foreheadGem', '額間寶石'], ['moonForehead', '額間月亮'], ['flowerVine', '花藤'], ['butterflyTemple', '蝴蝶'],
    ['mermaidScales', '人魚鱗片'], ['rainbowTrail', '彩虹'], ['snowSwirl', '雪花漩渦'], ['heartTrail', '愛心串'], ['glitterFreckles', '金色雀斑'], ['crystalTears', '水晶淚'], ['goldSwirl', '金色花紋']]) },
  sticker: { name: '臉貼', type: 'preview', view: '110 130 180 160', focus: [250, 220], options: O([
    ['none', '無'], ['heart', '愛心'], ['star', '星星'], ['gems', '水鑽'], ['freckles', '小雀斑'], ['flower', '小花'], ['moon', '月亮'], ['butterfly', '蝴蝶'], ['rainbow', '彩虹'],
    ['sparkle', '閃光'], ['crown', '小皇冠'], ['tear', '淚鑽'], ['whiskers', '貓鬍鬚'], ['music', '音符'], ['cloud', '雲朵'], ['hearts3', '三顆心'], ['clover', '幸運草'],
    ['strawberry', '草莓'], ['bow', '蝴蝶結'], ['cherry', '櫻桃'], ['diamond', '鑽石'], ['kiss', '唇印'], ['sun', '太陽'], ['planet', '星球'], ['paw', '肉球']]) },

  /* ===== hair ===== */
  hairStyle: { name: '髮型', type: 'preview', view: '20 20 360 520', focus: [200, 120], options: O([
    ['long', '長直髮'], ['wavy', '公主捲'], ['mermaid', '人魚長捲'], ['ringlets', '螺旋捲'], ['superLong', '超長髮'], ['halfUp', '半紮髮'], ['waterfall', '瀑布辮'], ['crownBraid', '皇冠編髮'],
    ['hime', '公主切'], ['twin', '雙馬尾'], ['curlyTwin', '捲捲雙馬尾'], ['ponytail', '高馬尾'], ['bubblePony', '泡泡馬尾'], ['sidePony', '側馬尾'], ['bun', '高盤髮'], ['flowerBun', '花朵盤髮'],
    ['doubleBun', '雙丸子'], ['catBuns', '貓耳丸子'], ['sideBun', '側丸子'], ['braid', '側邊辮'], ['fishtail', '魚骨辮'], ['twinBraids', '雙辮子'], ['bob', '鮑伯頭'], ['shortCurly', '短捲髮'], ['pixie', '精靈短髮'], ['bigCurls', '蓬蓬捲']]) },
  bangs: { name: '瀏海', type: 'preview', view: '100 60 200 160', focus: [200, 120], options: O([
    ['side', '斜瀏海'], ['sideR', '反斜瀏海'], ['straight', '齊瀏海'], ['mini', '短瀏海'], ['wispy', '空氣瀏海'], ['curtain', '八字瀏海'], ['curl', '捲捲瀏海'], ['middle', '中分'], ['sideLong', '長側分'], ['none', '露額頭']]) },
  hairColor: { name: '髮色', type: 'color', focus: [200, 110], options: O([
    ['#f5c542', '金色'], ['#fbe7a1', '淺金'], ['#fff0c2', '香檳'], ['#d9a441', '蜂蜜'], ['#8d5524', '棕色'], ['#a0522d', '栗子'], ['#5a3825', '深棕'], ['#2d1e1a', '黑色'],
    ['#1f2a44', '藍黑'], ['#3d2b5c', '夜紫'], ['#ffd1e8', '草莓奶'], ['#ff8fc7', '粉紅'], ['#ff9ad5', '糖果'], ['#ff4d9a', '桃紅'], ['#ffc0a8', '珊瑚粉'], ['#ffb38a', '蜜桃'],
    ['#c8b8ff', '丁香'], ['#d9c2ff', '薰衣草'], ['#b48cff', '紫色'], ['#e0f0ff', '冰雪'], ['#8ad8ff', '天藍'], ['#6ec3ff', '冰藍'], ['#3a5bd5', '寶藍'], ['#7ee0c5', '薄荷'],
    ['#e8e8f0', '銀白'], ['#d9483b', '火紅'], ['#e07a2e', '橘銅'], ['#e8a7a0', '玫瑰金']]) },
  hairTip: { name: '漸層髮尾', type: 'color', none: true, noneLabel: '無', focus: [200, 380], options: O([
    ...SPECIAL_OPTS, ['#ff8fc7', '粉紅'], ['#b48cff', '紫色'], ['#6ec3ff', '藍色'], ['#7ee0c5', '薄荷'], ['#ffd166', '金黃'], ['#ff6b6b', '紅色'], ['#ffffff', '白色'],
    ['#ffb38a', '蜜桃'], ['#3a5bd5', '寶藍'], ['#2d1e1a', '黑色'], ['#c0ff8a', '萊姆'], ['#ff4d9a', '桃紅']]) },
  hairStreak: { name: '挑染', type: 'color', none: true, noneLabel: '無', focus: [200, 130], options: O([
    ['#ff8fc7', '粉紅'], ['#b48cff', '紫色'], ['#6ec3ff', '藍色'], ['#7ee0c5', '薄荷'], ['#ffd166', '金色'], ['#ffffff', '白色'], ['#ff4d9a', '桃紅'], ['#ffb38a', '蜜桃'], ['#2d1e1a', '黑色'], ['#ff6b6b', '紅色']]) },
  hairAcc: { name: '髮飾', type: 'preview', view: '90 80 220 180', focus: [140, 150], options: O([
    ['none', '無'], ['pearlPins', '珍珠髮夾'], ['starChain', '星星髮鍊'], ['pearlStrand', '珍珠髮帶'], ['flowerVine', '花藤'], ['sakura', '櫻花枝'], ['ribbonStreamers', '彩帶'], ['butterflies', '蝴蝶群'],
    ['gemPins', '寶石夾'], ['heartClips', '愛心夾'], ['bowPins', '小蝴蝶結'], ['moonStars', '星月夾'], ['feather', '羽毛'], ['beads', '串珠'], ['crystalComb', '水晶髮梳'], ['glitterDust', '亮粉']]) },

  /* ===== dress ===== */
  dress: { name: '款式', type: 'preview', view: '10 280 380 320', focus: [200, 450], options: O([
    ['ball', '蓬蓬裙'], ['pearlGown', '珍珠禮服'], ['court', '宮廷長袖'], ['starlight', '星光拖尾'], ['cake', '蛋糕裙'], ['macaron', '馬卡龍'], ['cloud', '雲朵裙'], ['mermaid', '人魚裙'],
    ['jellyfish', '水母裙'], ['star', '星空裙'], ['flower', '花朵裙'], ['petal', '花瓣裙'], ['fairy', '精靈葉裙'], ['swan', '天鵝羽毛'], ['tutu', '芭蕾裙'], ['offshoulder', '一字肩'],
    ['empire', '高腰雪紡'], ['cape', '披風禮服'], ['snow', '冰雪裙'], ['rainbow', '彩虹裙'], ['ribbon', '蝴蝶結裙'], ['bowTier', '層層蝴蝶結'], ['heart', '甜心裙'], ['lantern', '燈籠袖'],
    ['party', '小洋裝'], ['bubble', '泡泡裙'], ['butterfly', '蝴蝶袖']]) },
  dressColor: { name: '顏色', type: 'color', focus: [200, 450], options: O([
    ['#ff9ccf', '粉紅'], ['#ffc2dd', '櫻花'], ['#ffe0f0', '棉花糖'], ['#ff9ad5', '糖果粉'], ['#ff5fa2', '桃紅'], ['#ffd6d6', '蜜桃粉'], ['#b48cff', '紫色'], ['#c8a2ff', '夢幻紫'],
    ['#d9c2ff', '淡紫'], ['#e8dcff', '丁香'], ['#7b4dff', '深紫'], ['#7fc8ff', '水藍'], ['#bfe6ff', '冰藍'], ['#d6f5ff', '天空'], ['#3a7bd5', '寶藍'], ['#3d3b8e', '夜藍'],
    ['#7ee0b5', '薄荷'], ['#dcffe8', '薄荷奶'], ['#2bb3a3', '湖水綠'], ['#a8e063', '嫩綠'], ['#ffd166', '金黃'], ['#fff3b0', '奶油'], ['#fff0d6', '香草'], ['#ffb347', '橘子'],
    ['#ff8a65', '蜜桃'], ['#ff6b6b', '珊瑚紅'], ['#d62839', '正紅'], ['#8b1e3f', '酒紅'], ['#ffffff', '純白'], ['#e0e0ea', '銀色'], ['#d4af37', '金色'], ['#2b2b3a', '黑色']]) },
  dressTone: { name: '漸層裙擺', type: 'color', none: true, noneLabel: '無', focus: [200, 540], options: O([
    ...SPECIAL_OPTS, ['#ffffff', '白色'], ['#ff8fc7', '粉紅'], ['#b48cff', '紫色'], ['#6ec3ff', '藍色'], ['#7ee0c5', '薄荷'], ['#ffd166', '金色'], ['#ff6b6b', '紅色'], ['#3d3b8e', '夜藍'], ['#ffb38a', '蜜桃'], ['#2b2b3a', '黑色']]) },
  fabric: { name: '布料光澤', type: 'preview', view: '60 380 280 220', focus: [200, 480], options: O([
    ['satin', '絲緞'], ['matte', '霧面'], ['glitter', '亮片'], ['starlight', '星光'], ['holo', '幻彩'], ['pearl', '珍珠光'], ['tulle', '薄紗'], ['velvet', '絲絨']]) },
  pattern: { name: '圖案', type: 'preview', view: '60 380 280 220', focus: [200, 480], options: O([
    ['none', '無'], ['dots', '圓點'], ['bigDots', '大圓點'], ['stripes', '斜條紋'], ['hearts', '愛心'], ['stars', '星星'], ['moons', '月亮'], ['glitter', '亮片'], ['lace', '蕾絲'],
    ['checks', '格紋'], ['plaid', '蘇格蘭'], ['argyle', '菱格'], ['flowers', '小碎花'], ['butterflies', '蝴蝶'], ['ribbons', '蝴蝶結'], ['clouds', '雲朵'], ['sparkles', '閃閃'], ['rainbow', '彩虹條'], ['snow', '雪花']]) },
  skirtDeco: { name: '裙擺裝飾', type: 'preview', view: '20 380 360 220', focus: [200, 540], options: O([
    ['none', '無'], ['pearlSwag', '珍珠垂鍊'], ['crystals', '水晶'], ['ribbonBows', '蝴蝶結'], ['flowerGarland', '花環'], ['roses', '玫瑰'], ['laceTrim', '蕾絲邊'], ['ruffles', '荷葉邊'],
    ['butterflies', '蝴蝶'], ['starTrail', '星星'], ['hearts', '愛心'], ['featherTrim', '羽毛邊'], ['goldEmbroidery', '金色刺繡']]) },
  shawl: { name: '披肩', type: 'preview', view: '60 280 280 230', focus: [200, 340], options: O([
    ['none', '無'], ['sheer', '薄紗披肩'], ['capelet', '蕾絲短披肩'], ['furStole', '毛毛圍巾'], ['featherBoa', '羽毛圍巾'], ['ribbonSash', '綬帶'], ['flowerSash', '花朵綬帶'],
    ['pearlCape', '珍珠肩鍊'], ['starCape', '星星斗篷'], ['bowBack', '大背結']]) },

  /* ===== jewellery ===== */
  crown: { name: '頭飾', type: 'preview', view: '90 10 220 160', focus: [200, 80], options: O([
    ['none', '無'], ['crown', '皇冠'], ['tiara', '冠冕'], ['pearlTiara', '珍珠冠'], ['starCrown', '星星冠'], ['moonTiara', '月亮冠'], ['iceCrown', '冰晶冠'], ['heartCrown', '愛心冠'],
    ['butterflyCrown', '蝴蝶冠'], ['shellCrown', '貝殼冠'], ['roseCrown', '玫瑰冠'], ['wreath', '花環'], ['antlers', '花鹿角'], ['circlet', '額鍊'], ['halo', '天使光環'], ['veil', '頭紗'],
    ['hennin', '公主尖帽'], ['unicorn', '獨角獸角'], ['catEars', '貓耳'], ['bunnyEars', '兔耳'], ['bearEars', '熊耳'], ['bow', '蝴蝶結'], ['ribbons', '雙蝴蝶結'], ['headband', '珍珠髮箍'],
    ['beret', '貝雷帽'], ['topHat', '迷你禮帽'], ['fascinator', '羽毛髮飾'], ['starclip', '星星夾'], ['moonClip', '月亮夾'], ['flowerClip', '大花夾'], ['butterflyClips', '蝴蝶夾']]) },
  earrings: { name: '耳環', type: 'preview', view: '92 196 60 64', focus: [122, 230], options: O([
    ['none', '無'], ['stud', '鑽石'], ['pearl', '珍珠'], ['pearlDrop', '珍珠墜'], ['heart', '愛心'], ['star', '星星'], ['drop', '水滴鑽'], ['hoop', '圈圈'], ['moon', '月亮'],
    ['planet', '星球'], ['cloud', '雲朵'], ['rainbow', '彩虹'], ['flower', '小花'], ['cherry', '櫻桃'], ['strawberry', '草莓'], ['icecream', '冰淇淋'], ['butterfly', '蝴蝶'],
    ['bow', '蝴蝶結'], ['crown', '皇冠'], ['shell', '貝殼'], ['feather', '羽毛'], ['bell', '小鈴鐺'], ['tassel', '流蘇'], ['chandelier', '華麗吊燈'], ['snowflake', '雪花']]) },
  necklace: { name: '項鍊', type: 'preview', view: '140 270 120 90', focus: [200, 315], options: O([
    ['none', '無'], ['pearl', '珍珠'], ['doublePearl', '雙層珍珠'], ['pearlY', 'Y字珍珠'], ['heart', '愛心'], ['heartChain', '愛心串'], ['gem', '寶石'], ['tearDrop', '大淚滴'],
    ['crystal', '水晶'], ['star', '星星'], ['starChain', '星星串'], ['moon', '月亮'], ['sunMoon', '日月'], ['flowerChain', '花鍊'], ['bow', '蝴蝶結'], ['ribbonPearl', '緞帶珍珠'],
    ['key', '小鑰匙'], ['locket', '相片盒'], ['crownPendant', '皇冠墜'], ['butterfly', '蝴蝶'], ['shell', '貝殼'], ['cherry', '櫻桃'], ['beads', '彩虹珠'], ['choker', '頸鍊'], ['lace', '蕾絲頸鍊']]) },
  glasses: { name: '眼鏡', type: 'preview', view: '115 150 170 100', focus: [200, 198], options: O([
    ['none', '無'], ['round', '圓框'], ['heart', '愛心'], ['star', '星星'], ['cateye', '貓眼框'], ['square', '方框'], ['rainbow', '彩虹框'], ['flowerFrame', '花朵框'],
    ['monocle', '單片眼鏡'], ['sunglasses', '墨鏡'], ['mask', '舞會面具'], ['butterflyMask', '蝴蝶面具'], ['catMask', '貓咪面具']]) },
  gloves: { name: '手套手環', type: 'preview', view: '100 380 80 110', focus: [136, 450], options: O([
    ['none', '無'], ['white', '白手套'], ['lace', '蕾絲手套'], ['pink', '粉緞手套'], ['lilac', '紫緞手套'], ['ruffle', '荷葉袖口'], ['pearl', '珍珠手環'], ['gold', '金手環'],
    ['crystal', '水晶手環'], ['star', '星星手鍊'], ['flower', '花手腕'], ['ribbon', '緞帶'], ['charm', '串珠手鍊']]) },

  /* ===== magic ===== */
  wings: { name: '翅膀', type: 'preview', view: '0 160 400 380', focus: [200, 320], options: O([
    ['none', '無'], ['fairy', '精靈'], ['crystalFairy', '水晶精靈'], ['angel', '天使'], ['pinkAngel', '粉紅天使'], ['butterfly', '蝴蝶'], ['moth', '月光蛾'], ['galaxy', '銀河'], ['dragonfly', '蜻蜓'],
    ['heart', '愛心'], ['star', '星星'], ['ice', '冰晶'], ['snowflake', '雪花'], ['rainbow', '彩虹'], ['cloud', '雲朵'], ['bubble', '泡泡'], ['petal', '花瓣'], ['leaf', '葉子'], ['ribbon', '緞帶']]) },
  aura: { name: '魔法光效', type: 'preview', view: '0 0 400 600', focus: [200, 300], options: O([
    ['none', '無'], ['sparkles', '閃閃發光'], ['stars', '小星星'], ['hearts', '愛心泡泡'], ['bubbles', '泡泡'], ['petals', '櫻花雨'], ['snow', '雪花飄'], ['butterflies', '蝴蝶飛舞'],
    ['notes', '音符'], ['fireflies', '螢火蟲'], ['glitterRain', '金粉雨'], ['bokeh', '光斑'], ['rainbowGlow', '彩虹光'], ['lightRays', '聖光'], ['magicCircle', '魔法陣']]) },
  held: { name: '手持', type: 'preview', view: '200 260 160 260', focus: [270, 420], options: O([
    ['none', '無'], ['wand', '魔法棒'], ['heartWand', '愛心棒'], ['starStaff', '星月法杖'], ['scepter', '權杖'], ['orb', '水晶球'], ['bubbleWand', '泡泡棒'], ['lantern', '小燈籠'],
    ['fan', '扇子'], ['bouquet', '捧花'], ['basket', '花籃'], ['rose', '玫瑰'], ['mirror', '手鏡'], ['glassSlipper', '玻璃鞋'], ['balloon', '氣球'], ['parasol', '洋傘'], ['pinwheel', '風車'],
    ['teddy', '小熊'], ['purse', '小包包'], ['giftBox', '禮物盒'], ['lollipop', '棒棒糖'], ['cottonCandy', '棉花糖'], ['icecream', '冰淇淋'], ['cupcake', '杯子蛋糕'], ['macaron', '馬卡龍'], ['book', '故事書']]) },
  pet: { name: '寵物', type: 'preview', view: '0 420 160 180', focus: [75, 530], options: O([
    ['none', '無'], ['cat', '橘貓'], ['whiteCat', '白貓'], ['bunny', '兔兔'], ['puppy', '小狗'], ['chick', '小雞'], ['hamster', '倉鼠'], ['panda', '熊貓'], ['fox', '狐狸'],
    ['penguin', '企鵝'], ['bear', '小熊'], ['koala', '無尾熊'], ['seal', '小海豹'], ['lamb', '小綿羊'], ['deer', '小鹿'], ['squirrel', '松鼠'], ['owl', '貓頭鷹'],
    ['unicorn', '小獨角獸'], ['dragon', '粉紅小龍'], ['jellyfish', '小水母'], ['butterfly', '大蝴蝶'], ['bird', '肩上小鳥']]) },

  /* ===== scene ===== */
  bg: { name: '場景', type: 'preview', view: '0 0 400 600', focus: [200, 300], options: O([
    ['castle', '城堡'], ['iceCastle', '冰雪城堡'], ['sweetDream', '甜甜夢境'], ['clouds', '雲上王國'], ['garden', '花園'], ['sakura', '櫻花'], ['lavender', '薰衣草田'], ['teaParty', '下午茶'],
    ['carousel', '旋轉木馬'], ['forest', '森林'], ['fairyForest', '精靈森林'], ['rainbow', '彩虹'], ['candy', '糖果國'], ['night', '星空'], ['moonLake', '月光湖'], ['aurora', '極光'],
    ['space', '宇宙'], ['crystalCave', '水晶洞'], ['sea', '海底'], ['lagoon', '人魚礁湖'], ['beach', '夕陽海灘'], ['snow', '雪國'], ['autumn', '秋天'], ['ballroom', '舞會'],
    ['stage', '舞台'], ['bedroom', '公主房'], ['hearts', '愛心']]) },
  frame: { name: '相框', type: 'preview', view: '0 0 400 600', focus: [200, 40], options: O([
    ['none', '無'], ['gold', '金色華麗'], ['pearls', '珍珠'], ['flowers', '花朵'], ['roses', '玫瑰'], ['hearts', '愛心'], ['stars', '星星'], ['lace', '蕾絲'], ['crystal', '水晶'], ['ribbon', '緞帶'], ['clouds', '雲朵']]) },
};

const STEPS = [
  { id: 'clean', icon: '🧼', name: '洗臉', tip: '先用海綿把公主的臉擦乾淨吧！' },
  { id: 'eyes', icon: '👀', name: '眼睛', tip: '選一雙閃亮亮的夢幻大眼睛 ✨', cats: ['eyeShape', 'eyeColor', 'iris', 'pupil', 'highlight', 'lashes', 'eyeliner', 'brows'] },
  { id: 'makeup', icon: '💄', name: '彩妝', tip: '幫公主畫上美美的妝 💕', cats: ['skin', 'eyeshadow', 'shadowStyle', 'highlighter', 'blush', 'blushStyle', 'lips', 'lipStyle'] },
  { id: 'art', icon: '🎨', name: '彩繪', tip: '在臉上畫點魔法圖案吧 🦋', cats: ['facePaint', 'sticker'] },
  { id: 'hair', icon: '💇', name: '髮型', tip: '挑一個喜歡的髮型吧！', cats: ['hairStyle', 'bangs', 'hairColor', 'hairTip', 'hairStreak', 'hairAcc'] },
  { id: 'dress', icon: '👗', name: '禮服', tip: '換上夢幻的禮服～', cats: ['dress', 'dressColor', 'dressTone', 'fabric', 'pattern', 'skirtDeco', 'shawl'] },
  { id: 'acc', icon: '💎', name: '珠寶', tip: '再加點閃亮亮的珠寶！', cats: ['crown', 'earrings', 'necklace', 'glasses', 'gloves'] },
  { id: 'magic', icon: '🦄', name: '魔法', tip: '翅膀、魔法光、小寵物～', cats: ['wings', 'aura', 'held', 'pet'] },
  { id: 'bg', icon: '🏰', name: '場景', tip: '選一個夢幻場景，然後拍照吧 📸', cats: ['bg', 'frame'] },
];

const DEFAULT = {
  eyeShape: 'big', eyeColor: '#8e5bd6', iris: 'gradient', pupil: 'round', highlight: 'sparkle', lashes: 1, eyeliner: 'none', brows: 'soft',
  skin: '#ffe8d9', eyeshadow: null, shadowStyle: 'soft', highlighter: 'glow', blush: null, blushStyle: 'round', lips: null, lipStyle: 'normal',
  facePaint: 'none', sticker: 'none',
  hairStyle: 'wavy', bangs: 'side', hairColor: '#fbe7a1', hairTip: null, hairStreak: null, hairAcc: 'none',
  dress: 'ball', dressColor: '#ffc2dd', dressTone: null, fabric: 'satin', pattern: 'none', skirtDeco: 'none', shawl: 'none',
  crown: 'tiara', earrings: 'none', necklace: 'none', glasses: 'none', gloves: 'none',
  wings: 'none', aura: 'sparkles', held: 'none', pet: 'none', bg: 'castle', frame: 'gold',
};
