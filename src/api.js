import { clearSession, loadSession, saveSession } from './session.js'
import Axynera, { AxyneraAuth } from './vendor/axynera.mjs'

const MODEL = import.meta.env.VITE_NERA_MODEL || 'Nera-V4'
const auth = new AxyneraAuth()
const nera = new Axynera({ model: MODEL })

export async function setSession(token) {
  if (!token) return
  nera.setSession(token)
}

export async function restoreSession() {
  const token = await loadSession()
  if (!token) return null
  try {
    nera.setSession(token)
    return await auth.me()
  } catch {
    await clearSession()
    return null
  }
}

export async function loginWithGoogle(googleIdToken) {
  if (!googleIdToken) throw new Error('Google ID token tidak tersedia.')
  const login = await auth.loginGoogle(googleIdToken)
  if (!login?.token) throw new Error('Axynera Auth tidak mengirim session token.')
  nera.setSession(login.token)
  await saveSession(login.token)
  return login
}

export async function logoutSession() { await clearSession() }
export async function getMe() { return auth.me() }
export async function createUserChat(title='Chat baru') { return auth.createChat(title) }
export async function appendUserChat(chatId,message) { return auth.appendChat(chatId,message) }

function extractText(result) {
  if (typeof result === 'string') return result
  return result?.text ?? result?.message ?? result?.content ?? result?.choices?.[0]?.message?.content ?? 'Nera tidak mengirim jawaban.'
}

export async function sendChat(prompt) {
  try {
    const text = Array.isArray(prompt) ? prompt.at(-1)?.content : prompt
    return extractText(await nera.chat(text || ''))
  } catch (error) {
    const message = error?.message || 'Gagal menghubungi Nera lewat Axynera SDK.'
    throw new Error(`${message}${error?.code ? ` (${error.code})` : ''}`)
  }
}

export async function streamChat(prompt){const text=Array.isArray(prompt)?prompt.at(-1)?.content:prompt;return nera.stream(text||'')}
export async function vision(prompt,file){return nera.vision(prompt,file)}
export async function webSearch(query){return nera.search(query)}
export async function inspectWeb(url){return nera.inspectWeb(url)}
export async function runSandbox(command){return nera.sandbox(command)}
export async function createFile(prompt){return nera.createFile(prompt)}
export async function saveToDrive(prompt){return nera.saveToDrive(prompt)}
export async function getModels(){return nera.models()}
export async function getIdentity(){return nera.identity()}
export function createConversation(systemPrompt){return nera.conversation(systemPrompt)}
