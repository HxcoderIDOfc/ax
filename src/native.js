import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

async function applyStatusBar(){
  if (!Capacitor.isNativePlatform()) return
  try {
    await StatusBar.setOverlaysWebView({ overlay: false })
    await StatusBar.setBackgroundColor({ color: '#090d16' })
    await StatusBar.setStyle({ style: Style.Light })
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
