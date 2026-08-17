import { useState } from 'react'
import { Bot, Plus, Send, Settings, Sparkles, User } from 'lucide-react'
import { sendMessage } from './api'

export default function App() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hai 👋 Aku Nera AI. Ada yang bisa aku bantu hari ini?',
    },
  ])

  async function submit(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const reply = await sendMessage(next.map(({ role, content }) => ({ role, content })))
      setMessages((current) => [...current, { role: 'assistant', content: reply }])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: `Koneksi ke Nera sedang bermasalah: ${error.message}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function newChat() {
    setMessages([{ role: 'assistant', content: 'Chat baru siap ✨ Mau bahas apa?' }])
    setInput('')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={20} /></div>
          <div>
            <strong>Nera AI</strong>
            <span>by Axynera</span>
          </div>
        </div>

        <button className="new-chat" onClick={newChat}>
          <Plus size={18} /> New Chat
        </button>

        <div className="sidebar-spacer" />
        <button className="side-action"><Settings size={18} /> Settings</button>
      </aside>

      <main className="chat-panel">
        <header className="topbar">
          <div>
            <strong>Nera AI</strong>
            <span><i /> Online</span>
          </div>
          <div className="avatar"><User size={18} /></div>
        </header>

        <section className="messages">
          <div className="welcome">
            <div className="nera-orb"><Sparkles size={30} /></div>
            <h1>Nera AI</h1>
            <p>Asisten AI dari Axynera untuk ngobrol, membantu ide, dan menyelesaikan pekerjaanmu.</p>
          </div>

          {messages.map((message, index) => (
            <article className={`message ${message.role}`} key={`${message.role}-${index}`}>
              <div className="message-icon">
                {message.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
              </div>
              <div className="bubble">{message.content}</div>
            </article>
          ))}

          {loading && (
            <article className="message assistant">
              <div className="message-icon"><Bot size={18} /></div>
              <div className="bubble typing"><span /><span /><span /></div>
            </article>
          )}
        </section>

        <form className="composer" onSubmit={submit}>
          <div className="composer-box">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  submit(e)
                }
              }}
              placeholder="Tanya apa saja ke Nera..."
              rows="1"
            />
            <button className="send" disabled={!input.trim() || loading} aria-label="Kirim">
              <Send size={19} />
            </button>
          </div>
          <small>Nera AI dapat membuat kesalahan. Periksa informasi penting.</small>
        </form>
      </main>
    </div>
  )
}
