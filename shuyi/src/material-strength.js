const STRENGTH={granite:1.4,concrete:1.25,metal:1.5,brick:.9,stone:1,plaster:.32,wood:.4,board:.3,roof:.38,beige:.4,white:.5,green:1.1,red:1.1,blue:1.1,yellow:1.1,quarry:.9,terrazzo:1,leaf:.12,leafLight:.12,leafDark:.12,foliage:.08,flower:.08};
export function materialDurability(kind,volume){return Math.round(Math.max(35,Math.min(520,380*Math.sqrt(Math.max(0,volume)/.6)))*(STRENGTH[kind]??1));}
