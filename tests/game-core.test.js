import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CHAPTERS,CLOAKS} from '../quest-content.js';
import {freshState,normalizeState,migrateLegacy,chapterProgress,parseAnswer,recordAnswer,completeObjective,finishChapter,purchaseCloak,makeQuestion,bankQuestion,validQuestion,OBJECTS,findPath,walkable,riverX} from '../game-core.js';

function random(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
test('legacy progress and purchased themes migrate without touching the original data',()=>{
  const legacy={coins:315,maxUnlockedLevel:4,theme:'gold',purchasedThemes:['default','gold'],activeSession:{level:4,currentIndex:7}};const original=JSON.stringify(legacy),state=migrateLegacy(legacy);
  assert.equal(state.coins,315);assert.equal(state.chapter,4);assert.equal(state.unlocked,4);assert.equal(state.cloak,'gold');assert.equal(Object.values(state.chapters).filter(v=>v.completed).length,3);assert.equal(JSON.stringify(legacy),original);
  assert.equal(chapterProgress(state).accepted,false);assert.equal(state.active,null);
});
test('save normalization rejects impossible progress and malformed active questions',()=>{
  const state=normalizeState({version:2,unlocked:99,chapter:55,coins:-20,cloak:'injected',ownedCloaks:['injected'],chapters:{1:{solved:[2],completed:true}},active:{chapter:9,object:'lock',questions:[{answer:'wrong'}]}});
  assert.equal(state.unlocked,9);assert.equal(state.chapter,9);assert.equal(state.coins,0);assert.equal(state.cloak,'sage');assert.deepEqual(state.chapters[1].solved,[]);assert.equal(state.chapters[1].completed,false);assert.equal(state.active,null);
});
test('answered checkpoints survive reload and preserve assistance and completion state',()=>{
  const state=freshState();state.active={chapter:1,object:'lock',questions:[makeQuestion('place',1)],index:0,attempts:2,hinted:true,answered:true,results:[false]};
  const restored=normalizeState(JSON.parse(JSON.stringify(state)));assert.equal(restored.active.answered,true);assert.equal(restored.active.attempts,2);assert.equal(restored.active.hinted,true);assert.deepEqual(restored.active.results,[false]);
});
test('numeric entry rejects empty and partial strings, and accepts grouping separators',()=>{
  for(const value of ['', '  ', '12abc','1e2','NaN','-2','3.2.1'])assert.equal(parseAnswer(value),null);
  assert.equal(parseAnswer('1,234'),1234);assert.equal(parseAnswer(' 42 '),42);assert.equal(parseAnswer('0'),0);assert.equal(parseAnswer('\u200e125\u200f'),125);
});
test('learning statistics distinguish independent answers from guided retries',()=>{
  const state=freshState(),q=makeQuestion('groups',1,0,random(12));assert.equal(recordAnswer(state,q,q.answer+1,false),false);assert.equal(recordAnswer(state,q,q.answer,true),true);recordAnswer(state,q,q.answer,false);
  assert.deepEqual(state.skills.groups,{attempts:3,correct:2,independent:1});
});
test('objectives must be accepted and completed in order; rewards cannot be claimed twice',()=>{
  const state=freshState();assert.equal(completeObjective(state,'lock').coins,0);state.chapters[1]={accepted:true,solved:[],chest:false,completed:false};
  assert.equal(completeObjective(state,'bridge').coins,0);assert.equal(completeObjective(state,'lock').coins,25);assert.equal(completeObjective(state,'lock').coins,0);assert.equal(state.coins,25);
  completeObjective(state,'bridge');completeObjective(state,'shrine');assert.deepEqual(state.chapters[1].solved,[0,1,2]);assert.equal(state.coins,75);
});
test('chapters unlock only when restored and both treasure and chapter rewards are idempotent',()=>{
  const state=freshState();assert.equal(finishChapter(state),false);assert.equal(completeObjective(state,'chest').coins,35);assert.equal(completeObjective(state,'chest').coins,0);
  state.chapters[1].accepted=true;for(const id of ['lock','bridge','shrine'])completeObjective(state,id);assert.equal(finishChapter(state),true);assert.equal(state.unlocked,2);assert.equal(state.coins,170);assert.equal(finishChapter(state),false);assert.equal(state.coins,170);
});
test('the final chapter ends the tour without creating a tenth chapter',()=>{
  const state=freshState();state.chapter=9;state.unlocked=9;state.chapters[9]={accepted:true,solved:[0,1,2],chest:false,completed:false};assert.equal(finishChapter(state),true);assert.equal(state.unlocked,9);
});
test('costumes cannot overspend and equipping owned costumes is free',()=>{
  const state=freshState();assert.equal(purchaseCloak(state,CLOAKS[1]),false);assert.equal(state.coins,0);state.coins=125;assert.equal(purchaseCloak(state,CLOAKS[1]),true);assert.equal(state.coins,5);assert.equal(state.cloak,'violet');purchaseCloak(state,CLOAKS[0]);purchaseCloak(state,CLOAKS[1]);assert.equal(state.coins,5);assert.equal(state.ownedCloaks.length,2);
});
test('all nine original question banks remain loadable, sanitized and mathematically selectable',()=>{
  for(let i=1;i<=9;i++){const rows=JSON.parse(readFileSync(new URL('../topic'+i+'.json',import.meta.url),'utf8'));assert.equal(rows.length,100);rows.forEach((row,j)=>{const q=bankQuestion(row,i+'-'+j);assert.ok(validQuestion(q));assert.ok(q.options.includes(q.answer));assert.equal(new Set(q.options).size,q.options.length);assert.ok(!q.prompt.includes('<bdi'));});}
  assert.equal(bankQuestion({correct:'bad',options:[]},'bad'),null);
});
test('generated fraction, group, sequence and place-value puzzles have exact, nonnegative answers',()=>{
  const rng=random(98432);for(let chapter=1;chapter<=9;chapter++)for(let i=0;i<100;i++)for(const skill of ['place','sequence','groups','fraction','arithmetic','missing','geometry','story']){
    const q=makeQuestion(skill,chapter,i%3,rng,['easy','medium','hard'][i%3]);assert.ok(validQuestion(q));assert.ok(Number.isInteger(q.answer)&&q.answer>=0);
    if(q.visual?.type==='fraction'){const v=q.visual;assert.equal(q.answer*v.denominator,v.total*v.numerator);assert.ok(q.answer<v.total);}
    if(q.visual?.type==='groups')assert.equal(q.answer*q.visual.rows,q.visual.total);
    if(q.visual?.type==='place')assert.equal(q.visual.terms.reduce((a,b)=>a+b,0),q.answer);
    if(q.visual?.type==='sequence'){assert.equal(q.answer,q.visual.values[q.visual.gap]);const diffs=q.visual.values.slice(1).map((n,j)=>n-q.visual.values[j]);assert.equal(new Set(diffs).size,1);}
    if(q.visual?.type==='geometry')assert.equal(q.answer,q.visual.area?q.visual.w*q.visual.h:2*(q.visual.w+q.visual.h));
    if(skill==='story'){const [packs,each,used]=q.prompt.match(/\d+/g).map(Number);assert.equal(q.answer,packs*each-used);}
  }
});
test('every chapter defines three playable objectives and a unique collectible',()=>{
  assert.equal(CHAPTERS.length,9);assert.equal(new Set(CHAPTERS.map(c=>c.relic)).size,9);for(const ch of CHAPTERS){assert.equal(ch.tasks.length,3);assert.equal(ch.types.length,3);assert.equal(ch.objects.length,3);}
});
test('the broken bridge blocks crossing while early quest locations remain reachable',()=>{
  const start={x:236,y:508};for(const id of ['guide','lock','bridge','chest']){const target=OBJECTS.find(o=>o.id===id).approach,path=findPath(start,target,false);assert.ok(path.length>0,id);assert.ok(Math.hypot(path.at(-1).x-target.x,path.at(-1).y-target.y)<24,id);assert.ok(path.every(p=>walkable(p.x,p.y,false)));}
  const target=OBJECTS.find(o=>o.id==='shrine').approach,blocked=findPath(start,target,false);assert.ok(Math.hypot(blocked.at(-1).x-target.x,blocked.at(-1).y-target.y)>100);assert.ok(blocked.every(p=>p.x<riverX(p.y)));
});
test('restoring the bridge makes the shrine and final portal reachable',()=>{
  for(const id of ['shrine','portal']){const target=OBJECTS.find(o=>o.id===id).approach,path=findPath({x:236,y:508},target,true);assert.ok(path.length>0);assert.ok(Math.hypot(path.at(-1).x-target.x,path.at(-1).y-target.y)<24,id);assert.ok(path.every(p=>walkable(p.x,p.y,true)));}
});
