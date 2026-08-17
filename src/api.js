import { Capacitor, CapacitorHttp } from '@capacitor/core'
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

function numberOrZero(v){const n=Number(v);return Number.isFinite(n)?n:0}
function limitFromMe(raw={}){
  const u=raw?.user||raw?.data?.user||raw?.data||raw
  const usage=u?.usage||{},limits=u?.limits||{},sub=u?.subscription||{}
  const unlimited=Boolean(sub?.unlimited||u?.unlimited||String(u?.limit_label||'').toLowerCase()==='unlimited')
  const used=numberOrZero(usage.input_tokens)+numberOrZero(usage.output_tokens)
  const inLimit=limits.input_tokens,outLimit=limits.output_tokens
  const hasFiniteLimits=inLimit!=null&&outLimit!=null&&Number.isFinite(Number(inLimit))&&Number.isFinite(Number(outLimit))
  const limit=unlimited?Infinity:(hasFiniteLimits?numberOrZero(inLimit)+numberOrZero(outLimit):0)
  return {used,limit,unlimited,usage,limits,remaining:u?.remaining||{},subscription:sub,limit_label:unlimited?'∞':u?.limit_label}
}

function safeAccountContext(raw={}){
  const u=raw?.user||raw?.data?.user||raw?.data||raw,sub=u?.subscription||{},storage=u?.storage||{},usage=u?.usage||{},limits=u?.limits||{},remaining=u?.remaining||{}
  const unlimited=Boolean(sub?.unlimited||u?.unlimited||String(u?.limit_label||'').toLowerCase()==='unlimited')
  const safe={name:u?.name||null,role:sub?.role||u?.role||null,plan:sub?.plan||u?.plan||null,unlimited,storage:{used_bytes:storage?.used_bytes??0,limit_bytes:storage?.limit_bytes??null,remaining_bytes:storage?.remaining_bytes??null,files:storage?.files??null},usage:{input_tokens:usage?.input_tokens??0,output_tokens:usage?.output_tokens??0,vision:usage?.vision??0,files:usage?.files??0,search:usage?.search??0,sandbox:usage?.sandbox??0},limits:{input_tokens:limits?.input_tokens??null,output_tokens:limits?.output_tokens??null,vision:limits?.vision??null,files:limits?.files??null},remaining:{input_tokens:remaining?.input_tokens??null,output_tokens:remaining?.output_tokens??null,vision:remaining?.vision??null}}
  return {role:'system',content:`Konteks akun Axynera user saat ini (data live dari /v1/me; gunakan hanya bila relevan): ${JSON.stringify(safe)}. Jangan pernah mengklaim token sesi, API key, email, Google token, atau internal user ID karena data tersebut tidak diberikan.`}
}

export async function getCredits(){const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.');const[meResult,creditResult]=await Promise.allSettled([req(`${AUTH}/v1/me`,{headers:authHeaders(t)}),req(`${AUTH}/v1/credits`,{headers:authHeaders(t)})]);if(meResult.status!=='fulfilled'&&creditResult.status!=='fulfilled')throw meResult.reason||creditResult.reason;const live=meResult.status==='fulfilled'?limitFromMe(meResult.value):{},c=creditResult.status==='fulfilled'?(creditResult.value?.credits||creditResult.value?.data||creditResult.value):{};return{credits:{...c,...live,balance:c?.balance??c?.credits??c?.credit_balance??c?.available??0,unit:c?.unit||c?.currency||'credit'}}}
export async function getStorage(){const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.');return req(`${AUTH}/v1/storage`,{headers:authHeaders(t)})}
export async function getProfile(){const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.');return req(`${AUTH}/v1/profile`,{headers:authHeaders(t)})}
export async function updateProfile({name,avatar}={}){const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.');const body={};if(name!==undefined)body.name=String(name).trim();if(avatar!==undefined)body.avatar=String(avatar).trim();return req(`${AUTH}/v1/profile`,{method:'PATCH',headers:authHeaders(t,{'Content-Type':'application/json'}),body:JSON.stringify(body)},25000)}
export async function getChats(){const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.');return req(`${AUTH}/v1/chats`,{headers:authHeaders(t)})}
export async function createChat(title='Chat baru'){const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.');return req(`${AUTH}/v1/chats`,{method:'POST',headers:authHeaders(t,{'Content-Type':'application/json'}),body:JSON.stringify({title})})}
export async function getChat(id){const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.');return req(`${AUTH}/v1/chats/${encodeURIComponent(id)}`,{headers:authHeaders(t)})}
export async function appendChat(id,message,title){const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.');return req(`${AUTH}/v1/chats/${encodeURIComponent(id)}`,{method:'POST',headers:authHeaders(t,{'Content-Type':'application/json'}),body:JSON.stringify({message,title})})}
export async function deleteChat(id){const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.');return req(`${AUTH}/v1/chats/${encodeURIComponent(id)}`,{method:'DELETE',headers:authHeaders(t)})}

export async function logoutSession(){const t=await token();if(t){try{await req(`${AUTH}/v1/logout`,{method:'POST',headers:authHeaders(t)})}catch{}}conversation=[];cancelChat();await clearSession()}
export function cancelChat(){if(activeChatController){activeChatController.abort();activeChatController=null;return true}return false}
function validContent(content){return typeof content==='string'||Array.isArray(content)}
function prepareConversation(input){if(Array.isArray(input))conversation=input.filter(x=>x&&validContent(x.content)).map(x=>({role:x.role,content:x.content})).slice(-40);else conversation=[...conversation,{role:'user',content:String(input||'')}].slice(-40);return conversation}

async function nativeHttpFallback(messages,t,neraMode,onStage,onToken){
  if(!Capacitor.isNativePlatform())throw new Error('Native HTTP fallback hanya tersedia di Android.')
  onStage?.({id:'native-fallback',label:'Menghubungkan ulang lewat jaringan native',state:'active',kind:'thinking',activity:true})
  const out=await CapacitorHttp.request({
    url:`${API}/v1/chat/completions`,
    method:'POST',
    headers:authHeaders(t,{'Content-Type':'application/json',Accept:'application/json'}),
    data:{model:MODEL,messages,stream:false,nera_events:false,nera_mode:neraMode},
    connectTimeout:30000,
    readTimeout:90000
  })
  const status=Number(out?.status||0)
  if(status<200||status>=300){const msg=typeof out?.data==='string'?out.data:out?.data?.error?.message||out?.data?.error||`API ${status||'native'}`;throw new Error(String(msg))}
  const data=typeof out.data==='string'?JSON.parse(out.data):out.data
  const text=data?.choices?.[0]?.message?.content??data?.output_text??data?.text??''
  if(!text)throw new Error('Nera tidak mengirim jawaban.')
  onToken?.(text,text)
  onStage?.({id:'native-done',label:'Jawaban diterima',state:'done',kind:'done'})
  return text
}

export async function streamChat(input,{onToken,onStage,mode='cepat'}={}){
  const t=await token();if(!t)throw new Error('Session Axynera tidak tersedia.')
  prepareConversation(input)
  try{const me=await req(`${AUTH}/v1/me`,{headers:authHeaders(t)},7000);conversation=[safeAccountContext(me),...conversation].slice(-41)}catch{}
  activeChatController=new AbortController();const timeout=setTimeout(()=>activeChatController?.abort(),120000);let full='',eventSeq=0
  const neraMode=String(mode||'cepat').toLowerCase()==='pintar'?'pintar':'cepat'
  try{
    let response
    try{response=await fetch(`${API}/v1/chat/completions`,{method:'POST',headers:authHeaders(t,{'Content-Type':'application/json',Accept:'text/event-stream'}),body:JSON.stringify({model:MODEL,messages:conversation,stream:true,nera_events:true,nera_mode:neraMode}),signal:activeChatController.signal})}
    catch(fetchError){if(fetchError?.name==='AbortError')throw fetchError;clearTimeout(timeout);activeChatController=null;return await nativeHttpFallback(conversation,t,neraMode,onStage,onToken)}
    if(!response.ok){const text=await response.text();const e=new Error(text||`API ${response.status}`);e.status=response.status;throw e}
    if(!response.body)return await nativeHttpFallback(conversation,t,neraMode,onStage,onToken)
    const reader=response.body.getReader(),decoder=new TextDecoder();let buffer=''
    while(true){const{value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});let idx;while((idx=buffer.indexOf('\n\n'))>=0){const block=buffer.slice(0,idx);buffer=buffer.slice(idx+2);let eventName='message',payload='';for(const line of block.split('\n')){if(line.startsWith('event:'))eventName=line.slice(6).trim();else if(line.startsWith('data:'))payload+=(payload?'\n':'')+line.slice(5).trim()}if(!payload||payload==='[DONE]')continue;let data={};try{data=JSON.parse(payload)}catch{data={text:payload}};if(eventName==='thinking'){onStage?.({id:`activity-${++eventSeq}`,label:data.status||'Berpikir',state:'active',kind:'thinking',tool:data.tool||null,command:data.command||null,success:data.success,activity:Boolean(data.activity),mode:data.mode||neraMode});continue}if(eventName==='status'){onStage?.({id:`status-${++eventSeq}`,label:data.status||'Menulis jawaban',state:'active',kind:'status',phase:data.phase||null,tool:data.tool||null,activity:Boolean(data.activity)});continue}if(eventName==='content'){const delta=data?.delta??data?.text??'';if(typeof delta==='string'&&delta){full+=delta;onToken?.(delta,full);onStage?.({id:'content',label:'Menulis jawaban',state:'active',kind:'content'})}continue}if(eventName==='done'){onStage?.({id:`done-${++eventSeq}`,label:data.status||'Selesai',state:'done',kind:'done'});continue}const delta=data?.choices?.[0]?.delta?.content??data?.delta?.content??data?.delta??data?.text;if(typeof delta==='string'&&delta){full+=delta;onToken?.(delta,full);onStage?.({id:'content',label:'Menulis jawaban',state:'active',kind:'content'})}}}
    conversation=[...conversation,{role:'assistant',content:full}].slice(-40);return full
  }catch(e){if(e?.name==='AbortError')throw new Error('REQUEST_CANCELLED');throw e}finally{clearTimeout(timeout);activeChatController=null}
}

export async function sendChat(input,onStage){let latest='';return streamChat(input,{onToken:(_,full)=>{latest=full},onStage:(s)=>onStage?.(typeof s==='string'?s:s.label)}).then(x=>x||latest)}
export function resetChatContext(){conversation=[]}
