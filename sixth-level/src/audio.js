export class AudioEngine{
 constructor(){this.enabled=true;this.nodes=new Set();}
 async unlock(){this.ctx??=new(window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==='suspended')await this.ctx.resume();}
 stop(){if(!this.ctx)return;for(const node of this.nodes){try{node.stop();}catch{}}this.nodes.clear();}
 tone(freq,duration=.1,volume=.06,type='sine'){
  if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;const ctx=this.ctx,o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime;o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*.6),t+duration);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(ctx.destination);this.nodes.add(o);o.onended=()=>{o.disconnect();g.disconnect();this.nodes.delete(o);};o.start();o.stop(t+duration);
 }
 play(kind){if(kind==='cut')this.tone(760,.09,.035,'triangle');else if(kind==='combo')this.tone(1180,.22,.055);else if(kind==='bomb'||kind==='mistake')this.tone(90,.28,.08,'triangle');else if(kind==='won')this.tone(1450,.65,.06);}
}
