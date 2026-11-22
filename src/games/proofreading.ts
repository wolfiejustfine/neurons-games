import { panel,label,target,button } from '../play/draw';
import { proofreadingLesson } from '../challenges';
import type { RoundFactory } from '../play/types';
function compareWords(sample:string,word:string){
  let index=0;
  while(index<word.length&&sample[index]===word[index])index++;
  const missing=word.length<sample.length;
  const aligned=missing?word.slice(0,index)+'□'+word.slice(index):word;
  const clue=missing?'В этой надписи пропала буква «'+sample[index]+'».':'На месте '+(index+1)+' в образце «'+sample[index]+'», а здесь «'+word[index]+'».';
  return {index,aligned,clue};
}
const create:RoundFactory=(c)=>{
  const {target:sample,words}=proofreadingLesson(c.level,c.mode),count=words.length;
  const together=c.mode==='together';
  const needed=together?words.filter(word=>word===sample).length:count;
  const marks:(boolean|null)[]=Array(count).fill(null);let compared=-1,tool=true,highlight=-1,solved=false;
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
    const comparison=compared>=0?compareWords(sample,words[compared]):null;
    function markedWord(text:string,x:number,y:number,width:number,size:number){
      const spacing=Math.min(width/text.length,size*.86);
      [...text].forEach((ch,i)=>{
        const cx=x+(i-(text.length-1)/2)*spacing;
        if(i===comparison?.index)panel(c,cx,y,spacing,size*1.2,'#ffe8ab','#bb862f',5);
        label(c,cx,y,ch,size,{fontStyle:'bold',color:'#485772'});
      });
    }
    if(comparison){
      label(c,360,h*(together?.07:.175),'ОБРАЗЕЦ',20,{color:'#586b84'});
      markedWord(sample,360,h*(together?.15:.23),540,together?44:33);
    }else label(c,360,h*(together?.13:.205),'Образец: '+sample,together?44:33,{color:'#596f90',fontStyle:'bold'});
    words.forEach((word,i)=>{
      const x=cols===2?220+(i%2)*280:145+(i%3)*215,y=top+Math.floor(i/cols)*stepY;
      panel(c,x,y,cardW,cardH,marks[i]===null?'#fff':'#f1f8f5',highlight===i?c.info.accent:'#e0e9f0',22);
      if(i===compared&&comparison)markedWord(comparison.aligned,x,y-5,cardW-20,Math.min(together?48:36,(cardW-20)/sample.length*1.13));
      else label(c,x,y-5,word,Math.min(together?48:37,(cardW-24)/word.length*1.45),{fontStyle:'bold',color:'#6b7290'});
      if(marks[i]!==null){
        const g=c.scene.add.graphics();c.root.add(g);g.lineStyle(7,marks[i]?0x67ad92:0xcb9397,1);
        if(marks[i])g.lineBetween(x-62,y+27,x+62,y+27);
        else{g.lineBetween(x-62,y-27,x+62,y+27);g.lineBetween(x+62,y-27,x-62,y+27);}
      }else if(!solved)target(c,'sign-'+i,x,y,cardW,cardH,()=>{
        const correct=word===sample;
        if(!correct&&(together||tool)){
          compared=i;highlight=i;render();
          const {clue}=compareWords(sample,word);
          c.hooks.feedback(clue+(together?' Найди слово, где всё совпадает.':' Выбери «Зачеркнуть» и нажми на эту надпись.'),'try');
          return;
        }
        if(!together&&!tool&&correct){
          compared=-1;highlight=i;render();
          c.hooks.feedback('Все буквы совпали. Выбери «Подчеркнуть» и нажми на эту надпись.','try');return;
        }
        marks[i]=correct;highlight=-1;compared=-1;
        solved=marks.filter(v=>v!==null).length===needed;
        render();
        if(solved)c.hooks.win();else c.hooks.feedback('Так и есть!','good');
      });
    });
    label(c,360,h*.94,(together?'Найдено: ':'Проверено: ')+marks.filter((v)=>v!==null).length+' из '+needed,27,{color:'#8a91a5'});
  }
  c.hooks.instruction(together?'Найди все надписи как на образце: '+sample+'.':'Образец: '+sample+'. Выбери кнопку и коснись надписи — линия появится сама.');
  return {render,hasProgress:()=>marks.some(v=>v!==null),hint(){compared=-1;highlight=marks.findIndex((v,i)=>v===null&&(!together||words[i]===sample));if(highlight>=0){tool=words[highlight]===sample;render();c.hooks.feedback(together?'Коснись выделенной надписи. Она совпадает с образцом.':'Сравни выделенную надпись с образцом: '+sample.split('').join(' · ')+'. Инструмент уже выбран.');}},inspect:()=>({sample,words,marks,tool,together,solved})};
};
export default create;
