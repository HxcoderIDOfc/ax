import { clearSession, loadSession, saveSession } from './session.js'

const MODEL = import.meta.env.VITE_NERA_MODEL || 'Nera-V4'
const SDK_URL = 'https://sdk.axynera.my.id/axynera.mjs'
let sdkPromise = null
let auth = null
let nera = null

async function ensureSdk() {
  if (auth && nera) return { auth, nera }
  if (!sdkPromise) {
    sdkPromise = import(/* @vite-ignore */ SDK_URL)
      .then((mod) => {
        const Axynera = mod.default
        const AxyneraAuth = mod.AxyneraAuth
        if (!Axynera || !AxyneraAuth) throw new Error('Axynera SDK tidak lengkap.')
        auth = new AxyneraAuth()
        nera = new Axynera({ model: MODEL })
        return { auth, nera }
      })
      .catch((error) => {
        sdkPromise = null
        throw new Error(error?.message || 'Gagal memuat Axynera SDK.')
      })
  }
  return sdkPromise
}

export async function setSession(token) {
  if (!token) return
  const sdk = await ensureSdk()
  sdk.nera.setSession(token)
}

export async function restoreSession() {
  const token = await loadSession()
  if (!token) return null
  try {
    const sdk = await ensureSdk()
    sdk.nera.setSession(token)
    return await sdk.auth.me()
  } catch {
    await clearSession()
    return null
  }
}

export async function loginWithGoogle(googleIdToken) {
  if (!googleIdToken) throw new Error('Google ID token tidak tersedia.')
  const sdk = await ensureSdk()
  const login = await sdk.auth.loginGoogle(googleIdToken)
  if (!login?.token) throw new Error('Axynera Auth tidak mengirim session token.')
  sdk.nera.setSession(login.token)
  await saveSession(login.token)
  return login
}

export async function logoutSession() { await clearSession() }
export async function getMe() { return (await ensureSdk()).auth.me() }
export async function createUserChat(title='Chat baru') { return (await ensureSdk()).auth.createChat(title) }
export async function appendUserChat(chatId,message) { return (await ensureSdk()).auth.appendChat(chatId,message) }

function extractText(result) {
  if (typeof result === 'string') return result
  return result?.text ?? result?.message ?? result?.content ?? result?.choices?.[0]?.message?.content ?? 'Nera tidak mengirim jawaban.'
}

export async function sendChat(prompt) {
  try {
    const text = Array.isArray(prompt) ? prompt.at(-1)?.content : prompt
    const sdk = await ensureSdk()
    return extractText(await sdk.nera.chat(text || ''))
  } catch (error) {
    const message = error?.message || 'Gagal menghubungi Nera lewat Axynera SDK.'
    throw new Error(`${message}${error?.code ? ` (${error.code})` : ''}`)
  }
}

export async function streamChat(prompt){const text=Array.isArray(prompt)?prompt.at(-1)?.content:prompt;return (await ensureSdk()).nera.stream(text||'')}
export async function vision(prompt,file){return (await ensureSdk()).nera.vision(prompt,file)}
export async function webSearch(query){return (await ensureSdk()).nera.search(query)}
export async function inspectWeb(url){return (await ensureSdk()).nera.inspectWeb(url)}
export async function runSandbox(command){return (await ensureSdk()).nera.sandbox(command)}
export async function createFile(prompt){return (await ensureSdk()).nera.createFile(prompt)}
export async function saveToDrive(prompt){return (await ensureSdk()).nera.saveToDrive(prompt)}
export async function getModels(){return (await ensureSdk()).nera.models()}
export async function getIdentity(){return (await ensureSdk()).nera.identity()}
export async function createConversation(systemPrompt){return (await ensureSdk()).nera.conversation(systemPrompt)}
