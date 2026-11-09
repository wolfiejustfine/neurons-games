import test from 'node:test';
import assert from 'node:assert/strict';
import { random, shuffled, deranged, makeMaze, neighbors, route, pour, sortedTubes, tubeSolution, TUBE_LEVELS, clockHands, formatClock } from '../src/rules.ts';
import { clockLesson, guideForLevel, MEMORY_COUNTS, WIRE_COUNTS, SHADOW_OPTIONS, CIPHER_WORDS, GUIDES } from '../src/learning.ts';
import {searchLesson,SEARCH_COUNTS,paintLesson,riddleLesson,riddleChoices,RIDDLES} from '../src/expansion.ts';
import {readSchulteCompleted,SCHULTE_LEVELS} from '../src/standalone-progress.ts';
import {TOTAL_LEVELS as ORIGINAL_SCHULTE_LEVELS,LEVELS as SCHULTE_RULES,buildPuzzle as buildSchultePuzzle} from '../vendor/schulte/src/config.js';

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
  assert.equal(MEMORY_COUNTS[0],2);assert.equal(WIRE_COUNTS[0],1);assert.equal(SHADOW_OPTIONS[0],2);
  for(let i=1;i<CIPHER_WORDS.length;i++)assert.ok(CIPHER_WORDS[i].length>=CIPHER_WORDS[i-1].length);
});
test('every collection scene has three concrete instructions and guidance for all eight lessons',()=>{
  assert.equal(Object.keys(GUIDES).length,13);
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
