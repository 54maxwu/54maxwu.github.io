import test from 'node:test';import assert from 'node:assert/strict';
import {replayState} from '../game-src/replay-state.js';

test('quitting or losing the player during replay exits before dereferencing player state',()=>{
 for(const game of [{playing:false,player:null,paused:true},{playing:true,player:null},{playing:true,player:{alive:true}}]){
  assert.equal(replayState(game),'stop');
 }
});
test('pause and loadout suspend a dead player replay rather than ending it',()=>{
 for(const field of ['paused','inLoadout']){
  const game={playing:true,player:{alive:false},[field]:true};assert.equal(replayState(game),'paused');game[field]=false;assert.equal(replayState(game),'play');
 }
});
