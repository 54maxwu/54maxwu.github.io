import test from 'node:test';
import assert from 'node:assert/strict';
import {FixedStep} from '../game-src/fixed-step.js';
import {Player} from '../game-src/player.js';

test('30, 60 and 144 FPS advance equal time with 10ms collision steps',()=>{
  for (const fps of [30,60,144]) {
    const clock=new FixedStep();let elapsed=0,distance=0;
    for(let i=0;i<fps*10;i++)clock.advance(1/fps,dt=>{
      assert.equal(dt,.01);elapsed+=dt;distance+=6*dt;
    });
    assert.ok(Math.abs(elapsed-10)<1e-8);assert.ok(Math.abs(distance-60)<1e-8);
  }
});
test('stalls have bounded work, reset drops residual time and stopping aborts substeps',()=>{
  const clock=new FixedStep();let steps=0;
  clock.advance(1,()=>{steps++;});assert.equal(steps,4);
  clock.advance(.005,()=>{steps++;});clock.reset();
  clock.advance(.005,()=>{steps++;});assert.equal(steps,4);
  clock.advance(.04,()=>{steps++;return false;});assert.equal(steps,5);
  assert.equal(clock.remaining,0);
});
test('input reset removes held keys, queued actions and pointer motion',()=>{
  const player={keys:new Set(['KeyW']),pressed:new Set(['KeyR']),
    mouse:{l:true,lp:true,dx:30,wheel:1},touch:{fire:true,firePressed:true,mx:1},
    touchLook:{x:1,y:2},lookDX:3,lookDY:4};
  Player.prototype.resetInput.call(player);
  assert.equal(player.keys.size,0);assert.equal(player.pressed.size,0);
  assert.equal(player.mouse.lp,false);assert.equal(player.mouse.dx,0);
  assert.equal(player.mouse.wheel,0);assert.equal(player.touch.firePressed,false);
  assert.deepEqual(player.touchLook,{x:0,y:0});
});
