import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

async function applyStatusBar(){
  if (!Capacitor.isNativePlatform()) return
  try {
    await StatusBar.setOverlaysWebView({ overlay: false })
    await StatusBar.setBackgroundColor({ color: '#ffffff' })
    await StatusBar.setStyle({ style: Style.Dark })
  } catch {}
}

export async function configureNativeUi() {
  await applyStatusBar()
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)applyStatusBar()})
  window.addEventListener('focus',applyStatusBar)

  const vv=window.visualViewport
  let baseline=Math.max(window.innerHeight,vv?.height||0)
  let inputFocused=false
  let blurTimer
  const setKeyboard=open=>document.documentElement.classList.toggle('keyboard-open',!!open)
  const syncKeyboard=()=>{
    const current=Math.min(window.innerHeight,vv?.height||window.innerHeight)
    baseline=Math.max(baseline,window.innerHeight,vv?.height||0)
    const shrunk=baseline-current>120
    setKeyboard(inputFocused||shrunk)
  }
  document.addEventListener('focusin',e=>{
    if(e.target?.matches?.('textarea,input,[contenteditable="true"]')){
      clearTimeout(blurTimer);inputFocused=true;setKeyboard(true);setTimeout(syncKeyboard,60)
    }
  })
  document.addEventListener('focusout',e=>{
    if(e.target?.matches?.('textarea,input,[contenteditable="true"]')){
      inputFocused=false;clearTimeout(blurTimer);blurTimer=setTimeout(syncKeyboard,180)
    }
  })
  vv?.addEventListener('resize',syncKeyboard)
  vv?.addEventListener('scroll',syncKeyboard)
  window.addEventListener('resize',syncKeyboard)
  window.addEventListener('orientationchange',()=>{baseline=0;setTimeout(()=>{baseline=Math.max(window.innerHeight,vv?.height||0);syncKeyboard()},350)})
  syncKeyboard()
}

export async function requestCoreMediaPermissions() {
  if (!Capacitor.isNativePlatform()) return
  if (!navigator.mediaDevices?.getUserMedia) return
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    stream.getTracks().forEach(track => track.stop())
  } catch {}
}

function currentClock(){const now=new Date();return{iso:now.toISOString(),local_time:new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now),local_date:new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(now),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||null,utc_offset_minutes:-now.getTimezoneOffset()}}
function gpsOnce(timeout=7000){return new Promise(resolve=>{if(!navigator.geolocation)return resolve(null);navigator.geolocation.getCurrentPosition(p=>resolve({latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy_m:p.coords.accuracy}),()=>resolve(null),{enableHighAccuracy:true,timeout,maximumAge:60000})})}
async function publicIp(){try{const r=await fetch('https://api.ipify.org?format=json',{cache:'no-store'});if(!r.ok)return null;const d=await r.json();return d?.ip||null}catch{return null}}
export async function getDeviceContext({includeLocation=true,includeIp=true}={}){const base=currentClock();const [location,ip]=await Promise.all([includeLocation?gpsOnce():Promise.resolve(null),includeIp?publicIp():Promise.resolve(null)]);return{...base,public_ip:ip,location}}
