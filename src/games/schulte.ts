import { random,shuffled } from '../rules';
import { label,panel,target } from '../play/draw';
import type { RoundFactory } from '../play/types';

const create:RoundFactory=c=>{
  const count=[2,2,3,3,4,4,5,6][c.level];
  const numbers=shuffled(Array.from({length:count},(_,i)=>i+1),random(709+c.level));
  let next=1,hinted=false;
  function render(){
    c.clear();
    const cols=count>4?3:2,rows=Math.ceil(count/cols);
    const stepY=Math.min(176,c.height*.53/rows),top=c.height*.57-(rows-1)*stepY/2;
    label(c,360,c.height*.08,'НАЙДИ ТАКОЕ ЧИСЛО',27);
    label(c,360,c.height*.20,next<=count?String(next):'✓',66,{fontStyle:'bold'});
    numbers.forEach((value,i)=>{
      const row=Math.floor(i/cols),inRow=Math.min(cols,count-row*cols);
      const x=360+(i%cols-(inRow-1)/2)*185,y=top+row*stepY,done=value<next;
      panel(c,x,y,155,stepY-12,done?'#edf8ee':'#ffffff',hinted&&value===next?'#527eae':'#c4dbea',20);
      label(c,x,y,done?'✓':String(value),56,{fontStyle:'bold',color:done?'#54896c':'#425e88'});
      if(!done)target(c,'number-'+value,x,y,155,stepY-12,()=>{
        if(value!==next){c.hooks.feedback('Посмотри на число вверху. Найди такое же.','try');return;}
        next++;hinted=false;render();
        if(next>count)c.hooks.win('Ты нашёл все числа по порядку!');
        else c.hooks.feedback('Есть! Найди следующее число.','good');
      });
    });
  }
  c.hooks.instruction('Найди на поле число, которое показано вверху.');
  return {render,hasProgress:()=>next>1,hint(){hinted=true;render();c.hooks.feedback('Нужное число обведено синей рамкой.');},inspect:()=>({numbers,next,solved:next>count})};
};
export default create;
