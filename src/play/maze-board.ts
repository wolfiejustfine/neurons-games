import type { Maze } from '../rules';
import type { PlayContext } from './types';
import { panel,color } from './draw';
export function gridLayout(c:PlayContext,maze:Maze,topFraction=.18,maxHeightFraction=.70) {
  const size=Math.min(c.width-70,c.height*maxHeightFraction);
  const cell=size/maze.width,x=(c.width-size)/2,y=c.height*topFraction;
  return {
    x,y,size,cell,
    point(index:number){return {x:x+(index%maze.width+.5)*cell,y:y+(Math.floor(index/maze.width)+.5)*cell};},
    index(px:number,py:number){const col=Math.floor((px-x)/cell),row=Math.floor((py-y)/cell);return col<0||row<0||col>=maze.width||row>=maze.height?-1:row*maze.width+col;},
  };
}
export function drawMaze(c:PlayContext,maze:Maze,layout:ReturnType<typeof gridLayout>,path:number[]=[]) {
  panel(c,360,layout.y+layout.size/2,layout.size+16,layout.size+16,'#d5e7ef','#c7dce8',25);
  const g=c.scene.add.graphics();c.root.add(g);
  maze.cells.forEach((open,i)=>{
    const p=layout.point(i);
    if(open){g.fillStyle(0xfafcfe).fillRect(p.x-layout.cell/2,p.y-layout.cell/2,layout.cell+1,layout.cell+1);
      c.controls.push({id:'cell-'+i,x:p.x,y:p.y,width:layout.cell,height:layout.cell});}
  });
  if(path.length>1){
    g.lineStyle(layout.cell*.32,color(c.info.accent),.45).beginPath();
    path.forEach((at,i)=>{const p=layout.point(at);if(!i)g.moveTo(p.x,p.y);else g.lineTo(p.x,p.y);});g.strokePath();
  }
}
