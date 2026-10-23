// Distributed beside each game's bridge. Only a completed level-three handoff uses this module.
export const HANDOFF_KEY='naidan-sea-cloud-v1';
export const HANDOFF_TTL=60000;
const clamp=t=>Math.max(0,Math.min(1,t)),smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export function validHandoff(data,now=Date.now()){
 return data?.version===1&&Number.isFinite(data.at)&&now>=data.at&&now-data.at<HANDOFF_TTL&&typeof data.skip==='boolean';
}
export function consumeHandoff(storage,now=Date.now()){
 try{const raw=storage.getItem(HANDOFF_KEY);storage.removeItem(HANDOFF_KEY);const data=JSON.parse(raw||'null');return validHandoff(data,now)?data:null;}catch{return null;}
}
function overlay(){
 const root=document.createElement('section');root.id='sea-cloud-transition';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','从海底遗迹前往云端糖果要塞');
 root.innerHTML='<canvas aria-hidden="true"></canvas><div class="sc-controls"><button data-pause>暂停</button><button data-skip>跳过动画</button></div><div class="sc-caption" role="status" aria-live="polite"><small>DEEP BLUE → CLOUD FORTRESS</small><h2>气泡托起，向云端出发</h2><p>正在离开海底遗迹</p><button data-retry hidden>重新加载</button><button data-back hidden>返回冒险地图</button></div>';
 const style=document.createElement('style');style.textContent=`#sea-cloud-transition{position:fixed;inset:0;z-index:10000;isolation:isolate;touch-action:none;color:#fff9df;font-family:system-ui,sans-serif}#sea-cloud-transition canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.sc-controls{position:absolute;right:max(18px,env(safe-area-inset-right));top:max(18px,env(safe-area-inset-top));display:flex;gap:8px}#sea-cloud-transition button{min-height:44px;padding:10px 17px;border:1px solid #ffffff7a;border-radius:24px;background:#193f4bd9;color:#fff9df;cursor:pointer;font:600 14px system-ui}#sea-cloud-transition button:focus-visible{outline:3px solid #edcc78;outline-offset:3px}.sc-caption{position:absolute;bottom:max(38px,env(safe-area-inset-bottom));left:20px;right:20px;text-align:center;pointer-events:none;text-shadow:0 2px 18px #19424d88}.sc-caption button{pointer-events:auto}.sc-caption small{font-size:11px;letter-spacing:3px}.sc-caption h2{font-size:clamp(24px,4vw,38px);margin:12px 0}.sc-caption p{font-size:14px;margin:8px 0}.sc-caption:has([data-retry]:not([hidden])){background:#173f4dee;border-radius:24px;padding:20px}.sc-caption [hidden]{display:none!important}`;
 document.head.append(style);document.body.append(root);
 const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),title=root.querySelector('h2'),copy=root.querySelector('p'),pause=root.querySelector('[data-pause]'),skip=root.querySelector('[data-skip]');
 style.textContent+='body:has(#sea-cloud-transition) header{visibility:hidden}#sea-cloud-transition[data-mode="arrival"] .sc-caption{color:#285346;text-shadow:none;background:#fffdf0ed;border:1px solid #d9e3c9;box-shadow:0 8px 32px #193f4b18;border-radius:22px;padding:16px 18px;max-width:580px;margin:auto;bottom:max(24px,env(safe-area-inset-bottom))}#sea-cloud-transition[data-mode="arrival"] .sc-caption h2{font-size:clamp(23px,3vw,32px);margin:8px 0}#sea-cloud-transition[data-mode="arrival"] .sc-caption small{font-size:10px;letter-spacing:2px}';
 const previous=document.activeElement,blocked=[...document.body.children].filter(e=>e!==root&&e!==style).map(e=>[e,e.inert]);for(const [e]of blocked)e.inert=true;
 const state={elapsed:0,paused:false,done:false,skip:false,root};let last=performance.now(),audio=null;
 const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();toggle();}else if(e.key==='Tab'){const buttons=[...root.querySelectorAll('button')].filter(b=>!b.hidden&&!b.disabled);const i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();}};
 function toggle(){state.paused=!state.paused;pause.textContent=state.paused?'继续':'暂停';audio?.[state.paused?'suspend':'resume']();}
 pause.onclick=toggle;skip.onclick=()=>{state.skip=true;};
 const hide=()=>{if(document.hidden&&!state.paused)toggle();},blur=()=>{if(!state.paused)toggle();};
 document.addEventListener('keydown',key,true);document.addEventListener('visibilitychange',hide);window.addEventListener('blur',blur);
 pause.focus();
 return {root,state,title,copy,skip,pause,ctx,
  sound(on){if(!on)return;try{audio=new AudioContext();audio.resume().catch(()=>{});}catch{}},
  cue(freq,duration=.3,type='sine'){if(!audio||state.paused)return;try{const t=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*1.4,t+duration);g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.035,t+.025);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+duration);}catch{}},
  wash(duration,frequency){if(!audio)return;try{const b=audio.createBuffer(1,Math.ceil(audio.sampleRate*duration),audio.sampleRate),data=b.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1);const s=audio.createBufferSource(),f=audio.createBiquadFilter(),g=audio.createGain(),t=audio.currentTime;s.buffer=b;f.type='bandpass';f.frequency.value=frequency;g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(.045,t+duration*.25);g.gain.exponentialRampToValueAtTime(.001,t+duration);s.connect(f);f.connect(g);g.connect(audio.destination);s.start();}catch{}},
  run(draw){return new Promise(resolve=>{function frame(now){if(state.done)return resolve();const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;if(!state.paused)state.elapsed+=dt;const w=innerWidth,h=innerHeight,d=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(w*d)||canvas.height!==Math.round(h*d)){canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);}ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);root.dataset.elapsed=state.elapsed.toFixed(3);root.dataset.paused=String(state.paused);draw(state.elapsed,w,h);requestAnimationFrame(frame);}requestAnimationFrame(frame);});},
  destroy(){state.done=true;document.removeEventListener('keydown',key,true);document.removeEventListener('visibilitychange',hide);window.removeEventListener('blur',blur);for(const[e,inert]of blocked)e.inert=inert;root.remove();style.remove();audio?.close().catch(()=>{});if(previous?.isConnected)previous.focus();}
 };
}
function cloud(c,x,y,r,alpha=1){c.save();c.globalAlpha=alpha;c.fillStyle='#eef9ef';c.beginPath();c.ellipse(x,y,r*1.7,r*.55,0,0,7);c.ellipse(x-r*.5,y-r*.24,r*.8,r*.7,0,0,7);c.ellipse(x+r*.45,y-r*.25,r*.75,r*.8,0,0,7);c.fill();c.restore();}
function foam(c,w,h,p){c.fillStyle='#e9f8ee';c.fillRect(0,h*(1-p),w,h*p);for(let i=0;i<10;i++)cloud(c,i*w/8,h*(1-p),w/7);}
// Fetch the actual runtime graph before navigating, including the supplied target PNG.
export async function preloadCloud(target,signal){
 const root=new URL('./',target),seen=new Set();
 async function file(url){url=new URL(url,root);if(url.origin!==root.origin||!url.pathname.startsWith(root.pathname))throw Error('Unexpected preload path');if(seen.has(url.href))return;seen.add(url.href);const r=await fetch(url,{signal});if(!r.ok)throw Error('Resource unavailable: '+url.pathname);if(url.pathname.endsWith('.js')){const text=await r.text();await Promise.all([...text.matchAll(/(?:from\s*|import\s*)['"](\.\.?\/[^'"]+)['"]/g)].map(m=>file(new URL(m[1],url))));}else await r.arrayBuffer();}
 await Promise.all(['index.html','style.css','vendor/matter.js','src/main.js','assets/target-head.png'].map(f=>file(new URL(f,root))));
}
export async function departToCloud({target,snapshot,sound=true}){
 if(document.getElementById('sea-cloud-transition'))return;
 const ui=overlay(),{state,ctx:c}=ui,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,duration=reduced?.5:2.1;
 ui.sound(sound);ui.cue(320,.5);ui.wash(duration,260);let popped=false;
 const fish=new Image(),background=new Image();fish.src=snapshot.fish;background.src=snapshot.background;
 let ready=false,error=null,controller=null,attempt=0,leaving=false;
 async function load(){const ticket=++attempt;controller?.abort();controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);error=null;ui.root.querySelector('[data-retry]').hidden=true;ui.root.querySelector('[data-back]').hidden=true;ui.copy.textContent='正在准备云端要塞';try{await preloadCloud(target,controller.signal);if(ticket===attempt)ready=true;}catch(e){if(ticket===attempt)error=e;}finally{clearTimeout(timeout);}}
 ui.root.querySelector('[data-retry]').onclick=()=>void load();ui.root.querySelector('[data-back]').onclick=()=>{controller?.abort();location.href=new URL('../../index.html#level-3',import.meta.url).href;};void load();
 function navigate(){if(leaving)return;leaving=true;const data={version:1,at:Date.now(),skip:state.skip,reduced,sound};try{sessionStorage.setItem(HANDOFF_KEY,JSON.stringify(data));}catch{target.searchParams.set('sea-cloud','once');target.searchParams.set('sea-cloud-skip',String(state.skip));}ui.destroy();location.assign(target.href);}
 await ui.run((t,w,h)=>{
  const p=clamp(t/duration);ui.skip.hidden=t<.6&&!reduced;
  const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#78cdd4');g.addColorStop(1,'#103b58');c.fillStyle=g;c.fillRect(0,0,w,h);
  if(background.complete&&background.naturalWidth){c.globalAlpha=1-smooth(p/.62);c.drawImage(background,0,p*p*h*.7,w,h);c.globalAlpha=1;}
  if(!reduced){c.fillStyle='#d5fff218';for(let i=0;i<7;i++){c.beginPath();c.moveTo(w*(i/6)-80,0);c.lineTo(w*(i/6)+110,0);c.lineTo(w*(i/6)+240,h);c.lineTo(w*(i/6)+20,h);c.fill();}
   for(let i=0;i<30;i++){const x=(i*127.3)%w,y=((i*97+t*160)% (h+100))-50,r=3+i%6;c.strokeStyle='#c9ffed80';c.lineWidth=1.5;c.beginPath();c.arc(x,h-y,r,0,7);c.stroke();}
   const start=snapshot.position||{x:.5,y:.5},x=w*(start.x+(.5-start.x)*smooth(p/.5)),y=h*(start.y-(start.y-.22)*smooth(p/.85)),r=Math.min(w*.18,110)*(1-.12*p);
   if(fish.complete&&fish.naturalWidth){c.save();c.translate(x,y);c.rotate(-smooth(p)*.25);c.drawImage(fish,-r,-r,r*2,r*2);c.restore();}
   c.strokeStyle='#cefff2c9';c.lineWidth=2;c.beginPath();c.arc(x,y,r*1.18,0,7);c.stroke();c.fillStyle='#ffffff99';c.beginPath();c.ellipse(x-r*.5,y-r*.75,r*.12,r*.3,.6,0,7);c.fill();
  }
  const mask=reduced?p:smooth((p-.7)/.3);if(mask>0)foam(c,w,h,mask);if(p>.7&&!popped){popped=true;ui.cue(850,.12);}
  ui.title.textContent=p<.65?'气泡托起，向云端出发':'穿过海面，下一站云端';
  if(error&&(p>=1||state.skip)){ui.title.textContent='云端要塞尚未加载完成';ui.copy.textContent='请配置网络后重新加载，或返回冒险地图。';ui.root.querySelector('[data-retry]').hidden=false;ui.root.querySelector('[data-back]').hidden=false;ui.skip.disabled=true;}
  else if(!ready&&(p>=1||state.skip)){foam(c,w,h,1);ui.copy.textContent='正在准备云端要塞…';}
  if(ready){ui.skip.disabled=false;if((p>=1||state.skip)&&!state.paused)navigate();}
 });
}
export function readCloudHandoff(){
 const q=new URLSearchParams(location.search);if(q.get('adventure')!=='1'||q.get('level')!=='4')return null;
 let data=null;try{data=consumeHandoff(sessionStorage);}catch{}const fallback=q.get('sea-cloud')==='once';
 if(fallback){q.delete('sea-cloud');const skip=q.get('sea-cloud-skip')==='true';q.delete('sea-cloud-skip');history.replaceState(null,'',location.pathname+'?'+q);return data||{version:1,at:Date.now(),skip};}return data;
}
export async function arriveFromSea({handoff,renderer,game}){
 const ui=overlay(),{state,ctx:c}=ui,reduced=handoff.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches,duration=reduced?.5:2.1;state.skip=handoff.skip;
 ui.root.dataset.mode='arrival';ui.sound(handoff.sound);ui.cue(660,.4);ui.wash(duration,1300);ui.title.textContent='第四关 · 云端糖果要塞';ui.copy.textContent='穿云而过，落入弹弓';
 let landed=false;
 await ui.run((t,w,h)=>{
  const p=clamp(t/duration);ui.skip.hidden=t<.6&&!reduced;renderer.entryOverview=1-smooth((p-.28)/.62);
  const drop=smooth((p-.22)/.59),bounce=p>.81?Math.sin((p-.81)/.19*Math.PI)*12:0;
  renderer.entryPose={x:740+(225-740)*drop,y:-180+695*drop+bounce,r:52-29*drop,angle:(1-drop)*Math.PI*2};
  renderer.render(game,0);
  const rect=renderer.canvas.getBoundingClientRect();
  if(reduced){c.fillStyle=`rgba(233,248,238,${1-p})`;c.fillRect(0,0,w,h);}
  else{
   const opacity=1-smooth((p-.08)/.55);c.fillStyle=`rgba(233,248,238,${opacity})`;c.fillRect(0,0,w,h);
   for(let i=0;i<9;i++)cloud(c,(i%3)*w*.5+(i%2?1:-1)*p*w*.6,(Math.floor(i/3)*h*.42)-p*h*.25,w*.3,1-smooth((p-.4)/.45));
  }
  if(p>.81&&!landed){landed=true;ui.cue(230,.15);}
  if(p>.85)ui.copy.textContent='拖动奶蛋，松手发射';
  ui.root.dataset.landingX=String(rect.left+renderer.view.offsetX+(225-renderer.view.x)*renderer.view.scale);
  if((p>=1||state.skip)&&!state.paused){renderer.entryPose=null;renderer.entryOverview=0;renderer.render(game,0);ui.destroy();}
 });
}
