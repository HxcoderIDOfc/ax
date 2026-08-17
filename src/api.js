import { clearSession, loadSession, saveSession } from './session.js'
import { requestCoreMediaPermissions } from './native.js'

const MODEL = import.meta.env.VITE_NERA_MODEL || 'Nera-V4'
const AUTH = 'https://auth.axynera.my.id'
const API = 'https://api.axynera.my.id'
let conversation = []

async function req(url, options={}, timeout=20000){
  const c=new AbortController(); const t=setTimeout(()=>c.abort(),timeout)
  try{
    const r=await fetch(url,{...options,signal:c.signal}); const text=await r.text(); let data={}
    try{data=text?JSON.parse(text):{}}catch{data={message:text}}
    if(!r.ok){const e=new Error(String(data?.error?.message||data?.error||data?.message||`HTTP ${r.status}`));e.status=r.status;throw e}
    return data
  }catch(e){if(e?.name==='AbortError')throw new Error('Koneksi Axynera timeout.');throw e}finally{clearTimeout(t)}
}

async function token(){return loadSession()}
function authHeaders(t,extra={}){return {Accept:'application/json',...(t?{Authorization:`Bearer ${t}`} : {}),...extra}}

export async function restoreSession(){const t=await token();if(!t)return null;try{return await req(`${AUTH}/v1/me`,{headers:authHeaders(t)})}catch{await clearSession();return null}}

export async function loginWithGoogle(idToken){
  if(!idToken)throw new Error('Google ID token tidak tersedia.')
  let last
  for(const body of [{googleIdToken:idToken},{idToken},{id_token:idToken}]){
    try{
      const out=await req(`${AUTH}/v1/google`,{method:'POST',headers:authHeaders(null,{'Content-Type':'application/json'}),body:JSON.stringify(body)},25000)
      const t=out?.token||out?.session||out?.access_token||out?.data?.token
      if(!t)throw new Error('Axynera Auth tidak mengirim session token.')
      await saveSession(t); conversation=[]; requestCoreMediaPermissions().catch(()=>{}); return {...out,token:t}
    }catch(e){last=e;if(![400,404,415,422].includes(e?.status))throw e}
  }
  throw last||new Error('Login Axynera gagal.')
}

export async function getMe(){const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.');return req(`${AUTH}/v1/me`,{headers:authHeaders(t)})}

export async function logoutSession(){const t=await token();if(t){try{await req(`${AUTH}/v1/logout`,{method:'POST',headers:authHeaders(t)})}catch{}}conversation=[];await clearSession()}

export async function sendChat(input){
  const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.')
  if(Array.isArray(input))conversation=input.filter(x=>x&&typeof x.content==='string').map(x=>({role:x.role,content:x.content})).slice(-40)
  else conversation=[...conversation,{role:'user',content:String(input||'')}].slice(-40)
  const body={model:MODEL,messages:conversation,stream:false}; let last
  for(let i=0;i<2;i++){
    try{
      const out=await req(`${API}/v1/chat/completions`,{method:'POST',headers:authHeaders(t,{'Content-Type':'application/json'}),body:JSON.stringify(body)},90000)
      const text=out?.text??out?.message??out?.content??out?.choices?.[0]?.message?.content??'Nera tidak mengirim jawaban.'
      conversation=[...conversation,{role:'assistant',content:text}].slice(-40);return text
    }catch(e){last=e;const retry=!e?.status||[429,500,502,503,504].includes(e.status)||String(e?.message||'').toLowerCase().includes('timeout');if(!retry||i===1)break;await new Promise(r=>setTimeout(r,800))}
  }
  throw last||new Error('Tidak dapat menghubungi Nera.')
}

export function resetChatContext(){conversation=[]}
