import { Brain, Zap } from 'lucide-react'
import './thinking-mode.css'

export default function ThinkingMode({value='fast',onChange,disabled=false}){
  return <div className="thinking-mode-wrap">
    <span className="thinking-mode-label">Thinking</span>
    <div className="thinking-mode-switch" role="group" aria-label="Mode thinking Nera">
      <button type="button" className={value==='fast'?'active':''} onClick={()=>onChange?.('fast')} disabled={disabled}><Zap size={14}/>Cepat</button>
      <button type="button" className={value==='smart'?'active':''} onClick={()=>onChange?.('smart')} disabled={disabled}><Brain size={14}/>Pintar</button>
    </div>
  </div>
}
