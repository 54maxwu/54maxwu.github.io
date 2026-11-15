export function replayTime(elapsed){const t=Math.max(0,elapsed-.55);return t<.7?-.8+t/.7*.6:t<2.9?-.2+(t-.7)*.2:.24+(t-2.9)*.65;}
