// Check teardown before pause: the menu may already have cleared the player.
export function replayState(game){
  if(!game.playing||!game.player||game.player.alive)return 'stop';
  return game.paused||game.inLoadout?'paused':'play';
}
