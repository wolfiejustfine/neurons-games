import type { SceneGameId } from './catalog';
import { clockLesson } from './learning';
import { clockHands,formatClock } from './rules';

export function clockFace(minutes:number) {
  const hands=clockHands(minutes);
  const hand=(angle:number,length:number,width:number,color:string)=>'<line x1="120" y1="120" x2="'+(120+Math.cos(angle)*length)+'" y2="'+(120+Math.sin(angle)*length)+'" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="round"/>';
  return '<svg class="clock-face" viewBox="0 0 240 240" role="img" aria-label="Циферблат со стрелками"><circle cx="120" cy="120" r="111" fill="white" stroke="#aacbd7" stroke-width="6"/>'+Array.from({length:12},(_,i)=>{
    const hour=i+1,a=hour*Math.PI/6-Math.PI/2;
    return '<text x="'+(120+Math.cos(a)*87)+'" y="'+(120+Math.sin(a)*87+7)+'" text-anchor="middle" fill="#536683" font-size="21" font-family="Rubik,Arial">'+hour+'</text>';
  }).join('')+hand(hands.minute,70,5,'#3895b7')+hand(hands.hour,46,10,'#7660ac')+'<circle cx="120" cy="120" r="7" fill="#7660ac"/></svg>';
}
const prop=(name:string)=>'<img src="'+import.meta.env.BASE_URL+'props/'+name+'.svg" alt="">';
const example=(content:string,caption:string)=>'<figure class="guide-example"><div class="example-row">'+content+'</div><figcaption>'+caption+'</figcaption></figure>';
const arrow='<span class="example-arrow" aria-hidden="true">→</span>';
export function guideVisual(id:SceneGameId,level:number):string {
  if(id==='hidden-objects')return example(prop('book')+arrow+'<span class="example-slot">'+prop('book')+' ✓</span>','Пример: в списке есть книга. Найди такую же в комнате и коснись её. Остальные вещи трогать не нужно.');
  if(id==='math-coloring')return example('<span class="example-tile">2 + 3</span>'+arrow+'<span class="example-tile" style="background:#a7d5ee">5 ✓</span>','Пример: 2 + 3 = 5. Набери 5 и нажми зелёную галочку. Цвет с числом 5 появится на рисунке сам.');
  if(id==='riddle-wheel')return example('<span class="example-tile">Мяу?</span>'+arrow+prop('cat'),'Пример: «Кто говорит мяу?» — кот. Выбери его картинку. Загадку можно читать и слушать несколько раз.');
  if(id==='alarms'){
    const lesson=clockLesson(level),time=lesson.halfHours?810:lesson.afternoon?780:540;
    return example(clockFace(time)+arrow+'<strong class="example-time">'+formatClock(time)+'</strong>',lesson.halfHours?'Пример: короткая между 1 и 2 — уже прошёл 1 час дня. Длинная на 6 — ещё 30 минут. Получается 13:30.':lesson.afternoon?'Пример: короткая на 1, длинная на 12 — час дня, или 13:00.':'Пример: короткая на 9, длинная на 12 — 09:00.');
  }
  if(id==='color-sort')return example('<span class="example-tube">●<br>●<br>●<br>●</span><strong>✓</strong><span class="example-tube empty"></span>','Готово: весь цвет в одной полной пробирке — 4 слоя. Лишние пробирки остаются пустыми. Значок на жидкости обозначает цвет, номер внизу — пробирку.');
  if(id==='ciphers')return example('<span class="example-tile">★ = А</span>'+arrow+'<span class="example-tile">★ → А</span>','Пример: таблица говорит, что ★ — это А. Выбери ★ А в таблице, затем коснись ★ в записке.');
  if(id==='proofreading')return example('<span class="example-tile"><u>СТОП</u></span><span class="example-tile"><s>СТП</s></span>','Так выглядят готовые отметки. Рисовать линии не нужно: выбери кнопку, затем коснись надписи.');
  if(id==='maze-sort')return example(prop('screw')+arrow+'<span class="example-bin">'+prop('screw')+'<small>ВИНТЫ</small></span>','Пример: винт относим в ящик «Винты». Гвозди — в ящик «Гвозди». Ящики с такими же значками стоят на концах дорожки.');
  if(id==='anagrams')return example('<span class="example-tile">А</span>'+arrow+'<span class="example-slot">А</span>','Пример: коснись буквы, затем пустой клетки. Если назвал картинку иначе, нажми «Что на картинке?» в игре.');
  if(id==='shadows')return example('<span class="example-shadow">'+prop('key')+'</span>'+arrow+prop('key'),'Пример: у тени и ключа одинаковые зубчики и отверстие.');
  if(id==='rearrangement')return example(prop('book')+'<span class="example-slot">?</span>'+arrow+prop('book'),'Сначала запомни место, затем верни вещь. Если забыл, кнопка «Посмотреть ещё» покажет образец и сохранит расставленные вещи.');
  if(id==='maze-codes')return example('<span class="example-tile">1</span><span class="example-route">····→</span><span class="example-tile">К</span>','Начни у белой точки рядом с числом и веди её по светлой дорожке. Найденная буква останется на экране, пока ты не нажмёшь «Дальше».');
  return example('<svg viewBox="0 0 260 70" role="img" aria-label="Белая точка движется по выделенному проводу"><path d="M15 35C70 0 160 70 245 35" fill="none" stroke="#d4a94e" stroke-width="13"/><circle cx="15" cy="35" r="9" fill="white" stroke="#d4a94e" stroke-width="4"/><path d="m225 31 20 4-15 14" fill="none" stroke="#967437" stroke-width="4"/></svg>','Веди белую точку по яркому проводу. На пересечении продолжай по нему же. Можно отпустить палец и продолжить с того же места.');
}
