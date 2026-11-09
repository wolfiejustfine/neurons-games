import { makeMaze,neighbors,route,random,shuffled } from '../rules';
import { SORT_COUNTS } from '../learning';
import { label,picture,color,panel } from '../play/draw';
import { gridLayout,drawMaze } from '../play/maze-board';
import type { RoundFactory } from '../play/types';
import type Phaser from 'phaser';
const create:RoundFactory=(c)=>{
  const maze=makeMaze(c.level,23),count=SORT_COUNTS[c.level];
  const heroStart=neighbors(maze,maze.start)[0];
  const available=shuffled(maze.cells.map((v,i)=>v?i:-1).filter((i)=>i>=0&&i!==maze.start&&i!==maze.end&&i!==heroStart),random(389+c.level));
  const items=available.slice(0,count).map((at,i)=>({at,kind:i%2,done:false,picked:false}));
  const baskets=[maze.start,maze.end];let position=heroStart,carried:number|null=null,solved=false,hintPath:number[]=[];
  let last:{x:number;y:number}|null=null;
  const layout=()=>gridLayout(c,maze,.235,.61);
  function render(){
    c.clear();const h=c.height,l=layout();drawMaze(c,maze,l);
    const g=c.scene.add.graphics();c.root.add(g);
    hintPath.forEach((at)=>{const p=l.point(at);g.fillStyle(color(c.info.accent),.65).fillCircle(p.x,p.y,l.cell*.10);});
    baskets.forEach((at,kind)=>{
      const p=l.point(at),tint=kind?0xb4a3d8:0xd6b271;
      g.fillStyle(kind?0xe5ddf6:0xffe9b8).fillRoundedRect(p.x-l.cell*.45,p.y-l.cell*.4,l.cell*.9,l.cell*.82,6);
      g.lineStyle(4,tint).strokeRoundedRect(p.x-l.cell*.45,p.y-l.cell*.4,l.cell*.9,l.cell*.82,6);
      g.fillStyle(tint).fillRoundedRect(p.x-l.cell*.49,p.y-l.cell*.45,l.cell*.98,l.cell*.13,3);
      picture(c,kind?'nail':'screw',p.x,p.y+l.cell*.04,l.cell*.72);
    });
    items.forEach((item)=>{if(!item.picked&&!item.done){const p=l.point(item.at);picture(c,item.kind?'nail':'screw',p.x,p.y,l.cell*.98);}});
    const hero=l.point(position);
    g.fillStyle(0x66c3bf).fillCircle(hero.x,hero.y,l.cell*.35);
    const avatar=c.scene.add.image(hero.x,hero.y,'hero-Vinch');avatar.setScale(l.cell*.82/Math.max(avatar.width,avatar.height));c.root.add(avatar);
    label(c,220,h*.045,'УБРАНО: '+items.filter((v)=>v.done).length+' / '+count,26,{color:'#8c92a5'});
    if(carried!==null){picture(c,items[carried].kind?'nail':'screw',495,h*.045,45);label(c,590,h*.045,'Несём',24,{color:'#8c92a5'});}
    [0,1].forEach(kind=>{
      const x=190+kind*340;panel(c,x,h*.145,290,h*.115,kind?'#eee8fa':'#fff1d2',kind?'#b4a3d8':'#d6b271',12);
      picture(c,kind?'nail':'screw',x-82,h*.145,Math.min(65,h*.09));
      label(c,x+32,h*.145,kind?'ГВОЗДИ':'ВИНТЫ',24,{fontStyle:'bold'});
    });
    label(c,360,h*.93,solved?'ВСЕ ПРЕДМЕТЫ В СВОИХ ЯЩИКАХ':carried!==null?'Отнеси предмет в ящик с таким же значком':'Собери винт или гвоздь на светлой дорожке',26,{color:'#8c92a5',wordWrap:{width:660}});
  }
  function step(at:number){
    if(solved||at===position||!neighbors(maze,position).includes(at))return;
    position=at;hintPath=[];
    if(carried===null){
      const found=items.findIndex((i)=>i.at===at&&!i.done&&!i.picked);
      if(found>=0){items[found].picked=true;carried=found;c.hooks.feedback(items[found].kind?'Это гвоздь. Отнеси его в фиолетовый ящик «Гвозди».':'Это винт. Отнеси его в жёлтый ящик «Винты».','good');}
    }
    if(carried!==null&&baskets.includes(at)){
      const basket=baskets.indexOf(at);
      if(basket===items[carried].kind){items[carried].done=true;carried=null;c.hooks.feedback('Предмет в своём ящике!','good');}
      else c.hooks.feedback('Этот ящик для другого предмета. Сравни значки.','try');
    }
    render();if(items.every((i)=>i.done)){solved=true;render();c.hooks.win('Все винты и гвозди рассортированы!');}
  }
  function move(p:Phaser.Input.Pointer){
    if(!p.isDown)return;
    const from=last??{x:p.x,y:p.y},n=Math.ceil(Math.hypot(p.x-from.x,p.y-from.y)/(layout().cell/4))||1;
    for(let i=1;i<=n;i++)step(layout().index(from.x+(p.x-from.x)*i/n,from.y+(p.y-from.y)*i/n));
    last={x:p.x,y:p.y};
  }
  const down=(p:Phaser.Input.Pointer)=>{
    last={x:p.x,y:p.y};const at=layout().index(p.x,p.y);
    if(at>=0&&!solved&&at!==position&&!neighbors(maze,position).includes(at))c.hooks.feedback('Двигай Винча по соседним клеткам или веди пальцем по дорожке.');
    step(at);
  };
  const up=()=>{last=null;};
  const key=(e:KeyboardEvent)=>{const d:Record<string,number>={ArrowLeft:-1,ArrowRight:1,ArrowUp:-maze.width,ArrowDown:maze.width};if(e.key in d){e.preventDefault();step(position+d[e.key]);}};
  c.scene.input.on('pointerdown',down);c.scene.input.on('pointermove',move);c.scene.input.on('pointerup',up);c.scene.input.keyboard?.on('keydown',key);
  c.hooks.instruction('Винты — в жёлтый ящик, гвозди — в фиолетовый. Значки на ящиках помогут.');
  return {render,hasProgress:()=>position!==heroStart||items.some(i=>i.picked||i.done),hint(){
    const routes=items.filter(i=>!i.done&&!i.picked).map(i=>route(maze,position,i.at)).sort((a,b)=>a.length-b.length);
    const path=carried!==null?route(maze,position,baskets[items[carried].kind]):routes[0];
    if(path?.length){hintPath=path;render();c.hooks.feedback('Следуй по точкам к '+(carried!==null?'нужному ящику.':'ближайшему предмету.'));}
  },dispose(){c.scene.input.off('pointerdown',down);c.scene.input.off('pointermove',move);c.scene.input.off('pointerup',up);c.scene.input.keyboard?.off('keydown',key);},inspect:()=>({maze,items,baskets,position,carried,solved})};
};
export default create;
