import test from 'node:test';
import assert from 'node:assert/strict';
import {buildBazi} from '../engine-calendar.js';
import {calculateTrueSolarTime} from '../true-solar-time.js';
import {buildUpstreamZiwei,renderUpstream,tw,formatInterpretation} from '../upstream-ziwei.js';
import {detectGeju} from '../ziwei-geju.js';
import * as U from '../vendor/generated/ziwei.js';
import * as C from '../vendor/generated/classics.js';
const defaults={brightnessSchool:'default',leapMonth:'split',lateZishi:'next-day'};
test('traditional conversion preserves technical earthly-branch names',()=>{
  assert.equal(tw('丑宫、乙丑、辰戌丑未、丑陋'),'丑宮、乙丑、辰戌丑未、醜陋');
  assert.equal(tw('七杀朝斗、南斗、争斗'),'七殺朝斗、南斗、爭鬥');
  assert.equal(formatInterpretation('**标题**<img src=x onerror=alert(1)>'),'<strong>標題</strong>&lt;img src=x onerror=alert(1)&gt;');
});
test('time correction matches upstream, including leap years and midnight rollover',()=>{
  for(const year of [1900,1950,1990,2000,2024,2026,2100])for(const month of [1,2,6,12])for(const hour of [0,1,22,23])for(const longitude of [75,120,121.5,150]){
    const input={year,month,day:1,clockHour:hour,clockMinute:55,longitude};
    assert.deepEqual(calculateTrueSolarTime(input),U.calculateTrueSolarTime(input));
    const b=buildBazi(year,month,1,hour,55,{useTrueSolar:true,longitude});
    const solar=U.calculateTrueSolarTime(input);
    assert.equal(b.hourIdx,solar.branch);
    const date=U.shiftGregorianDate({year,month,day:1},solar.dayOffset);
    assert.deepEqual(b.ziweiDate,{y:date.year,m:date.month,d:date.day});
  }
});
test('all chart stars, brightness, and transformations agree with upstream',()=>{
  for(const year of [1950,1984,1990,2000,2023,2026])for(const month of [1,4,8,12])for(let hour=0;hour<24;hour+=2)for(const sex of ['男','女']){
    const b=buildBazi(year,month,1,hour,0);
    const {z}=buildUpstreamZiwei(b,sex,defaults);
    assert.equal(z.palaces.length,12);
    let majorCount=0;
    for(const p of z.palaces){
      const up=z.upstream.chart.palaces.find(q=>tw(q.name)===p.name);
      assert.ok(up);
      const stars=[...p.majorStars,...p.minorStars,...p.adjStars];
      assert.deepEqual(stars.map(s=>s.name).sort(),up.stars.map(s=>tw(s.name)).sort());
      for(const s of stars){const u=up.stars.find(x=>tw(x.name)===s.name);assert.equal(s.brightness,tw(u.brightnessRaw||''));assert.equal(s.mutagen,tw(u.siHua||''));}
      majorCount+=p.majorStars.length;
    }
    assert.equal(majorCount,14);
    assert.deepEqual(detectGeju(z).map(p=>p.name),z.upstream.patterns.map(p=>tw(p.name)));
  }
});
test('Ziwei late-hour rule changes chart date only once; Bazi school stays separate',()=>{
  const b=buildBazi(2024,12,31,23,30,{ziSchool:'early'});
  const next=buildUpstreamZiwei(b,'男',defaults).z;
  const current=buildUpstreamZiwei(b,'男',{...defaults,lateZishi:'current-day'}).z;
  assert.deepEqual(next.upstream.date,{year:2025,month:1,day:1});
  assert.deepEqual(current.upstream.date,{year:2024,month:12,day:31});
  assert.deepEqual(b.effective,{y:2025,m:1,d:1});
});
test('brightness selection resets and all four leap-month policies produce matching charts',()=>{
  const b=buildBazi(2023,4,10,12,0);
  const baseline=buildUpstreamZiwei(b,'女',defaults).z;
  buildUpstreamZiwei(b,'女',{...defaults,brightnessSchool:'XD2'});
  const reset=buildUpstreamZiwei(b,'女',defaults).z;
  assert.deepEqual(reset.palaces,baseline.palaces);
  for(const leapMonth of ['split','prev-month','next-month','origin-month']){
    const {z,astro}=buildUpstreamZiwei(b,'女',{...defaults,leapMonth});
    for(const p of z.palaces)assert.deepEqual(p.majorStars.map(s=>s.name).sort(),astro.palace(p.name).majorStars.map(s=>s.name).sort());
    assert.ok(renderUpstream(z).includes('嚴格格局判定'));
  }
});
test('invalid solar dates are rejected and classics have searchable content',()=>{
  assert.throws(()=>U.generateChart({year:2023,month:2,day:29,hour:0,gender:'male'}),RangeError);
  assert.equal(C.ALL_BOOKS.length,3);
  assert.ok(C.searchClassics('太阴').length);
});
