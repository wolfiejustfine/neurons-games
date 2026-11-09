import { TUBE_LEVELS,CAPACITY,pour,sortedTubes,tubeSolution,type Tubes } from '../rules';
import { label,panel,target,button } from '../play/draw';
import type { RoundFactory } from '../play/types';
const COLORS=[0x75afdf,0xeaae65,0xac8bce,0x80baa0];
const SYMBOLS=['●','▲','■','★'];
const create:RoundFactory=(c)=>{
  let tubes:Tubes=TUBE_LEVELS[c.level].map((t)=>[...t]),selected:number|null=null,moves=0,solved=false;
  const history:Tubes[]=[];
  function render(){
    c.clear();const h=c.height;
    label(c,360,h*.045,'КАЖДЫЙ ЦВЕТ — В ПОЛНУЮ ПРОБИРКУ',23,{color:'#7987a1'});
    label(c,360,h*.095,'4 слоя одного цвета · остальные пробирки пустые',22,{color:'#8c8da7'});
    const cols=tubes.length>4?3:tubes.length,rows=Math.ceil(tubes.length/cols),stepX=cols===3?205:158;
    const tubeH=Math.min(300,h*(rows===2?.32:.50)),tubeW=96,layer=(tubeH-23)/CAPACITY;
    tubes.forEach((tube,i)=>{
      const countThisRow=Math.min(cols,tubes.length-Math.floor(i/cols)*cols);
      const x=360-(countThisRow-1)*stepX/2+(i%cols)*stepX,y=h*(rows===2?.30+Math.floor(i/cols)*.39:.45);
      if(selected===i)panel(c,x,y,tubeW+30,tubeH+30,'#f0ebfc','#b4a4de',25);
      const g=c.scene.add.graphics();c.root.add(g);
      g.fillStyle(0xe4eef8,.65).fillRoundedRect(x-tubeW/2,y-tubeH/2,tubeW,tubeH,{tl:8,tr:8,bl:30,br:30});
      tube.forEach((color,j)=>{
        const bottom=y+tubeH/2-8-j*layer;
        g.fillStyle(COLORS[color],1).fillRoundedRect(x-tubeW/2+7,bottom-layer,tubeW-14,layer+1,j===0?{tl:0,tr:0,bl:22,br:22}:0);
        label(c,x,bottom-layer/2,SYMBOLS[color],21,{color:'#ffffff',fontStyle:'bold'});
      });
      g.lineStyle(4,0xb2c7d9).beginPath().moveTo(x-tubeW/2,y-tubeH/2).lineTo(x-tubeW/2,y+tubeH/2-tubeW/2).arc(x,y+tubeH/2-tubeW/2,tubeW/2,Math.PI,0,true).lineTo(x+tubeW/2,y-tubeH/2).strokePath();
      g.lineStyle(5,0xffffff,.6).lineBetween(x-tubeW/2+14,y-tubeH/2+15,x-tubeW/2+14,y+tubeH/2-45);
      const full=tube.length===CAPACITY&&tube.every(v=>v===tube[0]);
      label(c,x,y+tubeH/2+23,'№ '+(i+1)+(full?' ✓':''),23,{color:full?'#398d6e':'#9aa8bb'});
      if(!solved)target(c,'tube-'+i,x,y,tubeW+30,tubeH+20,()=>{
        if(selected===null){if(tube.length){selected=i;render();c.hooks.feedback('Теперь выбери пустую пробирку или такой же верхний цвет.');}else c.hooks.feedback('Сначала выбери пробирку с жидкостью.');return;}
        if(selected===i){selected=null;render();return;}
        const next=pour(tubes,selected,i);
        if(!next){const full=tubes[i].length>=CAPACITY;selected=null;render();c.hooks.feedback(full?'Эта пробирка заполнена. Выбери другую.':'Верхние цвета разные. Выбери такой же цвет или пустую пробирку.','try');return;}
        history.push(tubes.map((t)=>[...t]));tubes=next;selected=null;moves++;render();
        if(sortedTubes(tubes)){solved=true;render();c.hooks.win('Каждый цвет собран в полную пробирку!');}
        else if(!tubes.some((_,a)=>tubes.some((__,b)=>pour(tubes,a,b))))c.hooks.feedback('Попробуй отменить ход или начни задание ещё раз.');
        else if(tubes.every(t=>!t.length||t.every(v=>v===t[0])))c.hooks.feedback('Цвета разделены! Теперь соедини одинаковые: в полной пробирке должно быть 4 слоя.','good');
        else c.hooks.feedback('Перелили! Какой цвет соберём дальше?','good');
      });
    });
    label(c,190,h*.93,'Ходов: '+moves,27,{color:'#8d97ad'});
    if(!solved)button(c,'undo',510,h*.93,240,76,'Отменить ход',()=>{
      const prev=history.pop();if(prev&&!solved){tubes=prev;moves=Math.max(0,moves-1);selected=null;render();}
    });
  }
  c.hooks.instruction('Собери весь цвет в одну полную пробирку. Выбери, откуда и куда перелить.');
  return {render,hasProgress:()=>moves>0,hint(){const path=tubeSolution(tubes);if(path?.length){selected=path[0][0];render();c.hooks.feedback('Перелей из пробирки '+(path[0][0]+1)+' в пробирку '+(path[0][1]+1)+'.');}else if(!solved)c.hooks.feedback('Отмени несколько ходов или начни задание заново.');},inspect:()=>({tubes,selected,moves,solution:tubeSolution(tubes),solved})};
};
export default create;
