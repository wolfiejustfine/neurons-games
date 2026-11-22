import { PROP_NAMES } from '../catalog';
import { SHADOW_ROUNDS,TOGETHER_SHADOW_ROUNDS,shadowLesson } from '../challenges';
import { panel,picture,target,label,confetti,button } from '../play/draw';
import type { RoundFactory } from '../play/types';
const create:RoundFactory=(c)=>{
  let part=0,question=shadowLesson(c.level,part,c.mode),solved=false,itemSolved=false,hinted=false,wrong:string[]=[];
  const count=(c.mode==='together'?TOGETHER_SHADOW_ROUNDS:SHADOW_ROUNDS)[c.level];
  const name=(key:string)=>PROP_NAMES[key.startsWith('shadow-')?key.split('-')[1]:key];
  function compareEdges(){
    switch(question.family){
      case 'key': return 'Сравни зубчики ключей и форму верхней части.';
      case 'cup': return 'Посмотри, с какой стороны ручка и есть ли носик.';
      case 'rocket': return 'Сравни нос ракеты и форму крыльев.';
      case 'flask': return 'Сравни дно колб и выступы по бокам.';
      default: return 'Обведи глазами край тени. Найди картинку с таким же краем.';
    }
  }
  function next(){
    part++;question=shadowLesson(c.level,part,c.mode);itemSolved=false;hinted=false;wrong=[];
    render();c.hooks.feedback('Новая тень. Сравни детали.');
  }
  function render(){
    c.clear();const w=c.width,h=c.height;
    label(c,w/2,h*.025,'ПРЕДМЕТ '+(part+1)+' ИЗ '+count,27,{color:'#747d9e'});
    panel(c,w/2,h*.24,Math.min(580,w-60),h*.34,itemSolved?'#e6f5ee':'#e9eaf8',itemSolved?'#aed6bf':'#dde0f1',35);
    picture(c,question.answer,w/2,h*.24,Math.min(210,h*.29),!itemSolved).setAngle(question.rotation);
    if(itemSolved){
      label(c,360,h*.52,'Это '+name(question.answer)+'!',36,{color:'#4b8c70'});
      if(!solved)button(c,'next-shadow',360,h*.76,400,90,'Следующая тень',next);
      return;
    }
    const cardW=260,cardH=Math.min(190,h*.245);
    question.options.forEach((key,i)=>{
      const x=question.options.length===3&&i===2?360:i%2===0?205:515,y=h*(question.options.length===2?.67:i<2?.55:.825),isAnswer=key===question.answer;
      panel(c,x,y,cardW,cardH,hinted&&isAnswer?'#edf9f2':wrong.includes(key)?'#fff5f1':'#fff',hinted&&isAnswer?'#72bd9a':'#dbe7f1');
      picture(c,key,x,y-12,Math.min(cardH-32,150));
      label(c,x,y+cardH/2-21,name(key),26);
      target(c,'choice-'+key,x,y,cardW,cardH,()=>{
        if(isAnswer){
          itemSolved=true;solved=part+1===count;render();confetti(c,360,h*.24);
          if(solved)c.hooks.win('Все тени узнаны! Ты внимательно сравнил детали.');
          else c.hooks.feedback('Точно! Рассмотри предмет и нажми «Следующая тень».','good');
        }else{if(!wrong.includes(key))wrong.push(key);render();c.hooks.feedback(compareEdges(),'try');}
      });
    });
  }
  c.hooks.instruction(c.mode==='together'?'Посмотри на тень. Покажи предмет такой же формы.':'Найди предмет с точно такой же формой. Тень может быть немного повёрнута.');
  return {render,hasProgress:()=>part>0||itemSolved||wrong.length>0,hint(){if(itemSolved){c.hooks.feedback('Ты уже узнал предмет. Нажми «Следующая тень».');return;}hinted=true;render();c.hooks.feedback('Нужный предмет подсвечен. Сравни его края с тенью.');},inspect:()=>({...question,part,count,itemSolved,solved})};
};
export default create;
