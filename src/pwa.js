// Optional platform features: failure must never prevent the game from starting.
export function initPwa({pause=()=>{}}={}){
 const status=document.getElementById('pwa-status'),install=document.getElementById('pwa-install'),full=document.getElementById('pwa-fullscreen'),banner=document.getElementById('pwa-update'),update=document.getElementById('pwa-update-button');
 let prompt=null,registration=null,reloading=false,updating=false;
 const say=text=>{status.textContent=text};
 const standalone=()=>matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true;
 const installed=()=>{install.hidden=true;say('已从桌面打开。离线资源准备完成后可断网游玩。')};
 if(standalone())installed();
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;if(!standalone()){install.hidden=false;install.textContent='安装到桌面'}});
 window.addEventListener('appinstalled',()=>{prompt=null;installed()});
 install.addEventListener('click',async()=>{
  if(!prompt){say('请在浏览器菜单中选择“安装应用”或“添加到主屏幕”。若没有此项，请换用支持安装的安卓浏览器；仍可直接网页游玩。');return}
  const event=prompt;prompt=null;
  try{await event.prompt();const choice=await event.userChoice;say(choice.outcome==='accepted'?'已提交安装，请按浏览器提示完成。':'已取消安装，仍可直接游玩。')}catch{say('未能打开安装提示，请使用浏览器菜单添加到主屏幕。')}
 });
 full.hidden=!document.documentElement.requestFullscreen;
 full.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{say('当前浏览器未允许全屏，仍可正常游玩。')}});
 document.addEventListener('fullscreenchange',()=>{full.textContent=document.fullscreenElement?'退出全屏':'全屏游玩'});
 if(!window.isSecureContext||!('serviceWorker'in navigator)){say('当前地址支持在线游玩。安装和离线功能需 HTTPS；手机访问电脑的普通 HTTP 地址不能启用离线缓存。');return}
 const showUpdate=()=>{if(registration?.waiting)banner.hidden=false};
 update.addEventListener('click',()=>{if(!registration?.waiting)return;pause();updating=true;update.disabled=true;update.textContent='正在更新…';registration.waiting.postMessage({type:'SKIP_WAITING'})});
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(updating&&!reloading){reloading=true;location.reload()}});
 say('正在准备离线资源，请保持首次联网…');
 navigator.serviceWorker.register(new URL('../sw.js',import.meta.url),{updateViaCache:'none'}).then(reg=>{
  registration=reg;showUpdate();
  reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'){if(navigator.serviceWorker.controller)showUpdate()}if(worker.state==='redundant')say('离线资源准备失败，请联网刷新重试；当前仍可在线游玩。')})});
  return navigator.serviceWorker.ready;
 }).then(()=>{say(navigator.onLine?'离线资源已就绪，可断网游玩；浏览器清理网站数据后需重新联网。':'当前离线，已缓存的两关仍可游玩。')}).catch(()=>say('离线资源未就绪，请联网刷新重试；当前仍可在线游玩。'));
 window.addEventListener('offline',()=>{say(navigator.serviceWorker.controller?'当前离线，使用已缓存资源。':'当前离线；首次缓存尚未完成，请联网后重试。')});
 window.addEventListener('online',()=>{say('网络已恢复，正在检查更新…');registration?.update().then(()=>say('网络已恢复，离线资源可继续使用。')).catch(()=>say('暂时无法检查更新，继续使用当前版本。'))});
}
