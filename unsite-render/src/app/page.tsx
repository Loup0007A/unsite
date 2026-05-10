'use client'

export default function Home() {
  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}
        :root{
          --void:#05030f;--paper:#e8e0f5;--ash:#a090c8;
          --vl:#a78bfa;--bl:#93c5fd;--rl:#fca5a5;
        }
        html,body{height:100%;background:var(--void);overflow:hidden;cursor:none;font-family:'Lato',sans-serif}
        #cur{position:fixed;width:8px;height:8px;border-radius:50%;background:var(--vl);pointer-events:none;z-index:9999;transform:translate(-50%,-50%);mix-blend-mode:screen;transition:width .15s,height .15s}
        #cur-ring{position:fixed;width:32px;height:32px;border-radius:50%;border:1.5px solid rgba(167,139,250,.4);pointer-events:none;z-index:9998;transform:translate(-50%,-50%);transition:all .1s ease}
        #cur-trail{position:fixed;width:3px;height:3px;border-radius:50%;background:rgba(196,132,252,.5);pointer-events:none;z-index:9997;transform:translate(-50%,-50%);transition:all .25s ease}
        #bg-canvas{position:fixed;inset:0;z-index:0;pointer-events:none}
        #grain{position:fixed;inset:0;pointer-events:none;z-index:9995;opacity:.045;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:250px;animation:gs 8s steps(10) infinite}
        @keyframes gs{0%,100%{background-position:0 0}25%{background-position:50px -30px}50%{background-position:-20px 60px}75%{background-position:80px 20px}}
        #vig{position:fixed;inset:0;background:radial-gradient(ellipse 75% 75% at 50% 50%,transparent 25%,rgba(5,3,15,.92) 100%);pointer-events:none;z-index:1}
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
        .l-cta{font-family:'Lato',sans-serif;font-weight:300;font-size:.7rem;letter-spacing:.55em;text-transform:uppercase;color:var(--vl);background:transparent;border:none;padding:1.1rem 3.5rem;position:relative;cursor:pointer;z-index:100;transition:color .4s,letter-spacing .4s}
        .l-cta::before{content:'';position:absolute;inset:0;border:1px solid rgba(167,139,250,.3);transition:border-color .4s,transform .4s;pointer-events:none}
        .l-cta::after{content:'';position:absolute;inset:5px;border:1px solid rgba(167,139,250,.1);transition:border-color .4s;pointer-events:none}
        .l-cta:hover{letter-spacing:.62em}
        .l-cta:hover::before{border-color:rgba(167,139,250,.7);transform:scale(1.025)}
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
        .q-leave{background:transparent;border:none;font-family:'Libre Baskerville',serif;font-style:italic;font-size:.75rem;color:rgba(167,139,250,.2);cursor:pointer;letter-spacing:.1em;transition:color .3s}
        .q-leave:hover{color:rgba(167,139,250,.6)}
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
        <p className="l-eyebrow">un sanctuaire numérique · une âme à la fois</p>
        <h1 className="l-title">unsite°</h1>
        <div className="l-rule" />
        <p className="l-verse">
          quelqu&apos;un est ici en ce moment.<br />
          une seule personne peut entrer.<br />
          tout le monde laisse quelque chose.
        </p>
        <div className="l-cta-wrap">
          <button className="l-cta" id="enter-btn" type="button">entrer dans le silence</button>
          <p className="l-count"><em id="land-n">—</em> âmes attendent</p>
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
          <p className="q-act" id="q-act">elle trace quelque chose dans l&apos;obscurité.</p>
        </div>
        <div className="q-meta">
          <p className="q-wat"><span id="q-w">0</span> observateurs silencieux</p>
          <button className="q-leave" id="q-leave" type="button">partir ↩</button>
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
          <button className="tbtn" id="t-write" type="button">écrire</button>
          <div className="tsep" />
          <button className="tbtn" id="t-erase" type="button">effacer</button>
        </div>
        <input type="text" className="txov" id="txov" placeholder="murmure…" maxLength={80} style={{display:'none'}} />
      </div>

      <div className="screen off" id="s-fare">
        <p className="fw-ey">fin de session</p>
        <h2 className="fw-t">ton temps s&apos;achève.</h2>
        <p className="fw-b">laisse quelque chose pour l&apos;inconnu qui vient.<br />un mot. une image. une question sans réponse.</p>
        <div className="fw-prev" id="fw-prev" style={{display:'none'}}>
          <p className="fw-pt" id="fw-pt" />
          <p className="fw-pf">— du visiteur précédent</p>
        </div>
        <input type="text" className="fw-in" id="fw-in" placeholder="ton message pour l'étranger suivant…" maxLength={120} />
        <button className="fw-btn" id="fw-sub" type="button">laisser ce message</button>
        <button className="fw-sk" id="fw-sk" type="button">partir en silence</button>
      </div>

      <script dangerouslySetInnerHTML={{__html:`
(function(){
var CUR=document.getElementById('cur'),CURR=document.getElementById('cur-ring'),CURT=document.getElementById('cur-trail');
var mx=window.innerWidth/2,my=window.innerHeight/2,rx=mx,ry=my,tx=mx,ty=my;
document.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;CUR.style.left=mx+'px';CUR.style.top=my+'px';});
(function a(){rx+=(mx-rx)*.1;ry+=(my-ry)*.1;tx+=(mx-tx)*.06;ty+=(my-ty)*.06;CURR.style.left=Math.round(rx)+'px';CURR.style.top=Math.round(ry)+'px';CURT.style.left=Math.round(tx)+'px';CURT.style.top=Math.round(ty)+'px';requestAnimationFrame(a);})();
document.addEventListener('mousedown',function(){CUR.style.width='14px';CUR.style.height='14px';});
document.addEventListener('mouseup',function(){CUR.style.width='8px';CUR.style.height='8px';});

var bgC=document.getElementById('bg-canvas');
var gl=bgC.getContext('webgl')||bgC.getContext('experimental-webgl');
if(gl){
  function rsz(){bgC.width=window.innerWidth;bgC.height=window.innerHeight;gl.viewport(0,0,bgC.width,bgC.height);}
  window.addEventListener('resize',rsz);rsz();
  var vs='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var fs='precision mediump float;uniform float t;uniform vec2 res;vec3 pal(float x){return mix(mix(vec3(.15,.08,.55),vec3(.05,.15,.65),smoothstep(0.,.5,x)),mix(vec3(.05,.15,.65),vec3(.5,.05,.18),smoothstep(.5,1.,x)),step(.5,x));}float blob(vec2 uv,vec2 c,float r){return smoothstep(r,r*.3,length(uv-c));}void main(){vec2 uv=(gl_FragCoord.xy/res)*2.-1.;uv.x*=res.x/res.y;float tt=t*.0004;vec3 col=vec3(.02,.01,.08);col+=pal(0.)*blob(uv,vec2(sin(tt*.7)*.6,cos(tt*.5)*.5),.85)*.18;col+=pal(.25)*blob(uv,vec2(cos(tt*.9+1.2)*.7,sin(tt*.6+.8)*.6),.7)*.14;col+=pal(.5)*blob(uv,vec2(sin(tt*1.1+2.1)*.5,cos(tt*.8+1.5)*.7),.6)*.12;col+=pal(.75)*blob(uv,vec2(cos(tt*.7+3.)*.6,sin(tt*1.2+.4)*.5),.75)*.1;col+=pal(1.)*blob(uv,vec2(sin(tt*.6+1.8)*.55,cos(tt*.9+2.2)*.55),.65)*.09;col=clamp(col,0.,1.);gl_FragColor=vec4(col,1.);}';
  function sh(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s;}
  var prog=gl.createProgram();gl.attachShader(prog,sh(gl.VERTEX_SHADER,vs));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(prog);gl.useProgram(prog);
  var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  var loc=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  var tU=gl.getUniformLocation(prog,'t'),rU=gl.getUniformLocation(prog,'res');
  (function fr(ts){gl.uniform1f(tU,ts);gl.uniform2f(rU,bgC.width,bgC.height);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);requestAnimationFrame(fr);})(0);
}

var MCOLS=['rgba(167,139,250,','rgba(147,197,253,','rgba(252,165,165,','rgba(196,132,252,','rgba(99,102,241,'];
for(var i=0;i<16;i++){var m=document.createElement('div');m.className='mote';var sz=Math.random()*2+.8,dur=22+Math.random()*32,col=MCOLS[Math.floor(Math.random()*MCOLS.length)];m.style.cssText='width:'+sz+'px;height:'+sz+'px;left:'+(Math.random()*100)+'vw;background:'+col+(Math.random()*.5+.1)+');--mx:'+((Math.random()-.5)*180)+'px;animation-duration:'+dur+'s;animation-delay:'+(-Math.random()*dur)+'s';document.body.appendChild(m);}

var SK='unsite_v5',TK='unsite_tk_v5';
var myTk=null,mySess=null,timerI=null,pollI=null;
var tool='draw',color='#a78bfa',bsz=3,cv=null,cx=null,dr=false,lx_=0,ly_=0;

function mkT(){var b=new Uint8Array(20);crypto.getRandomValues(b);return Array.from(b,function(x){return x.toString(16).padStart(2,'0');}).join('');}
function getTk(){var t=sessionStorage.getItem(TK);if(!t){t=mkT();sessionStorage.setItem(TK,t);}return t;}

async function load(){try{var r=await window.storage.get(SK,true);if(r&&r.value)return JSON.parse(r.value);}catch(e){}return null;}
async function save(p){var c=await load()||{sessionOwner:null,expiry:0,queue:[],messages:[],moodVal:.5,snap:null};try{await window.storage.set(SK,JSON.stringify(Object.assign({},c,p)),true);}catch(e){}}

function isOwner(){return myTk&&myTk===mySess;}

async function claim(tok){var g=await load()||{};var now=Date.now();if(g.sessionOwner&&now<(g.expiry||0))return false;var q=(g.queue||[]).filter(function(t){return t!==tok;});await save({sessionOwner:tok,expiry:now+300000,queue:q,totalVisits:(g.totalVisits||0)+1});return true;}
async function joinQ(tok){var g=await load()||{queue:[]};var q=g.queue||[];if(!q.includes(tok)){q.push(tok);await save({queue:q});}}
async function leaveQ(tok){var g=await load()||{queue:[]};await save({queue:(g.queue||[]).filter(function(t){return t!==tok;})});}
async function endSess(tok,msg){var g=await load()||{};if(g.sessionOwner!==tok)return;var msgs=g.messages||[];if(msg&&msg.trim()){msgs.push({t:msg.trim(),ts:Date.now()});if(msgs.length>30)msgs.splice(0,msgs.length-30);}await save({sessionOwner:null,expiry:0,messages:msgs,moodVal:calcMood(msgs)});}
async function saveSnap(d){await save({snap:d});}

function calcMood(msgs){var warm=['merci','amour','beau','doux','paix','joie'],dark=['seul','triste','peur','vide','nuit','perdu'];var v=.5;msgs.slice(-6).forEach(function(m){var t=m.t.toLowerCase();warm.forEach(function(w){if(t.includes(w))v=Math.min(1,v+.07);});dark.forEach(function(w){if(t.includes(w))v=Math.max(.05,v-.05);});});return v;}

function go(id){document.querySelectorAll('.screen').forEach(function(s){s.classList.add('off');});var el=document.getElementById('s-'+id);el.classList.remove('off');el.classList.add('fadein');}
function applyMood(v){var moods=['mélancolie','solitude','contemplation','sérénité','lumière'];document.getElementById('h-mood').textContent=moods[Math.min(4,Math.floor(v*5))];}

async function refreshN(){var g=await load()||{};var n=(g.queue||[]).length;document.getElementById('land-n').textContent=n||'—';}
refreshN();setInterval(refreshN,8000);

document.getElementById('enter-btn').addEventListener('click',async function(e){
  e.preventDefault();
  myTk=getTk();
  var g=await load()||{};var now=Date.now();
  if(g.sessionOwner===myTk&&now<(g.expiry||0)){mySess=myTk;go('active');setupCV();restoreSnap();startTimer(g.expiry);applyMood(g.moodVal||.5);showPrev(g);return;}
  if(!g.sessionOwner||now>=(g.expiry||0)){var ok=await claim(myTk);if(ok){var g2=await load()||{};mySess=myTk;go('active');setupCV();restoreSnap();startTimer(g2.expiry);applyMood(g2.moodVal||.5);showPrev(g2);return;}}
  await joinQ(myTk);go('queue');var g3=await load()||{};applyMood(g3.moodVal||.5);startPoll();
});

function showPrev(g){var msgs=g.messages||[];if(!msgs.length)return;var last=msgs[msgs.length-1];var el=document.getElementById('h-prev');if(el){el.innerHTML='\u201c'+last.t+'\u201d';el.style.opacity='.7';setTimeout(function(){if(el)el.style.opacity='0';},14000);}}

var QA=['elle trace des cercles dans l\'obscurité.','il écrit quelque chose, puis hésite.','elle contemple le vide violet.','il dessine une ligne très longue.','elle laisse une empreinte lumineuse.','il murmure des choses au canvas.','elle peint une constellation bleue.','il efface tout et recommence.'];
var qAI=0;

function startPoll(){
  pollI=setInterval(async function(){
    var g=await load()||{};var queue=g.queue||[];var pos=queue.indexOf(myTk);var now=Date.now();
    if(!g.sessionOwner||now>=(g.expiry||0)){var ok=await claim(myTk);if(ok){clearInterval(pollI);var g2=await load()||{};mySess=myTk;go('active');setupCV();restoreSnap();startTimer(g2.expiry);applyMood(g2.moodVal||.5);showPrev(g2);return;}}
    var rem=Math.max(0,Math.floor(((g.expiry||0)-now)/1000));var myP=pos<0?1:pos+1;var wm=Math.ceil((rem+(myP-1)*300)/60);
    document.getElementById('q-num').textContent=myP;
    document.getElementById('q-wait').textContent=wm<=1?"moins d'une minute":"environ "+wm+" minute"+(wm>1?'s':'');
    document.getElementById('q-w').textContent=Math.max(0,queue.length+Math.floor(Math.random()*2));
    var aEl=document.getElementById('q-act');if(aEl){aEl.classList.add('swap');setTimeout(function(){qAI=(qAI+1)%QA.length;aEl.textContent=QA[qAI];aEl.classList.remove('swap');},400);}
    drawMini(g);
  },3500);
}

function drawMini(g){var mc=document.getElementById('q-mc');if(!mc)return;var mctx=mc.getContext('2d');mc.width=mc.offsetWidth||480;mc.height=110;mctx.clearRect(0,0,mc.width,mc.height);if(g.snap){var img=new Image();img.onload=function(){mctx.drawImage(img,0,0,mc.width,mc.height);};img.src=g.snap;}else{mctx.strokeStyle='rgba(167,139,250,.15)';mctx.lineWidth=.8;for(var j=0;j<4;j++){mctx.beginPath();mctx.moveTo(Math.random()*mc.width,Math.random()*mc.height);mctx.bezierCurveTo(Math.random()*mc.width,Math.random()*mc.height,Math.random()*mc.width,Math.random()*mc.height,Math.random()*mc.width,mc.height/2);mctx.stroke();}}}

document.getElementById('q-leave').addEventListener('click',async function(){clearInterval(pollI);await leaveQ(myTk);go('land');refreshN();});

var SWATCHES=['#a78bfa','#93c5fd','#fca5a5','#c084fc','#818cf8','#f9a8d4','#67e8f9','#e8e0f5','#1e1040'];

function setupCV(){cv=document.getElementById('canvas-main');cx=cv.getContext('2d');szCV();window.addEventListener('resize',szCV);cv.addEventListener('mousedown',sd);cv.addEventListener('mousemove',md);cv.addEventListener('mouseup',eu);cv.addEventListener('mouseleave',eu);cv.addEventListener('touchstart',function(e){e.preventDefault();sd(e.touches[0]);},{passive:false});cv.addEventListener('touchmove',function(e){e.preventDefault();md(e.touches[0]);},{passive:false});cv.addEventListener('touchend',function(e){e.preventDefault();eu();},{passive:false});setupPal();}
function szCV(){if(!cv)return;var snap=cv.width>0?cx.getImageData(0,0,cv.width,cv.height):null;cv.width=window.innerWidth;cv.height=window.innerHeight;if(snap)cx.putImageData(snap,0,0);}
async function restoreSnap(){var g=await load()||{};if(g.snap){var img=new Image();img.onload=function(){if(cx)cx.drawImage(img,0,0,cv.width,cv.height);};img.src=g.snap;}}
function gpos(e){var r=cv.getBoundingClientRect();return{x:(e.clientX||e.pageX)-r.left,y:(e.clientY||e.pageY)-r.top};}
function sd(e){if(!isOwner()||tool==='write')return;dr=true;var p=gpos(e);lx_=p.x;ly_=p.y;}
function md(e){if(!dr||!isOwner()||tool==='write')return;var p=gpos(e);cx.lineWidth=bsz;cx.lineCap='round';cx.lineJoin='round';if(tool==='erase'){cx.globalCompositeOperation='destination-out';cx.strokeStyle='rgba(0,0,0,1)';}else{cx.globalCompositeOperation='source-over';cx.strokeStyle=color;}cx.beginPath();cx.moveTo(lx_,ly_);cx.lineTo(p.x,p.y);cx.stroke();lx_=p.x;ly_=p.y;clearTimeout(md._t);md._t=setTimeout(function(){saveSnap(cv.toDataURL('image/webp',.45));},1800);}
function eu(){dr=false;}

function setupPal(){var pal=document.getElementById('pal');if(!pal)return;pal.innerHTML='';SWATCHES.forEach(function(c){var s=document.createElement('div');s.className='psw'+(c===color?' on':'');s.style.background=c;s.addEventListener('click',function(){color=c;setTool('draw');document.querySelectorAll('.psw').forEach(function(x){x.classList.remove('on');});s.classList.add('on');});pal.appendChild(s);});}

function setTool(t){tool=t;document.querySelectorAll('.tbtn').forEach(function(b){b.classList.remove('on');});var tb=document.getElementById('t-'+t);if(tb)tb.classList.add('on');var ti=document.getElementById('txov'),pal=document.getElementById('pal'),bc=document.getElementById('bctl');ti.style.display=t==='write'?'block':'none';if(pal)pal.style.display=t==='draw'?'flex':'none';if(bc)bc.style.display=(t==='draw'||t==='erase')?'flex':'none';if(t==='write'){ti.focus();ti.onkeydown=we;}}

function we(e){var ti=document.getElementById('txov');if(e.key==='Enter'&&ti.value.trim()){var v=ti.value.trim();cx.globalCompositeOperation='source-over';cx.font='italic '+(Math.max(16,bsz*4+12))+'px Playfair Display,serif';cx.fillStyle=color;cx.textAlign='center';cx.fillText(v,cv.width/2,cv.height/2);ti.value='';setTool('draw');clearTimeout(md._t);md._t=setTimeout(function(){saveSnap(cv.toDataURL('image/webp',.45));},600);}if(e.key==='Escape'){ti.value='';setTool('draw');}}

document.getElementById('t-draw').addEventListener('click',function(){setTool('draw');});
document.getElementById('t-write').addEventListener('click',function(){setTool('write');});
document.getElementById('t-erase').addEventListener('click',function(){setTool('erase');});
document.getElementById('bsz').addEventListener('input',function(e){bsz=+e.target.value;});

function startTimer(expiry){timerI=setInterval(function(){var rem=Math.max(0,Math.floor((expiry-Date.now())/1000));var mm=Math.floor(rem/60),ss=rem%60;var el=document.getElementById('h-timer');if(el){el.textContent=mm+'\u00b7'+String(ss).padStart(2,'0');el.className='hud h-timer'+(rem<120?' warn':'')+(rem<30?' urgent':'');}if(rem<=0){clearInterval(timerI);goFare();}},500);}

async function goFare(){go('fare');var g=await load()||{};var msgs=g.messages||[];if(msgs.length){var last=msgs[msgs.length-1];document.getElementById('fw-pt').textContent='\u201c'+last.t+'\u201d';document.getElementById('fw-prev').style.display='block';}}
async function doFare(msg){await endSess(myTk,msg);sessionStorage.removeItem(TK);myTk=null;mySess=null;go('land');refreshN();}

document.getElementById('fw-sub').addEventListener('click',function(){doFare(document.getElementById('fw-in').value);});
document.getElementById('fw-sk').addEventListener('click',function(){doFare('');});

if(window.top!==window.self){document.body.innerHTML='';}
window.addEventListener('beforeunload',async function(){if(isOwner())await endSess(myTk,'');else if(myTk)await leaveQ(myTk);});
})();
      `}} />
    </>
  )
}
