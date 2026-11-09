import { clockHands,formatClock,random,shuffled } from '../rules';
import { clockLesson } from '../learning';
import { panel,label,target,color,button } from '../play/draw';
import type { RoundFactory } from '../play/types';
const HEROES=[['Aris','Арис'],['Jays','Джейс'],['Ren','Рэн'],['Newt','Ньют']];
const create:RoundFactory=(c)=>{
  const {count,times,halfHours,afternoon}=clockLesson(c.level);
  const sources=shuffled(times,random(805+c.level)),matched=Array<boolean>(count).fill(false);
  let selected:number|null=null,highlight=-1,solved=false;
  const cardPositions=()=>Array.from({length:count},(_,i)=>count===4?{x:195+(i%2)*330,y:c.height*(.22+Math.floor(i/2)*.25),w:300,h:c.height*.215}:{x:360-(count-1)*220/2+i*220,y:c.height*.32,w:count===2?250:200,h:c.height*.37});
  function place(value:number,index:number){
    if(solved||index<0){render();return;}
    if(matched[index]){selected=null;render();return;}
    if(times[index]!==value){
      selected=null;render();
      c.hooks.feedback(times[index]%60!==value%60?'Проверь длинную стрелку: на 12 — 00 минут, на 6 — 30 минут.':afternoon?'Проверь короткую стрелку. После полудня 1 — это 13 часов, 2 — 14 и так далее.':'Проверь короткую стрелку: она показывает час встречи.','try');return;
    }
    matched[index]=true;selected=null;highlight=-1;render();
    if(matched.every(Boolean)){solved=true;render();c.hooks.win('Все встречи запланированы!');}else c.hooks.feedback('Встреча запланирована!','good');
  }
  function render(){
    c.clear();const h=c.height;
    cardPositions().forEach((p,i)=>{
      panel(c,p.x,p.y,p.w,p.h,matched[i]?'#eef9f2':'#ffffff',highlight===i?c.info.accent:'#dce8f0',25);
      const hero=c.scene.add.image(p.x,p.y-p.h*.08,'hero-'+HEROES[i][0]);hero.setScale(Math.min(p.w*.52/hero.width,p.h*.60/hero.height));c.root.add(hero);
      label(c,p.x,p.y+p.h*.28,HEROES[i][1]+' · '+formatClock(times[i]),count===4?27:28,{fontStyle:'bold'});
      if(matched[i])label(c,p.x+p.w/2-25,p.y-p.h/2+24,'✓',27,{color:'#68a98a'});
      if(!solved)target(c,'meeting-'+i,p.x,p.y,p.w,p.h,()=>{if(selected!==null)place(selected,i);else c.hooks.feedback('Сначала выбери часы внизу.');});
    });
    label(c,360,h*.64,solved?'ВСЕ ВСТРЕЧИ ЗАПЛАНИРОВАНЫ':halfHours?'ДЛИННАЯ НА 12 → :00, НА 6 → :30':afternoon?'ПОСЛЕ ПОЛУДНЯ: 1 → 13, 2 → 14, 3 → 15':'РОВНЫЙ ЧАС: ДЛИННАЯ СТРЕЛКА НА 12',23,{color:'#8b9aae',letterSpacing:1});
    sources.forEach((value,i)=>{
      if(times.some((t,j)=>t===value&&matched[j]))return;
      const x=360-(count-1)*168/2+i*168,y=h*.79,r=Math.min(count===4?68:76,h*.11);
      const group=c.scene.add.container(x,y);c.root.add(group);
      const g=c.scene.add.graphics();group.add(g);
      g.fillStyle(color(selected===value?'#d9f2ef':'#e2f3f7')).fillCircle(0,0,r+8);
      g.lineStyle(4,color(selected===value?c.info.accent:'#a7cad6')).strokeCircle(0,0,r+8);
      g.fillStyle(0xffffff).fillCircle(0,0,r);
      for(let hour=1;hour<=12;hour++){
        const a=hour*Math.PI/6-Math.PI/2;
        const t=c.scene.add.text(Math.cos(a)*(r-15),Math.sin(a)*(r-15),String(hour),{fontFamily:'Rubik,Arial',fontSize:20,color:'#65768e'}).setOrigin(.5);group.add(t);
      }
      const hands=clockHands(value);
      g.lineStyle(8,0x7660ac).lineBetween(0,0,Math.cos(hands.hour)*r*.45,Math.sin(hands.hour)*r*.45);
      g.lineStyle(4,0x3895b7).lineBetween(0,0,Math.cos(hands.minute)*r*.70,Math.sin(hands.minute)*r*.70);
      g.fillStyle(0x52648e).fillCircle(0,0,6);
      group.setSize(r*2+16,r*2+16).setInteractive({useHandCursor:true});c.scene.input.setDraggable(group);
      let dragged=false;
      group.on('pointerdown',()=>{dragged=false;});group.on('dragstart',()=>{dragged=true;c.root.bringToTop(group);});
      group.on('drag',(_p:unknown,dx:number,dy:number)=>group.setPosition(dx,dy));
      group.on('dragend',()=>place(value,cardPositions().findIndex((p)=>Math.abs(group.x-p.x)<p.w/2&&Math.abs(group.y-p.y)<p.h/2)));
      group.on('pointerup',()=>{if(!dragged){selected=value;render();c.hooks.feedback('Часы выбраны. Теперь коснись карточки нужного героя.');}});
      c.controls.push({id:'clock-'+value,x,y,width:r*2+16,height:r*2+16});
    });
    if(!solved)button(c,'zoom-clock',360,h*.955,370,Math.min(68,h*.075),'Увеличить часы',()=>{
      if(selected===null){c.hooks.feedback('Сначала коснись часов, которые хочешь рассмотреть.');return;}
      c.hooks.clockPreview(selected);
    });
  }
  c.hooks.instruction(halfHours?'Длинная стрелка на 6 — 30 минут. Короткая — между часами. Подбери будильники.':afternoon?'Теперь встречи после полудня: например, 13:00 — час дня. Раздай будильники.':'Короткая стрелка показывает часы. Подбери будильник для каждой встречи.');
  return {render,hasProgress:()=>matched.some(Boolean),hint(){highlight=matched.findIndex((v)=>!v);if(highlight>=0){selected=times[highlight];render();c.hooks.feedback('Подходящие часы и встреча выделены. Время: '+formatClock(selected)+'.');}},inspect:()=>({times,sources,matched,selected,solved})};
};
export default create;
