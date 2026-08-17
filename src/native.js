import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

export async function configureNativeUi() {
  if (!Capacitor.isNativePlatform()) return
  try {
    await StatusBar.setOverlaysWebView({ overlay: false })
    await StatusBar.setBackgroundColor({ color: '#090d16' })
    await StatusBar.setStyle({ style: Style.Light })
  } catch {}
}

export async function requestCoreMediaPermissions() {
  if (!Capacitor.isNativePlatform()) return
  if (!navigator.mediaDevices?.getUserMedia) return
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    stream.getTracks().forEach(track => track.stop())
  } catch {
    // User can deny; app remains usable and can request again when the feature is used.
  }
}
