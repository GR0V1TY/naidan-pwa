import {initPwa} from './pwa.js';
import {SoundEngine} from './sound-engine.js';
import {toLevel} from './levels.js';
import {Game,STAGES,DASH} from './game.js';
import {Renderer} from './render.js';
import {Diagnostics} from './diagnostics.js';
import {SeaGame} from './sea-game.js';
import {SeaRenderer} from './sea-render.js';
import {SeaPortalBackdrop} from './sea-vortex.js';
import {SEA_ZONES,SEA_GROWTH_XP} from './sea-content.js';
import {createAdventureBridge} from './adventure-bridge.js';
import {departToCloud} from './sea-cloud-transition.js';
export {game,diagnostics,soundEngine};
export function currentSea(){return sea}
const soundEngine=new SoundEngine();
const $=id=>document.getElementById(id),game=new Game();let renderer,sea=null,seaRenderer=null,scene='land',finishWin=false,lastEndReason='';
const seaBackdrop=new SeaPortalBackdrop($('portal-vortex'));
let portalRenderer=null;
const diagnostics=new Diagnostics({game,canvas:$('world'),getRenderer:()=>renderer,onContextLost:()=>pause()});
diagnostics.soundSnapshot=()=>soundEngine.snapshot();
try{renderer=new Renderer($('world'))}catch(e){$('unsupported').hidden=false;$('start').disabled=true;diagnostics.recordError('webgl-init',e.message);console.error(e)}
const keys=new Set(),joy={x:0,z:0},pointer={id:null},storageKey='naidan-campaign-v1';let sound=true,last=performance.now(),toastTimer,saveWarning=false;
let record={score:0,count:0,fastest:null};try{record={...record,...JSON.parse(localStorage.getItem(storageKey)||JSON.stringify({...JSON.parse(localStorage.getItem('naidan-town-v1')||'{}'),fastest:null}))}}catch{saveWarning=true}
function recordLabel(){$('record').textContent=`最高纪录 ${Number(record.score)||0} 分`}recordLabel();
const activeGame=()=>scene==='sea'&&sea?sea:game;
function clearInput(){keys.clear();joy.x=joy.z=0;pointer.id=null;$('stick').style.transform='translate(0,0)'}
function tone(freq,duration=.1){soundEngine.tone(freq,duration)}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),1800)}
// Sound defaults to ON; the first user gesture (出发/重试/继续) is what unlocks the AudioContext.
function updateSoundButton(){const b=$('sound');b.textContent=`音效 ${sound?'开':'关'}`;b.setAttribute('aria-label',sound?'关闭音效':'开启音效')}
async function enableSound(){if(!sound)return false;const ok=await soundEngine.setEnabled(true);if(!ok){sound=false;if(soundEngine.lastError)diagnostics.recordError('audio-init',soundEngine.lastError)}updateSoundButton();return ok}
updateSoundButton();
const adventureQuery=new URLSearchParams(location.search),campaignFromSecond=adventureQuery.get('adventure')==='1'&&adventureQuery.get('mode')==='campaign'&&adventureQuery.get('start')==='2',singleChallenge=adventureQuery.get('adventure')==='1'&&adventureQuery.get('mode')==='single',selectedLevel=Math.max(1,Math.min(3,Number(adventureQuery.get('level'))||1));
const adventure=createAdventureBridge({level:()=>activeGame().levelIndex+1,pause,resume,isActive:()=>['playing','transition'].includes(activeGame().state),snapshot:()=>({score:activeGame().score-(activeGame().levelCheckpoint?.score||0)}),setSound:on=>{sound=on;updateSoundButton();},nextTransition:(target,on)=>{clearInput();soundEngine.reset();const snapshot=seaRenderer.transitionSnapshot(sea);$('modal').hidden=true;return departToCloud({target,snapshot,sound:on});}});
if(singleChallenge){$('intro').querySelector('h1').innerHTML=['奶油城堡，<br>大大胃口。','糖果森林，<br>探索遗迹。','海底遗迹，<br>向深海出发。'][selectedLevel-1];$('intro').querySelector('p').textContent='独立挑战 · 从本关初始状态开始';$('start').innerHTML='开始第'+selectedLevel+'关 <span>↗</span>';$('intro').querySelector('.eyebrow').textContent='ADVENTURE / 第 '+selectedLevel+' 关';$('intro').querySelector('.intro-foot span').textContent='单关挑战 · 4分钟';}
function showLandScene(){
 scene='land';sea=null;$('sea').hidden=true;$('world').hidden=false;document.body.classList.remove('sea','sea-danger');diagnostics.game=game;diagnostics.canvas=$('world');
}
function start(){
 if(diagnostics.contextLost||diagnostics.needsReload){toast('图形环境已中断，请刷新页面后继续。');return}
 clearInput();soundEngine.reset();sea=null;showLandScene();game.reset(42);game.start();soundEngine.sync(game);diagnostics.onStart();finishWin=false;lastEndReason='';
 if(campaignFromSecond)game.loadLevel(1);if(singleChallenge){if(selectedLevel===2)game.loadLevel(1);game.singleChallenge=true;if(selectedLevel===3){game.enterSea({score:0,count:0,totalElapsed:0,summaries:[]},null);switchToSea();}}
 adventure.started();
 $('intro').hidden=true;$('modal').hidden=true;$('hud').hidden=false;$('pause').disabled=false;$('pause').innerHTML='暂停 <kbd>Esc</kbd>';$('portal-overlay').hidden=true;seaBackdrop.reset();if(portalRenderer)portalRenderer.portalActive=false;
 document.body.classList.add('playing');document.body.classList.toggle('sea',scene==='sea');
 void enableSound().then(ok=>{if(ok)tone(440)});toast(singleChallenge?'第'+selectedLevel+'关 · 独立挑战':'三关旅程：城堡 → 森林 → 海底遗迹');
}
function pause(){
 const g=activeGame();if(!['playing','transition'].includes(g.state))return;
 g.pause();soundEngine.reset();diagnostics.metrics.previous=null;diagnostics.event('pause');clearInput();
 $('modal-tag').textContent='TAKE A LITTLE BREAK';$('modal-title').textContent='休息一下';
 $('modal-copy').textContent=scene==='sea'?'游动、鱼群、生命、无敌和所有计时已冻结。准备好了再潜入深海。':'时间和吞噬进度已冻结。准备好了再继续。';
 $('resume').hidden=false;$('resume').innerHTML='继续'+(scene==='sea'?'下潜':'开饭')+' <span>↗</span>';$('modal').hidden=false;$('pause').textContent='继续';document.body.classList.remove('playing');
}
function resume(){
 if(diagnostics.contextLost||diagnostics.needsReload){toast('图形环境已中断，请刷新页面后继续。');return}
 const g=activeGame();if(g.state!=='paused')return;
 g.resume();void enableSound();soundEngine.sync(g);diagnostics.metrics.previous=null;diagnostics.event('resume');clearInput();
 $('modal').hidden=true;$('pause').innerHTML='暂停 <kbd>Esc</kbd>';document.body.classList.toggle('playing',g.state==='playing');
}
function summaryText(g){
 const rows=(g.levelSummaries||[]).map(s=>`第${s.level}关 ${s.name}：${s.score} 分 / ${s.count} 件 / ${Math.round(s.seconds)} 秒${s.win===false?'（未完成）':''}`).join('；');
 return rows?`；${rows}`:'';
}
function finish(win){
 const g=activeGame();soundEngine.reset();finishWin=win;clearInput();
 adventure.finished({won:win,score:g.score-(g.levelCheckpoint?.score||0),seconds:g.elapsed});
 if(!singleChallenge){record.score=Math.max(Number(record.score)||0,g.score);record.count=Math.max(Number(record.count)||0,g.count);
 if(win)record.fastest=Math.min(Number(record.fastest)||Infinity,g.campaignElapsed);
 try{localStorage.setItem(storageKey,JSON.stringify(record))}catch{saveWarning=true}}recordLabel();
 const stageName=scene==='sea'?g.stageName:STAGES[g.stage].name;
 $('modal-tag').textContent=win?'SEA COMPLETE / ★ ★ ★':'GOOD APPETITE / '+('★ '.repeat(Math.max(1,Math.ceil((g.stage+1)/2))));
 $('modal-title').textContent=win?(singleChallenge?'本关挑战完成！':'三关挑战完成！'):'这顿吃得真开心';
 const failNote=!win&&scene==='sea'?(lastEndReason==='timeout'?'第三关超时，海底遗迹重新沉入黑暗。':lastEndReason==='lives'?'第三关生命耗尽，被深海鱼群赶了回来。':'第三关挑战结束。'):'';
 $('modal-copy').textContent=`三关累计 ${g.score} 分 · 吞噬 ${g.count} 件 · ${win?`总用时 ${Math.round(g.campaignElapsed)} 秒 · `:''}最终形态 ${stageName}。${failNote}${summaryText(g)}${saveWarning?'当前环境无法保存本地纪录。':''}`;
 if(singleChallenge)$('modal-copy').textContent=`本关 ${g.score} 分 · 吞噬 ${g.count} 件 · 用时 ${Math.round(g.elapsed)} 秒。${failNote}${saveWarning?'当前环境无法保存本地纪录。':''}`;
 $('resume').hidden=true;$('restart').textContent='从第一关重新开始';$('retry').textContent='重试第'+(g.levelIndex+1)+'关';$('modal').hidden=false;$('pause').disabled=true;document.body.classList.remove('playing');tone(win?880:330,.3);
 if(singleChallenge)$('restart').textContent='重新开始本关';
}
function switchToSea(){
 const carry=game.seaCarry||{score:game.score,count:game.count,totalElapsed:game.campaignElapsed,summaries:game.levelSummaries.map(s=>({...s}))};
 sea=new SeaGame({seed:game.seed,carry});sea.start();scene='sea';
 if(!seaRenderer){try{seaRenderer=new SeaRenderer($('sea'))}catch(e){diagnostics.recordError('canvas2d-init',e.message);console.error(e);toast('当前浏览器未能启用第三关画布，前两关仍可游玩。')}}
 $('world').hidden=true;$('sea').hidden=false;document.body.classList.add('sea');document.body.classList.remove('sea-danger');
 diagnostics.game=sea;diagnostics.canvas=$('sea');
 clearInput();soundEngine.reset();soundEngine.sync(sea);diagnostics.onStart();finishWin=false;lastEndReason='';
 $('portal-overlay').hidden=true;seaBackdrop.reset();if(portalRenderer)portalRenderer.portalActive=false;$('pause').disabled=false;$('pause').innerHTML='暂停 <kbd>Esc</kbd>';document.body.classList.add('playing');
 toast('第三关：海底遗迹 · 五区连续深海');tone(660,.3);
}
function retryCurrent(){
 void enableSound();clearInput();soundEngine.reset();
 if(scene==='sea'&&sea){sea.retryLevel();soundEngine.sync(sea);diagnostics.game=sea;diagnostics.canvas=$('sea')}
 else{game.retryLevel();soundEngine.sync(game);showLandScene()}
 diagnostics.onStart();finishWin=false;lastEndReason='';$('intro').hidden=true;$('modal').hidden=true;$('hud').hidden=false;$('pause').disabled=false;$('pause').innerHTML='暂停 <kbd>Esc</kbd>';document.body.classList.add('playing');toast('重新挑战第'+(activeGame().levelIndex+1)+'关');
 adventure.started();
}
$('retry').onclick=retryCurrent;$('start').onclick=start;$('restart').onclick=start;$('resume').onclick=resume;$('pause').onclick=()=>activeGame().state==='paused'?resume():pause();
$('sound').onclick=async()=>{sound=!sound;adventure.soundChanged(sound);if(sound)await enableSound();else await soundEngine.setEnabled(false);updateSoundButton();const g=activeGame();if(sound&&['ready','playing'].includes(g.state))tone(660);if(soundEngine.lastError)diagnostics.recordError('audio-init',soundEngine.lastError)};
function movementInput(){const sx=joy.x+(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),sy=joy.z+(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);return {x:(sx+sy)*Math.SQRT1_2,z:(sy-sx)*Math.SQRT1_2}}
function swimInput(){
 const sx=joy.x+(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),sy=joy.z+(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
 const len=Math.hypot(sx,sy);return len>1?{x:sx/len,y:sy/len}:{x:sx,y:sy};
}
function triggerDash(){if(diagnostics.contextLost||diagnostics.needsReload)return;activeGame().requestDash(scene==='sea'?swimInput():movementInput())}
function editing(target){return target instanceof Element&&Boolean(target.closest('input,textarea,select,[contenteditable="true"]'))}
window.addEventListener('keydown',e=>{if(editing(e.target))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Escape'].includes(e.key))e.preventDefault();if(e.code==='Space'||e.key===' '){if(!e.repeat)triggerDash();return}if((e.key==='e'||e.key==='E')&&!e.repeat&&scene==='sea'){sea?.requestInteract();return}if(e.key==='Escape'&&!e.repeat){const g=activeGame();g.state==='playing'?pause():resume();return}if(activeGame().state==='playing')keys.add(e.key.toLowerCase())});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{soundEngine.reset();clearInput();pause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){soundEngine.reset();clearInput();pause()}});
const dashButton=$('dash');dashButton.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();triggerDash()});dashButton.addEventListener('click',e=>{if(e.detail===0)triggerDash()});
const interactButton=$('interact-sea');interactButton.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();sea?.requestInteract()});interactButton.addEventListener('click',e=>{if(e.detail===0)sea?.requestInteract()});
const joystick=$('joystick');function setJoy(e){const r=joystick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.hypot(dx,dy),max=32,factor=len>max?max/len:1;joy.x=dx*factor/max;joy.z=dy*factor/max;$('stick').style.transform=`translate(${dx*factor}px,${dy*factor}px)`}
joystick.addEventListener('pointerdown',e=>{if(activeGame().state!=='playing'||pointer.id!==null)return;pointer.id=e.pointerId;joystick.setPointerCapture(e.pointerId);setJoy(e)});joystick.addEventListener('pointermove',e=>{if(e.pointerId===pointer.id)setJoy(e)});for(const event of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(event,e=>{if(e.pointerId===pointer.id)clearInput()});
function areaChips(names,current,open){
 document.querySelectorAll('[data-area]').forEach((el,i)=>{
  el.dataset.state=i===current?'current':open(i)?'open':'locked';
  el.title=names[i]||'';
  el.textContent=`${i+1} ${names[i]||''}`;
 });
}
function updateUI(){
 const s=game.stage,low=STAGES[s].xp,high=STAGES[s+1]?.xp,pct=high?(game.xp-low)/(high-low):1;
 $('stage-label').textContent=`关卡 ${game.levelIndex+1}/3 · STAGE 0${s+1}/05`;$('stage-name').textContent=STAGES[s].name;
 $('growth').style.width=`${Math.min(100,pct*100)}%`;$('growth-text').textContent=high?`${Math.min(game.xp-low,high-low)} / ${high-low} · 吞噬即可成长`:'最终形态 · 吞噬'+game.level.landmark;
 const sec=Math.ceil(game.time);$('time').textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;$('score').textContent=`${game.score} 分 · ${game.count} 件`;
 $('lives').hidden=true;$('lives').textContent='';
 const town=game.getAreaAt(game.player.x,game.player.z);
 $('mission-text').textContent=s===4?'终极目标：返回'+game.areaDefinitions[0].name+'，吞噬'+game.level.landmark:'吞噬成长，升级让四面边界墙向外扩展';
 $('map-size').textContent=`${town?.name||'小镇'} · ${game.openAreas}/5圈 · ${Math.round(game.extent.maxX-game.extent.minX)}×${Math.round(game.extent.maxZ-game.extent.minZ)}${game.expansion?' · 展开中':''} · ${game.inWater()?'浅水 · ':''}速度上限 ${(game.config.speed*game.surfaceSpeed(game.player.x,game.player.z)).toFixed(1)}`;
 areaChips(game.areaDefinitions.map(a=>a.name),town?.id??-1,i=>Boolean(game.areaDefinitions[i]&&game.isIntroduced({x:game.areaDefinitions[i].x,z:game.areaDefinitions[i].z})));
 $('target').hidden=!game.target||game.state!=='playing';if(game.target){$('target-label').textContent=`吞噬 ${game.target.type.name}`;$('target-progress').style.width=`${Math.min(100,game.target.progress*100)}%`}
}
function updateSeaUI(){
 if(!sea)return;const s=sea.stage,zone=sea.zone,prox=sea.proximity,g=sea.growth;
 $('stage-label').textContent=`关卡 3/3 · 深海 0${zone.id+1}/05`;$('stage-name').textContent=sea.stageName;
 $('growth').style.width=`${Math.min(100,g.pct*100)}%`;
 $('growth-text').textContent=g.max?`最终形态 · 吞噬${sea.level.landmark}`:`${sea.xp} / ${SEA_GROWTH_XP[s+1]} · 嘴部吞噬成长`;
 const sec=Math.ceil(sea.time);$('time').textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;$('score').textContent=`${sea.score} 分 · ${sea.count} 件`;
 $('lives').hidden=false;$('lives').textContent=`生命 ${'♥'.repeat(sea.lives)}${'♡'.repeat(Math.max(0,3-sea.lives))}${sea.shield?' · 护符◆':''}`;
 $('map-size').textContent=`${zone.name} · ${zone.en} · 嘴部接触吞噬 · 可回游`;
 const danger=prox.danger;const dangerText=danger?`${danger.name}${danger.state==='chase'?'追击中':'在附近'}`:'暂无';
 $('mission-text').textContent=s===4?`终极目标：吞噬${sea.level.landmark} · 危险：${dangerText}`:`可吞：${prox.edible?.name||'寻找鱼群'} · 危险：${dangerText}`;
 const item=sea.nearbyItem;const text=item?`${item.name} · ${item.mode==='press'?'按 E / 点击交互':item.mode==='hold'?`停留 ${Math.ceil(Math.max(0,.65-item.progress)*10)/10} 秒`:'触碰互动'}`:sea.tabletHint?'沉船裂谷：青铜鱼、礁鲨可在成长后吞噬；裂谷鲨更危险':'寻找发光物件 · 宝箱按 E 开启';$('interaction-hint').textContent=text;interactButton.hidden=!(item&&item.mode==='press'&&sea.state==='playing');interactButton.disabled=interactButton.hidden;interactButton.textContent=item?`开启${item.name}`:'开启';
 areaChips(SEA_ZONES.map(z=>z.name),zone.id,()=>true);
 $('target').hidden=true;
 document.body.classList.toggle('sea-danger',Boolean(danger&&(danger.state==='chase'||danger.state==='alert')&&danger.distance<520));
}
function updateInteractionHint(){
 if(scene==='sea')return;
 const p=game.interactions.filter(p=>game.isIntroduced(p)&&Math.hypot(p.x-game.player.x,p.z-game.player.z)<p.r+game.config.radius+3).sort((a,b)=>Math.hypot(a.x-game.player.x,a.z-game.player.z)-Math.hypot(b.x-game.player.x,b.z-game.player.z))[0];
 const hints={mushroom:'碰到蘑菇，沿移动方向弹跳',crystal:'碰到糖晶，引发连锁碎裂',forestfruit:'碰撞果树，摇落果实（最多3次）',rune:'踩亮符文，吸引范围扩大5秒',bloom:'碰到花苞，追逐精灵光团',gift:'碰到礼盒，弹出曲奇',domino:'碰到第一块骨牌，依次倾倒',watering:'踏板上停留0.5秒，浇出糖果花',rainbow:'沿箭头依次经过三格，踩错可重试',windmill:'碰到风车，转动并飘落花瓣',bell:'碰到皇冠钟，居民短暂庆祝'};
 $('interaction-hint').textContent=p?(p.state==='empty'||p.state==='spent'?`${p.name} · 奖励已领取`:p.state==='running'?`${p.name} · ${p.kind==='domino'?'积木正在依次倒下':'正在浇水开花'}`:hints[p.kind]||`${p.name} · 移动触碰自动互动`):'蓝色标记可互动 · 移动触碰自动触发';
}
function updateDashUI(){
 const g=activeGame(),active=g.dashRemaining>0,cool=g.dashCooldown>0,rebound=(g.reboundRemaining||0)>0;
 dashButton.disabled=!g.canDash;dashButton.dataset.phase=active?'active':cool?'cooldown':rebound?'rebound':'ready';
 dashButton.style.setProperty('--dash-progress',active?g.dashRemaining/g.dashDuration:cool?1-g.dashCooldown/DASH.cooldown:1);
 $('dash-label').textContent=active?'冲刺中':cool?'冷却':rebound?'反弹中':'冲刺';
 $('dash-status').textContent=active?`${g.dashRemaining.toFixed(1)} 秒`:cool?`${g.dashCooldown.toFixed(1)} 秒`:rebound?'稍后可冲刺':`${g.availableDashDuration.toFixed(1)}秒 · 空格`;
 dashButton.setAttribute('aria-label',active?'冲刺中':cool?`冲刺冷却剩余 ${g.dashCooldown.toFixed(1)} 秒`:rebound?'反弹中，稍后可冲刺':'冲刺，可按空格键');
}
function updateStreetLabel(){
 const label=$('sweet-street-label');if(scene==='sea'||game.levelIndex>=2){label.hidden=true;return}
 const town=game.areaDefinitions[2],point=toLevel(-31,11,game.levelIndex),p=renderer?.project(point.x,6,point.z);
 const visible=game.state==='playing'&&game.isIntroduced({...point,r:6})&&p&&p.x>90&&p.x<innerWidth-90&&p.y>150&&p.y<innerHeight-170;
 label.hidden=!visible;if(!visible)return;
 label.querySelector('strong').textContent=town.name;label.style.left=`${p.x}px`;label.style.top=`${p.y}px`;$('sweet-street-state').textContent=town.name+' · 烘焙与糖果';
}
function updatePortalUI(){
 const t=game.transition,overlay=$('portal-overlay');overlay.hidden=!t||scene==='sea';if(!t)return;
 const showSea=t.to===2&&t.switched;
 $('portal-vortex').hidden=!showSea;$('portal-character').hidden=!showSea;
 if(showSea)seaBackdrop.render(game.seed,game.seaCarry);
 document.querySelector('.portal-flash').style.opacity=String(Math.max(0,1-Math.abs(t.elapsed-1.1)/.22));
 $('portal-title').textContent=t.switched?(t.to===2?'第三关 · 抵达海底遗迹':'第二关 · 抵达森林遗迹'):'正在穿越时空';
 $('portal-sub').textContent=t.switched?(t.to===2?'五区连续深海 · 嘴部吞噬成长':'糖果森林遗迹 · 新的五区'):'下一站';
}
function handleLandEvent(e){
 soundEngine.handle(e,game);diagnostics.onGameEvent(e);
 if(e.kind==='portal-start'){adventure.finished({won:true,score:game.score-game.levelCheckpoint.score,seconds:game.elapsed,result:false});clearInput();document.body.classList.remove('playing');if(e.nextLevel===3)soundEngine.play('seaVortex');else tone(520,.4)}
 if(e.kind==='level-loaded'){clearInput();if(e.level===3)soundEngine.play('seaEnter')}
 if(e.kind==='level-ready'){
  clearInput();
  if(e.level===3){switchToSea();adventure.started();return true}
  adventure.started();
  document.body.classList.add('playing');toast('第二关：糖果森林遗迹');tone(780,.3);
 }
 if(e.kind==='dash'&&e.phase==='start')tone(900,.12);
 if(e.kind==='interact')renderer?.burst(game.player.x,game.player.z,'#ecc56d');
 if(e.kind==='eat'){renderer?.burst(e.item.x,e.item.z,e.item.type.color);tone(380+game.combo*70)}
 if(e.kind==='evolve'){renderer?.burst(game.player.x,game.player.z,game.config.color);toast(`进化！${game.config.name} · 四面边界向外扩展`);tone(700,.25)}
 if(e.kind==='end'){lastEndReason=e.reason||'';finish(e.win)}
 return false;
}
function handleSeaEvent(e){
 soundEngine.handle(e,sea);diagnostics.onGameEvent(e);
 if(e.kind==='dash'&&e.phase==='start')tone(900,.12);
 if(e.kind==='eat')tone(400+Math.min(5,sea.stage)*70,.1);
 if(e.kind==='sea-item'){toast(`${e.name} · 已触发`);tone(620,.15)}
 if(e.kind==='sea-shield'){toast('护符抵挡了鲨鱼攻击');tone(850,.22)}
 if(e.kind==='hit'){toast(`受到攻击 · 剩余 ${e.lives} 生命`);tone(150,.18)}
 if(e.kind==='evolve'){toast(`进化！${sea.stageName} · 可以吞噬更高一级的鱼`);tone(720,.28)}
 if(e.kind==='danger'&&e.phase==='alert'){toast(`危险：${e.creature.name} 发现了你`);tone(220,.12)}
 if(e.kind==='zone-enter'){toast(e.zone.name);tone(520,.2)}
 if(e.kind==='end'){lastEndReason=e.reason||'';finish(e.win)}
}
function frame(now){
 const dt=Math.min((now-last)/1000,.05);last=now;
 if(scene==='sea'&&sea){
  const paused=sea.state==='paused';
  sea.update(dt,swimInput());soundEngine.sync(sea);
  for(const e of sea.drainEvents())handleSeaEvent(e);
  updateSeaUI();updateDashUI();updatePortalUI();
  if(seaRenderer)seaRenderer.render(sea,paused?0:dt);
  diagnostics.observe(now,true);
  requestAnimationFrame(frame);return;
 }
 const before=game.state;
 game.update(dt,movementInput());soundEngine.sync(game);
 let switched=false;
 for(const e of game.drainEvents()){if(handleLandEvent(e)){switched=true;break}}
 if(switched||scene==='sea'){
  updateSeaUI();updateDashUI();updatePortalUI();
  if(seaRenderer)seaRenderer.render(sea,dt);
  diagnostics.observe(now,true);
  requestAnimationFrame(frame);return;
 }
 // Mid-portal into level 3: the land model already points at the sea and its area list is
 // empty, while the campaign is still in transition. Touch only the portal overlay and
 // diagnostics; skip land UI, area lookups and WebGL rendering until level-ready switches.
 if(game.seaTransitioning){
  updatePortalUI();
  if(game.transition?.switched&&!diagnostics.contextLost&&!diagnostics.needsReload){
   if(!portalRenderer)portalRenderer=new Renderer($('portal-character'),{alpha:true});
   portalRenderer.renderPortalOnly(game,dt);
  }
  diagnostics.observe(now,false);
  requestAnimationFrame(frame);return;
 }
 updateUI();updateDashUI();updateInteractionHint();updatePortalUI();
 const canRender=renderer&&!diagnostics.contextLost&&!diagnostics.needsReload;
 if(canRender)renderer.render(game,dt);
 updateStreetLabel();diagnostics.observe(now,Boolean(canRender));
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

initPwa({pause});
