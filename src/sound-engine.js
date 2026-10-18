// Local Web Audio synthesis: no downloads, timers, media files or autoplay.
const note=(f,to,duration=.12,wave='sine',at=0,gain=.035)=>({f,to,duration,wave,at,gain});
const noise=(duration=.15,cutoff=900,at=0,gain=.025)=>({wave:'noise',duration,cutoff,at,gain});
export const SOUND_CUES=Object.freeze({
 gift:[noise(.07,1200),note(680,920,.12,'triangle',.04)],
 crate:[noise(.11,550),note(160,65,.12,'triangle')],
 statue:[noise(.07,2200),note(310,240,.2,'sine',0,.025)],
 vending:[note(85,85,.19,'triangle',0,.012),noise(.04,1600,.15),note(500,360,.1,'sine',.2)],
 empty:[note(140,100,.09,'triangle',0,.02)],
 tree:[noise(.23,1500),note(250,160,.08,'sine',.12,.018)],
 crop:[noise(.07,800),note(300,210,.1)],
 pushbox:[noise(.09,300)],cart:[noise(.05,600),note(120,90,.08,'triangle')],
 ball:[note(190,65,.18,'sine',0,.045)],
 trampoline:[note(160,720,.2,'triangle',0,.025),note(720,380,.14,'sine',.18,.018)],
 land:[noise(.07,420),note(100,55,.1,'sine',0,.025)],
 balloon:[noise(.045,3500,0,.018)],picnic:[noise(.15,800),note(400,550,.08,'sine',.1,.02)],
 fountain:[noise(.16,1700,0,.02)],ride:[noise(.04,1400),note(210,150,.08,'triangle')],
 duck:[note(540,390,.07,'triangle',0,.025),note(510,370,.09,'triangle',.09,.025)],
 wateringPress:[note(180,220,.065,'triangle',0,.02)],
 watering:[noise(.04,1000),note(280,360,.08,'triangle')],
 bloom:[note(660,880,.13),note(990,1100,.22,'sine',.09,.023)],
 rainbow0:[note(523,523,.13,'triangle')],rainbow1:[note(659,659,.13,'triangle')],rainbow2:[note(784,784,.15,'triangle')],
 wrong:[note(190,125,.12,'triangle',0,.023)],
 rainbow:[note(523,523,.3),note(659,659,.3,'sine',.04,.02),note(784,784,.3,'sine',.08,.02)],
 windmill:[noise(.15,550,0,.014)],
 bell:[note(440,437,.85,'sine',0,.045),note(880,875,.65,'sine',0,.018),note(1318,1309,.45,'sine',0,.009)],
 domino:[noise(.035,1100,0,.014),note(360,170,.065,'triangle',0,.023)],
 dominoLast:[noise(.05,850),note(240,100,.1,'triangle')],
 reward:[note(880,1050,.11,'sine',0,.022),note(1175,1320,.16,'sine',.08,.02)],
 mushroom:[note(140,800,.24,'triangle',0,.025)],
 crystal:[note(1400,1000,.2,'sine',0,.02),note(1900,1300,.18,'sine',.04,.012),noise(.08,2800,0,.012)],
 forestfruit:[noise(.22,1800),note(380,230,.08,'sine',.1,.02)],
 rune:[note(330,330,.35),note(495,660,.4,'sine',.08,.02)],
});
export const SOUND_LIMITS=Object.freeze({voices:16,loops:3,range:22,cooldown:.12});
// The per-cue voice gains are tiny (0.009–0.045). On phones the old 0.55 master measured
// a median cue peak of only 0.0046 (-47 dBFS), i.e. barely audible through a speaker.
// 5.0 is ~+19 dB: loud cues peak around 0.18-0.20 and an 8-cue mix around 0.25, still
// below the -16 dBFS compressor threshold for single sounds and free of clipping.
export const MASTER_GAIN=Object.freeze({desktop:.55,mobile:5});
function handheld(){try{return Boolean(globalThis.matchMedia?.('(pointer:coarse)')?.matches)||(globalThis.innerWidth??1024)<=760}catch{return false}}
export function distanceGain(source,player){if(!source||!Number.isFinite(source.x+source.z))return 1;const d=Math.hypot(source.x-player.x,source.z-player.z);return Math.max(0,1-d/SOUND_LIMITS.range)**2}
export function soundLoops(game){
 if(game.state!=='playing')return [];
 return game.interactions.filter(p=>game.isIntroduced(p)).flatMap(p=>{
  let recipe,scale=1;
  if(p.kind==='fountain'&&p.on)recipe={wave:'noise',cutoff:1700,gain:.014};
  if(p.kind==='ride'&&p.on)recipe={wave:'triangle',f:64,gain:.009};
  if(p.kind==='watering'&&p.state==='running')recipe={wave:'noise',cutoff:2200,gain:.019};
  if(p.kind==='windmill'&&p.animation>0){recipe={wave:'noise',cutoff:480,gain:.015};scale=p.animation/3;}
  if(['cart','pushbox'].includes(p.kind)&&Math.hypot(p.vx,p.vz)>.18){const speed=Math.hypot(p.vx,p.vz);recipe=p.kind==='cart'?{wave:'triangle',f:45+speed*8,gain:.012}:{wave:'noise',cutoff:310,gain:.014};scale=Math.min(1,speed/3);}
  const gain=distanceGain(p,game.player)*scale;if(!recipe||gain<.002)return [];
  return [{key:`${p.kind}:${p.id}`,recipe,gain,distance:Math.hypot(p.x-game.player.x,p.z-game.player.z)}];
 }).sort((a,b)=>a.distance-b.distance).slice(0,SOUND_LIMITS.loops);
}
export class SoundEngine{
 constructor({context=null,createContext=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)()}={}){
  this.context=context;this.createContext=createContext;this.enabled=Boolean(context);this.voices=new Set();this.loops=new Map();this.recent=new Map();this.stats={played:0,dropped:0,peakVoices:0,cues:{}};if(context)this._connect();
 }
 _connect(){const c=this.context;this.master=c.createGain();this.master.gain.value=handheld()?MASTER_GAIN.mobile:MASTER_GAIN.desktop;this.compressor=c.createDynamicsCompressor();this.compressor.threshold.value=-16;this.compressor.ratio.value=5;this.master.connect(this.compressor);this.compressor.connect(c.destination);const n=c.sampleRate;this.noise=c.createBuffer(1,n,c.sampleRate);const data=this.noise.getChannelData(0);let seed=1234567;for(let i=0;i<n;i++){seed=(1664525*seed+1013904223)>>>0;data[i]=seed/2147483648-1;}}
 async setEnabled(value){
  const ticket=this.toggleRevision=(this.toggleRevision??0)+1;
  if(!value){this.enabled=false;this.reset();return false;}
  try{if(!this.context){this.context=this.createContext();this._connect()}if(this.context.state==='suspended')await this.context.resume();if(ticket!==this.toggleRevision)return this.enabled;this.enabled=true;this.lastError=null;return true}catch(e){if(ticket!==this.toggleRevision)return this.enabled;this.lastError=String(e);this.enabled=false;this.reset();return false;}
 }
 _dispose(v){if(v.disposed)return;v.disposed=true;this.voices.delete(v);for(const n of [v.source,v.filter,v.gain])try{n?.disconnect()}catch{}}
 _stop(v,fade=0){if(v.disposed)return;const now=this.context.currentTime;v.gain.gain.cancelScheduledValues(now);if(fade){v.gain.gain.setTargetAtTime(0,now,.004)}else v.gain.gain.setValueAtTime(0,now);try{v.source.stop(now+fade)}catch{}if(!fade)this._dispose(v);}
 reset(){for(const v of [...this.voices])this._stop(v);this.loops.clear();this.recent.clear();}
 _voice(spec,volume,priority=1,loop=false){
  if(!this.enabled||!this.context||this.context.state==='closed')return null;
  if(this.voices.size>=SOUND_LIMITS.voices){const victim=[...this.voices].find(v=>v.priority<priority);if(!victim){this.stats.dropped++;return null;}if(victim.loopKey)this.loops.delete(victim.loopKey);this._stop(victim);}
  const c=this.context,source=spec.wave==='noise'?c.createBufferSource():c.createOscillator(),gain=c.createGain(),at=c.currentTime+(spec.at||0),duration=spec.duration||.15;
  let filter;if(spec.wave==='noise'){source.buffer=this.noise;source.loop=loop;filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=spec.cutoff||1200;source.connect(filter);filter.connect(gain)}else{source.type=spec.wave||'sine';source.frequency.setValueAtTime(spec.f,at);if(!loop)source.frequency.exponentialRampToValueAtTime(Math.max(20,spec.to||spec.f),at+duration);source.connect(gain)}
  gain.connect(this.master);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(spec.gain*volume,at+.006);
  if(!loop){gain.gain.exponentialRampToValueAtTime(.00001,at+duration);/* Stop is scheduled after start below. */}
  const v={source,gain,filter,priority,disposed:false};source.onended=()=>this._dispose(v);this.voices.add(v);source.start(at);if(!loop)source.stop(at+duration+.01);this.stats.peakVoices=Math.max(this.stats.peakVoices,this.voices.size);return v;
 }
 play(cue,{source=null,player={x:0,z:0},id='global',priority=1,volume=1,force=false}={}){
  if(!this.enabled||!this.context||!SOUND_CUES[cue])return false;
  const gain=distanceGain(source,player)*volume,key=`${id}:${cue}`,now=this.context.currentTime;
  if(gain<.002||(!force&&now-(this.recent.get(key)??-Infinity)<SOUND_LIMITS.cooldown)){this.stats.dropped++;return false;}
  this.recent.set(key,now);if(this.recent.size>256)this.recent.delete(this.recent.keys().next().value);
  let played=false;for(const spec of SOUND_CUES[cue])played=Boolean(this._voice(spec,gain,priority))||played;
  if(played){this.stats.played++;this.stats.cues[cue]=(this.stats.cues[cue]||0)+1;}return played;
 }
 tone(f,duration=.1){return Boolean(this._voice({f,to:f,duration,wave:'sine',gain:.035},1,3))}
 handle(e,game){
  if(game.state!=='playing')return false;
  const cue=e.kind==='sound'?e.cue:e.kind==='interact'?e.action:null;if(!cue)return false;
  // These are driven by their real sub-events or movement, not a generic activation beep.
  if(e.kind==='interact'&&['domino','rainbow','duck','ball'].includes(cue))return false;
  return this.play(cue,{source:e,player:game.player,id:e.id,priority:['bell','rainbow','reward','bloom'].includes(cue)?2:1,volume:e.volume??1});
 }
 sync(game){
  if(this.revision!==game.sceneRevision||this.state!==game.state){this.reset();this.revision=game.sceneRevision;this.state=game.state;}
  if(!this.enabled||!this.context||game.state!=='playing')return;
  const wanted=soundLoops(game),keys=new Set(wanted.map(x=>x.key));
  for(const [key,v]of this.loops)if(!keys.has(key)){this.loops.delete(key);this._stop(v,.015)}
  for(const row of wanted){let v=this.loops.get(row.key);if(!v){v=this._voice(row.recipe,row.gain,0,true);if(!v)continue;v.loopKey=row.key;this.loops.set(row.key,v)}v.gain.gain.setTargetAtTime(row.recipe.gain*row.gain,this.context.currentTime,.03);if(v.source.frequency&&row.recipe.f)v.source.frequency.setTargetAtTime(row.recipe.f,this.context.currentTime,.03);}
 }
 snapshot(){return {...this.stats,cues:{...this.stats.cues},enabled:this.enabled,contextState:this.context?.state??'uninitialized',activeVoices:this.voices.size,activeLoops:this.loops.size,lastError:this.lastError??null}}
}
