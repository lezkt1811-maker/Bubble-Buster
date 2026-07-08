/* ============================= CONFIG ============================= */
const MODES = ["Scientific","Psychological","Business","Historical","Creative","Philosophical","Symbolic","Writing","Marketing","Education","Relationships","Spiritual"];
const modeSelect = document.getElementById('modeSelect');
MODES.forEach(m=>{const o=document.createElement('option'); o.value=m; o.textContent=m+' Mode'; modeSelect.appendChild(o);});
modeSelect.value = "Philosophical";

const LS_HISTORY = 'bbl_history_v1';
const LS_APIKEY = 'bbl_apikey_v1';

/* ============================= BACKGROUND NEURAL FIELD ============================= */
const bgCanvas = document.getElementById('bg');
const bctx = bgCanvas.getContext('2d');
let W,H, nodes=[];
function resizeBg(){ W=bgCanvas.width=window.innerWidth; H=bgCanvas.height=window.innerHeight; }
resizeBg(); window.addEventListener('resize', resizeBg);
const NODE_COUNT = window.innerWidth < 640 ? 34 : 60;
for(let i=0;i<NODE_COUNT;i++){
  nodes.push({x:Math.random()*W, y:Math.random()*H, vx:(Math.random()-0.5)*0.25, vy:(Math.random()-0.5)*0.25, r:Math.random()*1.6+0.6, hue: Math.random()});
}
const palette = ['#3b82f6','#ec4899','#22d3ee','#8b5cf6'];
let burstParticles = [];
function colorFor(h){ return palette[Math.floor(h*palette.length)%palette.length]; }
function animateBg(){
  bctx.clearRect(0,0,W,H);
  for(const n of nodes){
    n.x+=n.vx; n.y+=n.vy;
    if(n.x<0||n.x>W) n.vx*=-1;
    if(n.y<0||n.y>H) n.vy*=-1;
  }
  for(let i=0;i<nodes.length;i++){
    for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i], b=nodes[j];
      const d = Math.hypot(a.x-b.x, a.y-b.y);
      if(d<130){
        bctx.strokeStyle = `rgba(139,148,255,${(1-d/130)*0.13})`;
        bctx.lineWidth=1;
        bctx.beginPath(); bctx.moveTo(a.x,a.y); bctx.lineTo(b.x,b.y); bctx.stroke();
      }
    }
  }
  for(const n of nodes){
    bctx.beginPath();
    bctx.fillStyle = colorFor(n.hue);
    bctx.globalAlpha = 0.55;
    bctx.arc(n.x,n.y,n.r,0,Math.PI*2);
    bctx.fill();
    bctx.globalAlpha = 1;
  }
  burstParticles = burstParticles.filter(p=>p.life>0);
  for(const p of burstParticles){
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.015; p.life-=1;
    bctx.beginPath();
    bctx.fillStyle = p.color;
    bctx.globalAlpha = Math.max(p.life/p.maxLife,0);
    bctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    bctx.fill();
    bctx.globalAlpha=1;
  }
  requestAnimationFrame(animateBg);
}
animateBg();

function burstAt(x,y,count=36){
  for(let i=0;i<count;i++){
    const angle = Math.random()*Math.PI*2;
    const speed = Math.random()*3.5+1;
    burstParticles.push({
      x,y, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed,
      r:Math.random()*2.2+0.8, life:60+Math.random()*40, maxLife:100,
      color: colorFor(Math.random())
    });
  }
}

/* ============================= UI WIRING ============================= */
const input = document.getElementById('bubbleInput');
const charCount = document.getElementById('charCount');
input.addEventListener('input', ()=>{ charCount.textContent = input.value.length + ' characters'; });

const toast = document.getElementById('toast');
function showToast(msg){ toast.textContent = msg; toast.classList.add('show'); clearTimeout(showToast._t); showToast._t=setTimeout(()=>toast.classList.remove('show'), 2600); }

/* settings modal */
const settingsModal = document.getElementById('settingsModal');
const keyBadge = document.getElementById('keyBadge');
function refreshKeyBadge(){ keyBadge.style.display = localStorage.getItem(LS_APIKEY) ? 'block':'none'; }
document.getElementById('settingsBtn').onclick = ()=>{ document.getElementById('apiKeyInput').value = localStorage.getItem(LS_APIKEY)||''; settingsModal.classList.add('open'); };
settingsModal.addEventListener('click', e=>{ if(e.target===settingsModal) settingsModal.classList.remove('open'); });
document.getElementById('saveKeyBtn').onclick = ()=>{
  const v = document.getElementById('apiKeyInput').value.trim();
  if(v) localStorage.setItem(LS_APIKEY, v); else localStorage.removeItem(LS_APIKEY);
  refreshKeyBadge(); settingsModal.classList.remove('open'); showToast('Connection settings saved');
};
document.getElementById('clearKeyBtn').onclick = ()=>{ localStorage.removeItem(LS_APIKEY); document.getElementById('apiKeyInput').value=''; refreshKeyBadge(); showToast('API key cleared'); };
refreshKeyBadge();

/* history drawer */
const drawer = document.getElementById('drawer');
document.getElementById('historyBtn').onclick = ()=>{ drawer.classList.toggle('open'); renderHistory(); };
document.getElementById('histSearch').addEventListener('input', renderHistory);

function getHistory(){ try{ return JSON.parse(localStorage.getItem(LS_HISTORY))||[]; }catch(e){ return []; } }
function saveHistory(arr){ localStorage.setItem(LS_HISTORY, JSON.stringify(arr.slice(0,200))); }

function renderHistory(){
  const list = document.getElementById('histList');
  const q = document.getElementById('histSearch').value.toLowerCase();
  const hist = getHistory().filter(h=> h.text.toLowerCase().includes(q));
  list.innerHTML='';
  if(!hist.length){ list.innerHTML = '<div class="empty-hist">No bubbles broken yet.<br>Your history and Brain Galaxy will grow here.</div>'; return; }
  hist.forEach(h=>{
    const div = document.createElement('div');
    div.className='hist-item';
    div.innerHTML = `<div class="htext">${escapeHtml(h.text.slice(0,110))}${h.text.length>110?'…':''}</div>
      <div class="hmeta"><span>${h.mode} · ${new Date(h.ts).toLocaleDateString()}</span><span class="fav-star ${h.fav?'active':''}" data-id="${h.id}">★</span></div>`;
    div.querySelector('.htext').onclick = ()=>{ loadFromHistory(h.id); drawer.classList.remove('open'); };
    div.querySelector('.hmeta').onclick = (e)=>{ if(e.target.classList.contains('fav-star')){ toggleFav(h.id); } else { loadFromHistory(h.id); drawer.classList.remove('open'); } };
    list.appendChild(div);
  });
}
function toggleFav(id){ const hist=getHistory(); const item=hist.find(h=>h.id===id); if(item){item.fav=!item.fav; saveHistory(hist); renderHistory();} }
function loadFromHistory(id){ const item = getHistory().find(h=>h.id===id); if(item){ input.value=item.text; modeSelect.value=item.mode; renderResults(item.result, item.text); showMeter(item.result.bubble_density); }}

function escapeHtml(s){ return s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ============================= BUBBLE MAP ============================= */
const mapOverlay = document.getElementById('mapOverlay');
document.getElementById('mapBtn').onclick = ()=>{ mapOverlay.classList.add('open'); drawMap(); };
document.getElementById('closeMapBtn').onclick = ()=> mapOverlay.classList.remove('open');
const mapCanvas = document.getElementById('mapCanvas');
const mctx = mapCanvas.getContext('2d');
let mapNodes = [];
function drawMap(){
  mapCanvas.width = mapCanvas.clientWidth; mapCanvas.height = mapCanvas.clientHeight;
  const hist = getHistory();
  if(!hist.length){
    mctx.fillStyle='#5b6290'; mctx.font='14px "Space Grotesk"'; mctx.textAlign='center';
    mctx.fillText('Break a few bubbles first — your galaxy needs stars.', mapCanvas.width/2, mapCanvas.height/2);
    return;
  }
  const cx = mapCanvas.width/2, cy = mapCanvas.height/2;
  mapNodes = hist.slice(0,60).map((h,i)=>{
    const angle = (i/hist.length)*Math.PI*2;
    const radius = 90 + (i%5)*70 + Math.random()*30;
    return {h, x: cx+Math.cos(angle)*radius, y: cy+Math.sin(angle)*radius, vx:0, vy:0};
  });
  let frame=0;
  function tick(){
    frame++;
    mctx.clearRect(0,0,mapCanvas.width, mapCanvas.height);
    // connections: same mode
    for(let i=0;i<mapNodes.length;i++){
      for(let j=i+1;j<mapNodes.length;j++){
        if(mapNodes[i].h.mode === mapNodes[j].h.mode){
          mctx.strokeStyle='rgba(139,148,255,0.15)'; mctx.lineWidth=1;
          mctx.beginPath(); mctx.moveTo(mapNodes[i].x,mapNodes[i].y); mctx.lineTo(mapNodes[j].x,mapNodes[j].y); mctx.stroke();
        }
      }
    }
    mapNodes.forEach((n,i)=>{
      n.x += Math.sin(frame*0.008+i)*0.15;
      n.y += Math.cos(frame*0.008+i)*0.15;
      const density = n.h.result?.bubble_density||'Medium';
      const color = density==='High' ? '#ec4899' : density==='Low' ? '#22d3ee' : '#8b5cf6';
      mctx.beginPath();
      mctx.fillStyle = color;
      mctx.shadowColor = color; mctx.shadowBlur = 14;
      mctx.arc(n.x, n.y, n.h.fav ? 9:6, 0, Math.PI*2);
      mctx.fill();
      mctx.shadowBlur=0;
    });
    if(mapOverlay.classList.contains('open')) requestAnimationFrame(tick);
  }
  tick();
  mapCanvas.onclick = (e)=>{
    const rect = mapCanvas.getBoundingClientRect();
    const mx = e.clientX-rect.left, my = e.clientY-rect.top;
    let closest=null, cd=9999;
    mapNodes.forEach(n=>{ const d=Math.hypot(n.x-mx,n.y-my); if(d<cd){cd=d; closest=n;} });
    if(closest && cd<24){ loadFromHistory(closest.h.id); mapOverlay.classList.remove('open'); }
  };
}
window.addEventListener('resize', ()=>{ if(mapOverlay.classList.contains('open')) drawMap(); });

/* ============================= BUBBLE METER ============================= */
function showMeter(density){
  const row = document.getElementById('meterRow');
  const fill = document.getElementById('meterFill');
  const label = document.getElementById('meterLabel');
  row.style.display='flex';
  const pct = density==='High'?90:density==='Medium'?55:25;
  fill.style.width = pct+'%';
  label.textContent = (density||'—').toUpperCase();
  label.className = 'meter-label '+(density||'').toLowerCase();
}

/* ============================= AI CALL ============================= */
const SCHEMA_HINT = `Return ONLY valid JSON (no markdown fences, no preamble) matching exactly this shape:
{
 "bubble_density": "Low"|"Medium"|"High",
 "literal_meaning": "string",
 "hidden_assumptions": ["string", ...4-6 items],
 "missing_information": ["string", ...3-5 items],
 "alternative_perspectives": [{"viewpoint":"string","explanation":"string"}, ...4-5 items],
 "uno_reverse": "string (the reversed frame + why reversing it reveals a blind spot)",
 "bubble_break_language": "string (a curiosity-oriented rewrite of the original statement)",
 "word_explorer": [{"word":"string","sound_similarities":"string","letter_patterns":"string","prefix_suffix":"string","symbolic_take":"string"}, ...2-4 key words. Frame everything as creative wordplay, never as true etymology.],
 "symbol_network": [{"symbol":"string","meanings":"string (brief cross-cultural symbolic meanings)"}, ...2-4 symbols found or evoked by the text],
 "pattern_finder": ["string", ...3-5 observed patterns: opposites, cycles, paradoxes, numbers, themes],
 "questions": ["string", ...20 open, non-leading, perspective-expanding questions],
 "plain_english": "string (the whole idea restated in very simple language)",
 "creativity": {
   "analogies": ["string", ...5],
   "metaphors": ["string", ...5],
   "visual_concepts": ["string", ...5],
   "story_ideas": ["string", ...5],
   "tiktok_hooks": ["string", ...5],
   "book_titles": ["string", ...5],
   "philosophical_prompts": ["string", ...5]
 }
}
Keep list lengths close to what's specified (a few less is fine, never fabricate padding). All spiritual/symbolic content must be framed as interpretation, not fact.`;

async function callClaude(text, mode){
  const userKey = localStorage.getItem(LS_APIKEY);
  const systemPrompt = `You are the analysis engine inside "Bubble Breaker Lab," a tool that helps people see the hidden assumptions and alternative angles inside any belief, without telling them what to believe. Current lens: ${mode} Mode. Analyze the user's text through that lens where relevant, but still cover every field. Be sharp, concrete, and non-judgmental — never mock the original statement, never state that it is right or wrong. ${SCHEMA_HINT}`;
  const body = {
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role:"user", content: `Analyze this: ${JSON.stringify(text)}` }]
  };
  const headers = { "Content-Type":"application/json" };
  if(userKey){ headers["x-api-key"] = userKey; headers["anthropic-version"]="2023-06-01"; headers["anthropic-dangerous-direct-browser-access"]="true"; }
  const resp = await fetch("https://api.anthropic.com/v1/messages", { method:"POST", headers, body: JSON.stringify(body) });
  if(!resp.ok){ throw new Error("API error "+resp.status); }
  const data = await resp.json();
  const raw = (data.content||[]).map(b=>b.text||'').join('\n').trim();
  const clean = raw.replace(/^```json/i,'').replace(/^```/,'').replace(/```$/,'').trim();
  return JSON.parse(clean);
}

/* Fallback generator used only if no connection is available at all */
function localFallback(text, mode){
  const words = text.split(/\s+/).filter(Boolean).slice(0,4);
  return {
    bubble_density: text.length>140 ? "High" : text.length>60 ? "Medium" : "Low",
    literal_meaning: "On its surface, the statement asserts: \""+text+"\" — taken at face value, with no added context.",
    hidden_assumptions: [
      "That the terms used mean the same thing to everyone reading them.",
      "That the situation described is typical rather than an exception.",
      "That the claim holds across time, not just in this moment.",
      "That the speaker's frame of reference is the only reasonable one."
    ],
    missing_information: [
      "Who is saying this, and what shaped their view?",
      "What evidence, if any, sits behind the claim?",
      "What would the opposite case need to look like?"
    ],
    alternative_perspectives: [
      {viewpoint:"The skeptic", explanation:"Would ask what's being sold or protected by this framing."},
      {viewpoint:"The historian", explanation:"Would ask whether this has been said before, and how it aged."},
      {viewpoint:"The outsider", explanation:"Would ask what's invisible to someone raised inside this belief."}
    ],
    uno_reverse: "Reversed: consider the exact opposite of this claim — not because it's true, but because holding it briefly exposes what the original was quietly assuming.",
    bubble_break_language: "What conditions would need to be true for \""+text+"\" to hold — and where might it stop holding?",
    word_explorer: words.map(w=>({word:w.replace(/[^\w]/g,''), sound_similarities:"Playful, non-literal sound associations only.", letter_patterns:"Notice repeated letters or shapes within the word.", prefix_suffix:"Consider what a prefix/suffix swap would imply.", symbolic_take:"A creative, non-factual symbolic association — not an etymology."})),
    symbol_network: [{symbol:"Mirror", meanings:"Self-reflection, duality, and truth-facing across many cultural traditions (interpretive, not literal)."}],
    pattern_finder: ["A single certainty stated without a stated counter-case.", "An implied binary where a spectrum may exist."],
    questions: Array.from({length:20},(_,i)=>`Question ${i+1}: What would have to change for this statement to no longer feel true?`),
    plain_english: "In simple terms: this is one way of seeing things, built on a few unstated assumptions.",
    creativity: {
      analogies:["Like a single photo mistaken for the whole movie."],
      metaphors:["A lighthouse beam — bright, but only illuminating one angle."],
      visual_concepts:["A single spotlight in an otherwise dark room."],
      story_ideas:["A character who discovers the belief they inherited was never tested."],
      tiktok_hooks:["\"Everyone believes this... until you ask one question.\""],
      book_titles:["The Bubble We Didn't Know We Were In"],
      philosophical_prompts:["If certainty is comfortable, what is it protecting us from feeling?"]
    },
    _offline: true
  };
}

/* ============================= RENDER ============================= */
function iconFor(n){ return ["🔍","🧩","🕳️","🌐","🔄","💬","🔤","🕸️","🔁","❓","🗣️","💥"][n]||"🫧"; }

function renderResults(r, sourceText){
  burstAt(window.innerWidth/2, 340, 46);
  const el = document.getElementById('results');
  el.classList.add('active');
  const offlineNote = r._offline ? `<p style="color:#8b93c4;font-size:12px;text-align:center;margin-bottom:20px;">⚡ Running in offline demo mode — connect an API key in settings for full AI-generated depth.</p>` : '';

  const altHtml = (r.alternative_perspectives||[]).map(a=>`<li><b style="color:var(--magenta)">${escapeHtml(a.viewpoint)}:</b> ${escapeHtml(a.explanation)}</li>`).join('');
  const wordHtml = (r.word_explorer||[]).map(w=>`
    <div class="wordblock">
      <b>${escapeHtml(w.word)}</b>
      <p>Sound: ${escapeHtml(w.sound_similarities||'')}</p>
      <p>Letters: ${escapeHtml(w.letter_patterns||'')}</p>
      <p>Prefix/Suffix: ${escapeHtml(w.prefix_suffix||'')}</p>
      <p>Symbolic take: ${escapeHtml(w.symbolic_take||'')}</p>
    </div>`).join('');
  const symHtml = (r.symbol_network||[]).map(s=>`<p><b style="color:var(--cyan)">${escapeHtml(s.symbol)}:</b> ${escapeHtml(s.meanings)}</p>`).join('');
  const patternHtml = (r.pattern_finder||[]).map(p=>`<li>${escapeHtml(p)}</li>`).join('');
  const questionsHtml = (r.questions||[]).map((q,i)=>`<div class="qitem"><span>${String(i+1).padStart(2,'0')}</span>${escapeHtml(q)}</div>`).join('');

  const creativityCats = [
    ['Analogies','analogies'],['Metaphors','metaphors'],['Visual Concepts','visual_concepts'],
    ['Story Ideas','story_ideas'],['TikTok Hooks','tiktok_hooks'],['Book Titles','book_titles'],['Philosophical Prompts','philosophical_prompts']
  ];
  const creativityHtml = creativityCats.map(([label,key])=>{
    const items = (r.creativity && r.creativity[key]) || [];
    return `<div class="creativity-cat"><h4>${label}</h4><ol>${items.map(i=>`<li>${escapeHtml(i)}</li>`).join('')}</ol></div>`;
  }).join('');

  el.innerHTML = `
    ${offlineNote}
    <div class="section-title">Bubble Break Analysis</div>
    <div class="card-grid">
      <div class="bcard" style="--accent1:var(--cyan);--accent2:var(--blue)"><h3><span class="icon">${iconFor(0)}</span>Literal Meaning</h3><p>${escapeHtml(r.literal_meaning||'')}</p></div>
      <div class="bcard" style="--accent1:var(--violet);--accent2:var(--magenta)"><h3><span class="icon">${iconFor(1)}</span>Hidden Assumptions</h3><ul>${(r.hidden_assumptions||[]).map(a=>`<li>${escapeHtml(a)}</li>`).join('')}</ul>
        <button class="chain-btn" data-chain="${escapeHtml((r.hidden_assumptions||[])[0]||'')}">🔗 Break This Further</button></div>
      <div class="bcard" style="--accent1:var(--blue);--accent2:var(--cyan)"><h3><span class="icon">${iconFor(2)}</span>Missing Information</h3><ul>${(r.missing_information||[]).map(a=>`<li>${escapeHtml(a)}</li>`).join('')}</ul></div>
      <div class="bcard" style="--accent1:var(--magenta);--accent2:var(--violet)"><h3><span class="icon">${iconFor(3)}</span>Alternative Perspectives</h3><ul>${altHtml}</ul></div>
      <div class="bcard" style="--accent1:var(--cyan);--accent2:var(--magenta)"><h3><span class="icon">${iconFor(4)}</span>Uno Reverse</h3><p>${escapeHtml(r.uno_reverse||'')}</p>
        <button class="chain-btn" data-chain="${escapeHtml(r.uno_reverse||'')}">🔗 Break This Further</button></div>
      <div class="bcard" style="--accent1:var(--violet);--accent2:var(--blue)"><h3><span class="icon">${iconFor(5)}</span>Bubble Break Language</h3><p>${escapeHtml(r.bubble_break_language||'')}</p></div>
      <div class="bcard" style="--accent1:var(--blue);--accent2:var(--violet)"><h3><span class="icon">${iconFor(6)}</span>Word Explorer</h3>${wordHtml}<div class="disclaimer">Creative wordplay only — not literal etymology.</div></div>
      <div class="bcard" style="--accent1:var(--cyan);--accent2:var(--blue)"><h3><span class="icon">${iconFor(7)}</span>Symbol Network</h3>${symHtml}<div class="disclaimer">Cross-cultural interpretations, presented as lenses — not facts.</div></div>
      <div class="bcard" style="--accent1:var(--magenta);--accent2:var(--cyan)"><h3><span class="icon">${iconFor(8)}</span>Pattern Finder</h3><ul>${patternHtml}</ul></div>
      <div class="bcard" style="--accent1:var(--violet);--accent2:var(--magenta)"><h3><span class="icon">${iconFor(10)}</span>Plain English</h3><p>${escapeHtml(r.plain_english||'')}</p></div>
    </div>

    <div class="section-title">🌀 20 Bubble Break Questions</div>
    <div class="questions-grid">${questionsHtml}</div>

    <div class="section-title">✨ Creativity Explosion</div>
    <div class="bcard" style="--accent1:var(--magenta);--accent2:var(--cyan)"><div class="creativity-grid">${creativityHtml}</div></div>
  `;

  el.querySelectorAll('.chain-btn').forEach(btn=>{
    btn.onclick = ()=>{
      const chained = btn.getAttribute('data-chain');
      if(chained){ input.value = chained; window.scrollTo({top:0, behavior:'smooth'}); showToast('Loaded into input — break it again!'); }
    };
  });

  el.scrollIntoView({behavior:'smooth', block:'start'});
}

/* ============================= MAIN ACTION ============================= */
const breakBtn = document.getElementById('breakBtn');
const thinking = document.getElementById('thinking');
const thinkingText = document.getElementById('thinkingText');
const thinkingPhrases = ["Neurons connecting…","Cracking assumptions…","Mapping perspectives…","Forming constellations…","Untangling the frame…"];

breakBtn.addEventListener('click', async ()=>{
  const text = input.value.trim();
  if(!text){ showToast('Paste a belief, quote, or idea first.'); input.focus(); return; }
  breakBtn.disabled = true;
  document.getElementById('results').classList.remove('active');
  thinking.classList.add('active');
  let phraseIdx=0;
  const phraseTimer = setInterval(()=>{ phraseIdx=(phraseIdx+1)%thinkingPhrases.length; thinkingText.textContent = thinkingPhrases[phraseIdx]; }, 900);

  const mode = modeSelect.value;
  let result;
  try{
    result = await callClaude(text, mode);
  }catch(err){
    console.warn('AI call failed, using offline fallback:', err);
    result = localFallback(text, mode);
  }
  clearInterval(phraseTimer);
  thinking.classList.remove('active');
  breakBtn.disabled = false;

  showMeter(result.bubble_density);
  renderResults(result, text);

  const hist = getHistory();
  const entry = { id: 'b'+Date.now(), text, mode, ts: Date.now(), fav:false, result };
  hist.unshift(entry);
  saveHistory(hist);
});

input.addEventListener('keydown', (e)=>{
  if(e.key==='Enter' && (e.metaKey||e.ctrlKey)){ breakBtn.click(); }
});
