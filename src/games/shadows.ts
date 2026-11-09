import { PROPS, PROP_NAMES } from '../catalog';
import { random, shuffled } from '../rules';
import { SHADOW_OPTIONS } from '../learning';
import { panel,picture,target,label,confetti } from '../play/draw';
import type { RoundFactory } from '../play/types';
const create:RoundFactory=(c)=>{
  const rng=random(981+c.level*187), answer=PROPS[(c.level*5)%PROPS.length];
  const options=shuffled([answer,...shuffled(PROPS.filter((p)=>p!==answer),rng).slice(0,SHADOW_OPTIONS[c.level]-1)],rng);
  let solved=false,hinted=false,wrong:string[]=[];
  function render(){
    c.clear();
    const w=c.width,h=c.height;
    panel(c,w/2,h*.28,Math.min(580,w-60),h*.46,'#e9eaf8','#dde0f1',40);
    label(c,w/2,h*.095,'ЧТО СПРЯТАЛОСЬ В ТЕНИ?',25,{color:'#7a7da5',letterSpacing:2});
    picture(c,answer,w/2,h*.29,Math.min(225,h*.28),!solved);
    label(c,w/2,h*.47,solved?'Это '+PROP_NAMES[answer]+'!':'Узнаёшь этот предмет?',28,{color:'#74799f'});
    const cardW=options.length===2?220:options.length===3?190:145, gap=18, full=options.length*cardW+(options.length-1)*gap, y=h*.71;
    options.forEach((key,i)=>{
      const x=w/2-full/2+cardW/2+i*(cardW+gap),isAnswer=key===answer;
      panel(c,x,y,cardW,cardW+42,hinted&&isAnswer?'#edf9f2':wrong.includes(key)?'#fff5f1':'#ffffff',hinted&&isAnswer?'#72bd9a':'#dbe7f1');
      picture(c,key,x,y-12,cardW-32);
      label(c,x,y+cardW/2-3,PROP_NAMES[key],23);
      if(!solved)target(c,'choice-'+key,x,y,cardW,cardW+42,()=>{
        if(isAnswer){solved=true;render();confetti(c,w/2,h*.29);c.hooks.win();}
        else{wrong.push(key);render();c.hooks.feedback('Посмотри на форму ещё раз. Ты найдёшь!','try');}
      });
    });
  }
  c.hooks.instruction('Какой предмет отбрасывает эту тень?');
  return {render,hasProgress:()=>solved,hint(){hinted=true;render();c.hooks.feedback('Нужный предмет подсвечен. Сравни его с тенью.');},inspect:()=>({answer,options,solved})};
};
export default create;
