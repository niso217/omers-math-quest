import {CHAPTERS,CLOAKS,SKILL_NAMES} from './quest-content.js';
import {STORAGE_KEY,LEGACY_KEY,OBJECTS,TASK_OBJECTS,freshState,normalizeState,migrateLegacy,chapterProgress,recordAnswer,completeObjective,finishChapter,purchaseCloak,makeQuestion,bankQuestion,parseAnswer} from './game-core.js';
import {QuestWorld,drawHero,drawCompanion} from './world.js';
import {QuestAudio} from './sound.js';

const $=id=>document.getElementById(id);
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PATHS={
  compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5z"/>',
  scroll:'<path d="M6 4h12v15l-3-2-3 2-3-2-3 2zM9 8h6M9 11h6"/>',
  footprints:'<ellipse cx="8" cy="8" rx="3" ry="5" transform="rotate(-20 8 8)"/><ellipse cx="16" cy="15" rx="3" ry="5" transform="rotate(20 16 15)"/>',
  bag:'<path d="M8 7V5a4 4 0 0 1 8 0v2M7 7h10a3 3 0 0 1 3 3v10H4V10a3 3 0 0 1 3-3ZM8 12h8v5H8z"/>',
  shop:'<path d="m4 3-2 6h20l-2-6ZM4 10v11h16V10M9 21v-7h6v7M2 9c0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="m9 3 1-1h4l1 3 3 1 3 3-2 3 1 3-3 3-3-1-3 3-3-2-1-3-3-1V9l3-1z"/>',
  mouse:'<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 2v6"/>',
  arrow:'<path d="M19 12H5m6-6-6 6 6 6"/>',
  'sound-off':'<path d="M11 4 6 8H3v8h3l5 4zM16 9l5 6m0-6-5 6"/>',
  sound:'<path d="M11 4 6 8H3v8h3l5 4zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  hint:'<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0l-1 2H9z"/>',
  check:'<path d="m5 12 4 4L19 6"/>'
};
function icon(name){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(PATHS[name]||PATHS.compass)+'</svg>';}
function icons(){document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
let storageAvailable=true,recoveryNotice=false;
function loadState(){
  try{
    const saved=localStorage.getItem(STORAGE_KEY);
    if(saved){try{return normalizeState(JSON.parse(saved));}catch{localStorage.setItem(STORAGE_KEY+'.recovery',saved);recoveryNotice=true;}}
    const old=localStorage.getItem(LEGACY_KEY);if(old){try{return migrateLegacy(JSON.parse(old));}catch{return freshState();}}
  }catch{storageAvailable=false;}return freshState();
}
let state=loadState(),config={playerName:'עומר',difficulty:'medium',gameTitle:'המסע של עומר'},world=null,currentDialog='',loadingToken=0,toastTimer=null,inputValue='',digits=[],crystals=new Set(),groupCount=0;
const audio=new QuestAudio(),banks=new Map(),dialog=$('game-dialog');
const chapter=()=>CHAPTERS[state.chapter-1];
const progress=()=>chapterProgress(state);
function save(){
  if(storageAvailable){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{storageAvailable=false;}}
  $('save-status').innerHTML=storageAvailable?'<span class="save-dot"></span> המסע נשמר אוטומטית':'המסע נשמר בזיכרון זמני בלבד';
}
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4000);}
function drawPortrait(id,type='fox'){const canvas=$(id);if(!canvas)return;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);drawCompanion(ctx,canvas.width/2,canvas.height*.78,type,canvas.width/57);}
function activeObject(){const p=progress();return !p.accepted?'guide':p.solved.length<3?TASK_OBJECTS[p.solved.length]:'portal';}
function render(){
  const ch=chapter(),p=progress(),collected=Object.values(state.chapters).filter(c=>c.completed).length;
  $('coin-display').textContent=state.coins.toLocaleString('he-IL');$('brand-name').textContent='המסע של '+config.playerName;$('welcome-title').textContent='העולם מחכה לך, '+config.playerName+'.';
  $('rank-name').textContent=state.xp>=900?'שומרת המנגינה':state.xp>=400?'מגינת הממלכה':state.xp>=100?'חברת היער':'מגלת שבילים';
  $('chapter-name').textContent=ch.name;$('chapter-description').textContent=ch.subtitle;$('quest-count').textContent=p.solved.length+' / 3';
  $('guide-name').textContent=ch.guide+(ch.creature==='fox'?' השועל':' הינשוף');$('guide-message').textContent=!p.accepted?'יש לי סוד לספר לך. בואי נפגש ליד השביל!':p.solved.length<3?'אני איתך! התחנה הבאה: '+ch.objects[p.solved.length]+'.':'המנגינה מתעוררת! התו שלך מחכה ליד השער.';
  drawPortrait('guide-portrait',ch.creature);
  $('quest-checklist').innerHTML=ch.tasks.map((task,i)=>'<li class="'+(p.solved.includes(i)?'done':p.accepted&&p.solved.length===i?'current':'')+'"><span class="quest-step-icon">'+(p.solved.includes(i)?'✓':i+1)+'</span><span>'+escapeHTML(task)+'</span></li>').join('');
  $('quest-go-label').textContent=state.active?'להמשיך את החידה':!p.accepted?'לפגוש את '+ch.guide:p.solved.length<3?'אל '+ch.objects[p.solved.length]:p.completed?'אל השער הבא':'לאסוף את '+ch.relic;
  $('relic-name').textContent=ch.relic;$('world-chapter').textContent='פרק '+String(ch.id).padStart(2,'0')+' / 09';$('world-name').textContent=ch.name;$('world-region').textContent=ch.region;
  $('world-context-text').textContent=!p.accepted?ch.guide+' מחכה לך ליד השביל':p.solved.length<3?ch.tasks[p.solved.length]:p.completed?'הדרך פתוחה. ההרפתקה ממשיכה.':'כל החידות נפתרו. התו מחכה ליד השער!';
  $('relic-track').innerHTML=CHAPTERS.map(c=>'<span class="relic-mini '+(state.chapters[c.id]?.completed?'collected':'')+'" title="'+escapeHTML(c.relic)+'" aria-label="'+escapeHTML(c.relic)+(state.chapters[c.id]?.completed?' נאסף':' עדיין לא נאסף')+'">♪</span>').join('');
  $('journey-caption').textContent=collected?collected+' מתוך 9 תווים חזרו לממלכה.': 'כל תו שתחזירי יאיר חלק נוסף בעולם.';
  $('discovery-title').textContent=p.completed?'עוד חלק בעולם חזר לשיר.':state.chapter===1?'מישהו העלים את המוזיקה מהממלכה...':ch.subtitle;
  $('discovery-copy').textContent=p.completed?ch.outro:'תשעה תווים התפזרו ברחבי העולם. ורק הרפתקנית אחת יכולה לחבר אותם מחדש.';
  $('sound-button').innerHTML=icon(audio.enabled?'sound':'sound-off');$('sound-button').setAttribute('aria-pressed',String(audio.enabled));$('sound-button').setAttribute('aria-label',audio.enabled?'כיבוי צלילים':'הפעלת צלילים');
  world?.setScene(ch,p,CLOAKS.find(c=>c.id===state.cloak).color);icons();
}
function showDialog(html,kind){currentDialog=kind;$('dialog-content').innerHTML=html;world?.pause(true);if(!dialog.open)dialog.showModal();dialog.scrollTop=0;}
function closeDialog(){loadingToken++;world?.pause(false);dialog.close();}
dialog.addEventListener('close',()=>{currentDialog='';world?.pause(false);$('world').focus({preventScroll:true});});
dialog.addEventListener('cancel',()=>{loadingToken++;});
$('dialog-close').addEventListener('click',closeDialog);
dialog.addEventListener('click',event=>{if(event.target===dialog){const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)closeDialog();}});
function showStory(){
  showDialog('<div class="dialog-story"><div class="chapter-medallion">♪</div><div class="dialog-kicker">המסע של '+escapeHTML(config.playerName)+'</div><h2 class="dialog-title" id="dialog-title">המנגינה האבודה</h2><p class="dialog-description">פעם, כל פינה בממלכה ידעה לשיר. עד שצל השקט פיזר את תשעת תווי המנגינה בין יערות, אגמים וטירות. עכשיו החברים מחכים לך: ללכת, לגלות, לפתור — ולהחזיר לעולם את הקצב.</p><p class="dialog-description">לחצי על מקום בעולם כדי ללכת אליו. ליד דמות או חפץ, לחצי על כפתור הפעולה. אפשר גם ללכת ישר למשימה דרך יומן המסע.</p><div class="dialog-actions"><button type="button" class="primary-button" data-action="start-story">ההרפתקה מתחילה!</button></div></div>','story');
}
function showGuide(){
  const ch=chapter(),p=progress();const message=!p.accepted?ch.intro:p.solved.length===3?'כל המקומות שוב מוארים! עכשיו בואי אל השער ואספי את '+ch.relic+'.':'כבר התקדמנו! עכשיו צריך '+ch.tasks[p.solved.length]+'. תוכלי למצוא את המקום על השביל, או ללחוץ על המשימה ביומן.';
  showDialog('<div class="dialog-story"><canvas class="story-portrait" id="dialog-portrait" width="230" height="230" aria-hidden="true"></canvas><div class="dialog-kicker">חברה חדשה למסע</div><h2 class="dialog-title" id="dialog-title">'+escapeHTML(ch.guide)+' מחכה לך</h2><p class="dialog-description">'+escapeHTML(message)+'</p><div class="dialog-actions"><button type="button" class="primary-button" data-action="accept-quest">'+(!p.accepted?'אני מוכנה לעזור!':'ממשיכים במסע')+'</button></div></div>','guide');drawPortrait('dialog-portrait',ch.creature);
}
function interact(object){
  if(dialog.open)return;
  if(object==='guide'){showGuide();return;}
  const p=progress();
  if(object==='portal'){if(p.solved.length<3){toast('עוד '+(3-p.solved.length)+' מקומות צריכים את העזרה שלך לפני שהשער ייפתח.');return;}showChapterComplete();return;}
  if(object==='chest'){if(p.chest){toast('כבר מצאת את האוצר הזה. תיבות נוספות מחכות בפרקים הבאים!');return;}startChallenge('chest');return;}
  if(!p.accepted){toast('קודם נפגוש את '+chapter().guide+' ונגלה מה קרה כאן.');world.goTo('guide');return;}
  const index=TASK_OBJECTS.indexOf(object);
  if(p.solved.includes(index)){toast('כבר החזרת אור למקום הזה. ממשיכות אל התחנה הבאה!');return;}
  if(index!==p.solved.length){toast('הדרך תיפתח אחרי '+chapter().tasks[p.solved.length]+'.');return;}
  startChallenge(object);
}
async function getBank(id){
  if(banks.has(id))return banks.get(id);
  const promise=fetch('topic'+id+'.json',{signal:AbortSignal.timeout(5000)}).then(r=>{if(!r.ok)throw new Error('Question bank unavailable');return r.json();}).then(rows=>Array.isArray(rows)?rows.map((q,i)=>bankQuestion(q,id+'-'+i)).filter(Boolean):[]).catch(()=>[]);
  banks.set(id,promise);return promise;
}
function difficulty(skill){const stats=state.skills[skill];return config.difficulty==='easy'?'easy':config.difficulty==='hard'||stats&&stats.independent>=8&&stats.independent/Math.max(1,stats.correct)>.8?'hard':'medium';}
async function startChallenge(object,practiceSkill=null){
  if(state.active){showChallenge();return;}
  const token=++loadingToken;
  showDialog('<div class="dialog-kicker">רגע של גילוי</div><h2 class="dialog-title" id="dialog-title">מפענחות את הרמז...</h2><p class="dialog-description">החידה כבר בדרך.</p>','loading');
  const bank=await getBank(state.chapter);if(token!==loadingToken||!dialog.open)return;
  const skill=practiceSkill||chapter().types[Math.max(0,TASK_OBJECTS.indexOf(object))];
  let questions=[makeQuestion(skill,state.chapter,0,Math.random,difficulty(skill)),makeQuestion(skill,state.chapter,1,Math.random,difficulty(skill))];
  if(object==='chest')questions=bank.length?shuffle(bank).slice(0,2):questions;
  else if(object==='practice')questions=[0,1,2].map(i=>makeQuestion(skill,state.chapter,i,Math.random,difficulty(skill)));
  else questions.push(bank.length?bank[Math.floor(Math.random()*bank.length)]:makeQuestion(skill,state.chapter,2,Math.random,difficulty(skill)));
  state.active={chapter:state.chapter,object,questions,index:0,attempts:0,hinted:false,answered:false,results:[]};save();showChallenge();
}
function shuffle(values){const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
function showChallenge(){
  const a=state.active;if(!a)return;if(a.index>=a.questions.length){finishChallenge();return;}
  const q=a.questions[a.index],draft=a.draft||{};digits=Array.from({length:q.digits||3},(_,i)=>draft.digits?.[i]||0);crystals=new Set(draft.crystals||[]);groupCount=draft.groupCount||0;inputValue=draft.inputValue||'';
  const index=TASK_OBJECTS.indexOf(a.object),title=a.object==='chest'?'הסוד שבתיבה':a.object==='practice'?'קרחת התרגול':chapter().objects[index];
  let visual='';
  if(q.kind==='place')visual='<div class="dial-lock">'+digits.map((d,i)=>'<div class="number-dial"><button type="button" data-dial="'+i+'" data-delta="1" aria-label="להגדיל '+['יחידות','עשרות','מאות','אלפים'][digits.length-i-1]+'">+</button><output id="dial-'+i+'">0</output><button type="button" data-dial="'+i+'" data-delta="-1" aria-label="להקטין '+['יחידות','עשרות','מאות','אלפים'][digits.length-i-1]+'">−</button><small>'+['יחידות','עשרות','מאות','אלפים'][digits.length-i-1]+'</small></div>').join('')+'</div>';
  if(q.kind==='fraction')visual='<div class="crystal-grid">'+Array.from({length:q.visual.total},(_,i)=>'<button type="button" class="crystal" data-crystal="'+i+'" aria-pressed="false" aria-label="גביש '+(i+1)+'">◆</button>').join('')+'</div><p class="puzzle-selection" id="selection-count">0 מתוך '+q.visual.total+' גבישים מוארים</p>';
  if(q.kind==='sequence')visual='<div class="sequence-river" aria-label="סדרת אבני הגשר">'+q.visual.values.map((v,i)=>'<span class="stepping-stone '+(i===q.visual.gap?'missing':'')+'">'+(i===q.visual.gap?'?':v)+'</span>').join('')+'</div>';
  if(q.kind==='groups')visual='<div class="group-lanterns" id="group-lanterns">'+Array.from({length:q.visual.rows},()=>'<div class="lantern"></div>').join('')+'</div><div class="group-stepper"><button type="button" data-group="-1" aria-label="פחות גחלילית בכל פנס">−</button><output id="group-count">0</output><button type="button" data-group="1" aria-label="עוד גחלילית בכל פנס">+</button></div><p class="puzzle-selection" id="selection-count">0 גחליליות בכל פנס · 0 מתוך '+q.visual.total+' בסך הכול</p>';
  if(q.kind==='geometry')visual='<div class="geometry-wrapper"><span>'+q.visual.w+' מטרים</span><div class="geometry-grid" style="grid-template-columns:repeat('+q.visual.w+',1fr)">'+Array.from({length:q.visual.w*q.visual.h},()=>'<span class="geometry-cell"></span>').join('')+'</div><small>'+q.visual.h+' מטרים</small></div>';
  const direct=['place','fraction','groups'].includes(q.kind);
  const answer=q.kind==='choice'?'<div class="answer-options">'+shuffle(q.options).map(v=>'<button type="button" class="answer-choice" data-answer="'+v+'">'+v+'</button>').join('')+'</div>':'<form id="answer-form" class="answer-form">'+(!direct?'<label class="answer-label" for="answer-input">התשובה שלך</label>':'')+'<div class="answer-row">'+(!direct?'<input class="answer-input" id="answer-input" inputmode="numeric" autocomplete="off" aria-label="התשובה שלך" placeholder="?">':'')+'<button class="primary-button '+(direct?'full-width':'')+'" type="submit" id="check-answer">לבדוק את הפתרון '+icon('check')+'</button></div></form>';
  showDialog('<div class="dialog-kicker">'+(state.chapter===9?'מול צל השקט · ':'')+'חידה '+(a.index+1)+' מתוך '+a.questions.length+' · '+escapeHTML(SKILL_NAMES[q.skill])+'</div><h2 class="dialog-title" id="dialog-title">'+escapeHTML(title)+'</h2><div class="challenge-progress" aria-label="התקדמות בחידות">'+a.questions.map((_,i)=>'<span class="'+(i<a.index?'filled':i===a.index?'current':'')+'"></span>').join('')+'</div><p class="puzzle-prompt">'+escapeHTML(q.prompt)+'</p>'+(q.expression?'<div class="puzzle-expression">'+escapeHTML(q.expression)+'</div>':'')+visual+answer+'<div class="puzzle-footer"><button type="button" class="hint-button" data-action="hint">'+icon('hint')+' רמז מ'+escapeHTML(chapter().guide)+'</button><span class="eyebrow">אין לחץ. יש לך זמן לחשוב.</span></div><div class="hint-box" id="hint-box" hidden></div><div class="answer-feedback" id="answer-feedback" role="status" aria-live="polite" hidden></div>','challenge');
  if(a.hinted){$('hint-box').hidden=false;$('hint-box').textContent=q.hint;}
  if(q.kind==='place')digits.forEach((d,i)=>$('dial-'+i).textContent=d);
  if(q.kind==='fraction'){document.querySelectorAll('[data-crystal]').forEach(b=>b.setAttribute('aria-pressed',String(crystals.has(Number(b.dataset.crystal)))));$('selection-count').textContent=crystals.size+' מתוך '+q.visual.total+' גבישים מוארים';}
  if(q.kind==='groups'){$('group-count').textContent=groupCount;document.querySelectorAll('.lantern').forEach(l=>l.innerHTML='<span></span>'.repeat(groupCount));$('selection-count').textContent=groupCount+' גחליליות בכל פנס · '+groupCount*q.visual.rows+' מתוך '+q.visual.total+' בסך הכול';}
  if($('answer-input'))$('answer-input').value=inputValue;
  if(a.answered)showAnswerSuccess(q);
}
function saveDraft(){if(!state.active||state.active.answered)return;state.active.draft={digits:[...digits],crystals:[...crystals],groupCount,inputValue:$('answer-input')?.value??inputValue};save();}
function answerValue(){const q=state.active.questions[state.active.index];if(q.kind==='place')return Number(digits.join(''));if(q.kind==='fraction')return crystals.size;if(q.kind==='groups')return groupCount;return $('answer-input')?.value??inputValue;}
function submitAnswer(value,button=null){
  const a=state.active;if(!a||a.answered)return;const q=a.questions[a.index];
  if(parseAnswer(value)===null){feedback('כתבי מספר כדי שנוכל לבדוק יחד.',true);return;}
  const assisted=a.hinted||a.attempts>0;const correct=recordAnswer(state,q,value,assisted);
  if(correct){a.answered=true;a.results.push(!assisted);save();audio.success();showAnswerSuccess(q);}
  else{a.attempts++;if(button)button.classList.add('wrong-choice');save();feedback(q.kind==='fraction'?'האור עדיין לא התחבר. ספרי כמה גבישים יש בקבוצה אחת, ואז כמה קבוצות צריך.':q.kind==='groups'?'נבדוק יחד: '+groupCount+' בכל פנס נותן '+(groupCount*q.visual.rows)+' גחליליות. אנחנו צריכות '+q.visual.total+'.':'עוד לא בדיוק. נסי דרך אחרת, או בקשי רמז.',true);if(a.attempts>=2){a.hinted=true;$('hint-box').hidden=false;$('hint-box').textContent=q.hint+' '+(a.attempts>=3?q.explanation:'');save();}}
}
function feedback(message,wrong=false){const el=$('answer-feedback');el.hidden=false;el.className='answer-feedback'+(wrong?' wrong':'');el.textContent=message;}
function showAnswerSuccess(q){
  document.querySelectorAll('#dialog-content input,#dialog-content .answer-choice,#dialog-content [data-dial],#dialog-content [data-crystal],#dialog-content [data-group],#check-answer').forEach(el=>el.disabled=true);
  const a=state.active,last=a.index===a.questions.length-1;
  $('answer-feedback').hidden=false;$('answer-feedback').className='answer-feedback';$('answer-feedback').innerHTML='<strong>האור מתחבר! פתרת את זה.</strong><span class="explanation">'+escapeHTML(q.explanation)+'</span><button type="button" class="primary-button full-width" data-action="next-question">'+(last?'לגלות מה השתנה בעולם':'אל הרמז הבא')+' '+icon('arrow')+'</button>';
}
function finishChallenge(){
  const a=state.active;if(!a)return;const object=a.object,independent=a.results.filter(Boolean).length,count=a.questions.length,reward=completeObjective(state,object);state.active=null;save();render();audio.reward();
  const index=TASK_OBJECTS.indexOf(object),title=object==='chest'?'מצאת תיבת סודות!':object==='practice'?'עוד צעד של ביטחון':index===0?'החותם נפתח!':index===1?'הגשר חזר לחיים!':'המנגינה מתעוררת!';
  const description=object==='chest'?'בין העלים חיכתה מתנה קטנה להרפתקנית סקרנית. המטבעות כבר בתרמיל שלך.':object==='practice'?'סיימת '+count+' חידות. '+independent+' מהן נפתרו בלי רמז או ניסיון נוסף.':index===0?'השורשים זזו, והכתובת העתיקה התחילה לזהור. החברים מצאו רמז שמוביל אל הגשר.':index===1?'האבנים מצאו את מקומן. עכשיו אפשר לחצות את הנחל ולגלות מה מחכה בצד השני.':'שלושת המקומות שוב מוארים. השער העתיק התעורר — והתו שלך מחכה לידו.';
  showDialog('<div class="dialog-story"><div class="chapter-medallion">'+(object==='chest'?'✧':'✦')+'</div><div class="dialog-kicker">עוד משהו טוב קרה בזכותך</div><h2 class="dialog-title" id="dialog-title">'+title+'</h2><p class="dialog-description">'+description+'</p>'+(reward.coins?'<div class="rewards-row"><span class="reward-pill gold">+'+reward.coins+' מטבעות</span><span class="reward-pill">+'+reward.xp+' נקודות מסע</span></div>':'')+'<div class="dialog-actions"><button type="button" class="primary-button" data-action="back-world">בחזרה להרפתקה</button></div></div>','reward');
}
function showChapterComplete(){
  const ch=chapter();const newlyFinished=finishChapter(state);save();render();if(newlyFinished)audio.reward();
  const final=state.chapter===9;
  showDialog('<div class="dialog-story"><div class="chapter-medallion">♪</div><div class="dialog-kicker">'+(final?'הסיפור שלך הפך למנגינה':'תו חדש מצטרף למסע')+'</div><h2 class="dialog-title" id="dialog-title">'+(final?'הממלכה שוב שרה!':escapeHTML(ch.relic)+' שלך!')+'</h2><p class="dialog-description">'+escapeHTML(ch.outro)+'</p><div class="celebration-notes" aria-hidden="true">♪ ✧ ♫ ✧ ♪</div>'+(newlyFinished?'<div class="rewards-row"><span class="reward-pill gold">+60 מטבעות</span><span class="reward-pill">+50 נקודות מסע</span></div>':'')+'<div class="dialog-actions"><button type="button" class="primary-button" data-action="'+(final?'open-map':'next-chapter')+'">'+(final?'לבקר שוב בממלכה':'ממשיכות אל '+escapeHTML(CHAPTERS[state.chapter].name))+'</button><button type="button" class="secondary-button" data-action="back-world">להישאר ולחקור</button></div></div>','chapter-complete');
}
function changeChapter(id){
  if(id<1||id>state.unlocked)return;
  if(state.active&&id!==state.chapter){toast('החידה הפתוחה נשמרה. נסיים אותה לפני שנעבור לפרק אחר.');showChallenge();return;}
  state.chapter=id;state.position={x:236,y:508};save();render();world.setPosition(state.position);closeDialog();toast('ברוכה הבאה אל '+chapter().name);
}
function showMap(){
  showDialog('<div class="dialog-kicker">הממלכה מחכה לך</div><h2 class="dialog-title" id="dialog-title">מפת המסע</h2><p class="dialog-description">כל פרק מחזיר לעולם תו אחד. אפשר לחזור לכל מקום שכבר גילית.</p><div class="chapter-map">'+CHAPTERS.map(ch=>'<button type="button" class="chapter-map-button '+(state.chapter===ch.id?'current':'')+'" data-chapter="'+ch.id+'" '+(ch.id>state.unlocked?'disabled':'')+'><span>'+String(ch.id).padStart(2,'0')+'</span><span><strong>'+escapeHTML(ch.name)+'</strong><small>'+escapeHTML(ch.skill)+'</small></span><span class="map-status">'+(state.chapters[ch.id]?.completed?'♪ התו חזר':ch.id>state.unlocked?'טרם התגלה':state.chapter===ch.id?'את כאן':'פתוח')+'</span></button>').join('')+'</div>','map');
}
function showInventory(){
  showDialog('<div class="dialog-kicker">אוצרות מהדרך</div><h2 class="dialog-title" id="dialog-title">התרמיל שלי</h2><p class="dialog-description">כל תו כאן הוא סיפור קטן על מקום שעזרת לו לחזור לשיר.</p><div class="inventory-grid">'+CHAPTERS.map(ch=>'<div class="inventory-item '+(state.chapters[ch.id]?.completed?'unlocked':'')+'"><span>'+ (state.chapters[ch.id]?.completed?'♪':'·')+'</span><strong>'+escapeHTML(ch.relic)+'</strong><small>'+escapeHTML(ch.name)+'</small></div>').join('')+'</div><div class="dialog-actions"><button class="secondary-button" type="button" data-action="open-shop">לבחור גלימה למסע</button></div>','inventory');
}
function showShop(){
  showDialog('<div class="dialog-kicker">קצת צבע למסע שלך</div><h2 class="dialog-title" id="dialog-title">החנות של פיפה</h2><p class="dialog-description">יש לך '+state.coins+' מטבעות. איזו גלימה מתאימה להרפתקה הבאה?</p><div class="shop-grid">'+CLOAKS.map(item=>'<article class="shop-item"><canvas id="cloak-'+item.id+'" width="176" height="176" aria-hidden="true"></canvas><h3>'+escapeHTML(item.name)+'</h3><p>'+escapeHTML(item.description)+'</p><button type="button" class="'+(state.cloak===item.id?'secondary-button':'primary-button')+'" data-cloak="'+item.id+'" '+(state.cloak===item.id?'disabled':'')+'>'+(state.cloak===item.id?'לובשת עכשיו':state.ownedCloaks.includes(item.id)?'ללבוש':item.price+' מטבעות')+'</button></article>').join('')+'</div>','shop');
  for(const item of CLOAKS){const canvas=$('cloak-'+item.id);drawHero(canvas.getContext('2d'),88,148,{cloak:item.color,scale:2.2});}
}
function showParent(){
  const entries=Object.entries(state.skills),correct=entries.reduce((s,[,v])=>s+v.correct,0),independent=entries.reduce((s,[,v])=>s+v.independent,0),completed=Object.values(state.chapters).filter(c=>c.completed).length;
  showDialog('<div class="dialog-kicker">מבט קטן מאחורי ההרפתקה</div><h2 class="dialog-title" id="dialog-title">ההתקדמות של '+escapeHTML(config.playerName)+'</h2><div class="parent-stats"><div class="parent-stat"><strong>'+completed+'</strong><span>פרקים הושלמו</span></div><div class="parent-stat"><strong>'+correct+'</strong><span>חידות נפתרו</span></div><div class="parent-stat"><strong>'+independent+'</strong><span>ללא רמז או טעות</span></div></div><div style="margin-top:18px">'+(entries.length?entries.map(([skill,v])=>'<div class="skill-row"><span>'+escapeHTML(SKILL_NAMES[skill]||skill)+'</span><span>'+v.independent+' מתוך '+v.correct+' עצמאית</span></div>').join(''):'<p class="parent-note">התרגול הראשון עוד לפניה. כאן יופיעו הנושאים שפגשה במסע.</p>')+'</div><p class="parent-note">תשובה עצמאית היא תשובה נכונה בניסיון הראשון, ללא רמז. מטבעות ותווים מציגים התקדמות במשחק; הם אינם מדד לשליטה בחומר. ההתקדמות נשמרת בדפדפן הזה בלבד.</p><div class="practice-row">'+Object.entries(SKILL_NAMES).filter(([key])=>key!=='legacy').map(([key,label])=>'<button type="button" class="secondary-button" data-practice="'+key+'">'+escapeHTML(label)+'</button>').join('')+'</div><div class="dialog-actions"><button type="button" class="secondary-button" data-action="export-save">שמירת גיבוי של המסע</button></div>','parent');
}
function exportSave(){
  const blob=new Blob([JSON.stringify({game:'omers-math-quest',exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='omers-math-quest-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('קובץ הגיבוי מוכן.');
}
$('dialog-content').addEventListener('submit',event=>{if(event.target.id==='answer-form'){event.preventDefault();submitAnswer(answerValue());}});
$('dialog-content').addEventListener('input',event=>{if(event.target.id==='answer-input')saveDraft();});
$('dialog-content').addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||button.disabled)return;
  if(button.dataset.answer!==undefined){submitAnswer(button.dataset.answer,button);return;}
  if(button.dataset.dial!==undefined){const i=Number(button.dataset.dial);digits[i]=(digits[i]+Number(button.dataset.delta)+10)%10;$('dial-'+i).textContent=digits[i];saveDraft();return;}
  if(button.dataset.crystal!==undefined){const i=Number(button.dataset.crystal);crystals.has(i)?crystals.delete(i):crystals.add(i);button.setAttribute('aria-pressed',String(crystals.has(i)));$('selection-count').textContent=crystals.size+' מתוך '+state.active.questions[state.active.index].visual.total+' גבישים מוארים';saveDraft();return;}
  if(button.dataset.group!==undefined){groupCount=Math.max(0,Math.min(20,groupCount+Number(button.dataset.group)));const v=state.active.questions[state.active.index].visual;$('group-count').textContent=groupCount;document.querySelectorAll('.lantern').forEach(l=>l.innerHTML='<span></span>'.repeat(groupCount));$('selection-count').textContent=groupCount+' גחליליות בכל פנס · '+(groupCount*v.rows)+' מתוך '+v.total+' בסך הכול';saveDraft();return;}
  if(button.dataset.chapter){changeChapter(Number(button.dataset.chapter));return;}
  if(button.dataset.cloak){const item=CLOAKS.find(c=>c.id===button.dataset.cloak);if(!purchaseCloak(state,item)){toast('עוד '+(item.price-state.coins)+' מטבעות — ותוכלי לבחור את הגלימה הזאת.');return;}save();render();showShop();audio.success();return;}
  if(button.dataset.practice){startChallenge('practice',button.dataset.practice);return;}
  switch(button.dataset.action){
    case 'start-story':state.seenIntro=true;save();closeDialog();world.goTo('guide');break;
    case 'accept-quest':{const p=progress();p.accepted=true;state.chapters[state.chapter]=p;state.seenIntro=true;save();render();closeDialog();world.goTo(activeObject());break;}
    case 'hint':{const a=state.active;if(!a||a.answered)return;a.hinted=true;save();$('hint-box').hidden=false;$('hint-box').textContent=a.questions[a.index].hint;break;}
    case 'next-question':{const a=state.active;if(!a?.answered)return;a.index++;a.attempts=0;a.hinted=false;a.answered=false;delete a.draft;save();showChallenge();break;}
    case 'next-chapter':changeChapter(state.chapter+1);break;
    case 'back-world':closeDialog();break;
    case 'open-map':showMap();break;
    case 'open-shop':showShop();break;
    case 'export-save':exportSave();break;
  }
});
$('quest-go').addEventListener('click',()=>{if(state.active){showChallenge();return;}world.goTo(activeObject());$('world-frame').scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});
$('map-button').addEventListener('click',showMap);$('bag-button').addEventListener('click',showInventory);$('shop-button').addEventListener('click',showShop);$('parent-button').addEventListener('click',showParent);$('story-button').addEventListener('click',showStory);
$('interact-button').addEventListener('click',()=>{if(world.near)interact(world.near.id);});
$('sound-button').addEventListener('click',async()=>{if(audio.enabled){audio.disable();state.sound=false;}else{state.sound=await audio.enable();if(!state.sound)toast('לא הצלחנו להפעיל צלילים בדפדפן הזה. אפשר להמשיך לשחק.');}save();render();});
document.querySelectorAll('[data-direction]').forEach(button=>{
  button.addEventListener('pointerdown',event=>{if(world.paused)return;event.preventDefault();button.setPointerCapture(event.pointerId);world.path=[];world.target=null;world.keys.add(button.dataset.direction);});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>world.keys.delete(button.dataset.direction));
});
window.addEventListener('pagehide',()=>{if(world)state.position={...world.position};save();});
async function init(){
  try{const response=await fetch('config.json',{signal:AbortSignal.timeout(3000)});if(response.ok){const data=await response.json();config={...config,playerName:typeof data.playerName==='string'?data.playerName:config.playerName,difficulty:['easy','medium','hard'].includes(data.difficulty)?data.difficulty:config.difficulty,gameTitle:typeof data.gameTitle==='string'?data.gameTitle:config.gameTitle};}}catch{}
  document.title=config.gameTitle+' · המנגינה האבודה';
  world=new QuestWorld($('world'),$('world-pins'),{
    onInteract:interact,
    onPosition:position=>{state.position=position;save();},
    onNear:object=>{if(object?.blocked){toast('הגשר עוד לא מוכן. בואי נחזיר את אבני המעבר למקומן.');return;}$('interact-button').hidden=!object;$('interact-label').textContent=object?.id==='guide'?'לדבר עם '+chapter().guide:object?.id==='chest'?'לפתוח את התיבה':object?.id==='portal'?'אל השער':'לבדוק את הרמז';}
  });
  render();world.setPosition(state.position);save();
  if(state.sound)document.addEventListener('pointerdown',async()=>{if(state.sound&&!audio.enabled){await audio.enable();render();}},{once:true});
  if(state.active)toast('ברוכה השבה! החידה שלך נשמרה. לחצי על ״להמשיך את החידה״.');
  else if(state.legacyImported&&!state.seenIntro)toast('המטבעות והשלבים שלך מהמשחק הקודם מחכים גם בהרפתקה הזאת.');
  else if(recoveryNotice)toast('שמירה פגומה הועתקה לגיבוי. התחלנו מסע חדש בבטחה.');
}
init();
