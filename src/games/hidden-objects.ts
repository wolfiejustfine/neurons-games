import { searchLesson } from '../expansion';
import { PROP_NAMES } from '../catalog';
import { picture,label,target,panel } from '../play/draw';
import type { RoundFactory } from '../play/types';

const SPOTS=[{x:.12,y:.24},{x:.36,y:.24},{x:.64,y:.24},{x:.88,y:.24},{x:.16,y:.53},{x:.39,y:.53},{x:.63,y:.53},{x:.86,y:.53},{x:.14,y:.84},{x:.37,y:.84},{x:.62,y:.84},{x:.84,y:.84}];
const create:RoundFactory=c=>{
  const {visible,targets}=searchLesson(c.level),found=new Set<string>();let highlighted:string|null=null,solved=false;
  function render(){
    c.clear();const h=c.height,roomH=h*.72,roomY=roomH/2+12;
    const bg=c.scene.add.image(360,roomY,'newt-lab').setDisplaySize(660,roomH);c.root.add(bg);
    const size=Math.min(112,roomH*.15);
    visible.forEach((key,i)=>{
      if(found.has(key))return;
      const p=SPOTS[i],x=30+p.x*660,y=12+p.y*roomH;
      if(highlighted===key)panel(c,x,y,size+24,size+24,'#fff8df','#e2bb60',25);
      picture(c,key,x,y,size);
      if(!solved)target(c,'object-'+key,x,y,Math.max(96,size+12),Math.max(96,size+12),()=>{
        if(!targets.includes(key)){c.hooks.feedback('Этого предмета нет в списке гостей внизу. Сравни картинки.','try');return;}
        found.add(key);highlighted=null;
        if(found.size===targets.length){solved=true;render();c.hooks.win('Все забытые вещи найдены. Спасибо за помощь Ньюту!');}
        else{render();c.hooks.feedback('Нашли: '+PROP_NAMES[key]+'! Осталось '+(targets.length-found.size)+'.','good');}
      });
    });
    label(c,360,h*.785,'ВЕЩИ ГОСТЕЙ · '+found.size+' / '+targets.length,25,{color:'#7b8ba4'});
    targets.forEach((key,i)=>{
      const step=100,x=360-(targets.length-1)*step/2+i*step,y=h*.90;
      panel(c,x,y,88,Math.min(110,h*.16),found.has(key)?'#edf8ef':'#fff','#dae6ed',16);
      picture(c,key,x,y-7,70).setAlpha(found.has(key)?.35:1);
      if(found.has(key))label(c,x,y+28,'✓',28,{color:'#4e9a7a',fontStyle:'bold'});
      else if(!solved)target(c,'wanted-'+key,x,y,88,Math.min(110,h*.16),()=>c.hooks.listen('Найди предмет: '+PROP_NAMES[key]+'. Он спрятан в комнате.'));
    });
  }
  c.hooks.instruction('Найди в комнате вещи гостей. Их картинки показаны внизу.');
  return {render,hasProgress:()=>found.size>0,hint(){highlighted=targets.find(key=>!found.has(key))??null;render();if(highlighted)c.hooks.feedback('Предмет «'+PROP_NAMES[highlighted]+'» выделен тёплой рамкой в комнате.');},inspect:()=>({visible,targets,found:[...found],highlighted,solved})};
};
export default create;
