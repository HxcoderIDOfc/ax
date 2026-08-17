import { clearSession, loadSession, saveSession } from './session.js'
import { requestCoreMediaPermissions } from './native.js'

const MODEL = import.meta.env.VITE_NERA_MODEL || 'Nera-V4'
const AUTH = 'https://auth.axynera.my.id'
const API = 'https://api.axynera.my.id'
let conversation = []
let activeChatController = null

async function req(url, options={}, timeout=20000){
  const ownController = options.signal ? null : new AbortController()
  const signal = options.signal || ownController.signal
  const t = ownController ? setTimeout(()=>ownController.abort(),timeout) : null
  try{
    const r=await fetch(url,{...options,signal}); const text=await r.text(); let data={}
    try{data=text?JSON.parse(text):{}}catch{data={message:text}}
    if(!r.ok){const e=new Error(String(data?.error?.message||data?.error||data?.message||`HTTP ${r.status}`));e.status=r.status;throw e}
    return data
  }catch(e){if(e?.name==='AbortError')throw new Error('REQUEST_CANCELLED');throw e}finally{if(t)clearTimeout(t)}
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
export async function getProfile(){const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.');return req(`${AUTH}/v1/profile`,{headers:authHeaders(t)})}
export async function updateProfile({name,avatar}={}){const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.');const body={};if(name!==undefined)body.name=name;if(avatar!==undefined)body.avatar=avatar;return req(`${AUTH}/v1/profile`,{method:'PATCH',headers:authHeaders(t,{'Content-Type':'application/json'}),body:JSON.stringify(body)},25000)}
export async function getCredits(){const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.');return req(`${AUTH}/v1/credits`,{headers:authHeaders(t)})}
export async function getStorage(){const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.');return req(`${AUTH}/v1/storage`,{headers:authHeaders(t)})}
export async function getChats(){const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.');return req(`${AUTH}/v1/chats`,{headers:authHeaders(t)})}
export async function createChat(title='Chat baru'){const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.');return req(`${AUTH}/v1/chats`,{method:'POST',headers:authHeaders(t,{'Content-Type':'application/json'}),body:JSON.stringify({title})})}
export async function getChat(id){const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.');return req(`${AUTH}/v1/chats/${encodeURIComponent(id)}`,{headers:authHeaders(t)})}
export async function appendChat(id,message,title){const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.');return req(`${AUTH}/v1/chats/${encodeURIComponent(id)}`,{method:'POST',headers:authHeaders(t,{'Content-Type':'application/json'}),body:JSON.stringify({message,title})})}
export async function deleteChat(id){const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.');return req(`${AUTH}/v1/chats/${encodeURIComponent(id)}`,{method:'DELETE',headers:authHeaders(t)})}

export async function logoutSession(){const t=await token();if(t){try{await req(`${AUTH}/v1/logout`,{method:'POST',headers:authHeaders(t)})}catch{}}conversation=[];cancelChat();await clearSession()}

export function cancelChat(){if(activeChatController){activeChatController.abort();activeChatController=null;return true}return false}
function prepareConversation(input){if(Array.isArray(input))conversation=input.filter(x=>x&&typeof x.content==='string').map(x=>({role:x.role,content:x.content})).slice(-40);else conversation=[...conversation,{role:'user',content:String(input||'')}].slice(-40);return conversation}

export async function streamChat(input,{onToken,onStage}={}){
  const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.')
  prepareConversation(input)
  activeChatController=new AbortController()
  const timeout=setTimeout(()=>activeChatController?.abort(),120000)
  let full=''
  try{
    onStage?.({id:'context',label:'Membaca pesan dan konteks',state:'active'})
    await new Promise(r=>setTimeout(r,100))
    onStage?.({id:'context',label:'Membaca pesan dan konteks',state:'done'})
    onStage?.({id:'connect',label:'Menghubungi Nera-V4',state:'active'})
    const response=await fetch(`${API}/v1/chat/completions`,{method:'POST',headers:authHeaders(t,{'Content-Type':'application/json',Accept:'text/event-stream'}),body:JSON.stringify({model:MODEL,messages:conversation,stream:true}),signal:activeChatController.signal})
    if(!response.ok){const text=await response.text();const e=new Error(text||`API ${response.status}`);e.status=response.status;throw e}
    if(!response.body)throw new Error('Browser tidak mendukung SSE streaming.')
    onStage?.({id:'connect',label:'Menghubungi Nera-V4',state:'done'})
    onStage?.({id:'stream',label:'Menerima jawaban streaming',state:'active'})
    const reader=response.body.getReader(),decoder=new TextDecoder();let buffer=''
    while(true){
      const {value,done}=await reader.read();if(done)break
      buffer+=decoder.decode(value,{stream:true})
      let idx
      while((idx=buffer.indexOf('\n\n'))>=0){
        const block=buffer.slice(0,idx);buffer=buffer.slice(idx+2)
        for(const line of block.split('\n')){
          if(!line.startsWith('data:'))continue
          const payload=line.slice(5).trim();if(!payload||payload==='[DONE]')continue
          try{const data=JSON.parse(payload);const delta=data?.choices?.[0]?.delta?.content??data?.delta?.content??data?.text;if(typeof delta==='string'&&delta){full+=delta;onToken?.(delta,full)}}catch{}
        }
      }
    }
    onStage?.({id:'stream',label:'Menerima jawaban streaming',state:'done'})
    onStage?.({id:'final',label:'Menyelesaikan respons',state:'done'})
    conversation=[...conversation,{role:'assistant',content:full}].slice(-40)
    return full
  }catch(e){if(e?.name==='AbortError')throw new Error('REQUEST_CANCELLED');throw e}finally{clearTimeout(timeout);activeChatController=null}
}

export async function sendChat(input,onStage){let latest='';return streamChat(input,{onToken:(_,full)=>{latest=full},onStage:(s)=>onStage?.(typeof s==='string'?s:s.label)}).then(x=>x||latest)}
export function resetChatContext(){conversation=[]}
