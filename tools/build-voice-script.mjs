import {createServer} from 'vite';
import ts from 'typescript';
import {mkdirSync,readFileSync,readdirSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const server=await createServer({configFile:false,cacheDir:'node_modules/.vite-voice-script',appType:'custom',server:{middlewareMode:true}});
try{
  const {GAMES,gameById}=await server.ssrLoadModule('/src/catalog.ts');
  const {guideForLevel}=await server.ssrLoadModule('/src/learning.ts');
  const {RIDDLES,paintLesson}=await server.ssrLoadModule('/src/expansion.ts');
  const {PROOFREAD_WORDS,proofreadingLesson}=await server.ssrLoadModule('/src/challenges.ts');
  const lines=[],byText=new Map();
  function add(id,kind,game,text,priority){
    text=text.replace(/\s+/g,' ').trim();if(!text)return;
    if(byText.has(text)){byText.get(text).uses.push(id);return;}
    const line={id,filename:id+'.mp3',priority,kind,game,voice:'narrator-ru',text,sha256:createHash('sha256').update(text).digest('hex'),uses:[id]};
    lines.push(line);byText.set(text,line);
  }
  function addFeedback(id,title,text){
    const hash=createHash('sha256').update(text).digest('hex').slice(0,10);
    add('help-'+id+'-'+hash,'Подсказка',title,text,2);
  }
  for(const entry of GAMES){
    const game=entry.standalone?gameById(entry.id,'together'):entry;
    add('story-'+game.id,'История',game.title,game.story,1);
    const younger=gameById(game.id,'together');
    if(younger.story!==game.story)add('story-together-'+game.id,'История 4–5 лет',game.title,younger.story,1);
    if(!entry.standalone)for(let n=0;n<game.levels;n++)add('guide-'+game.id+'-'+String(n+1).padStart(2,'0'),'Правила',game.title,guideForLevel(game.id,n).join(' '),1);
    for(let n=0;n<game.levels;n++)add('guide-together-'+game.id+'-'+String(n+1).padStart(2,'0'),'Правила 4–5 лет',game.title,guideForLevel(game.id,n,'together').join(' '),1);
    const file=ts.createSourceFile(game.id+'.ts',readFileSync('src/games/'+game.id+'.ts','utf8'),ts.ScriptTarget.Latest,true);
    let counter=0,juniorCounter=0;
    const collect=(expr,junior=false)=>{
      if(ts.isStringLiteralLike(expr))add((junior?'task-together-':'task-')+game.id+'-'+(junior?++juniorCounter:++counter),'Задание',game.title,expr.text,1);
      else if(ts.isConditionalExpression(expr)){const condition=expr.condition.getText(file);
        collect(expr.whenTrue,junior||condition.includes('together')||condition==='counting');collect(expr.whenFalse,junior);}
    };
    function collectFeedback(expr){
      if(ts.isStringLiteralLike(expr))addFeedback(game.id,game.title,expr.text);
      else if(ts.isConditionalExpression(expr)){collectFeedback(expr.whenTrue);collectFeedback(expr.whenFalse);}
    }
    const visit=node=>{
      if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&node.expression.name.text==='feedback'&&node.arguments[0])collectFeedback(node.arguments[0]);
      if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&node.expression.name.text==='instruction'&&node.arguments[0])collect(node.arguments[0]);
      ts.forEachChild(node,visit);
    };visit(file);
  }
  for(const [i,word] of PROOFREAD_WORDS.entries())add('task-proofreading-word-'+(i+1),'Задание','Стоп, ошибка!','Образец: '+word+'. Выбери кнопку и коснись надписи — линия появится сама.',1);
  for(let n=0;n<8;n++){
    const {target}=proofreadingLesson(n,'together');
    add('task-together-proofreading-word-'+(n+1),'Задание 4–5 лет','Стоп, ошибка!','Найди все надписи как на образце: '+target+'.',1);
  }
  for(const r of RIDDLES)add('riddle-'+r.id,'Загадка','Колесо загадок',r.text,1);
  const anagrams=['КОТ','ДОМ','СЫР','МЯЧ','РЫБА','ЛУНА','ЖУК','ТОРТ'];
  anagrams.forEach((word,i)=>{
    add('picture-name-'+(i+1),'Название картинки','Буквы на ветру','Это '+word.toLowerCase()+'. Собери слово «'+word+'».',2);
    add('picture-hint-'+(i+1),'Подсказка','Буквы на ветру','На картинке '+word.toLowerCase()+'. Произнеси слово медленно и прислушайся к звукам.',2);
  });
  for(let n=0;n<8;n++)paintLesson(n).problems.forEach((p,i)=>add('math-'+(n+1)+'-'+(i+1),'Пример','Цветные открытия',p.expression.replace('−','минус').replace('+','плюс'),2));
  for(const [i,text] of ['Получилось! Можно рассмотреть решение и идти дальше.','Все тени узнаны! Ты внимательно сравнил детали.','Новая тень. Сравни детали.','Точно! Рассмотри предмет и нажми «Следующая тень».'].entries())add('feedback-'+(i+1),'Обратная связь','Общее',text,2);
  // Keep identifiers portable and easy to name in an editor.
  for(const line of lines)if(!/^[a-z0-9-]+\.mp3$/.test(line.filename))throw new Error('Non-portable audio filename: '+line.filename);
  const manifest={version:1,recordingStatus:'awaiting-user-audio',voice:{id:'narrator-ru',direction:'Взрослый естественный русскоязычный голос, тёплый и спокойный, без сюсюканья. Один голос на весь первый пакет.'},samples:['story-shadows.mp3','guide-shadows-01.mp3','riddle-cat.mp3'],lines};
  mkdirSync('assets/voice',{recursive:true});
  writeFileSync('assets/voice/script.json',JSON.stringify(manifest,null,2)+'\n');
  const csvCell=value=>'"'+String(value).replaceAll('"','""')+'"';
  writeFileSync('assets/voice/script.csv','\ufeff'+[['Приоритет','Файл','Голос','Игра','Назначение','Текст'],...lines.map(l=>[l.priority,l.filename,l.voice,l.game,l.kind,l.text])].map(row=>row.map(csvCell).join(';')).join('\r\n')+'\r\n');
  writeFileSync('assets/voice/script.txt','РЕПЛИКИ ДЛЯ ОЗВУЧКИ «НЕЙРОНЫ»\n\n'+lines.map(l=>'['+l.filename+'] '+l.game+' — '+l.kind+' — приоритет '+l.priority+'\n'+l.text+'\n').join('\n'));
  const existing=JSON.parse(readFileSync('src/voice-recordings.json','utf8'));
  const currentTexts=new Set(lines.map(l=>l.text));
  const audioFiles=existsSync('public/audio/voice')?readdirSync('public/audio/voice'):[];
  const valid=Object.fromEntries(Object.entries(existing).filter(([text,file])=>currentTexts.has(text)&&audioFiles.includes(file)));
  writeFileSync('src/voice-recordings.json',JSON.stringify(valid,null,2)+'\n');
  console.log(JSON.stringify({lines:lines.length,priority1:lines.filter(l=>l.priority===1).length,priority2:lines.filter(l=>l.priority===2).length,characters:lines.reduce((n,l)=>n+l.text.length,0),ready:Object.keys(valid).length,samples:manifest.samples}));
}finally{await server.close();}
