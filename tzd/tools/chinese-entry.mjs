import * as OpenCC from 'opencc-js';
const convert=OpenCC.Converter({from:'cn',to:'tw'});
export const toTraditional=text=>convert(String(text)
  .replace(/丑(?=[宮宫年時时月日位子寅卯辰巳午未申酉戌亥])/g,'\uE000')
  .replace(/([甲乙丙丁戊己庚辛壬癸子寅卯辰巳午未申酉戌亥])丑/g,'$1\uE000')
  .replace(/斗(?=[数數君])|(?<=[南北朝星])斗/g,'\uE001'))
  .replace(/\uE000/g,'丑').replace(/\uE001/g,'斗');
export const toSimplified=OpenCC.Converter({from:'tw',to:'cn'});
