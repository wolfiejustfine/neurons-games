import { paintLesson,PAINT_COLORS } from '../expansion';
import { label,panel,target,color } from '../play/draw';
import type { RoundFactory } from '../play/types';
const ROBOT=[
  {x:300,y:75,w:240,h:120,r:36},{x:300,y:240,w:220,h:180,r:35},
  {x:135,y:230,w:95,h:155,r:30},{x:465,y:230,w:95,h:155,r:30},
  {x:240,y:380,w:105,h:80,r:25},{x:360,y:380,w:105,h:80,r:25},
];
const ROCKET=[
  {x:300,y:75,w:170,h:110,r:50},{x:300,y:235,w:170,h:190,r:30},
  {x:165,y:290,w:90,h:150,r:25},{x:435,y:290,w:90,h:150,r:25},
  {x:255,y:390,w:75,h:90,r:30},{x:345,y:390,w:75,h:90,r:30},
];
const create:RoundFactory=c=>{
  const lesson=paintLesson(c.level),done=Array<boolean>(lesson.count).fill(false);
  let selected=-1,highlight=-1,solved=false;
  const parts=lesson.count===4?[ROBOT[0],ROBOT[1],ROBOT[4],ROBOT[5]]:lesson.theme==='rocket'?ROCKET:ROBOT;
  function choose(i:number){
    if(solved||done[i])return;selected=i;render();
    const problem=lesson.problems[i];
    c.hooks.numberQuestion(problem.expression,answer=>{
      if(answer!==problem.answer){c.hooks.feedback(problem.operation==='+'?'Начни с '+problem.a+' и прибавь '+problem.b+'. Попробуй ещё.':'Начни с '+problem.a+' и отними '+problem.b+'. Попробуй ещё.','try');return false;}
      done[i]=true;highlight=-1;selected=-1;
      if(done.every(Boolean)){solved=true;render();c.hooks.win('Рисунок раскрашен! Все примеры решены.');}
      else{render();c.hooks.feedback('Верно: '+problem.expression+' = '+answer+'. Область раскрасилась!','good');}
      return true;
    });
  }
  function render(){
    c.clear();const h=c.height,s=Math.min(1.35,h*.69/450),top=h*.19;
    label(c,360,h*.035,'ЧИСЛО ПОДСКАЖЕТ ЦВЕТ',24,{color:'#8d91a9'});
    lesson.problems.forEach((problem,i)=>{
      const step=96,x=360-(lesson.count-1)*step/2+i*step;
      panel(c,x,h*.11,80,62,PAINT_COLORS[i],'#ffffff',15);
      label(c,x,h*.11,String(problem.answer),29,{color:'#304363',fontStyle:'bold'});
    });
    const g=c.scene.add.graphics();c.root.add(g);
    const px=(x:number)=>360+(x-300)*s,py=(y:number)=>top+y*s;
    if(lesson.count===4)for(const arm of [ROBOT[2],ROBOT[3]]){
      g.fillStyle(0xdcecf3).fillRoundedRect(px(arm.x-arm.w/2),py(arm.y-arm.h/2),arm.w*s,arm.h*s,arm.r*s);
      g.lineStyle(4*s,0xa4b9ca).strokeRoundedRect(px(arm.x-arm.w/2),py(arm.y-arm.h/2),arm.w*s,arm.h*s,arm.r*s);
    }
    if(lesson.theme!=='rocket'){
      g.lineStyle(9*s,0xa4b6ca).lineBetween(px(300),py(0),px(300),py(12));
      g.fillStyle(0xf2ca70).fillCircle(px(300),py(-7),12*s);
    }else{
      g.fillStyle(0xe9f2fa).fillEllipse(360,py(445),250*s,18*s);
    }
    parts.forEach((p,i)=>{
      g.fillStyle(color(done[i]?PAINT_COLORS[i]:'#ffffff')).fillRoundedRect(px(p.x-p.w/2),py(p.y-p.h/2),p.w*s,p.h*s,p.r*s);
      g.lineStyle((highlight===i||selected===i?6:4)*s,color(highlight===i||selected===i?'#d4af59':'#94acc4')).strokeRoundedRect(px(p.x-p.w/2),py(p.y-p.h/2),p.w*s,p.h*s,p.r*s);
      const y=p.y-(i===0?22:lesson.theme==='rocket'&&i===1?50:0),expression=done[i]?String(lesson.problems[i].answer):lesson.problems[i].expression;
      label(c,px(p.x),py(y),expression,Math.min(31,28*s),{fontStyle:'bold',color:done[i]?'#355d70':'#637991'});
      if(!done[i]&&!solved)target(c,'region-'+i,px(p.x),py(p.y),p.w*s,p.h*s,()=>choose(i));
    });
    if(lesson.theme!=='rocket'){
      g.fillStyle(0x526a84).fillCircle(px(260),py(90),7*s).fillCircle(px(340),py(90),7*s);
      g.lineStyle(4*s,0x687e96).beginPath().arc(px(300),py(91),19*s,.15,Math.PI-.15).strokePath();
    }else{
      g.fillStyle(0xdceff9).fillCircle(px(300),py(250),35*s);g.lineStyle(5*s,0x8ab8cf).strokeCircle(px(300),py(250),35*s);
      g.fillStyle(0xffffff).fillCircle(px(290),py(239),9*s);
    }
    label(c,360,h*.94,solved?'ЦВЕТНОЕ ОТКРЫТИЕ ГОТОВО!':'Выбери белую область · '+done.filter(Boolean).length+' / '+lesson.count,27,{color:'#7f8da4'});
  }
  c.hooks.instruction('Коснись белой области, реши пример и введи ответ — появится цвет.');
  return {render,hasProgress:()=>done.some(Boolean),hint(){highlight=done.findIndex(v=>!v);if(highlight>=0){render();const p=lesson.problems[highlight];c.hooks.feedback('В выделенной области '+p.expression+' = '+p.answer+'. Коснись её и набери ответ.');}},inspect:()=>({...lesson,done,selected,highlight,solved})};
};
export default create;
