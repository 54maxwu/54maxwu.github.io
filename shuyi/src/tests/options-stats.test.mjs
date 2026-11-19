import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeOptions} from '../game-src/options.js';
import {PerformanceStats} from '../game-src/performance-stats.js';

test('corrupt or obsolete saved settings cannot create invalid teams, weapons or numbers',()=>{
  for(const raw of [null,[],42,'bad', {team:'x',primary:'missing',size:10000,diff:'invalid',goal:-1,quality:'ultra',sens:NaN,fov:Infinity,vol:'loud'}]) {
    assert.deepEqual(normalizeOptions(raw),normalizeOptions(null));
  }
  assert.equal(normalizeOptions(null,true).quality,'low');
  const opts=normalizeOptions({team:'GR',primary:'rpg',size:8,fov:500,sens:-10,vol:2});
  assert.equal(opts.primary,'rpg');assert.equal(opts.team,'GR');assert.equal(opts.size,8);
  assert.equal(opts.fov,100);assert.equal(opts.sens,.2);assert.equal(opts.vol,1);
});

test('performance report retains only the latest 300 samples after wraparound',()=>{
  const stats=new PerformanceStats();
  for(let i=0;i<700;i++)stats.add({frameMs:i});
  const result=stats.report();assert.equal(result.samples,300);
  assert.deepEqual(result.frameMs,{median:549,p95:684,max:699});
  assert.equal(result.renderMs,null);
});
