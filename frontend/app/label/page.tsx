'use client'
import { useState } from 'react'
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const labels=["NEURO_EXAM","IMAGING","VENT","HEMODYNAMICS","LAB","MEDICATION","PROCEDURE","ASSESSMENT","OTHER"]
export default function Label(){
  const [text,setText]=useState(''); const [noteId,setNoteId]=useState(''); const [sentences,setSentences]=useState<any[]>([])
  const create=async()=>{const n=await fetch(`${API}/api/notes`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({raw_text:text})}).then(r=>r.json());setNoteId(n.note_id);const s=await fetch(`${API}/api/notes/${n.note_id}/segment`,{method:'POST'}).then(r=>r.json());setSentences(s)}
  const labelSent=(id:string,label:string)=>fetch(`${API}/api/sentences/${id}/label`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({label})})
  const addSpan=()=>{const sel=window.getSelection(); if(!sel||!noteId||!sel.toString())return; const full=text; const st=full.indexOf(sel.toString()); if(st<0)return; const label=prompt('Label? '+labels.join(','))||'OTHER'; fetch(`${API}/api/notes/${noteId}/spans`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({start_char:st,end_char:st+sel.toString().length,label})})}
  return <div className='space-y-3'><h1 className='text-xl font-bold'>Label Notes</h1><textarea rows={8} value={text} onChange={e=>setText(e.target.value)} /><button onClick={create}>Create + Segment</button><div onMouseUp={addSpan} className='bg-white p-3 border'>{text}</div>{sentences.map(s=><div key={s.id} className='bg-white p-2 border mt-2'><div>{s.text}</div><div className='flex gap-2'><button onClick={()=>labelSent(s.id,'KEEP')}>KEEP</button><button className='bg-red-600' onClick={()=>labelSent(s.id,'REMOVE')}>REMOVE</button></div></div>)}</div>
}
