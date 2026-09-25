export class QuestAudio {
  constructor(){this.enabled=false;this.context=null;this.master=null;this.timer=null;this.step=0;document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stop();else if(this.enabled)this.start();});}
  async enable(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;if(!this.context){this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=.16;this.master.connect(this.context.destination);}await this.context.resume();this.enabled=true;this.start();return true;}catch{return false;}}
  disable(){this.enabled=false;this.stop();}
  stop(){clearInterval(this.timer);this.timer=null;if(this.master&&this.context)this.master.gain.setTargetAtTime(0,this.context.currentTime,.1);}
  note(frequency,duration=.35,volume=.16,delay=0,type='sine'){
    if(!this.enabled||!this.context||this.context.state!=='running')return;const t=this.context.currentTime+delay,osc=this.context.createOscillator(),gain=this.context.createGain();osc.type=type;osc.frequency.value=frequency;gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.025);gain.gain.exponentialRampToValueAtTime(.001,t+duration);osc.connect(gain);gain.connect(this.master);osc.start(t);osc.stop(t+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  start(){if(this.timer||!this.enabled||document.hidden)return;this.master.gain.setTargetAtTime(.16,this.context.currentTime,.1);const notes=[261.63,329.63,392,523.25,440,392,329.63,293.66];this.timer=setInterval(()=>{this.note(notes[this.step%notes.length],1.5,.11);if(this.step%4===0)this.note(130.81,2,.09);this.step++;},850);}
  success(){[523.25,659.25,783.99].forEach((n,i)=>this.note(n,.4,.27,i*.11,'triangle'));}
  reward(){[392,523.25,659.25,783.99,1046.5].forEach((n,i)=>this.note(n,.6,.3,i*.13,'triangle'));}
  tap(){this.note(440,.09,.12,0);}
}
