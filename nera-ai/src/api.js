const API_URL = 'https://api.axynera.my.id/v1/chat/completions'

export async function sendMessage(messages) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'Nera-V4',
      messages,
      stream: false,
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `HTTP ${response.status}`)
  }

  const data = await response.json()
  return data?.choices?.[0]?.message?.content ?? 'Nera belum mengirim jawaban.'
}
