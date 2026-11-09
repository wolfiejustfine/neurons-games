import { riddleLesson,riddleChoices } from '../expansion';
import { PROP_NAMES } from '../catalog';
import { label,panel,picture,target,button,color } from '../play/draw';
import type { RoundFactory } from '../play/types';
import type Phaser from 'phaser';
const TINTS=['#9dcee4','#b7a4dd','#efc77e','#9dd1bd'];
const create:RoundFactory=c=>{
  const {riddles,order,choiceCount}=riddleLesson(c.level),done=Array<boolean>(riddles.length).fill(false);
  let active:number|null=null,spinning=false,solved=false,angle=0,wrong:string[]=[],highlight:string|null=null;
  let wheel:Phaser.GameObjects.Container|undefined;
  let wheelLabels:Phaser.GameObjects.Text[]=[];
  for(const riddle of riddles)void fetch(import.meta.env.BASE_URL+'audio/riddle-'+riddle.id+'.mp3').catch(()=>{});
  function spin(){
    if(spinning||solved||(active!==null&&!done[active]))return;
    const next=order.find(i=>!done[i]);if(next===undefined)return;
    spinning=true;active=null;wrong=[];highlight=null;render();
    const targetAngle=Math.ceil(angle/360)*360+1080-90-(next+.5)*360/riddles.length;
    const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?120:1000;
    c.scene.tweens.addCounter({from:angle,to:targetAngle,duration,ease:'Cubic.Out',onUpdate:tween=>{angle=tween.getValue()??targetAngle;if(wheel?.active)wheel.setAngle(angle);for(const text of wheelLabels)if(text.active)text.setAngle(-angle);}});
    c.scene.time.delayedCall(duration,()=>{
      angle=targetAngle;spinning=false;active=next;render();
      c.hooks.feedback('Загадка открыта. Можно послушать её или прочитать.');
      c.hooks.narrate(riddles[next].text,riddles[next].id);
    });
  }
  function answer(key:string){
    if(active===null||spinning||done[active])return;
    if(key!==riddles[active].answer){wrong.push(key);c.hooks.feedback('Эта картинка не подходит. '+riddles[active].hint,'try');render();return;}
    done[active]=true;wrong=[];highlight=null;
    if(done.every(Boolean)){solved=true;render();c.hooks.win('Все загадки разгаданы!');}
    else{render();c.hooks.feedback('Это '+PROP_NAMES[key]+'! Крути колесо для следующей загадки.','good');}
  }
  function render(){
    c.clear();wheelLabels=[];const h=c.height,r=Math.min(150,h*.15),cy=h*.24;
    label(c,360,h*.025,'РАЗГАДАНО: '+done.filter(Boolean).length+' / '+riddles.length,24,{color:'#8c8eaa'});
    const g=c.scene.add.graphics();wheel=c.scene.add.container(360,cy,[g]).setAngle(angle);c.root.add(wheel);
    riddles.forEach((_,i)=>{
      const a=i*Math.PI*2/riddles.length,b=(i+1)*Math.PI*2/riddles.length;
      g.fillStyle(color(done[i]?'#b5dcc2':TINTS[i])).beginPath().moveTo(0,0).arc(0,0,r,a,b).closePath().fillPath();
      g.lineStyle(4,0xffffff).lineBetween(0,0,Math.cos(a)*r,Math.sin(a)*r);
      const mid=(a+b)/2;
      const t=c.scene.add.text(Math.cos(mid)*r*.61,Math.sin(mid)*r*.61,done[i]?'✓':'?',{fontFamily:'Rubik,Arial',fontSize:Math.min(38,r*.33),color:'#fff',fontStyle:'bold'}).setOrigin(.5).setAngle(-angle);wheel!.add(t);wheelLabels.push(t);
    });
    g.lineStyle(7,0xfafcff).strokeCircle(0,0,r);g.fillStyle(0xfff4dc).fillCircle(0,0,26);g.lineStyle(4,0xcab989).strokeCircle(0,0,26);
    const pointer=c.scene.add.graphics();c.root.add(pointer);pointer.fillStyle(0xe0ab4a).fillTriangle(343,cy-r-15,377,cy-r-15,360,cy-r+13);
    if(active===null||done[active]){
      if(!solved)button(c,'spin',360,h*.45,390,Math.min(78,h*.10),spinning?'Колесо крутится…':done.some(Boolean)?'Следующая загадка':'Крутить колесо',spin);
    }else button(c,'listen-riddle',360,h*.45,390,Math.min(78,h*.10),'Послушать загадку',()=>c.hooks.narrate(riddles[active!].text,riddles[active!].id));
    const question=active===null?(spinning?'Скоро откроется загадка!':'Нажми «Крутить колесо». Тебя ждут загадки!'):riddles[active].text;
    panel(c,360,h*.585,658,h*.16,'#fffdf8','#e8e1d6',23);
    label(c,360,h*.585,question,26,{wordWrap:{width:604},lineSpacing:7,color:'#627993'});
    if(active!==null){
      const choices=riddleChoices(riddles[active].answer,c.level,active,choiceCount);
      choices.forEach((key,i)=>{
        const x=choiceCount===3?160+i*200:130+i*153,y=h*.815,w=choiceCount===3?178:140;
        const correct=done[active!]&&key===riddles[active!].answer;
        panel(c,x,y,w,Math.min(182,h*.24),correct?'#edf8ef':wrong.includes(key)?'#fff1ed':'#fff',highlight===key||correct?'#82b69b':'#dbe6ef',22);
        picture(c,key,x,y-10,Math.min(w-25,h*.145));
        label(c,x,y+Math.min(62,h*.09),PROP_NAMES[key],23,{color:'#73849c'});
        if(!done[active!]&&!solved)target(c,'answer-'+key,x,y,w,Math.min(182,h*.24),()=>answer(key));
      });
    }
    label(c,360,h*.975,solved?'ПОЛУЧИЛОСЬ!':active!==null&&done[active]?'Ответ найден · можно крутить дальше':'Звук можно повторить. Загадка также написана на экране.',21,{color:'#97a1b3'});
  }
  c.hooks.instruction('Крути колесо, слушай загадку и выбирай картинку-ответ.');
  return {render,hasProgress:()=>active!==null||spinning||done.some(Boolean),hint(){if(active===null){c.hooks.feedback('Нажми «Крутить колесо», чтобы открыть загадку.');return;}if(done[active]){c.hooks.feedback('Эта загадка уже разгадана. Крути колесо дальше.');return;}highlight=riddles[active].answer;render();c.hooks.feedback(riddles[active].hint+' Подходящая картинка выделена.');},inspect:()=>({riddles,order,done,active,spinning,solved,angle,choices:active===null?[]:riddleChoices(riddles[active].answer,c.level,active,choiceCount)})};
};
export default create;
