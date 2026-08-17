import { useEffect, useMemo, useState } from 'react'
import { Bot, ChevronRight, Clock3, Code2, FileText, Folder, Globe2, Home, Image, LogOut, Menu, MessageCircle, Plus, Send, Settings, Sparkles, UserRound, WandSparkles, ShieldAlert, RefreshCw } from 'lucide-react'
import { SocialLogin } from '@capgo/capacitor-social-login'
import { getMe, loginWithGoogle, logoutSession, restoreSession, sendChat } from './api.js'

const googleClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || ''
const tools = [
  { id:'chat', icon:MessageCircle, title:'Chat', sub:'Tanya apa saja' },
  { id:'search', icon:Globe2, title:'Search', sub:'Cari di web' },
  { id:'vision', icon:Image, title:'Vision', sub:'Analisis gambar' },
  { id:'sandbox', icon:Code2, title:'Sandbox', sub:'Jalankan perintah' },
  { id:'file', icon:FileText, title:'Create File', sub:'Buat file apa saja' },
  { id:'tools', icon:WandSparkles, title:'AI Tools', sub:'Lainnya' },
]

function normalizeUser(raw={}) {
  const u = raw?.user || raw
  const status = String(u?.status || u?.account_status || '').toLowerCase()
  const banned = Boolean(u?.banned || u?.is_banned || ['banned','suspended','blocked'].includes(status))
  const until = u?.banned_until || u?.ban_until || u?.suspended_until || null
  const permanent = Boolean(u?.ban_permanent || u?.permanent_ban || (banned && !until && status === 'banned'))
  return {
    name:u?.name || u?.displayName || 'Pengguna Nera', email:u?.email || '', image:u?.image || u?.imageUrl || u?.photoUrl || '',
    plan:u?.plan || 'Free', storage:u?.storage || null, banned, permanent,
    banReason:u?.ban_reason || u?.banned_reason || u?.suspension_reason || 'Akun ini dibatasi oleh sistem Axynera.',
    bannedUntil:until, status:status || (banned ? 'banned' : 'active')
  }
}

export default function App(){
  const [booting,setBooting]=useState(true),[user,setUser]=useState(null),[page,setPage]=useState('home'),[messages,setMessages]=useState([]),[input,setInput]=useState(''),[busy,setBusy]=useState(false),[authBusy,setAuthBusy]=useState(false),[error,setError]=useState(''),[sidebarOpen,setSidebarOpen]=useState(false)
  const [prefs,setPrefs]=useState({search:true,vision:true,sandbox:true,history:true,voice:true})
  const firstName=useMemo(()=>user?.name?.split(' ')?.[0]||'Kamu',[user])

  useEffect(()=>{(async()=>{try{const me=await restoreSession();if(me)setUser(normalizeUser(me))}finally{setBooting(false)}})()},[])

  async function loginGoogle(){
    setError('')
    if(!googleClientId){setError('Google Client ID belum dikonfigurasi di GitHub Actions.');return}
    try{
      setAuthBusy(true)
      await SocialLogin.initialize({google:{webClientId:googleClientId,mode:'online'}})
      const login=await SocialLogin.login({
        provider:'google',
        options:{
          filterByAuthorizedAccounts:false,
          style:'standard'
        }
      })
      const r=login?.result||{}
      const googleIdToken=r?.idToken||r?.authentication?.idToken
      if(!googleIdToken)throw new Error('Google Sign-In tidak mengirim ID token.')
      await loginWithGoogle(googleIdToken)
      setUser(normalizeUser(await getMe()))
    }catch(e){
      const message=String(e?.message||e||'Login Google gagal.')
      if(message.includes('[16]')||message.toLowerCase().includes('reauth')){
        setError('Google gagal mengautentikasi ulang akun. Pastikan akun ini diizinkan pada OAuth Axynera dan coba pilih akun Google lagi.')
      }else setError(message)
    }finally{setAuthBusy(false)}
  }

  async function logout(){try{await SocialLogin.logout({provider:'google'})}catch{}await logoutSession();setUser(null);setMessages([]);setPage('home')}
  async function recheckAccount(){setBusy(true);try{setUser(normalizeUser(await getMe()))}catch(e){setError(e?.message||'Gagal memeriksa status akun.')}finally{setBusy(false)}}
  async function submit(e){e?.preventDefault?.();const text=input.trim();if(!text||busy)return;const next=[...messages,{role:'user',content:text}];setMessages(next);setInput('');setBusy(true);setError('');try{const answer=await sendChat(text);setMessages([...next,{role:'assistant',content:answer}])}catch(e){setError(e?.message||'Tidak dapat menghubungi Nera.')}finally{setBusy(false)}}
  const go=p=>{setPage(p);setSidebarOpen(false)}

  if(booting)return <main className="login-page"><div className="login-stars"/><section className="login-card"><div className="logo-box"><span>N</span><Sparkles/></div><h1>Nera <em>AI</em></h1><p>Memulihkan sesi Axynera...</p></section></main>
  if(!user)return <main className="login-page"><div className="login-stars"/><div className="planet"/><section className="login-card"><div className="logo-box"><span>N</span><Sparkles/></div><h1>Nera <em>AI</em></h1><p>Asisten AI cerdas untuk membantu segala kebutuhanmu.</p><button className="google-btn" onClick={loginGoogle} disabled={authBusy}><span className="google-g">G</span>{authBusy?'Menghubungkan...':'Login dengan Google'}</button><div className="login-safe">♢ &nbsp; Aman, cepat, dan nyaman</div>{error&&<div className="error-box">{error}</div>}<small>Dengan masuk, kamu menyetujui<br/><a>Syarat Layanan</a> & <a>Kebijakan Privasi</a></small></section></main>
  if(user.banned)return <BannedPage user={user} busy={busy} onCheck={recheckAccount} onLogout={logout}/>

  const nav=[['home',Home,'Home'],['chat',MessageCircle,'Chat'],['tools',WandSparkles,'AI Tools'],['history',Clock3,'History'],['drive',Folder,'Drive'],['settings',Settings,'Settings']]
  return <div className="shell"><aside className={`side ${sidebarOpen?'open':''}`}><div className="brand"><span className="mini-logo">N</span>Nera <i>AI</i></div><nav>{nav.map(([id,I,l])=><button key={id} className={page===id?'active':''} onClick={()=>go(id)}><I size={18}/><span>{l}</span></button>)}</nav><div className="pro-card"><b>Nera Pro ✨</b><small>Upgrade untuk fitur lebih lengkap.</small><button>Upgrade</button></div></aside><main className="main"><header className="topbar"><button className="menu-btn" onClick={()=>setSidebarOpen(!sidebarOpen)}><Menu/></button><span className="top-title">Nera <b>AI</b></span><div className="top-actions"><span className="pro-pill">♛ {user.plan||'Free'}</span><button className="avatar-btn" onClick={()=>go('settings')}>{user.image?<img src={user.image} alt=""/>:<UserRound/>}</button></div></header>{page==='home'&&<HomePage firstName={firstName} go={go}/>} {page==='chat'&&<ChatPage messages={messages} input={input} setInput={setInput} submit={submit} busy={busy} error={error}/>} {page==='settings'&&<SettingsPage user={user} prefs={prefs} setPrefs={setPrefs} logout={logout}/>} {!['home','chat','settings'].includes(page)&&<section className="placeholder"><Sparkles/><h2>{nav.find(n=>n[0]===page)?.[2]}</h2><p>Modul ini sudah disiapkan untuk integrasi Axynera SDK.</p></section>}<nav className="bottom-nav">{[['home',Home,'Home'],['chat',MessageCircle,'Chat'],['new',Plus,''],['tools',WandSparkles,'AI Tools'],['settings',Settings,'Settings']].map(([id,I,l])=><button key={id} className={`${page===id?'active':''} ${id==='new'?'nav-plus':''}`} onClick={()=>id==='new'?go('chat'):go(id)}><I size={20}/><span>{l}</span></button>)}</nav></main></div>
}

function BannedPage({user,busy,onCheck,onLogout}){const until=user.bannedUntil?new Date(user.bannedUntil):null;const valid=until&&!Number.isNaN(until.getTime());return <main className="banned-page"><div className="banned-glow"/><section className="banned-card"><div className="ban-icon"><ShieldAlert size={38}/></div><span className="ban-label">AXYNERA SECURITY</span><h1>{user.permanent?'Akun dibanned permanen':'Akun ditangguhkan'}</h1><p className="ban-desc">Akses ke Nera AI untuk akun ini sedang dinonaktifkan oleh sistem.</p><div className="ban-info"><span>Alasan</span><b>{user.banReason}</b></div><div className="ban-info"><span>Durasi</span><b>{user.permanent?'Permanen':valid?until.toLocaleString('id-ID'):'Sampai dicabut oleh sistem'}</b></div><button className="ban-check" onClick={onCheck} disabled={busy}><RefreshCw size={18}/>{busy?'Memeriksa...':'Periksa status lagi'}</button><button className="ban-logout" onClick={onLogout}><LogOut size={18}/>Keluar dari akun</button><small>Jika menurutmu ini keliru, hubungi dukungan Axynera.</small></section></main>}
function HomePage({firstName,go}){return <section className="page"><div className="hero"><h1>Hai, <span>{firstName}!</span> 👋</h1><p>Ada yang bisa Nera bantu hari ini?</p></div><div className="tool-grid">{tools.map(t=><button className="tool-card" key={t.id} onClick={()=>go(t.id==='chat'?'chat':t.id)}><span className={`tool-icon ${t.id}`}><t.icon/></span><b>{t.title}</b><small>{t.sub}</small></button>)}</div><div className="model-card"><span>Model Aktif</span><div><Sparkles/><b>Nera-V4</b><ChevronRight/></div></div><div className="history-card"><h3>Riwayat Terakhir</h3>{['Buatkan landing page modern','Jelaskan konsep React Server Component','Bantu analisis gambar arsitektur'].map((x,i)=><button key={x}><MessageCircle/><span><b>{x}</b><small>{i+2} menit yang lalu</small></span><ChevronRight/></button>)}</div><button className="fab" onClick={()=>go('chat')}><Plus/></button></section>}
function ChatPage({messages,input,setInput,submit,busy,error}){return <section className="chat-page"><div className="chat-head"><div><h2>Nera AI</h2><span><i/>Online</span></div><button><Plus size={17}/>Chat baru</button></div><div className="messages">{messages.length?messages.map((m,i)=><div className={`message ${m.role}`} key={i}><span className="msg-avatar">{m.role==='assistant'?<Bot/>:<UserRound/>}</span><div className="bubble">{m.content}</div></div>):<div className="empty"><div className="logo-box tiny"><span>N</span></div><h2>Mulai chat dengan Nera</h2><p>Tanyakan apa saja.</p></div>}{busy&&<div className="message assistant"><span className="msg-avatar"><Bot/></span><div className="bubble">Nera sedang berpikir...</div></div>}</div><div className="composer-wrap">{error&&<div className="error-line">{error}</div>}<form className="composer" onSubmit={submit}><button type="button"><Plus/></button><textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Ketik pesan kamu..."/><button className="send"><Send/></button></form></div></section>}
function SettingsPage({user,prefs,setPrefs,logout}){const toggle=k=>setPrefs({...prefs,[k]:!prefs[k]});return <section className="page settings-page"><div className="settings-title"><h2>Pengaturan</h2></div><div className="profile-card">{user.image?<img src={user.image}/>:<span className="profile-fallback"><UserRound/></span>}<div><h3>{user.name} <span>{user.plan||'Free'}</span></h3><p>{user.email}</p><button>{user.storage?`Storage: ${user.storage}`:'Akun Axynera'}</button></div></div><div className="settings-group"><h4>Preferensi</h4>{[['Tema','Gelap'],['Bahasa','Indonesia'],['Model Default','Nera-V4'],['Ukuran Teks','Sedang']].map(x=><button className="setting-link" key={x[0]}><span>{x[0]}</span><em>{x[1]}</em><ChevronRight/></button>)}</div><div className="settings-group"><h4>Fitur</h4>{[['search','Aktifkan Search Web'],['vision','Aktifkan Vision'],['sandbox','Aktifkan Sandbox'],['history','Simpan Riwayat Chat']].map(([k,l])=><div className="setting-row" key={k}><span>{l}</span><button className={`switch ${prefs[k]?'on':''}`} onClick={()=>toggle(k)}><i/></button></div>)}</div><div className="settings-group"><h4>Akun</h4><button className="setting-link danger" onClick={logout}><LogOut/><span>Keluar</span></button></div><p className="version">Nera AI v0.1.0</p></section>}
