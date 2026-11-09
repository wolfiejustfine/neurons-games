export function random(seed:number) {
  return () => { seed |= 0; seed = seed + 0x6d2b79f5 | 0; let t=Math.imul(seed ^ seed >>> 15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
}
export function shuffled<T>(items:readonly T[],rng:()=>number=Math.random):T[] {
  const copy=[...items]; for(let i=copy.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];} return copy;
}
export function deranged<T>(items:readonly T[],rng:()=>number):T[] {
  if(items.length<2)return [...items];
  const offset=1+Math.floor(rng()*(items.length-1));
  return items.map((_,i)=>items[(i+offset)%items.length]);
}
export interface Maze { width:number; height:number; cells:boolean[]; start:number; end:number; }
export function makeMaze(level:number,variant=0):Maze {
  const n=7, cells=Array<boolean>(n*n).fill(false), rng=random(786+level*123+variant*47), seen=new Set<number>();
  const carve=(x:number,y:number)=>{
    cells[y*n+x]=true;seen.add(y*n+x);
    for(const [dx,dy] of shuffled([[2,0],[-2,0],[0,2],[0,-2]],rng)){
      const nx=x+dx,ny=y+dy;
      if(nx>0&&ny>0&&nx<n-1&&ny<n-1&&!seen.has(ny*n+nx)){cells[(y+dy/2)*n+x+dx/2]=true;carve(nx,ny);}
    }
  };
  carve(1,1);
  return {width:n,height:n,cells,start:n+1,end:(n-2)*n+n-2};
}
export function neighbors(maze:Maze,index:number):number[] {
  const x=index%maze.width,y=Math.floor(index/maze.width);
  return [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([a,b])=>a>=0&&b>=0&&a<maze.width&&b<maze.height&&maze.cells[b*maze.width+a]).map(([a,b])=>b*maze.width+a);
}
export function route(maze:Maze,from=maze.start,to=maze.end):number[] {
  const queue=[from],previous=new Map<number,number>([[from,-1]]);
  for(let i=0;i<queue.length;i++){
    const here=queue[i]; if(here===to)break;
    for(const next of neighbors(maze,here))if(!previous.has(next)){previous.set(next,here);queue.push(next);}
  }
  if(!previous.has(to))return [];
  const out=[];for(let at=to;at!==-1;at=previous.get(at)!){out.push(at);}return out.reverse();
}
export type Tubes=number[][];
export const CAPACITY=4;
export function pour(tubes:Tubes,from:number,to:number):Tubes|null {
  if(from===to||!tubes[from]?.length||!tubes[to]||tubes[to].length>=CAPACITY)return null;
  const color=tubes[from].at(-1)!;
  if(tubes[to].length&&tubes[to].at(-1)!==color)return null;
  const next=tubes.map((t)=>[...t]);
  while(next[from].at(-1)===color&&next[to].length<CAPACITY)next[to].push(next[from].pop()!);
  return next;
}
export const sortedTubes=(t:Tubes)=>t.every((v)=>v.length===0||(v.length===CAPACITY&&v.every((c)=>c===v[0])));
export function tubeSolution(initial:Tubes):[number,number][]|null {
  const key=(t:Tubes)=>t.map((a)=>a.join('')).sort().join('|'), seen=new Set([key(initial)]);
  const queue:{state:Tubes;moves:[number,number][]}[]=[{state:initial,moves:[]}];
  for(let p=0;p<queue.length&&p<100000;p++){
    const {state,moves}=queue[p];
    if(sortedTubes(state))return moves;
    for(let i=0;i<state.length;i++)for(let j=0;j<state.length;j++){
      if(!state[i].length||(!state[j].length&&state[i].every(c=>c===state[i][0])))continue;
      const next=pour(state,i,j);if(!next)continue;
      const k=key(next);if(!seen.has(k)){seen.add(k);queue.push({state:next,moves:[...moves,[i,j]]});}
    }
  } return null;
}
export const TUBE_LEVELS:Tubes[]=[
  [[0,0,1,1],[1,1,0,0],[]],
  [[0,1,0,1],[1,0,1,0],[],[]],
  [[0,1,2,0],[1,2,0,1],[2,0,1,2],[],[]],
  [[0,1,1,2],[2,0,2,1],[1,2,0,0],[],[]],
  [[0,1,2,2],[2,1,0,1],[1,0,2,0],[],[]],
  [[0,1,2,3],[1,2,3,0],[2,3,0,1],[3,0,1,2],[],[]],
  [[0,3,1,2],[1,0,2,3],[2,1,3,0],[3,2,0,1],[],[]],
  [[0,1,3,2],[3,2,1,0],[2,0,3,1],[1,3,0,2],[],[]],
];
export function clockHands(minutes:number) {
  return {hour:((minutes%720)/720)*Math.PI*2-Math.PI/2,minute:((minutes%60)/60)*Math.PI*2-Math.PI/2};
}
export const formatClock=(minutes:number)=>String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');
