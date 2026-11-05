import test from 'node:test';
import assert from 'node:assert/strict';
import {getZiweiReading,renderReadingHighlights,renderRuleEvidence} from '../reading-model.js';
import {getTopicIds,packMonthlySequences} from '../dataset-format.js';
import {renderSummary,ziweiOverview,ziweiSummary,palaceDetailHTML} from '../render.js';
const z={soul:'天機',body:'天梁',fiveElementsClass:'水二局',palaces:[{name:'命宮',majorStars:[{name:'天府',brightness:'廟',mutagen:'忌'}],minorStars:[],adjStars:[],isBodyPalace:true},{name:'遷移',majorStars:[{name:'太陽'}],minorStars:[],adjStars:[]}],upstream:{patterns:[{name:'測試格',level:'excellent',description:'必定大富大貴',conditions:{required:['主星同宮'],bonus:['會吉星'],breaking:['三方見煞']},source:'測試來源'}]}};
const a={ziwei:z,strength:{strength:'身弱'},yong:{primary:['火']},ziweiHoro:{solarDate:'2027-7-1',yearly:{branch:'未',stem:'丁',mutagen:['太陰','天同','天機','巨門']},decadal:{branch:'申',stem:'壬'}}};
test('breaking conditions override favorable labels in every summary, with visible evidence',()=>{
  const r=getZiweiReading(z);assert.equal(r.rules[0].status,'有破格提醒');assert.equal(r.transformations[0].hua,'忌');
  for(const html of [renderReadingHighlights(a),renderSummary(a),ziweiSummary(z,a),ziweiOverview(z,a,{},'')]){
    assert.ok(!html.includes('必定大富大貴'));assert.ok(!html.includes('最強'));
  }
  const evidence=renderRuleEvidence(r.rules[0]);assert.ok(evidence.includes('三方見煞'));assert.ok(evidence.includes('測試來源'));assert.ok(!evidence.includes('符合上格條件'));
  assert.equal(renderSummary(a),ziweiSummary(z,a));
});
test('chosen year and natal data are separate, including unknown birth-time fallback',()=>{
  const html=renderReadingHighlights(a);assert.ok(html.includes('2027 年'));assert.ok(html.includes('固定資料集不替代流年判讀'));
  const noHour=renderReadingHighlights({strength:{strength:'中和'},yong:{primary:['木']}});assert.ok(noHour.includes('時辰不詳'));assert.ok(!noHour.includes('undefined'));
});
test('canonical palace detail does not apply legacy score or dictionary verdict',()=>{
  const html=palaceDetailHTML(z.palaces[0],{canonical:true,he:[],hePals:[]});
  assert.ok(html.includes('不以星曜亮度加減分'));assert.ok(!html.includes('強旺、是你的優勢'));
});
test('sequence deduplication is lossless across topics and supports existing indexes',()=>{
  const d={rows:{a:{c:{love:[0,1,2],career:[0,1,2]}},b:{c:{love:[2,1],career:[0,1,2]}}}};
  const p=packMonthlySequences(d);assert.equal(p.sequences.length,2);
  for(const [key,row]of Object.entries(d.rows))for(const topic of Object.keys(row.c))assert.deepEqual(getTopicIds(p,p.rows[key],topic),row.c[topic]);
  assert.deepEqual(getTopicIds(d,d.rows.a,'love'),[0,1,2]);assert.throws(()=>getTopicIds({sequences:[]},{c:{love:4}},'love'));
});
