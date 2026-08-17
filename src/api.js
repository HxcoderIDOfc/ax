import Axynera from 'https://sdk.axynera.my.id/v/0.3.0/axynera.mjs'

const MODEL = import.meta.env.VITE_NERA_MODEL || 'Nera-V4'

export const nera = new Axynera({
  model: MODEL,
})

function extractText(result) {
  if (typeof result === 'string') return result
  return result?.text ?? result?.message ?? result?.content ?? result?.choices?.[0]?.message?.content ?? 'Nera tidak mengirim jawaban.'
}

export async function sendChat(messages) {
  try {
    const result = await nera.chat(messages)
    return extractText(result)
  } catch (error) {
    const message = error?.message || 'Gagal menghubungi Nera lewat Axynera SDK.'
    const code = error?.code ? ` (${error.code})` : ''
    throw new Error(`${message}${code}`)
  }
}

export async function streamChat(messages, onChunk) {
  return nera.stream(messages, onChunk)
}

export async function vision(prompt, file) {
  return nera.vision(prompt, file)
}

export async function webSearch(query) {
  return nera.search(query)
}

export async function inspectWeb(url) {
  return nera.inspectWeb(url)
}

export async function runSandbox(command) {
  return nera.sandbox(command)
}

export async function createFile(prompt) {
  return nera.createFile(prompt)
}

export async function saveToDrive(prompt) {
  return nera.saveToDrive(prompt)
}

export async function getModels() {
  return nera.models()
}

export async function getIdentity() {
  return nera.identity()
}

export function createConversation(systemPrompt) {
  return nera.conversation(systemPrompt)
}
