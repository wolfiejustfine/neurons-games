import assert from 'node:assert/strict';
export const inspect=page=>page.evaluate(()=>window.__neurons.inspect());
export async function point(page,id){
  const state=await inspect(page),control=state.controls.find(c=>c.id===id);
  assert.ok(control,'Control missing: '+id+' in '+state.game);
  const box=await page.locator('#stage canvas').boundingBox();
  return {x:box.x+control.x*box.width/state.width,y:box.y+control.y*box.height/state.height};
}
export async function tap(page,id){
  const p=await point(page,id);await page.touchscreen.tap(p.x,p.y);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.waitForTimeout(25);
  if(id==='memorized')await page.waitForTimeout(120);
}
export async function drag(page,source,destination){
  const a=await point(page,source),b=await point(page,destination);
  await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:15});await page.mouse.up();
}
export async function open(page,id){
  await page.goto('http://127.0.0.1:5173/');
  await page.locator('[data-game="'+id+'"]').tap();
  await page.locator('#intro-start').tap();
  await page.waitForFunction(expected=>window.__neurons?.inspect()?.game===expected&&window.__neurons.inspect().controls?.length>0,id);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.waitForTimeout(120);
}
export async function waitResult(page){
  await page.locator('#next-round').waitFor({state:'visible',timeout:8000});
}
export async function next(page){
  const previous=await inspect(page);await page.locator('#next-round').tap();
  await page.waitForFunction(old=>window.__neurons?.inspect()?.level===old+1,previous.level);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.waitForTimeout(120);
}
export async function solve(page,id){
  let state=(await inspect(page)).round;
  if(id==='shadows'){await tap(page,'choice-'+state.answer);}
  else if(id==='anagrams'){
    for(let i=0;i<state.word.length;i++){
      state=(await inspect(page)).round;
      const source=state.letters.findIndex((letter,j)=>letter===state.word[i]&&!state.slots.includes(j));
      await tap(page,'letter-'+source);await tap(page,'slot-'+i);
    }
  }else if(id==='ciphers'){
    for(let i=0;i<state.word.length;i++){await tap(page,'key-'+state.word[i]);await tap(page,'code-'+i);}
  }else if(id==='proofreading'){
    for(let i=0;i<state.words.length;i++){
      await tap(page,state.words[i]==='СТОП'?'tool-good':'tool-bad');await tap(page,'sign-'+i);
    }
  }else if(id==='alarms'){
    for(let i=0;i<state.times.length;i++){await tap(page,'clock-'+state.times[i]);await tap(page,'meeting-'+i);}
  }else if(id==='rearrangement'){
    if(state.preview)await tap(page,'memorized');
    for(let i=0;i<state.order.length;i++){await tap(page,'item-'+state.order[i]);await tap(page,'shelf-'+i);}
  }else if(id==='color-sort'){
    const solution=state.solution;assert.ok(solution?.length);
    for(const [from,to] of solution){await tap(page,'tube-'+from);await tap(page,'tube-'+to);}
  }else if(id==='maze-codes'){
    for(let attempt=0;attempt<5;attempt++){
      const s=await inspect(page),r=s.round;if(r.solved)break;
      for(const at of r.solution.slice(1))await tap(page,'cell-'+at);
      if((await inspect(page)).round.busy&&!(await inspect(page)).round.solved)await tap(page,'next-letter');
      await page.waitForFunction(part=>{const r=window.__neurons.inspect().round;return r.part>part||r.solved;},r.part);
    }
  }else if(id==='maze-sort'){
    for(let steps=0;steps<20;steps++){
      const s=(await inspect(page)).round;if(s.solved)break;
      const target=s.carried!==null?s.baskets[s.items[s.carried].kind]:s.items.find(i=>!i.picked&&!i.done).at;
      const queue=[s.position],previous=new Map([[s.position,-1]]);
      for(let i=0;i<queue.length;i++){
        const at=queue[i],x=at%s.maze.width,y=Math.floor(at/s.maze.width);
        if(at===target)break;
        for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){
          const n=ny*s.maze.width+nx;
          if(nx>=0&&nx<s.maze.width&&ny>=0&&ny<s.maze.height&&s.maze.cells[n]&&!previous.has(n)){previous.set(n,at);queue.push(n);}
        }
      }
      const path=[];for(let at=target;at!==-1;at=previous.get(at))path.push(at);
      for(const at of path.reverse().slice(1))await tap(page,'cell-'+at);
    }
  }else if(id==='hidden-objects'){
    for(const key of state.targets.filter(key=>!state.found.includes(key)))await tap(page,'object-'+key);
  }else if(id==='math-coloring'){
    for(let i=0;i<state.problems.length;i++){
      if(state.done[i])continue;
      await tap(page,'region-'+i);await page.locator('#number-value').waitFor({state:'visible'});
      for(const digit of String(state.problems[i].answer))await page.locator('[data-number="'+digit+'"]').tap();
      await page.locator('[data-number="✓"]').tap();await page.locator('#modal').waitFor({state:'hidden'});
      await page.waitForTimeout(80);
    }
  }else if(id==='riddle-wheel'){
    for(let i=0;i<state.riddles.length;i++){
      await tap(page,'spin');await page.waitForFunction(()=>{const r=window.__neurons.inspect().round;return !r.spinning&&r.active!==null;});
      await page.waitForTimeout(100);
      const r=(await inspect(page)).round;await tap(page,'answer-'+r.riddles[r.active].answer);
    }
  }else if(id==='tangles'){
    for(let wire=0;wire<state.count;wire++){
      const s=await inspect(page),r=s.round,box=await page.locator('#stage canvas').boundingBox(),points=r.paths[r.active];
      const pos=p=>({x:box.x+p.x*box.width/s.width,y:box.y+p.y*box.height/s.height});
      const a=pos(points[0]);await page.mouse.move(a.x,a.y);await page.mouse.down();
      for(const p of points.filter((_,i)=>i%3===0||i===100)){const b=pos(p);await page.mouse.move(b.x,b.y);}
      await page.mouse.up();
      await page.waitForFunction(active=>{const r=window.__neurons.inspect().round;return r.active>active||r.solved;},r.active,{timeout:5000});
    }
  }
  await waitResult(page);
}
