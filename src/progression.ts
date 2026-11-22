export function firstPendingLevel(completed:readonly number[],total:number):number {
  return Array.from({length:total},(_,i)=>i).find(i=>!completed.includes(i))??0;
}

// Previously completed levels remain available, including older saves with gaps.
export function canOpenLevel(completed:readonly number[],level:number,total:number):boolean {
  return Number.isInteger(level)&&level>=0&&level<total&&
    (completed.includes(level)||level===firstPendingLevel(completed,total));
}
