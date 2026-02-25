'use client'
import { useEffect, useState } from 'react'
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
export default function Infer(){
  const [text,setText]=useState(''); const [result,setResult]=useState<any>(null); const [models,setModels]=useState<any[]>([]); const [modelId,setModelId]=useState('')
  useEffect(()=>{fetch(`${API}/api/models`).then(r=>r.json()).then((m)=>{setModels(m); if(m[0]) setModelId(m[0].id)})},[])
  const run=async()=>{const out=await fetch(`${API}/api/infer`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,model_version_id:modelId||undefined})}).then(r=>r.json());setResult(out)}
  const sendFeedback=()=>fetch(`${API}/api/feedback`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input_text:text,corrections:{sentence_labels:[],spans:[]}})})
  return <div className='space-y-3'><h1 className='text-xl font-bold'>Inference</h1><textarea rows={8} value={text} onChange={e=>setText(e.target.value)} placeholder='Paste note' /><select className='border p-2' value={modelId} onChange={e=>setModelId(e.target.value)}><option value=''>latest</option>{models.map(m=><option key={m.id} value={m.id}>{m.id.slice(0,8)}</option>)}</select><button onClick={run}>Infer</button>{result&&<div className='grid grid-cols-2 gap-3'><div className='bg-white border p-2'><h3>Cleaned</h3><pre data-testid='cleaned'>{result.cleaned_text}</pre></div><div className='bg-white border p-2'><h3>Structured JSON</h3><pre data-testid='structured'>{JSON.stringify(result.structured_json,null,2)}</pre></div><div className='col-span-2 bg-white border p-2'><h3>Confidence</h3><pre>{JSON.stringify(result.confidence,null,2)}</pre></div></div>}<button onClick={sendFeedback} className='bg-green-700'>Save Feedback</button></div>
}
