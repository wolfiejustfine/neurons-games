import { label,color,distance } from '../play/draw';
import { WIRE_COUNTS } from '../learning';
import type { RoundFactory } from '../play/types';
import type Phaser from 'phaser';
const COLORS=['#d4a94e','#74abc6','#b090cf','#84b89b'];
const create:RoundFactory=(c)=>{
  const count=WIRE_COUNTS[c.level];
  let active=0,progress=0,tracing=false,solved=false,busy=false,showHint=false,last:{x:number;y:number}|null=null;
  function paths(){
    return Array.from({length:count},(_,wire)=>Array.from({length:101},(_,i)=>{
      const t=i/100,start=(wire+.7)/(count+.4),end=(count-wire-.3)/(count+.4);
      const middle=Math.sin(t*Math.PI*2+(wire%2?Math.PI:0))*(.10+c.level*.005);
      return {x:85+550*t,y:c.height*(.16+.63*(start*(1-t)+end*t+middle*Math.sin(t*Math.PI)))};
    }));
  }
  function render(){
    c.clear();const h=c.height,all=paths();
    label(c,360,h*.07,solved?'ВСЕ ПРОВОДА ПРОВЕРЕНЫ':'ПРОВОД '+Math.min(active+1,count)+' ИЗ '+count,26,{color:'#9195ad',letterSpacing:1});
    const drawOrder=[...all.keys()].filter(wire=>wire!==active).concat(active<count?[active]:[]);
    drawOrder.forEach((wire)=>{
      const points=all[wire];
      const done=wire<active;
      const g=c.scene.add.graphics();c.root.add(g);
      const stroke=(width:number,tint:number,alpha:number,upto=100)=>{
        g.lineStyle(width,tint,alpha).beginPath();points.slice(0,upto+1).forEach((p,i)=>{if(!i)g.moveTo(p.x,p.y);else g.lineTo(p.x,p.y);});g.strokePath();
      };
      stroke(30,0xffffff,1);stroke(20,color(COLORS[wire]),done?.3:wire===active?1:.55);
      if(done)stroke(6,0x71ad92,1);
      if(wire===active){stroke(8,0xfff5cf,1,progress);if(showHint){points.filter((_,i)=>i%7===0&&i>progress).forEach((p)=>g.fillStyle(0xffffff).fillCircle(p.x,p.y,5));}}
      const start=points[0],end=points[100];
      g.fillStyle(color(COLORS[wire]),1).fillCircle(start.x,start.y,27).fillRoundedRect(end.x-22,end.y-28,44,56,11);
      if(done){label(c,start.x,start.y,'✓',25,{color:'#fff'});label(c,end.x,end.y,'✓',25,{color:'#fff'});}
      if(wire===active){
        g.lineStyle(5,0xffffff).strokeCircle(start.x,start.y,29);label(c,start.x,start.y,String(wire+1),25,{color:'#fff',fontStyle:'bold'});
        const p=points[progress];g.fillStyle(0xffffff).fillCircle(p.x,p.y,12);
        c.controls.push({id:'wire-start',x:p.x,y:p.y,width:66,height:66});
      }
    });
    label(c,360,h*.91,solved?'Каждый провод доведён до своего разъёма!':progress>0?'Продолжай по яркому проводу от белой точки':'Начни у белой точки слева',26,{color:'#8c95ac'});
  }
  function advance(p:{x:number;y:number}){
    if(!tracing||busy||solved)return;
    const points=paths()[active];let best=progress,bestD=Infinity;
    for(let i=Math.max(0,progress-2);i<=Math.min(100,progress+12);i++){
      const d=distance(p,points[i]);if(d<bestD){bestD=d;best=i;}
    }
    if(bestD>34){
      tracing=false;
      const otherWire=paths().some((line,wire)=>wire>active&&line.some(point=>distance(p,point)<28));
      c.hooks.feedback(otherWire?'Ты перешёл на другой провод. Вернись к белой точке и продолжай по яркому.':'Палец вышел за край провода. Продолжи от белой точки — пройденный путь сохранён.');return;
    }
    progress=Math.max(progress,best);render();
    if(progress>=98&&distance(p,points[100])<35){
      busy=true;tracing=false;c.hooks.feedback('Провод распутан!','good');
      c.scene.time.delayedCall(350,()=>{active++;progress=0;showHint=false;busy=false;if(active===count){solved=true;render();c.hooks.win();}else render();});
    }
  }
  const down=(p:Phaser.Input.Pointer)=>{
    if(busy||solved)return;
    tracing=distance(p,paths()[active][progress])<45;last={x:p.x,y:p.y};if(tracing)advance(p);else c.hooks.feedback('Коснись белой точки на выделенном проводе.');
  };
  const move=(p:Phaser.Input.Pointer)=>{
    if(!p.isDown||!tracing)return;
    const from=last??p,n=Math.ceil(Math.hypot(p.x-from.x,p.y-from.y)/7)||1;
    for(let i=1;i<=n;i++)advance({x:from.x+(p.x-from.x)*i/n,y:from.y+(p.y-from.y)*i/n});
    last={x:p.x,y:p.y};
  };
  const up=()=>{tracing=false;last=null;};
  c.scene.input.on('pointerdown',down);c.scene.input.on('pointermove',move);c.scene.input.on('pointerup',up);c.scene.input.on('gameout',up);
  c.hooks.instruction('Проследи выделенный провод от белой точки до разъёма справа.');
  return {render,hasProgress:()=>active>0||progress>0,hint(){showHint=true;render();c.hooks.feedback('Белые точки показывают нужный провод. Веди палец медленно.');},dispose(){c.scene.input.off('pointerdown',down);c.scene.input.off('pointermove',move);c.scene.input.off('pointerup',up);c.scene.input.off('gameout',up);},inspect:()=>({count,active,progress,solved,busy,paths:paths()})};
};
export default create;
