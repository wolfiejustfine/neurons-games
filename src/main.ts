import './style.css';
import { GAMES, gameById, HERO_NAMES, type GameInfo, type SceneGameInfo } from './catalog';
import { save, persist, complete, nextLevel, finishedCount } from './save';
import { tone, say, silence, narrate } from './audio';
import { GUIDES, HINTS, guideForLevel } from './learning';
import { clockFace,guideVisual } from './guide-visuals';
import type { Engine } from './play/engine';

const base=import.meta.env.BASE_URL;
const app=document.querySelector<HTMLDivElement>('#app')!;
const svg=(name:string)=>{
  const paths:Record<string,string>={
    sound:'<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/>',
    mute:'<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/>',
    back:'<path d="m14 5-7 7 7 7"/>',
    arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
    help:'<path d="M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 4h.01"/><circle cx="12" cy="12" r="10"/>',
    bulb:'<path d="M9 17h6m-5 4h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3Z"/>',
    reset:'<path d="M4 10a8 8 0 1 1 2 8M4 4v6h6"/>',
    star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
  };
  return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(paths[name]??paths.star)+'</svg>';
};
app.innerHTML=[
  '<main id="home" class="home">',
  '<header class="site-header"><a class="brand" href="#" aria-label="Нейроны — главная"><span class="brand-mark">н</span><span>нейроны<small>ИГРЫ МОЗГОПОЛИСА</small></span></a><button class="icon-button sound-toggle" aria-label="Выключить звук">'+svg('sound')+'</button></header>',
  '<section class="welcome"><div class="welcome-copy"><span class="eyebrow">МИР МАЛЕНЬКИХ ОТКРЫТИЙ</span><h1>Навстречу<br>открытиям!</h1><p>Помоги героям Мозгополиса.<br>Наблюдай, пробуй и находи решения.</p><button id="continue" class="primary">Начать приключение '+svg('arrow')+'</button></div><img class="welcome-hero" src="'+base+'art/Vinch.webp" alt="Винч рад встрече" fetchpriority="high"><img class="hero-cloud" src="'+base+'art/cloud.webp" alt=""><span class="floating-spark one">✦</span><span class="floating-spark two">✧</span></section>',
  '<section class="adventures"><div class="section-heading"><div><span class="eyebrow">ТВОИ ПРИКЛЮЧЕНИЯ</span><h2>Что откроем сегодня?</h2></div><span id="collection-progress" class="collection-progress"></span></div><div id="game-grid" class="game-grid"></div></section>',
  '<section class="world-note"><img loading="lazy" src="'+base+'art/world.webp" alt="Парящие острова Мозгополиса"><div><span class="eyebrow">ДОБРО ПОЖАЛОВАТЬ ДОМОЙ</span><h2>Здесь живёт любопытство</h2><p>На каждом острове тебя ждёт новое открытие.</p></div></section>',
  '<footer class="site-footer"><span>Нейроны · Учимся играя</span><button id="about-open" class="text-button">Для родителей</button></footer>',
  '</main>',
  '<main id="play" class="play hidden"><header class="play-header"><button id="back-home" class="icon-button" aria-label="К выбору игр">'+svg('back')+'</button><div class="play-heading"><span id="hero-name" class="eyebrow"></span><h1 id="play-title"></h1></div><button class="icon-button sound-toggle" aria-label="Выключить звук">'+svg('sound')+'</button></header><div class="round-heading"><button id="round-count" class="round-select" aria-label="Выбрать задание"></button><div id="round-dots"></div><button id="read-aloud" class="read-aloud" aria-label="Прочитать задание вслух">'+svg('sound')+'<span>Послушать</span></button></div><p id="stage-caption" class="stage-caption"></p><p id="instruction" class="instruction"></p><div id="stage" class="stage" role="application" aria-label="Игровое поле"><div id="loading" class="loading hidden"><span class="spinner"></span>Открываем приключение…</div></div><div id="feedback" class="feedback" role="status" aria-live="polite"></div><footer id="play-tools" class="play-tools"><button id="how-to" class="tool-button">'+svg('help')+'Как играть</button><button id="hint" class="tool-button">'+svg('bulb')+'Подсказка</button><button id="restart" class="tool-button">'+svg('reset')+'Ещё раз</button></footer><div id="completion" class="completion hidden"><button id="replay-round" class="secondary">Ещё раз</button><button id="next-round" class="primary">Дальше</button></div></main>',
  '<div id="rotate-notice" class="rotate-notice"><div><span class="rotate-symbol">↻</span><h2>Поверни экран</h2><p>Приключения удобнее проходить вертикально.<br>Мы подождём тебя здесь.</p><button id="rotate-home" class="secondary">К приключениям</button></div></div>',
  '<div id="modal" class="modal hidden"><section id="dialog" class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabindex="-1"></section></div>',
  '<div id="update-notice" class="update-notice hidden">Готово обновление игр.<button id="update-button">Обновить</button></div>'
].join('');
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
let engine:Engine|undefined, enginePromise:Promise<Engine>|undefined, current:SceneGameInfo|undefined, level=0, runToken=0, won=false, modalClose:(()=>void)|undefined;
let focusBeforeModal:HTMLElement|null=null;
let hintStep=0;
let modalCleanup:(()=>void)|undefined;

function updateSound(){
  document.querySelectorAll<HTMLButtonElement>('.sound-toggle').forEach((button)=>{button.innerHTML=svg(save.sound?'sound':'mute');button.setAttribute('aria-label',save.sound?'Выключить звук':'Включить звук');button.setAttribute('aria-pressed',String(save.sound));});
}
function home(){
  runToken++;silence();engine?.stop();current=undefined;won=false;
  hideModal();el('home').classList.remove('hidden');el('play').classList.add('hidden');
  const completeGames=GAMES.filter((g)=>finishedCount(g.id)===g.levels).length;
  el('collection-progress').innerHTML=svg('star')+completeGames+' / '+GAMES.length;
  el('game-grid').innerHTML=GAMES.map((g,i)=>{
    const count=finishedCount(g.id);
    return '<button class="game-card" data-game="'+g.id+'" style="--accent:'+g.accent+';--delay:'+(i*30)+'ms"><div class="card-art"><img src="'+base+'props/'+g.icon+'.svg" alt="" loading="lazy"><span class="card-number">'+String(i+1).padStart(2,'0')+'</span></div><div class="card-copy"><span class="card-skill">'+g.skill+'</span><h3>'+g.title+'</h3><p>'+g.short+'</p><div class="card-bottom"><span>'+(count?count+' из '+g.levels+' пройдено':g.age)+'</span>'+svg(count===g.levels?'star':'arrow')+'</div></div></button>';
  }).join('');
  el('continue').innerHTML=(GAMES.some((g)=>finishedCount(g.id))?'Продолжить открытия':'Начать приключение')+svg('arrow');
}
function showModal(html:string,onClose:()=>void){
  modalCleanup?.();modalCleanup=undefined;silence();
  engine?.setInputEnabled(false);
  focusBeforeModal=document.activeElement as HTMLElement;
  el('dialog').innerHTML=html;el('modal').classList.remove('hidden');modalClose=onClose;
  (el('dialog').querySelector<HTMLElement>('.primary')??el('dialog')).focus({preventScroll:true});
  el('dialog').scrollTop=0;
}
function hideModal(){
  modalCleanup?.();modalCleanup=undefined;
  el('modal').classList.add('hidden');modalClose=undefined;
  engine?.setInputEnabled(true);
  if(focusBeforeModal?.isConnected)focusBeforeModal.focus();focusBeforeModal=null;
}
function guideSteps(info:SceneGameInfo,n=level){
  return guideVisual(info.id,n)+'<ol class="guide-steps">'+guideForLevel(info.id,n).map((text,i)=>'<li><span class="guide-number">'+(i+1)+'</span><span>'+text+'</span></li>').join('')+'</ol><button id="guide-read" class="guide-read">'+svg('sound')+'Послушать правила</button>';
}
function numberQuestion(expression:string,accept:(answer:number)=>boolean){
  showModal('<button id="number-close" class="dialog-close icon-button" aria-label="Вернуться к рисунку">'+svg('close')+'</button><span class="eyebrow">ЦВЕТНЫЕ ОТКРЫТИЯ</span><h2 id="dialog-title">Реши пример</h2><div class="number-expression">'+expression+' = <output id="number-value" aria-live="polite">?</output></div><p id="number-note" class="number-note" role="status">Набери ответ и нажми зелёную галочку.</p><div class="number-pad">'+['1','2','3','4','5','6','7','8','9','⌫','0','✓'].map(key=>'<button data-number="'+key+'" class="'+(key==='✓'?'number-check':'')+'" aria-label="'+(key==='⌫'?'Стереть цифру':key==='✓'?'Проверить ответ':key)+'">'+key+'</button>').join('')+'</div><button id="number-read" class="guide-read">'+svg('sound')+'Послушать пример</button>',hideModal);
  let value='';
  const press=(key:string)=>{
    if(key==='✓'){
      if(!value){el('number-note').textContent='Сначала набери ответ.';return;}
      if(accept(Number(value))){hideModal();return;}
      el('number-note').textContent=el('feedback').textContent;value='';
    }else if(key==='⌫')value=value.slice(0,-1);
    else if(value.length<2)value=(value==='0'?'':value)+key;
    el('number-value').textContent=value||'?';
  };
  el('dialog').querySelectorAll<HTMLButtonElement>('[data-number]').forEach(button=>button.onclick=()=>press(button.dataset.number!));
  el('number-close').onclick=hideModal;
  el('number-read').onclick=()=>{if(!say(expression.replace('−','минус').replace('+','плюс')))el('number-note').textContent=save.sound?'Пример можно прочитать на экране.':'Звук выключен. Пример написан выше.';};
  const keydown=(event:KeyboardEvent)=>{
    if(event.ctrlKey||event.altKey||event.metaKey)return;
    if(/^\d$/.test(event.key)){event.preventDefault();press(event.key);}
    else if(event.key==='Backspace'){event.preventDefault();press('⌫');}
    else if(event.key==='Enter'){event.preventDefault();press('✓');}
  };
  document.addEventListener('keydown',keydown);modalCleanup=()=>document.removeEventListener('keydown',keydown);
}
function bindGuideRead(info:SceneGameInfo,n:number){
  el('guide-read').onclick=()=>{
    const text=guideForLevel(info.id,n).join(' ')+' '+(el('dialog').querySelector('figcaption')?.textContent??'');
    if(!say(text))el('guide-read').textContent=save.sound?'Голос недоступен · правила выше':'Включи звук кнопкой вверху';
  };
}
function intro(info:GameInfo){
  if(info.id==='schulte'){silence();location.href=base+info.standalone;return;}
  const n=nextLevel(info.id);
  showModal('<button class="dialog-close icon-button" id="intro-close" aria-label="Закрыть">'+svg('close')+'</button><div class="intro-portrait" style="--accent:'+info.accent+'"><img src="'+base+'art/'+info.hero+'.webp" alt="'+HERO_NAMES[info.hero]+'"></div><span class="eyebrow">'+info.skill+' · '+info.age+'</span><h2 id="dialog-title">'+info.title+'</h2><p>'+info.story+'</p>'+guideSteps(info,n)+'<button id="intro-start" class="primary">'+(n?'Продолжить · задание '+(n+1):'Начать играть')+svg('arrow')+'</button><p class="dialog-footnote">'+info.levels+' заданий · можно играть в своём темпе</p>',hideModal);
  el('intro-close').onclick=hideModal;
  bindGuideRead(info,n);
  el('intro-start').onclick=()=>{hideModal();if(location.hash.slice(1)!==info.id)location.hash=info.id;else void start(info,n);};
}
async function ensureEngine(){
  if(engine)return engine;
  enginePromise??=import('./play/engine').then((m)=>m.createEngine(el('stage')));
  engine=await enginePromise;
  if(import.meta.env.DEV)(window as unknown as {__neurons:unknown}).__neurons={inspect:()=>engine?.inspect()};
  return engine;
}
async function start(info:GameInfo,n:number){
  if(info.id==='schulte'){silence();location.href=base+info.standalone;return;}
  current=info;level=n;won=false;hintStep=0;const token=++runToken;
  silence();hideModal();
  el('completion').classList.add('hidden');el('play-tools').classList.remove('hidden');
  el('home').classList.add('hidden');el('play').classList.remove('hidden');
  el('play').style.setProperty('--accent',info.accent);
  el('hero-name').textContent='В ГОСТЯХ У '+({Vinch:'ВИНЧА',Newt:'НЬЮТА',Jays:'ДЖЕЙС',Aris:'АРИСА',Ren:'РЭНА'}[info.hero]);
  el('play-title').textContent=info.title;
  el('round-count').textContent='Задание '+(n+1)+' из '+info.levels;
  el('stage-caption').textContent=GUIDES[info.id].stages[n];
  el('round-dots').innerHTML=Array.from({length:info.levels},(_,i)=>'<span class="'+(i===n?'active':save.completed[info.id]?.includes(i)?'done':'')+'"></span>').join('');
  el('instruction').textContent=info.action;
  el('feedback').textContent='';el('feedback').dataset.kind='info';
  el('loading').classList.remove('hidden');
  try{
    const e=await ensureEngine();if(token!==runToken)return;
    await e.play(info,n,{
      instruction(text){if(token!==runToken)return;el('instruction').textContent=text;el('loading').classList.add('hidden');},
      feedback(text,kind='info'){if(token!==runToken)return;el('feedback').textContent=text;el('feedback').dataset.kind=kind;if(kind==='try'||kind==='good')silence();if(kind==='try')tone('try');else if(kind==='good'){tone('good');hintStep=0;}},
      listen(text){if(token!==runToken)return;say(text);el('feedback').textContent=text;el('feedback').dataset.kind='info';},
      numberQuestion(expression,accept){if(token===runToken)numberQuestion(expression,accept);},
      narrate(text,id){if(token===runToken)void narrate(text,id);},
      clockPreview(minutes){
        if(token!==runToken)return;
        showModal('<h2 id="dialog-title">Рассмотри часы</h2>'+clockFace(minutes)+'<p>Фиолетовая короткая стрелка — часы.<br>Голубая длинная — минуты.</p><button id="clock-resume" class="primary">Вернуться к встречам</button>',hideModal);
        el('clock-resume').onclick=hideModal;
      },
      win(message){
        if(token!==runToken||won)return;
        won=true;complete(info.id,n);silence();tone('win');
        el('feedback').textContent=message??'Получилось! Можно рассмотреть решение и идти дальше.';el('feedback').dataset.kind='good';
        result(info,n);
      },
    });
  }catch(error){
    if(token!==runToken)return;el('loading').classList.add('hidden');
    el('feedback').textContent='Не удалось загрузить игру. Проверь соединение и нажми «Ещё раз».';
    console.error(error);enginePromise=undefined;
  }
}
function result(info:SceneGameInfo,n:number){
  const last=n+1>=info.levels;
  el('play-tools').classList.add('hidden');el('completion').classList.remove('hidden');
  el('next-round').innerHTML=(last?'К приключениям':'Дальше')+svg('arrow');
  el('next-round').onclick=()=>{if(last)location.hash='';else void start(info,n+1);};
  el('replay-round').onclick=()=>void start(info,n);
}
el('game-grid').onclick=(event)=>{const button=(event.target as HTMLElement).closest<HTMLElement>('[data-game]');if(button){tone();intro(gameById(button.dataset.game!)!);}};
el('continue').onclick=()=>intro(GAMES.find((g)=>finishedCount(g.id)<g.levels)??GAMES[0]);
el('back-home').onclick=()=>{tone();location.hash='';};
el('rotate-home').onclick=()=>{location.hash='';};
function hint(){
  if(won||!current)return;tone();
  if(hintStep<2){
    let text=HINTS[current.id][hintStep++];
    if(current.id==='alarms')text=guideForLevel('alarms',level)[hintStep-1];
    el('feedback').textContent=text;el('feedback').dataset.kind='info';
  }else engine?.hint();
}
el('hint').onclick=hint;
el('how-to').onclick=()=>{
  if(!current||won)return;
  const info=current;
  showModal('<button id="how-close" class="dialog-close icon-button" aria-label="Закрыть">'+svg('close')+'</button><span class="eyebrow">'+info.title+'</span><h2 id="dialog-title">Как играть</h2>'+guideSteps(info)+'<button id="how-resume" class="primary">Понятно, играем</button><button id="how-hint" class="secondary">Нужна подсказка</button>',hideModal);
  el('how-close').onclick=hideModal;el('how-resume').onclick=hideModal;
  bindGuideRead(info,level);
  el('how-hint').onclick=()=>{hideModal();hint();};
};
el('restart').onclick=()=>{
  if(!current)return;tone();
  const info=current,n=level;
  if(!engine?.hasProgress()||won){void start(info,n);return;}
  showModal('<span class="eyebrow">'+info.title+'</span><h2 id="dialog-title">Попробовать сначала?</h2><p>Это задание начнётся заново. Все пройденные задания сохранятся.</p><button id="keep-playing" class="primary">Продолжить задание</button><button id="confirm-restart" class="secondary">Начать заново</button>',hideModal);
  el('keep-playing').onclick=hideModal;el('confirm-restart').onclick=()=>void start(info,n);
};
el('read-aloud').onclick=()=>{
  if(!say((won?el('feedback'):el('instruction')).textContent??'')){
    el('feedback').textContent=save.sound?'На этом устройстве задание можно прочитать на экране.':'Включи звук кнопкой вверху, чтобы услышать задание.';
  }
};
el('round-count').onclick=()=>{
  if(!current||won)return;
  const info=current;
  showModal('<button id="levels-close" class="dialog-close icon-button" aria-label="Закрыть">'+svg('close')+'</button><span class="eyebrow">'+info.title+'</span><h2 id="dialog-title">Выбери задание</h2><div class="level-grid">'+Array.from({length:info.levels},(_,i)=>'<button class="level-choice '+(i===level?'selected':'')+'" data-level="'+i+'" aria-label="Задание '+(i+1)+'">'+(i+1)+'<small>'+(save.completed[info.id]?.includes(i)?'✓':'')+'</small></button>').join('')+'</div>',hideModal);
  el('levels-close').onclick=hideModal;
  el('dialog').querySelectorAll<HTMLButtonElement>('[data-level]').forEach(button=>button.onclick=()=>void start(info,Number(button.dataset.level)));
};
document.querySelectorAll<HTMLButtonElement>('.sound-toggle').forEach((button)=>button.onclick=()=>{save.sound=!save.sound;persist();updateSound();if(save.sound)tone();else silence();});
el('about-open').onclick=()=>{
  showModal('<span class="eyebrow">ДЛЯ РОДИТЕЛЕЙ</span><h2 id="dialog-title">Открытия в своём темпе</h2><p>Коллекция из '+GAMES.length+' игр по предложениям психолога Анастасии Левшиной. Часть заданий предполагает знакомство с буквами, часами или счётом — ориентируйтесь на интерес и умения ребёнка.</p><p>Здесь можно пользоваться подсказками и пробовать снова. Прогресс сохраняется только в этом браузере на этом устройстве. Регистрации и рекламы нет.</p><p>Чтение вслух использует доступный голос устройства. Для первого открытия игры требуется интернет; посещённые игры могут работать без сети после сохранения браузером.</p><button id="about-close" class="primary">Понятно</button>',hideModal);
  el('about-close').onclick=hideModal;
};
document.addEventListener('keydown',(event)=>{
  if(el('modal').classList.contains('hidden'))return;
  if(event.key==='Escape'){event.preventDefault();modalClose?.();}
  if(event.key==='Tab'){
    const controls=[...el('dialog').querySelectorAll<HTMLElement>('button,a[href],[tabindex="0"]')];
    const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)silence();});
window.addEventListener('hashchange',()=>{const info=gameById(location.hash.slice(1));if(info)void start(info,nextLevel(info.id));else home();});
window.addEventListener('pageshow',event=>{if(event.persisted&&!current)home();});
updateSound();home();
const initial=gameById(location.hash.slice(1));if(initial)intro(initial);
if(import.meta.env.PROD&&'serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register(base+'sw.js',{scope:base}).then((registration)=>{
      const offer=()=>{if(registration.waiting&&navigator.serviceWorker.controller)el('update-notice').classList.remove('hidden');};
      offer();registration.addEventListener('updatefound',()=>registration.installing?.addEventListener('statechange',offer));
      el('update-button').onclick=()=>{registration.waiting?.postMessage('activate-update');};
      navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!el('update-notice').classList.contains('hidden'))location.reload();});
    }).catch(()=>{/* The online collection also works without service workers. */});
  });
}
