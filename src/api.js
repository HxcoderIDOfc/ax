import { clearSession, loadSession, saveSession } from './session.js'

const MODEL = import.meta.env.VITE_NERA_MODEL || 'Nera-V4'
const AUTH_BASE = 'https://auth.axynera.my.id'
const API_BASE = 'https://api.axynera.my.id'

let sdkPromise = null

async function readJson(res) {
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : {} } catch { data = { message: text } }
  if (!res.ok) {
    const message = data?.error?.message || data?.error || data?.message || `HTTP ${res.status}`
    const err = new Error(String(message))
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

async function request(url, options = {}, timeout = 15000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (e) {
    if (e?.name === 'AbortError') throw new Error('Koneksi Axynera timeout.')
    throw e
  } finally {
    clearTimeout(timer)
  }
}

async function authRequest(path, token, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await request(`${AUTH_BASE}${path}`, { ...options, headers })
  return readJson(res)
}

async function apiRequest(path, token, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await request(`${API_BASE}${path}`, { ...options, headers }, 30000)
  return readJson(res)
}

export async function setSession(token) {
  if (token) await saveSession(token)
}

export async function restoreSession() {
  const token = await loadSession()
  if (!token) return null
  try {
    return await authRequest('/v1/me', token)
  } catch {
    await clearSession()
    return null
  }
}

export async function loginWithGoogle(googleIdToken) {
  if (!googleIdToken) throw new Error('Google ID token tidak tersedia.')

  // Support common payload names so the app stays compatible with Auth SDK revisions.
  const payloads = [
    { googleIdToken },
    { idToken: googleIdToken },
    { id_token: googleIdToken }
  ]

  let lastError
  for (const payload of payloads) {
    try {
      const login = await authRequest('/v1/google', null, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const token = login?.token || login?.session || login?.access_token || login?.data?.token
      if (!token) throw new Error('Axynera Auth tidak mengirim session token.')
      await saveSession(token)
      return { ...login, token }
    } catch (e) {
      lastError = e
      if (![400, 404, 415, 422].includes(e?.status)) throw e
    }
  }
  throw lastError || new Error('Login Axynera gagal.')
}

export async function logoutSession() {
  const token = await loadSession()
  if (token) {
    try { await authRequest('/v1/logout', token, { method: 'POST' }) } catch {}
  }
  await clearSession()
}

export async function getMe() {
  const token = await loadSession()
  if (!token) throw new Error('Session Axynera tidak tersedia.')
  return authRequest('/v1/me', token)
}

export async function createUserChat(title = 'Chat baru') {
  const token = await loadSession()
  return authRequest('/v1/chats', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  })
}

export async function appendUserChat(chatId, message) {
  const token = await loadSession()
  return authRequest(`/v1/chats/${encodeURIComponent(chatId)}/messages`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  })
}

function extractText(result) {
  if (typeof result === 'string') return result
  return result?.text ?? result?.message ?? result?.content ?? result?.choices?.[0]?.message?.content ?? 'Nera tidak mengirim jawaban.'
}

export async function sendChat(prompt) {
  const token = await loadSession()
  if (!token) throw new Error('Session Axynera tidak tersedia.')
  const text = Array.isArray(prompt) ? prompt.at(-1)?.content : prompt
  const result = await apiRequest('/v1/chat/completions', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: text || '' }],
      stream: false
    })
  })
  return extractText(result)
}

async function ensureSdk() {
  if (!sdkPromise) {
    sdkPromise = import('./vendor/axynera.mjs').catch((e) => {
      sdkPromise = null
      throw e
    })
  }
  const mod = await sdkPromise
  const Axynera = mod.default
  if (!Axynera) throw new Error('Axynera SDK tidak tersedia.')
  const token = await loadSession()
  const nera = new Axynera({ model: MODEL })
  if (token) nera.setSession(token)
  return nera
}

// Fitur tambahan tetap lewat SDK, tetapi tidak menghalangi startup/login/chat utama.
export async function streamChat(prompt){const nera=await ensureSdk();const text=Array.isArray(prompt)?prompt.at(-1)?.content:prompt;return nera.stream(text||'')}
export async function vision(prompt,file){return (await ensureSdk()).vision(prompt,file)}
export async function webSearch(query){return (await ensureSdk()).search(query)}
export async function inspectWeb(url){return (await ensureSdk()).inspectWeb(url)}
export async function runSandbox(command){return (await ensureSdk()).sandbox(command)}
export async function createFile(prompt){return (await ensureSdk()).createFile(prompt)}
export async function saveToDrive(prompt){return (await ensureSdk()).saveToDrive(prompt)}
export async function getModels(){return (await ensureSdk()).models()}
export async function getIdentity(){return (await ensureSdk()).identity()}
export async function createConversation(systemPrompt){return (await ensureSdk()).conversation(systemPrompt)}
