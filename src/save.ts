import { GAMES, type GameId } from './catalog';
import { readSchulteCompleted } from './standalone-progress';
const KEY = 'neurons-play-v1';
export interface Saved { version:1; sound:boolean; completed:Partial<Record<GameId,number[]>>; }
export function readSave(raw: string|null): Saved {
  const base:Saved = {version:1,sound:true,completed:{}};
  try {
    const value = JSON.parse(raw ?? 'null');
    if (value?.version !== 1) return base;
    base.sound = value.sound !== false;
    for (const game of GAMES) {
      if(game.id==='schulte')continue;
      const levels = value.completed?.[game.id];
      if (Array.isArray(levels)) base.completed[game.id] = [...new Set(levels.filter((n:unknown):n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < game.levels))];
    }
  } catch { /* Corrupt or unavailable storage starts a clean local profile. */ }
  return base;
}
function stored() { try { return localStorage.getItem(KEY); } catch { return null; } }
export const save = readSave(typeof localStorage === 'undefined' ? null : stored());
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch { /* Playing remains available without persistent storage. */ } }
export function complete(id:GameId,level:number) {
  const levels=save.completed[id] ?? [];
  if (!levels.includes(level)) levels.push(level);
  save.completed[id]=levels; persist();
}
function schulteCompleted(){try{return readSchulteCompleted(localStorage.getItem('shulte.v3'));}catch{return [];}}
export const finishedCount = (id:GameId) => id==='schulte'?schulteCompleted().length:save.completed[id]?.length ?? 0;
export const nextLevel = (id:GameId) => {
  const info=GAMES.find((g)=>g.id===id)!;
  const completed=id==='schulte'?schulteCompleted():save.completed[id]??[];
  return Array.from({length:info.levels},(_,i)=>i).find((n)=>!completed.includes(n)) ?? 0;
};
