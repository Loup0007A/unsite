'use client'

// Le composant principal d'Unsite.
// Tout le code HTML/CSS/JS est self-contained dans ce fichier
// pour simplifier le déploiement.

export default function Home() {
  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}
        :root{
          --ink:#0d0b09;--paper:#f5f0e8;--gold:#b8974a;--gold-pale:#e8d8a0;
          --gold-deep:#8b6f2e;--ash:#c8bfb0;--shadow:#4a3f30;
          --void:#080604;--dusk:#1a1510;--fog:#2a2218;
        }
        html,body{height:100%;background:var(--void);overflow:hidden;cursor:none}
        #cursor{position:fixed;width:6px;height:6px;border-radius:50%;background:var(--gold);pointer-events:none;z-index:9999;transform:translate(-50%,-50%);transition:width .2s,height .2s;mix-blend-mode:screen}
        #cursor-ring{position:fixed;width:28px;height:28px;border-radius:50%;border:1px solid rgba(184,151,74,.3);pointer-events:none;z-index:9998;transform:translate(-50%,-50%);transition:all .12s ease}
        #grain{position:fixed;inset:0;pointer-events:none;z-index:9997;opacity:.06;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:250px;animation:grainshift 8s steps(10) infinite}
        @keyframes grainshift{0%,100%{background-position:0 0}25%{background-position:50px -30px}50%{background-position:-20px 60px}75%{background-position:80px 20px}}
        #vig{position:fixed;inset:0;background:radial-gradient(ellipse 80% 80% at 50% 50%,transparent 30%,rgba(0,0,0,.85) 100%);pointer-events:none;z-index:9996}
        #aureole{position:fixed;left:50%;top:50%;width:600px;height:400px;transform:translate(-50%,-50%);background:radial-gradient(ellipse,rgba(184,151,74,.04) 0%,transparent 70%);pointer-events:none;z-index:0;animation:breathe 8s ease infinite}
        @keyframes breathe{0%,100%{opacity:.5;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}}
        .mote{position:fixed;border-radius:50%;pointer-events:none;animation:moterise linear infinite}
        @keyframes moterise{from{transform:translateY(110vh) translateX(0);opacity:0}5%{opacity:.8}90%{opacity:.2}to{transform:translateY(-10vh) translateX(var(--mx));opacity:0}}
        .screen{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2.5rem;transition:opacity 1.2s cubic-bezier(.4,0,.2,1),transform 1.2s cubic-bezier(.4,0,.2,1);z-index:10}
        .screen.off{opacity:0;pointer-events:none;transform:scale(.98)}
        #s-land{gap:0;text-align:center}
        .land-eyebrow{font-family:'Lato',sans-serif;font-weight:100;font-size:.6rem;letter-spacing:.6em;text-transform:uppercase;color:rgba(184,151,74,.5);margin-bottom:4rem;animation:arrive 2s ease both}
        .land-wordmark{font-family:'Playfair Display',serif;font-weight:400;font-style:italic;font-size:clamp(4rem,12vw,9rem);color:var(--paper);line-height:.9;letter-spacing:-.03em;animation:arrive 2s ease both .4s;position:relative}
        .land-wordmark sup{font-size:.18em;vertical-align:super;letter-spacing:.3em;color:var(--gold);font-style:normal;font-weight:300;font-family:'Lato',sans-serif}
        .land-rule{width:1px;height:60px;background:linear-gradient(to bottom,transparent,rgba(184,151,74,.4),transparent);margin:3.5rem auto;animation:arrive 2s ease both .7s}
        .land-verse{font-family:'Libre Baskerville',serif;font-style:italic;font-size:clamp(.8rem,1.8vw,.95rem);color:var(--ash);letter-spacing:.04em;line-height:2;max-width:340px;animation:arrive 2s ease both 1s}
        .land-cta-wrap{margin-top:3rem;display:flex;flex-direction:column;align-items:center;gap:1.5rem;animation:arrive 2s ease both 1.4s}
        .land-cta{font-family:'Lato',sans-serif;font-weight:300;font-size:.7rem;letter-spacing:.55em;text-transform:uppercase;color:var(--gold);background:transparent;border:none;cursor:none;padding:1.2rem 3.5rem;position:relative;transition:color .4s,letter-spacing .4s}
        .land-cta::before{content:'';position:absolute;inset:0;border:1px solid rgba(184,151,74,.25);transition:border-color .4s,transform .4s}
        .land-cta::after{content:'';position:absolute;inset:4px;border:1px solid rgba(184,151,74,.08);transition:border-color .4s}
        .land-cta:hover{color:var(--paper);letter-spacing:.6em}
        .land-cta:hover::before{border-color:rgba(184,151,74,.6);transform:scale(1.02)}
        .land-count{font-family:'Lato',sans-serif;font-weight:100;font-size:.6rem;letter-spacing:.3em;color:rgba(184,151,74,.35)}
        .land-count em{font-style:normal;color:rgba(184,151,74,.55)}
        @keyframes arrive{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        #s-queue{gap:0;max-width:560px;width:100%}
        .q-top{text-align:center;margin-bottom:3rem}
        .q-eyebrow{font-family:'Lato',sans-serif;font-weight:100;font-size:.55rem;letter-spacing:.6em;text-transform:uppercase;color:rgba(184,151,74,.4);margin-bottom:1.5rem}
        .q-number{font-family:'Playfair Display',serif;font-style:italic;font-size:6.5rem;color:var(--gold);line-height:1;font-weight:400}
        .q-number-label{font-family:'Libre Baskerville',serif;font-style:italic;font-size:.8rem;color:var(--ash);opacity:.5;margin-top:.3rem;letter-spacing:.15em}
        .q-wait{font-family:'Playfair Display',serif;font-style:italic;font-size:1.2rem;color:rgba(184,151,74,.6);margin-top:.8rem}
        .q-divider{display:flex;align-items:center;gap:2rem;margin:2.5rem 0;opacity:.3}
        .q-divider::before,.q-divider::after{content:'';flex:1;height:1px;background:var(--gold)}
        .q-divider span{color:var(--gold);font-size:.5rem;letter-spacing:.3em}
        .q-observer{border:1px solid rgba(184,151,74,.1);padding:2rem;position:relative;background:rgba(184,151,74,.02);margin-bottom:2rem}
        .q-obs-header{display:flex;align-items:center;gap:.8rem;margin-bottom:1.2rem}
        .q-live{width:5px;height:5px;border-radius:50%;background:#8b2020;animation:liveblink 2.5s ease infinite}
        @keyframes liveblink{0%,100%{opacity:.2}50%{opacity:1}}
        .q-obs-label{font-family:'Lato',sans-serif;font-weight:100;font-size:.55rem;letter-spacing:.4em;text-transform:uppercase;color:rgba(184,151,74,.3)}
        #q-mini-canvas{width:100%;height:110px;display:block;opacity:.8}
        .q-action{font-family:'Libre Baskerville',serif;font-style:italic;font-size:.8rem;color:var(--ash);opacity:.4;margin-top:1rem;transition:opacity .5s,transform .5s;min-height:1em}
        .q-action.swap{opacity:0;transform:translateY(4px)}
        .q-meta{display:flex;justify-content:space-between;align-items:center}
        .q-watchers{font-family:'Lato',sans-serif;font-weight:100;font-size:.6rem;letter-spacing:.25em;color:rgba(184,151,74,.3)}
        .q-leave{background:transparent;border:none;font-family:'Libre Baskerville',serif;font-style:italic;font-size:.75rem;color:rgba(200,191,176,.2);cursor:none;letter-spacing:.1em;transition:color .3s}
        .q-leave:hover{color:rgba(200,191,176,.5)}
        #s-active{padding:0;z-index:5}
        #canvas-main{position:absolute;inset:0;cursor:none}
        .hud-el{position:absolute;z-index:20;pointer-events:none}
        .hud-el.interactive{pointer-events:all}
        .hud-timer{top:2.2rem;left:50%;transform:translateX(-50%);font-family:'Lato',sans-serif;font-weight:100;font-size:1rem;letter-spacing:.5em;color:rgba(184,151,74,.4);transition:color .5s}
        .hud-timer.warn{color:rgba(139,50,32,.7)}
        .hud-timer.urgent{color:#8b3220;animation:urgentpulse .8s ease infinite alternate}
        @keyframes urgentpulse{from{opacity:.6}to{opacity:1}}
        .hud-mood{top:2.2rem;left:2.5rem;font-family:'Libre Baskerville',serif;font-style:italic;font-size:.7rem;color:rgba(184,151,74,.25);letter-spacing:.15em;transition:color 3s}
        .hud-spec{top:2.2rem;right:2.5rem;font-family:'Lato',sans-serif;font-weight:100;font-size:.6rem;letter-spacing:.3em;color:rgba(200,191,176,.15)}
        .hud-prev{top:5.5rem;left:50%;transform:translateX(-50%);max-width:400px;text-align:center;font-family:'Libre Baskerville',serif;font-style:italic;font-size:.9rem;color:rgba(184,151,74,.35);line-height:1.9;transition:opacity 2s;pointer-events:none}
        .toolbar{bottom:2.5rem;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:.2rem;background:rgba(8,6,4,.7);border:1px solid rgba(184,151,74,.1);padding:.4rem;backdrop-filter:blur(8px)}
        .t-btn{font-family:'Lato',sans-serif;font-weight:300;font-size:.55rem;letter-spacing:.3em;text-transform:uppercase;color:rgba(200,191,176,.35);background:transparent;border:none;cursor:none;padding:.6rem 1.2rem;transition:all .3s;position:relative}
        .t-btn::after{content:'';position:absolute;bottom:3px;left:50%;transform:translateX(-50%);width:0;height:1px;background:var(--gold);transition:width .3s}
        .t-btn:hover{color:rgba(200,191,176,.7)}
        .t-btn.on{color:var(--gold)}
        .t-btn.on::after{width:60%}
        .t-sep{width:1px;height:20px;background:rgba(184,151,74,.1)}
        .palette{bottom:6rem;left:50%;transform:translateX(-50%);display:flex;gap:.4rem;align-items:center}
        .p-swatch{width:12px;height:12px;border-radius:50%;cursor:none;border:1px solid transparent;transition:transform .25s,border-color .25s}
        .p-swatch.on{transform:scale(1.5);border-color:rgba(245,240,232,.5)}
        .brush-ctrl{bottom:9.2rem;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:.8rem;font-family:'Lato',sans-serif;font-weight:100;font-size:.55rem;letter-spacing:.2em;color:rgba(200,191,176,.2)}
        .brush-ctrl input[type=range]{-webkit-appearance:none;width:70px;height:1px;background:rgba(184,151,74,.25);outline:none;cursor:none}
        .brush-ctrl input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:8px;height:8px;border-radius:50%;background:rgba(184,151,74,.6);cursor:none}
        .text-overlay{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:25;background:transparent;border:none;outline:none;color:rgba(245,240,232,.85);font-family:'Playfair Display',serif;font-style:italic;font-size:1.4rem;text-align:center;min-width:250px;caret-color:var(--gold);letter-spacing:.05em}
        .text-overlay::placeholder{color:rgba(200,191,176,.2)}
        #s-farewell{gap:0;text-align:center;max-width:460px}
        .fw-eyebrow{font-family:'Lato',sans-serif;font-weight:100;font-size:.55rem;letter-spacing:.6em;text-transform:uppercase;color:rgba(184,151,74,.3);margin-bottom:2.5rem}
        .fw-title{font-family:'Playfair Display',serif;font-style:italic;font-weight:400;font-size:2.8rem;color:var(--paper);line-height:1.1;margin-bottom:2rem}
        .fw-body{font-family:'Libre Baskerville',serif;font-style:italic;font-size:.85rem;color:var(--ash);opacity:.5;line-height:2;margin-bottom:2.5rem}
        .fw-prev{border-left:1px solid rgba(184,151,74,.2);padding:.5rem 0 .5rem 1.5rem;text-align:left;margin-bottom:2rem}
        .fw-prev-text{font-family:'Libre Baskerville',serif;font-style:italic;font-size:.85rem;color:rgba(184,151,74,.5);line-height:1.8}
        .fw-prev-from{font-family:'Lato',sans-serif;font-weight:100;font-size:.55rem;letter-spacing:.3em;color:rgba(184,151,74,.2);margin-top:.4rem;text-transform:uppercase}
        .fw-input{background:transparent;border:none;border-bottom:1px solid rgba(184,151,74,.2);color:var(--paper);font-family:'Playfair Display',serif;font-style:italic;font-size:1rem;text-align:center;padding:.6rem;width:100%;outline:none;letter-spacing:.04em;margin-bottom:2.5rem;transition:border-color .3s}
        .fw-input:focus{border-color:rgba(184,151,74,.5)}
        .fw-input::placeholder{color:rgba(200,191,176,.2)}
        .fw-btn{font-family:'Lato',sans-serif;font-weight:300;font-size:.65rem;letter-spacing:.5em;text-transform:uppercase;color:var(--gold);background:transparent;border:1px solid rgba(184,151,74,.2);padding:1rem 3rem;cursor:none;transition:all .4s;display:block;width:100%;margin-bottom:1rem}
        .fw-btn:hover{border-color:rgba(184,151,74,.5);background:rgba(184,151,74,.04)}
        .fw-skip{background:transparent;border:none;font-family:'Libre Baskerville',serif;font-style:italic;font-size:.75rem;color:rgba(200,191,176,.15);cursor:none;transition:color .3s}
        .fw-skip:hover{color:rgba(200,191,176,.35)}
        @keyframes veil{from{opacity:0}to{opacity:1}}
        .fadein{animation:veil 1.5s ease both}
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lato:wght@100;300&display=swap" rel="stylesheet" />

      <div id="grain" />
      <div id="vig" />
      <div id="aureole" />
      <div id="cursor" />
      <div id="cursor-ring" />

      {/* LANDING */}
      <div className="screen fadein" id="s-land">
        <p className="land-eyebrow">un sanctuaire numérique · une âme à la fois</p>
        <h1 className="land-wordmark">unsite<sup>°</sup></h1>
        <div className="land-rule" />
        <p className="land-verse">
          quelqu&apos;un est ici en ce moment.<br />
          une seule personne peut entrer.<br />
          tout le monde laisse quelque chose.
        </p>
        <div className="land-cta-wrap">
          <button className="land-cta" id="enter-btn">entrer dans le silence</button>
          <p className="land-count"><em id="land-n">—</em> âmes attendent</p>
        </div>
      </div>

      {/* QUEUE */}
      <div className="screen off" id="s-queue">
        <div className="q-top">
          <p className="q-eyebrow">ta position dans la file</p>
          <p className="q-number" id="q-num">—</p>
          <p className="q-number-label">sur la liste de l&apos;attente</p>
          <p className="q-wait" id="q-wait">—</p>
        </div>
        <div className="q-divider"><span>◈</span></div>
        <div className="q-observer">
          <div className="q-obs-header">
            <span className="q-live" />
            <span className="q-obs-label">ce que fait la personne active</span>
          </div>
          <canvas id="q-mini-canvas" />
          <p className="q-action" id="q-action">elle trace quelque chose dans l&apos;obscurité.</p>
        </div>
        <div className="q-meta">
          <p className="q-watchers"><span id="q-watchers">0</span> observateurs silencieux</p>
          <button className="q-leave" id="q-leave">partir ↩</button>
        </div>
      </div>

      {/* ACTIVE */}
      <div className="screen off" id="s-active">
        <canvas id="canvas-main" />
        <div className="hud-el hud-mood" id="hud-mood">contemplation</div>
        <div className="hud-el hud-timer" id="hud-timer">5·00</div>
        <div className="hud-el hud-spec" id="hud-spec">0 observent</div>
        <div className="hud-el hud-prev" id="hud-prev" style={{opacity:0}} />
        <div className="hud-el brush-ctrl interactive" id="brush-ctrl" style={{display:'none'}}>
          <span>·</span>
          <input type="range" id="brush-sz" min="1" max="24" defaultValue="3" />
          <span>●</span>
        </div>
        <div className="hud-el palette interactive" id="palette" style={{display:'none'}} />
        <div className="hud-el toolbar interactive">
          <button className="t-btn on" id="t-draw">dessiner</button>
          <div className="t-sep" />
          <button className="t-btn" id="t-write">écrire</button>
          <div className="t-sep" />
          <button className="t-btn" id="t-erase">effacer</button>
        </div>
        <input type="text" className="text-overlay" id="txt-in" placeholder="murmure…" maxLength={80} style={{display:'none'}} />
      </div>

      {/* FAREWELL */}
      <div className="screen off" id="s-farewell">
        <p className="fw-eyebrow">fin de session</p>
        <h2 className="fw-title">ton temps s&apos;achève.</h2>
        <p className="fw-body">laisse quelque chose pour l&apos;inconnu qui vient.<br />un mot. une image. une question sans réponse.</p>
        <div className="fw-prev" id="fw-prev" style={{display:'none'}}>
          <p className="fw-prev-text" id="fw-prev-text" />
          <p className="fw-prev-from">— du visiteur précédent</p>
        </div>
        <input type="text" className="fw-input" id="fw-msg" placeholder="ton message pour l'étranger suivant…" maxLength={120} />
        <button className="fw-btn" id="fw-submit">laisser ce message</button>
        <button className="fw-skip" id="fw-skip">partir en silence</button>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        // ── Cursor
        const cur=document.getElementById('cursor'),curR=document.getElementById('cursor-ring')
        let mx=window.innerWidth/2,my=window.innerHeight/2,rx=mx,ry=my
        document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cur.style.left=mx+'px';cur.style.top=my+'px'})
        function animCursor(){rx+=(mx-rx)*.12;ry+=(my-ry)*.12;curR.style.left=Math.round(rx)+'px';curR.style.top=Math.round(ry)+'px';requestAnimationFrame(animCursor)}
        animCursor()
        // ── Motes
        for(let i=0;i<14;i++){const m=document.createElement('div');m.className='mote';const sz=Math.random()*1.5+.5,dur=25+Math.random()*35;m.style.cssText=\`width:\${sz}px;height:\${sz}px;left:\${Math.random()*100}vw;background:rgba(184,151,74,\${Math.random()*.25+.05});--mx:\${(Math.random()-.5)*160}px;animation-duration:\${dur}s;animation-delay:\${-Math.random()*dur}s\`;document.body.appendChild(m)}
        // ── State
        const SK='unsite_v4',TK='unsite_tk_v4'
        let myToken=null,mySessionToken=null,timerTick=null,pollTick=null
        let activeTool='draw',activeColor='#c4a882',brushSz=3,canvasEl=null,ctx2d=null,drawing2=false,lx=0,ly=0
        function mkToken(){const b=new Uint8Array(20);crypto.getRandomValues(b);return[...b].map(x=>x.toString(16).padStart(2,'0')).join('')}
        function myTok(){let t=sessionStorage.getItem(TK);if(!t){t=mkToken();sessionStorage.setItem(TK,t)}return t}
        async function load(){try{const r=await window.storage.get(SK,true);if(r?.value)return JSON.parse(r.value)}catch{}return null}
        async function save(partial){const cur=await load()||{sessionOwner:null,expiry:0,queue:[],messages:[],moodVal:.5,snap:null};try{await window.storage.set(SK,JSON.stringify({...cur,...partial}),true)}catch{}}
        function isOwner(){return myToken&&myToken===mySessionToken}
        async function claimSession(tok){const g=await load()||{};const now=Date.now();if(g.sessionOwner&&now<(g.expiry||0))return false;const q=(g.queue||[]).filter(t=>t!==tok);await save({sessionOwner:tok,expiry:now+300000,queue:q,totalVisits:(g.totalVisits||0)+1});return true}
        async function joinQ(tok){const g=await load()||{queue:[]};const q=g.queue||[];if(!q.includes(tok)){q.push(tok);await save({queue:q})}}
        async function leaveQ(tok){const g=await load()||{queue:[]};await save({queue:(g.queue||[]).filter(t=>t!==tok)})}
        async function endSession(tok,msg){const g=await load()||{};if(g.sessionOwner!==tok)return;const msgs=g.messages||[];if(msg?.trim()){msgs.push({t:msg.trim(),ts:Date.now()});if(msgs.length>30)msgs.splice(0,msgs.length-30)}const mv=calcMood(msgs);await save({sessionOwner:null,expiry:0,messages:msgs,moodVal:mv})}
        async function saveSnap(d){await save({snap:d})}
        function calcMood(msgs){const warm=['merci','amour','beau','doux','lumière','paix','joie','espoir'],dark=['seul','triste','peur','vide','nuit','perdu','silence','froid'];let v=.5;msgs.slice(-6).forEach(m=>{const t=m.t.toLowerCase();warm.forEach(w=>{if(t.includes(w))v=Math.min(1,v+.07)});dark.forEach(w=>{if(t.includes(w))v=Math.max(.05,v-.05)})});return v}
        function go(id){document.querySelectorAll('.screen').forEach(s=>s.classList.add('off'));const el=document.getElementById('s-'+id);el.classList.remove('off');el.classList.add('fadein')}
        function applyMood(v){const moods=['mélancolie','solitude','contemplation','sérénité','lumière'];const idx=Math.min(4,Math.floor(v*5));const mEl=document.getElementById('hud-mood');if(mEl)mEl.textContent=moods[idx]}
        async function refreshCount(){const g=await load()||{};const n=(g.queue||[]).length;document.getElementById('land-n').textContent=n||'—'}
        refreshCount();setInterval(refreshCount,8000)
        document.getElementById('enter-btn').onclick=enterApp
        async function enterApp(){myToken=myTok();const g=await load()||{};const now=Date.now();if(g.sessionOwner===myToken&&now<(g.expiry||0)){mySessionToken=myToken;go('active');setupCanvas();await restoreSnap();startTimer(g.expiry);applyMood(g.moodVal||.5);showPrevMsg(g);return}if(!g.sessionOwner||now>=(g.expiry||0)){const ok=await claimSession(myToken);if(ok){const g2=await load()||{};mySessionToken=myToken;go('active');setupCanvas();await restoreSnap();startTimer(g2.expiry);applyMood(g2.moodVal||.5);showPrevMsg(g2);return}}await joinQ(myToken);go('queue');const g2=await load()||{};applyMood(g2.moodVal||.5);startQueuePoll()}
        function showPrevMsg(g){const msgs=g.messages||[];if(!msgs.length)return;const last=msgs[msgs.length-1];const el=document.getElementById('hud-prev');if(el){el.innerHTML=\`<em>"\${last.t}"</em>\`;el.style.opacity='.7';setTimeout(()=>{if(el)el.style.opacity='0'},14000)}}
        const qActions=['elle trace des cercles dans l\'obscurité.','il écrit quelque chose, puis hésite.','elle contemple le vide lumineux.','il dessine une ligne très longue.','elle laisse une empreinte dorée.','il murmure des choses au canvas.','elle dessine une constellation lente.','il efface tout, recommence.'];let qActionIdx=0
        function startQueuePoll(){pollTick=setInterval(async()=>{const g=await load()||{};const queue=g.queue||[];const pos=queue.indexOf(myToken);const now=Date.now();if(!g.sessionOwner||now>=(g.expiry||0)){const ok=await claimSession(myToken);if(ok){clearInterval(pollTick);const g2=await load()||{};mySessionToken=myToken;go('active');setupCanvas();await restoreSnap();startTimer(g2.expiry);applyMood(g2.moodVal||.5);showPrevMsg(g2);return}}const rem=Math.max(0,Math.floor(((g.expiry||0)-now)/1000));const myPos=pos<0?1:pos+1;const waitMin=Math.ceil((rem+(myPos-1)*300)/60);document.getElementById('q-num').textContent=myPos;document.getElementById('q-wait').textContent=waitMin<=1?"moins d'une minute":\`environ \${waitMin} minute\${waitMin>1?'s':''}\`;document.getElementById('q-watchers').textContent=Math.max(0,queue.length+Math.floor(Math.random()*2));const aEl=document.getElementById('q-action');if(aEl){aEl.classList.add('swap');setTimeout(()=>{qActionIdx=(qActionIdx+1)%qActions.length;aEl.textContent=qActions[qActionIdx];aEl.classList.remove('swap')},400)}drawMiniCanvas(g)},3500)}
        function drawMiniCanvas(g){const mc=document.getElementById('q-mini-canvas');if(!mc)return;const mctx=mc.getContext('2d');mc.width=mc.offsetWidth||500;mc.height=110;mctx.clearRect(0,0,mc.width,mc.height);if(g.snap){const img=new Image();img.onload=()=>mctx.drawImage(img,0,0,mc.width,mc.height);img.src=g.snap}else{mctx.strokeStyle='rgba(184,151,74,.15)';mctx.lineWidth=.8;for(let i=0;i<4;i++){mctx.beginPath();const x1=Math.random()*mc.width,y1=Math.random()*mc.height;mctx.moveTo(x1,y1);mctx.bezierCurveTo(Math.random()*mc.width,Math.random()*mc.height,Math.random()*mc.width,Math.random()*mc.height,Math.random()*mc.width,mc.height/2);mctx.stroke()}}}
        document.getElementById('q-leave').onclick=async()=>{clearInterval(pollTick);await leaveQ(myToken);go('land');refreshCount()}
        function setupCanvas(){canvasEl=document.getElementById('canvas-main');ctx2d=canvasEl.getContext('2d');sizeCanvas();window.addEventListener('resize',sizeCanvas);canvasEl.addEventListener('mousedown',sd);canvasEl.addEventListener('mousemove',md);canvasEl.addEventListener('mouseup',eu);canvasEl.addEventListener('mouseleave',eu);canvasEl.addEventListener('touchstart',e=>{e.preventDefault();sd(e.touches[0])},{passive:false});canvasEl.addEventListener('touchmove',e=>{e.preventDefault();md(e.touches[0])},{passive:false});canvasEl.addEventListener('touchend',e=>{e.preventDefault();eu()},{passive:false});setupPalette()}
        function sizeCanvas(){if(!canvasEl)return;const snap=canvasEl.width>0?ctx2d.getImageData(0,0,canvasEl.width,canvasEl.height):null;canvasEl.width=window.innerWidth;canvasEl.height=window.innerHeight;if(snap)ctx2d.putImageData(snap,0,0)}
        async function restoreSnap(){const g=await load()||{};if(g.snap){const img=new Image();img.onload=()=>{if(ctx2d)ctx2d.drawImage(img,0,0,canvasEl.width,canvasEl.height)};img.src=g.snap}}
        function pos(e){const r=canvasEl.getBoundingClientRect();return{x:(e.clientX||e.pageX)-r.left,y:(e.clientY||e.pageY)-r.top}}
        function sd(e){if(!isOwner()||activeTool==='write')return;drawing2=true;const p=pos(e);lx=p.x;ly=p.y}
        function md(e){if(!drawing2||!isOwner()||activeTool==='write')return;const p=pos(e);ctx2d.lineWidth=brushSz;ctx2d.lineCap='round';ctx2d.lineJoin='round';if(activeTool==='erase'){ctx2d.globalCompositeOperation='destination-out';ctx2d.strokeStyle='rgba(0,0,0,1)'}else{ctx2d.globalCompositeOperation='source-over';ctx2d.strokeStyle=activeColor}ctx2d.beginPath();ctx2d.moveTo(lx,ly);ctx2d.lineTo(p.x,p.y);ctx2d.stroke();lx=p.x;ly=p.y;clearTimeout(md._t);md._t=setTimeout(()=>saveSnap(canvasEl.toDataURL('image/webp',.45)),1800)}
        function eu(){drawing2=false}
        const SWATCHES=['#c4a882','#e8d5b7','#8b9db8','#7a8b7a','#b87a7a','#9b8ab5','#d4b860','#f5f0e8','#2a2010']
        function setupPalette(){const pal=document.getElementById('palette');if(!pal)return;pal.innerHTML='';SWATCHES.forEach(c=>{const s=document.createElement('div');s.className='p-swatch'+(c===activeColor?' on':'');s.style.background=c;s.onclick=()=>{activeColor=c;setTool('draw');document.querySelectorAll('.p-swatch').forEach(x=>x.classList.remove('on'));s.classList.add('on')};pal.appendChild(s)})}
        function setTool(t){activeTool=t;document.querySelectorAll('.t-btn').forEach(b=>b.classList.remove('on'));document.getElementById('t-'+t)?.classList.add('on');const ti=document.getElementById('txt-in'),pal=document.getElementById('palette'),bc=document.getElementById('brush-ctrl');ti.style.display=t==='write'?'block':'none';pal&&(pal.style.display=t==='draw'?'flex':'none');bc&&(bc.style.display=(t==='draw'||t==='erase')?'flex':'none');if(t==='write'){ti.focus();ti.onkeydown=we}}
        function we(e){if(e.key==='Enter'&&document.getElementById('txt-in').value.trim()){const v=document.getElementById('txt-in').value.trim();ctx2d.globalCompositeOperation='source-over';ctx2d.font=\`italic \${Math.max(16,brushSz*4+12)}px 'Playfair Display',serif\`;ctx2d.fillStyle=activeColor;ctx2d.textAlign='center';ctx2d.fillText(v,canvasEl.width/2,canvasEl.height/2);document.getElementById('txt-in').value='';setTool('draw');clearTimeout(md._t);md._t=setTimeout(()=>saveSnap(canvasEl.toDataURL('image/webp',.45)),600)}if(e.key==='Escape'){document.getElementById('txt-in').value='';setTool('draw')}}
        document.getElementById('t-draw').onclick=()=>setTool('draw')
        document.getElementById('t-write').onclick=()=>setTool('write')
        document.getElementById('t-erase').onclick=()=>setTool('erase')
        document.getElementById('brush-sz').oninput=e=>brushSz=+e.target.value
        function startTimer(expiry){timerTick=setInterval(()=>{const rem=Math.max(0,Math.floor((expiry-Date.now())/1000));const m=Math.floor(rem/60),s=rem%60;const el=document.getElementById('hud-timer');if(el){el.textContent=\`\${m}·\${s.toString().padStart(2,'0')}\`;el.className='hud-el hud-timer'+(rem<120?' warn':'')+(rem<30?' urgent':'')}if(rem<=0){clearInterval(timerTick);goFarewell()}},500)}
        async function goFarewell(){go('farewell');const g=await load()||{};const msgs=g.messages||[];if(msgs.length){const last=msgs[msgs.length-1];document.getElementById('fw-prev-text').textContent=\`"\${last.t}"\`;document.getElementById('fw-prev').style.display='block'}}
        async function doFarewell(msg){await endSession(myToken,msg);sessionStorage.removeItem(TK);myToken=null;mySessionToken=null;go('land');refreshCount()}
        document.getElementById('fw-submit').onclick=()=>{const v=document.getElementById('fw-msg').value;doFarewell(v)}
        document.getElementById('fw-skip').onclick=()=>doFarewell('')
        ;(function(){if(window.top!==window.self){document.body.innerHTML='';return}window.addEventListener('beforeunload',async()=>{if(isOwner())await endSession(myToken,'');else if(myToken)await leaveQ(myToken)})})()
      `}} />
    </>
  )
}
