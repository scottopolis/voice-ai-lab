import { useEffect, useState } from 'react'
type Provider={id:string;provider:string;model:string;type:string;fidelity:'exact'|'companion'|'unavailable';status:string;ready:boolean;requirements:Record<string,boolean>;voices:{id:string;label:string}[];note:string}
const benchmark='Dr. Nguyen prescribed 0.25 milligrams of semaglutide; ticket QZ-407B costs $1,209.05.'
export default function App(){
 const [providers,setProviders]=useState<Provider[]>([]),[index,setIndex]=useState(0),[text,setText]=useState(benchmark),[voice,setVoice]=useState(''),[audio,setAudio]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState('')
 const provider=providers[index]
 const move=(step:number)=>setIndex(i=>(i+step+providers.length)%providers.length)
 useEffect(()=>{fetch('/api/providers').then(r=>r.json()).then(d=>setProviders(d.providers)).catch(()=>setError('Could not load provider registry.'))},[])
 useEffect(()=>{setVoice(provider?.voices[0]?.id||'');setError('');if(audio)URL.revokeObjectURL(audio);setAudio('')},[provider?.id]) // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1)};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)})
 async function generate(){if(!provider)return;setLoading(true);setError('');if(audio)URL.revokeObjectURL(audio);setAudio('');try{const r=await fetch('/api/generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({providerId:provider.id,text,voice:voice||undefined})});if(!r.ok){const j=await r.json();throw new Error(j.error?.message||'Generation failed.')}setAudio(URL.createObjectURL(await r.blob()))}catch(e){setError(e instanceof Error?e.message:'Generation failed.')}finally{setLoading(false)}}
 if(!provider)return <main><p className="eyebrow">Voice API field lab</p><h1>Loading the shortlist…</h1>{error&&<p role="alert">{error}</p>}</main>
 return <main>
  <header><div><p className="eyebrow">Voice API field lab · {index+1} / {providers.length}</p><h1>Hear the model,<br/><em>not the marketing.</em></h1></div><div className="nav"><button aria-label="Previous provider" onClick={()=>move(-1)}>←</button><button aria-label="Next provider" onClick={()=>move(1)}>→</button></div></header>
  <section className="card" aria-live="polite"><div className="title"><div><p className="provider">{provider.provider}</p><h2>{provider.model}</h2></div><span className={`badge ${provider.fidelity}`}>{provider.fidelity==='exact'?'Exact model':provider.fidelity==='companion'?'TTS companion / cascade':'Unavailable in clip lab'}</span></div>
   <div className="facts"><span>TYPE <b>{provider.type}</b></span><span>STATUS <b>{provider.status}</b></span><span>CONFIG <b className={provider.ready?'ok':'muted'}>{provider.ready?'Ready':'Needs setup'}</b></span></div>
   <p className="note">{provider.note}</p>
   <label htmlFor="script">Benchmark text</label><textarea id="script" value={text} onChange={e=>setText(e.target.value)} maxLength={2000}/>
   {provider.voices.length>0&&<><label htmlFor="voice">Voice</label><select id="voice" value={voice} onChange={e=>setVoice(e.target.value)}>{provider.voices.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}</select></>}
   <details><summary>Credential readiness</summary><ul>{Object.entries(provider.requirements).map(([k,v])=><li key={k}><span>{k}</span><b>{v?'present':'missing'}</b></li>)}</ul><p>Only presence booleans leave the server. Values never do.</p></details>
   <button className="generate" disabled={loading||!provider.ready||provider.fidelity==='unavailable'||!text.trim()} onClick={generate}>{loading?'Generating…':'Generate sample'}</button>
   {error&&<p className="error" role="alert">{error}</p>}{audio&&<audio controls autoPlay src={audio} aria-label={`${provider.provider} generated sample`}/>} 
  </section><footer>Use ← → to move · fixed-copy audition, not a live-agent score</footer>
 </main>
}
