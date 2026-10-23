import {SlingshotGame} from './game.js';
import {Renderer} from './render.js';
import {ARENAS,AMMO} from './content.js';
import {createAdventureBridge} from './adventure-bridge.js';
import {readCloudHandoff,arriveFromSea} from './sea-cloud-transition.js';
const handoff=readCloudHandoff();let entering=Boolean(handoff);
const $=id=>document.getElementById(id),canvas=$('game'),game=new SlingshotGame(window.Matter),renderer=new Renderer(canvas);renderer.resize();
await renderer.targets.ready.catch(()=>{});
let pointer=null,last=performance.now(),sound=true,audio=null,modalState='',record=0,lastUI='';
let adventureElapsed=0;
const adventure=createAdventureBridge({level:4,pause,resume,isActive:()=>!game.paused&&!['won','lost'].includes(game.phase),snapshot:()=>({score:game.total+game.score}),setSound:on=>{sound=on;$('sound').textContent=`音效 ${sound?'开':'关'}`;$('sound').setAttribute('aria-pressed',String(sound));}});
adventure.started();
try{record=Number(localStorage.getItem('naidan-cloud-best-v1'))||0;}catch{}
function tone(event){if(!sound)return;try{audio??=new AudioContext();audio.resume();const o=audio.createOscillator(),v=audio.createGain();o.connect(v);v.connect(audio.destination);o.type=event==='explosion'?'sawtooth':'sine';const t=audio.currentTime;o.frequency.setValueAtTime(({launch:500,break:180,enemy:740,explosion:95,win:880,lose:160})[event]||320,t);o.frequency.exponentialRampToValueAtTime(event==='launch'?150:250,t+.16);v.gain.setValueAtTime(.045,t);v.gain.exponentialRampToValueAtTime(.001,t+.2);o.start(t);o.stop(t+.21);}catch{}}
function release(){if(pointer!==null){const id=pointer;pointer=null;try{canvas.releasePointerCapture(id);}catch{}}}
function pause(){if(entering)return;release();game.pause();if(game.paused){audio?.suspend();showModal('paused');}}
function resume(){if(entering)return;game.resume();$('modal').hidden=true;modalState='';audio?.resume();last=performance.now();updateUI();}
function resetCamera(){renderer.inspect=false;renderer.camera=0;$('inspect').textContent='查看要塞 →';}
function restart(){adventure.started();release();game.retry();resetCamera();modalState='';$('modal').hidden=true;audio?.resume();updateUI();}
canvas.addEventListener('pointerdown',e=>{if(entering||e.button!==0||pointer!==null||!$('modal').hidden||!renderer.targets.loaded)return;if(game.beginAim(renderer.point(e.clientX,e.clientY))){pointer=e.pointerId;canvas.setPointerCapture(pointer);e.preventDefault();audio?.resume();}});
canvas.addEventListener('pointermove',e=>{if(pointer===e.pointerId){game.moveAim(renderer.point(e.clientX,e.clientY));e.preventDefault();}});
canvas.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;game.moveAim(renderer.point(e.clientX,e.clientY));game.launch();release();updateUI();});
for(const kind of ['pointercancel','lostpointercapture'])canvas.addEventListener(kind,e=>{if(e.pointerId===pointer){game.cancelAim();release();}});
window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('resize',()=>{game.cancelAim();release();renderer.resize();});window.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();game.paused?resume():pause();}});
$('pause').onclick=()=>game.paused?resume():pause();$('retry').onclick=restart;$('modal-retry').onclick=restart;
const inspect=document.createElement('button');inspect.id='inspect';inspect.textContent='查看要塞 →';inspect.className='inspect';document.querySelector('.playfield').append(inspect);inspect.onclick=()=>{if(game.paused||!['ready','aiming'].includes(game.phase))return;release();game.cancelAim();renderer.inspect=!renderer.inspect;inspect.textContent=renderer.inspect?'← 返回弹弓':'查看要塞 →';};
$('sound').onclick=()=>{sound=!sound;adventure.soundChanged(sound);$('sound').textContent=`音效 ${sound?'开':'关'}`;$('sound').setAttribute('aria-pressed',String(sound));if(!sound)audio?.suspend();else audio?.resume();};
$('continue').onclick=()=>{if(game.paused){resume();return;}if(game.phase==='won'){if(game.index===4){game.reset();adventureElapsed=0;adventure.started();}else game.next();resetCamera();modalState='';$('modal').hidden=true;lastUI='';updateUI();}};
function showModal(state){if(modalState===state)return;modalState=state;$('modal').hidden=false;const won=state==='won',final=won&&game.index===4;if(final||state==='lost')adventure.finished({won:final,score:game.total+game.score,seconds:adventureElapsed,stars:final?Math.min(game.stars,...game.results.map(r=>r.stars)):0});$('modal-tag').textContent=state==='paused'?'TAKE A BREATH':won?'FORTRESS CLEARED':'TRY A NEW ANGLE';$('modal-title').textContent=state==='paused'?'云端休息一下':final?'云端要塞全部攻破！':won?`${game.arena.name} · 已攻破`:'再试一个角度';$('modal-copy').textContent=state==='paused'?'物理、弹药与爆炸计时已暂停。':won?`本战场 ${game.score} 分 · 发射 ${game.shots} 枚 · 累计 ${game.total+game.score} 分`:'弹药已用完，还有守卫留在要塞。试试击打支撑或爆炸糖桶。';$('stars').textContent=won?'★'.repeat(game.stars)+'☆'.repeat(3-game.stars):'';$('continue').hidden=state==='lost';$('continue').textContent=state==='paused'?'继续挑战':final?'重新挑战五座要塞':'进入下一座要塞';$('modal-retry').hidden=state==='paused';if(final){record=Math.max(record,game.total+game.score);try{localStorage.setItem('naidan-cloud-best-v1',String(record));}catch{}}$('continue').focus();}
function updateUI(){const key=[game.index,game.phase,game.paused,game.score,game.shots,game.enemies.length,record,renderer.modelError,renderer.targets.error].join('|');if(key===lastUI)return;lastUI=key;$('arena-name').textContent=game.arena.name;$('hint').textContent=game.arena.subtitle;$('scene-label').textContent=`0${game.index+1} / 05 · ${game.arena.name}`;$('score').innerHTML=`${String(game.total+game.score).padStart(5,'0')} <small>分</small>`;$('enemies').textContent=game.enemies.length;$('progress').innerHTML=ARENAS.map((a,i)=>`<span class="step ${i===game.index?'active':i<game.index?'done':''}" title="${a.name}">${i<game.index?'✓':i+1}</span>`).join('');$('ammo').innerHTML=game.arena.ammo.map((a,i)=>`<span class="ammo-chip ${a} ${i<game.shots?'used':i===game.shots?'current':''}">${renderer.characters&&!renderer.characters.lost?`<img src="${renderer.characters.icon(a)}" alt="">`:''}<span>${AMMO[a].name}</span></span>`).join('');$('status').textContent=renderer.targets.error||renderer.modelError|| (game.paused?'已暂停':({ready:'准备发射',aiming:'调整角度与力度',flying:'等待连锁反应…',settling:'等待建筑落稳…',won:'要塞已攻破',lost:'再试一个角度'})[game.phase]);$('pause').textContent=game.paused?'继续':'暂停';$('record').textContent=record?`云端最佳 ${record} 分`:'五座要塞，一次云端冒险。';if(['won','lost'].includes(game.phase))showModal(game.phase);}
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;if(!entering){if(!game.paused&&!['won','lost'].includes(game.phase))adventureElapsed+=dt;game.update(dt);for(const e of new Set(game.events.splice(0)))tone(e);}renderer.render(game,game.paused||entering?0:dt);updateUI();requestAnimationFrame(frame);}updateUI();requestAnimationFrame(frame);
// Read-only access to the live model is useful for inspecting saved QA evidence.
window.cloud={game,renderer,pause,resume};
if(handoff){
 const boot=document.getElementById('sea-cloud-boot');
 if(renderer.targets.error||renderer.modelError){if(boot){boot.hidden=false;boot.querySelector('p').textContent='角色资源未能就绪，请重新加载或返回地图。';}entering=true;}
 else{const arrival=arriveFromSea({handoff,renderer,game});boot?.remove();await arrival;release();entering=false;last=performance.now();$('status').textContent='拖动奶蛋，松手发射';canvas.focus({preventScroll:true});}
}else document.getElementById('sea-cloud-boot')?.remove();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('离线缓存不可用',e.message));
