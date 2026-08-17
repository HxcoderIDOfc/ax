import { useMemo, useState } from 'react'
import {
  Bot, ChevronRight, Clock3, Code2, FileText, Folder, Globe2, Home, Image,
  LogOut, Menu, MessageCircle, Plus, Search, Send, Settings, Sparkles, UserRound,
  Volume2, WandSparkles
} from 'lucide-react'
import { SocialLogin } from '@capgo/capacitor-social-login'
import { sendChat } from './api.js'

const googleClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || ''

const tools = [
  { id: 'chat', icon: MessageCircle, title: 'Chat', sub: 'Tanya apa saja' },
  { id: 'search', icon: Globe2, title: 'Search', sub: 'Cari di web' },
  { id: 'vision', icon: Image, title: 'Vision', sub: 'Analisis gambar' },
  { id: 'sandbox', icon: Code2, title: 'Sandbox', sub: 'Jalankan perintah' },
  { id: 'file', icon: FileText, title: 'Create File', sub: 'Buat file apa saja' },
  { id: 'tools', icon: WandSparkles, title: 'AI Tools', sub: 'Lainnya' },
]

export default function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('home')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [authBusy, setAuthBusy] = useState(false)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [prefs, setPrefs] = useState({ search: true, vision: true, sandbox: true, history: true, voice: true })

  const firstName = useMemo(() => user?.name?.split(' ')?.[0] || 'Kamu', [user])

  async function loginGoogle() {
    setError('')
    if (!googleClientId) {
      setError('Google Client ID belum dikonfigurasi di GitHub Actions.')
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
      setPage('home')
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
    setPage('home')
  }

  async function submit(e) {
    e?.preventDefault?.()
    const text = input.trim()
    if (!text || busy) return
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setPage('chat')
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

  function go(next) {
    setPage(next)
    setSidebarOpen(false)
  }

  function togglePref(key) {
    setPrefs(v => ({ ...v, [key]: !v[key] }))
  }

  if (!user) {
    return <main className="login-page">
      <div className="login-stars" />
      <div className="planet" />
      <section className="login-card">
        <div className="logo-box"><span>N</span><Sparkles size={24}/></div>
        <h1>Nera <em>AI</em></h1>
        <p>Asisten AI cerdas untuk membantu segala kebutuhanmu.</p>
        <button className="google-btn" onClick={loginGoogle} disabled={authBusy}>
          <b className="google-g">G</b>{authBusy ? 'Menghubungkan...' : 'Login dengan Google'}
        </button>
        {error && <div className="error-box">{error}</div>}
        <div className="login-safe">◈ &nbsp; Aman, cepat, dan nyaman</div>
        <small>Dengan masuk, kamu menyetujui<br/><a>Syarat Layanan</a> &amp; <a>Kebijakan Privasi</a></small>
      </section>
    </main>
  }

  const navItems = [
    ['home', Home, 'Home'], ['chat', MessageCircle, 'Chat'], ['tools', WandSparkles, 'AI Tools'],
    ['history', Clock3, 'History'], ['drive', Folder, 'Drive'], ['settings', Settings, 'Settings']
  ]

  return <div className="shell">
    <aside className={`side ${sidebarOpen ? 'open' : ''}`}>
      <div className="brand"><div className="mini-logo">N</div><b>Nera <i>AI</i></b></div>
      <nav>{navItems.map(([id, Icon, label]) => <button key={id} className={page===id?'active':''} onClick={() => go(id)}><Icon size={20}/><span>{label}</span></button>)}</nav>
      <div className="pro-card"><b>Nera Pro ✨</b><small>Upgrade untuk fitur lebih lengkap.</small><button>Upgrade</button></div>
    </aside>

    <main className="main">
      <header className="topbar">
        <button className="menu-btn" onClick={() => setSidebarOpen(v=>!v)}><Menu size={22}/></button>
        <div className="top-title">Nera <b>AI</b></div>
        <div className="top-actions"><span className="pro-pill">👑 Pro</span><button className="avatar-btn" onClick={() => go('settings')}>{user.image ? <img src={user.image} alt=""/> : <UserRound size={20}/>}</button></div>
      </header>

      {page === 'home' && <section className="page dashboard">
        <div className="hero"><h1>Hai, <span>{firstName}!</span> 👋</h1><p>Ada yang bisa Nera bantu hari ini?</p></div>
        <div className="tool-grid">{tools.map(({id,icon:Icon,title,sub}) => <button className="tool-card" key={id} onClick={() => go(id === 'chat' ? 'chat' : 'tools')}><div className={`tool-icon ${id}`}><Icon size={24}/></div><b>{title}</b><small>{sub}</small></button>)}</div>
        <div className="model-card"><span>Model Aktif</span><div><Sparkles size={19}/><b>Nera-V4</b><ChevronRight size={18}/></div></div>
        <div className="history-card"><h3>Riwayat Terakhir</h3>{['Buatkan landing page modern','Jelaskan konsep React Server Component','Bantu analisis gambar arsitektur'].map((x,i)=><button key={x} onClick={()=>go('chat')}><MessageCircle size={16}/><div><b>{x}</b><small>{i===0?'2 menit yang lalu':i===1?'1 jam yang lalu':'3 jam yang lalu'}</small></div><ChevronRight size={16}/></button>)}</div>
        <button className="fab" onClick={() => { setMessages([]); go('chat') }}><Plus size={28}/></button>
      </section>}

      {page === 'chat' && <section className="chat-page">
        <div className="chat-head"><div><h2>Chat dengan Nera</h2><span><i/> Online · Nera-V4</span></div><button onClick={()=>setMessages([])}><Plus size={18}/> Chat baru</button></div>
        <div className="messages">{messages.length===0?<div className="empty"><div className="logo-box tiny"><span>N</span></div><h2>Apa yang ingin kamu tanyakan?</h2><p>Nera siap membantu kapan saja.</p></div>:messages.map((m,i)=><div key={i} className={`message ${m.role}`}><div className="msg-avatar">{m.role==='assistant'?<Bot size={18}/>:<UserRound size={18}/>}</div><div className="bubble">{m.content}</div></div>)}{busy&&<div className="message assistant"><div className="msg-avatar"><Bot size={18}/></div><div className="bubble">Nera sedang berpikir...</div></div>}</div>
        <div className="composer-wrap">{error&&<div className="error-line">{error}</div>}<form className="composer" onSubmit={submit}><button type="button"><Plus size={19}/></button><textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Ketik pesan kamu..." rows="1" onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit(e)}}}/><button className="send" type="submit"><Send size={19}/></button></form></div>
      </section>}

      {page === 'settings' && <section className="page settings-page">
        <div className="settings-title"><h2>Pengaturan</h2></div>
        <div className="profile-card">{user.image?<img src={user.image} alt=""/>:<div className="profile-fallback"><UserRound/></div>}<div><h3>{user.name} <span>Pro</span></h3><p>{user.email}</p><button>Kelola Akun</button></div></div>
        <SettingsGroup title="Preferensi" rows={[
          ['Tema','Gelap'],['Bahasa','Indonesia'],['Model Default','Nera-V4'],['Ukuran Teks','Sedang']
        ]}/>
        <div className="settings-group"><h4>Fitur</h4>{[['voice','Suara Respons',Volume2],['search','Aktifkan Search Web',Search],['vision','Aktifkan Vision',Image],['sandbox','Aktifkan Sandbox',Code2],['history','Simpan Riwayat Chat',Clock3]].map(([key,label,Icon])=><div className="setting-row" key={key}><Icon size={19}/><span>{label}</span><button className={`switch ${prefs[key]?'on':''}`} onClick={()=>togglePref(key)}><i/></button></div>)}</div>
        <div className="settings-group"><h4>Lainnya</h4><button className="setting-link"><Sparkles size={19}/><span>Tentang Nera AI</span><ChevronRight size={18}/></button><button className="setting-link danger" onClick={logout}><LogOut size={19}/><span>Keluar</span></button></div>
        <div className="version">Nera AI v1.0.0</div>
      </section>}

      {['tools','history','drive'].includes(page) && <section className="page placeholder"><div className="logo-box tiny"><Sparkles/></div><h2>{page==='tools'?'AI Tools':page==='history'?'Riwayat Chat':'Nera Drive'}</h2><p>Halaman ini sudah disiapkan dan akan terhubung ke fitur SDK Nera.</p></section>}

      <nav className="bottom-nav">{[['home',Home,'Home'],['chat',MessageCircle,'Chat'],['new',Plus,''],['tools',WandSparkles,'AI Tools'],['settings',Settings,'Settings']].map(([id,Icon,label])=><button key={id} className={`${page===id?'active':''} ${id==='new'?'nav-plus':''}`} onClick={()=>id==='new'?(setMessages([]),go('chat')):go(id)}><Icon size={id==='new'?26:20}/>{label&&<span>{label}</span>}</button>)}</nav>
    </main>
  </div>
}

function SettingsGroup({ title, rows }) {
  return <div className="settings-group"><h4>{title}</h4>{rows.map(([label,value])=><button className="setting-link" key={label}><Sparkles size={18}/><span>{label}</span><em>{value}</em><ChevronRight size={17}/></button>)}</div>
}
