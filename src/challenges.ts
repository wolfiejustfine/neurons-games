import { random,shuffled } from './rules.ts';
import { PROPS,type AgeMode } from './catalog.ts';
import proofreadingContent from '../assets/proofreading-content.json' with {type:'json'};

export const SHADOW_OPTIONS=[3,3,3,4,4,4,4,4] as const;
export const SHADOW_ROUNDS=[2,2,3,3,3,3,4,4] as const;
export const SHADOW_FAMILIES=['key','cup','flask','rocket'] as const;
export const SHADOW_TEXTURES=SHADOW_FAMILIES.flatMap(family=>[0,1,2,3].map(i=>'shadow-'+family+'-'+i));
export const TOGETHER_SHADOW_ROUNDS=[1,1,2,2,2,2,3,3] as const;
export function shadowLesson(level:number,part:number,mode:AgeMode='solo'){
  if(mode==='together'){
    const rng=random(250+level*87+part*41);
    const options=shuffled(PROPS,rng).slice(0,level<4?2:3);
    return {answer:options[Math.floor(rng()*options.length)],options,family:null,rotation:0};
  }
  const rng=random(981+level*187+part*53),family=level===0?null:SHADOW_FAMILIES[(level+part-1)%SHADOW_FAMILIES.length];
  const pool=family?[0,1,2,3].map(i=>'shadow-'+family+'-'+i):PROPS;
  const options=shuffled(pool,rng).slice(0,SHADOW_OPTIONS[level]);
  return {answer:options[Math.floor(rng()*options.length)],options,family,rotation:level<3?0:(part%2?1:-1)*(level<5?12:22)};
}

export const PROOFREAD_COUNTS=[4,4,6,6,6,9,9,9] as const;
export const PROOFREAD_WORDS:readonly string[]=proofreadingContent.solo;
export function buildProofreadingLesson(target:string,count:number,seed:number){
  if(!/^[А-ЯЁ]{3,8}$/.test(target))throw new Error('Proofreading words must contain 3–8 uppercase Russian letters.');
  const variants=new Set<string>();
  for(let i=0;i<target.length;i++){
    variants.add(target.slice(0,i)+target.slice(i+1));
    if(i+1<target.length)variants.add(target.slice(0,i)+target[i+1]+target[i]+target.slice(i+2));
    const similar:Record<string,string>={О:'С',С:'О',П:'Л',Т:'Г',А:'Д',Р:'Ь',М:'Л',К:'Ж',Л:'П',И:'Н'};
    variants.add(target.slice(0,i)+(similar[target[i]]??(target[i]==='А'?'О':'А'))+target.slice(i+1));
  }
  variants.delete(target);
  const wrong=shuffled([...variants],random(seed));
  const words=shuffled(Array.from({length:count},(_,i)=>i%2===0?target:wrong[Math.floor(i/2)%wrong.length]),random(seed+17));
  return {target,words};
}
export function proofreadingLesson(level:number,mode:AgeMode='solo'){
  if(mode==='together'){
    const target=proofreadingContent.together[level],count=[2,2,3,3,4,4,4,4][level];
    if(level<2)return {target,words:shuffled([target,target.slice(0,-1)],random(340+level))};
    return buildProofreadingLesson(target,count,340+level);
  }
  return buildProofreadingLesson(PROOFREAD_WORDS[level%PROOFREAD_WORDS.length],PROOFREAD_COUNTS[level],517+level);
}
