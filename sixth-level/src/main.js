import {SliceGame} from './game.js';import {Sprites} from './sprites.js';import {Renderer,PREVIEW_IDS} from './render.js';import {AudioEngine} from './audio.js';import {RULES,VERSION,BY_ID} from './content.js';
import {createAdventureBridge} from './adventure-bridge.js';
const $=id=>document.getElementById(id),canvas=$('game'),sprites=new Sprites(),audio=new AudioEngine();let game,renderer,pointer=null,best=0,last=performance.now(),lastPhase=null,ready=false;
try{best=Number(localStorage.getItem('naidan-slice-best-v034'))||0;audio.enabled=localStorage.getItem('naidan-slice-sound')!=='off';}catch{}
const adventure=createAdventureBridge({level:6,pause,resume,isActive:()=>ready&&game.phase==='playing',snapshot:()=>({score:game?.score||0}),setSound:on=>{audio.enabled=on;}});
function soundUI(){$('sound').textContent=audio.enabled?'声音 开':'声音 关';$('sound').setAttribute('aria-pressed',String(audio.enabled));$('sound').setAttribute('aria-label',audio.enabled?'关闭声音':'开启声音');}
soundUI();$('best').textContent='个人最佳 '+best;
async function unlock(){try{await audio.unlock();}catch{ $('status').textContent='浏览器暂未开启声音，仍可正常游玩';}}
function release(){game?.cancelStroke();renderer&&(renderer.trail=[]);if(pointer!==null){try{canvas.releasePointerCapture(pointer);}catch{}pointer=null;}}
function resize(){if(!ready)return;release();const r=canvas.getBoundingClientRect(),w=960,h=Math.max(400,Math.round(r.height/r.width*w));game.resize(w,h);renderer.resize(r.width,r.height);renderer.render(game);}
function pause(){if(!ready||game.phase!=='playing')return;game.pause();release();audio.stop();showState();}
function resume(){game.resume();last=performance.now();showState();}
function retry(){adventure.started();release();game.retry(Date.now());renderer.clear();$('status').textContent='按住划动切割 · 炸弹扣50分 · 连切3个起追加奖励';last=performance.now();showState();}
function showState(){
 if(!ready)return;const phase=game.phase,active=phase==='playing';$('overlay').hidden=active;$('pause').disabled=!active;$('retry').hidden=phase!=='paused';
 $('modal-rules').hidden=!['ready','paused'].includes(phase);
 if(phase==='ready'){$('modal-kicker').textContent='第六关 / v'+VERSION;$('modal-title').textContent='准备好，大显身手';$('modal-text').textContent='目标大小不同，按住划动切割。炸弹会从不同位置抛出，切中扣50分。';$('play').innerHTML='开始切切乐 <span>↗</span>';}
 if(phase==='paused'){$('modal-kicker').textContent='休息一下 / 刀锋暂歇';$('modal-title').textContent='快乐，稍后继续';$('modal-text').textContent='计时、目标与切割特效均已暂停。';$('play').innerHTML='继续挑战 <span>↗</span>';}
 if(phase==='won'||phase==='lost'){
  adventure.finished({won:phase==='won',score:game.score,seconds:game.elapsed});
  audio.stop();if(game.score>best){best=game.score;try{localStorage.setItem('naidan-slice-best-v034',String(best));}catch{}}
  $('best').textContent='个人最佳 '+best;$('modal-kicker').textContent=phase==='won'?'挑战完成 / 刀法了得':'再来一局 / 手感渐入佳境';$('modal-title').textContent=phase==='won'?'切得漂亮，通关啦！':game.finishReason==='time'?'时间到，再试一次':'刀锋偏了一点点';
  $('modal-text').textContent=`本局 ${game.score} 分 · 切中 ${game.cut} 个 · 最高 ${game.maxCombo} 连斩 · 炸弹 ${game.bombsHit} 次。`+(phase==='lost'?(game.finishReason==='time'?'达到 800 分即可通关。':'漏切累计 3 次结束，炸弹只扣分。'):'奶娃和水果一起，为你喝彩。');$('play').innerHTML='再切一局 <span>↗</span>';release();if(phase==='won')audio.play('won');
 }
 lastPhase=phase;
}
function updateHUD(){
 $('score').textContent=game.score;$('score-progress').style.width=Math.min(100,game.score/RULES.goal*100)+'%';$('time').innerHTML=Math.ceil(game.remaining)+'<small>秒</small>';$('mistakes').textContent=Array.from({length:3},(_,i)=>i<game.mistakes?'×':'●').join(' ');$('mistakes').setAttribute('aria-label',`失误${game.mistakes}次`);
 $('stage').textContent=['第一幕','第二幕','第三幕'][game.stage-1]+' · '+game.waveName;
}
$('play').onclick=async()=>{if(!ready)return;await unlock();if(game.phase==='paused')resume();else if(['won','lost'].includes(game.phase))retry();else{game.start();adventure.started();last=performance.now();showState();}};
$('pause').onclick=pause;$('retry').onclick=retry;
$('sound').onclick=async()=>{audio.enabled=!audio.enabled;adventure.soundChanged(audio.enabled);if(audio.enabled)await unlock();else audio.stop();try{localStorage.setItem('naidan-slice-sound',audio.enabled?'on':'off');}catch{}soundUI();};
const position=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*game.width,y:(e.clientY-r.top)/r.height*game.height};};
canvas.addEventListener('pointerdown',e=>{if(!ready||game.phase!=='playing'||pointer!==null||e.button!==0)return;e.preventDefault();void unlock();const p=position(e);if(game.beginStroke(p)){pointer=e.pointerId;canvas.setPointerCapture(pointer);renderer.point(p,game.elapsed);}});
canvas.addEventListener('pointermove',e=>{if(!ready||e.pointerId!==pointer||game.phase!=='playing')return;e.preventDefault();for(const p of (e.getCoalescedEvents?.().length?e.getCoalescedEvents():[e])){const point=position(p);game.moveStroke(point);renderer.point(point,game.elapsed);}});
for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>{if(e.pointerId===pointer)release();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',pause);window.addEventListener('resize',resize);
document.addEventListener('keydown',e=>{if(e.key==='Escape')pause();});
try{
 await sprites.load();game=new SliceGame({masks:sprites.masks});renderer=new Renderer(canvas,sprites);ready=true;resize();$('play').disabled=false;$('status').textContent='按住划动切割 · 炸弹扣50分 · 连切3个起追加奖励';
 for(const id of ['model-0','model-4','03-orange']){const image=new Image();image.src=sprites.images[id].toDataURL();image.alt=id==='model-0'?'原关卡奶蛋':id==='model-4'?'原关卡奶娃':'BigNaiWa水果';$('portraits').append(image);}
 for(const id of PREVIEW_IDS){const img=new Image();img.src=sprites.images[id].toDataURL();img.alt=BY_ID[id].name;img.style.setProperty('--target-diameter',String(BY_ID[id].r*2));$('size-preview').append(img);}
 $('runtime-version').textContent='运行版本 v'+VERSION;document.documentElement.dataset.runtimeVersion=VERSION;
 showState();window.slice={version:VERSION,game,renderer,sprites,pause,resume,retry,resize,audio};
 function frame(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;game.update(dt);for(const event of game.drainEvents()){renderer.event(event);audio.play(event.kind);if(event.kind==='mistake')$('status').textContent='漏切一次。等目标上升后，再一刀划过。';if(event.kind==='bomb')$('status').textContent='切中炸弹 −50 分（最低0分），连斩中断，不计漏切。';}if(lastPhase!==game.phase)showState();updateHUD();renderer.render(game,dt);requestAnimationFrame(frame);}requestAnimationFrame(frame);
}catch(error){$('modal-title').textContent='素材暂未准备好';$('modal-text').textContent=error.message;$('status').textContent='加载失败，请刷新重试';$('play').disabled=false;$('play').textContent='重新加载';$('play').onclick=()=>location.reload();console.error(error);}
if('serviceWorker'in navigator){navigator.serviceWorker.register(new URL('../sw.js',import.meta.url),{scope:'./'}).then(()=>navigator.serviceWorker.ready).then(()=>{$('offline').textContent='离线已就绪';}).catch(()=>{$('offline').textContent='在线游玩';});}
