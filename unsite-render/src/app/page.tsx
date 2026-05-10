'use client'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    // ── Cursor
    const CUR = document.getElementById('cur')!
    const CURR = document.getElementById('cur-ring')!
    const CURT = document.getElementById('cur-trail')!
    let mx = window.innerWidth / 2, my = window.innerHeight / 2
    let rx = mx, ry = my, tx = mx, ty = my
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; CUR.style.left = mx + 'px'; CUR.style.top = my + 'px' }
    document.addEventListener('mousemove', onMove)
    const onDown = () => { CUR.style.width = '14px'; CUR.style.height = '14px' }
    const onUp = () => { CUR.style.width = '8px'; CUR.style.height = '8px' }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup', onUp)
    let rafId: number
    const animCursor = () => {
      rx += (mx - rx) * .1; ry += (my - ry) * .1
      tx += (mx - tx) * .06; ty += (my - ty) * .06
      CURR.style.left = Math.round(rx) + 'px'; CURR.style.top = Math.round(ry) + 'px'
      CURT.style.left = Math.round(tx) + 'px'; CURT.style.top = Math.round(ty) + 'px'
      rafId = requestAnimationFrame(animCursor)
    }
    rafId = requestAnimationFrame(animCursor)

    // ── WebGL waves background
    const bgC = document.getElementById('bg-canvas') as HTMLCanvasElement
    const gl = bgC.getContext('webgl') as WebGLRenderingContext | null
    let glRaf: number
    if (gl) {
      const resize = () => { bgC.width = window.innerWidth; bgC.height = window.innerHeight; gl.viewport(0, 0, bgC.width, bgC.height) }
      window.addEventListener('resize', resize); resize()
      const vs = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`
      const fs = [
        'precision mediump float;',
        'uniform float t;uniform vec2 res;',
        'void main(){',
        '  vec2 uv=gl_FragCoord.xy/res;',
        '  float tt=t*0.0006;',
        '  float wave1=sin(uv.x*6.0+tt*2.0)*0.5+0.5;',
        '  float wave2=sin(uv.x*4.0-tt*1.5+uv.y*3.0)*0.5+0.5;',
        '  float wave3=cos(uv.y*5.0+tt*1.8+uv.x*2.0)*0.5+0.5;',
        '  float blob1=smoothstep(0.85,0.0,length(uv-vec2(sin(tt*0.7)*0.4+0.5,cos(tt*0.5)*0.3+0.5)));',
        '  float blob2=smoothstep(0.7,0.0,length(uv-vec2(cos(tt*0.9+1.2)*0.4+0.5,sin(tt*0.6+0.8)*0.3+0.5)));',
        '  float blob3=smoothstep(0.6,0.0,length(uv-vec2(sin(tt*1.1+2.1)*0.35+0.5,cos(tt*0.8+1.5)*0.35+0.5)));',
        '  vec3 violet=vec3(0.48,0.22,0.98);',
        '  vec3 blue=vec3(0.08,0.39,0.98);',
        '  vec3 red=vec3(0.86,0.15,0.15);',
        '  vec3 col=vec3(0.02,0.01,0.08);',
        '  col=mix(col,violet,blob1*0.55);',
        '  col=mix(col,blue,blob2*0.45);',
        '  col=mix(col,red,blob3*0.35);',
        '  col+=violet*wave1*wave2*0.04;',
        '  col+=blue*wave2*wave3*0.035;',
        '  col+=red*wave1*wave3*0.025;',
        '  col=clamp(col,0.0,1.0);',
        '  gl_FragColor=vec4(col,1.0);',
        '}'
      ].join('\n')
      const mkShader = (type: number, src: string) => {
        const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s
      }
      const prog = gl.createProgram()!
      gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, vs))
      gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, fs))
      gl.linkProgram(prog); gl.useProgram(prog)
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW)
      const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
      const tU = gl.getUniformLocation(prog, 't'), rU = gl.getUniformLocation(prog, 'res')
      const frame = (ts: number) => {
        gl.uniform1f(tU!, ts); gl.uniform2f(rU!, bgC.width, bgC.height)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); glRaf = requestAnimationFrame(frame)
      }
      glRaf = requestAnimationFrame(frame)
    }

    // ── Motes
    const MCOLS = ['rgba(167,139,250,', 'rgba(147,197,253,', 'rgba(252,165,165,', 'rgba(196,132,252,', 'rgba(99,102,241,']
    const motes: HTMLElement[] = []
    for (let i = 0; i < 16; i++) {
      const m = document.createElement('div'); m.className = 'mote'
      const sz = Math.random() * 2 + .8, dur = 22 + Math.random() * 32
      const col = MCOLS[Math.floor(Math.random() * MCOLS.length)]
      m.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}vw;background:${col}${Math.random()*.5+.1});--mx:${(Math.random()-.5)*180}px;animation-duration:${dur}s;animation-delay:${-Math.random()*dur}s`
      document.body.appendChild(m); motes.push(m)
    }

    // ── Storage & state
    const SK = 'unsite_v6', TK = 'unsite_tk_v6'
    let myTk: string | null = null, mySess: string | null = null
    let timerI: ReturnType<typeof setInterval> | null = null
    let pollI: ReturnType<typeof setInterval> | null = null
    let tool = 'draw', color = '#a78bfa', brushSz = 3
    let cv: HTMLCanvasElement | null = null, ctx: CanvasRenderingContext2D | null = null
    let drawing = false, lx = 0, ly = 0

    const mkToken = () => { const b = new Uint8Array(20); crypto.getRandomValues(b); return Array.from(b, x => x.toString(16).padStart(2, '0')).join('') }
    const getToken = () => { let t = sessionStorage.getItem(TK); if (!t) { t = mkToken(); sessionStorage.setItem(TK, t) } return t }

    const loadStore = async () => { try { const r = await (window as any).storage.get(SK, true); if (r?.value) return JSON.parse(r.value) } catch {} return null }
    const saveStore = async (p: Record<string, unknown>) => {
      const c = await loadStore() || { sessionOwner: null, expiry: 0, queue: [], messages: [], moodVal: .5, snap: null }
      try { await (window as any).storage.set(SK, JSON.stringify({ ...c, ...p }), true) } catch {}
    }
    const isOwner = () => myTk && myTk === mySess

    const claimSession = async (tok: string) => {
      const g = await loadStore() || {}; const now = Date.now()
      if (g.sessionOwner && now < (g.expiry || 0)) return false
      const q = (g.queue || []).filter((t: string) => t !== tok)
      await saveStore({ sessionOwner: tok, expiry: now + 300000, queue: q, totalVisits: (g.totalVisits || 0) + 1 })
      return true
    }
    const joinQueue = async (tok: string) => {
      const g = await loadStore() || { queue: [] }; const q: string[] = g.queue || []
      if (!q.includes(tok)) { q.push(tok); await saveStore({ queue: q }) }
    }
    const leaveQueue = async (tok: string) => {
      const g = await loadStore() || { queue: [] }
      await saveStore({ queue: (g.queue || []).filter((t: string) => t !== tok) })
    }
    const endSession = async (tok: string, msg: string) => {
      const g = await loadStore() || {}; if (g.sessionOwner !== tok) return
      const msgs: {t:string,ts:number}[] = g.messages || []
      if (msg?.trim()) { msgs.push({ t: msg.trim(), ts: Date.now() }); if (msgs.length > 30) msgs.splice(0, msgs.length - 30) }
      await saveStore({ sessionOwner: null, expiry: 0, messages: msgs, moodVal: calcMood(msgs) })
    }
    const saveSnap = async (d: string) => saveStore({ snap: d })

    const calcMood = (msgs: {t:string}[]) => {
      const warm = ['merci','amour','beau','doux','paix','joie'], dark = ['seul','triste','peur','vide','nuit','perdu']
      let v = .5
      msgs.slice(-6).forEach(m => { const t = m.t.toLowerCase(); warm.forEach(w => { if (t.includes(w)) v = Math.min(1, v + .07) }); dark.forEach(w => { if (t.includes(w)) v = Math.max(.05, v - .05) }) })
      return v
    }

    // ── Screen nav
    const go = (id: string) => {
      document.querySelectorAll('.screen').forEach(s => s.classList.add('off'))
      const el = document.getElementById('s-' + id)!; el.classList.remove('off'); el.classList.add('fadein')
    }
    const applyMood = (v: number) => {
      const moods = ['melancolie','solitude','contemplation','serenite','lumiere']
      const el = document.getElementById('h-mood'); if (el) el.textContent = moods[Math.min(4, Math.floor(v * 5))]
    }

    // ── Count
    const refreshCount = async () => {
      const g = await loadStore() || {}; const n = (g.queue || []).length
      const el = document.getElementById('land-n'); if (el) el.textContent = n || '—'
    }
    refreshCount()
    const countI = setInterval(refreshCount, 8000)

    // ── Enter
    const enterBtn = document.getElementById('enter-btn')!
    const onEnter = async (e: Event) => {
      e.preventDefault(); e.stopPropagation()
      myTk = getToken()
      const g = await loadStore() || {}; const now = Date.now()
      if (g.sessionOwner === myTk && now < (g.expiry || 0)) {
        mySess = myTk; go('active'); setupCanvas(); restoreSnap(); startTimer(g.expiry); applyMood(g.moodVal || .5); showPrev(g); return
      }
      if (!g.sessionOwner || now >= (g.expiry || 0)) {
        const ok = await claimSession(myTk)
        if (ok) { const g2 = await loadStore() || {}; mySess = myTk; go('active'); setupCanvas(); restoreSnap(); startTimer(g2.expiry); applyMood(g2.moodVal || .5); showPrev(g2); return }
      }
      await joinQueue(myTk); go('queue'); const g3 = await loadStore() || {}; applyMood(g3.moodVal || .5); startPoll()
    }
    enterBtn.addEventListener('click', onEnter)

    const showPrev = (g: Record<string, unknown>) => {
      const msgs = (g.messages || []) as {t:string}[]; if (!msgs.length) return
      const last = msgs[msgs.length - 1]
      const el = document.getElementById('h-prev'); if (!el) return
      el.innerHTML = '\u201c' + last.t + '\u201d'; el.style.opacity = '.7'
      setTimeout(() => { el.style.opacity = '0' }, 14000)
    }

    // ── Queue
    const QUEUE_ACTIONS = [
      'elle trace des cercles dans le noir.',
      'il ecrit quelque chose, puis efface.',
      'elle contemple le vide violet.',
      'il dessine une ligne tres longue.',
      'elle laisse une empreinte lumineuse.',
      'il murmure des choses au canvas.',
      'elle peint une constellation bleue.',
      'il efface tout et recommence.'
    ]
    let qAI = 0

    const startPoll = () => {
      pollI = setInterval(async () => {
        const g = await loadStore() || {}; const queue: string[] = g.queue || []; const pos = queue.indexOf(myTk!); const now = Date.now()
        if (!g.sessionOwner || now >= (g.expiry || 0)) {
          const ok = await claimSession(myTk!)
          if (ok) {
            clearInterval(pollI!); const g2 = await loadStore() || {}; mySess = myTk
            go('active'); setupCanvas(); restoreSnap(); startTimer(g2.expiry); applyMood(g2.moodVal || .5); showPrev(g2); return
          }
        }
        const rem = Math.max(0, Math.floor(((g.expiry || 0) - now) / 1000))
        const myP = pos < 0 ? 1 : pos + 1; const wm = Math.ceil((rem + (myP - 1) * 300) / 60)
        const qNum = document.getElementById('q-num'); if (qNum) qNum.textContent = String(myP)
        const qWait = document.getElementById('q-wait')
        if (qWait) qWait.textContent = wm <= 1 ? 'moins dune minute' : 'environ ' + wm + ' minute' + (wm > 1 ? 's' : '')
        const qW = document.getElementById('q-w'); if (qW) qW.textContent = String(Math.max(0, queue.length + Math.floor(Math.random() * 2)))
        const aEl = document.getElementById('q-act')
        if (aEl) { aEl.classList.add('swap'); setTimeout(() => { qAI = (qAI + 1) % QUEUE_ACTIONS.length; aEl.textContent = QUEUE_ACTIONS[qAI]; aEl.classList.remove('swap') }, 400) }
        drawMini(g)
      }, 3500)
    }

    const drawMini = (g: Record<string, unknown>) => {
      const mc = document.getElementById('q-mc') as HTMLCanvasElement; if (!mc) return
      const mctx = mc.getContext('2d')!; mc.width = mc.offsetWidth || 480; mc.height = 110
      mctx.clearRect(0, 0, mc.width, mc.height)
      if (g.snap) {
        const img = new Image(); img.onload = () => mctx.drawImage(img, 0, 0, mc.width, mc.height); img.src = g.snap as string
      } else {
        mctx.strokeStyle = 'rgba(167,139,250,.15)'; mctx.lineWidth = .8
        for (let j = 0; j < 4; j++) {
          mctx.beginPath(); mctx.moveTo(Math.random() * mc.width, Math.random() * mc.height)
          mctx.bezierCurveTo(Math.random() * mc.width, Math.random() * mc.height, Math.random() * mc.width, Math.random() * mc.height, Math.random() * mc.width, mc.height / 2)
          mctx.stroke()
        }
      }
    }

    const qLeave = document.getElementById('q-leave')!
    qLeave.addEventListener('click', async () => { clearInterval(pollI!); await leaveQueue(myTk!); go('land'); refreshCount() })

    // ── Canvas drawing
    const SWATCHES = ['#a78bfa','#93c5fd','#fca5a5','#c084fc','#818cf8','#f9a8d4','#67e8f9','#e8e0f5','#1e1040']

    const setupCanvas = () => {
      cv = document.getElementById('canvas-main') as HTMLCanvasElement; ctx = cv.getContext('2d')!
      resizeCanvas(); window.addEventListener('resize', resizeCanvas)
      cv.addEventListener('mousedown', startDraw); cv.addEventListener('mousemove', doDraw)
      cv.addEventListener('mouseup', stopDraw); cv.addEventListener('mouseleave', stopDraw)
      cv.addEventListener('touchstart', e => { e.preventDefault(); startDraw(e.touches[0] as unknown as MouseEvent) }, { passive: false })
      cv.addEventListener('touchmove', e => { e.preventDefault(); doDraw(e.touches[0] as unknown as MouseEvent) }, { passive: false })
      cv.addEventListener('touchend', e => { e.preventDefault(); stopDraw() }, { passive: false })
      setupPalette()
    }
    const resizeCanvas = () => {
      if (!cv || !ctx) return
      const snap = cv.width > 0 ? ctx.getImageData(0, 0, cv.width, cv.height) : null
      cv.width = window.innerWidth; cv.height = window.innerHeight
      if (snap) ctx.putImageData(snap, 0, 0)
    }
    const restoreSnap = async () => {
      const g = await loadStore() || {}; if (!g.snap) return
      const img = new Image(); img.onload = () => { if (ctx && cv) ctx.drawImage(img, 0, 0, cv.width, cv.height) }; img.src = g.snap as string
    }
    const getPos = (e: MouseEvent) => { const r = cv!.getBoundingClientRect(); return { x: (e.clientX || (e as any).pageX) - r.left, y: (e.clientY || (e as any).pageY) - r.top } }
    const startDraw = (e: MouseEvent) => { if (!isOwner() || tool === 'write') return; drawing = true; const p = getPos(e); lx = p.x; ly = p.y }
    let saveSnapTimer: ReturnType<typeof setTimeout>
    const doDraw = (e: MouseEvent) => {
      if (!drawing || !isOwner() || !ctx || tool === 'write') return
      const p = getPos(e); ctx.lineWidth = brushSz; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      if (tool === 'erase') { ctx.globalCompositeOperation = 'destination-out'; ctx.strokeStyle = 'rgba(0,0,0,1)' }
      else { ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = color }
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(p.x, p.y); ctx.stroke(); lx = p.x; ly = p.y
      clearTimeout(saveSnapTimer); saveSnapTimer = setTimeout(() => saveSnap(cv!.toDataURL('image/webp', .45)), 1800)
    }
    const stopDraw = () => { drawing = false }

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
        ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText(ti.value.trim(), cv.width / 2, cv.height / 2)
        ti.value = ''; setTool('draw')
        clearTimeout(saveSnapTimer); saveSnapTimer = setTimeout(() => saveSnap(cv!.toDataURL('image/webp', .45)), 600)
      }
      if (e.key === 'Escape') { ti.value = ''; setTool('draw') }
    }

    document.getElementById('t-draw')!.addEventListener('click', () => setTool('draw'))
    document.getElementById('t-write')!.addEventListener('click', () => setTool('write'))
    document.getElementById('t-erase')!.addEventListener('click', () => setTool('erase'))
    document.getElementById('bsz')!.addEventListener('input', e => { brushSz = +(e.target as HTMLInputElement).value })

    // ── Timer
    const startTimer = (expiry: number) => {
      timerI = setInterval(() => {
        const rem = Math.max(0, Math.floor((expiry - Date.now()) / 1000))
        const mm = Math.floor(rem / 60), ss = rem % 60
        const el = document.getElementById('h-timer')
        if (el) { el.textContent = mm + '\u00b7' + String(ss).padStart(2, '0'); el.className = 'hud h-timer' + (rem < 120 ? ' warn' : '') + (rem < 30 ? ' urgent' : '') }
        if (rem <= 0) { clearInterval(timerI!); goFarewell() }
      }, 500)
    }

    // ── Farewell
    const goFarewell = async () => {
      go('fare')
      const g = await loadStore() || {}; const msgs = (g.messages || []) as {t:string}[]
      if (msgs.length) {
        const last = msgs[msgs.length - 1]
        const pt = document.getElementById('fw-pt'); if (pt) pt.textContent = '\u201c' + last.t + '\u201d'
        const fp = document.getElementById('fw-prev'); if (fp) fp.style.display = 'block'
      }
    }
    const doFarewell = async (msg: string) => {
      await endSession(myTk!, msg); sessionStorage.removeItem(TK); myTk = null; mySess = null; go('land'); refreshCount()
    }
    document.getElementById('fw-sub')!.addEventListener('click', () => doFarewell((document.getElementById('fw-in') as HTMLInputElement).value))
    document.getElementById('fw-sk')!.addEventListener('click', () => doFarewell(''))

    // ── Security
    if (window.top !== window.self) { document.body.innerHTML = ''; return }
    const onUnload = async () => { if (isOwner()) await endSession(myTk!, ''); else if (myTk) await leaveQueue(myTk) }
    window.addEventListener('beforeunload', onUnload)

    // ── Cleanup
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('mouseup', onUp)
      cancelAnimationFrame(rafId)
      if (glRaf) cancelAnimationFrame(glRaf)
      clearInterval(countI)
      if (timerI) clearInterval(timerI)
      if (pollI) clearInterval(pollI)
      motes.forEach(m => m.remove())
      window.removeEventListener('beforeunload', onUnload)
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
        @keyframes arrive{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        .fadein{animation:veil 1.5s ease both}
        @keyframes veil{from{opacity:0}to{opacity:1}}
        #s-land{text-align:center}
        .l-eyebrow{font-weight:100;font-size:.6rem;letter-spacing:.65em;text-transform:uppercase;color:rgba(167,139,250,.5);margin-bottom:3.5rem;animation:arrive 2s ease both}
        .l-title{font-family:'Playfair Display',serif;font-style:italic;font-size:clamp(4.5rem,11vw,8.5rem);font-weight:400;line-height:.92;letter-spacing:-.02em;margin-bottom:3.5rem;animation:arrive 2s ease both .35s;background:linear-gradient(135deg,var(--bl) 0%,var(--vl) 45%,var(--rl) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .l-rule{width:1px;height:56px;background:linear-gradient(to bottom,transparent,rgba(167,139,250,.5),transparent);margin:0 auto 3rem;animation:arrive 2s ease both .6s}
        .l-verse{font-family:'Libre Baskerville',serif;font-style:italic;font-size:.9rem;color:var(--ash);line-height:2.1;max-width:320px;animation:arrive 2s ease both .9s;letter-spacing:.03em}
        .l-cta-wrap{margin-top:3rem;display:flex;flex-direction:column;align-items:center;gap:1.8rem;animation:arrive 2s ease both 1.3s}
        .l-cta{font-family:'Lato',sans-serif;font-weight:300;font-size:.7rem;letter-spacing:.55em;text-transform:uppercase;color:var(--vl);background:transparent;border:none;padding:1.1rem 3.5rem;position:relative;cursor:pointer;z-index:100;transition:letter-spacing .4s}
        .l-cta::before{content:'';position:absolute;inset:0;border:1px solid rgba(167,139,250,.35);transition:border-color .4s,transform .4s;pointer-events:none}
        .l-cta::after{content:'';position:absolute;inset:5px;border:1px solid rgba(167,139,250,.12);transition:border-color .4s;pointer-events:none}
        .l-cta:hover{letter-spacing:.62em}
        .l-cta:hover::before{border-color:rgba(167,139,250,.75);transform:scale(1.025)}
        .l-count{font-weight:100;font-size:.6rem;letter-spacing:.3em;color:rgba(167,139,250,.35)}
        .l-count em{font-style:normal;color:rgba(167,139,250,.6)}
        #s-queue{max-width:540px;width:100%}
        .q-top{text-align:center;margin-bottom:3rem}
        .q-ey{font-weight:100;font-size:.55rem;letter-spacing:.6em;text-transform:uppercase;color:rgba(147,197,253,.4);margin-bottom:1.5rem}
        .q-num{font-family:'Playfair Display',serif;font-style:italic;font-size:7rem;line-height:1;font-weight:400;background:linear-gradient(135deg,var(--bl),var(--vl));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .q-nlabel{font-family:'Libre Baskerville',serif;font-style:italic;font-size:.78rem;color:var(--ash);opacity:.45;margin-top:.3rem;letter-spacing:.15em}
        .q-wait{font-family:'Playfair Display',serif;font-style:italic;font-size:1.15rem;color:rgba(167,139,250,.6);margin-top:.7rem}
        .q-div{display:flex;align-items:center;gap:2rem;margin:2.5rem 0;opacity:.25}
        .q-div::before,.q-div::after{content:'';flex:1;height:1px;background:linear-gradient(to right,transparent,var(--vl))}
        .q-div::after{background:linear-gradient(to left,transparent,var(--vl))}
        .q-div span{color:var(--vl);font-size:.5rem}
        .q-obs{border:1px solid rgba(167,139,250,.12);padding:1.8rem;background:rgba(124,58,237,.03);margin-bottom:1.8rem}
        .q-oh{display:flex;align-items:center;gap:.8rem;margin-bottom:1.2rem}
        .q-live{width:5px;height:5px;border-radius:50%;background:#dc2626;animation:lb 2.5s ease infinite}
        @keyframes lb{0%,100%{opacity:.2}50%{opacity:1;box-shadow:0 0 6px #dc2626}}
        .q-olabel{font-weight:100;font-size:.55rem;letter-spacing:.4em;text-transform:uppercase;color:rgba(147,197,253,.3)}
        #q-mc{width:100%;height:110px;display:block}
        .q-act{font-family:'Libre Baskerville',serif;font-style:italic;font-size:.8rem;color:var(--ash);opacity:.4;margin-top:1rem;transition:opacity .5s,transform .4s;min-height:1em}
        .q-act.swap{opacity:0;transform:translateY(5px)}
        .q-meta{display:flex;justify-content:space-between;align-items:center}
        .q-wat{font-weight:100;font-size:.6rem;letter-spacing:.25em;color:rgba(147,197,253,.3)}
        .q-leave{background:transparent;border:none;font-family:'Libre Baskerville',serif;font-style:italic;font-size:.75rem;color:rgba(167,139,250,.25);cursor:pointer;letter-spacing:.1em;transition:color .3s}
        .q-leave:hover{color:rgba(167,139,250,.7)}
        #s-active{padding:0;z-index:5}
        #canvas-main{position:absolute;inset:0;cursor:none}
        .hud{position:absolute;z-index:20;pointer-events:none}
        .hud.i{pointer-events:all}
        .h-timer{top:2rem;left:50%;transform:translateX(-50%);font-weight:100;font-size:1rem;letter-spacing:.5em;color:rgba(167,139,250,.4);transition:color .5s}
        .h-timer.warn{color:rgba(220,38,38,.6)}
        .h-timer.urgent{color:#dc2626;animation:up .8s ease infinite alternate}
        @keyframes up{from{opacity:.6}to{opacity:1}}
        .h-mood{top:2rem;left:2.5rem;font-family:'Libre Baskerville',serif;font-style:italic;font-size:.7rem;color:rgba(167,139,250,.22);letter-spacing:.15em}
        .h-spec{top:2rem;right:2.5rem;font-weight:100;font-size:.6rem;letter-spacing:.3em;color:rgba(147,197,253,.15)}
        .h-prev{top:5.5rem;left:50%;transform:translateX(-50%);max-width:400px;text-align:center;font-family:'Libre Baskerville',serif;font-style:italic;font-size:.9rem;color:rgba(167,139,250,.35);line-height:1.9;transition:opacity 2s}
        .toolbar{bottom:2.5rem;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:.2rem;background:rgba(5,3,15,.75);border:1px solid rgba(167,139,250,.12);padding:.4rem;backdrop-filter:blur(10px)}
        .tbtn{font-weight:300;font-size:.55rem;letter-spacing:.3em;text-transform:uppercase;color:rgba(160,144,200,.35);background:transparent;border:none;cursor:pointer;padding:.6rem 1.2rem;transition:all .3s;position:relative}
        .tbtn::after{content:'';position:absolute;bottom:3px;left:50%;transform:translateX(-50%);width:0;height:1px;background:var(--vl);transition:width .3s}
        .tbtn:hover{color:rgba(167,139,250,.7)}
        .tbtn.on{color:var(--vl)}
        .tbtn.on::after{width:55%}
        .tsep{width:1px;height:20px;background:rgba(167,139,250,.1)}
        .pal{bottom:6rem;left:50%;transform:translateX(-50%);display:flex;gap:.4rem;align-items:center}
        .psw{width:13px;height:13px;border-radius:50%;cursor:pointer;border:1px solid transparent;transition:transform .25s,border-color .25s}
        .psw.on{transform:scale(1.5);border-color:rgba(232,224,245,.6)}
        .bctl{bottom:9.2rem;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:.8rem;font-weight:100;font-size:.55rem;letter-spacing:.2em;color:rgba(160,144,200,.2)}
        .bctl input[type=range]{-webkit-appearance:none;width:70px;height:1px;background:rgba(167,139,250,.25);outline:none;cursor:pointer}
        .bctl input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:8px;height:8px;border-radius:50%;background:rgba(167,139,250,.7);cursor:pointer}
        .txov{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:25;background:transparent;border:none;outline:none;color:rgba(232,224,245,.85);font-family:'Playfair Display',serif;font-style:italic;font-size:1.4rem;text-align:center;min-width:260px;caret-color:var(--vl);letter-spacing:.05em}
        .txov::placeholder{color:rgba(160,144,200,.2)}
        #s-fare{text-align:center;max-width:440px}
        .fw-ey{font-weight:100;font-size:.55rem;letter-spacing:.6em;text-transform:uppercase;color:rgba(167,139,250,.3);margin-bottom:2.5rem}
        .fw-t{font-family:'Playfair Display',serif;font-style:italic;font-weight:400;font-size:2.8rem;line-height:1.1;margin-bottom:2rem;background:linear-gradient(135deg,var(--bl),var(--vl),var(--rl));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .fw-b{font-family:'Libre Baskerville',serif;font-style:italic;font-size:.85rem;color:var(--ash);opacity:.45;line-height:2;margin-bottom:2.5rem}
        .fw-prev{border-left:2px solid rgba(124,58,237,.3);padding:.5rem 0 .5rem 1.5rem;text-align:left;margin-bottom:2rem;background:rgba(124,58,237,.04)}
        .fw-pt{font-family:'Libre Baskerville',serif;font-style:italic;font-size:.85rem;color:rgba(167,139,250,.55);line-height:1.8}
        .fw-pf{font-weight:100;font-size:.55rem;letter-spacing:.3em;color:rgba(167,139,250,.25);margin-top:.4rem;text-transform:uppercase}
        .fw-in{background:transparent;border:none;border-bottom:1px solid rgba(167,139,250,.2);color:var(--paper);font-family:'Playfair Display',serif;font-style:italic;font-size:1rem;text-align:center;padding:.6rem;width:100%;outline:none;letter-spacing:.04em;margin-bottom:2.5rem;transition:border-color .3s}
        .fw-in:focus{border-color:rgba(167,139,250,.5)}
        .fw-in::placeholder{color:rgba(160,144,200,.2)}
        .fw-btn{font-weight:300;font-size:.65rem;letter-spacing:.5em;text-transform:uppercase;color:var(--vl);background:transparent;border:1px solid rgba(124,58,237,.25);padding:1rem 3rem;cursor:pointer;transition:all .4s;display:block;width:100%;margin-bottom:1rem}
        .fw-btn:hover{border-color:rgba(124,58,237,.55);background:rgba(124,58,237,.06)}
        .fw-sk{background:transparent;border:none;font-family:'Libre Baskerville',serif;font-style:italic;font-size:.75rem;color:rgba(160,144,200,.2);cursor:pointer;transition:color .3s}
        .fw-sk:hover{color:rgba(160,144,200,.4)}
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=Lato:wght@100;300&family=Libre+Baskerville:ital,wght@0,400;1,400&display=swap" rel="stylesheet" />

      <canvas id="bg-canvas" />
      <div id="grain" />
      <div id="vig" />
      <div id="cur" />
      <div id="cur-ring" />
      <div id="cur-trail" />

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

      <div className="screen off" id="s-queue">
        <div className="q-top">
          <p className="q-ey">ta position dans la file</p>
          <p className="q-num" id="q-num">—</p>
          <p className="q-nlabel">sur la liste de l&apos;attente</p>
          <p className="q-wait" id="q-wait">—</p>
        </div>
        <div className="q-div"><span>◈</span></div>
        <div className="q-obs">
          <div className="q-oh">
            <span className="q-live" />
            <span className="q-olabel">ce que fait la personne active</span>
          </div>
          <canvas id="q-mc" />
          <p className="q-act" id="q-act">elle trace quelque chose dans le noir.</p>
        </div>
        <div className="q-meta">
          <p className="q-wat"><span id="q-w">0</span> observateurs silencieux</p>
          <button className="q-leave" id="q-leave" type="button">partir</button>
        </div>
      </div>

      <div className="screen off" id="s-active">
        <canvas id="canvas-main" />
        <div className="hud h-mood" id="h-mood">contemplation</div>
        <div className="hud h-timer" id="h-timer">5·00</div>
        <div className="hud h-spec" id="h-spec">0 observent</div>
        <div className="hud h-prev" id="h-prev" style={{opacity:0}} />
        <div className="hud i bctl" id="bctl" style={{display:'none'}}>
          <span>·</span>
          <input type="range" id="bsz" min="1" max="24" defaultValue="3" />
          <span>●</span>
        </div>
        <div className="hud i pal" id="pal" style={{display:'none'}} />
        <div className="hud i toolbar">
          <button className="tbtn on" id="t-draw" type="button">dessiner</button>
          <div className="tsep" />
          <button className="tbtn" id="t-write" type="button">ecrire</button>
          <div className="tsep" />
          <button className="tbtn" id="t-erase" type="button">effacer</button>
        </div>
        <input type="text" className="txov" id="txov" placeholder="murmure..." maxLength={80} style={{display:'none'}} />
      </div>

      <div className="screen off" id="s-fare">
        <p className="fw-ey">fin de session</p>
        <h2 className="fw-t">ton temps s&apos;acheve.</h2>
        <p className="fw-b">laisse quelque chose pour l&apos;inconnu qui vient.<br />un mot. une image. une question sans reponse.</p>
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
