import {PRIMARIES} from './weapons.js';

export function normalizeOptions(raw, touch = false) {
  const defaults = {team:'BL',primary:'ak47',size:4,diff:'normal',goal:50,tod:'day',quality:touch?'low':'high',sens:1,fov:78,vol:.8};
  const choices = {team:['BL','GR'],primary:PRIMARIES,size:[4,6,8],diff:['easy','normal','hard','hell'],goal:[30,50,100],tod:['day','dusk'],quality:['low','medium','high']};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaults;
  for (const [key, values] of Object.entries(choices)) if (values.includes(raw[key])) defaults[key] = raw[key];
  for (const [key,min,max] of [['sens',.2,3],['fov',65,100],['vol',0,1]]) {
    if (typeof raw[key] === 'number' && Number.isFinite(raw[key])) defaults[key] = Math.max(min,Math.min(max,raw[key]));
  }
  return defaults;
}
