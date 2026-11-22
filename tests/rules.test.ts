import test from 'node:test';
import assert from 'node:assert/strict';
import { random, shuffled, deranged, makeMaze, neighbors, route, pour, sortedTubes, tubeSolution, TOGETHER_TUBES, TUBE_LEVELS, clockHands, formatClock } from '../src/rules.ts';
import { clockLesson, guideForLevel, MEMORY_COUNTS, WIRE_COUNTS, SHADOW_OPTIONS, CIPHER_WORDS, GUIDES } from '../src/learning.ts';
import {searchLesson,SEARCH_COUNTS,paintLesson,riddleLesson,riddleChoices,RIDDLES} from '../src/expansion.ts';
import {readSchulteCompleted,SCHULTE_LEVELS} from '../src/standalone-progress.ts';
import {TOTAL_LEVELS as ORIGINAL_SCHULTE_LEVELS,LEVELS as SCHULTE_RULES,buildPuzzle as buildSchultePuzzle} from '../vendor/schulte/src/config.js';
import {selectMode,complete,isLevelUnlocked,finishedCount} from '../src/save.ts';
import { canOpenLevel,firstPendingLevel } from '../src/progression.ts';
import { shadowLesson,SHADOW_ROUNDS,SHADOW_TEXTURES,buildProofreadingLesson,proofreadingLesson } from '../src/challenges.ts';
import { GAMES,GAME_GROUPS,gameById } from '../src/catalog.ts';
import { normalizeVoiceText,recordingForText } from '../src/voice-text.ts';
import { existsSync,readFileSync } from 'node:fs';

test('all eight colour puzzles have legal complete solutions and conserve their liquids',()=>{
  TUBE_LEVELS.forEach((initial,index)=>{
    const snapshot=JSON.stringify(initial),solution=tubeSolution(initial);
    assert.ok(solution,'Level '+(index+1)+' is solvable');
    let state=initial.map(t=>[...t]);
    for(const [from,to] of solution){
      const next=pour(state,from,to);assert.ok(next);
      assert.deepEqual(next.flat().sort(),state.flat().sort());
      assert.ok(next.every(t=>t.length<=4));state=next;
    }
    assert.ok(sortedTubes(state));assert.equal(JSON.stringify(initial),snapshot);
  });
});
test('illegal pours leave the model untouched',()=>{
  const state=[[0,0,1,1],[0,0,0,0],[2,2],[]];
  assert.equal(pour(state,0,0),null);assert.equal(pour(state,0,1),null);
  assert.equal(pour(state,0,2),null);assert.equal(pour(state,3,0),null);
  assert.deepEqual(state,[[0,0,1,1],[0,0,0,0],[2,2],[]]);
  assert.deepEqual(pour(state,0,3),[[0,0],[0,0,0,0],[2,2],[1,1]]);
});
test('every maze variant has connected walkable cells and an adjacent route to the exit',()=>{
  for(let level=0;level<8;level++)for(let variant=0;variant<25;variant++){
    const maze=makeMaze(level,variant),path=route(maze);
    assert.equal(path[0],maze.start);assert.equal(path.at(-1),maze.end);
    for(let i=1;i<path.length;i++)assert.ok(neighbors(maze,path[i-1]).includes(path[i]));
    for(let i=0;i<maze.cells.length;i++)if(maze.cells[i])assert.ok(route(maze,maze.start,i).length);
  }
});
test('seeded shuffle is reproducible and derangement preserves each item without fixed positions',()=>{
  const input=['a','b','c','d','e','f'];
  assert.deepEqual(shuffled(input,random(31)),shuffled(input,random(31)));
  for(let seed=0;seed<20;seed++){
    const output=deranged(input,random(seed));assert.deepEqual([...output].sort(),input);
    output.forEach((v,i)=>assert.notEqual(v,input[i]));
  }
});
test('clock hands correctly represent whole hours, half hours and afternoon times',()=>{
  assert.equal(formatClock(810),'13:30');assert.equal(formatClock(540),'09:00');
  assert.deepEqual(clockHands(780),clockHands(60));
  assert.ok(Math.abs(clockHands(750).minute-Math.PI/2)<.00001);
  assert.ok(Math.abs(clockHands(750).hour-(-Math.PI/2+Math.PI/12))<.00001);
});
test('clock lessons introduce one new demand at a time and never use identical clock faces',()=>{
  let previous=clockLesson(0);
  for(let level=0;level<8;level++){
    const lesson=clockLesson(level);
    assert.equal(lesson.times.length,lesson.count);
    assert.equal(new Set(lesson.times.map(time=>time%720)).size,lesson.count);
    assert.equal(lesson.times.some(time=>time%60===30),lesson.halfHours);
    assert.ok(lesson.times.every(time=>lesson.afternoon?time>=780:time<=720));
    if(level>0){
      const changes=Number(lesson.count!==previous.count)+Number(lesson.afternoon!==previous.afternoon)+Number(lesson.halfHours!==previous.halfHours);
      assert.ok(changes<=1,'Only one new demand at level '+(level+1));
      assert.ok(lesson.count>=previous.count&&lesson.count-previous.count<=1);
    }
    previous=lesson;
  }
});
test('memory, silhouette and tracing lessons begin small and grow gradually',()=>{
  for(const counts of [MEMORY_COUNTS,WIRE_COUNTS,SHADOW_OPTIONS]){
    assert.equal(counts.length,8);
    for(let i=1;i<counts.length;i++)assert.ok(counts[i]>=counts[i-1]&&counts[i]-counts[i-1]<=1);
  }
  assert.equal(MEMORY_COUNTS[0],2);assert.equal(WIRE_COUNTS[0],1);assert.equal(SHADOW_OPTIONS[0],3);
  for(let i=1;i<CIPHER_WORDS.length;i++)assert.ok(CIPHER_WORDS[i].length>=CIPHER_WORDS[i-1].length);
});
test('every collection scene has three concrete instructions and guidance for all eight lessons',()=>{
  assert.equal(Object.keys(GUIDES).length,14);
  for(const guide of Object.values(GUIDES)){
    assert.equal(guide.steps.length,3);assert.equal(guide.stages.length,8);
    assert.ok([...guide.steps,...guide.stages].every(text=>text.trim().length>8));
  }
});
test('original Schulte configuration includes 30 valid puzzles with unique reachable targets',()=>{
  assert.equal(SCHULTE_LEVELS,ORIGINAL_SCHULTE_LEVELS);
  for(const rule of SCHULTE_RULES){
    const puzzle=buildSchultePuzzle(rule),ids=new Set(puzzle.cells.map((cell:{id:number})=>cell.id));
    assert.equal(ids.size,rule.size*rule.size);
    assert.equal(new Set(puzzle.targets).size,puzzle.targets.length);
    assert.ok(puzzle.targets.length>0&&puzzle.targets.every((id:number)=>ids.has(id)));
  }
});
test('collection reads completed Schulte levels without rewriting the original save',()=>{
  const raw=JSON.stringify({levels:{1:{stars:3,bestTime:12},2:{stars:1},3:{stars:0},30:{stars:2},31:{stars:3},4:{stars:'3'}},daily:{'2026-11-09':{stars:3}},runs:[{level:1}],hideTimer:true,sound:false});
  const before=raw;assert.deepEqual(readSchulteCompleted(raw),[0,1,29]);assert.equal(raw,before);
  for(const bad of [null,'invalid','null','{}','{"levels":[]}'])assert.deepEqual(readSchulteCompleted(bad),[]);
});
test('search scenes contain every requested item exactly once and enough distractors',()=>{
  for(let level=0;level<8;level++){
    const lesson=searchLesson(level);assert.equal(lesson.targets.length,SEARCH_COUNTS[level]);
    assert.equal(new Set(lesson.visible).size,lesson.visible.length);
    assert.equal(new Set(lesson.targets).size,lesson.targets.length);
    assert.ok(lesson.targets.every(key=>lesson.visible.includes(key)));
    assert.ok(lesson.visible.length>lesson.targets.length);
  }
});
test('colouring problems respect taught operations, bounds and an unambiguous number-to-colour palette',()=>{
  for(let level=0;level<8;level++){
    const lesson=paintLesson(level);
    assert.equal(new Set(lesson.problems.map(p=>p.answer)).size,lesson.count);
    for(const p of lesson.problems){
      assert.equal(p.answer,p.operation==='+'?p.a+p.b:p.a-p.b);
      assert.ok(p.answer>=0&&p.answer<=lesson.max&&p.a<=lesson.max&&p.b<=lesson.max);
      assert.ok(p.a>0&&p.b>0);
      if(level<2)assert.equal(p.operation,'+');
    }
  }
});
test('wheel lessons cover all 24 riddles once, with unique answer choices and no repeated sectors',()=>{
  const seen:string[]=[];
  for(let level=0;level<8;level++){
    const lesson=riddleLesson(level);
    assert.equal(new Set(lesson.order).size,lesson.riddles.length);
    lesson.riddles.forEach((r,i)=>{
      seen.push(r.id);const choices=riddleChoices(r.answer,level,i,lesson.choiceCount);
      assert.equal(choices.length,lesson.choiceCount);assert.equal(new Set(choices).size,choices.length);
      assert.equal(choices.filter(key=>key===r.answer).length,1);assert.ok(r.text.length>25&&r.hint.length>10);
    });
  }
  assert.equal(seen.length,24);assert.equal(new Set(seen).size,RIDDLES.length);
});
test('clock instructions introduce afternoon time and half hours only when needed',()=>{
  assert.ok(!guideForLevel('alarms',0).join(' ').includes('полу'));
  assert.ok(guideForLevel('alarms',3).join(' ').includes('13:00'));
  assert.ok(!guideForLevel('alarms',3).join(' ').includes('получас'));
  assert.ok(guideForLevel('alarms',4).join(' ').includes('получас'));
});

test('levels open sequentially, retain old completed levels, and reject invalid or skipped selections',()=>{
  const done:number[]=[];
  for(let next=0;next<8;next++){
    assert.equal(firstPendingLevel(done,8),next);
    for(let n=0;n<8;n++)assert.equal(canOpenLevel(done,n,8),n<=next);
    done.push(next);
  }
  assert.ok(done.every(n=>canOpenLevel(done,n,8)));
  for(const invalid of [-1,8,1.5,NaN,Infinity])assert.equal(canOpenLevel([],invalid,8),false);
  assert.equal(canOpenLevel([0,3],3,8),true);
  assert.equal(canOpenLevel([0,3],1,8),true);
  assert.equal(canOpenLevel([0,3],4,8),false);
});

test('catalog groups include every game once and keep Schulte in attention',()=>{
  const grouped=GAME_GROUPS.flatMap(g=>g.games);
  assert.deepEqual([...grouped].sort(),GAMES.map(g=>g.id).sort());
  assert.equal(new Set(grouped).size,GAMES.length);
  assert.ok(GAME_GROUPS.find(g=>g.id==='attention')?.games.includes('schulte'));
});

test('shadow sessions require multiple comparisons and always have one exact match among distinct options',()=>{
  let total=0;
  for(let level=0;level<8;level++){
    total+=SHADOW_ROUNDS[level];
    for(let part=0;part<SHADOW_ROUNDS[level];part++){
      const q=shadowLesson(level,part);
      assert.equal(q.options.filter(key=>key===q.answer).length,1);
      assert.equal(new Set(q.options).size,q.options.length);
      assert.ok(q.options.length>=3&&q.options.length<=4);
      if(q.family)assert.ok(q.options.every(key=>key.startsWith('shadow-'+q.family+'-')));
      assert.ok(Math.abs(q.rotation)<=22);
      for(const key of q.options)assert.ok(existsSync(new URL('../public/props/'+key+'.svg',import.meta.url)));
    }
  }
  assert.equal(total,24);
  const assets=SHADOW_TEXTURES.map(key=>readFileSync(new URL('../public/props/'+key+'.svg',import.meta.url),'utf8'));
  assert.equal(new Set(assets).size,SHADOW_TEXTURES.length);
});

test('proofreading supports new word packs with valid targets, real errors and no repeated distractor in a field',()=>{
  for(const word of ['СТОП','МОСТ','ШКОЛА','МОЛОКО'])for(const count of [4,6,9]){
    const lesson=buildProofreadingLesson(word,count,714);
    const wrong=lesson.words.filter(text=>text!==word);
    assert.equal(lesson.words.length,count);assert.ok(wrong.length>0&&wrong.length<count);
    assert.equal(new Set(wrong).size,wrong.length);
    assert.ok(wrong.every(text=>text!==word&&text.length<=word.length));
  }
  for(let n=0;n<8;n++)assert.ok(guideForLevel('proofreading',n)[0].includes(proofreadingLesson(n).target));
  for(const bad of ['','ABCD','СТОП!','АБ'])assert.throws(()=>buildProofreadingLesson(bad,4,1));
});

test('recorded voices match exact current text and do not play a stale recording after an edit',()=>{
  const text='Рассмотри форму тени.';
  assert.equal(normalizeVoiceText('  Рассмотри\nформу тени.  '),text);
  assert.equal(recordingForText('Рассмотри  форму тени.',{[text]:'guide.mp3'}),'guide.mp3');
  assert.equal(recordingForText('Рассмотри другую тень.',{[text]:'guide.mp3'}),undefined);
});

test('voice handoff contains unique portable filenames and covers every current story, guide and riddle',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../assets/voice/script.json',import.meta.url),'utf8'));
  const lines=manifest.lines as {filename:string;text:string}[];
  assert.equal(new Set(lines.map(l=>l.filename)).size,lines.length);
  assert.equal(new Set(lines.map(l=>l.text)).size,lines.length);
  assert.ok(lines.every(l=>/^[a-z0-9-]+\.mp3$/.test(l.filename)));
  const texts=new Set(lines.map(l=>normalizeVoiceText(l.text)));
  for(const game of GAMES){
    if(game.id==='schulte')continue;
    assert.ok(texts.has(game.story));
    for(let n=0;n<game.levels;n++)assert.ok(texts.has(guideForLevel(game.id,n).join(' ')));
  }
  for(const riddle of RIDDLES)assert.ok(texts.has(riddle.text));
});

test('both age routes cover all fourteen games and junior instructions match the playable round',()=>{
  const plans=JSON.parse(readFileSync(new URL('../assets/voice/script.json',import.meta.url),'utf8'));
  const spoken=new Set(plans.lines.map((line:{text:string})=>line.text));
  for(const game of GAMES){
    const junior=gameById(game.id,'together')!;
    assert.equal(junior.levels,8);
    assert.equal(junior.standalone,undefined);
    assert.ok(spoken.has(junior.story));
    for(let n=0;n<8;n++)assert.ok(spoken.has(guideForLevel(game.id,n,'together').join(' ')));
  }
  assert.equal(gameById('schulte','solo')?.levels,30);
  for(const mode of ['solo','together'] as const){
    const words=new Set<string>();
    for(let n=0;n<8;n++){
      const lesson=proofreadingLesson(n,mode);
      words.add(lesson.target);
      assert.ok(lesson.words.includes(lesson.target)&&lesson.words.some(w=>w!==lesson.target));
      assert.ok(guideForLevel('proofreading',n,mode)[0].includes(lesson.target));
    }
    assert.equal(words.size,8);
  }
});
test('adult-assisted tasks are solvable with small sets and visual matching',()=>{
  TOGETHER_TUBES.forEach((tubes,i)=>{
    const solution=tubeSolution(tubes);
    assert.ok(solution?.length,'junior tubes '+i);
    assert.ok(sortedTubes(solution.reduce((state,[a,b])=>pour(state,a,b)!,tubes)));
    const maze=makeMaze(i,23,5);assert.ok(route(maze).length);
    assert.ok(maze.cells.filter(Boolean).length>=5);
    assert.ok(clockLesson(i,'together').times.every(n=>n%60===0&&n<=720));
    assert.ok(paintLesson(i,'together').problems.every(p=>p.answer===p.expression.length&&p.answer<=5));
    assert.ok(searchLesson(i,'together').targets.length<searchLesson(i).targets.length);
    assert.ok(riddleLesson(i,'together').choiceCount<riddleLesson(i).choiceCount);
    const shadow=shadowLesson(i,0,'together');
    assert.equal(shadow.rotation,0);assert.ok(shadow.options.includes(shadow.answer));
  });
});

test('switching ages keeps legacy, assisted and original Schulte progress independent',()=>{
  const old=JSON.stringify({version:1,sound:false,completed:{shadows:[0,3]}});
  const native=JSON.stringify({levels:{1:{stars:2},2:{stars:1}}});
  const store=new Map([['neurons-play-v1',old],['shulte.v3',native]]);
  const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
    getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v),
  }});
  try {
    selectMode('together');
    assert.equal(finishedCount('shadows'),0);assert.equal(finishedCount('schulte'),0);
    complete('shadows',1);assert.equal(finishedCount('shadows'),0);
    complete('shadows',0);complete('schulte',0);
    assert.equal(store.get('neurons-play-v1'),old);
    selectMode('solo');assert.equal(finishedCount('shadows'),2);assert.equal(finishedCount('schulte'),2);
    assert.ok(isLevelUnlocked('shadows',3));assert.equal(isLevelUnlocked('shadows',2),false);
    selectMode('together');assert.equal(finishedCount('shadows'),1);assert.equal(finishedCount('schulte'),1);
    assert.equal(store.get('shulte.v3'),native);
  } finally {
    selectMode('solo');
    if(original)Object.defineProperty(globalThis,'localStorage',original);
    else Reflect.deleteProperty(globalThis,'localStorage');
  }
});
