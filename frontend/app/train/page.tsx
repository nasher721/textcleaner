'use client'
import { useEffect, useState } from 'react'
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
export default function Train(){
  const [progress,setProgress]=useState<any>({status:'idle',progress:0}); const [models,setModels]=useState<any[]>([])
  const load=()=>fetch(`${API}/api/models`).then(r=>r.json()).then(setModels)
  useEffect(()=>{load(); const i=setInterval(()=>fetch(`${API}/api/train/progress`).then(r=>r.json()).then(setProgress),1000); return ()=>clearInterval(i)},[])
  const run=()=>fetch(`${API}/api/train`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({base_model:'en',max_steps:20,lr:0.001})})
  return <div className='space-y-3'><h1 className='text-xl font-bold'>Train</h1><button onClick={run}>Train Model</button><div>Status: {progress.status} ({progress.progress}%)</div><button onClick={load}>Refresh Models</button>{models.map(m=><pre key={m.id} className='bg-white border p-2 text-xs overflow-auto'>{JSON.stringify(m,null,2)}</pre>)}</div>
}
