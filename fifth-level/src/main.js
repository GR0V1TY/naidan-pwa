import {RunnerGame} from './game.js';
import {RunnerRenderer} from './render.js';
import {RunnerAudio} from './audio.js';
import {ZONES,RULES} from './content.js';
import {createAdventureBridge} from './adventure-bridge.js';
const $=id=>document.getElementById(id),game=new RunnerGame(),audio=new RunnerAudio();let renderer,shownPhase='',toastLeft=0,previous=performance.now(),lastZone=0,best={score:0,unlocked:false};
const adventure=createAdventureBridge({level:5,pause,resume,isActive:()=>!game.paused&&['playing','countdown'].includes(game.phase),snapshot:()=>({score:game.score}),setSound:on=>{audio.enabled=on;$('sound').textContent=on?'♪':'♩';$('sound').setAttribute('aria-pressed',String(on));}});
try{best={...best,...JSON.parse(localStorage.getItem('naidan-metro-best-v1')||'{}')};}catch{}
function save(){best.score=Math.max(best.score,game.score);if(game.phase==='won')best.unlocked=true;try{localStorage.setItem('naidan-metro-best-v1',JSON.stringify(best));}catch{}}
function toast(text){$('toast').textContent=text;$('toast').hidden=false;toastLeft=2.3;}
function prepare(mode='story'){
 if(mode==='endless'&&!best.unlocked)return;game.mode=mode;game.reset();game.start();audio.unlock();shownPhase='';lastZone=0;$('modal').hidden=true;document.body.classList.add('playing');$('intro').hidden=true;$('stats').hidden=false;$('chase').hidden=false;$('pause').disabled=false;
 adventure.started();
}
function home(){audio.stop();game.mode='story';game.reset();shownPhase='';$('modal').hidden=true;document.body.classList.remove('playing','danger','smashing');$('intro').hidden=false;$('stats').hidden=true;$('chase').hidden=true;$('pause').disabled=true;$('endless').hidden=!best.unlocked;$('best').textContent=best.score?`最佳 ${best.score.toLocaleString()} 分${best.unlocked?' · 无尽模式已解锁':''}`:'首次挑战 · 到达终点解锁无尽模式';}
function pause(){game.pause();if(game.paused){audio.stop();showModal('pause');}}
function resume(){if(renderer?.lost)return;game.resume();$('modal').hidden=true;previous=performance.now();}
function showModal(type){$('modal').hidden=false;$('continue').hidden=type!=='pause';$('retry').textContent=type==='win'?'再跑一次':'重新挑战';$('result').hidden=type==='pause';
 const data=type==='pause'?['TAKE A BREATH','稍作休息','轨道与追击已经暂停。']:type==='win'?['NEXT STOP · FREEDOM','成功抵达！','甩开追击，带着奶糖到达终点。无尽模式已解锁。']:['ONE MORE RUN','被追上啦','危险期内再次碰撞。换个节奏，再跑一次。'];
 [$('modal-eyebrow').textContent,$('modal-title').textContent,$('modal-copy').textContent]=data;
 if(type!=='pause')$('result').innerHTML=`<span>奶糖<strong>${game.coins}</strong></span><span>跑过<strong>${Math.floor(game.distance)} m</strong></span><span>积分<strong>${game.score}</strong></span>`;
 $('continue').hidden?$('retry').focus():$('continue').focus();
}
function event(e){audio.play(e.type);if(e.type==='hit')toast('她追上来了！安全奔跑 8 秒拉开距离');if(e.type==='shieldBreak')toast('护盾抵消了一次碰撞');if(e.type==='power')toast(({shield:'获得护盾 · 抵消一次碰撞',magnet:'奶糖磁铁 · 持续 9 秒',double:'双倍奶糖积分 · 持续 9 秒',smash:'奶蛋冲破！前方同车道障碍可击碎 · 8 秒'})[e.power]);if(e.type==='smashEnd')toast('变身结束 · 1 秒保护');if(e.type==='speedWarning')toast(`即将加速 · 准备进入阶段 ${e.stage}`);if(e.type==='speedStage')toast(`阶段 ${e.stage} · ${e.name}！`);if(['win','lose'].includes(e.type)){adventure.finished({won:e.type==='win',score:game.score,seconds:game.elapsed});save();showModal(e.type);}}
function ui(dt){
 const pace=game.speedInfo;$('speed-hud').hidden=game.phase==='ready';$('speed-hud').dataset.stage=String(pace.stage+1);$('speed-hud').classList.toggle('warning',pace.warning);$('speed-hud').classList.toggle('accelerating',pace.transitioning);$('speed-stage').textContent=`阶段 ${pace.stage+1} / 3 · ${pace.name}`;$('speed-value').textContent=`${(pace.speed/RULES.speed).toFixed(2)}×`;$('speed-note').textContent=pace.warning?`即将加速 · ${Math.ceil(pace.warningSeconds)}s`:pace.transitioning?'提速中…':'稳定速度';
 $('zone').textContent=game.mode==='endless'?`${ZONES[game.zone].name} · 无尽`:ZONES[game.zone].name;$('distance').textContent=`${Math.floor(game.distance)} m`;$('progress').style.width=`${game.mode==='story'?game.elapsed/RULES.duration*100:100}%`;
 $('coins').textContent=game.coins;$('score').textContent=game.score.toLocaleString();$('countdown').hidden=game.phase!=='countdown';if(game.phase==='countdown')$('countdown').textContent=Math.ceil(game.countdown)||'跑！';
 document.body.classList.toggle('danger',game.danger>0);$('chase-label').textContent=game.danger>0?'她追近了！':'安全距离';$('chase-time').textContent=game.danger>0?`再坚持 ${Math.ceil(game.danger)} 秒`:'保持节奏';$('chase-fill').style.height=`${game.danger>0?95:25}%`;
 $('chase').hidden=game.chaseVisibility<=0;document.body.classList.toggle('smashing',game.smash>0);
 $('powers').innerHTML=[game.smash>0?`<span class="power power-smash${game.smash<2?' expiring':''}">奶蛋冲破 ${Math.ceil(game.smash)}s</span>`:'',game.shield?'<span class="power">护盾 ×1</span>':'',game.magnet>0?`<span class="power">磁铁 ${Math.ceil(game.magnet)}s</span>`:'',game.double>0?`<span class="power">双倍 ${Math.ceil(game.double)}s</span>`:''].join('');
 if(toastLeft>0&&!game.paused){toastLeft-=dt;if(toastLeft<=0)$('toast').hidden=true;}
 if(game.zone!==lastZone){lastZone=game.zone;toast(`下一站 · ${ZONES[game.zone].name}`);}
 if(game.phase!==shownPhase){shownPhase=game.phase;if(game.phase==='playing')$('countdown').hidden=true;}
}
$('start').onclick=()=>prepare();$('endless').onclick=()=>prepare('endless');$('pause').onclick=()=>game.paused?resume():pause();$('continue').onclick=resume;$('retry').onclick=()=>prepare(game.mode);$('home').onclick=home;
$('sound').onclick=()=>{audio.enabled=!audio.enabled;adventure.soundChanged(audio.enabled);$('sound').setAttribute('aria-pressed',String(audio.enabled));$('sound').textContent=audio.enabled?'♪':'♩';if(audio.enabled)audio.unlock();else audio.stop();};
const keys={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump',ArrowDown:'slide',KeyS:'slide'};
window.addEventListener('keydown',e=>{if(keys[e.code]){if(/^(BUTTON|A|INPUT|SELECT)$/.test(e.target.tagName)&&e.target.offsetParent!==null)return;e.preventDefault();if(!e.repeat)game.action(keys[e.code]);}if(e.code==='Escape'){e.preventDefault();game.paused?resume():pause();}});
let touch=null;const canvas=$('world');
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||game.phase!=='playing'||game.paused)return;touch={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointerup',e=>{if(!touch||e.pointerId!==touch.id)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;touch=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;game.action(Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'jump':'slide');});
canvas.addEventListener('pointercancel',()=>{touch=null;});canvas.addEventListener('lostpointercapture',()=>{touch=null;});
window.addEventListener('blur',()=>{touch=null;pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){touch=null;pause();}});
if(matchMedia('(pointer:coarse)').matches)$('control-tip').textContent='← → 左右滑换道　↑ 上滑跳跃　↓ 下滑滚动';
try{renderer=new RunnerRenderer(canvas);renderer.onLost=()=>{pause();$('error').textContent='三维图形暂时中断，游戏已暂停；恢复后可继续。';$('error').hidden=false;};renderer.onRestore=()=>{$('error').hidden=true;};home();
 window.runner={game,renderer,audio,pause,resume,prepare,home,ui,best,manual:false};
 function frame(now){const dt=Math.min(.1,(now-previous)/1000);previous=now;if(!window.runner.manual)game.update(dt);game.drainEvents().forEach(event);ui(window.runner.manual?0:dt);renderer.render(game);requestAnimationFrame(frame);}requestAnimationFrame(frame);
}catch(e){$('error').textContent=e.message;$('error').hidden=false;$('start').disabled=true;console.error(e);}
if('serviceWorker'in navigator&&(location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname))){navigator.serviceWorker.register('./sw.js').then(async()=>{await navigator.serviceWorker.ready;const poll=async()=>{const keys=await caches.keys();const cache=keys.find(k=>k.startsWith('naidan-metro-v034-'));if(cache)$('offline').textContent='离线资源已就绪';};await poll();navigator.serviceWorker.addEventListener('controllerchange',poll);}).catch(()=>{$('offline').textContent='离线缓存未就绪，请重开检查';});}else $('offline').textContent='在线游玩 · 安装与离线需 HTTPS / 本机';
