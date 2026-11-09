export const SCHULTE_LEVELS=30;

// The original game owns shulte.v3; the collection only reads its completed levels.
export function readSchulteCompleted(raw:string|null):number[]{
  try{
    const data=JSON.parse(raw??'null');
    if(!data?.levels||typeof data.levels!=='object'||Array.isArray(data.levels))return [];
    return Array.from({length:SCHULTE_LEVELS},(_,i)=>i).filter(i=>{
      const stars=data.levels[String(i+1)]?.stars;
      return Number.isInteger(stars)&&stars>=1&&stars<=3;
    });
  }catch{return [];}
}
