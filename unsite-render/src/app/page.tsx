'use client'
import { useEffect, useRef } from 'react'

// ─────────────────────────────────────────────────────────────────
// UNSITE — page principale
// Synchronisation : Supabase Realtime (channel broadcast + DB)
// Musique         : Web Audio API, drones génératifs
// Activités       : 6 expériences poétiques
// ─────────────────────────────────────────────────────────────────

export default function Home() {
  const initDone = useRef(false)

  useEffect(() => {
    if (initDone.current) return
    initDone.current = true

    // ── Supabase client (inline pour éviter les imports SSR)
    const SUPA_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  || ''
    const SUPA_KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const SESSION_DURATION = 5 * 60 * 1000
    const TK = 'unsite_token_v7'

    // Token unique par onglet
    const mkToken = () => { const b = new Uint8Array(24); crypto.getRandomValues(b); return Array.from(b, x => x.toString(16).padStart(2,'0')).join('') }
    const myToken = (() => { let t = sessionStorage.getItem(TK); if (!t) { t = mkToken(); sessionStorage.setItem(TK, t) } return t })()

    // ── State local
    let globalState: Record<string,any> = {}
    let mySess = false
    let timerI: any = null
    let tool = 'draw', color = '#a78bfa', brushSz = 3
    let cv: HTMLCanvasElement | null = null, ctx: CanvasRenderingContext2D | null = null
    let drawing = false, lx = 0, ly = 0
    let snapTimer: any = null
    let currentActivity: string | null = null
    let audioCtx: AudioContext | null = null
    let audioStarted = false

    // ── Supabase REST helpers
    const apiUrl = (path: string) => `${SUPA_URL}/rest/v1/${path}`
    const headers = () => ({
      'apikey': SUPA_KEY,
      'Authorization': `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    })

    const dbGet = async () => {
      try {
        const r = await fetch(apiUrl('unsite_state?id=eq.1'), { headers: headers() })
        const d = await r.json()
        return d[0] || null
      } catch { return null }
    }

    const dbSet = async (patch: Record<string,any>) => {
      try {
        await fetch(apiUrl('unsite_state?id=eq.1'), {
          method: 'PATCH',
          headers: headers(),
          body: JSON.stringify(patch)
        })
      } catch {}
    }

    // ── Broadcast (curseur + actions en temps réel)
    let channel: any = null
    const initRealtime = async () => {
      if (!SUPA_URL || !SUPA_KEY) return
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(SUPA_URL, SUPA_KEY, { realtime: { params: { eventsPerSecond: 15 } } })

      channel = sb.channel('unsite-room', { config: { broadcast: { self: false } } })

      // Recevoir les curseurs des autres
      channel.on('broadcast', { event: 'cursor' }, ({ payload }: any) => {
        showRemoteCursor(payload.x, payload.y, payload.token)
      })

      // Recevoir les coups de pinceau des autres
      channel.on('broadcast', { event: 'stroke' }, ({ payload }: any) => {
        if (payload.token === myToken) return
        drawRemoteStroke(payload)
      })

      // Recevoir les changements d'état DB
      channel.on('broadcast', { event: 'state' }, ({ payload }: any) => {
        globalState = payload
        updateUI(payload)
      })

      channel.subscribe()

      // Écouter les changements DB via Realtime
      sb.channel('db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'unsite_state' }, (payload: any) => {
          globalState = payload.new
          updateUI(payload.new)
        })
        .subscribe()

      return { sb, channel }
    }

    // ── Curseurs distants
    const remoteCursors: Record<string, { el: HTMLElement, t: any }> = {}
    const showRemoteCursor = (x: number, y: number, token: string) => {
      if (!remoteCursors[token]) {
        const el = document.createElement('div')
        el.style.cssText = `position:fixed;width:6px;height:6px;border-radius:50%;background:rgba(252,165,165,.7);pointer-events:none;z-index:9990;transform:translate(-50%,-50%);transition:left .1s,top .1s;mix-blend-mode:screen`
        document.body.appendChild(el)
        remoteCursors[token] = { el, t: null }
      }
      const rc = remoteCursors[token]
      rc.el.style.left = (x * window.innerWidth) + 'px'
      rc.el.style.top = (y * window.innerHeight) + 'px'
      clearTimeout(rc.t)
      rc.t = setTimeout(() => { rc.el.remove(); delete remoteCursors[token] }, 5000)
    }

    // ── Strokes distants
    const drawRemoteStroke = (p: any) => {
      if (!ctx || !cv) return
      ctx.lineWidth = p.size; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.globalCompositeOperation = p.tool === 'erase' ? 'destination-out' : 'source-over'
      ctx.strokeStyle = p.tool === 'erase' ? 'rgba(0,0,0,1)' : p.color
      ctx.beginPath()
      ctx.moveTo(p.x1 * cv.width, p.y1 * cv.height)
      ctx.lineTo(p.x2 * cv.width, p.y2 * cv.height)
      ctx.stroke()
    }

    // ── Claim session
    const claimSession = async () => {
      const g = await dbGet(); if (!g) return false
      const now = Date.now()
      const expiry = g.session_expiry ? new Date(g.session_expiry).getTime() : 0
      if (g.session_owner && now < expiry) return false
      const queue: string[] = g.queue || []
      if (queue.length > 0 && queue[0] !== myToken) return false
      const newQueue = queue.filter((t: string) => t !== myToken)
      await dbSet({
        session_owner: myToken,
        session_expiry: new Date(now + SESSION_DURATION).toISOString(),
        queue: newQueue,
        total_visits: (g.total_visits || 0) + 1
      })
      return true
    }

    const joinQueue = async () => {
      const g = await dbGet(); if (!g) return
      const q: string[] = g.queue || []
      if (!q.includes(myToken)) { q.push(myToken); await dbSet({ queue: q }) }
    }

    const leaveQueue = async () => {
      const g = await dbGet(); if (!g) return
      await dbSet({ queue: (g.queue || []).filter((t: string) => t !== myToken) })
    }

    const endSession = async (msg: string) => {
      const g = await dbGet(); if (!g || g.session_owner !== myToken) return
      const msgs: any[] = g.messages || []
      if (msg?.trim()) { msgs.push({ t: msg.trim(), ts: Date.now() }); if (msgs.length > 30) msgs.splice(0, msgs.length - 30) }
      await dbSet({ session_owner: null, session_expiry: null, messages: msgs, mood_val: calcMood(msgs), snap: cv ? cv.toDataURL('image/webp', .4) : null })
    }

    const calcMood = (msgs: {t:string}[]) => {
      const warm = ['merci','amour','beau','doux','paix','joie','lumiere','espoir']
      const dark = ['seul','triste','peur','vide','nuit','perdu','froid','absent']
      let v = .5
      msgs.slice(-8).forEach(m => {
        const t = m.t.toLowerCase()
        warm.forEach(w => { if (t.includes(w)) v = Math.min(1, v + .07) })
        dark.forEach(w => { if (t.includes(w)) v = Math.max(.05, v - .05) })
      })
      return v
    }

    // ── Update UI depuis l'état global
    const updateUI = (g: Record<string,any>) => {
      if (!g) return
      globalState = g
      const now = Date.now()
      const expiry = g.session_expiry ? new Date(g.session_expiry).getTime() : 0
      const queue: string[] = g.queue || []
      const isSessionActive = g.session_owner && now < expiry

      // Mettre à jour le compteur landing
      const landN = document.getElementById('land-n')
      if (landN) landN.textContent = String(queue.length || '—')

      // Mettre à jour la file
      const pos = queue.indexOf(myToken)
      if (pos >= 0) {
        const myP = pos + 1
        const rem = Math.max(0, Math.floor((expiry - now) / 1000))
        const wm = Math.ceil((rem + pos * 300) / 60)
        const qNum = document.getElementById('q-num'); if (qNum) qNum.textContent = String(myP)
        const qWait = document.getElementById('q-wait')
        if (qWait) qWait.textContent = wm <= 1 ? 'moins d\'une minute' : 'environ ' + wm + ' min'
        const qW = document.getElementById('q-w'); if (qW) qW.textContent = String(queue.length)

        // Mini canvas spectateur
        if (g.snap) {
          const mc = document.getElementById('q-mc') as HTMLCanvasElement
          if (mc) {
            const mctx = mc.getContext('2d')!
            mc.width = mc.offsetWidth || 480; mc.height = 110
            const img = new Image(); img.onload = () => mctx.drawImage(img, 0, 0, mc.width, mc.height); img.src = g.snap
          }
        }
      }

      // Si la session est libre et je suis premier dans la file
      if ((!isSessionActive || (g.session_owner === myToken)) && document.getElementById('s-queue')?.classList.contains('fadein')) {
        if (queue.length === 0 || queue[0] === myToken) {
          claimSession().then(ok => {
            if (ok) { mySess = true; enterActiveSession(g) }
          })
        }
      }

      // Humeur
      applyMood(g.mood_val || .5)
    }

    // ── Screens
    const go = (id: string) => {
      document.querySelectorAll('.screen').forEach(s => { s.classList.remove('fadein'); s.classList.add('off') })
      const el = document.getElementById('s-' + id)
      if (el) { el.classList.remove('off'); void el.offsetWidth; el.classList.add('fadein') }
    }

    const applyMood = (v: number) => {
      const moods = ['melancolie','solitude','contemplation','serenite','lumiere']
      const el = document.getElementById('h-mood'); if (el) el.textContent = moods[Math.min(4, Math.floor(v * 5))]
    }

    // ── MUSIQUE GENERATIVE
    const startAmbientMusic = () => {
      if (audioStarted) return
      audioStarted = true
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const ac = audioCtx

      // Drone de base — accord parfait violet (La-Do#-Mi)
      const FREQS = [55, 82.4, 110, 138.6, 164.8, 220]
      const drones: OscillatorNode[] = []

      FREQS.forEach((freq, i) => {
        const osc = ac.createOscillator()
        const gain = ac.createGain()
        const filter = ac.createBiquadFilter()
        const lfo = ac.createOscillator()
        const lfoGain = ac.createGain()

        osc.type = i % 2 === 0 ? 'sine' : 'triangle'
        osc.frequency.value = freq
        filter.type = 'lowpass'
        filter.frequency.value = 800 + i * 100
        filter.Q.value = 2

        // LFO très lent pour le mouvement
        lfo.type = 'sine'
        lfo.frequency.value = 0.03 + i * 0.01
        lfoGain.gain.value = freq * 0.008

        lfo.connect(lfoGain); lfoGain.connect(osc.frequency)
        osc.connect(filter); filter.connect(gain)
        gain.connect(ac.destination)

        // Volume très doux, fade in progressif
        gain.gain.setValueAtTime(0, ac.currentTime)
        gain.gain.linearRampToValueAtTime(0.018 - i * 0.002, ac.currentTime + 4 + i * 2)

        // Pulsation lente
        const pulseInterval = setInterval(() => {
          if (!audioCtx) { clearInterval(pulseInterval); return }
          const now = ac.currentTime
          const vol = 0.018 - i * 0.002
          gain.gain.setValueAtTime(gain.gain.value, now)
          gain.gain.linearRampToValueAtTime(vol * (0.3 + Math.random() * 0.7), now + 3 + Math.random() * 4)
        }, (6 + i * 2) * 1000)

        osc.start(); lfo.start()
        drones.push(osc)
      })

      // Pluie lointaine (bruit rose filtré)
      const bufferSize = ac.sampleRate * 2
      const rainBuffer = ac.createBuffer(1, bufferSize, ac.sampleRate)
      const rainData = rainBuffer.getChannelData(0)
      let lastVal = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = (Math.random() * 2 - 1)
        rainData[i] = (lastVal + (0.02 * white)) / 1.02
        lastVal = rainData[i]
      }
      const rainSrc = ac.createBufferSource()
      rainSrc.buffer = rainBuffer; rainSrc.loop = true
      const rainFilter = ac.createBiquadFilter()
      rainFilter.type = 'bandpass'; rainFilter.frequency.value = 400; rainFilter.Q.value = .5
      const rainGain = ac.createGain(); rainGain.gain.value = 0
      rainGain.gain.linearRampToValueAtTime(0.04, ac.currentTime + 6)
      rainSrc.connect(rainFilter); rainFilter.connect(rainGain); rainGain.connect(ac.destination)
      rainSrc.start()

      // Tintements occasionnels
      const chime = () => {
        if (!audioCtx) return
        const chimeFreqs = [528, 639, 741, 852, 963]
        const f = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)]
        const osc = ac.createOscillator()
        const gain = ac.createGain()
        osc.type = 'sine'; osc.frequency.value = f
        gain.gain.setValueAtTime(0, ac.currentTime)
        gain.gain.linearRampToValueAtTime(0.06, ac.currentTime + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 3)
        osc.connect(gain); gain.connect(ac.destination)
        osc.start(); osc.stop(ac.currentTime + 3)
        setTimeout(chime, 8000 + Math.random() * 20000)
      }
      setTimeout(chime, 5000)
    }

    // ── ACTIVITES
    type Activity = {
      id: string
      icon: string
      title: string
      desc: string
      action: () => void
    }

    const ACTIVITIES: Activity[] = [
      {
        id: 'draw',
        icon: '◦',
        title: 'tracer',
        desc: 'laisse une marque dans ce monde ephemere.',
        action: () => { closeActivity(); setTool('draw') }
      },
      {
        id: 'write',
        icon: '—',
        title: 'ecrire',
        desc: 'murmure quelque chose sur la toile.',
        action: () => { closeActivity(); setTool('write') }
      },
      {
        id: 'meditate',
        icon: '○',
        title: 'mediter',
        desc: 'reste simplement ici. respire. le temps s\'ecoule.',
        action: () => { closeActivity(); startMeditation() }
      },
      {
        id: 'stardust',
        icon: '✦',
        title: 'planter des etoiles',
        desc: 'chaque clic pose une etoile sur la toile du monde.',
        action: () => { closeActivity(); startStarMode() }
      },
      {
        id: 'color',
        icon: '◈',
        title: 'changer l\'ambiance',
        desc: 'teinte le ciel de cette heure.',
        action: () => { closeActivity(); openColorShift() }
      },
      {
        id: 'message',
        icon: '◇',
        title: 'laisser un message',
        desc: 'ecris pour celui qui vient apres toi.',
        action: () => { closeActivity(); goFarewell() }
      }
    ]

    const openActivities = () => {
      const panel = document.getElementById('activity-panel')
      if (panel) panel.classList.remove('off')
    }
    const closeActivity = () => {
      const panel = document.getElementById('activity-panel')
      if (panel) panel.classList.add('off')
    }

    const startMeditation = () => {
      const med = document.getElementById('meditation-overlay')
      if (!med) return
      med.classList.remove('off')
      let breath = 0
      const txt = document.getElementById('med-text')
      const phases = ['inspire...','retiens...','expire...','silence...']
      const durations = [4000, 2000, 4000, 2000]
      let idx = 0
      const nextPhase = () => {
        if (!txt) return
        txt.textContent = phases[idx]
        txt.style.opacity = '1'
        setTimeout(() => { txt.style.opacity = '0' }, durations[idx] - 300)
        idx = (idx + 1) % phases.length
        setTimeout(nextPhase, durations[idx])
      }
      nextPhase()
      document.getElementById('med-close')?.addEventListener('click', () => {
        med.classList.add('off')
      })
    }

    const startStarMode = () => {
      if (!cv || !ctx) return
      const starHandler = (e: MouseEvent) => {
        if (!ctx || !cv) return
        const r = cv.getBoundingClientRect()
        const x = e.clientX - r.left, y = e.clientY - r.top
        // Dessine une etoile
        ctx.globalCompositeOperation = 'source-over'
        const starColors = ['#a78bfa','#93c5fd','#fca5a5','#f9a8d4','#ffffff']
        const c = starColors[Math.floor(Math.random() * starColors.length)]
        const size = 2 + Math.random() * 4
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fillStyle = c
        ctx.shadowBlur = 8; ctx.shadowColor = c
        ctx.fill()
        ctx.shadowBlur = 0
        // Halo
        ctx.beginPath()
        ctx.arc(x, y, size * 3, 0, Math.PI * 2)
        const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 3)
        grad.addColorStop(0, c.replace(')', ',0.3)').replace('rgb', 'rgba'))
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad; ctx.fill()
        clearTimeout(snapTimer); snapTimer = setTimeout(() => { if (cv) dbSet({ snap: cv.toDataURL('image/webp', .4) }) }, 2000)
      }
      cv.addEventListener('click', starHandler)
      // Indicateur mode etoile
      const hm = document.getElementById('h-mood')
      if (hm) { hm.textContent = 'mode etoile'; hm.style.color = 'rgba(249,168,212,.5)' }
      // Quitter au click sur toolbar
      const exitStar = () => {
        cv!.removeEventListener('click', starHandler)
        const hm2 = document.getElementById('h-mood')
        if (hm2) { hm2.style.color = ''; hm2.textContent = 'contemplation' }
        document.getElementById('t-draw')!.removeEventListener('click', exitStar)
      }
      document.getElementById('t-draw')?.addEventListener('click', exitStar, { once: true })
    }

    const openColorShift = () => {
      const panel = document.getElementById('color-shift-panel')
      if (panel) panel.classList.remove('off')
    }

    // ── Curseur custom
    const CUR = document.getElementById('cur')!
    const CURR = document.getElementById('cur-ring')!
    const CURT = document.getElementById('cur-trail')!
    let mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my, tx = mx, ty = my
    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY; CUR.style.left = mx + 'px'; CUR.style.top = my + 'px'
      // Broadcast curseur si owner
      if (mySess && channel) {
        channel.send({ type: 'broadcast', event: 'cursor', payload: { x: mx / window.innerWidth, y: my / window.innerHeight, token: myToken } })
      }
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mousedown', () => { CUR.style.width = '14px'; CUR.style.height = '14px' })
    document.addEventListener('mouseup', () => { CUR.style.width = '8px'; CUR.style.height = '8px' })
    let raf: number
    const animCursor = () => {
      rx += (mx - rx) * .1; ry += (my - ry) * .1
      tx += (mx - tx) * .06; ty += (my - ty) * .06
      CURR.style.left = Math.round(rx) + 'px'; CURR.style.top = Math.round(ry) + 'px'
      CURT.style.left = Math.round(tx) + 'px'; CURT.style.top = Math.round(ty) + 'px'
      raf = requestAnimationFrame(animCursor)
    }
    raf = requestAnimationFrame(animCursor)

    // ── WebGL waves
    const bgC = document.getElementById('bg-canvas') as HTMLCanvasElement
    const gl = bgC.getContext('webgl') as WebGLRenderingContext | null
    let glRaf: number
    if (gl) {
      const rsz = () => { bgC.width = window.innerWidth; bgC.height = window.innerHeight; gl.viewport(0,0,bgC.width,bgC.height) }
      window.addEventListener('resize', rsz); rsz()
      const vs = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`
      const fs = [
        'precision mediump float;',
        'uniform float t;uniform vec2 res;',
        'void main(){',
        '  vec2 uv=gl_FragCoord.xy/res;',
        '  float tt=t*0.0005;',
        '  float w1=sin(uv.x*7.0+tt*2.2+uv.y*2.0)*0.5+0.5;',
        '  float w2=sin(uv.x*4.5-tt*1.8+uv.y*3.5)*0.5+0.5;',
        '  float w3=cos(uv.y*6.0+tt*1.5+uv.x*2.5)*0.5+0.5;',
        '  float w4=sin((uv.x+uv.y)*5.0+tt*1.2)*0.5+0.5;',
        '  float b1=smoothstep(.9,.0,length(uv-vec2(sin(tt*.7)*.38+.5,cos(tt*.5)*.28+.5)));',
        '  float b2=smoothstep(.75,.0,length(uv-vec2(cos(tt*.9+1.2)*.42+.5,sin(tt*.6+.8)*.3+.5)));',
        '  float b3=smoothstep(.65,.0,length(uv-vec2(sin(tt*1.1+2.1)*.35+.5,cos(tt*.8+1.5)*.32+.5)));',
        '  float b4=smoothstep(.55,.0,length(uv-vec2(cos(tt*.6+3.1)*.3+.5,sin(tt*1.3+.9)*.38+.5)));',
        '  vec3 col=vec3(.018,.008,.06);',
        '  col+=vec3(.38,.14,.92)*b1*.5;',
        '  col+=vec3(.08,.32,.98)*b2*.4;',
        '  col+=vec3(.85,.12,.18)*b3*.3;',
        '  col+=vec3(.55,.08,.88)*b4*.25;',
        '  col+=vec3(.28,.08,.75)*w1*w2*.06;',
        '  col+=vec3(.06,.28,.88)*w2*w3*.05;',
        '  col+=vec3(.78,.08,.12)*w3*w4*.04;',
        '  col+=vec3(.48,.05,.82)*w1*w4*.035;',
        '  col=clamp(col,0.,1.);',
        '  gl_FragColor=vec4(col,1.);',
        '}'
      ].join('\n')
      const mkSh = (type: number, src: string) => {
        const s = gl.createShader(type)!; gl.shaderSource(s,src); gl.compileShader(s); return s
      }
      const prog = gl.createProgram()!
      gl.attachShader(prog, mkSh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, mkSh(gl.FRAGMENT_SHADER, fs))
      gl.linkProgram(prog); gl.useProgram(prog)
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW)
      const loc = gl.getAttribLocation(prog,'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0)
      const tU = gl.getUniformLocation(prog,'t'), rU = gl.getUniformLocation(prog,'res')
      const frame = (ts: number) => {
        gl.uniform1f(tU!, ts); gl.uniform2f(rU!, bgC.width, bgC.height)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); glRaf = requestAnimationFrame(frame)
      }
      glRaf = requestAnimationFrame(frame)
    }

    // ── Motes
    const motes: HTMLElement[] = []
    const MCOLS = ['rgba(167,139,250,','rgba(147,197,253,','rgba(252,165,165,','rgba(196,132,252,','rgba(99,102,241,']
    for (let i = 0; i < 18; i++) {
      const m = document.createElement('div'); m.className = 'mote'
      const sz = Math.random() * 2.5 + .5, dur = 20 + Math.random() * 35
      const col = MCOLS[Math.floor(Math.random() * MCOLS.length)]
      m.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}vw;background:${col}${Math.random()*.6+.1});--mx:${(Math.random()-.5)*200}px;animation-duration:${dur}s;animation-delay:${-Math.random()*dur}s`
      document.body.appendChild(m); motes.push(m)
    }

    // ── Polling fallback (si pas Supabase)
    let pollI: any = null
    const startPolling = () => {
      pollI = setInterval(async () => {
        const g = await dbGet(); if (!g) return
        updateUI(g)
        // Essayer de claim si session libre
        const now = Date.now()
        const expiry = g.session_expiry ? new Date(g.session_expiry).getTime() : 0
        const queue: string[] = g.queue || []
        if ((!g.session_owner || now >= expiry) && (queue.length === 0 || queue[0] === myToken)) {
          const ok = await claimSession()
          if (ok) { clearInterval(pollI); mySess = true; const g2 = await dbGet(); enterActiveSession(g2) }
        }
      }, 2000)
    }

    // ── Entrée en session active
    const enterActiveSession = (g: Record<string,any>) => {
      go('active')
      setTimeout(() => {
        setupCanvas()
        if (g?.snap) restoreSnap(g.snap)
        const expiry = g?.session_expiry ? new Date(g.session_expiry).getTime() : Date.now() + SESSION_DURATION
        startTimer(expiry)
        applyMood(g?.mood_val || .5)
        if (g?.messages?.length) {
          const last = g.messages[g.messages.length - 1]
          const el = document.getElementById('h-prev')
          if (el) { el.innerHTML = '\u201c' + last.t + '\u201d'; el.style.opacity = '.7'; setTimeout(() => { el.style.opacity = '0' }, 15000) }
        }
        buildActivityPanel()
      }, 100)
    }

    // ── Activity panel builder
    const buildActivityPanel = () => {
      const grid = document.getElementById('activity-grid')
      if (!grid) return; grid.innerHTML = ''
      ACTIVITIES.forEach(act => {
        const btn = document.createElement('button')
        btn.className = 'act-btn'
        btn.innerHTML = `<span class="act-icon">${act.icon}</span><span class="act-title">${act.title}</span><span class="act-desc">${act.desc}</span>`
        btn.addEventListener('click', act.action)
        grid.appendChild(btn)
      })
    }

    // ── Canvas
    const setupCanvas = () => {
      cv = document.getElementById('canvas-main') as HTMLCanvasElement
      ctx = cv.getContext('2d')!; resizeCv()
      window.addEventListener('resize', resizeCv)
      cv.addEventListener('mousedown', startDraw); cv.addEventListener('mousemove', doDraw)
      cv.addEventListener('mouseup', stopDraw); cv.addEventListener('mouseleave', stopDraw)
      cv.addEventListener('touchstart', e => { e.preventDefault(); startDraw(e.touches[0] as unknown as MouseEvent) }, { passive: false })
      cv.addEventListener('touchmove', e => { e.preventDefault(); doDraw(e.touches[0] as unknown as MouseEvent) }, { passive: false })
      cv.addEventListener('touchend', () => stopDraw(), { passive: false })
      setupPalette()
    }
    const resizeCv = () => {
      if (!cv || !ctx) return
      const snap = cv.width > 0 ? ctx.getImageData(0,0,cv.width,cv.height) : null
      cv.width = window.innerWidth; cv.height = window.innerHeight
      if (snap) ctx.putImageData(snap, 0, 0)
    }
    const restoreSnap = (snap: string) => {
      if (!ctx || !cv || !snap) return
      const img = new Image(); img.onload = () => { if (ctx && cv) ctx.drawImage(img, 0, 0, cv.width, cv.height) }; img.src = snap
    }
    const gpos = (e: MouseEvent) => {
      const r = cv!.getBoundingClientRect()
      return { x: (e.clientX || (e as any).pageX) - r.left, y: (e.clientY || (e as any).pageY) - r.top }
    }
    const startDraw = (e: MouseEvent) => {
      if (!mySess || tool === 'write') return; drawing = true; const p = gpos(e); lx = p.x; ly = p.y
    }
    const doDraw = (e: MouseEvent) => {
      if (!drawing || !mySess || !ctx || !cv || tool === 'write') return
      const p = gpos(e)
      ctx.lineWidth = brushSz; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.globalCompositeOperation = tool === 'erase' ? 'destination-out' : 'source-over'
      ctx.strokeStyle = tool === 'erase' ? 'rgba(0,0,0,1)' : color
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(p.x, p.y); ctx.stroke()
      // Broadcast stroke
      if (channel) {
        channel.send({ type: 'broadcast', event: 'stroke', payload: {
          x1: lx/cv.width, y1: ly/cv.height, x2: p.x/cv.width, y2: p.y/cv.height,
          color, tool, size: brushSz, token: myToken
        }})
      }
      lx = p.x; ly = p.y
      clearTimeout(snapTimer); snapTimer = setTimeout(() => { if (cv) dbSet({ snap: cv.toDataURL('image/webp',.4) }) }, 2500)
    }
    const stopDraw = () => { drawing = false }

    const SWATCHES = ['#a78bfa','#93c5fd','#fca5a5','#c084fc','#818cf8','#f9a8d4','#67e8f9','#e8e0f5','#1e1040']
    const setupPalette = () => {
      const pal = document.getElementById('pal'); if (!pal) return; pal.innerHTML = ''
      SWATCHES.forEach(c => {
        const s = document.createElement('div'); s.className = 'psw' + (c === color ? ' on' : ''); s.style.background = c
        s.addEventListener('click', () => { color = c; setTool('draw'); document.querySelectorAll('.psw').forEach(x => x.classList.remove('on')); s.classList.add('on') })
        pal.appendChild(s)
      })
    }

    const setTool = (t: string) => {
      tool = t
      document.querySelectorAll('.tbtn').forEach(b => b.classList.remove('on'))
      document.getElementById('t-' + t)?.classList.add('on')
      const ti = document.getElementById('txov') as HTMLInputElement
      const pal = document.getElementById('pal'), bc = document.getElementById('bctl')
      ti.style.display = t === 'write' ? 'block' : 'none'
      if (pal) pal.style.display = t === 'draw' ? 'flex' : 'none'
      if (bc) bc.style.display = (t === 'draw' || t === 'erase') ? 'flex' : 'none'
      if (t === 'write') { ti.focus(); ti.onkeydown = onTextKey }
    }

    const onTextKey = (e: KeyboardEvent) => {
      const ti = document.getElementById('txov') as HTMLInputElement
      if (e.key === 'Enter' && ti.value.trim() && ctx && cv) {
        ctx.globalCompositeOperation = 'source-over'
        ctx.font = 'italic ' + Math.max(16, brushSz * 4 + 12) + 'px Playfair Display,serif'
        ctx.fillStyle = color; ctx.textAlign = 'center'
        ctx.fillText(ti.value.trim(), cv.width / 2, cv.height / 2)
        // Broadcast le texte
        if (channel) channel.send({ type: 'broadcast', event: 'stroke', payload: {
          text: ti.value.trim(), textX: .5, textY: .5, color, size: brushSz, token: myToken
        }})
        ti.value = ''; setTool('draw')
        clearTimeout(snapTimer); snapTimer = setTimeout(() => { if (cv) dbSet({ snap: cv.toDataURL('image/webp',.4) }) }, 600)
      }
      if (e.key === 'Escape') { ti.value = ''; setTool('draw') }
    }

    document.getElementById('t-draw')?.addEventListener('click', () => setTool('draw'))
    document.getElementById('t-write')?.addEventListener('click', () => setTool('write'))
    document.getElementById('t-erase')?.addEventListener('click', () => setTool('erase'))
    document.getElementById('bsz')?.addEventListener('input', e => { brushSz = +(e.target as HTMLInputElement).value })
    document.getElementById('act-open')?.addEventListener('click', openActivities)
    document.getElementById('act-close')?.addEventListener('click', closeActivity)

    // Color shift
    const colorBtns = document.querySelectorAll('.cs-btn')
    colorBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const hue = (btn as HTMLElement).dataset.hue || '270'
        document.documentElement.style.setProperty('--void', `hsl(${hue},85%,4%)`)
        document.getElementById('color-shift-panel')?.classList.add('off')
        dbSet({ mood_val: parseInt(hue) / 360 })
      })
    })

    // ── Timer
    const startTimer = (expiry: number) => {
      timerI = setInterval(() => {
        const rem = Math.max(0, Math.floor((expiry - Date.now()) / 1000))
        const mm = Math.floor(rem / 60), ss = rem % 60
        const el = document.getElementById('h-timer')
        if (el) {
          el.textContent = mm + '\u00b7' + String(ss).padStart(2,'0')
          el.className = 'hud h-timer' + (rem < 120 ? ' warn' : '') + (rem < 30 ? ' urgent' : '')
        }
        if (rem <= 0) { clearInterval(timerI); goFarewell() }
      }, 500)
    }

    // ── Farewell
    const goFarewell = async () => {
      go('fare')
      const g = await dbGet()
      if (g?.messages?.length) {
        const last = g.messages[g.messages.length - 1]
        const pt = document.getElementById('fw-pt'); if (pt) pt.textContent = '\u201c' + last.t + '\u201d'
        const fp = document.getElementById('fw-prev'); if (fp) fp.style.display = 'block'
      }
    }
    const doFarewell = async (msg: string) => {
      await endSession(msg); sessionStorage.removeItem(TK)
      mySess = false; go('land')
      const g = await dbGet(); if (g) updateUI(g)
    }
    document.getElementById('fw-sub')?.addEventListener('click', () => doFarewell((document.getElementById('fw-in') as HTMLInputElement).value))
    document.getElementById('fw-sk')?.addEventListener('click', () => doFarewell(''))

    // ── Spectator count (broadcast)
    const updateSpectators = (count: number) => {
      const el = document.getElementById('h-spec'); if (el) el.textContent = count + ' observent'
    }

    // ── INIT
    const init = async () => {
      // Initialise Realtime
      await initRealtime()

      // Charge l'etat initial
      let g = await dbGet()
      if (!g) {
        // Pas de Supabase configuré — mode démo local
        go('land'); return
      }
      globalState = g
      updateUI(g)

      const now = Date.now()
      const expiry = g.session_expiry ? new Date(g.session_expiry).getTime() : 0

      // Suis-je deja owner ?
      if (g.session_owner === myToken && now < expiry) {
        mySess = true; enterActiveSession(g); return
      }

      go('land')

      // Bouton entrer
      const enterBtn = document.getElementById('enter-btn')
      enterBtn?.addEventListener('click', async (e) => {
        e.preventDefault()
        startAmbientMusic()
        const g2 = await dbGet() || {}
        const now2 = Date.now()
        const expiry2 = g2.session_expiry ? new Date(g2.session_expiry).getTime() : 0
        const sessionFree = !g2.session_owner || now2 >= expiry2

        if (sessionFree) {
          const ok = await claimSession()
          if (ok) { mySess = true; const g3 = await dbGet(); enterActiveSession(g3 || {}); return }
        }
        // File d'attente
        await joinQueue()
        go('queue')
        startPolling()
        // Afficher le mini canvas
        if (g2.snap) {
          setTimeout(() => {
            const mc = document.getElementById('q-mc') as HTMLCanvasElement
            if (!mc) return
            const mctx = mc.getContext('2d')!
            mc.width = mc.offsetWidth || 480; mc.height = 110
            const img = new Image(); img.onload = () => mctx.drawImage(img, 0, 0, mc.width, mc.height); img.src = g2.snap
          }, 200)
        }
      })

      document.getElementById('q-leave')?.addEventListener('click', async () => {
        clearInterval(pollI); await leaveQueue(); go('land')
      })
    }

    init()

    window.addEventListener('beforeunload', async () => {
      if (mySess) await endSession('')
      else await leaveQueue()
    })

    return () => {
      cancelAnimationFrame(raf)
      if (glRaf) cancelAnimationFrame(glRaf)
      clearInterval(pollI); clearInterval(timerI)
      motes.forEach(m => m.remove())
      if (audioCtx) audioCtx.close()
    }
  }, [])

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}
        :root{--void:#05030f;--paper:#e8e0f5;--ash:#a090c8;--vl:#a78bfa;--bl:#93c5fd;--rl:#fca5a5}
        html,body{height:100%;background:var(--void);overflow:hidden;cursor:none;font-family:'Lato',sans-serif}
        #cur{position:fixed;width:8px;height:8px;border-radius:50%;background:var(--vl);pointer-events:none;z-index:9999;transform:translate(-50%,-50%);mix-blend-mode:screen;transition:width .15s,height .15s}
        #cur-ring{position:fixed;width:32px;height:32px;border-radius:50%;border:1.5px solid rgba(167,139,250,.45);pointer-events:none;z-index:9998;transform:translate(-50%,-50%)}
        #cur-trail{position:fixed;width:3px;height:3px;border-radius:50%;background:rgba(196,132,252,.5);pointer-events:none;z-index:9997;transform:translate(-50%,-50%)}
        #bg-canvas{position:fixed;inset:0;z-index:0;pointer-events:none}
        #grain{position:fixed;inset:0;pointer-events:none;z-index:9995;opacity:.04;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:250px;animation:gs 8s steps(10) infinite}
        @keyframes gs{0%,100%{background-position:0 0}25%{background-position:50px -30px}50%{background-position:-20px 60px}75%{background-position:80px 20px}}
        #vig{position:fixed;inset:0;background:radial-gradient(ellipse 80% 80% at 50% 50%,transparent 20%,rgba(5,3,15,.88) 100%);pointer-events:none;z-index:1}
        .mote{position:fixed;border-radius:50%;pointer-events:none;z-index:2;animation:moterise linear infinite}
        @keyframes moterise{from{transform:translateY(108vh) translateX(0);opacity:0}6%{opacity:1}88%{opacity:.3}to{transform:translateY(-8vh) translateX(var(--mx));opacity:0}}
        .screen{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2.5rem;transition:opacity 1.2s cubic-bezier(.4,0,.2,1),transform 1.2s cubic-bezier(.4,0,.2,1);z-index:10}
        .screen.off{opacity:0;pointer-events:none;transform:scale(.98)}
        .fadein{animation:veil 1.5s ease both}
        @keyframes veil{from{opacity:0}to{opacity:1}}
        @keyframes arrive{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        #s-land{text-align:center}
        .l-eyebrow{font-weight:100;font-size:.6rem;letter-spacing:.65em;text-transform:uppercase;color:rgba(167,139,250,.5);margin-bottom:3.5rem;animation:arrive 2s ease both}
        .l-title{font-family:'Playfair Display',serif;font-style:italic;font-size:clamp(4.5rem,11vw,8.5rem);font-weight:400;line-height:.92;letter-spacing:-.02em;margin-bottom:3.5rem;animation:arrive 2s ease both .35s;background:linear-gradient(135deg,var(--bl) 0%,var(--vl) 45%,var(--rl) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .l-rule{width:1px;height:56px;background:linear-gradient(to bottom,transparent,rgba(167,139,250,.5),transparent);margin:0 auto 3rem;animation:arrive 2s ease both .6s}
        .l-verse{font-family:'Libre Baskerville',serif;font-style:italic;font-size:.9rem;color:var(--ash);line-height:2.1;max-width:320px;animation:arrive 2s ease both .9s;letter-spacing:.03em}
        .l-cta-wrap{margin-top:3rem;display:flex;flex-direction:column;align-items:center;gap:1.8rem;animation:arrive 2s ease both 1.3s}
        .l-cta{font-family:'Lato',sans-serif;font-weight:300;font-size:.7rem;letter-spacing:.55em;text-transform:uppercase;color:var(--vl);background:transparent;border:none;padding:1.1rem 3.5rem;position:relative;cursor:pointer;z-index:100;transition:letter-spacing .4s}
        .l-cta::before{content:'';position:absolute;inset:0;border:1px solid rgba(167,139,250,.35);transition:border-color .4s,transform .4s;pointer-events:none}
        .l-cta::after{content:'';position:absolute;inset:5px;border:1px solid rgba(167,139,250,.12);pointer-events:none}
        .l-cta:hover{letter-spacing:.65em}.l-cta:hover::before{border-color:rgba(167,139,250,.75);transform:scale(1.03)}
        .l-count{font-weight:100;font-size:.6rem;letter-spacing:.3em;color:rgba(167,139,250,.35)}.l-count em{font-style:normal;color:rgba(167,139,250,.6)}
        #s-queue{max-width:540px;width:100%}
        .q-top{text-align:center;margin-bottom:3rem}
        .q-ey{font-weight:100;font-size:.55rem;letter-spacing:.6em;text-transform:uppercase;color:rgba(147,197,253,.4);margin-bottom:1.5rem}
        .q-num{font-family:'Playfair Display',serif;font-style:italic;font-size:7rem;line-height:1;font-weight:400;background:linear-gradient(135deg,var(--bl),var(--vl));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .q-nlabel{font-family:'Libre Baskerville',serif;font-style:italic;font-size:.78rem;color:var(--ash);opacity:.45;margin-top:.3rem;letter-spacing:.15em}
        .q-wait{font-family:'Playfair Display',serif;font-style:italic;font-size:1.15rem;color:rgba(167,139,250,.6);margin-top:.7rem}
        .q-div{display:flex;align-items:center;gap:2rem;margin:2.5rem 0;opacity:.25}
        .q-div::before,.q-div::after{content:'';flex:1;height:1px;background:linear-gradient(to right,transparent,var(--vl))}.q-div::after{background:linear-gradient(to left,transparent,var(--vl))}
        .q-div span{color:var(--vl);font-size:.5rem}
        .q-obs{border:1px solid rgba(167,139,250,.12);padding:1.8rem;background:rgba(124,58,237,.03);margin-bottom:1.8rem}
        .q-oh{display:flex;align-items:center;gap:.8rem;margin-bottom:1.2rem}
        .q-live{width:5px;height:5px;border-radius:50%;background:#dc2626;animation:lb 2.5s ease infinite}
        @keyframes lb{0%,100%{opacity:.2}50%{opacity:1;box-shadow:0 0 6px #dc2626}}
        .q-olabel{font-weight:100;font-size:.55rem;letter-spacing:.4em;text-transform:uppercase;color:rgba(147,197,253,.3)}
        #q-mc{width:100%;height:110px;display:block}
        .q-act{font-family:'Libre Baskerville',serif;font-style:italic;font-size:.8rem;color:var(--ash);opacity:.4;margin-top:1rem;min-height:1em;transition:opacity .5s,transform .4s}
        .q-act.swap{opacity:0;transform:translateY(5px)}
        .q-meta{display:flex;justify-content:space-between;align-items:center}
        .q-wat{font-weight:100;font-size:.6rem;letter-spacing:.25em;color:rgba(147,197,253,.3)}
        .q-leave{background:transparent;border:none;font-family:'Libre Baskerville',serif;font-style:italic;font-size:.75rem;color:rgba(167,139,250,.25);cursor:pointer;transition:color .3s}.q-leave:hover{color:rgba(167,139,250,.7)}
        #s-active{padding:0;z-index:5}
        #canvas-main{position:absolute;inset:0;cursor:none}
        .hud{position:absolute;z-index:20;pointer-events:none}.hud.i{pointer-events:all}
        .h-timer{top:2rem;left:50%;transform:translateX(-50%);font-weight:100;font-size:1rem;letter-spacing:.5em;color:rgba(167,139,250,.4);transition:color .5s}
        .h-timer.warn{color:rgba(220,38,38,.6)}.h-timer.urgent{color:#dc2626;animation:up .8s ease infinite alternate}
        @keyframes up{from{opacity:.6}to{opacity:1}}
        .h-mood{top:2rem;left:2.5rem;font-family:'Libre Baskerville',serif;font-style:italic;font-size:.7rem;color:rgba(167,139,250,.22);letter-spacing:.15em}
        .h-spec{top:2rem;right:2.5rem;font-weight:100;font-size:.6rem;letter-spacing:.3em;color:rgba(147,197,253,.15)}
        .h-prev{top:5.5rem;left:50%;transform:translateX(-50%);max-width:400px;text-align:center;font-family:'Libre Baskerville',serif;font-style:italic;font-size:.9rem;color:rgba(167,139,250,.35);line-height:1.9;transition:opacity 2s}
        .toolbar{bottom:2.5rem;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:.2rem;background:rgba(5,3,15,.75);border:1px solid rgba(167,139,250,.12);padding:.4rem;backdrop-filter:blur(10px)}
        .tbtn{font-weight:300;font-size:.55rem;letter-spacing:.3em;text-transform:uppercase;color:rgba(160,144,200,.35);background:transparent;border:none;cursor:pointer;padding:.6rem 1.2rem;transition:all .3s;position:relative}
        .tbtn::after{content:'';position:absolute;bottom:3px;left:50%;transform:translateX(-50%);width:0;height:1px;background:var(--vl);transition:width .3s}
        .tbtn:hover{color:rgba(167,139,250,.7)}.tbtn.on{color:var(--vl)}.tbtn.on::after{width:55%}
        .tsep{width:1px;height:20px;background:rgba(167,139,250,.1)}
        .t-act{font-size:.6rem;color:rgba(196,132,252,.4);background:transparent;border:1px solid rgba(124,58,237,.2);cursor:pointer;padding:.5rem .9rem;transition:all .3s;font-family:'Lato',sans-serif;font-weight:300;letter-spacing:.2em}.t-act:hover{color:rgba(196,132,252,.8);border-color:rgba(124,58,237,.5)}
        .pal{bottom:6rem;left:50%;transform:translateX(-50%);display:flex;gap:.4rem;align-items:center}
        .psw{width:13px;height:13px;border-radius:50%;cursor:pointer;border:1px solid transparent;transition:transform .25s,border-color .25s}.psw.on{transform:scale(1.5);border-color:rgba(232,224,245,.6)}
        .bctl{bottom:9.2rem;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:.8rem;font-weight:100;font-size:.55rem;letter-spacing:.2em;color:rgba(160,144,200,.2)}
        .bctl input[type=range]{-webkit-appearance:none;width:70px;height:1px;background:rgba(167,139,250,.25);outline:none;cursor:pointer}
        .bctl input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:8px;height:8px;border-radius:50%;background:rgba(167,139,250,.7);cursor:pointer}
        .txov{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:25;background:transparent;border:none;outline:none;color:rgba(232,224,245,.85);font-family:'Playfair Display',serif;font-style:italic;font-size:1.4rem;text-align:center;min-width:260px;caret-color:var(--vl);letter-spacing:.05em}.txov::placeholder{color:rgba(160,144,200,.2)}
        #activity-panel{position:absolute;inset:0;z-index:30;background:rgba(5,3,15,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2rem;backdrop-filter:blur(20px);transition:opacity .8s}
        #activity-panel.off{opacity:0;pointer-events:none}
        .act-eyebrow{font-weight:100;font-size:.55rem;letter-spacing:.6em;text-transform:uppercase;color:rgba(167,139,250,.35)}
        #activity-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;max-width:600px;width:100%;padding:0 1rem}
        .act-btn{background:rgba(124,58,237,.06);border:1px solid rgba(167,139,250,.15);padding:1.4rem 1rem;display:flex;flex-direction:column;align-items:center;gap:.5rem;cursor:pointer;transition:all .35s;text-align:center}
        .act-btn:hover{background:rgba(124,58,237,.15);border-color:rgba(167,139,250,.4);transform:translateY(-2px)}
        .act-icon{font-size:1.3rem;color:var(--vl)}
        .act-title{font-family:'Lato',sans-serif;font-weight:300;font-size:.65rem;letter-spacing:.35em;text-transform:uppercase;color:rgba(167,139,250,.7)}
        .act-desc{font-family:'Libre Baskerville',serif;font-style:italic;font-size:.72rem;color:rgba(160,144,200,.4);line-height:1.5}
        #act-close-btn{font-family:'Libre Baskerville',serif;font-style:italic;font-size:.75rem;color:rgba(167,139,250,.25);background:transparent;border:none;cursor:pointer;transition:color .3s}.#act-close-btn:hover{color:rgba(167,139,250,.6)}
        #meditation-overlay{position:absolute;inset:0;z-index:35;background:rgba(5,3,15,.97);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3rem}
        #meditation-overlay.off{opacity:0;pointer-events:none;transition:opacity 1s}
        #med-text{font-family:'Playfair Display',serif;font-style:italic;font-size:2.5rem;color:rgba(167,139,250,.6);transition:opacity 1s;letter-spacing:.1em}
        #med-close{background:transparent;border:none;font-family:'Libre Baskerville',serif;font-style:italic;font-size:.75rem;color:rgba(167,139,250,.2);cursor:pointer;transition:color .3s}.#med-close:hover{color:rgba(167,139,250,.5)}
        #color-shift-panel{position:absolute;bottom:5rem;left:50%;transform:translateX(-50%);z-index:30;background:rgba(5,3,15,.9);border:1px solid rgba(167,139,250,.15);padding:1.2rem 1.5rem;display:flex;gap:.8rem;align-items:center;backdrop-filter:blur(10px)}
        #color-shift-panel.off{display:none}
        .cs-btn{width:22px;height:22px;border-radius:50%;cursor:pointer;border:1px solid rgba(255,255,255,.15);transition:transform .25s,border-color .25s}.cs-btn:hover{transform:scale(1.3);border-color:rgba(255,255,255,.5)}
        .cs-label{font-weight:100;font-size:.55rem;letter-spacing:.3em;color:rgba(167,139,250,.3);text-transform:uppercase}
        #s-fare{text-align:center;max-width:440px}
        .fw-ey{font-weight:100;font-size:.55rem;letter-spacing:.6em;text-transform:uppercase;color:rgba(167,139,250,.3);margin-bottom:2.5rem}
        .fw-t{font-family:'Playfair Display',serif;font-style:italic;font-weight:400;font-size:2.8rem;line-height:1.1;margin-bottom:2rem;background:linear-gradient(135deg,var(--bl),var(--vl),var(--rl));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .fw-b{font-family:'Libre Baskerville',serif;font-style:italic;font-size:.85rem;color:var(--ash);opacity:.45;line-height:2;margin-bottom:2.5rem}
        .fw-prev{border-left:2px solid rgba(124,58,237,.3);padding:.5rem 0 .5rem 1.5rem;text-align:left;margin-bottom:2rem;background:rgba(124,58,237,.04)}
        .fw-pt{font-family:'Libre Baskerville',serif;font-style:italic;font-size:.85rem;color:rgba(167,139,250,.55);line-height:1.8}
        .fw-pf{font-weight:100;font-size:.55rem;letter-spacing:.3em;color:rgba(167,139,250,.25);margin-top:.4rem;text-transform:uppercase}
        .fw-in{background:transparent;border:none;border-bottom:1px solid rgba(167,139,250,.2);color:var(--paper);font-family:'Playfair Display',serif;font-style:italic;font-size:1rem;text-align:center;padding:.6rem;width:100%;outline:none;letter-spacing:.04em;margin-bottom:2.5rem;transition:border-color .3s}.fw-in:focus{border-color:rgba(167,139,250,.5)}.fw-in::placeholder{color:rgba(160,144,200,.2)}
        .fw-btn{font-weight:300;font-size:.65rem;letter-spacing:.5em;text-transform:uppercase;color:var(--vl);background:transparent;border:1px solid rgba(124,58,237,.25);padding:1rem 3rem;cursor:pointer;transition:all .4s;display:block;width:100%;margin-bottom:1rem}.fw-btn:hover{border-color:rgba(124,58,237,.55);background:rgba(124,58,237,.06)}
        .fw-sk{background:transparent;border:none;font-family:'Libre Baskerville',serif;font-style:italic;font-size:.75rem;color:rgba(160,144,200,.2);cursor:pointer;transition:color .3s}.fw-sk:hover{color:rgba(160,144,200,.4)}
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=Lato:wght@100;300&family=Libre+Baskerville:ital,wght@0,400;1,400&display=swap" rel="stylesheet" />

      <canvas id="bg-canvas" />
      <div id="grain" />
      <div id="vig" />
      <div id="cur" /><div id="cur-ring" /><div id="cur-trail" />

      {/* LANDING */}
      <div className="screen fadein" id="s-land">
        <p className="l-eyebrow">un sanctuaire numerique · une ame a la fois</p>
        <h1 className="l-title">unsite°</h1>
        <div className="l-rule" />
        <p className="l-verse">
          quelqu&apos;un est ici en ce moment.<br />
          une seule personne peut entrer.<br />
          tout le monde laisse quelque chose.
        </p>
        <div className="l-cta-wrap">
          <button className="l-cta" id="enter-btn" type="button">entrer dans le silence</button>
          <p className="l-count"><em id="land-n">—</em> ames attendent</p>
        </div>
      </div>

      {/* QUEUE */}
      <div className="screen off" id="s-queue">
        <div className="q-top">
          <p className="q-ey">ta position dans la file</p>
          <p className="q-num" id="q-num">—</p>
          <p className="q-nlabel">sur la liste de l&apos;attente</p>
          <p className="q-wait" id="q-wait">—</p>
        </div>
        <div className="q-div"><span>◈</span></div>
        <div className="q-obs">
          <div className="q-oh"><span className="q-live" /><span className="q-olabel">ce que fait la personne active</span></div>
          <canvas id="q-mc" />
          <p className="q-act" id="q-act">elle trace quelque chose dans le noir.</p>
        </div>
        <div className="q-meta">
          <p className="q-wat"><span id="q-w">0</span> observateurs</p>
          <button className="q-leave" id="q-leave" type="button">partir</button>
        </div>
      </div>

      {/* ACTIVE */}
      <div className="screen off" id="s-active">
        <canvas id="canvas-main" />
        <div className="hud h-mood" id="h-mood">contemplation</div>
        <div className="hud h-timer" id="h-timer">5·00</div>
        <div className="hud h-spec" id="h-spec">0 observent</div>
        <div className="hud h-prev" id="h-prev" style={{opacity:0}} />
        <div className="hud i bctl" id="bctl" style={{display:'none'}}>
          <span>·</span><input type="range" id="bsz" min="1" max="24" defaultValue="3" /><span>●</span>
        </div>
        <div className="hud i pal" id="pal" style={{display:'none'}} />
        <div className="hud i toolbar">
          <button className="tbtn on" id="t-draw" type="button">dessiner</button>
          <div className="tsep" />
          <button className="tbtn" id="t-write" type="button">ecrire</button>
          <div className="tsep" />
          <button className="tbtn" id="t-erase" type="button">effacer</button>
          <div className="tsep" />
          <button className="t-act tbtn" id="act-open" type="button">activites ✦</button>
        </div>
        <input type="text" className="txov" id="txov" placeholder="murmure..." maxLength={80} style={{display:'none'}} />

        {/* Activity panel */}
        <div id="activity-panel" className="off">
          <p className="act-eyebrow">que veux-tu faire de ce moment ?</p>
          <div id="activity-grid" />
          <button id="act-close" type="button" style={{background:'transparent',border:'none',fontFamily:'Libre Baskerville,serif',fontStyle:'italic',fontSize:'.75rem',color:'rgba(167,139,250,.25)',cursor:'pointer'}}>fermer ↩</button>
        </div>

        {/* Meditation overlay */}
        <div id="meditation-overlay" className="off">
          <p style={{fontFamily:'Lato,sans-serif',fontWeight:100,fontSize:'.55rem',letterSpacing:'.5em',color:'rgba(167,139,250,.3)',textTransform:'uppercase'}}>exercice de presence</p>
          <p id="med-text" style={{fontFamily:'Playfair Display,serif',fontStyle:'italic',fontSize:'2.5rem',color:'rgba(167,139,250,.6)',letterSpacing:'.1em'}}>inspire...</p>
          <p style={{fontFamily:'Libre Baskerville,serif',fontStyle:'italic',fontSize:'.75rem',color:'rgba(167,139,250,.2)'}}>laisse le monde attendre</p>
          <button id="med-close" type="button" style={{background:'transparent',border:'none',fontFamily:'Libre Baskerville,serif',fontStyle:'italic',fontSize:'.75rem',color:'rgba(167,139,250,.2)',cursor:'pointer',marginTop:'2rem'}}>revenir ↩</button>
        </div>

        {/* Color shift */}
        <div id="color-shift-panel" className="off">
          <span className="cs-label">ambiance</span>
          {[['270','#7c3aed'],['220','#2563eb'],['0','#dc2626'],['330','#db2777'],['180','#0891b2'],['160','#059669']].map(([hue,bg]) => (
            <div key={hue} className="cs-btn" style={{background:bg}} data-hue={hue} />
          ))}
        </div>
      </div>

      {/* FAREWELL */}
      <div className="screen off" id="s-fare">
        <p className="fw-ey">fin de session</p>
        <h2 className="fw-t">ton temps s&apos;acheve.</h2>
        <p className="fw-b">laisse quelque chose pour l&apos;inconnu qui vient.<br />un mot. une question. un secret.</p>
        <div className="fw-prev" id="fw-prev" style={{display:'none'}}>
          <p className="fw-pt" id="fw-pt" />
          <p className="fw-pf">du visiteur precedent</p>
        </div>
        <input type="text" className="fw-in" id="fw-in" placeholder="ton message pour le suivant..." maxLength={120} />
        <button className="fw-btn" id="fw-sub" type="button">laisser ce message</button>
        <button className="fw-sk" id="fw-sk" type="button">partir en silence</button>
      </div>
    </>
  )
}
