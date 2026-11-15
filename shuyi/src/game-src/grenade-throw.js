import * as THREE from 'three';

export const GRENADE_PRIME=.52,GRENADE_WINDUP=.2,GRENADE_ANIMATION=1.1,GRENADE_HOLD=.48;
export const GRENADE_RELEASE=GRENADE_HOLD+GRENADE_WINDUP/GRENADE_ANIMATION;
export const GRENADE_KEYS=[
  [0,{}],[.2,{x:.02,y:.025,z:.04,rz:-.1}],
  [GRENADE_HOLD,{x:.04,y:.03,z:.04,rx:.2,ry:-.1}],
  [.56,{x:.1,y:.1,z:.14,rx:.75,ry:-.4,rz:.12}],
  [GRENADE_RELEASE,{x:.04,y:.13,z:-.2,rx:-.9,ry:.1}],
  [.82,{x:0,y:.035,z:-.24,rx:-1.1}],
  [1,{x:.02,y:-.12,z:-.08,rx:-.3}],
];

export function grenadeLaunch(actor){
  const forward=actor.forward(new THREE.Vector3()),right=new THREE.Vector3(Math.cos(actor.yaw),0,-Math.sin(actor.yaw));
  const up=new THREE.Vector3().crossVectors(right,forward).normalize();
  // Same camera-space position as HOLD.he + the release keyframe.
  const position=actor.eye(new THREE.Vector3()).addScaledVector(right,.17).addScaledVector(up,.01).addScaledVector(forward,.5);
  const velocity=forward.clone().multiplyScalar(15).add(new THREE.Vector3(0,3.6,0)).addScaledVector(actor.vel,.6);
  return {position,velocity};
}
