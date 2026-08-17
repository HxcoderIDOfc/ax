const API_URL = import.meta.env.VITE_NERA_API_URL || 'https://api.axynera.my.id/v1/chat/completions'
const MODEL = import.meta.env.VITE_NERA_MODEL || 'Nera-V4'

export async function sendChat(messages) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, stream: false })
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `API error ${response.status}`)
  }

  const data = await response.json()
  return data?.choices?.[0]?.message?.content || data?.message || 'Nera tidak mengirim jawaban.'
}
