import { PROPS,PROP_NAMES } from '../catalog';
import { random,shuffled } from '../rules';
import { MEMORY_COUNTS } from '../learning';
import { panel,label,picture,movable,target,button } from '../play/draw';
import type { RoundFactory } from '../play/types';
const create:RoundFactory=(c)=>{
  const count=MEMORY_COUNTS[c.level],rng=random(450+c.level);
  const order=shuffled(PROPS,rng).slice(0,count),tray=shuffled(order,rng),placed=Array<boolean>(count).fill(false);
  let preview=true,started=false,selected:string|null=null,hintIndex=-1,solved=false;
  const positions=()=>order.map((_,i)=>({x:145+(i%3)*215,y:c.height*(.17+Math.floor(i/3)*.25)}));
  function place(prop:string,index:number){
    if(preview||solved||index<0){render();return;}
    if(placed[index]){render();return;}
    if(order[index]!==prop){selected=null;render();c.hooks.feedback('Кажется, этот предмет стоял на другом месте. Попробуй ещё.','try');return;}
    placed[index]=true;selected=null;hintIndex=-1;render();
    if(placed.every(Boolean)){solved=true;render();c.hooks.win('Все вещи на своих местах!');}else c.hooks.feedback('Да, здесь его место!','good');
  }
  function render(){
    c.clear();const h=c.height;
    panel(c,360,h*.30,680,h*.54,'#f6efe6','#e7dcd0',30);
    const shelves=c.scene.add.graphics();c.root.add(shelves);
    [h*.17,h*.42].forEach((y)=>{
      shelves.fillStyle(0xdac5ac).fillRoundedRect(53,y+75,614,13,5);
      shelves.fillStyle(0xe9d7bf).fillRoundedRect(53,y+72,614,8,4);
    });
    positions().forEach((p,i)=>{
      if(preview||placed[i])picture(c,order[i],p.x,p.y,125);
      else{
        panel(c,p.x,p.y,154,132,hintIndex===i?'#fffcf5':'#f4eee7',hintIndex===i?c.info.accent:'#e4d9cc',20);
        if(hintIndex===i)picture(c,order[i],p.x,p.y,113).setAlpha(.35);
        else label(c,p.x,p.y,'?',40,{color:'#c4b8a5'});
        target(c,'shelf-'+i,p.x,p.y,154,132,()=>{if(selected)place(selected,i);else c.hooks.feedback('Сначала выбери вещь внизу, затем коснись её прежнего места.');});
      }
      label(c,p.x-65,p.y+56,String(i+1),20,{color:'#a3927e'});
    });
    if(preview){
      label(c,360,h*.69,'Рассмотри предметы. Не торопись.',29,{color:'#8a8fa3'});
      button(c,'memorized',360,h*.84,360,100,started?'Продолжить':'Запомнил!',()=>{preview=false;started=true;render();c.hooks.instruction('Верни каждый предмет туда, где он стоял.');});
    }else{
      if(!solved)button(c,'peek',360,h*.625,390,62,'Посмотреть ещё',()=>{preview=true;selected=null;render();c.hooks.instruction('Рассмотри образец ещё раз. Расставленные вещи сохранятся.');});
      else label(c,360,h*.65,'ПОРЯДОК ВОССТАНОВЛЕН!',28,{color:'#73a38c'});
      tray.forEach((prop,i)=>{
        if(placed[order.indexOf(prop)])return;
        const x=145+(i%3)*215,y=h*(count>3?.74+Math.floor(i/3)*.16:.82);
        if(selected===prop)panel(c,x,y,160,125,'#eaf5ff',c.info.accent,20);
        movable(c,'item-'+prop,prop,x,y,115,(dx,dy)=>place(prop,positions().findIndex((p)=>Math.abs(dx-p.x)<90&&Math.abs(dy-p.y)<80)),()=>{selected=prop;render();c.hooks.feedback('Выбрано: '+PROP_NAMES[prop]+'. Теперь коснись прежнего места.');});
      });
    }
  }
  c.hooks.instruction('Запомни, где стоят предметы. Когда будешь готов, нажми «Запомнил».');
  return {render,hasProgress:()=>started,hint(){if(preview){c.hooks.feedback('Можно запоминать по одному: что лежит слева, в центре и справа?');return;}hintIndex=placed.findIndex((v)=>!v);if(hintIndex>=0){render();c.hooks.feedback('На выделенном месте стоял предмет: '+PROP_NAMES[order[hintIndex]]+'.');}},inspect:()=>({order,tray,preview,placed,selected,solved})};
};
export default create;
