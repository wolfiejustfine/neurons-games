import { makeMaze,neighbors,route } from '../rules';
import { panel,label,color,button } from '../play/draw';
import { gridLayout,drawMaze } from '../play/maze-board';
import type { RoundFactory } from '../play/types';
import type Phaser from 'phaser';
const WORDS=['КОТ','ДОМ','СЫР','МЯЧ','РЫБА','ЛУНА','ЖУК','ТОРТ'];
const create:RoundFactory=(c)=>{
  const word=WORDS[c.level];let part=0,maze=makeMaze(c.level,part),path=[maze.start],busy=false,solved=false,hinted:number[]=[];
  let last:{x:number;y:number}|null=null;
  const layout=()=>gridLayout(c,maze);
  function render(){
    c.clear();const h=c.height,l=layout();
    [...word].forEach((char,i)=>{
      const x=360-(word.length-1)*98/2+i*98;
      const found=i<part||(busy&&i===part);
      panel(c,x,h*.075,82,74,found?'#edf9f2':'#fff','#d7e6ef',17);
      label(c,x,h*.075,found?char:'·',38,{color:found?'#5c947e':'#acb6c6'});
    });
    drawMaze(c,maze,l,path);
    const g=c.scene.add.graphics();c.root.add(g);
    hinted.forEach((at)=>{const p=l.point(at);g.fillStyle(color(c.info.accent),.5).fillCircle(p.x,p.y,l.cell*.10);});
    const start=l.point(maze.start),end=l.point(maze.end),now=l.point(path.at(-1)!);
    g.fillStyle(0xd8edf5).fillCircle(start.x,start.y,l.cell*.34);
    label(c,start.x,start.y,String(part+1),l.cell*.42,{fontStyle:'bold',color:'#6e91a8'});
    g.fillStyle(0xf4dc9b).fillRoundedRect(end.x-l.cell*.4,end.y-l.cell*.4,l.cell*.8,l.cell*.8,12);
    label(c,end.x,end.y,word[part]??'✓',l.cell*.48,{fontStyle:'bold'});
    g.fillStyle(color(c.info.accent)).fillCircle(now.x,now.y,l.cell*.21);
    g.fillStyle(0xffffff).fillCircle(now.x,now.y,l.cell*.08);
    if(busy&&!solved)button(c,'next-letter',360,h*.95,450,Math.min(80,h*.095),'Буква '+word[part]+' найдена · Дальше',()=>{
      part++;maze=makeMaze(c.level,part);path=[maze.start];busy=false;hinted=[];render();
      c.hooks.feedback('Найди следующую букву пароля.');
    });
    else label(c,360,h*.95,solved?'ПРОЧИТАЙ ПАРОЛЬ':'Дорожка '+Math.min(part+1,word.length)+' из '+word.length,26,{color:'#8c9bb0'});
  }
  function step(index:number){
    if(busy||solved||index<0||!maze.cells[index]||index===path.at(-1))return;
    const back=path.indexOf(index);
    if(back>=0){path=path.slice(0,back+1);render();return;}
    if(!neighbors(maze,path.at(-1)!).includes(index))return;
    path.push(index);render();
    if(index===maze.end){
      busy=true;
      if(part+1===word.length){part++;solved=true;render();c.hooks.win('Пароль «'+word+'» собран. Прочитай его!');return;}
      render();c.hooks.feedback('Буква «'+word[part]+'» открыта! Рассмотри её и нажми «Дальше».','good');
    }
  }
  function move(p:Phaser.Input.Pointer){
    if(!p.isDown)return;
    const from=last??{x:p.x,y:p.y},steps=Math.ceil(Math.hypot(p.x-from.x,p.y-from.y)/(layout().cell/4))||1;
    for(let i=1;i<=steps;i++)step(layout().index(from.x+(p.x-from.x)*i/steps,from.y+(p.y-from.y)*i/steps));
    last={x:p.x,y:p.y};
  }
  const down=(p:Phaser.Input.Pointer)=>{
    last={x:p.x,y:p.y};const at=layout().index(p.x,p.y),current=path.at(-1)!;
    if(at>=0&&!busy&&!solved&&at!==current&&!path.includes(at)&&!neighbors(maze,current).includes(at))c.hooks.feedback('Начни у белой точки и двигайся по соседним клеткам дорожки.');
    step(at);
  };
  const up=()=>{last=null;};
  const key=(e:KeyboardEvent)=>{const at=path.at(-1)!,diff:Record<string,number>={ArrowLeft:-1,ArrowRight:1,ArrowUp:-maze.width,ArrowDown:maze.width};if(e.key in diff){e.preventDefault();step(at+diff[e.key]);}};
  c.scene.input.on('pointerdown',down);c.scene.input.on('pointermove',move);c.scene.input.on('pointerup',up);c.scene.input.keyboard?.on('keydown',key);
  c.hooks.instruction('Проведи дорожку от числа к букве и собери пароль.');
  return {render,hasProgress:()=>part>0||path.length>1,hint(){hinted=route(maze,path.at(-1)!,maze.end);render();c.hooks.feedback('Маленькие точки показывают путь к букве.');},dispose(){c.scene.input.off('pointerdown',down);c.scene.input.off('pointermove',move);c.scene.input.off('pointerup',up);c.scene.input.keyboard?.off('keydown',key);},inspect:()=>({word,part,maze,path,busy,solved,solution:route(maze,path.at(-1)!,maze.end)})};
};
export default create;
