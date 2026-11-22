import { panel,label,target,token } from '../play/draw';
import { shuffled,random } from '../rules';
import { CIPHER_WORDS } from '../learning';
import type { RoundFactory } from '../play/types';
const GLYPHS=['●','▲','◆','★','✚','■','♥','✦'];
const create:RoundFactory=(c)=>{
  const word=(c.mode==='together'?['АУ','МЫ','УХ','ОН','МАМА','ПАПА','КОТ','ДОМ']:CIPHER_WORDS)[c.level],alphabet=shuffled([...new Set(word)],random(811+c.level));
  const mapping=Object.fromEntries(alphabet.map((letter,i)=>[letter,GLYPHS[i]]));
  const solved=Array<boolean>(word.length).fill(false);let selected:string|null=null,highlight=-1,finished=false;
  const points=()=>[...word].map((_,i)=>({x:360-(word.length-1)*103/2+i*103,y:c.height*.75}));
  function place(letter:string,index:number){
    if(finished||index<0){render();return;}
    if(solved[index]){render();return;}
    if(word[index]!==letter){
      selected=letter;render();c.hooks.feedback('Выбран значок '+mapping[letter]+'. Найди внизу такой же значок.','try');return;
    }
    solved[index]=true;selected=null;highlight=-1;render();
    if(solved.every(Boolean)){finished=true;render();c.hooks.win('Послание «'+word+'» открыто. Прочитай его!');}else c.hooks.feedback('Буква открылась!','good');
  }
  function render(){
    c.clear();const h=c.height;
    label(c,360,h*.08,'ТАБЛИЦА-ПОДСКАЗКА',27,{color:'#8a8caa',letterSpacing:1});
    const cols=3,rows=Math.ceil(alphabet.length/cols),rowGap=Math.min(150,h*.2),top=h*.19;
    alphabet.forEach((letter,i)=>{
      const x=150+(i%cols)*210,y=top+Math.floor(i/cols)*rowGap;
      if(![...word].some((ch,j)=>ch===letter&&!solved[j])){
        panel(c,x,y,176,105,'#edf5f1','#cfddd7',18);
        label(c,x,y,mapping[letter]+'  '+letter+' ✓',33,{color:'#5b776b'});
        return;
      }
      token(c,'key-'+letter,mapping[letter]+'  '+letter,x,y,176,105,(dx,dy)=>place(letter,points().findIndex((p)=>Math.abs(p.x-dx)<55&&Math.abs(p.y-dy)<80)),()=>{selected=letter;render();c.hooks.feedback('Теперь коснись такого же значка в секретном слове.');},selected===letter);
    });
    const keyBottom=top+(rows-1)*rowGap+70;
    label(c,360,Math.max(keyBottom+35,h*.57),'СЕКРЕТНОЕ СЛОВО',26,{color:'#8a8caa',letterSpacing:1});
    points().forEach((p,i)=>{
      panel(c,p.x,p.y,90,112,solved[i]?'#edf9f2':'#f5f0fb',highlight===i?c.info.accent:'#ded8f0',19);
      label(c,p.x,p.y,solved[i]?word[i]:mapping[word[i]],43,{fontStyle:'bold',color:solved[i]?'#528b70':'#8884ac'});
      if(!finished&&!solved[i])target(c,'code-'+i,p.x,p.y,90,112,()=>{if(selected)place(selected,i);else c.hooks.feedback('Сначала выбери значок с буквой в таблице наверху.');});
    });
    label(c,360,h*.94,finished?'Прочитай получившееся слово':'Значок превращается в букву',24,{color:'#97a0b2'});
  }
  c.hooks.instruction('Выбери значок с буквой в таблице и коснись такого же в записке.');
  return {render,hasProgress:()=>solved.some(Boolean),hint(){const i=solved.findIndex((v)=>!v);if(i>=0){highlight=i;selected=word[i];render();c.hooks.feedback('Я выбрал пару '+mapping[word[i]]+' и «'+word[i]+'». Теперь коснись выделенного значка в записке.');}},inspect:()=>({word,mapping,solved,finished})};
};
export default create;
