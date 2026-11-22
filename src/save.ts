import { GAMES, gameById, type AgeMode, type GameId } from './catalog.ts';
import { readSchulteCompleted } from './standalone-progress.ts';
import { canOpenLevel, firstPendingLevel } from './progression.ts';
const KEY = 'neurons-play-v1';
export interface Saved { version:1; sound:boolean; completed:Partial<Record<GameId,number[]>>; }
export function readSave(raw:string|null,mode:AgeMode='solo'): Saved {
  const base:Saved = {version:1,sound:true,completed:{}};
  try {
    const value = JSON.parse(raw ?? 'null');
    if (value?.version !== 1) return base;
    base.sound = value.sound !== false;
    for (const game of GAMES) {
      if(game.standalone && mode==='solo')continue;
      const limit=gameById(game.id,mode)!.levels;
      const levels = value.completed?.[game.id];
      if (Array.isArray(levels)) base.completed[game.id] = [...new Set(levels.filter((n:unknown):n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < limit))];
    }
  } catch { /* Corrupt or unavailable storage starts a clean local profile. */ }
  return base;
}
const MODE_KEY='neurons-age-mode';
function stored(key:string) {
  try {return localStorage.getItem(key);} catch {return null;}
}
const saveKey=(mode:AgeMode)=>mode==='solo'?KEY:KEY+'-together';
export let ageMode:AgeMode=stored(MODE_KEY)==='together'?'together':'solo';
export let save=readSave(stored(saveKey(ageMode)),ageMode);
const sessionProfiles:Partial<Record<AgeMode,Saved>>={};
export function selectMode(mode:AgeMode) {
  if(mode!==ageMode){
    sessionProfiles[ageMode]=save;
    ageMode=mode;
    const raw=stored(saveKey(mode));
    save=raw!==null?readSave(raw,mode):sessionProfiles[mode]??readSave(null,mode);
  }
  try {localStorage.setItem(MODE_KEY,mode);} catch { /* Session can still be played. */ }
}
export function persist() {
  try {
    const key=saveKey(ageMode),previous=readSave(stored(key),ageMode);
    for(const [id,levels] of Object.entries(previous.completed)){
      const game=id as GameId;
      save.completed[game]=[...new Set([...(save.completed[game]??[]),...levels])];
    }
    localStorage.setItem(key,JSON.stringify(save));
  } catch { /* Storage is optional. */ }
}
export function complete(id:GameId,level:number) {
  if(!isLevelUnlocked(id,level))return;
  const levels=save.completed[id] ?? [];
  if (!levels.includes(level)) levels.push(level);
  save.completed[id]=levels; persist();
}
function schulteCompleted(){try{return readSchulteCompleted(localStorage.getItem('shulte.v3'));}catch{return [];}}
export const finishedCount = (id:GameId) => id==='schulte'&&ageMode==='solo'?schulteCompleted().length:save.completed[id]?.length ?? 0;
export const nextLevel = (id:GameId) => {
  const info=gameById(id,ageMode)!;
  const completed=id==='schulte'&&ageMode==='solo'?schulteCompleted():save.completed[id]??[];
  return firstPendingLevel(completed,info.levels);
};
export function isLevelUnlocked(id:GameId,level:number){
  const info=gameById(id,ageMode);
  return !!info&&canOpenLevel(id==='schulte'&&ageMode==='solo'?schulteCompleted():save.completed[id]??[],level,info.levels);
}
