import { useMemo, useState } from 'react'
import { LogIn, LogOut, Menu, Plus, Send, Sparkles, UserRound } from 'lucide-react'
import { SocialLogin } from '@capgo/capacitor-social-login'
import { sendChat } from './api.js'

const googleClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || ''

export default function App() {
  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [authBusy, setAuthBusy] = useState(false)
  const [error, setError] = useState('')

  const welcome = useMemo(() => user?.name ? `Ada yang bisa Nera bantu, ${user.name.split(' ')[0]}?` : 'Apa yang ingin kamu tanyakan?', [user])

  async function loginGoogle() {
    setError('')
    if (!googleClientId) {
      setError('Google Client ID belum dikonfigurasi. Tambahkan secret VITE_GOOGLE_WEB_CLIENT_ID di GitHub Actions.')
      return
    }
    try {
      setAuthBusy(true)
      await SocialLogin.initialize({ google: { webClientId: googleClientId, mode: 'online' } })
      const login = await SocialLogin.login({
        provider: 'google',
        options: { scopes: ['email', 'profile'], filterByAuthorizedAccounts: false }
      })
      const profile = login?.result?.profile || login?.result
      setUser({
        name: profile?.name || profile?.displayName || 'Pengguna Nera',
        email: profile?.email || '',
        image: profile?.imageUrl || profile?.photoUrl || ''
      })
    } catch (e) {
      setError(e?.message || 'Login Google gagal.')
    } finally {
      setAuthBusy(false)
    }
  }

  async function logout() {
    try { await SocialLogin.logout({ provider: 'google' }) } catch {}
    setUser(null)
    setMessages([])
  }

  async function submit(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setError('')
    setBusy(true)
    try {
      const answer = await sendChat(next)
      setMessages([...next, { role: 'assistant', content: answer }])
    } catch (e) {
      setError(e?.message || 'Tidak dapat menghubungi Nera.')
    } finally {
      setBusy(false)
    }
  }

  if (!user) {
    return <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-mark"><Sparkles size={28}/></div>
        <h1>Nera AI</h1>
        <p>Asisten AI dari Axynera untuk ngobrol, belajar, mencari ide, dan membantu pekerjaanmu.</p>
        <button className="google-btn" onClick={loginGoogle} disabled={authBusy}>
          <LogIn size={19}/>{authBusy ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}
        </button>
        {error && <div className="error-box">{error}</div>}
      </section>
    </main>
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark small"><Sparkles size={18}/></div><b>Nera AI</b></div>
      <button className="new-chat" onClick={() => setMessages([])}><Plus size={18}/> Chat baru</button>
      <div className="sidebar-space" />
      <div className="profile-row">
        {user.image ? <img src={user.image} alt=""/> : <UserRound size={21}/>} 
        <div><b>{user.name}</b><span>{user.email}</span></div>
        <button className="icon-btn" onClick={logout}><LogOut size={17}/></button>
      </div>
    </aside>

    <main className="chat">
      <header><button className="mobile-menu"><Menu size={21}/></button><span>Nera AI</span><span className="status">Online</span></header>
      <section className="messages">
        {messages.length === 0 ? <div className="empty"><div className="brand-mark"><Sparkles size={28}/></div><h2>{welcome}</h2><p>Nera siap membantu kapan saja.</p></div> : messages.map((m, i) => <div key={i} className={`message ${m.role}`}><div className="bubble">{m.content}</div></div>)}
        {busy && <div className="message assistant"><div className="bubble typing">Nera sedang berpikir<span>...</span></div></div>}
      </section>
      <div className="composer-wrap">
        {error && <div className="error-line">{error}</div>}
        <form className="composer" onSubmit={submit}>
          <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Tanya Nera..." rows="1" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e) } }}/>
          <button type="submit" disabled={!input.trim() || busy}><Send size={19}/></button>
        </form>
      </div>
    </main>
  </div>
}
