'use client'
import { useEffect, useState } from 'react'
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
export default function Home(){
  const [notes,setNotes]=useState<any[]>([])
  const [models,setModels]=useState<any[]>([])
  useEffect(()=>{fetch(`${API}/api/notes`).then(r=>r.json()).then(setNotes);fetch(`${API}/api/models`).then(r=>r.json()).then(setModels)},[])
  return <div className='space-y-4'><h1 className='text-2xl font-bold'>MedNoteCleaner Dashboard</h1><div>Notes: {notes.length}</div><div>Models: {models.length}</div></div>
}
