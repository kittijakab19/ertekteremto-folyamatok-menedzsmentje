(function(){
"use strict";
var BOOK = window.BOOK, SUMS = window.SUMS || {}, NOTES = window.NOTES, QS = window.QS, FIG = window.FIG, FIGCAP = window.FIGCAP || {};

var LEC = { e1:{name:"1. előadás", long:"Érték és porteri értéklánc I."}, e2:{name:"2. előadás", long:"Porteri értéklánc II. és értékhálózat"} };
var CH = { j1:"1. Érték", j2:"2. Értéklánc", j3:"3. Ellátási lánc", j4:"4. Számítások" };
var TOP = {
  t1:{name:"Érték fogalma, csoportosítása", ch:"j1"},
  t2:{name:"Vevői érték, megközelítései, mérése", ch:"j1"},
  t3:{name:"Üzleti modell és értékajánlat", ch:"j1"},
  t4:{name:"Elsődleges tevékenységek", ch:"j2"},
  t5:{name:"Támogató tevékenységek", ch:"j2"},
  t6:{name:"Értékhálózat, ellátási lánc", ch:"j3"},
  t7:{name:"Ellátásilánc-menedzsment", ch:"j3"},
  t8:{name:"Számolások", ch:"j4"}
};
var TOPS = ["t1","t2","t3","t4","t5","t6","t7"];
var KIND = { s:"egy helyes válasz", m:"több helyes válasz", g:"csoportosítás", f:"kitöltés", l:"felsorolás", c:"összetett", calc:"számolás" };
var LEAD = { s:"Válaszd ki a helyes választ", m:"Jelöld be az összes helyes választ", g:"Sorold be az elemeket (lehet kakukktojás is)", f:"Írd be a hiányzó kifejezéseket", l:"Sorold fel", c:"Olvasd el az esetet, és válaszolj", calc:"Számold ki — 2 tizedesjegyre elég" };

var LS = "etfm-zh.v1";
var store = { view:"book", ch:"j1", bookView:"full", lec:"e1", slide:{e1:0,e2:0}, onlyCore:false, topics:TOPS.slice(), calc:true, examMin:30,
  quizView:"start", exam:null, stats:{}, scroll:{}, calcType:"sup", calcStats:{sup:{ok:0,n:0},grav:{ok:0,n:0}}, calcHist:[], calcView:"task", histF:"all", prKind:"all", prLen:20 };
try{ var raw = localStorage.getItem(LS); if(raw){ var p = JSON.parse(raw); for(var k in p) store[k] = p[k]; } }catch(e){}
store.examMin = 30;
function save(){ try{ localStorage.setItem(LS, JSON.stringify(store)); }catch(e){} }

function esc(s){ return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function shuffle(a){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function range(n){ var r=[]; for(var i=0;i<n;i++) r.push(i); return r; }
function hash(s){ var h = 5381; for(var i=0;i<s.length;i++){ h = ((h<<5)+h + s.charCodeAt(i)) | 0; } return (h>>>0).toString(36); }
function rnd(a,b,step){ step = step||1; return a + step*Math.floor(Math.random()*(Math.floor((b-a)/step)+1)); }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function hu(x, d){ if(x == null || isNaN(x)) return "–"; d = d == null ? 2 : d; var r = Math.round(x*Math.pow(10,d))/Math.pow(10,d);
  var s = String(r).split("."), i = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, " "); return i + (s[1] ? "," + s[1] : ""); }
function pts(x){ return hu(x, 2); }
QS.forEach(function(q){ q.id = q.k + hash(q.q + "|" + JSON.stringify(q.o||q.b||q.it||q.acc||q.parts||"")); });
var QBY = {}; QS.forEach(function(q){ QBY[q.id] = q; });

var $main = document.getElementById("main"), $rail = document.getElementById("railPanel");
var zoom = document.getElementById("zoom");
zoom.onclick = function(){ zoom.hidden = true; };
function openZoom(src){ document.getElementById("zoomImg").src = src; zoom.hidden = false; }
function slideSrc(id){ return "slides/" + id + ".jpg"; }
function slideName(id){ var m = /^e(\d)-(\d+)$/.exec(id); return m ? m[1] + ". ea · " + (+m[2]) + ". dia" : id; }
function figHtml(name, B, data, extra){ return FIG[name] ? '<div class="dg">' + FIG[name](B || null, data, extra) + '</div>' : ""; }

/* ---------- nav ---------- */
function setView(v){ store.view = v; save(); render(); window.scrollTo(0,0); }
document.getElementById("nav").querySelectorAll("button").forEach(function(b){ b.onclick = function(){ setView(b.dataset.view); }; });
document.getElementById("themeBtn").onclick = function(){
  var r = document.documentElement, cur = r.getAttribute("data-theme");
  var dark = cur ? cur === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  r.setAttribute("data-theme", dark ? "light" : "dark");
};
function render(){
  document.getElementById("nav").querySelectorAll("button").forEach(function(b){ b.setAttribute("aria-current", String(b.dataset.view === store.view)); });
  document.getElementById("navL").textContent = (NOTES.e1.length + NOTES.e2.length) + " dia";
  document.getElementById("navQ").textContent = QS.length + " kérdés";
  window.onscroll = null; keyHandler = null; $rail.style.overflow = "";
  if(store.view === "book") renderBook();
  else if(store.view === "lecture") renderLecture();
  else if(store.view === "calc") renderCalc();
  else renderQuiz();
  ensureTimer();
}
function goSlide(id){
  var lec = id.slice(0,2), l = NOTES[lec], ix = -1;
  if(!l) return;
  l.forEach(function(s,i){ if(s.s === id) ix = i; });
  store.lec = lec; if(ix >= 0){ store.slide[lec] = ix; if(!l[ix].k) store.onlyCore = false; }
  setView("lecture");
}

/* ================= JEGYZET ================= */
var scrollTimer = null, pendingJump = null;
function renderBook(){
  var ch = BOOK.chapters.filter(function(c){ return c.id === store.ch; })[0] || BOOK.chapters[0];
  var ix = BOOK.chapters.indexOf(ch), SUM = SUMS[ch.id], isSum = store.bookView === "sum" && !!SUM;
  var body = isSum ? SUM : ch, skey = ch.id + (isSum ? "-sum" : "");
  var tabs = BOOK.chapters.map(function(c){
    return '<button class="chtab" data-src="'+c.id+'" data-ch="'+c.id+'" aria-pressed="'+(c.id===ch.id)+'"><i></i>'+esc(CH[c.id])+'</button>';
  }).join("");
  $main.innerHTML =
    '<div class="head"><div><span class="eyebrow">Kalló Noémi · BGE Folyamatmenedzsment Tanszék</span><h2>Jegyzet</h2>'+
    '<p>A két előadás anyaga témakörönként rendezve, magyarázatokkal és ábrákkal. A <span class="sl" style="cursor:default">dia</span> jelölésre kattintva a forrásdiára ugorsz. A „Kiegészítés” dobozok a diákon túli háttérinformációk.</p></div></div>'+
    '<div class="bookbar"><div class="chtabs">'+tabs+'</div>'+
      '<div class="seg viewseg" id="bookView"><button data-v="full" aria-pressed="'+(!isSum)+'">Teljes jegyzet</button>'+
      '<button data-v="sum" aria-pressed="'+isSum+'"'+(SUM ? "" : " disabled")+'>Összefoglaló</button></div></div>'+
    '<article class="reader'+(isSum ? " summary" : "")+'" data-src="'+ch.id+'"><div class="inner">'+
      '<h2 class="chtitle"><small>'+esc(CH[ch.id])+(isSum ? " · összefoglaló" : "")+'</small>'+esc(ch.title)+'</h2>'+
      (isSum ? '<p class="sumnote">Puskaszerű összefoglaló: fogalmak, felsorolások, párosítások. A magyarázatokért kapcsolj vissza a teljes jegyzetre.</p>' : "")+
      body.html+
    '</div></article>'+
    '<div class="chnav">'+
      (ix>0 ? '<button class="btn" data-go="'+BOOK.chapters[ix-1].id+'">← '+esc(CH[BOOK.chapters[ix-1].id])+'</button>' : '<span></span>')+
      (ch.id === "j4" ? '<button class="btn primary" id="toCalc">Számolás gyakorlása</button>' : '<button class="btn primary" id="toQuiz">Gyakorlás ebből a fejezetből</button>')+
      (ix<BOOK.chapters.length-1 ? '<button class="btn" data-go="'+BOOK.chapters[ix+1].id+'">'+esc(CH[BOOK.chapters[ix+1].id])+' →</button>' : '<span></span>')+
    '</div>';
  $main.querySelectorAll(".fig.drawn[data-fig]").forEach(function(d){
    d.innerHTML = figHtml(d.dataset.fig) + (FIGCAP[d.dataset.fig] ? '<p class="cap" style="margin:6px 0 0">'+esc(FIGCAP[d.dataset.fig])+'</p>' : "");
  });
  $main.querySelectorAll(".sl[data-s]").forEach(function(a){ a.textContent = slideName(a.dataset.s) + " ↗"; a.setAttribute("role","link"); a.tabIndex = 0;
    a.onclick = function(){ goSlide(a.dataset.s); }; a.onkeydown = function(e){ if(e.key === "Enter") goSlide(a.dataset.s); }; });
  $main.querySelectorAll("#bookView button").forEach(function(b){ b.onclick = function(){ if(b.disabled) return; store.bookView = b.dataset.v; save(); renderBook(); window.scrollTo(0,0); }; });
  $main.querySelectorAll("[data-ch],[data-go]").forEach(function(b){ b.onclick = function(){ store.ch = b.dataset.ch || b.dataset.go; save(); renderBook(); window.scrollTo(0,0); }; });
  var tq = document.getElementById("toQuiz");
  if(tq) tq.onclick = function(){ store.topics = TOPS.filter(function(t){ return TOP[t].ch === ch.id; }); store.calc = false; store.quizView = "start"; save(); setView("quiz"); };
  var tc = document.getElementById("toCalc"); if(tc) tc.onclick = function(){ setView("calc"); };
  $main.querySelectorAll(".fig img").forEach(function(im){ im.onclick = function(){ openZoom(im.src); }; });

  $rail.innerHTML = '<span class="lbl">'+(isSum ? "Összefoglaló" : "Tartalom")+' · '+esc(CH[ch.id])+'</span><div class="scroll"><ol class="toc">'+
    body.toc.map(function(t){ return '<li class="l'+t[0]+'"><button data-h="'+t[2]+'">'+esc(t[1])+'</button></li>'; }).join("")+'</ol></div>';
  $rail.querySelectorAll("[data-h]").forEach(function(b){ b.onclick = function(){ var el = document.getElementById(b.dataset.h); if(el) el.scrollIntoView({behavior:"smooth", block:"start"}); }; });
  var pos = store.scroll[skey];
  if(pendingJump){ var j = pendingJump; pendingJump = null; setTimeout(function(){ jumpTo(j); }, 30); }
  else if(pos) setTimeout(function(){ window.scrollTo(0, pos); }, 30);
  window.onscroll = function(){
    if(store.view !== "book") return;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function(){ store.scroll[skey] = window.scrollY; save(); highlightToc(body); }, 150);
  };
  highlightToc(body);
}
function highlightToc(ch){
  var best = null;
  ch.toc.forEach(function(t){ var el = document.getElementById(t[2]); if(el && el.getBoundingClientRect().top < 140) best = t[2]; });
  $rail.querySelectorAll("[data-h]").forEach(function(b){ b.classList.toggle("on", b.dataset.h === best); });
  var on = $rail.querySelector(".toc .on"), sc = $rail.querySelector(".scroll");
  if(on && sc){ var r = on.offsetTop - sc.offsetTop; if(r < sc.scrollTop || r > sc.scrollTop + sc.clientHeight - 30) sc.scrollTop = r - 60; }
}
function jumpTo(slide){
  var el = $main.querySelector('.sl[data-s="'+slide+'"]');
  if(!el) return;
  var tgt = el.closest("p,li,blockquote,td,aside,h3,h4") || el;
  tgt.scrollIntoView({block:"center"});
  tgt.style.transition = "background .6s"; tgt.style.background = "var(--accent-soft)";
  setTimeout(function(){ tgt.style.background = ""; }, 1800);
}
function goNotes(q){
  var ch = TOP[q.t] ? TOP[q.t].ch : "j1";
  store.ch = ch; store.bookView = "full"; pendingJump = q.sl || null; save(); setView("book");
}

/* ================= ELŐADÁS ================= */
var keyHandler = null;
function lecList(){ var l = NOTES[store.lec]; return store.onlyCore ? l.filter(function(s){ return s.k; }) : l; }
function renderLecture(){
  var all = NOTES[store.lec], list = lecList();
  var cur = store.slide[store.lec] || 0; if(cur >= all.length) cur = 0;
  var sl = all[cur], posInList = list.indexOf(sl);
  $main.innerHTML =
    '<div class="head"><div><span class="eyebrow">Kalló Noémi · BGE 2026</span><h2>'+esc(LEC[store.lec].name)+'</h2>'+
    '<p>'+esc(LEC[store.lec].long)+'. Minden dia a jegyzetével; a <span class="kbd">←</span> <span class="kbd">→</span> nyilakkal lapozhatsz, a képre kattintva nagyítod.</p></div>'+
    '<div class="chtabs">'+["e1","e2"].map(function(id){ return '<button class="chtab" data-src="'+id+'" data-lec="'+id+'" aria-pressed="'+(id===store.lec)+'"><i></i>'+LEC[id].name+'</button>'; }).join("")+'</div></div>'+
    '<section class="stage" data-src="'+store.lec+'">'+
      '<div class="slidebox"><img id="slideImg" alt="'+esc(sl.t)+'" src="'+slideSrc(sl.s)+'"></div>'+
      '<div class="stagebar"><button class="btn" id="prev">← Előző</button>'+
        '<span class="pos">'+(cur+1)+' / '+all.length+'</span>'+
        (sl.k ? '<span class="chip ok">ZH-anyag</span>' : '<span class="chip">tájékoztató</span>')+
        '<span class="spacer"></span><button class="btn primary" id="next">Következő →</button></div>'+
      '<div class="snote"><h3>'+esc(sl.t || "—")+'</h3>'+(sl.n ? '<p>'+esc(sl.n)+'</p>' : '')+'</div>'+
    '</section><div class="thumbs" id="thumbs"></div>';
  $main.querySelectorAll("[data-lec]").forEach(function(b){ b.onclick = function(){ store.lec = b.dataset.lec; save(); renderLecture(); }; });
  function go(d){
    var l = lecList(), i = l.indexOf(all[cur]);
    i = i < 0 ? 0 : Math.max(0, Math.min(l.length-1, i+d));
    store.slide[store.lec] = all.indexOf(l[i]); save(); renderLecture();
  }
  var pv = document.getElementById("prev"), nx = document.getElementById("next");
  pv.onclick = function(){ go(-1); }; nx.onclick = function(){ go(1); };
  pv.disabled = posInList === 0; nx.disabled = posInList === list.length - 1;
  keyHandler = function(e){ if(e.key === "ArrowRight") go(1); if(e.key === "ArrowLeft") go(-1); };
  document.getElementById("slideImg").onclick = function(){ openZoom(this.src); };
  var th = document.getElementById("thumbs");
  th.innerHTML = all.map(function(s, i){
    if(store.onlyCore && !s.k) return "";
    return '<button class="thumb'+(i===cur?" on":"")+(s.k?"":" dim")+'" data-i="'+i+'"><img loading="lazy" alt="" src="'+slideSrc(s.s)+'"><span><b>'+(i+1)+'</b>'+esc(s.t||"")+'</span></button>';
  }).join("");
  th.querySelectorAll(".thumb").forEach(function(b){ b.onclick = function(){ store.slide[store.lec] = +b.dataset.i; save(); renderLecture(); window.scrollTo({top:0,behavior:"smooth"}); }; });
  $rail.innerHTML = '<span class="lbl">Diák</span>'+
    '<div class="seg" id="coreSeg" style="margin-bottom:10px"><button data-v="0" aria-pressed="'+(!store.onlyCore)+'">Összes</button><button data-v="1" aria-pressed="'+store.onlyCore+'">Csak ZH-anyag</button></div>'+
    '<div class="scroll"><ol class="toc">'+all.map(function(s,i){
      if(store.onlyCore && !s.k) return "";
      return '<li><button data-i="'+i+'" class="'+(i===cur?"on":"")+'"><span class="kbd" style="margin-right:6px">'+(i+1)+'</span>'+esc(s.t||"—")+'</button></li>';
    }).join("")+'</ol></div>';
  $rail.querySelectorAll("#coreSeg button").forEach(function(b){ b.onclick = function(){ store.onlyCore = b.dataset.v === "1"; save(); renderLecture(); }; });
  $rail.querySelectorAll(".toc [data-i]").forEach(function(b){ b.onclick = function(){ store.slide[store.lec] = +b.dataset.i; save(); renderLecture(); }; });
  var on = $rail.querySelector(".toc .on"), sc = $rail.querySelector(".scroll");
  if(on && sc) sc.scrollTop = on.offsetTop - sc.offsetTop - 80;
}
document.addEventListener("keydown", function(e){
  if(e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if(!zoom.hidden && e.key === "Escape"){ zoom.hidden = true; return; }
  if(store.view === "lecture" && keyHandler) keyHandler(e);
  if(store.view === "quiz" && examActive() && !e.metaKey && !e.ctrlKey){
    var ex = store.exam;
    if(e.key === "ArrowRight" && ex.i < ex.items.length-1){ ex.i++; save(); renderExam(); }
    if(e.key === "ArrowLeft" && ex.i > 0){ ex.i--; save(); renderExam(); }
  }
});

/* ================= SZÖVEGES VÁLASZOK ÉRTÉKELÉSE ================= */
function norm(s){ return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")
  .replace(/[×x*]/g," x ").replace(/[^a-z0-9+]+/g," ").replace(/\s+/g," ").trim(); }
function squash(s){ return norm(s).replace(/ /g,""); }
function lev(a, b){
  if(a === b) return 0; if(!a.length) return b.length; if(!b.length) return a.length;
  var prev = range(b.length+1), cur;
  for(var i=1;i<=a.length;i++){ cur = [i]; for(var j=1;j<=b.length;j++){ cur[j] = Math.min(prev[j]+1, cur[j-1]+1, prev[j-1] + (a[i-1]===b[j-1]?0:1)); } prev = cur; }
  return prev[b.length];
}
function textOk(input, accs){
  var u = squash(input); if(!u) return false;
  for(var i=0;i<accs.length;i++){
    var v = squash(accs[i]); if(!v) continue;
    if(u === v) return true;
    var tol = v.length >= 16 ? 2 : v.length >= 7 ? 1 : 0;
    if(tol && lev(u, v) <= tol) return true;
    if(v.length >= 6 && u.length <= v.length + 14 && u.indexOf(v) >= 0) return true;
  }
  return false;
}
function parseNum(s){ if(s == null) return NaN; var t = String(s).replace(/\s| /g,"").replace(",", "."); if(!/^[-+]?\d*\.?\d+$/.test(t)) return NaN; return parseFloat(t); }
function numOk(input, exp){ var u = parseNum(input); if(isNaN(u)) return false; return Math.abs(u - exp) <= Math.max(0.02*Math.abs(exp), 0.005); }

/* ================= SZÁMOLÁS – GENERÁTOROK ================= */
var LET = "ABCDEF";
function genSup(sample, uneven){
  var d;
  if(sample){ d = { wP:0.5, wD:0.5, min:550, step:10, week:8, pen:20, sup:[[650,12],[750,12],[950,9],[1200,8]] }; }
  else {
    for(var tries=0; tries<60; tries++){
      /* a ZH-n azonos súly (50–50%); a Számolás fülön 2–3 feladatonként eltérő súly a gyakorláshoz */
      var w = uneven ? pick([[0.6,0.4],[0.4,0.6],[0.7,0.3],[0.3,0.7],[0.8,0.2],[0.2,0.8]]) : [0.5,0.5];
      d = { wP:w[0], wD:w[1], min:rnd(300,900,50), step:pick([10,10,20,5]), week:rnd(4,10), pen:pick([10,15,20,25]), sup:[] };
      var maxSteps = 95, used = {};
      for(var i=0;i<4;i++){
        var k = rnd(0, maxSteps); var late = rnd(-2, Math.floor(100/d.pen));
        d.sup.push([d.min + k*d.step, Math.max(1, d.week + late)]);
      }
      var tot = supSolve(d).tot, uniq = tot.map(function(x){ return x.toFixed(2); });
      if(uniq.filter(function(x,i){ return uniq.indexOf(x) === i; }).length === 4 && d.sup.some(function(s){ return s[1] > d.week; })) break;
    }
  }
  var r = supSolve(d);
  return { type:"sup", d:d, r:r };
}
function supSolve(d){
  var pp = [], dp = [], tot = [];
  d.sup.forEach(function(s){
    var a = Math.max(0, 100 - (s[0]-d.min)/d.step), late = Math.max(0, s[1]-d.week), b = Math.max(0, 100 - late*d.pen);
    pp.push(a); dp.push(b); tot.push(d.wP*a + d.wD*b);
  });
  var best = 0; tot.forEach(function(t,i){ if(t > tot[best]) best = i; });
  return { pp:pp, dp:dp, tot:tot, best:best };
}
function genGrav(sample){
  var d;
  if(sample) d = { unit:"db", pts:[["A",150,75,6000],["B",100,300,8200],["C",275,380,7000]] };
  else {
    var n = pick([3,3,4]); d = { unit:pick(["db","db","tonna"]), pts:[] };
    for(var i=0;i<n;i++){
      var p, tries = 0;
      do { p = [LET[i], rnd(20,480,5), rnd(20,480,5), rnd(10,120)*100]; tries++; }
      while(tries < 200 && d.pts.some(function(q){ return Math.hypot(q[1]-p[1], q[2]-p[2]) < 110; }));
      d.pts.push(p);
    }
    if(window.FIG && FIG.gravFits && !FIG.gravFits(d.pts, d.unit) && (genGrav.depth = (genGrav.depth||0) + 1) < 50){ var again = genGrav(false); genGrav.depth = 0; return again; }
    genGrav.depth = 0;
  }
  var sv = 0, sx = 0, sy = 0;
  d.pts.forEach(function(p){ sv += p[3]; sx += p[3]*p[1]; sy += p[3]*p[2]; });
  return { type:"grav", d:d, r:{ sv:sv, sx:sx, sy:sy, x:sx/sv, y:sy/sv } };
}
function wfmt(w){ return hu(w,1); }
function ranksOf(r){ return r.rank || r.tot.map(function(t){ return 1 + r.tot.filter(function(x){ return x > t + 1e-9; }).length; }); }
function fieldOk(f, val){ return f[4] === "rank" ? (val !== "" && val != null && +val === f[2]) : numOk(val, f[2]); }
/* v: válaszok (ha van, a táblázatban sorrend-oszlop is megjelenik); st: ellenőrzés után kulcs → helyes-e; ro: csak olvasható */
function calcText(c, v, st, ro){
  var d = c.d;
  if(c.type === "sup"){
    return '<p>Egy vállalat beszállítót választ egy termékhez. Az értékelés két szempontot vet össze: a termék <b>árát</b> és a <b>szállítási határidőt</b>'+(d.wP === 0.5 && d.wD === 0.5 ? ', <b>azonos súllyal</b> (50–50%)' : ' (súlyok: ár <b>'+wfmt(d.wP)+'</b>, szállítás <b>'+wfmt(d.wD)+'</b>)')+'. A minőségi megfelelést előminősítéssel már ellenőrizték.</p>'+
      '<ul><li>A terméket az értékeléstől számított <b>'+d.week+'. héttől</b> tervezik felhasználni; minden késő hétért <b>'+d.pen+' büntetőpontot</b> számolnak el.</li>'+
      '<li>A beszerzési ár minimuma <b>'+hu(d.min,0)+' euró</b>; a magasabb árért <b>'+d.step+' eurónként 1 pontot</b> vonnak le.</li>'+
      '<li>Mindkét szempont mentén legfeljebb <b>100 pont</b> érhető el.</li></ul>'+
      '<div class="tw"><table class="eqtab"><tr><th>Beszállító</th><th>Ár (euró)</th><th>Szállítás (hét)</th>'+(v ? '<th>Sorrend</th>' : '')+'</tr>'+
      d.sup.map(function(s,i){
        var cell = "";
        if(v){
          var key = "r"+i, val = v[key], rk = ranksOf(c.r)[i], has = st && key in st, ok = has && st[key];
          if(ro) cell = '<span class="num" style="font-weight:700">'+(val === "" || val == null ? "<i>üres</i>" : (+val)+".")+'</span>';
          else cell = '<select class="ranksel" data-act="txt" data-p="" data-f="'+key+'"><option value="">–</option>'+d.sup.map(function(x,j){ return '<option value="'+(j+1)+'"'+(String(val)===String(j+1)?" selected":"")+'>'+(j+1)+'.</option>'; }).join("")+'</select>';
          if(has) cell += ' <span class="rkst '+(ok?"ok":"no")+'">'+(ok ? "✓" : "✕ helyesen: "+rk+".")+'</span>';
          cell = '<td class="rkcell'+(has ? (ok ? " ok" : " no") : "")+'">'+cell+'</td>';
        }
        return '<tr><td><b>'+LET[i]+'</b></td><td class="num">'+hu(s[0],0)+'</td><td class="num">'+s[1]+'</td>'+cell+'</tr>'; }).join("")+'</table></div>';
  }
  return '<p>Egy vállalat egy termékét '+d.pts.length+' üzletében értékesíti. A vezetés úgy döntött, hogy az üzleteket ezentúl egy új raktárból (<b>R</b>) látja el. A <b>gravitációs központ módszerével</b> határozd meg, hova érdemes telepíteni a raktárat!</p>'+
    '<div class="tw"><table class="eqtab"><tr><th>Üzlet</th><th>X koordináta</th><th>Y koordináta</th><th>Értékesítés ('+d.unit+') – súlyszám</th></tr>'+
    d.pts.map(function(p){ return '<tr><td><b>'+p[0]+'</b></td><td class="num">'+p[1]+'</td><td class="num">'+p[2]+'</td><td class="num">'+hu(p[3],0)+'</td></tr>'; }).join("")+'</table></div>';
}
/* mezők: [kulcs, címke, várt érték, pont, típus] */
function calcFields(c, full){
  var r = c.r, f = [];
  if(c.type === "sup"){
    c.d.sup.forEach(function(s,i){
      if(full){ f.push(["p"+i, LET[i]+" · árpontszám", r.pp[i], 1, "num"]); f.push(["d"+i, LET[i]+" · szállítási pontszám", r.dp[i], 1, "num"]); }
      f.push(["t"+i, LET[i]+" · súlyozott összpontszám", r.tot[i], 1, "num"]);
    });
    var rk = ranksOf(r);
    c.d.sup.forEach(function(s,i){ f.push(["r"+i, LET[i]+" · sorrend", rk[i], full ? 1 : 0.25, "rank"]); });
  } else {
    f.push(["x", "A raktár X koordinátája", r.x, 2.5, "num"]);
    f.push(["y", "A raktár Y koordinátája", r.y, 2.5, "num"]);
  }
  return f;
}
function calcSteps(c){
  var d = c.d, r = c.r;
  if(c.type === "sup"){
    return '<ol><li><b>Árpontszám</b> = 100 − (ár − '+hu(d.min,0)+') / '+d.step+'. <b>Szállítási pontszám</b> = 100 − késő hetek × '+d.pen+', ahol késés = szállítási idő − '+d.week+' (ha ez negatív, 0).</li>'+
      '<li><div class="tw"><table><tr><th></th><th>Árpontszám</th><th>Késés</th><th>Szállítási pontszám</th><th>Összpont = '+wfmt(d.wP)+'×ár + '+wfmt(d.wD)+'×száll.</th></tr>'+
      d.sup.map(function(s,i){ var late = Math.max(0, s[1]-d.week);
        return '<tr><td><b>'+LET[i]+'</b></td><td class="num">100 − '+hu(s[0]-d.min,0)+'/'+d.step+' = <b>'+hu(r.pp[i])+'</b></td><td class="num">'+late+' hét</td><td class="num">100 − '+late+'×'+d.pen+' = <b>'+hu(r.dp[i])+'</b></td><td class="num">'+wfmt(d.wP)+'×'+hu(r.pp[i])+' + '+wfmt(d.wD)+'×'+hu(r.dp[i])+' = <b>'+hu(r.tot[i])+'</b></td></tr>'; }).join("")+
      '</table></div></li><li><b>Sorrend</b> (a legnagyobb összpontszám az 1.): '+range(d.sup.length).sort(function(a,b){ return r.tot[b] - r.tot[a]; }).map(function(i,k){ return '<b>'+(k+1)+'. '+LET[i]+'</b> ('+hu(r.tot[i])+')'; }).join(" · ")+'. Az 1. helyezettet, <b>'+LET[r.best]+'</b>-t érdemes választani.</li></ol>';
  }
  return '<ol><li>Súlyszámok összege: '+d.pts.map(function(p){ return hu(p[3],0); }).join(" + ")+' = <b>'+hu(r.sv,0)+'</b></li>'+
    '<li>Σ V·x = '+d.pts.map(function(p){ return hu(p[3],0)+'×'+p[1]; }).join(" + ")+' = <b>'+hu(r.sx,0)+'</b></li>'+
    '<li><b>X</b> = '+hu(r.sx,0)+' / '+hu(r.sv,0)+' = <b>'+hu(r.x)+'</b></li>'+
    '<li>Σ V·y = '+d.pts.map(function(p){ return hu(p[3],0)+'×'+p[2]; }).join(" + ")+' = <b>'+hu(r.sy,0)+'</b></li>'+
    '<li><b>Y</b> = '+hu(r.sy,0)+' / '+hu(r.sv,0)+' = <b>'+hu(r.y)+'</b></li>'+
    '<li>A raktár helye: <b>['+hu(r.x)+'; '+hu(r.y)+']</b></li></ol>';
}

/* ================= KÉRDÉSMOTOR ================= */
/* inst: egy kérdés példánya a keverési sorrendekkel; a: válaszobjektum */
function instFor(q){
  var it = { id:q.id };
  if(q.o) it.ord = shuffle(range(q.o.length));
  if(q.it) it.ord = shuffle(range(q.it.length));
  if(q.parts) it.pord = q.parts.map(function(p){ return p.o ? shuffle(range(p.o.length)) : null; });
  return it;
}
function sub(a, pfx){ if(!pfx) return a; var n = +pfx.slice(1); a.parts = a.parts || {}; a.parts[n] = a.parts[n] || {}; return a.parts[n]; }
function blankLabel(q, i){ var k = q.b[i][0]; return q.fig ? String(i+1) : (/^\d+$/.test(k) ? k : k); }
function blanksMap(q){ var B = {}; q.b.forEach(function(b,i){ B[b[0]] = i+1; }); return B; }
function answered(q, a){
  if(!a) return false;
  if(q.k === "s") return a.v != null;
  if(q.k === "m") return a.v && a.v.length > 0;
  if(q.k === "g") return a.v && Object.keys(a.v).length > 0;
  if(q.k === "f" || q.k === "l" || q.k === "calc") return a.v && Object.keys(a.v).some(function(k){ return String(a.v[k]).trim() !== ""; });
  if(q.k === "c") return a.parts && Object.keys(a.parts).some(function(k){ return answered(q.parts[k], a.parts[k]); });
  return false;
}

/* --- kitöltendő nézet --- */
function optsHtml(q, ord, a, pfx, multi){
  var v = a.v;
  return '<div class="opts">'+ord.map(function(oi, k){
    var sel = multi ? (v && v.indexOf(oi) >= 0) : v === oi;
    return '<button type="button" class="opt'+(multi?" multi":"")+(sel?" sel":"")+'" data-act="'+(multi?"tog":"pick")+'" data-p="'+pfx+'" data-v="'+oi+'"><span class="k">'+(multi ? (sel ? "✓" : "") : "ABCDEF".charAt(k))+'</span><span>'+esc(q.o[oi])+'</span></button>';
  }).join("")+'</div>';
}
function blanksHtml(q, a, pfx){
  a.v = a.v || {};
  var inputs = q.b.map(function(b, i){
    var lab = q.fig ? String(i+1) : b[0], txt = !q.fig && !/^\d+$/.test(lab);
    return '<label class="blank"><span class="bn'+(txt?" txt":"")+'">'+esc(lab)+'</span><input type="text" autocomplete="off" spellcheck="false" data-act="txt" data-p="'+pfx+'" data-f="'+i+'" value="'+esc(a.v[i]||"")+'" placeholder="'+(q.fig ? i+1+". felirat" : "válasz")+'"></label>';
  }).join("");
  return (q.fig ? '<div class="fillfig">'+figHtml(q.fig, blanksMap(q))+'</div>' : "")+'<div class="blanks">'+inputs+'</div>';
}
function qBodyHtml(q, inst, a, pfx){
  pfx = pfx || "";
  if(q.k === "s") return optsHtml(q, inst.ord || range(q.o.length), a, pfx, false);
  if(q.k === "m") return optsHtml(q, inst.ord || range(q.o.length), a, pfx, true);
  if(q.k === "f") return blanksHtml(q, a, pfx);
  if(q.k === "l"){
    a.v = a.v || {};
    return '<div class="blanks">'+range(q.n).map(function(i){
      return '<label class="blank"><span class="bn">'+(i+1)+'</span><input type="text" autocomplete="off" spellcheck="false" data-act="txt" data-p="'+pfx+'" data-f="'+i+'" value="'+esc(a.v[i]||"")+'"></label>'; }).join("")+'</div>';
  }
  if(q.k === "g"){
    a.v = a.v || {};
    return '<div class="grid-g">'+inst.ord.map(function(ii){
      var cur = a.v[ii];
      return '<div class="grow-g"><span class="it">'+esc(q.it[ii][0])+'</span><span class="gchoices">'+
        (q.gs||q.g).map(function(g, gi){ return '<button type="button" data-act="grp" data-p="'+pfx+'" data-it="'+ii+'" data-v="'+gi+'" aria-pressed="'+(cur===gi)+'">'+esc(g)+'</button>'; }).join("")+
        '<button type="button" class="none" data-act="grp" data-p="'+pfx+'" data-it="'+ii+'" data-v="-1" aria-pressed="'+(cur===-1)+'">kakukktojás</button></span></div>';
    }).join("")+'</div>';
  }
  if(q.k === "c"){
    return q.parts.map(function(p, pi){
      var pinst = { ord: inst.pord && inst.pord[pi] };
      return '<div class="part"><p class="pq"><span class="pl">'+"abcdef".charAt(pi)+')</span><span>'+esc(p.q)+'</span>'+(p.k==="m" ? '<span class="ptag">több jó válasz</span>' : '')+'</p>'+
        qBodyHtml(p, pinst, sub(a, "p"+pi), "p"+pi)+'</div>';
    }).join("");
  }
  if(q.k === "calc"){
    a.v = a.v || {};
    var fs = calcFields(q.c, false);
    return '<div class="task" style="box-shadow:none;margin-top:16px;padding:18px 18px">'+calcText(q.c, q.c.type === "sup" ? a.v : null)+'</div><div class="calcgrid">'+fs.filter(function(f){ return f[4] !== "rank"; }).map(function(f){ return calcInput(f, a.v[f[0]], q.c); }).join("")+'</div>';
  }
  return "";
}
function calcInput(f, val, c, state, ptsTxt){
  var ctl;
  if(f[4] === "sel"){
    ctl = '<select data-act="txt" data-p="" data-f="'+f[0]+'"><option value="">válassz…</option>'+c.d.sup.map(function(s,i){ return '<option value="'+i+'"'+(String(val)===String(i)?" selected":"")+'>'+LET[i]+'</option>'; }).join("")+'</select>';
  } else ctl = '<input type="text" inputmode="decimal" autocomplete="off" data-act="txt" data-p="" data-f="'+f[0]+'" value="'+esc(val==null?"":val)+'" placeholder="0,00">';
  return '<div class="calcrow'+(state ? " "+state.cls : "")+'"><label>'+esc(f[1])+''+(ptsTxt === "" ? "" : '<small>'+(ptsTxt != null ? ptsTxt : f[3]+' pont')+'</small>')+'</label>'+ctl+'<span class="st">'+(state ? state.txt : "")+'</span></div>';
}
/* delegált eseménykezelés a kitöltéshez */
function wireAnswer(root, a, onChange){
  root.querySelectorAll("[data-act]").forEach(function(el){
    var act = el.dataset.act, s = sub(a, el.dataset.p);
    if(act === "txt"){
      var h = function(){ s.v = s.v || {}; s.v[el.dataset.f] = el.value; onChange(false); };
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", h);
      if(el.tagName !== "SELECT") el.addEventListener("keydown", function(e){ if(e.key === "Enter"){ var all = Array.prototype.slice.call(root.querySelectorAll("input[data-act=txt]")), i = all.indexOf(el); if(all[i+1]) all[i+1].focus(); e.preventDefault(); } });
      return;
    }
    el.onclick = function(){
      var v = +el.dataset.v;
      if(act === "pick"){ s.v = s.v === v ? null : v; }
      else if(act === "tog"){ s.v = s.v || []; var ix = s.v.indexOf(v); if(ix >= 0) s.v.splice(ix,1); else s.v.push(v); }
      else if(act === "grp"){ s.v = s.v || {}; var it = el.dataset.it; if(s.v[it] === v) delete s.v[it]; else s.v[it] = v; }
      onChange(true);
    };
  });
}

/* --- pontozás --- */
function grade(q, a, max){
  a = a || {}; var ovr = a.ovr || {};
  if(q.k === "s"){ var ok = a.v === q.a; return { p: ok ? max : 0, max:max, units:[ok] }; }
  if(q.k === "m"){
    var v = a.v || [], hits = v.filter(function(x){ return q.a.indexOf(x) >= 0; }).length, wr = v.length - hits;
    return { p: max*hits/q.a.length, max:max, units:q.o.map(function(o,i){ return (v.indexOf(i)>=0) === (q.a.indexOf(i)>=0); }) };
  }
  if(q.k === "g"){
    var u = q.it.map(function(it, i){ return a.v && a.v[i] === it[1]; });
    return { p: max*u.filter(Boolean).length/u.length, max:max, units:u };
  }
  if(q.k === "f"){
    var vals = a.v || {}, units, used = {};
    if(q.any){
      units = q.b.map(function(b, i){
        if(ovr["b"+i]) return true;
        for(var j=0;j<q.b.length;j++){ if(!used[j] && textOk(vals[i], q.b[j][1])){ used[j] = 1; return true; } } return false; });
    } else units = q.b.map(function(b, i){ return !!ovr["b"+i] || textOk(vals[i], b[1]); });
    return { p: max*units.filter(Boolean).length/units.length, max:max, units:units };
  }
  if(q.k === "l"){
    var lv = a.v || {}, usedL = {}, lu = range(q.n).map(function(i){
      if(ovr["b"+i]) return true;
      for(var j=0;j<q.acc.length;j++){ if(!usedL[j] && textOk(lv[i], q.acc[j])){ usedL[j] = 1; return true; } } return false; });
    return { p: max*lu.filter(Boolean).length/q.n, max:max, units:lu };
  }
  if(q.k === "c"){
    var each = max/q.parts.length, tot = 0, pg = q.parts.map(function(p, pi){ var g = grade(p, a.parts && a.parts[pi], each); tot += g.p; return g; });
    return { p: tot, max:max, parts:pg };
  }
  if(q.k === "calc"){
    var fs = calcFields(q.c, false), sum = 0, mx = 0, cu = {};
    fs.forEach(function(f){ var val = a.v && a.v[f[0]], ok = fieldOk(f, val); cu[f[0]] = ok; mx += f[3]; if(ok) sum += f[3]; });
    return { p: sum*max/mx, max:max, fields:cu };
  }
  return { p:0, max:max };
}
function verdictOf(g){ return g.p >= g.max - 1e-9 ? "ok" : g.p <= 1e-9 ? "no" : "half"; }

/* --- visszajelző nézet --- */
function reviewBody(q, inst, a, g, pfx, ovrOn){
  a = a || {}; pfx = pfx || "";
  if(q.k === "s" || q.k === "m"){
    var ord = inst.ord || range(q.o.length), v = a.v, multi = q.k === "m";
    return '<div class="opts">'+ord.map(function(oi, k){
      var chosen = multi ? (v && v.indexOf(oi) >= 0) : v === oi, right = multi ? q.a.indexOf(oi) >= 0 : oi === q.a;
      var c = right ? (chosen ? " right" : (multi ? " miss" : " right")) : (chosen ? " wrong" : "");
      return '<div class="opt ro'+(multi?" multi":"")+c+'"><span class="k">'+(multi ? (right ? "✓" : chosen ? "✕" : "") : "ABCDEF".charAt(k))+'</span><span>'+esc(q.o[oi])+(chosen ? '<em class="you">← a te jelölésed</em>' : (multi && right ? '<em class="you">← ezt is be kellett volna jelölni</em>' : ''))+'</span></div>';
    }).join("")+'</div>';
  }
  if(q.k === "g"){
    var ordG = inst.ord || range(q.it.length);
    return '<div class="grid-g">'+ordG.map(function(ii){
      var it = q.it[ii], yv = a.v ? a.v[ii] : undefined, ok = yv === it[1];
      var gname = function(x){ return x === -1 ? "kakukktojás" : q.g[x]; };
      return '<div class="grow-g '+(ok?"ok":"no")+'"><span class="it">'+esc(it[0])+'</span><span class="gans">'+(ok ? "✓ "+esc(gname(it[1])) : (yv == null ? "nem soroltad be" : "✕ "+esc(gname(yv)))+'<small>helyesen: '+esc(gname(it[1]))+'</small>')+'</span></div>';
    }).join("")+'</div>';
  }
  if(q.k === "f" || q.k === "l"){
    var n = q.k === "f" ? q.b.length : q.n, vals = a.v || {};
    var fig = q.fig ? '<div class="fillfig">'+figHtml(q.fig, null)+'</div>' : "";
    var cards = range(n).map(function(i){
      var ok = g.units[i], lab = q.k === "f" ? (q.fig ? (i+1)+"." : q.b[i][0]) : (i+1)+".", yours = vals[i];
      var corr = q.k === "f" ? (q.any ? "" : q.b[i][1][0]) : "";
      var ov = ovrOn && !ok && String(yours||"").trim() ? '<button class="ovr" data-ovr="'+pfx+'|b'+i+'">Elfogadom, jó volt</button>' : (a.ovr && a.ovr["b"+i] ? '<button class="ovr on" data-ovr="'+pfx+'|b'+i+'">elfogadva ✓</button>' : "");
      return '<div class="rvblank '+(ok?"ok":"no")+'"><div class="row"><b>'+esc(lab)+'</b><span class="y">'+(String(yours||"").trim() ? esc(yours) : '<i>üres</i>')+'</span>'+ov+'</div>'+(corr && !ok ? '<span class="c">helyesen: '+esc(corr)+'</span>' : "")+'</div>';
    }).join("");
    var all = q.k === "l" ? '<p class="hint" style="margin:0">Elfogadott válaszok: '+q.acc.map(function(x){ return esc(x[0]); }).join(" · ")+'</p>' : (q.any ? '<p class="hint" style="margin:0">Helyes válaszok (bármilyen sorrendben): '+q.b.map(function(x){ return esc(x[1][0]); }).join(" · ")+'</p>' : "");
    return fig + '<div class="rvgrid">'+cards+'</div>'+all;
  }
  if(q.k === "c"){
    return q.parts.map(function(p, pi){
      var pg = g.parts[pi], pinst = { ord: inst.pord && inst.pord[pi] };
      return '<div class="part"><p class="pq"><span class="pl">'+"abcdef".charAt(pi)+')</span><span>'+esc(p.q)+'</span><span class="ptag">'+pts(pg.p)+' / '+pts(pg.max)+' p</span></p>'+
        reviewBody(p, pinst, a.parts && a.parts[pi], pg, "p"+pi, ovrOn)+'</div>';
    }).join("");
  }
  if(q.k === "calc"){
    var fs = calcFields(q.c, false);
    return '<div class="task" style="box-shadow:none;padding:18px">'+calcText(q.c, q.c.type === "sup" ? (a.v || {}) : null, g.fields, true)+'</div><div class="calcgrid">'+fs.filter(function(f){ return f[4] !== "rank"; }).map(function(f){
      var ok = g.fields[f[0]], val = a.v && a.v[f[0]];
      return '<div class="calcrow '+(ok?"ok":"no")+'"><label>'+esc(f[1])+'<small>'+f[3]+' pont</small></label><span class="num" style="font-weight:600">'+(val == null || val === "" ? "<i>üres</i>" : esc(val))+'</span><span class="st">'+(ok ? "✓ helyes" : "✕ "+hu(f[2]))+'</span></div>';
    }).join("")+'</div><div class="steps"><span class="lbl">Megoldás lépésenként</span>'+calcSteps(q.c)+'</div>';
  }
  return "";
}
function wireOverrides(root, a, onChange){
  root.querySelectorAll("[data-ovr]").forEach(function(b){ b.onclick = function(){
    var parts = b.dataset.ovr.split("|"), s = sub(a, parts[0]); s.ovr = s.ovr || {};
    if(s.ovr[parts[1]]) delete s.ovr[parts[1]]; else s.ovr[parts[1]] = true;
    onChange();
  }; });
}
function answerKey(q){
  if(q.k === "s") return '<p class="qa-a">✓ '+esc(q.o[q.a])+'</p>';
  if(q.k === "m") return '<p class="qa-a">✓ '+q.a.map(function(i){ return esc(q.o[i]); }).join(" · ")+'</p>';
  if(q.k === "g") return '<div class="qa-a"><ul>'+q.g.map(function(g, gi){ return '<li><b>'+esc(g)+':</b> '+q.it.filter(function(it){ return it[1]===gi; }).map(function(it){ return esc(it[0]); }).join(", ")+'</li>'; }).join("")+
    (q.it.some(function(it){ return it[1] === -1; }) ? '<li><b>Kakukktojás:</b> '+q.it.filter(function(it){ return it[1]===-1; }).map(function(it){ return esc(it[0]); }).join(", ")+'</li>' : "")+'</ul></div>';
  if(q.k === "f") return '<div class="qa-a"><ul>'+q.b.map(function(b, i){ return '<li>'+(q.fig ? (i+1)+". " : (/^\d+$/.test(b[0]) ? "("+b[0]+") " : "<b>"+esc(b[0])+":</b> "))+esc(b[1][0])+'</li>'; }).join("")+'</ul></div>';
  if(q.k === "l") return '<div class="qa-a"><ul>'+q.acc.map(function(x){ return '<li>'+esc(x[0])+'</li>'; }).join("")+'</ul></div>';
  if(q.k === "c") return '<div class="qa-a"><ul>'+q.parts.map(function(p, pi){ return '<li><b>'+"abcdef".charAt(pi)+')</b> '+esc(p.q)+' → '+(p.k==="m" ? p.a.map(function(i){ return esc(p.o[i]); }).join(", ") : esc(p.o[p.a]))+'</li>'; }).join("")+'</ul></div>';
  return "";
}

/* --- statisztika és súlyozott választás --- */
function streakOf(q){ var s = store.stats[q.id]; if(!s) return null; return typeof s.streak === "number" ? s.streak : 0; }
function weightOf(q){ var s = store.stats[q.id]; if(!s) return 3; var k = streakOf(q); return k === 0 ? 6 : k === 1 ? 2 : k === 2 ? 1 : k <= 4 ? 0.2 : 0.05; }
function wpick(arr, n){ return arr.map(function(q){ return {q:q, k:Math.pow(Math.random(), 1/weightOf(q))}; }).sort(function(a,b){ return b.k - a.k; }).slice(0, n).map(function(x){ return x.q; }); }
function bump(q, good){ if(!q || q.k === "calc") return; var s = store.stats[q.id] || {ok:0,bad:0,streak:0}; if(good){ s.ok++; s.streak = (s.streak||0) + 1; } else { s.bad++; s.streak = 0; } s.t = Date.now(); store.stats[q.id] = s; }
function poolQs(){ return QS.filter(function(q){ return store.topics.indexOf(q.t) >= 0; }); }
function learnState(){
  var r = {known:0, weak:0, fresh:0};
  poolQs().forEach(function(q){ var k = streakOf(q); if(k == null) r.fresh++; else if(k >= 3) r.known++; else r.weak++; });
  return r;
}
function topicPicker(id, withCalc){
  var counts = {}; QS.forEach(function(q){ counts[q.t] = (counts[q.t]||0) + 1; });
  return '<div class="field"><span class="lbl">Témakörök</span><div class="srcs" id="'+id+'">'+
    TOPS.map(function(t){ return '<label data-src="'+t+'"><input type="checkbox" data-t="'+t+'"'+(store.topics.indexOf(t)>=0?" checked":"")+'><i class="dot"></i><span class="tx">'+esc(TOP[t].name)+'</span><span class="n">'+(counts[t]||0)+'</span></label>'; }).join("")+
    (withCalc ? '<label data-src="t8"><input type="checkbox" data-t="calc"'+(store.calc?" checked":"")+'><i class="dot"></i><span class="tx">Számolások (2 feladat)</span><span class="n">∞</span></label>' : "")+
    '</div><div style="display:flex;gap:6px;margin-top:6px"><button class="btn ghost sm" data-all="1">Mind</button><button class="btn ghost sm" data-all="0">Egyik sem</button></div></div>';
}
function wireTopics(root, after){
  root.querySelectorAll("input[data-t]").forEach(function(inp){ inp.onchange = function(){
    var t = inp.dataset.t;
    if(t === "calc") store.calc = inp.checked;
    else { var ix = store.topics.indexOf(t); if(inp.checked && ix < 0) store.topics.push(t); if(!inp.checked && ix >= 0) store.topics.splice(ix,1); }
    save(); after();
  }; });
  root.querySelectorAll("[data-all]").forEach(function(b){ b.onclick = function(){ store.topics = b.dataset.all === "1" ? TOPS.slice() : []; if(b.dataset.all === "1") store.calc = true; save(); after(); }; });
}

/* ================= SZÁMOLÁS FÜL ================= */
var calcState = null;
function newCalc(sample){
  var uneven = false;
  if(store.calcType === "sup" && !sample){
    store.supSince = (store.supSince || 0) + 1;
    if(store.supSince >= (store.supNext || 3)){ uneven = true; store.supSince = 0; store.supNext = pick([2,3]); }
    save();
  }
  var c = store.calcType === "sup" ? genSup(sample, uneven) : genGrav(sample);
  calcState = { id: Date.now().toString(36) + Math.random().toString(36).slice(2,6), c:c, v:{}, checked:false, steps:false, sample:!!sample };
}
function calcScore(c, v){
  var fs = calcFields(c, true), n = 0;
  fs.forEach(function(f){ if(fieldOk(f, v[f[0]])) n++; });
  return { ok:n, n:fs.length };
}
function saveHist(cs){
  var h = store.calcHist = store.calcHist || [], sc = calcScore(cs.c, cs.v);
  var e = { id:cs.id, ts:Date.now(), c:cs.c, v:JSON.parse(JSON.stringify(cs.v)), ok:sc.ok, n:sc.n, sample:cs.sample };
  for(var i=0;i<h.length;i++){ if(h[i].id === cs.id){ h.splice(i,1); break; } }
  h.unshift(e); if(h.length > 80) h.length = 80; save();
}
function histSummary(c){
  var d = c.d;
  if(c.type === "sup") return d.sup.length+" beszállító · min. ár "+hu(d.min,0)+" € · "+d.week+". hét · "+d.pen+" büntetőpont/hét · súlyok "+wfmt(d.wP)+"/"+wfmt(d.wD);
  return d.pts.length+" üzlet · "+d.pts.map(function(p){ return p[0]+" ["+p[1]+"; "+p[2]+"]"; }).join(", ");
}
function renderCalcHist(){
  var h = store.calcHist || [], f = store.histF || "all";
  var shown = h.filter(function(e){ return f === "all" || e.c.type === f; });
  $main.innerHTML = '<div class="head"><div><span class="eyebrow">Számolás · előzmények</span><h2>Megoldott feladataim</h2>'+
    '<p>Minden ellenőrzött feladat ide kerül, ugyanazokkal a számokkal és a te válaszaiddal. Megnyithatod a válaszaiddal és a levezetéssel, vagy újra megoldhatod üresen.</p></div>'+
    '<button class="btn" id="hBack">← Vissza a számoláshoz</button></div>'+
    '<div class="rfilter" style="margin-top:0">'+[["all","Mind ("+h.length+")"],["sup","Beszállítóértékelés"],["grav","Telephelyválasztás"]].map(function(x){ return '<button class="chtab" data-hf="'+x[0]+'" aria-pressed="'+(f===x[0])+'">'+x[1]+'</button>'; }).join("")+'</div>'+
    '<div class="review">'+(shown.length ? shown.map(function(e){
      var v = e.ok === e.n ? "ok" : e.ok ? "half" : "no", dt = new Date(e.ts);
      return '<article class="rv '+v+'" data-src="t8"><div class="rvhead"><span class="chip src">'+(e.c.type === "sup" ? "Beszállítóértékelés" : "Telephelyválasztás")+'</span>'+(e.sample ? '<span class="chip">mintafeladat</span>' : '')+
        '<span class="kbd">'+dt.toLocaleDateString("hu-HU")+' '+dt.toLocaleTimeString("hu-HU",{hour:"2-digit",minute:"2-digit"})+'</span>'+
        '<span class="rvst '+v+'">'+e.ok+' / '+e.n+' helyes</span></div>'+
        '<p style="margin:0;color:var(--ink-2);font-size:14px">'+esc(histSummary(e.c))+'</p>'+
        '<div class="fbrow" style="justify-content:flex-start"><button class="btn primary sm" data-ho="'+e.id+'">Megnyitás a válaszaimmal</button><button class="btn sm" data-hr="'+e.id+'">Újra megoldom üresen</button><button class="btn ghost sm" data-hd="'+e.id+'">Törlés</button></div></article>';
    }).join("") : '<p class="empty">Még nincs megoldott feladat. Ellenőrizz egyet a Számolás oldalon, és itt megjelenik.</p>')+'</div>';
  function find(id){ for(var i=0;i<h.length;i++) if(h[i].id === id) return h[i]; return null; }
  document.getElementById("hBack").onclick = function(){ store.calcView = "task"; save(); renderCalc(); window.scrollTo(0,0); };
  $main.querySelectorAll("[data-hf]").forEach(function(b){ b.onclick = function(){ store.histF = b.dataset.hf; save(); renderCalc(); }; });
  $main.querySelectorAll("[data-ho],[data-hr]").forEach(function(b){ b.onclick = function(){
    var e = find(b.dataset.ho || b.dataset.hr), keep = !!b.dataset.ho; if(!e) return;
    calcState = { id:e.id, c:e.c, v: keep ? JSON.parse(JSON.stringify(e.v)) : {}, checked:keep, steps:keep, sample:e.sample, counted:keep };
    store.calcType = e.c.type; store.calcView = "task"; save(); renderCalc(); window.scrollTo(0,0);
  }; });
  $main.querySelectorAll("[data-hd]").forEach(function(b){ var armed = false; b.onclick = function(){
    if(!armed){ armed = true; b.textContent = "Biztosan?"; setTimeout(function(){ armed = false; if(b.isConnected) b.textContent = "Törlés"; }, 3000); return; }
    store.calcHist = h.filter(function(x){ return x.id !== b.dataset.hd; }); save(); renderCalc();
  }; });
}
function renderCalc(){
  var histN = (store.calcHist || []).length;
  if(store.calcView === "hist"){ railCalc(); return renderCalcHist(); }
  if(!calcState || calcState.c.type !== store.calcType) newCalc(false);
  var cs = calcState, c = cs.c, fs = calcFields(c, true);
  railCalc();
  var title = c.type === "sup" ? "Beszállítóértékelés – súlyozott pontrendszer" : "Telephelyválasztás – gravitációs központ";
  calcMain(cs, c, fs, title);
}
function railCalc(){
  var st = store.calcStats, histN = (store.calcHist || []).length;
  $rail.innerHTML = '<div class="field"><span class="lbl">Feladattípus</span><div class="srcs">'+
    [["sup","Beszállítóértékelés","súlyozott pontrendszer"],["grav","Telephelyválasztás","gravitációs központ"]].map(function(x){
      return '<label><input type="radio" name="ct" value="'+x[0]+'"'+(store.calcType===x[0]?" checked":"")+'><span class="tx">'+x[1]+'<br><span class="kbd">'+x[2]+'</span></span></label>'; }).join("")+'</div></div>'+
    '<div class="field"><button class="btn primary" id="cNew" style="width:100%">Új adatok</button><button class="btn" id="cSample" style="width:100%;margin-top:6px">Mintafeladat a diáról</button>'+
    '<button class="btn" id="cHist" style="width:100%;margin-top:6px">Megoldott feladataim ('+histN+')</button></div>'+
    '<div class="field"><span class="lbl">Eddig</span><div class="statgrid">'+
      '<div class="stat"><div class="v">'+st.sup.ok+' / '+st.sup.n+'</div><div class="k">Beszállító · hibátlan</div></div>'+
      '<div class="stat"><div class="v">'+st.grav.ok+' / '+st.grav.n+'</div><div class="k">Gravitáció · hibátlan</div></div></div>'+
      '<p class="hint">A ZH-n 2% hibahatárral fogadják el az eredményt; 2 tizedesjegyre elég kerekíteni. Tizedesvessző és -pont is jó.</p></div>';
  $rail.style.overflow = "auto";
  $rail.querySelectorAll("input[name=ct]").forEach(function(r){ r.onchange = function(){ store.calcType = r.value; store.calcView = "task"; save(); newCalc(false); renderCalc(); }; });
  document.getElementById("cNew").onclick = function(){ store.calcView = "task"; save(); newCalc(false); renderCalc(); };
  document.getElementById("cSample").onclick = function(){ store.calcView = "task"; save(); newCalc(true); renderCalc(); };
  document.getElementById("cHist").onclick = function(){ store.calcView = "hist"; save(); renderCalc(); window.scrollTo(0,0); };
}
function calcMain(cs, c, fs, title){
  var zh = {}; calcFields(c, false).forEach(function(f){ zh[f[0]] = f[3]; });
  var zhP = cs.checked ? grade({ k:"calc", c:c }, { v:cs.v }, 5).p : 0;
  var st = null; if(cs.checked){ st = {}; fs.forEach(function(f){ st[f[0]] = fieldOk(f, cs.v[f[0]]); }); }
  var rows = fs.filter(function(f){ return f[4] !== "rank"; }).map(function(f){
    var state = null;
    if(cs.checked){ var ok = st[f[0]];
      state = { cls: ok ? "ok" : "no", txt: ok ? "✓ helyes" : "✕ " + hu(f[2]) }; }
    return calcInput(f, cs.v[f[0]], c, state, "");
  });
  var grouped = "";
  if(c.type === "sup"){
    var per = 3; grouped = c.d.sup.map(function(s,i){ return '<div class="calchead">'+LET[i]+' beszállító</div>'+rows.slice(i*per, i*per+per).join(""); }).join("");
  } else grouped = rows.join("");
  var nOk = 0; if(cs.checked) fs.forEach(function(f){ if(st[f[0]]) nOk++; });
  $main.innerHTML = '<div class="head"><div><span class="eyebrow">Számolás · 2 feladat a ZH-n, 10 pont</span><h2>Számolás</h2>'+
    '<p>Minden kattintásra új adatsor. Töltsd ki a részeredményeket, ellenőrizd, és nézd meg a levezetést. A ZH-n a részszámításokért külön pont jár.</p></div></div>'+
    '<section class="task" data-src="t8"><span class="chip src" style="margin-bottom:12px">'+(cs.sample ? "mintafeladat · dia" : "véletlen adatok")+'</span>'+(c.type === "sup" && c.d.wP !== 0.5 ? ' <span class="chip sand" style="margin-bottom:12px">eltérő súlyok</span>' : '')+'<h3 style="font-size:20px;font-weight:800;margin:6px 0 12px">'+title+'</h3>'+calcText(c, c.type === "sup" ? cs.v : null, st)+(c.type === "sup" ? '<p class="hint" style="margin:-4px 0 10px">A táblázat utolsó oszlopában add meg a beszállítók sorrendjét, alul pedig a részszámításokat.</p>' : '')+
    '<div class="calcgrid" id="cgrid">'+grouped+'</div>'+
    (cs.checked ? '<div class="fb"><div class="verdict '+(nOk===fs.length?"ok":nOk?"half":"no")+'"><span class="m"><span>'+(nOk===fs.length?"✓":"!")+'</span></span>'+nOk+' / '+fs.length+' részeredmény helyes · a próba-ZH pontozása szerint '+hu(zhP)+' / 5 pont</div></div>' : "")+
    '<div class="fbrow" style="margin-top:18px;justify-content:flex-start"><button class="btn primary" id="cCheck">Ellenőrzés</button><button class="btn" id="cSteps">'+(cs.steps?"Levezetés elrejtése":"Megoldás lépésenként")+'</button><button class="btn ghost" id="cNew2">Új adatok →</button>'+((store.calcHist||[]).some(function(e){ return e.id === cs.id; }) ? '<span class="kbd">✓ mentve a megoldott feladataim közé</span>' : '')+'</div>'+
    (cs.steps ? '<div class="steps"><span class="lbl">Levezetés</span>'+calcSteps(c)+'</div>' : "")+
    '</section>';
  wireAnswer($main.querySelector("section.task"), cs, function(){ if(cs.checked){ cs.checked = false; } });
  document.getElementById("cCheck").onclick = function(){
    var first = !cs.checked && !cs.counted; cs.checked = true;
    var all = fs.every(function(f){ return fieldOk(f, cs.v[f[0]]); });
    if(!cs.counted){ cs.counted = true; store.calcStats[c.type].n++; if(all) store.calcStats[c.type].ok++; }
    saveHist(cs);
    var y = window.scrollY; renderCalc(); window.scrollTo(0, y);
  };
  document.getElementById("cSteps").onclick = function(){ cs.steps = !cs.steps; var y = window.scrollY; renderCalc(); window.scrollTo(0, y); };
  document.getElementById("cNew2").onclick = function(){ newCalc(false); renderCalc(); window.scrollTo(0,0); };
}

/* ================= GYAKORLÁS: KEZDŐLAP, GYAKORLÓ MÓD, ZH ================= */
function renderQuiz(){
  if(examActive() || (store.exam && store.exam.done && store.quizView === "exam")) return renderExam();
  if(store.quizView === "list") return renderList();
  if(store.quizView === "practice") return renderPractice();
  return renderStart();
}
function renderStart(){
  $rail.innerHTML = topicPicker("tp", true);
  $rail.style.overflow = "auto";
  wireTopics($rail, renderStart);
  var L = learnState(), plan = examPlan();
  $main.innerHTML = '<div class="head"><div><span class="eyebrow">1. ZH · 16 kérdés · 40 pont · 30 perc</span><h2>Gyakorlás</h2>'+
    '<p>A próba-ZH ugyanúgy épül fel, mint az igazi: tesztkérdések, összetett kérdések és két számolás. A gyakorló módban kérdésenként rögtön látod a megoldást.</p></div></div>'+
    '<div class="result">'+
      '<div class="structure"><div><b>10 × teszt</b><span>14 pont · 6 egyválaszos (1 p) és 4 többválaszos (2 p)</span></div>'+
      '<div><b>4 × összetett</b><span>16 pont · csoportosítás, ábrakitöltés, felsorolás, esetfeladat (4 p)</span></div>'+
      '<div><b>2 × számolás</b><span>10 pont · beszállítóértékelés és gravitációs központ (5 p)</span></div></div>'+
      '<ul class="rules"><li>A visszaszámláló a jobb felső sarokban fut (<b>'+store.examMin+' perc</b>); ha lejár, a teszt automatikusan lezárul.</li>'+
      '<li>A többválaszosnál nincs pontlevonás: minden bejelölt helyes válasz arányos részpontot ér.</li>'+
      '<li>A szöveges válaszokat a gép elnézően ellenőrzi (ékezet, kötőjel, apró elírás nem számít). Ha mégis elutasít egy jó választ, a kiértékelésnél elfogadhatod.</li>'+
      '<li>Számolásnál 2%-os hibahatár, elég 2 tizedesjegy.</li></ul>'+
      (plan.total < 40 ? '<p class="hint" style="margin:-8px 0 16px">A kiválasztott témakörökből most '+plan.n+' kérdés, '+plan.total+' pont áll össze.</p>' : '')+
      '<div class="learn"><span class="lbl" style="margin:0 0 6px">Hol tartasz a kiválasztott témakörökben</span>'+
        '<div class="statgrid"><div class="stat"><div class="v" style="color:var(--ok)">'+L.known+'</div><div class="k">Már tudod (3× egymás után)</div></div>'+
        '<div class="stat"><div class="v" style="color:var(--bad)">'+L.weak+'</div><div class="k">Gyakorlandó</div></div>'+
        '<div class="stat"><div class="v">'+L.fresh+'</div><div class="k">Még nem láttad</div></div></div>'+
        '<p class="hint">A hibázott és a még nem látott kérdések gyakrabban jönnek elő; amit többször egymás után eltaláltál, egyre ritkábban.</p></div>'+
      '<div class="fbrow" style="justify-content:flex-start;margin-top:18px"><button class="btn primary" id="goExam"'+(plan.n?"":" disabled")+'>Próba-ZH indítása</button>'+
      '<button class="btn" id="goPractice"'+(poolQs().length?"":" disabled")+'>Gyakorló mód</button>'+
      '<button class="btn" id="goList">Összes kérdés–válasz</button></div>'+
      (store.exam && store.exam.done ? '<p class="hint" style="margin-top:14px"><button class="linkbtn" id="lastRes">Az előző próba-ZH eredménye</button></p>' : "")+
    '</div>';
  document.getElementById("goExam").onclick = startExam;
  document.getElementById("goPractice").onclick = function(){ startPractice(); };
  document.getElementById("goList").onclick = function(){ store.quizView = "list"; save(); renderQuiz(); window.scrollTo(0,0); };
  var lr = document.getElementById("lastRes"); if(lr) lr.onclick = function(){ store.quizView = "exam"; save(); renderQuiz(); };
}

/* ---- gyakorló mód ---- */
var pr = null;
function startPractice(){
  var p = poolQs();
  if(store.prKind === "test") p = p.filter(function(q){ return q.k === "s" || q.k === "m"; });
  if(store.prKind === "complex") p = p.filter(function(q){ return "gflc".indexOf(q.k) >= 0; });
  if(store.prKind === "bad") p = p.filter(function(q){ var k = streakOf(q); return k === 0; });
  var chosen = wpick(p, store.prLen || 20);
  pr = { items: chosen.map(function(q){ return { inst:instFor(q), a:{}, checked:false }; }), i:0, got:0, max:0 };
  store.quizView = "practice"; save(); renderQuiz(); window.scrollTo(0,0);
}
function ptsFor(q){ return q.k === "s" ? 1 : q.k === "m" ? 2 : q.k === "calc" ? 5 : 4; }
function renderPractice(){
  if(!pr){ store.quizView = "start"; return renderStart(); }
  $rail.innerHTML = '<div class="field"><span class="lbl">Kérdésfajta</span><div class="srcs">'+
    [["all","Vegyes"],["test","Teszt (egy/több válasz)"],["complex","Összetett"],["bad","Amit legutóbb elrontottam"]].map(function(x){ return '<label><input type="radio" name="pk" value="'+x[0]+'"'+(store.prKind===x[0]?" checked":"")+'><span class="tx">'+x[1]+'</span></label>'; }).join("")+'</div></div>'+
    '<div class="field"><span class="lbl">Kérdések száma</span><div class="seg" id="segLen">'+[10,20,40].map(function(n){ return '<button data-v="'+n+'" aria-pressed="'+(store.prLen===n)+'">'+n+'</button>'; }).join("")+'</div></div>'+
    topicPicker("tp2", false)+
    '<div class="field"><button class="btn primary" id="prNew" style="width:100%">Új kör indítása</button><button class="btn ghost" id="prBack" style="width:100%;margin-top:6px">← Vissza a kezdőlapra</button></div>';
  $rail.style.overflow = "auto";
  $rail.querySelectorAll("input[name=pk]").forEach(function(r){ r.onchange = function(){ store.prKind = r.value; save(); startPractice(); }; });
  $rail.querySelectorAll("#segLen button").forEach(function(b){ b.onclick = function(){ store.prLen = +b.dataset.v; save(); startPractice(); }; });
  wireTopics($rail, startPractice);
  document.getElementById("prNew").onclick = startPractice;
  document.getElementById("prBack").onclick = function(){ store.quizView = "start"; save(); renderQuiz(); };
  var head = '<div class="head"><div><span class="eyebrow">Gyakorló mód · azonnali visszajelzés</span><h2>Gyakorlás</h2></div></div>';
  if(!pr.items.length){ $main.innerHTML = head + '<div class="result"><p style="margin:0">Nincs kérdés ehhez a szűréshez. Válassz több témakört vagy másik kérdésfajtát.</p></div>'; return; }
  if(pr.i >= pr.items.length){
    var pc = pr.max ? Math.round(pr.got/pr.max*100) : 0;
    $main.innerHTML = head + '<div class="result"><div class="score"><span class="big">'+pc+'%</span><span class="of">'+pts(pr.got)+' / '+pts(pr.max)+' pont · '+pr.items.length+' kérdés</span></div>'+
      '<div class="fbrow" style="justify-content:flex-start;margin-top:18px"><button class="btn primary" id="again">Új kör</button><button class="btn" id="toStart">Kezdőlap</button></div></div>';
    document.getElementById("again").onclick = startPractice;
    document.getElementById("toStart").onclick = function(){ store.quizView = "start"; save(); renderQuiz(); };
    return;
  }
  var cur = pr.items[pr.i], q = QBY[cur.inst.id], mx = ptsFor(q), last = pr.i === pr.items.length - 1;
  var html = head + '<div class="bar"><span class="count">'+(pr.i+1)+' / '+pr.items.length+'</span><span class="track"><i style="width:'+Math.round(pr.i/pr.items.length*100)+'%"></i></span><span class="count">'+pts(pr.got)+' / '+pts(pr.max)+' p</span></div>'+
    '<article class="qcard" data-src="'+q.t+'"><div class="qtop"><span class="chip src">'+esc(TOP[q.t].name)+'</span><span class="chip">'+KIND[q.k]+'</span><span class="chip">'+mx+' pont</span></div>'+
    '<div class="qbody" id="qb">'+qHead(q)+'<div id="ansArea"></div><div id="fb"></div></div></article>';
  $main.innerHTML = html;
  function drawAns(){
    var area = document.getElementById("ansArea");
    if(!cur.checked){ area.innerHTML = qBodyHtml(q, cur.inst, cur.a, "") + '<div class="fbrow" style="margin-top:20px"><span class="kbd">'+(q.k==="m"?"Több válasz is jó lehet.":"")+'</span><button class="btn primary" id="chk">Ellenőrzés</button></div>';
      wireAnswer(area, cur.a, function(rer){ if(rer){ var y = window.scrollY; drawAns(); window.scrollTo(0,y); } });
      document.getElementById("chk").onclick = function(){
        cur.checked = true; var g = grade(q, cur.a, mx); cur.g = g; pr.got += g.p; pr.max += mx; bump(q, g.p >= mx*0.75 - 1e-9); save(); renderPractice();
      };
    } else {
      var g = grade(q, cur.a, mx), d = g.p - cur.g.p; if(Math.abs(d) > 1e-9){ pr.got += d; cur.g = g; }
      var vd = verdictOf(g);
      area.innerHTML = reviewBody(q, cur.inst, cur.a, g, "", true);
      wireOverrides(area, cur.a, function(){ var y = window.scrollY; renderPractice(); window.scrollTo(0,y); });
      document.getElementById("fb").innerHTML = '<div class="fb"><div class="verdict '+vd+'"><span class="m"><span>'+(vd==="ok"?"✓":vd==="no"?"✕":"½")+'</span></span>'+pts(g.p)+' / '+mx+' pont</div>'+
        (q.why ? '<div class="why"><p>'+esc(q.why)+'</p>'+(q.sl ? '<img class="refimg" alt="" src="'+slideSrc(q.sl)+'" loading="lazy">' : '')+'</div>' : '')+
        '<div class="fbrow"><span style="display:flex;gap:14px;flex-wrap:wrap">'+(q.sl ? '<button class="linkbtn" id="gs">Megnézem a dián ('+slideName(q.sl)+')</button>' : '')+'<button class="linkbtn" id="gn">Megnézem a jegyzetben</button></span>'+
        '<button class="btn primary" id="nx">'+(last ? "Eredmény" : "Következő")+' →</button></div></div>';
      var im = document.querySelector("#fb .refimg"); if(im) im.onclick = function(){ openZoom(im.src); };
      var gs = document.getElementById("gs"); if(gs) gs.onclick = function(){ goSlide(q.sl); };
      document.getElementById("gn").onclick = function(){ goNotes(q); };
      document.getElementById("nx").onclick = function(){ pr.i++; renderPractice(); window.scrollTo(0,0); };
      document.getElementById("nx").focus({preventScroll:true});
    }
  }
  drawAns();
}
function qHead(q){
  return '<p class="qlead">'+LEAD[q.k]+'</p>'+(q.k === "c" ? '<p class="case">'+esc(q.q)+'</p>' : '<h3 class="q">'+esc(q.q)+'</h3>')+
    (q.k === "g" ? '<div class="legend">'+q.g.map(function(g, gi){ return '<span>'+(q.gs ? '<b>'+esc(q.gs[gi])+'</b> = ' : '')+esc(q.gs ? g.replace(/^[IV]+\.\s*/,'') : g)+'</span>'; }).join("")+'<span style="border-style:dashed">kakukktojás</span></div>' : "");
}

/* ---- ZH ---- */
var timerInt = null;
function examActive(){ return !!(store.exam && !store.exam.done); }
function examMs(){ return 30 * 60000; }
function examLeft(){ return store.exam ? Math.max(0, store.exam.start + examMs() - Date.now()) : 0; }
function fmt(ms){ var t = Math.ceil(ms/1000), m = Math.floor(t/60), s = t%60; return (m<10?"0":"")+m+":"+(s<10?"0":"")+s; }
function examPlan(){
  var p = poolQs(), s = p.filter(function(q){ return q.k === "s"; }), m = p.filter(function(q){ return q.k === "m"; });
  var cx = p.filter(function(q){ return "gflc".indexOf(q.k) >= 0; });
  var nS = Math.min(6 + Math.max(0, 4 - m.length), s.length), nM = Math.min(4, m.length), nC = Math.min(4, cx.length), nCalc = store.calc ? 2 : 0;
  return { n: nS + nM + nC + nCalc, total: nS + nM*2 + nC*4 + nCalc*5 };
}
function startExam(){
  var p = poolQs(), s = p.filter(function(q){ return q.k === "s"; }), m = p.filter(function(q){ return q.k === "m"; });
  var mm = wpick(m, 4), ss = wpick(s, 6 + (4 - mm.length));
  var test = shuffle(ss.concat(mm));
  var cx = [], kinds = shuffle(["g","f","l","c"]);
  kinds.forEach(function(k){ var c = wpick(p.filter(function(q){ return q.k === k && cx.indexOf(q) < 0; }), 1); if(c[0]) cx.push(c[0]); });
  while(cx.length < 4){ var more = wpick(p.filter(function(q){ return "gflc".indexOf(q.k) >= 0 && cx.indexOf(q) < 0; }), 1); if(!more[0]) break; cx.push(more[0]); }
  var items = test.map(function(q){ return { inst:instFor(q), sec:"test", pts:ptsFor(q) }; })
    .concat(cx.map(function(q){ return { inst:instFor(q), sec:"complex", pts:4 }; }));
  if(store.calc){ items.push({ calc:genSup(false), sec:"calc", pts:5 }); items.push({ calc:genGrav(false), sec:"calc", pts:5 }); }
  if(!items.length) return;
  store.exam = { start:Date.now(), min:30, items:items, ans:{}, i:0, done:false, end:null, filter:"all" };
  store.quizView = "exam"; save(); renderQuiz(); window.scrollTo(0,0);
}
function itemQ(it){ return it.calc ? { k:"calc", c:it.calc, t:"t8", q: it.calc.type === "sup" ? "Beszállítóértékelés – súlyozott pontrendszer" : "Telephelyválasztás – gravitációs központ" } : QBY[it.inst.id]; }
function tickTimer(){
  var el = document.getElementById("zhTimer");
  if(!examActive()){ el.hidden = true; clearInterval(timerInt); timerInt = null; return; }
  var left = examLeft(); el.hidden = false; el.querySelector("b").textContent = fmt(left);
  el.classList.toggle("low", left <= 5*60000); el.classList.toggle("crit", left <= 60000);
  if(left <= 0) finishExam(true);
}
function ensureTimer(){ if(examActive() && !timerInt) timerInt = setInterval(tickTimer, 500); tickTimer(); }
function finishExam(timeout){
  var ex = store.exam; if(!ex || ex.done) return;
  ex.done = true; ex.end = Math.min(Date.now(), ex.start + examMs()); ex.timeout = !!timeout;
  ex.items.forEach(function(it, i){ var q = itemQ(it); if(q.k === "calc") return; var g = grade(q, ex.ans[i], it.pts); bump(q, g.p >= it.pts*0.75 - 1e-9); });
  store.quizView = "exam"; save(); tickTimer();
  if(store.view !== "quiz") store.view = "quiz";
  render(); window.scrollTo(0,0);
}
var SECN = { test:"Teszt", complex:"Összetett", calc:"Számolás" };
function railExam(){
  var ex = store.exam, html = "";
  var done = 0; ex.items.forEach(function(it,i){ if(answered(itemQ(it), ex.ans[i])) done++; });
  var lastSec = null;
  html += '<div class="field"><span class="lbl">Kérdések · '+done+' / '+ex.items.length+' megválaszolva</span><div class="qgrid">'+
    ex.items.map(function(it, i){
      var sep = it.sec !== lastSec ? '<span class="sep">'+SECN[it.sec]+'</span>' : ""; lastSec = it.sec;
      return sep + '<button data-go="'+i+'" class="'+(answered(itemQ(it), ex.ans[i])?"done":"")+(i===ex.i?" cur":"")+'">'+(i+1)+'</button>';
    }).join("")+'</div><p class="hint">Bármelyik kérdésre visszaléphetsz és módosíthatsz a beadásig.</p></div>'+
    '<div class="field"><button class="btn primary" id="railSubmit" style="width:100%">Beadás</button><button class="btn ghost" id="railQuit" style="width:100%;margin-top:6px">ZH megszakítása</button></div>';
  $rail.innerHTML = html; $rail.style.overflow = "auto";
  $rail.querySelectorAll("[data-go]").forEach(function(b){ b.onclick = function(){ ex.i = +b.dataset.go; save(); renderExam(); window.scrollTo(0,0); }; });
  document.getElementById("railSubmit").onclick = askSubmit;
  var qb = document.getElementById("railQuit"), armed = false;
  qb.onclick = function(){ if(!armed){ armed = true; qb.textContent = "Biztosan? Kattints újra"; setTimeout(function(){ armed = false; if(qb.isConnected) qb.textContent = "ZH megszakítása"; }, 3000); return; }
    store.exam = null; store.quizView = "start"; save(); tickTimer(); renderQuiz(); };
}
function askSubmit(){
  var ex = store.exam, miss = 0; ex.items.forEach(function(it,i){ if(!answered(itemQ(it), ex.ans[i])) miss++; });
  var box = document.getElementById("submitBox"); if(!box) return;
  box.hidden = false;
  box.innerHTML = '<p><b>Biztosan beadod?</b> '+(miss ? miss+' kérdés még megválaszolatlan.' : 'Minden kérdéshez írtál valamit.')+'</p>'+
    '<div class="fbrow" style="justify-content:flex-start"><button class="btn primary" id="doSubmit">Igen, beadom</button><button class="btn" id="noSubmit">Vissza a teszthez</button></div>';
  document.getElementById("doSubmit").onclick = function(){ finishExam(false); };
  document.getElementById("noSubmit").onclick = function(){ box.hidden = true; };
  box.scrollIntoView({block:"center", behavior:"smooth"});
}
function renderExam(){
  var ex = store.exam;
  if(!ex){ store.quizView = "start"; return renderStart(); }
  var head = '<div class="head"><div><span class="eyebrow">Próba-ZH · 30 perc</span><h2>Próba-ZH</h2>'+
    '<p>Mint az igazi: közben nincs visszajelzés, a végén látod, mi lett jó és mi nem.</p></div></div>';
  if(ex.done) return renderExamResult(head);
  railExam(); ensureTimer();
  var it = ex.items[ex.i], q = itemQ(it), a = ex.ans[ex.i] = ex.ans[ex.i] || {}, last = ex.i === ex.items.length - 1;
  var inst = it.inst || {};
  $main.innerHTML = head +
    '<div class="bar"><span class="count">'+(ex.i+1)+' / '+ex.items.length+'</span><span class="track"><i style="width:'+Math.round((ex.i+1)/ex.items.length*100)+'%"></i></span></div>'+
    '<article class="qcard" data-src="'+q.t+'"><div class="qtop"><span class="chip">'+(ex.i+1)+'. kérdés</span><span class="chip acc">'+SECN[it.sec]+'</span><span class="chip">'+KIND[q.k]+'</span><span class="chip">'+it.pts+' pont</span></div>'+
    '<div class="qbody">'+(q.k === "calc" ? '<p class="qlead">'+LEAD.calc+'</p><h3 class="q">'+esc(q.q)+'</h3>' : qHead(q))+'<div id="ansArea"></div>'+
    '<div class="fbrow" style="margin-top:22px"><button class="btn" id="xprev"'+(ex.i===0?" disabled":"")+'>← Előző</button>'+
    (last ? '<button class="btn primary" id="xsubmit">Beadás</button>' : '<button class="btn primary" id="xnext">Következő →</button>')+'</div>'+
    '<div class="submitbox" id="submitBox" hidden></div></div></article>';
  function draw(){
    var area = document.getElementById("ansArea");
    area.innerHTML = qBodyHtml(q, inst, a, "");
    wireAnswer(area, a, function(rer){ save(); if(rer){ var y = window.scrollY; draw(); window.scrollTo(0,y); } railExamLite(); });
  }
  draw();
  document.getElementById("xprev").onclick = function(){ if(ex.i > 0){ ex.i--; save(); renderExam(); window.scrollTo(0,0); } };
  var nx = document.getElementById("xnext"); if(nx) nx.onclick = function(){ ex.i++; save(); renderExam(); window.scrollTo(0,0); };
  var sb = document.getElementById("xsubmit"); if(sb) sb.onclick = askSubmit;
}
function railExamLite(){
  var ex = store.exam; if(!ex) return;
  $rail.querySelectorAll("[data-go]").forEach(function(b){ var i = +b.dataset.go; b.classList.toggle("done", answered(itemQ(ex.items[i]), ex.ans[i])); });
}
function renderExamResult(head){
  var ex = store.exam, sec = { test:{p:0,m:0}, complex:{p:0,m:0}, calc:{p:0,m:0} }, tot = 0, mx = 0;
  var rows = ex.items.map(function(it, i){
    var q = itemQ(it), g = grade(q, ex.ans[i], it.pts);
    sec[it.sec].p += g.p; sec[it.sec].m += it.pts; tot += g.p; mx += it.pts;
    return { i:i, it:it, q:q, g:g, v:verdictOf(g) };
  });
  var pc = mx ? Math.round(tot/mx*100) : 0, used = Math.round(((ex.end || Date.now()) - ex.start)/1000), f = ex.filter || "all";
  var shown = rows.filter(function(r){ return f === "all" || (f === "bad" ? r.v !== "ok" : r.v === "ok"); });
  $rail.innerHTML = '<div class="field"><span class="lbl">Kérdések</span><div class="qgrid">'+rows.map(function(r){
    return '<button data-jump="'+r.i+'" style="border-color:var(--'+(r.v==="ok"?"ok":r.v==="no"?"bad":"sand")+')">'+(r.i+1)+'</button>'; }).join("")+'</div></div>'+
    '<div class="field"><button class="btn primary" id="newExam2" style="width:100%">Új próba-ZH</button><button class="btn ghost" id="toStart2" style="width:100%;margin-top:6px">← Kezdőlap</button></div>';
  $rail.style.overflow = "auto";
  $main.innerHTML = head + '<div class="result">'+
    (ex.timeout ? '<p class="timeout">Lejárt az idő — a teszt automatikusan lezárult.</p>' : '')+
    '<div class="score"><span class="big">'+pc+'%</span><span class="of">'+pts(tot)+' / '+pts(mx)+' pont</span></div>'+
    '<div class="statgrid" style="margin-top:16px">'+["test","complex","calc"].filter(function(k){ return sec[k].m; }).map(function(k){
      return '<div class="stat"><div class="v">'+pts(sec[k].p)+' / '+sec[k].m+'</div><div class="k">'+SECN[k]+'</div></div>'; }).join("")+
      '<div class="stat"><div class="v">'+fmt(used*1000)+'</div><div class="k">Felhasznált idő</div></div></div>'+
    '<p class="hint" style="margin-top:12px">Ha a gép egy szöveges válaszodat tévesen utasította el, a kérdésnél az „Elfogadom, jó volt” gombbal javíthatod, és a pontszám frissül.</p>'+
    '<div class="fbrow" style="justify-content:flex-start;margin-top:12px"><button class="btn primary" id="newExam">Új próba-ZH</button><button class="btn" id="toStart">Kezdőlap</button></div></div>'+
    '<div class="rfilter">'+[["all","Mind ("+rows.length+")"],["bad","Hibás vagy részleges"],["good","Hibátlan"]].map(function(x){ return '<button class="chtab" data-f="'+x[0]+'" aria-pressed="'+(f===x[0])+'">'+x[1]+'</button>'; }).join("")+'</div>'+
    '<div class="review">'+shown.map(function(r){
      var q = r.q, st = r.v === "ok" ? "hibátlan" : r.v === "no" ? "hibás" : "részben jó";
      return '<article class="rv '+r.v+'" id="rv'+r.i+'" data-src="'+q.t+'"><div class="rvhead"><span class="rvn">'+(r.i+1)+'.</span><span class="chip">'+SECN[r.it.sec]+'</span><span class="chip">'+KIND[q.k]+'</span>'+
        '<span class="rvst '+r.v+'">'+pts(r.g.p)+' / '+r.it.pts+' p · '+st+'</span></div>'+
        (q.k === "c" ? '<p class="case">'+esc(q.q)+'</p>' : '<h4 class="rvq">'+esc(q.q)+'</h4>')+
        '<div data-rvb="'+r.i+'">'+reviewBody(q, r.it.inst || {}, ex.ans[r.i], r.g, "", q.k !== "calc")+'</div>'+
        (q.why ? '<div class="why"><p>'+esc(q.why)+'</p></div>' : '')+
        (q.sl ? '<span style="display:flex;gap:14px;flex-wrap:wrap"><button class="linkbtn" data-sl="'+q.sl+'">Megnézem a dián ('+slideName(q.sl)+')</button><button class="linkbtn" data-nt="'+r.i+'">Megnézem a jegyzetben</button></span>' :
          (q.k === "calc" ? '<button class="linkbtn" data-calc="1">Gyakorlom a Számolás fülön</button>' : ''))+
        '</article>';
    }).join("")+(shown.length ? "" : '<p class="empty">Ebben a szűrésben nincs kérdés.</p>')+'</div>';
  function again(){ store.exam = null; save(); startExam(); }
  function toStart(){ store.quizView = "start"; save(); renderQuiz(); window.scrollTo(0,0); }
  document.getElementById("newExam").onclick = again; document.getElementById("newExam2").onclick = again;
  document.getElementById("toStart").onclick = toStart; document.getElementById("toStart2").onclick = toStart;
  $main.querySelectorAll("[data-f]").forEach(function(b){ b.onclick = function(){ ex.filter = b.dataset.f; save(); var y = window.scrollY; renderExam(); window.scrollTo(0,y); }; });
  $main.querySelectorAll("[data-sl]").forEach(function(b){ b.onclick = function(){ goSlide(b.dataset.sl); }; });
  $main.querySelectorAll("[data-nt]").forEach(function(b){ b.onclick = function(){ goNotes(rows[+b.dataset.nt].q); }; });
  $main.querySelectorAll("[data-calc]").forEach(function(b){ b.onclick = function(){ setView("calc"); }; });
  $rail.querySelectorAll("[data-jump]").forEach(function(b){ b.onclick = function(){ var el = document.getElementById("rv"+b.dataset.jump);
    if(!el){ ex.filter = "all"; save(); renderExam(); el = document.getElementById("rv"+b.dataset.jump); } if(el) el.scrollIntoView({behavior:"smooth", block:"start"}); }; });
  $main.querySelectorAll("[data-rvb]").forEach(function(box){
    var i = +box.dataset.rvb; ex.ans[i] = ex.ans[i] || {};
    wireOverrides(box, ex.ans[i], function(){ save(); var y = window.scrollY; renderExam(); window.scrollTo(0,y); });
  });
}

/* ---- összes kérdés–válasz ---- */
var listQ = "", listT = "all", listOnly = "all";
function normTxt(t){ return String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
function renderList(){
  var counts = {}; QS.forEach(function(q){ counts[q.t] = (counts[q.t]||0) + 1; });
  $rail.innerHTML = '<span class="lbl">Témakör</span><div class="srcs">'+[["all","Mind",QS.length]].concat(TOPS.map(function(t){ return [t, TOP[t].name, counts[t]||0]; })).map(function(x){
    return '<label'+(x[0]!=="all" ? ' data-src="'+x[0]+'"' : '')+'><input type="radio" name="lt" value="'+x[0]+'"'+(listT===x[0]?" checked":"")+'>'+(x[0]!=="all" ? '<i class="dot"></i>' : '')+'<span class="tx">'+esc(x[1])+'</span><span class="n">'+x[2]+'</span></label>'; }).join("")+'</div>';
  $rail.style.overflow = "auto";
  $rail.querySelectorAll("input[name=lt]").forEach(function(r){ r.onchange = function(){ listT = r.value; drawList(); }; });
  $main.innerHTML = '<div class="head"><div><span class="eyebrow">Átnézés</span><h2>Összes kérdés–válasz</h2>'+
    '<p>Minden kérdés a helyes válasszal, egymás alatt, gyors átolvasásra.</p></div><button class="btn" id="back">← Vissza</button></div>'+
    '<div class="listtools"><input class="search" id="ls" type="search" placeholder="Keresés a kérdésekben és válaszokban…" value="'+esc(listQ)+'">'+
    '<div class="seg" id="lo">'+[["all","Mind"],["test","Teszt"],["complex","Összetett"],["weak","Ahol hibáztam"]].map(function(x){ return '<button data-v="'+x[0]+'" aria-pressed="'+(listOnly===x[0])+'" style="white-space:nowrap;padding:7px 10px">'+x[1]+'</button>'; }).join("")+'</div></div>'+
    '<p class="hint" id="lc"></p><div id="qal"></div>';
  document.getElementById("back").onclick = function(){ store.quizView = "start"; save(); renderQuiz(); window.scrollTo(0,0); };
  var si = document.getElementById("ls"); si.oninput = function(){ listQ = si.value; drawList(); };
  $main.querySelectorAll("#lo button").forEach(function(b){ b.onclick = function(){ listOnly = b.dataset.v; $main.querySelectorAll("#lo button").forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); }); drawList(); }; });
  drawList();
}
function drawList(){
  var term = normTxt(listQ.trim());
  var items = QS.filter(function(q){
    if(listT !== "all" && q.t !== listT) return false;
    if(listOnly === "test" && "sm".indexOf(q.k) < 0) return false;
    if(listOnly === "complex" && "gflc".indexOf(q.k) < 0) return false;
    if(listOnly === "weak"){ var k = streakOf(q); if(k == null || k > 0) return false; }
    if(term && normTxt(q.q + " " + answerKey(q).replace(/<[^>]+>/g," ")).indexOf(term) < 0) return false;
    return true;
  });
  items.sort(function(a,b){ return TOPS.indexOf(a.t) - TOPS.indexOf(b.t) || "smgflc".indexOf(a.k) - "smgflc".indexOf(b.k); });
  document.getElementById("lc").textContent = items.length + " kérdés";
  var html = "", last = null;
  items.forEach(function(q){
    if(q.t !== last){ html += '<h4 class="qa-sec" data-src="'+q.t+'"><i></i>'+esc(TOP[q.t].name)+'</h4>'; last = q.t; }
    var k = streakOf(q), badge = k == null ? "" : (k >= 3 ? '<span class="qa-st ok">tudod</span>' : (k === 0 ? '<span class="qa-st no">hibáztál</span>' : ""));
    html += '<div class="qa"><p class="qa-q">'+esc(q.q)+' <span class="chip" style="vertical-align:2px">'+KIND[q.k]+'</span>'+badge+'</p>'+answerKey(q)+'</div>';
  });
  document.getElementById("qal").innerHTML = html || '<p class="empty">Nincs találat.</p>';
}

window.ETFM = { textOk:textOk, numOk:numOk, genGrav:genGrav, genSup:genSup, calcSteps:calcSteps, calcText:calcText };
render();
})();
