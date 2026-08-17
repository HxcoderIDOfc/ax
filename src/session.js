import { Preferences } from '@capacitor/preferences'

const SESSION_KEY = 'axynera_session'

export async function saveSession(token) {
  if (!token) return
  await Preferences.set({ key: SESSION_KEY, value: token })
}

export async function loadSession() {
  const { value } = await Preferences.get({ key: SESSION_KEY })
  return value || null
}

export async function clearSession() {
  await Preferences.remove({ key: SESSION_KEY })
}
