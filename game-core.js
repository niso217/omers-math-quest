export const STORAGE_KEY = 'omerMathQuestAdventure.v2';
export const LEGACY_KEY = 'omerMathQuestState';
export const WORLD_SIZE = {width:960,height:640};
export const OBJECTS = [
  {id:'guide',x:202,y:457,approach:{x:236,y:468}},
  {id:'lock',x:301,y:274,approach:{x:301,y:330}},
  {id:'bridge',x:450,y:366,approach:{x:438,y:393}},
  {id:'shrine',x:703,y:321,approach:{x:700,y:371}},
  {id:'portal',x:800,y:150,approach:{x:802,y:219}},
  {id:'chest',x:165,y:184,approach:{x:179,y:226}}
];
export const TASK_OBJECTS = ['lock','bridge','shrine'];
const int = (value,min,max,fallback=min) => Number.isFinite(Number(value)) ? Math.max(min,Math.min(max,Math.floor(Number(value)))) : fallback;
export function freshState(){return {version:2,chapter:1,unlocked:1,coins:0,xp:0,cloak:'sage',ownedCloaks:['sage'],chapters:{},skills:{},active:null,sound:false,position:{x:236,y:508},seenIntro:false,legacyImported:false};}
export function chapterProgress(state,id=state.chapter){return state.chapters[id]||{accepted:false,solved:[],chest:false,completed:false};}
export function normalizeState(raw){
  const state=freshState();if(!raw||typeof raw!=='object'||raw.version!==2)return state;
  state.unlocked=int(raw.unlocked,1,9);state.chapter=int(raw.chapter,1,state.unlocked);state.coins=int(raw.coins,0,1e8);state.xp=int(raw.xp,0,1e8);
  state.ownedCloaks=[...new Set(['sage',...(Array.isArray(raw.ownedCloaks)?raw.ownedCloaks:[]).filter(v=>['violet','rose','gold'].includes(v))])];
  state.cloak=state.ownedCloaks.includes(raw.cloak)?raw.cloak:'sage';state.sound=raw.sound===true;state.seenIntro=raw.seenIntro===true;state.legacyImported=raw.legacyImported===true;
  for(let id=1;id<=state.unlocked;id++){const c=raw.chapters?.[id];if(c&&typeof c==='object'){const solved=[];for(let i=0;i<3;i++){if(Array.isArray(c.solved)&&c.solved.includes(i)&&solved.length===i)solved.push(i);else break;}state.chapters[id]={accepted:c.accepted===true,solved,chest:c.chest===true,completed:solved.length===3&&c.completed===true};}}
  for(const [key,value] of Object.entries(raw.skills||{})){if(value&&typeof value==='object')state.skills[key]={attempts:int(value.attempts,0,1e8),correct:int(value.correct,0,1e8),independent:int(value.independent,0,1e8)};}
  state.position={x:int(raw.position?.x,30,930,236),y:int(raw.position?.y,60,600,508)};
  const a=raw.active;
  if(a&&a.chapter===state.chapter&&['lock','bridge','shrine','chest','practice'].includes(a.object)&&Array.isArray(a.questions)&&a.questions.length>0&&a.questions.length<=8&&a.questions.every(validQuestion)){
    const index=int(a.index,0,a.questions.length),answered=a.answered===true&&index<a.questions.length;
    state.active={chapter:state.chapter,object:a.object,questions:a.questions,index,attempts:int(a.attempts,0,10000),hinted:a.hinted===true,results:Array.isArray(a.results)?a.results.filter(v=>typeof v==='boolean').slice(0,index+(answered?1:0)):[],answered};
    if(a.draft&&typeof a.draft==='object')state.active.draft={digits:Array.isArray(a.draft.digits)?a.draft.digits.slice(0,4).map(v=>int(v,0,9)):[],crystals:Array.isArray(a.draft.crystals)?a.draft.crystals.filter(v=>Number.isInteger(v)&&v>=0&&v<40):[],groupCount:int(a.draft.groupCount,0,20),inputValue:typeof a.draft.inputValue==='string'?a.draft.inputValue.slice(0,25):''};
  }
  return state;
}
export function migrateLegacy(legacy){
  const state=freshState();if(!legacy||typeof legacy!=='object')return state;
  state.coins=int(legacy.coins,0,1e8);state.unlocked=int(legacy.maxUnlockedLevel,1,9);state.chapter=state.unlocked;state.legacyImported=true;
  for(let id=1;id<state.unlocked;id++)state.chapters[id]={accepted:true,solved:[0,1,2],chest:false,completed:true};
  if(legacy.theme==='gold'||legacy.purchasedThemes?.includes('gold'))state.ownedCloaks.push('gold');
  if(legacy.theme==='dark'||legacy.purchasedThemes?.includes('dark'))state.ownedCloaks.push('violet');
  state.cloak=legacy.theme==='gold'?'gold':legacy.theme==='dark'?'violet':'sage';return state;
}
export function validQuestion(q){
  if(!q||typeof q!=='object'||typeof q.id!=='string'||typeof q.prompt!=='string'||typeof q.skill!=='string'||!Number.isFinite(q.answer)||q.answer<0||!['number','place','fraction','sequence','choice','groups','geometry'].includes(q.kind)||typeof q.hint!=='string'||typeof q.explanation!=='string')return false;
  if(q.kind==='place')return Number.isInteger(q.digits)&&q.digits>=3&&q.digits<=4;
  if(q.kind==='choice')return Array.isArray(q.options)&&q.options.length>=2&&q.options.length<=8&&q.options.every(Number.isFinite)&&q.options.includes(q.answer);
  if(q.kind==='fraction')return q.visual?.type==='fraction'&&Number.isInteger(q.visual.total)&&q.visual.total>0&&q.visual.total<=40&&Number.isInteger(q.visual.denominator)&&q.visual.denominator>1&&Number.isInteger(q.visual.numerator)&&q.visual.numerator>0&&q.visual.numerator<q.visual.denominator;
  if(q.kind==='groups')return q.visual?.type==='groups'&&Number.isInteger(q.visual.rows)&&q.visual.rows>0&&q.visual.rows<=12&&Number.isInteger(q.visual.total)&&q.visual.total>0;
  if(q.kind==='sequence')return q.visual?.type==='sequence'&&Array.isArray(q.visual.values)&&q.visual.values.length===5&&q.visual.values.every(Number.isFinite)&&Number.isInteger(q.visual.gap)&&q.visual.gap>=0&&q.visual.gap<5;
  if(q.kind==='geometry')return q.visual?.type==='geometry'&&[q.visual.w,q.visual.h].every(n=>Number.isInteger(n)&&n>0&&n<=12);
  return true;
}
export function parseAnswer(value){const cleaned=String(value).trim().replace(/,/g,'').replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,'');if(!/^\d+(?:\.\d+)?$/.test(cleaned))return null;const n=Number(cleaned);return Number.isFinite(n)?n:null;}
export function recordAnswer(state,question,value,assisted){
  const correct=parseAnswer(value)===question.answer;const previous=state.skills[question.skill]||{attempts:0,correct:0,independent:0};
  state.skills[question.skill]={attempts:previous.attempts+1,correct:previous.correct+(correct?1:0),independent:previous.independent+(correct&&!assisted?1:0)};return correct;
}
export function completeObjective(state,object){
  const progress=chapterProgress(state);state.chapters[state.chapter]=progress;
  if(object==='practice')return {coins:0,xp:0};
  if(object==='chest'){if(progress.chest)return {coins:0,xp:0};progress.chest=true;state.coins+=35;state.xp+=15;return {coins:35,xp:15};}
  const index=TASK_OBJECTS.indexOf(object);if(index<0||!progress.accepted||progress.solved.length!==index)return {coins:0,xp:0};
  progress.solved.push(index);state.coins+=25;state.xp+=30;return {coins:25,xp:30};
}
export function finishChapter(state){const p=chapterProgress(state);if(p.solved.length!==3||p.completed)return false;p.completed=true;state.chapters[state.chapter]=p;state.unlocked=Math.max(state.unlocked,Math.min(9,state.chapter+1));state.coins+=60;state.xp+=50;return true;}
export function purchaseCloak(state,item){if(state.ownedCloaks.includes(item.id)){state.cloak=item.id;return true;}if(state.coins<item.price)return false;state.coins-=item.price;state.ownedCloaks.push(item.id);state.cloak=item.id;return true;}

export function makeQuestion(skill,chapter,variant=0,rng=Math.random,difficulty='medium'){
  const rand=(a,b)=>a+Math.floor(rng()*(b-a+1));const pick=xs=>xs[rand(0,xs.length-1)];const harder=difficulty==='hard';
  let q={id:`${chapter}-${skill}-${variant}-${rand(100,999999)}`,skill,kind:'number',prompt:'',answer:0,hint:'',explanation:'',visual:null};
  if(skill==='place'){
    const digits=chapter>=5||harder?4:3;const values=Array.from({length:digits},(_,i)=>rand(i===0?1:0,9));const answer=Number(values.join(''));const terms=values.map((v,i)=>v*10**(digits-i-1));
    q={...q,kind:variant===0?'place':'number',digits,prompt:variant===0?'על השער חקוקים חלקים של מספר. סובבי את הספרות והרכיבי את הקוד.':'על המנעול הבא מופיע קוד חדש. איזה מספר מתקבל?',expression:terms.join(' + '),answer,hint:'התחילי מהערך הגדול ביותר. לכל ספרה יש מקום: אלפים, מאות, עשרות ויחידות.',explanation:`${terms.join(' + ')} = ${answer}`,visual:{type:'place',terms}};
  }else if(skill==='sequence'){
    const step=pick(chapter>2?[25,50,100,125]:[10,20,25,50]);const start=rand(2,12)*step;const gap=variant===0?2:3;const values=Array.from({length:5},(_,i)=>start+step*i);q={...q,kind:'sequence',prompt:'אבני הגשר מסודרות בקפיצות שוות. איזה מספר חסר באבן הזוהרת?',answer:values[gap],hint:`בדקי את ההפרש בין שתי אבנים שכנות. בכל צעד מוסיפים ${step}.`,explanation:`${values.join(' ← ')}. בכל קפיצה מוסיפים ${step}.`,visual:{type:'sequence',values,gap}};
  }else if(skill==='groups'){
    const rows=rand(3,chapter>5?9:6),each=rand(3,harder?12:8),total=rows*each,division=variant%2===0;
    q={...q,kind:variant===0?'groups':'number',prompt:division?`יש ${total} גחליליות ו־${rows} פנסים. כמה גחליליות נשים בכל פנס, כדי שבכולם תהיה אותה כמות?`:`יש ${rows} פנסים, ובכל פנס ${each} גחליליות. כמה גחליליות מאירות יחד?`,answer:division?each:total,hint:division?'חלקי את הגחליליות לקבוצות שוות. אפשר להיעזר בכפל כדי לבדוק.':'כפלי את מספר הפנסים בכמות שבכל פנס.',explanation:`${rows} × ${each} = ${total}. ${total} ÷ ${rows} = ${each}.`,visual:variant===0?{type:'groups',rows,total}:null};
  }else if(skill==='fraction'){
    const denominator=pick(chapter>=8?[4,6,8]:[2,3,4]);const numerator=chapter>=8?rand(1,denominator-1):1;const total=denominator*rand(2,4);const answer=total*numerator/denominator;
    q={...q,kind:variant===0?'fraction':'number',prompt:variant===0?`הדליקי ${numerator}/${denominator} מתוך ${total} גבישים כדי להעיר את המנגינה.`:`הפעם יש ${total} גבישים. כמה גבישים הם ${numerator}/${denominator} מהכמות?`,answer,hint:`חלקי ${total} ל־${denominator} קבוצות שוות. בחרי ${numerator} ${numerator===1?'קבוצה':'קבוצות'}.`,explanation:`${total} ÷ ${denominator} = ${total/denominator}, ואז ${total/denominator} × ${numerator} = ${answer}.`,visual:variant===0?{type:'fraction',total,numerator,denominator}:null};
  }else if(skill==='missing'){
    const multiply=chapter>=7;const a=rand(3,9),b=rand(3,9),sum=rand(15,55),part=rand(5,14);q={...q,prompt:'חלק מהכתובת העתיקה נמחק. איזה מספר צריך להיות במקום סימן השאלה?',expression:multiply?`${a} × ? = ${a*b}`:`? − ${part} = ${sum}`,answer:multiply?b:sum+part,hint:multiply?'השתמשי בפעולה ההפוכה: חלקי את המכפלה במספר הידוע.':'כדי למצוא את המספר שהיה בהתחלה, חברי את מה שהורידו למה שנשאר.',explanation:multiply?`${a*b} ÷ ${a} = ${b}`:`${sum} + ${part} = ${sum+part}`};
  }else if(skill==='geometry'){
    const w=rand(4,9),h=rand(3,7),area=variant%2===1;q={...q,kind:'geometry',prompt:area?'כל משבצת היא מטר רבוע. כמה מטרים רבועים צריך כדי לרצף את הבמה?':'רוצים להקיף את הבמה בסרט אור. כמה מטרים של סרט צריך לכל ארבע הצלעות?',answer:area?w*h:2*(w+h),hint:area?'לשטח: כפלי את מספר המשבצות בשורה במספר השורות.':'להיקף: חברי את האורך והרוחב, ואז הכפילי ב־2.',explanation:area?`${w} × ${h} = ${w*h} מ״ר`:`${w} + ${h} + ${w} + ${h} = ${2*(w+h)} מטרים`,visual:{type:'geometry',w,h,area}};
  }else if(skill==='story'){
    const packs=rand(3,7),each=rand(5,12),used=rand(3,12);q={...q,prompt:`החברים הביאו ${packs} קופסאות של פנסים. בכל קופסה ${each} פנסים. ${used} פנסים כבר נתלו על העצים. כמה פנסים נשארו לתלות?`,answer:packs*each-used,hint:'יש כאן שני צעדים: קודם חשבי כמה פנסים הגיעו, ואז חסרי את אלה שכבר נתלו.',explanation:`${packs} × ${each} = ${packs*each}. ${packs*each} − ${used} = ${packs*each-used}.`};
  }else{
    const max=difficulty==='easy'?299:chapter>=5||harder?4999:999;const a=rand(130,max),b=rand(25,Math.min(a-10,999)),subtract=variant%2===0;const answer=subtract?a-b:a+b;q={...q,skill:'arithmetic',prompt:subtract?`במגדל היו ${a} ניצוצות. ${b} מהם האירו את השביל. כמה ניצוצות נשארו?`:`מצאנו ${a} ניצוצות ביער ועוד ${b} ליד הנחל. כמה ניצוצות יש יחד?`,expression:`${a} ${subtract?'−':'+'} ${b}`,answer,hint:'אפשר לפרק למאות, לעשרות וליחידות. קחי את הזמן ובדקי כל עמודה.',explanation:`${a} ${subtract?'−':'+'} ${b} = ${answer}`};
  }
  return q;
}
export function bankQuestion(raw,id){
  if(!raw||!Number.isFinite(Number(raw.correct))||!Array.isArray(raw.options))return null;
  const clean=s=>String(s??'').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
  const answer=Number(raw.correct),options=[...new Set(raw.options.map(Number).filter(Number.isFinite))];if(!options.includes(answer))options.push(answer);
  return {id:`bank-${id}`,skill:'legacy',kind:'choice',prompt:clean(raw.question),answer,options,hint:clean(raw.hint),explanation:`התשובה היא ${answer}. ${clean(raw.hint)}`,visual:null};
}

export const TREE_SPOTS = [[68,108,1.1],[110,78,.8],[50,188,1],[76,266,.85],[61,370,1.15],[104,562,1.15],[170,566,.85],[332,555,.9],[390,583,1],[446,85,1.1],[373,101,.9],[344,150,.8],[570,93,1],[622,74,.85],[893,90,1.1],[907,201,.9],[874,319,1.05],[897,445,1],[847,560,1.15],[744,577,.9],[629,568,1.2],[384,452,.7],[616,245,.8]];
export function riverX(y){return 530+Math.sin(y/100)*24;}
export function walkable(x,y,bridgeOpen){
  if(x<28||x>932||y<82||y>599)return false;
  if(Math.abs(x-riverX(y))<39 && !(bridgeOpen&&y>337&&y<397))return false;
  if(TREE_SPOTS.some(([tx,ty,s])=>Math.hypot(tx-x,ty-y)<19*s))return false;
  if(x>757&&x<846&&y>94&&y<181)return false;
  return true;
}
export function findPath(start,end,bridgeOpen){
  const cell=16,cols=60,rows=40;const encode=(x,y)=>y*cols+x;const sx=int(Math.round(start.x/cell),0,cols-1),sy=int(Math.round(start.y/cell),0,rows-1);
  const ex=int(Math.round(end.x/cell),0,cols-1),ey=int(Math.round(end.y/cell),0,rows-1);const queue=[[sx,sy]],previous=new Map([[encode(sx,sy),null]]);let nearest=[sx,sy],best=Infinity;
  for(let cursor=0;cursor<queue.length;cursor++){
    const [x,y]=queue[cursor],dist=Math.hypot(x-ex,y-ey);if(dist<best){best=dist;nearest=[x,y];}if(x===ex&&y===ey)break;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){
      const nx=x+dx,ny=y+dy,k=encode(nx,ny);if(nx<0||nx>=cols||ny<0||ny>=rows||previous.has(k)||!walkable(nx*cell,ny*cell,bridgeOpen))continue;
      if(dx&&dy&&(!walkable((x+dx)*cell,y*cell,bridgeOpen)||!walkable(x*cell,(y+dy)*cell,bridgeOpen)))continue;
      previous.set(k,encode(x,y));queue.push([nx,ny]);
    }
  }
  const path=[];let key=encode(...nearest);while(previous.get(key)!==null&&previous.has(key)){path.push({x:(key%cols)*cell,y:Math.floor(key/cols)*cell});key=previous.get(key);}return path.reverse();
}
