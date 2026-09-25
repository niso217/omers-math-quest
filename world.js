import {OBJECTS,TASK_OBJECTS,TREE_SPOTS,riverX,walkable,findPath} from './game-core.js';

const PALETTES={
  forest:{ground:'#385e4b',light:'#557b52',tree:'#25513d',leaf:'#56855b',water:'#65afb0',bank:'#729f79',path:'#b9ac7b'},
  lake:{ground:'#426878',light:'#678c8e',tree:'#335466',leaf:'#6b9599',water:'#91c7d5',bank:'#7faaa5',path:'#b6b9a1'},
  garden:{ground:'#52715c',light:'#829779',tree:'#754d68',leaf:'#bb8d9b',water:'#7cbab4',bank:'#a7bb92',path:'#d3c099'},
  autumn:{ground:'#6c704d',light:'#92905b',tree:'#826342',leaf:'#c3995f',water:'#7ca79a',bank:'#a9ae7a',path:'#d9bd88'},
  snow:{ground:'#819b9b',light:'#b4c8c5',tree:'#57717d',leaf:'#c6dcdf',water:'#8cb9cf',bank:'#d3e3df',path:'#d1cbb4'},
  cave:{ground:'#514960',light:'#70617d',tree:'#4a3c64',leaf:'#9076ab',water:'#9084c2',bank:'#9384a5',path:'#b5a29e'},
  sky:{ground:'#779c92',light:'#a8bfac',tree:'#5e9090',leaf:'#bdd8cd',water:'#b0d1e6',bank:'#d2e4ce',path:'#e0d5b5'},
  castle:{ground:'#50475c',light:'#706174',tree:'#41354f',leaf:'#7e608d',water:'#967dab',bank:'#917f99',path:'#b8a49a'}
};
function ellipse(ctx,x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
function line(ctx,points,color,width=2){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
function poly(ctx,points,color){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();}
function rect(ctx,x,y,w,h,r,color){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();}
function star(ctx,x,y,size,color){poly(ctx,[[x,y-size],[x+size*.28,y-size*.28],[x+size,y],[x+size*.28,y+size*.28],[x,y+size],[x-size*.28,y+size*.28],[x-size,y],[x-size*.28,y-size*.28]],color);}

export function drawHero(ctx,x,y,{cloak='#75a987',time=0,moving=false,facing=1,scale=1}={}){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);const bob=moving?Math.sin(time*14)*2:Math.sin(time*2)*.6;
  ellipse(ctx,0,4,15,6,'#1c293d45');ctx.translate(0,bob);
  line(ctx,[[-5,-6],[-6+(moving?Math.sin(time*14)*4:0),4]],'#3f3b4c',7);line(ctx,[[5,-6],[6-(moving?Math.sin(time*14)*4:0),4]],'#3f3b4c',7);
  rect(ctx,-12,1,11,6,3,'#e4cfaa');rect(ctx,3,1,11,6,3,'#e4cfaa');
  poly(ctx,[[-10,-29],[10,-29],[17,-2],[0,2],[-17,-2]],cloak);line(ctx,[[-7,-22],[-17,-11]],'#e3b397',5);line(ctx,[[8,-22],[17,-13]],'#e3b397',5);
  poly(ctx,[[-11,-27],[-1,-20],[0,-5],[-16,-3]],'#00000012');ellipse(ctx,0,-38,14,16,'#573e3d');
  ellipse(ctx,0,-34,11,12,'#efbd98');ctx.beginPath();ctx.moveTo(-13,-37);ctx.quadraticCurveTo(-10,-58,7,-48);ctx.quadraticCurveTo(18,-43,12,-30);ctx.quadraticCurveTo(6,-36,3,-43);ctx.quadraticCurveTo(-4,-34,-13,-37);ctx.fillStyle='#523e3c';ctx.fill();
  ellipse(ctx,-4+facing,-35,1.2,1.5,'#423334');ellipse(ctx,4+facing,-35,1.2,1.5,'#423334');line(ctx,[[-2,-29],[1,-28],[4,-29]],'#b67969',1);
  line(ctx,[[-10,-44],[-4,-47],[4,-47],[11,-42]],'#ead891',3);ellipse(ctx,9,-44,3,3,'#f5d57a');star(ctx,0,-19,4,'#f7dda2');
  ctx.restore();
}
export function drawCompanion(ctx,x,y,type='fox',scale=1,time=0){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ellipse(ctx,0,4,16,5,'#17312733');
  if(type==='owl'){
    ellipse(ctx,0,-12,15,20,'#9c8399');ellipse(ctx,0,-10,11,14,'#e4d4bb');poly(ctx,[[-14,-20],[-14,-37],[-4,-26]],'#90768b');poly(ctx,[[14,-20],[14,-37],[4,-26]],'#90768b');
    ellipse(ctx,-6,-19,6,7,'#f1e6cc');ellipse(ctx,6,-19,6,7,'#f1e6cc');ellipse(ctx,-6,-19,2,3,'#3c3446');ellipse(ctx,6,-19,2,3,'#3c3446');poly(ctx,[[-3,-13],[3,-13],[0,-8]],'#dba868');
    line(ctx,[[-9,5],[-3,5]],'#b89660',3);line(ctx,[[3,5],[9,5]],'#b89660',3);
  }else{
    ctx.save();ctx.translate(9,-6);ctx.rotate(-.25+Math.sin(time*2)*.1);ellipse(ctx,9,-4,16,8,'#d79463');ellipse(ctx,20,-5,6,7,'#f4e2c3');ctx.restore();
    ellipse(ctx,0,-10,11,15,'#d89460');ellipse(ctx,0,-9,7,11,'#f6dfba');poly(ctx,[[-15,-23],[-14,-42],[-4,-30]],'#cb885b');poly(ctx,[[15,-23],[14,-42],[4,-30]],'#cb885b');
    ellipse(ctx,0,-24,15,11,'#e7a471');poly(ctx,[[-14,-24],[0,-13],[0,-24]],'#f6dfbc');poly(ctx,[[14,-24],[0,-13],[0,-24]],'#f6dfbc');ellipse(ctx,-6,-26,1.5,2,'#3b3436');ellipse(ctx,6,-26,1.5,2,'#3b3436');ellipse(ctx,0,-20,2,2,'#3b3436');rect(ctx,-11,-4,8,9,3,'#ad6d4b');rect(ctx,3,-4,8,9,3,'#ad6d4b');
  }ctx.restore();
}

export class QuestWorld {
  constructor(canvas,pins,{onInteract,onPosition,onNear}){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.pins=pins;this.onInteract=onInteract;this.onPosition=onPosition;this.onNear=onNear;this.position={x:236,y:508};this.path=[];this.keys=new Set();this.paused=false;this.time=0;this.last=0;this.target=null;this.near=null;this.chapter=null;this.progress={solved:[]};this.cloak='#75a987';this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();
    canvas.addEventListener('pointerdown',e=>{if(this.paused)return;canvas.focus({preventScroll:true});const b=canvas.getBoundingClientRect();this.moveTo({x:(e.clientX-b.left-this.offsetX)/this.scale,y:(e.clientY-b.top-this.offsetY)/this.scale});});
    document.addEventListener('keydown',e=>{if(this.paused||e.target.matches('input,textarea,select,button'))return;const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','e',' '].includes(key)){e.preventDefault();if(key==='e'||key===' '){if(!e.repeat&&this.near)this.onInteract(this.near.id);}else{this.keys.add(key);this.path=[];this.target=null;}}});
    document.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>this.keys.clear());document.addEventListener('visibilitychange',()=>this.keys.clear());
    this.frame=()=>{if(!canvas.isConnected){this.observer.disconnect();return;}const now=performance.now()/1000,dt=Math.min(.04,now-(this.last||now));this.last=now;this.time+=dt;if(!this.paused)this.update(dt);this.draw();this.raf=requestAnimationFrame(this.frame);};this.raf=requestAnimationFrame(this.frame);
  }
  resize(){const box=this.canvas.getBoundingClientRect();this.width=box.width;this.height=box.height;this.dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(this.width*this.dpr);this.canvas.height=Math.round(this.height*this.dpr);this.scale=Math.max(this.width/960,this.height/640);}
  setScene(chapter,progress,cloak){this.chapter=chapter;this.progress=progress;this.cloak=cloak;this.palette=PALETTES[chapter.biome]||PALETTES.forest;this.background=this.makeBackground();this.renderPins();}
  setPosition(position){this.position={...position};if(!walkable(this.position.x,this.position.y,this.bridgeOpen))this.position={x:236,y:508};this.path=[];this.target=null;}
  get bridgeOpen(){return this.progress.solved.includes(1);}
  pause(value){this.paused=value;if(value){this.keys.clear();this.path=[];this.target=null;this.onPosition({...this.position});}}
  moveTo(point){this.path=findPath(this.position,point,this.bridgeOpen);this.target=null;}
  goTo(id){const object=OBJECTS.find(o=>o.id===id);if(!object||this.paused)return;this.path=findPath(this.position,object.approach,this.bridgeOpen);this.target=object;if(!this.path.length&&Math.hypot(this.position.x-object.approach.x,this.position.y-object.approach.y)<54){this.target=null;this.onInteract(id);}}
  renderPins(){
    this.pins.replaceChildren();for(const object of OBJECTS){const index=TASK_OBJECTS.indexOf(object.id),done=index>=0&&this.progress.solved.includes(index),active=(object.id==='guide'&&!this.progress.accepted)||(index===this.progress.solved.length&&this.progress.accepted)||(object.id==='portal'&&this.progress.solved.length===3);
      const button=document.createElement('button');button.type='button';button.className=`world-pin ${active?'is-active':''} ${done?'is-done':''}`;button.dataset.object=object.id;
      const label=object.id==='guide'?this.chapter.guide:object.id==='chest'?'תיבת סודות':object.id==='portal'?'השער הבא':this.chapter.objects[index];button.setAttribute('aria-label',`לכי אל ${label}`);button.innerHTML=`<span class="pin-symbol">${done||object.id==='chest'&&this.progress.chest?'✓':object.id==='guide'?'!':object.id==='chest'?'✧':object.id==='portal'?'↗':index+1}</span><span class="pin-label"></span>`;button.querySelector('.pin-label').textContent=label;button.addEventListener('click',()=>this.goTo(object.id));this.pins.append(button);
    }
  }
  update(dt){
    const p=this.position;let dx=0,dy=0;const speed=150;
    if(this.keys.size){dx=Number(this.keys.has('arrowright')||this.keys.has('d'))-Number(this.keys.has('arrowleft')||this.keys.has('a'));dy=Number(this.keys.has('arrowdown')||this.keys.has('s'))-Number(this.keys.has('arrowup')||this.keys.has('w'));}
    else if(this.path.length){const next=this.path[0],distance=Math.hypot(next.x-p.x,next.y-p.y);if(distance<speed*dt+1){p.x=next.x;p.y=next.y;this.path.shift();}else{dx=(next.x-p.x)/distance;dy=(next.y-p.y)/distance;}}
    this.moving=Boolean(dx||dy||this.path.length);if(dx)this.facing=Math.sign(dx);const length=Math.hypot(dx,dy)||1;const nx=p.x+dx/length*speed*dt,ny=p.y+dy/length*speed*dt;
    if(walkable(nx,p.y,this.bridgeOpen))p.x=nx;if(walkable(p.x,ny,this.bridgeOpen))p.y=ny;
    if(this.target&&!this.path.length){const target=this.target;this.target=null;if(Math.hypot(p.x-target.approach.x,p.y-target.approach.y)<55){this.onPosition({...p});this.onInteract(target.id);}else this.onNear({blocked:true});}
    const nearest=OBJECTS.map(o=>({object:o,d:Math.hypot(o.approach.x-p.x,o.approach.y-p.y)})).filter(o=>o.d<57).sort((a,b)=>a.d-b.d)[0]?.object||null;
    if(nearest?.id!==this.near?.id){this.near=nearest;this.onNear(nearest);}
    if(this.moving&&this.time-(this.lastSaved||0)>1){this.lastSaved=this.time;this.onPosition({...p});}
  }
  makeBackground(){
    const layer=document.createElement('canvas');layer.width=960;layer.height=640;const c=layer.getContext('2d'),p=this.palette;const gradient=c.createRadialGradient(360,300,40,500,340,630);gradient.addColorStop(0,p.light);gradient.addColorStop(1,p.ground);c.fillStyle=gradient;c.fillRect(0,0,960,640);
    for(let i=0;i<600;i++){const x=(i*137.51)%960,y=(i*83.27)%640;c.globalAlpha=.14;ellipse(c,x,y,1+(i%3),1,i%2?'#d5e7a6':'#172f32');if(i%5===0)line(c,[[x-3,y],[x-2,y-5],[x,y-1],[x+3,y-6]],'#cfdda8',1);}c.globalAlpha=1;
    const paths=[[[216,584],[239,469],[293,358],[298,316]],[[249,423],[359,386],[479,367],[603,383],[706,374],[798,223]],[[294,355],[227,298],[180,236]]];
    for(const path of paths){line(c,path,'#263d3622',53);line(c,path,p.path,43);line(c,path,'#ded5ad24',29);}
    c.beginPath();c.moveTo(riverX(0)-44,0);for(let y=0;y<=640;y+=8)c.lineTo(riverX(y)-44,y);for(let y=640;y>=0;y-=8)c.lineTo(riverX(y)+44,y);c.closePath();c.fillStyle=p.bank;c.fill();
    c.beginPath();c.moveTo(riverX(0)-34,0);for(let y=0;y<=640;y+=8)c.lineTo(riverX(y)-34,y);for(let y=640;y>=0;y-=8)c.lineTo(riverX(y)+34,y);c.closePath();c.fillStyle=p.water;c.fill();
    for(let y=17;y<640;y+=32){line(c,[[riverX(y)-13,y],[riverX(y)+7,y-3],[riverX(y)+21,y]],'#def6e247',2);}
    for(let i=0;i<31;i++){const x=(i*113+91)%900+30,y=(i*137+73)%530+55;if(Math.abs(x-riverX(y))<58)continue;ellipse(c,x,y+4,7,3,'#19332820');poly(c,[[x-7,y+2],[x-4,y-4],[x+3,y-6],[x+7,y],[x+3,y+4]],'#b3b7a3');line(c,[[x-4,y-3],[x+1,y-5],[x+4,y-1]],'#dbe1c5',1);}
    for(const [x,y] of [[136,407],[273,532],[344,233],[640,462],[771,441],[742,211],[111,295]]){line(c,[[x,y+5],[x,y-4]],'#abd291',2);for(let j=0;j<5;j++)ellipse(c,x+Math.cos(j*1.256)*4,y-5+Math.sin(j*1.256)*4,3,3,this.chapter.biome==='garden'?'#efbbcf':'#e6cc92');ellipse(c,x,y-5,2,2,'#fff0ab');}
    return layer;
  }
  drawTree(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);const p=this.palette;ellipse(c,5,6,31,12,'#132c3238');rect(c,-6,-33,12,42,4,'#826952');line(c,[[-1,-8],[-14,-21]],'#967b5c',4);ellipse(c,0,-42,35,31,p.tree);ellipse(c,-18,-38,24,23,p.tree);ellipse(c,18,-43,25,24,p.leaf);ellipse(c,-8,-62,28,24,p.leaf);ellipse(c,-13,-68,17,13,'#d6e5a51b');ellipse(c,25,-48,8,10,'#d6e5a514');if(this.chapter.biome==='snow'){ellipse(c,-7,-72,20,8,'#e3eeeb');ellipse(c,24,-53,12,5,'#e3eeeb');}c.restore();}
  drawLock(c,x,y){const done=this.progress.solved.includes(0);ellipse(c,x,y+6,42,14,'#1b30332b');rect(c,x-32,y-34,64,40,7,'#8c9784');rect(c,x-26,y-65,52,38,14,'#b4b89a');rect(c,x-18,y-54,36,44,8,done?'#526f53':'#526763');line(c,[[x-29,y-2],[x-43,y-19],[x-41,y-37]],'#777b58',6);line(c,[[x+27,y],[x+40,y-20],[x+43,y-36]],'#777b58',5);for(let i=0;i<3;i++){rect(c,x-15+i*11,y-40,8,16,3,done?'#e3d795':'#acbfaa');}star(c,x,y-72,6,done?'#ffdd90':'#a5c6a1');}
  drawBridge(c){const x=riverX(365),open=this.bridgeOpen;ellipse(c,x,378,62,20,'#24495124');for(let i=0;i<9;i++){const px=x-53+i*13;if(!open&&i>2&&i<7)continue;c.save();c.translate(px,365);if(!open&&i===2)c.rotate(.25);rect(c,-6,-21,12,44,2,open?'#d6bd87':'#947e61');line(c,[[-3,-16],[-3,16]],'#b59b70',1);c.restore();}for(const y of [339,391]){line(c,[[x-61,y],[x+61,y]],open?'#eed8a8':'#9c956e',3);for(const px of [x-60,x+60]){rect(c,px-3,y-13,6,21,2,'#a18a67');ellipse(c,px,y-13,4,3,'#d5c393');}}}
  drawShrine(c,x,y){const done=this.progress.solved.includes(2);ellipse(c,x,y+5,39,14,'#1b30332a');ellipse(c,x,y,34,11,'#a4ad94');ellipse(c,x,y-6,28,9,'#c3c6ab');rect(c,x-12,y-25,24,20,3,'#939f87');for(const [dx,dy,s] of [[-22,-21,.7],[20,-23,.85],[0,-46,1.25]]){poly(c,[[x+dx,y+dy-18*s],[x+dx+9*s,y+dy],[x+dx,y+dy+8*s],[x+dx-9*s,y+dy]],done?'#e5db9a':'#a6bcca');poly(c,[[x+dx,y+dy-18*s],[x+dx,y+dy+8*s],[x+dx-9*s,y+dy]],done?'#fff0b4':'#d3e0df');}if(done){c.globalAlpha=.6;star(c,x,y-70,7,'#fff0ae');c.globalAlpha=1;}}
  drawPortal(c,x,y){const active=this.progress.solved.length===3;ellipse(c,x,y+9,64,20,'#22313240');rect(c,x-47,y-38,94,45,3,'#a3aa91');rect(c,x-55,y-96,27,104,4,'#acb19b');rect(c,x+28,y-96,27,104,4,'#acb19b');rect(c,x-36,y-104,72,22,5,'#c5c9ad');for(const dx of [-56,-39,30,47])rect(c,x+dx,y-106,11,18,2,'#bdc3a7');c.beginPath();c.roundRect(x-25,y-74,50,83,[24,24,0,0]);c.fillStyle=active?'#718d89':'#455962';c.fill();for(const dx of [-14,0,14])line(c,[[x+dx,y-60],[x+dx,y+5]],active?'#c9e4b33b':'#718079',3);line(c,[[x-27,y-83],[x+27,y-83]],'#ebd394',3);star(c,x,y-93,7,active?'#ffe59b':'#8b9885');if(active){c.save();c.globalAlpha=.3+.1*Math.sin(this.time*2);ellipse(c,x,y-34,22,38,'#dfd8a4');c.restore();}for(let i=0;i<3;i++)rect(c,x-37-i*5,y+7+i*6,74+i*10,7,2,'#b9b9a0');}
  drawChest(c,x,y){const open=this.progress.chest;ellipse(c,x,y+3,22,8,'#18313235');rect(c,x-18,y-21,36,24,4,'#93694d');rect(c,x-19,y-(open?38:28),38,open?12:16,5,'#c39964');line(c,[[x-13,y-20],[x-13,y+1]],'#e6ca82',4);line(c,[[x+12,y-20],[x+12,y+1]],'#e6ca82',4);rect(c,x-3,y-16,7,9,2,'#f0d98e');if(open)star(c,x,y-22,7,'#ffe49d');}
  draw(){
    if(!this.chapter||!this.width)return;const c=this.ctx,p=this.position;
    this.offsetX=Math.max(this.width-960*this.scale,Math.min(0,this.width/2-p.x*this.scale));this.offsetY=Math.max(this.height-640*this.scale,Math.min(0,this.height/2-p.y*this.scale));
    c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.width,this.height);c.save();c.translate(this.offsetX,this.offsetY);c.scale(this.scale,this.scale);c.drawImage(this.background,0,0);this.drawBridge(c);
    if(this.path.length){c.save();c.setLineDash([2,10]);line(c,[[p.x,p.y],...this.path.filter((_,i)=>i%3===0).map(v=>[v.x,v.y])],'#fff1bf85',2);c.restore();const end=this.path.at(-1);ellipse(c,end.x,end.y,7,3,'#f6dfaa99');}
    const items=TREE_SPOTS.map(([x,y,s])=>({y,draw:()=>this.drawTree(c,x,y,s)}));items.push({y:274,draw:()=>this.drawLock(c,301,274)},{y:321,draw:()=>this.drawShrine(c,703,321)},{y:150,draw:()=>this.drawPortal(c,800,150)},{y:184,draw:()=>this.drawChest(c,165,184)},{y:457,draw:()=>drawCompanion(c,202,457,this.chapter.creature,1,this.reduced?0:this.time)},{y:p.y,draw:()=>drawHero(c,p.x,p.y,{cloak:this.cloak,time:this.reduced?0:this.time,moving:this.moving&&!this.paused,facing:this.facing||1})});items.sort((a,b)=>a.y-b.y).forEach(item=>item.draw());
    if(!this.reduced){for(let i=0;i<13;i++){const x=(i*137+115)%860+40+Math.sin(this.time*.5+i)*7,y=(i*89+162)%460+85+Math.cos(this.time*.65+i)*8;c.globalAlpha=.2+Math.sin(this.time*1.1+i)*.15;ellipse(c,x,y,3,3,'#fcf2a9');}c.globalAlpha=1;}
    const shade=c.createRadialGradient(480,320,170,480,320,570);shade.addColorStop(0,'#142b2b00');shade.addColorStop(1,'#12232748');c.fillStyle=shade;c.fillRect(0,0,960,640);c.restore();
    this.pins.querySelectorAll('[data-object]').forEach(button=>{const object=OBJECTS.find(o=>o.id===button.dataset.object),x=object.x*this.scale+this.offsetX,y=(object.y-(object.id==='portal'?108:object.id==='lock'?76:object.id==='shrine'?72:object.id==='guide'?45:34))*this.scale+this.offsetY;button.style.left=`${x}px`;button.style.top=`${y}px`;button.hidden=x<12||x>this.width-12||y<35||y>this.height-20;button.disabled=this.paused;});
  }
}
