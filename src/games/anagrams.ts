import { panel,picture,label,target,token,button } from '../play/draw';
import { shuffled,random } from '../rules';
import type { RoundFactory } from '../play/types';
const WORDS=[['КОТ','cat'],['ДОМ','house'],['СЫР','cheese'],['МЯЧ','ball'],['РЫБА','fish'],['ЛУНА','moon'],['ЖУК','beetle'],['ТОРТ','cake']];
const create:RoundFactory=(c)=>{
  const [word,prop]=WORDS[c.level],letters=shuffled([...word],random(816+c.level));
  if(letters.join('')===word)letters.push(letters.shift()!);
  const slots:(number|null)[]=Array(word.length).fill(null);
  let selected:number|null=null,solved=false,hinted=-1,hintStep=0;
  const coords=()=>{const step=118,start=360-(word.length-1)*step/2;return slots.map((_,i)=>({x:start+i*step,y:c.height*.57}));};
  function place(source:number,dest:number){
    if(solved||slots.includes(source)){render();return;}
    if(dest<0){render();return;}
    if(slots[dest]!==null){c.hooks.feedback('Эта клеточка уже занята. Выбери пустую.');render();return;}
    if(letters[source]!==word[dest]){selected=null;render();c.hooks.feedback('Здесь нужна другая буква. Посмотри на картинку.','try');return;}
    slots[dest]=source;selected=null;hinted=-1;hintStep=0;render();
    if(slots.every((s)=>s!==null)){solved=true;render();c.hooks.win('Получилось слово «'+word+'». Прочитай его!');}
    else c.hooks.feedback('Верно! Продолжай собирать слово.','good');
  }
  function render(){
    c.clear();const h=c.height;
    panel(c,360,h*.20,380,h*.30,'#fff6dc','#f1e5bf',34);
    picture(c,prop,360,h*.20,Math.min(200,h*.25));
    if(!solved)button(c,'name-picture',360,h*.425,360,68,'Что на картинке?',()=>c.hooks.listen('Это '+word.toLowerCase()+'. Собери слово «'+word+'».'));
    else label(c,360,h*.425,'ПРОЧИТАЙ СЛОВО',25,{color:'#9391a6',letterSpacing:1});
    coords().forEach((p,i)=>{
      panel(c,p.x,p.y,100,112,slots[i]===null?'#edf4fa':'#eff9f2',hinted===i?c.info.accent:'#d7e5ee',18);
      label(c,p.x,p.y,slots[i]===null?'':letters[slots[i]!],44,{fontStyle:'bold'});
      if(!solved&&slots[i]===null)target(c,'slot-'+i,p.x,p.y,100,112,()=>{if(selected!==null)place(selected,i);else c.hooks.feedback('Сначала выбери букву внизу, затем коснись клеточки.');});
    });
    label(c,360,h*.71,solved?'СЛОВО СОБРАНО!':selected===null?'Перенеси буквы в клеточки':'Теперь выбери клеточку',26,{color:'#8391a8'});
    letters.forEach((letter,i)=>{
      if(slots.includes(i))return;
      const x=360-(letters.length-1)*118/2+i*118,y=h*.86;
      token(c,'letter-'+i,letter,x,y,100,110,(dx,dy)=>{
        const dest=coords().findIndex((p)=>Math.abs(dx-p.x)<58&&Math.abs(dy-p.y)<76);place(i,dest);
      },()=>{selected=i;render();c.hooks.feedback('Буква «'+letter+'» выбрана. Теперь коснись пустой клеточки.');},selected===i);
    });
  }
  c.hooks.instruction('Собери слово: переставь буквы под картинкой.');
  return {render,hasProgress:()=>slots.some(s=>s!==null),hint(){const i=slots.findIndex((s)=>s===null);if(i>=0){if(hintStep++===0){c.hooks.listen('На картинке '+word.toLowerCase()+'. Произнеси слово медленно и прислушайся к звукам.');return;}hinted=i;render();c.hooks.feedback('В выделенной клеточке нужна буква «'+word[i]+'».');}},inspect:()=>({word,letters,slots,solved})};
};
export default create;
