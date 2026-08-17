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
  const syncKeyboard=()=>{
    const h=vv?.height||window.innerHeight
    const full=window.innerHeight
    document.documentElement.classList.toggle('keyboard-open',full-h>140)
  }
  vv?.addEventListener('resize',syncKeyboard)
  vv?.addEventListener('scroll',syncKeyboard)
  window.addEventListener('resize',syncKeyboard)
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
