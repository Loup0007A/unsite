'use client'

import { useState, useEffect, useCallback } from 'react'

const JOBS = [
  { id: 'heartbeat',      name: 'Heartbeat',              schedule: '* * * * *',   human: 'Chaque minute',         icon: '◉', desc: "Signal de vie. Vérifie que le serveur respire." },
  { id: 'cleanup',        name: 'Nettoyage sessions',     schedule: '*/5 * * * *', human: 'Toutes les 5 minutes',  icon: '◈', desc: "Supprime les sessions expirées et les entrées orphelines de la file." },
  { id: 'mood',           name: "Recalcul de l'humeur",   schedule: '*/15 * * * *',human: 'Toutes les 15 minutes', icon: '◇', desc: "Analyse les messages récents et met à jour l'ambiance globale." },
  { id: 'stats',          name: 'Statistiques',           schedule: '0 * * * *',   human: 'Chaque heure',          icon: '△', desc: "Agrège les métriques des dernières 24h." },
  { id: 'prune-drawings', name: 'Archivage dessins',      schedule: '0 0 * * *',   human: 'Chaque nuit à minuit',  icon: '○', desc: "Supprime les dessins de plus de 7 jours." },
]

type St = 'idle'|'running'|'ok'|'error'
interface Run { job:string; status:'ok'|'error'; ms:number; detail?:string; error?:string; at:string }

export default function CronPage() {
  const [authed,setAuthed]=useState(false)
  const [pw,setPw]=useState('')
  const [secret,setSecret]=useState('')
  const [err,setErr]=useState('')
  const [statuses,setStatuses]=useState<Record<string,St>>({})
  const [history,setHistory]=useState<Run[]>([])

  useEffect(()=>{
    const s=sessionStorage.getItem('unsite_cron')
    if(s){setSecret(s);setAuthed(true)}
  },[])

  async function auth(){
    if(!pw.trim())return
    const r=await fetch('/api/cron?job=heartbeat',{headers:{Authorization:`Bearer ${pw}`}})
    if(r.ok){setSecret(pw);sessionStorage.setItem('unsite_cron',pw);setAuthed(true)}
    else setErr('Clé incorrecte.')
  }

  const run=useCallback(async(id:string)=>{
    setStatuses(s=>({...s,[id]:'running'}))
    const t0=Date.now()
    try{
      const r=await fetch(`/api/cron?job=${id}`,{headers:{Authorization:`Bearer ${secret}`}})
      const d=await r.json()
      const res=d.results?.[0]
      const st:St=res?.status==='ok'?'ok':'error'
      setStatuses(s=>({...s,[id]:st}))
      setHistory(h=>[{job:id,status:res?.status,ms:Date.now()-t0,detail:res?.detail,error:res?.error,at:new Date().toLocaleTimeString('fr-FR')},...h.slice(0,19)])
      setTimeout(()=>setStatuses(s=>({...s,[id]:'idle'})),3000)
    }catch{
      setStatuses(s=>({...s,[id]:'error'}))
    }
  },[secret])

  const runAll=useCallback(async()=>{
    for(const j of JOBS){await run(j.id);await new Promise(r=>setTimeout(r,250))}
  },[run])

  const S={
    page:{minHeight:'100vh',background:'#080604',color:'#c8bfb0',fontFamily:"'Cormorant Garamond',serif",padding:'3rem 2rem'},
    wrap:{maxWidth:780,margin:'0 auto'},
  }

  if(!authed) return (
    <div style={{...S.page,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');*{box-sizing:border-box}`}</style>
      <div style={{textAlign:'center',maxWidth:360,width:'100%'}}>
        <p style={{fontFamily:'sans-serif',fontWeight:100,fontSize:'.6rem',letterSpacing:'.5em',textTransform:'uppercase',color:'rgba(184,151,74,.3)',marginBottom:'3rem'}}>UNSITE · ADMINISTRATION</p>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontSize:'2.5rem',fontWeight:400,color:'#f5f0e8',marginBottom:'2.5rem'}}>zone privée.</h1>
        <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr('')}} onKeyDown={e=>e.key==='Enter'&&auth()} placeholder="clé secrète…"
          style={{background:'transparent',border:'none',borderBottom:'1px solid #2a2218',color:'#f5f0e8',fontFamily:"'Cormorant Garamond',serif",fontSize:'1rem',fontStyle:'italic',textAlign:'center',padding:'.5rem',width:'100%',outline:'none',letterSpacing:'.1em',marginBottom:'1.5rem'}}/>
        {err&&<p style={{color:'#7a3228',fontSize:'.8rem',fontStyle:'italic',marginBottom:'1rem'}}>{err}</p>}
        <button onClick={auth} style={{background:'transparent',border:'1px solid #2a2218',color:'rgba(184,151,74,.6)',fontFamily:"'Cormorant Garamond',serif",fontSize:'.8rem',letterSpacing:'.3em',padding:'.8rem 2.5rem',cursor:'pointer'}}>entrer</button>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Lato:wght@100;300&display=swap');
        *{box-sizing:border-box}
        .jcard{border:1px solid #1a1510;background:#0c0a08;padding:1.5rem 1.8rem;display:flex;align-items:center;gap:1.8rem;transition:border-color .3s,background .3s}
        .jcard:hover{border-color:#2a2218;background:#0f0d0a}
        .rbtn{background:transparent;border:1px solid #2a2218;color:#4a4035;font-family:'Cormorant Garamond',serif;font-size:.8rem;letter-spacing:.2em;padding:.5rem 1.2rem;cursor:pointer;transition:all .3s;min-width:75px;text-align:center}
        .rbtn:hover{color:rgba(184,151,74,.8);border-color:rgba(184,151,74,.4)}
        ::-webkit-scrollbar{width:2px;background:#080604}
        ::-webkit-scrollbar-thumb{background:#1a1510}
      `}</style>

      <div style={S.wrap}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',borderBottom:'1px solid #1a1510',paddingBottom:'2rem',marginBottom:'3.5rem'}}>
          <div>
            <p style={{fontFamily:'Lato,sans-serif',fontWeight:100,fontSize:'.55rem',letterSpacing:'.5em',textTransform:'uppercase',color:'#3a3028',marginBottom:'.5rem'}}>UNSITE · CRON</p>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontWeight:300,fontSize:'2rem',color:'rgba(184,151,74,.8)'}}>tâches planifiées</h1>
          </div>
          <div style={{display:'flex',gap:'1rem',alignItems:'center'}}>
            <span style={{fontFamily:'Lato,sans-serif',fontWeight:100,fontSize:'.6rem',letterSpacing:'.15em',color:'#3a3028'}}>{new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</span>
            <button className="rbtn" onClick={runAll} style={{color:'rgba(184,151,74,.5)',borderColor:'#2a2218'}}>tout lancer</button>
          </div>
        </div>

        {/* Jobs */}
        <div style={{display:'flex',flexDirection:'column',gap:'.8rem',marginBottom:'3.5rem'}}>
          {JOBS.map(j=>{
            const st=statuses[j.id]||'idle'
            const last=history.find(h=>h.job===j.id)
            const iconColor=st==='running'?'rgba(184,151,74,.9)':st==='ok'?'#3a6a3a':st==='error'?'#7a3228':'#2a2218'
            return(
              <div key={j.id} className="jcard">
                <div style={{minWidth:36,textAlign:'center',fontSize:'1.1rem',color:iconColor,transition:'color .3s',animation:st==='running'?'spin 2s linear infinite':undefined,display:'inline-block'}}>{j.icon}</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'baseline',gap:'.8rem',marginBottom:'.25rem'}}>
                    <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1rem',color:'rgba(184,151,74,.7)'}}>{j.name}</span>
                    <span style={{fontFamily:'monospace',fontSize:'.65rem',color:'#2a2218',letterSpacing:'.1em'}}>{j.schedule}</span>
                  </div>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontSize:'.82rem',color:'#4a4035',lineHeight:1.5,marginBottom:'.25rem'}}>{j.desc}</p>
                  <div style={{display:'flex',gap:'1.2rem',flexWrap:'wrap'}}>
                    <span style={{fontFamily:'Lato,sans-serif',fontWeight:100,fontSize:'.6rem',letterSpacing:'.1em',color:'#3a3028'}}>↻ {j.human}</span>
                    {last&&<span style={{fontFamily:'Lato,sans-serif',fontWeight:100,fontSize:'.6rem',letterSpacing:'.1em',color:last.status==='ok'?'#3a5a3a':'#6a2a2a'}}>{last.status==='ok'?'✓':'✗'} {last.at} · {last.ms}ms{last.detail&&` · ${last.detail}`}{last.error&&` · ${last.error}`}</span>}
                  </div>
                </div>
                <button className="rbtn" onClick={()=>run(j.id)} disabled={st==='running'} style={{opacity:st==='running'?.4:1,cursor:st==='running'?'default':'pointer'}}>
                  {st==='running'?'···':st==='ok'?'✓ ok':st==='error'?'✗ err':'lancer'}
                </button>
              </div>
            )
          })}
        </div>

        {/* History */}
        {history.length>0&&(
          <div style={{marginBottom:'3rem'}}>
            <p style={{fontFamily:'Lato,sans-serif',fontWeight:100,fontSize:'.55rem',letterSpacing:'.4em',textTransform:'uppercase',color:'#2a2218',marginBottom:'1.2rem'}}>historique de session</p>
            <div style={{display:'flex',flexDirection:'column',gap:'.4rem'}}>
              {history.map((h,i)=>(
                <div key={i} style={{display:'flex',gap:'1.2rem',alignItems:'center',padding:'.5rem .8rem',borderLeft:`2px solid ${h.status==='ok'?'#1a3a1a':'#3a1a1a'}`,background:h.status==='ok'?'rgba(30,60,30,.04)':'rgba(60,20,20,.04)'}}>
                  <span style={{fontSize:'.7rem',color:h.status==='ok'?'#3a6a3a':'#7a3228',minWidth:12}}>{h.status==='ok'?'✓':'✗'}</span>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'.85rem',color:'rgba(184,151,74,.6)',minWidth:140}}>{h.job}</span>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontSize:'.8rem',color:'#3a3028',flex:1}}>{h.detail||h.error||'—'}</span>
                  <span style={{fontFamily:'monospace',fontSize:'.65rem',color:'#2a2218'}}>{h.ms}ms</span>
                  <span style={{fontFamily:'Lato,sans-serif',fontWeight:100,fontSize:'.6rem',color:'#2a2218'}}>{h.at}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{borderTop:'1px solid #1a1510',paddingTop:'1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <p style={{fontFamily:'monospace',fontSize:'.6rem',color:'#2a2218'}}>GET /api/cron · POST /api/cron · Authorization: Bearer {'<CRON_SECRET>'}</p>
          <button onClick={()=>{sessionStorage.removeItem('unsite_cron');setAuthed(false);setSecret('')}} style={{background:'transparent',border:'none',color:'#2a2218',fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontSize:'.75rem',cursor:'pointer'}}>déconnexion</button>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
