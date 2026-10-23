import {islandArt,mascot} from './art.js';
import {readProgress,SOUND_KEY} from './shared/adventure-bridge.js';
const $=id=>document.getElementById(id);
const LEVELS=[
 {id:1,name:'奶油城堡小镇',category:'GROW & EXPLORE / 吞噬成长',description:'从一颗小奶蛋开始，吃掉沿途的小物与甜点，把奶油皇冠城堡也装进肚子里。',tags:['吞噬成长','4 分钟','城堡小镇'],path:'source/index.html'},
 {id:2,name:'糖果森林遗迹',category:'INTO THE WOODS / 森林探索',description:'穿过蘑菇林与糖果集市，寻找藏在森林深处的糖晶古代遗迹。',tags:['吞噬成长','4 分钟','森林遗迹'],path:'source/index.html'},
 {id:3,name:'海底遗迹',category:'DIVE A LITTLE DEEPER / 深海远征',description:'从珊瑚浅湾游向王座深渊，开启沉船宝箱，成长后挑战深海巨鲨。',tags:['深海探索','生命挑战','五区海域'],path:'source/index.html'},
 {id:4,name:'云端糖果要塞',category:'AIM FOR THE CLOUDS / 弹弓挑战',description:'拉动弹弓，把奶蛋送上云端。击碎支撑与糖桶，让五座要塞接连倒下。',tags:['物理弹射','五座要塞','连锁破坏'],path:'fourth-level/index.html'},
 {id:5,name:'奶娃地铁大逃跑',category:'NEXT STOP, FREEDOM / 三轨跑酷',description:'躲避迎面而来的列车，翻滚穿过障碍，收集奶糖，变身奶蛋冲破阻挡。',tags:['三轨跑酷','三阶段加速','变身破障'],path:'fifth-level/index.html'},
 {id:6,name:'奶娃切切乐',category:'SLICE, SMILE & REPEAT / 指尖切割',description:'划过水果、奶娃和奶蛋，享受一刀多切！坚持 90 秒，达到 800 分，避开炸弹。',tags:['划动连切','90 秒','800 分通关'],path:'sixth-level/index.html'}
];
const UI_KEY='naidan-adventure-map-v1';
let progress={},selected=1,sound=true,audio=null,storage=null,noticeTimer,ui={};
try{storage=localStorage;ui=JSON.parse(storage.getItem(UI_KEY)||'{}')||{};sound=storage.getItem(SOUND_KEY)!=='off';progress=readProgress(storage);}catch{notice('当前环境无法保存进度，仍可自由挑战六关。');}
const hashId=Number(location.hash.match(/^#level-([1-6])$/)?.[1]);
selected=hashId||(Number.isInteger(ui.selected)&&ui.selected>=1&&ui.selected<=6?ui.selected:1);
function notice(text){$('notice').textContent=text;$('notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').hidden=true,4500);}
function saveUI(){try{storage?.setItem(UI_KEY,JSON.stringify({selected,scroll:scrollY}));}catch{}}
function tone(){if(!sound)return;try{audio??=new AudioContext();void audio.resume();const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.connect(g);g.connect(audio.destination);o.frequency.setValueAtTime(620,t);o.frequency.exponentialRampToValueAtTime(930,t+.1);g.gain.setValueAtTime(.025,t);g.gain.exponentialRampToValueAtTime(.001,t+.16);o.start(t);o.stop(t+.17);}catch{}}
function soundUI(){$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'关闭音效':'开启音效');$('sound').querySelector('span').textContent=`音效 ${sound?'开':'关'}`;}
soundUI();$('sound').onclick=()=>{sound=!sound;soundUI();try{storage?.setItem(SOUND_KEY,sound?'on':'off');}catch{}if(sound)tone();else void audio?.suspend();};
function state(id){const p=progress[id];return p?.wins>0?'已通关':p?.attempts>0?'已挑战':'尚未挑战';}
$('islands').innerHTML=LEVELS.map(l=>`<button class="island" data-id="${l.id}" aria-pressed="false" aria-label="第${l.id}关 ${l.name}"><span class="island-art">${islandArt(l.id)}<span class="mascot">${mascot}</span></span><span class="island-label"><b>0${l.id}</b> ${l.name}</span><span class="island-state"></span></button>`).join('');
function refreshProgress(){progress=readProgress(storage);$('completed').textContent=LEVELS.filter(l=>progress[l.id]?.wins>0).length;document.querySelectorAll('.island').forEach(b=>{const id=Number(b.dataset.id);b.querySelector('.island-state').textContent=state(id);b.setAttribute('aria-label',`第${id}关 ${LEVELS[id-1].name}，${state(id)}`);});}
function select(id,{feedback=false}={}){
 selected=id;const l=LEVELS[id-1],p=progress[id];document.querySelectorAll('.island').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.id)===id)));
 $('level-chapter').textContent=`CHAPTER 0${id}`;$('level-status').textContent=state(id);$('preview').innerHTML=islandArt(id);$('level-category').textContent=l.category;$('level-title').textContent=l.name;$('level-description').textContent=l.description;
 $('level-tags').innerHTML=l.tags.map(t=>`<span>${t}</span>`).join('');$('best-score').innerHTML=(p?.attempts?Number(p.bestScore).toLocaleString():'—')+'<small> 分</small>';
 $('record-label').textContent=id===4?'最佳星级':'最快通关';$('best-extra').innerHTML=id===4?(p?.stars?'★'.repeat(p.stars)+'☆'.repeat(3-p.stars):'—'):(p?.fastest?Math.ceil(p.fastest)+'<small> 秒</small>':'—');
 $('play').innerHTML=(p?.wins?'再去冒险':'开始冒险')+' <span>↗</span>';$('play').setAttribute('aria-label',`开始第${id}关 ${l.name}`);$('play-note').textContent=id===4?'独立挑战 · 从第一座要塞出发':'独立挑战 · 从本关起点出发';$('continue-sea').hidden=id!==2;
 $('dock-title').textContent=l.name;$('dock-chapter').textContent=`CHAPTER 0${id}`;$('dock-play').setAttribute('aria-label',`开始第${id}关 ${l.name}`);
 saveUI();if(feedback){tone();$('detail').classList.remove('flash');void $('detail').offsetWidth;$('detail').classList.add('flash');}
}
refreshProgress();select(selected);
document.querySelectorAll('.island').forEach(b=>b.onclick=()=>select(Number(b.dataset.id),{feedback:true}));
$('play').onclick=()=>{saveUI();const l=LEVELS[selected-1],url=new URL(l.path,location.href);url.search=new URLSearchParams({adventure:'1',level:String(selected),mode:'single',sound:sound?'on':'off'});location.href=url.href;};
$('dock-play').onclick=()=>$('play').click();
$('continue-sea').onclick=()=>{saveUI();const url=new URL('source/index.html',location.href);url.search=new URLSearchParams({adventure:'1',mode:'campaign',start:'2',sound:sound?'on':'off'});location.href=url.href;};
$('campaign').addEventListener('click',e=>{saveUI();const url=new URL('source/index.html',location.href);url.search=new URLSearchParams({adventure:'1',mode:'campaign',sound:sound?'on':'off'});e.currentTarget.href=url.href;});
window.addEventListener('pagehide',saveUI);window.addEventListener('hashchange',()=>{const id=Number(location.hash.match(/^#level-([1-6])$/)?.[1]);if(id)select(id);});
window.addEventListener('pageshow',e=>{if(e.persisted){refreshProgress();select(selected);}});
window.addEventListener('storage',()=>{refreshProgress();select(selected);});
if(Number.isFinite(ui.scroll)&&ui.scroll>0)requestAnimationFrame(()=>scrollTo(0,ui.scroll));
let installEvent;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;$('install').hidden=false;});$('install').onclick=async()=>{if(!installEvent)return;await installEvent.prompt();installEvent=null;$('install').hidden=true;};
if('serviceWorker'in navigator&&(isSecureContext||location.hostname==='localhost')){
 navigator.serviceWorker.register('./sw.js').then(async registration=>{
  const showUpdate=()=>{if(registration.waiting)$('update').hidden=false;};showUpdate();registration.addEventListener('updatefound',()=>registration.installing?.addEventListener('statechange',showUpdate));
  $('update').onclick=()=>{registration.waiting?.postMessage({type:'SKIP_WAITING'});};
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!navigator.serviceWorker.controller)return;if(!$('update').hidden)location.reload();});
  await navigator.serviceWorker.ready;
  // Only the map-wide cache proves that every level is ready offline.
  const cacheKeys=await caches.keys();if(cacheKeys.some(k=>k.startsWith('naidan-adventure:')&&k.includes(new URL('./',location.href).pathname))){$('offline').textContent='六关离线资源已就绪';$('offline-note').textContent='添加到桌面，断网也能继续冒险。';$('offline-dot').classList.add('ready');}
  else{$('offline').textContent='正在准备六关离线资源…';}
 }).catch(()=>{$('offline').textContent='在线冒险已准备好';$('offline-note').textContent='离线资源未就绪，请联网重开后检查。';});
}else{$('offline').textContent='在线冒险已准备好';$('offline-note').textContent='手机离线安装需使用 HTTPS 地址。';}
