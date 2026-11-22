import { panel,label,target,button } from '../play/draw';
import { proofreadingLesson } from '../challenges';
import type { RoundFactory } from '../play/types';
const create:RoundFactory=(c)=>{
  const {target:sample,words}=proofreadingLesson(c.level,c.mode),count=words.length;
  const together=c.mode==='together';
  const needed=together?words.filter(word=>word===sample).length:count;
  const marks:(boolean|null)[]=Array(count).fill(null);let tool=true,highlight=-1,solved=false;
  function render(){
    c.clear();
    const h=c.height,cols=count<=4?2:3,rows=Math.ceil(count/cols);
    const gridTop=together?h*.28:h*.27+16,gridBottom=h*.89;
    const stepY=Math.min(together?215:176,(gridBottom-gridTop)/rows);
    const top=(gridTop+gridBottom-(rows-1)*stepY)/2;
    const cardW=cols===2?245:192,cardH=Math.min(together?174:142,stepY-12);
    if(!together){
      button(c,'tool-good',188,h*.105,280,88,'Подчеркнуть',()=>{tool=true;render();},tool);
      button(c,'tool-bad',532,h*.105,280,88,'Зачеркнуть',()=>{tool=false;render();},!tool);
    }
    label(c,360,h*(together?.13:.205),'Образец: '+sample,together?44:33,{color:'#596f90',fontStyle:'bold'});
    words.forEach((word,i)=>{
      const x=cols===2?220+(i%2)*280:145+(i%3)*215,y=top+Math.floor(i/cols)*stepY;
      panel(c,x,y,cardW,cardH,marks[i]===null?'#fff':'#f1f8f5',highlight===i?c.info.accent:'#e0e9f0',22);
      label(c,x,y-5,word,Math.min(together?48:37,(cardW-24)/word.length*1.45),{fontStyle:'bold',color:'#6b7290'});
      if(marks[i]!==null){
        const g=c.scene.add.graphics();c.root.add(g);g.lineStyle(7,marks[i]?0x67ad92:0xcb9397,1);
        if(marks[i])g.lineBetween(x-62,y+27,x+62,y+27);
        else{g.lineBetween(x-62,y-27,x+62,y+27);g.lineBetween(x+62,y-27,x-62,y+27);}
      }else if(!solved)target(c,'sign-'+i,x,y,cardW,cardH,()=>{
        const correct=word===sample;
        if(together&&!correct){c.hooks.feedback('Посмотри на образец ещё раз. Все буквы должны совпасть.','try');return;}
        if(tool!==correct){c.hooks.feedback(correct?'Эта надпись верная. Выбери «Подчеркнуть».':word.length<sample.length?'Здесь не хватает буквы. Выбери «Зачеркнуть».':'Буквы отличаются от образца. Выбери «Зачеркнуть».','try');return;}
        marks[i]=correct;highlight=-1;
        solved=marks.filter(v=>v!==null).length===needed;
        render();
        if(solved)c.hooks.win();else c.hooks.feedback('Так и есть!','good');
      });
    });
    label(c,360,h*.94,(together?'Найдено: ':'Проверено: ')+marks.filter((v)=>v!==null).length+' из '+needed,27,{color:'#8a91a5'});
  }
  c.hooks.instruction(together?'Найди все надписи как на образце: '+sample+'.':'Образец: '+sample+'. Выбери кнопку и коснись надписи — линия появится сама.');
  return {render,hasProgress:()=>marks.some(v=>v!==null),hint(){highlight=marks.findIndex((v,i)=>v===null&&(!together||words[i]===sample));if(highlight>=0){tool=words[highlight]===sample;render();c.hooks.feedback(together?'Коснись выделенной надписи. Она совпадает с образцом.':'Сравни выделенную надпись с образцом: '+sample.split('').join(' · ')+'. Инструмент уже выбран.');}},inspect:()=>({sample,words,marks,tool,together,solved})};
};
export default create;
