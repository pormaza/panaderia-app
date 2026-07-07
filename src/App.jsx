import { useState } from 'react'
import Planner from './Planner.jsx'
import Recetas from './Recetas.jsx'

export default function App() {
  const [app, setApp] = useState('planner')
  const btn = (k, label) => (
    <button onClick={() => setApp(k)} style={{
      flex:1, padding:'0.7rem', fontSize:'0.8rem', fontFamily:'Arial',
      cursor:'pointer', border:'none',
      background: app===k ? '#8b5e2a' : '#f5f0e8',
      color: app===k ? '#fff' : '#6b5a40',
      fontWeight: app===k ? 'bold' : 'normal',
    }}>{label}</button>
  )
  return (
    <div style={{minHeight:'100vh', background:'#f5f0e8'}}>
      <div style={{display:'flex', borderBottom:'2px solid #ddd5c0', background:'#fff', position:'sticky', top:0, zIndex:100}}>
        {btn('planner','🍞 Planner')}
        {btn('recetas','🧁 Recetas & Costos')}
      </div>
      {app==='planner' ? <Planner/> : <Recetas/>}
    </div>
  )
}
