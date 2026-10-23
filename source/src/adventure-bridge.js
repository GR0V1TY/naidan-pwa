// Canonical copy. tools/build.mjs distributes this module to each existing game.
export const PROGRESS_KEY='naidan-adventure-progress-v1';
export const SOUND_KEY='naidan-adventure-sound-v1';
export function nextLevelLaunch(level,sound=true){
 if(!Number.isInteger(level)||level<1||level>=6)return null;
 const next=level+1,path=next<=3?'source/index.html':next===4?'fourth-level/index.html':next===5?'fifth-level/index.html':'sixth-level/index.html';
 return path+'?'+new URLSearchParams({adventure:'1',level:String(next),mode:'single',sound:sound?'on':'off'});
}
const positive=n=>Number.isFinite(Number(n))&&Number(n)>=0?Number(n):0;
export function readProgress(storage){
 try{const parsed=JSON.parse(storage.getItem(PROGRESS_KEY)||'{}'),result={};for(let i=1;i<=6;i++){
  const v=parsed?.[i];if(!v||typeof v!=='object')continue;
  result[i]={attempts:positive(v.attempts),wins:positive(v.wins),bestScore:positive(v.bestScore),fastest:positive(v.fastest)||null,stars:Math.min(3,positive(v.stars)),lastPlayed:positive(v.lastPlayed)};
 }return result;}catch{return {};}
}
export function updateProgress(storage,level,{start=false,won=false,score=0,seconds=0,stars=0}={}){
 if(!Number.isInteger(level)||level<1||level>6)throw Error('Invalid adventure level');
 const all=readProgress(storage),old=all[level]||{attempts:0,wins:0,bestScore:0,fastest:null,stars:0,lastPlayed:0};
 all[level]={attempts:old.attempts+(start?1:0),wins:old.wins+(won?1:0),bestScore:Math.max(old.bestScore,positive(score)),fastest:won&&positive(seconds)>0?Math.min(old.fastest||Infinity,positive(seconds)):old.fastest,stars:Math.max(old.stars,Math.min(3,positive(stars))),lastPlayed:Date.now()};
 try{storage.setItem(PROGRESS_KEY,JSON.stringify(all));return true;}catch{return false;}
}
export function createAdventureBridge({level,pause,resume,isActive,snapshot=()=>({}),setSound,nextTransition}){
 const query=new URLSearchParams(location.search),enabled=query.get('adventure')==='1';
 let pending=false,attemptLevel=null,finished=false,currentSound=query.get('sound')!=='off',renderResult=()=>{},clearResult=()=>{};
 const id=()=>typeof level==='function'?level():level;
 const save=data=>{try{return updateProgress(localStorage,id(),data);}catch{return false;}};
 const api={
  started(){if(!enabled)return;attemptLevel=id();finished=false;clearResult();save({start:true});},
  finished(data){if(!enabled||attemptLevel!==id())return;const resultLevel=id();if(data.result!==false)queueMicrotask(()=>{if(finished&&id()===resultLevel)renderResult(data);});if(finished)return;finished=true;save(data);},
  soundChanged(on){currentSound=Boolean(on);if(enabled)try{localStorage.setItem(SOUND_KEY,on?'on':'off');}catch{}},
  enabled
 };
 if(!enabled)return api;
 try{const saved=localStorage.getItem(SOUND_KEY);if(saved!==null)currentSound=saved!=='off';}catch{}setSound?.(currentSound);
 const style=document.createElement('style');style.textContent=`
 .adventure-return{font:600 13px/1.3 system-ui,sans-serif!important;cursor:pointer!important;border:1px solid #d8d9c9!important;border-radius:99px!important;padding:10px 15px!important;background:#fffdf3!important;color:#284b42!important;min-height:40px!important;white-space:nowrap!important;position:relative!important;z-index:15!important}
 .adventure-return:focus-visible{outline:3px solid #de9f24!important;outline-offset:3px!important}
 .adventure-modal-return{display:block!important;margin:14px auto 0!important}
 .adventure-next{display:block!important;width:100%!important;margin:14px auto 0!important;border-radius:14px!important;background:#285346!important;color:#fff4d3!important;border:1px solid #78947b!important;padding:14px 18px!important;font:700 16px/1.4 system-ui!important;cursor:pointer!important;min-height:48px!important}
 .adventure-next[hidden]{display:none!important}.adventure-next:focus-visible{outline:3px solid #d5aa51;outline-offset:3px}
 .adventure-exit{max-width:390px;width:calc(100% - 32px);box-sizing:border-box;border:0;border-radius:24px;background:#fffdf5;color:#24483e;padding:28px;font:16px/1.6 system-ui;box-shadow:0 24px 90px #102e4455}
 .adventure-exit::backdrop{background:#102b2c99;backdrop-filter:blur(4px)}
 .adventure-exit h2{margin:0 0 12px;font-size:24px}.adventure-exit p{color:#59665c}.adventure-exit button{font:600 15px system-ui;cursor:pointer;padding:13px 18px;border-radius:14px;border:1px solid #d4dacb;background:#fffdf5;color:#24483e;margin:5px}.adventure-exit .leave{background:#264e42;color:white}
 @media(max-width:600px){.adventure-return{padding:8px 10px!important;font-size:12px!important;min-height:36px!important}header .brand small{display:none!important}.adventure-modal-return{margin-top:10px!important}}
 `;document.head.append(style);
 const dialog=document.createElement('dialog');dialog.className='adventure-exit';dialog.setAttribute('aria-labelledby','adventure-exit-title');
 dialog.innerHTML='<h2 id="adventure-exit-title">返回冒险地图？</h2><p>本局将结束，当前分数会记录到个人最佳。下次从本关起点开始。</p><button class="leave">返回选关</button><button class="stay" autofocus>留在本关</button>';document.body.append(dialog);
 const leave=()=>{if(attemptLevel!==null&&!finished)save(snapshot());location.href=new URL('../../index.html#level-'+id(),import.meta.url).href;};
 let wasActive=false;
 const restore=()=>{pending=false;if(wasActive)resume?.();};
 dialog.querySelector('.leave').onclick=()=>{pending=false;leave();};
 dialog.querySelector('.stay').onclick=()=>{restore();dialog.close();};dialog.addEventListener('cancel',()=>{if(pending)restore();});dialog.addEventListener('close',()=>{if(pending)restore();});
 dialog.addEventListener('keydown',e=>e.stopPropagation());
 const returnToMap=()=>{if(pending)return;wasActive=Boolean(isActive?.());if(!wasActive&&(attemptLevel===null||finished)){leave();return;}if(wasActive)pause?.();pending=true;dialog.showModal();};
 const button=()=>{const b=document.createElement('button');b.type='button';b.className='adventure-return';b.textContent='← 冒险地图';b.onclick=returnToMap;return b;};
 const actions=document.querySelector('header .top-actions,header .actions,header.masthead,header .top-actions')||document.querySelector('header');
 actions?.append(button());
 const resultControls=[];
 for(const modal of document.querySelectorAll('#modal .modal-card,#modal .dialog,#modal.panel,#overlay .overlay-content')){
  const next=document.createElement('button');next.type='button';next.className='adventure-next';next.textContent='下一关 →';next.hidden=true;
  next.onclick=()=>{if(!finished)return;const path=nextLevelLaunch(id(),currentSound);if(!path)return;const target=new URL('../../'+path,import.meta.url);if(id()===3&&nextTransition){void nextTransition(target,currentSound);return;}location.href=target.href;};modal.append(next);
  const b=button();b.classList.add('adventure-modal-return');modal.append(b);resultControls.push({next,back:b});
 }
 clearResult=()=>{for(const {next,back}of resultControls){next.hidden=true;back.textContent='← 冒险地图';}};
 renderResult=data=>{
  const won=Boolean(data.won),level=id();for(const {next,back}of resultControls){next.hidden=!won||level>=6;back.textContent=won&&level===6?'全部完成，返回地图':'返回地图';}
  if(level<=3){const retry=document.getElementById('retry');if(retry)retry.textContent=won?'再玩一次':'重新挑战';}
  if(level===4&&won){document.getElementById('continue').textContent='再玩一次';document.getElementById('modal-retry').hidden=true;}
  if(level===5)document.getElementById('retry').textContent=won?'再玩一次':'重新挑战';
  if(level===6)document.getElementById('play').innerHTML=(won?'再玩一次':'重新挑战')+' <span>↗</span>';
 };
 return api;
}
