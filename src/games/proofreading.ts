import { panel,label,target,button } from '../play/draw';
import { random,shuffled } from '../rules';
import { PROOFREAD_COUNTS } from '../learning';
import type { RoundFactory } from '../play/types';
const create:RoundFactory=(c)=>{
  const count=PROOFREAD_COUNTS[c.level],rng=random(517+c.level),incorrect=['СТПО','СОПТ','СПОТ','СТП','СОТ','ТСОП'];
  const words=shuffled(Array.from({length:count},(_,i)=>i%2===0?'СТОП':incorrect[(i+c.level)%incorrect.length]),rng);
  const marks:(boolean|null)[]=Array(count).fill(null);let tool=true,highlight=-1,solved=false;
  function render(){
    c.clear();const h=c.height,cols=count===4?2:3,rows=Math.ceil(count/cols),top=h*.31,stepY=Math.min(175,(h*.59)/rows),cardW=cols===2?245:192;
    button(c,'tool-good',188,h*.105,280,88,'Подчеркнуть',()=>{tool=true;render();},tool);
    button(c,'tool-bad',532,h*.105,280,88,'Зачеркнуть',()=>{tool=false;render();},!tool);
    label(c,360,h*.205,tool?'Ищи надписи СТОП без ошибок':'Ищи надписи с ошибками',26,{color:'#8a91a5'});
    words.forEach((word,i)=>{
      const x=cols===2?220+(i%2)*280:145+(i%3)*215,y=top+Math.floor(i/cols)*stepY;
      panel(c,x,y,cardW,Math.min(142,stepY-15),marks[i]===null?'#fff':'#f1f8f5',highlight===i?c.info.accent:'#e0e9f0',22);
      label(c,x,y-5,word,37,{fontStyle:'bold',color:'#6b7290'});
      if(marks[i]!==null){
        const g=c.scene.add.graphics();c.root.add(g);g.lineStyle(7,marks[i]?0x67ad92:0xcb9397,1);
        if(marks[i])g.lineBetween(x-62,y+27,x+62,y+27);
        else{g.lineBetween(x-62,y-27,x+62,y+27);g.lineBetween(x+62,y-27,x-62,y+27);}
      }else if(!solved)target(c,'sign-'+i,x,y,cardW,Math.min(142,stepY-15),()=>{
        const correct=word==='СТОП';
        if(tool!==correct){c.hooks.feedback(correct?'Эта надпись верная. Выбери «Подчеркнуть».':word.length<4?'Здесь не хватает буквы. Выбери «Зачеркнуть».':'Здесь перепутан порядок букв. Выбери «Зачеркнуть».','try');return;}
        marks[i]=correct;highlight=-1;render();
        if(marks.every((v)=>v!==null)){solved=true;c.hooks.win();}else c.hooks.feedback('Так и есть!','good');
      });
    });
    label(c,360,h*.94,'Проверено: '+marks.filter((v)=>v!==null).length+' из '+count,27,{color:'#8a91a5'});
  }
  c.hooks.instruction('Образец: СТОП. Выбери кнопку и коснись надписи — линия появится сама.');
  return {render,hasProgress:()=>marks.some(v=>v!==null),hint(){highlight=marks.findIndex((v)=>v===null);if(highlight>=0){tool=words[highlight]==='СТОП';render();c.hooks.feedback('Сравни выделенную надпись с образцом: С · Т · О · П. Инструмент уже выбран.');}},inspect:()=>({words,marks,tool,solved})};
};
export default create;
