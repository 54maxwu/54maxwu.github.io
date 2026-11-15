export const REPLAY_DURATION=9.5;
// Establish the attacker, approach the fatal impact, then hold its exact pose.
export function replayTime(elapsed){return elapsed<2.5?-.8+Math.max(0,elapsed)*.2:elapsed<6.5?-.3+(elapsed-2.5)*.075:0;}
