/* Rajzolt ábrák. FIG[név](blanks) → SVG; blanks = {kulcs: sorszám} esetén a felirat helyén számozott üres mező jelenik meg. */
(function(){
"use strict";
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function lines(x, y, txt, cls, anchor, lh){
  var ls = String(txt).split("|"), h = lh || 17, y0 = y - (ls.length-1)*h/2;
  return '<text x="'+x+'" y="'+y0+'" class="'+cls+'" text-anchor="'+(anchor||"middle")+'">'+
    ls.map(function(l,i){ return '<tspan x="'+x+'" dy="'+(i?h:"0.35em")+'">'+esc(l)+'</tspan>'; }).join("")+'</text>';
}
function badge(x, y, n){
  return '<g class="fx-badge"><circle cx="'+x+'" cy="'+y+'" r="14"/><text x="'+x+'" y="'+y+'" text-anchor="middle" dy="0.35em">'+n+'</text></g>';
}
/* felirat vagy üres mező egy téglalapban */
function slot(B, key, x, y, w, h, label, cls, tcls){
  if(B && B[key] != null){
    return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="8" class="fx-blank"/>'+badge(x+w/2, y+h/2, B[key]);
  }
  return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="8" class="'+(cls||"fx-box")+'"/>'+lines(x+w/2, y+h/2, label, tcls||"fx-t");
}
/* csak felirat (keret nélkül) vagy üres mező */
function label(B, key, x, y, w, h, txt, tcls, anchor){
  if(B && B[key] != null) return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="7" class="fx-blank"/>'+badge(x+w/2, y+h/2, B[key]);
  var ax = anchor === "start" ? x : anchor === "end" ? x+w : x+w/2;
  return lines(ax, y+h/2, txt, tcls||"fx-t", anchor);
}
function svg(w, h, body, title){
  return '<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(title||"ábra")+'" xmlns="http://www.w3.org/2000/svg">'+
    '<defs><marker id="ah" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="fx-arrow"/></marker>'+
    '<marker id="aha" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="fx-arrow-acc"/></marker></defs>'+body+'</svg>';
}
function arrow(x1,y1,x2,y2,cls){ return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" class="'+(cls||"fx-line")+'" marker-end="url(#'+(cls==="fx-acc"?"aha":"ah")+')"/>'; }

var FIG = {};

FIG.flow = function(B){
  var b = '';
  b += '<path d="M40,40 H600 V14 L720,92 L600,170 V144 H40 Z" class="fx-sand"/>';
  b += slot(B,"v1",60,56,170,72,"Vevői|érték","fx-dark","fx-on");
  b += slot(B,"v2",265,56,170,72,"Érték-|teremtés","fx-dark","fx-on");
  b += slot(B,"v3",470,56,170,72,"Vevői|értékítélet","fx-dark","fx-on");
  b += '<line x1="320" y1="128" x2="290" y2="182" class="fx-line"/><line x1="380" y1="128" x2="410" y2="182" class="fx-line"/>';
  b += slot(B,"v4",200,182,150,52,"Vállalat és|ellátási lánc","fx-hi","fx-at");
  b += slot(B,"v5",370,182,150,52,"Folyamatok","fx-hi","fx-at");
  return svg(760,250,b,"Vevői érték, értékteremtés, vevői értékítélet");
};

FIG.pyramid = function(B){
  var b = '', L = [["p1","Elemzésalapú verseny"],["p2","Időalapú verseny"],["p3","Minőségalapú verseny"],["p4","Költségalapú verseny"]];
  var cx = 210, top = 20, H = 70;
  L.forEach(function(l,i){
    var y = top + i*H, w1 = 60 + i*80, w2 = 60 + (i+1)*80;
    b += '<path d="M'+(cx-w1/2)+','+y+' L'+(cx+w1/2)+','+y+' L'+(cx+w2/2)+','+(y+H-4)+' L'+(cx-w2/2)+','+(y+H-4)+' Z" class="'+(i%2?"fx-hi":"fx-sand")+'"/>';
    b += label(B,l[0],400,y+12,220,H-28,l[1],"fx-t","start");
    b += '<line x1="'+(cx+w2/2-20)+'" y1="'+(y+H/2)+'" x2="392" y2="'+(y+H/2)+'" class="fx-dash"/>';
  });
  b += lines(cx, top+4*H+16, "alap", "fx-s");
  return svg(640,330,b,"Versenystratégiák piramisa");
};

FIG.formulas = function(B){
  var b = '', R = [
    ["érték =","f1","igények kielégítése","x","felhasznált erőforrások","Dumond, 2000; MSZ EN 12973:2020"],
    ["érték =","f2","funkcióteljesítmény","x","felhasznált erőforrások","SAVE International, 2020"],
    ["vevői érték =","x","minőség × szolgáltatás","f3","költség × idő","Christopher, 2005"],
    ["vevői érték =","x","MPQ","f4","MPP","Setijono és Dahlgaard, 2007"]];
  R.forEach(function(r,i){
    var y = 18 + i*84;
    b += lines(150, y+34, r[0], "fx-h", "end");
    b += label(B, r[1], 170, y, 250, 30, r[2], "fx-t");
    b += '<line x1="170" y1="'+(y+35)+'" x2="420" y2="'+(y+35)+'" class="fx-acc"/>';
    b += label(B, r[3], 170, y+40, 250, 30, r[4], "fx-t");
    b += lines(450, y+35, r[5], "fx-s", "start");
  });
  return svg(720,350,b,"Az érték mérésének képletei");
};

FIG.bmc = function(B){
  var b = '', W = 148, G = 4, x = function(i){ return 10 + i*(W+G); }, T = 12, H = 300, h2 = (H-G)/2;
  b += slot(B,"kp",x(0),T,W,H,"Kiemelt|partnerek");
  b += slot(B,"ka",x(1),T,W,h2,"Kiemelt|tevékenységek");
  b += slot(B,"kr",x(1),T+h2+G,W,h2,"Kiemelt|erőforrások");
  b += slot(B,"vp",x(2),T,W,H,"Érték-|ajánlat","fx-hi","fx-at");
  b += slot(B,"cr",x(3),T,W,h2,"Ügyfél-|kapcsolatok");
  b += slot(B,"ch",x(3),T+h2+G,W,h2,"Csatornák");
  b += slot(B,"cs",x(4),T,W,H,"Ügyfél-|csoportok");
  var bw = (5*W+4*G-G)/2;
  b += slot(B,"cost",10,T+H+G,bw,86,"Költségszerkezet","fx-sand");
  b += slot(B,"rev",10+bw+G,T+H+G,bw,86,"Bevételek","fx-sand");
  return svg(770,410,b,"Üzletimodell-vászon");
};

FIG.vpc = function(B){
  var b = '';
  b += '<rect x="20" y="20" width="300" height="300" rx="6" class="fx-box"/>';
  b += '<line x1="20" y1="20" x2="320" y2="320" class="fx-grid"/><line x1="320" y1="20" x2="20" y2="320" class="fx-grid"/>';
  b += '<circle cx="170" cy="170" r="34" class="fx-hi"/>';
  b += label(B,"gc",95,40,150,48,"Nyereség-|teremtések");
  b += label(B,"ps",26,146,110,48,"Termékek és|szolgáltatások");
  b += label(B,"pr",95,252,150,48,"Probléma-|megoldások");
  b += '<circle cx="580" cy="170" r="150" class="fx-box"/>';
  b += '<line x1="580" y1="170" x2="580" y2="20" class="fx-grid"/><line x1="580" y1="170" x2="450" y2="245" class="fx-grid"/><line x1="580" y1="170" x2="710" y2="245" class="fx-grid"/>';
  b += '<circle cx="580" cy="170" r="34" class="fx-hi"/>';
  b += label(B,"gains",470,90,110,48,"Ügyfél-|nyereségek");
  b += label(B,"jobs",612,120,100,48,"Ügyfél-|feladatok");
  b += label(B,"pains",520,254,120,48,"Ügyfél-|problémák");
  b += '<path d="M340,170 H410" class="fx-acc" marker-end="url(#aha)" marker-start="url(#aha)"/>';
  b += lines(375,152,"illeszkedés","fx-s");
  b += label(B,"vm",70,330,200,34,"Értéktérkép","fx-h");
  b += label(B,"cp",480,330,200,34,"Ügyfélprofil","fx-h");
  return svg(760,372,b,"Értékajánlat-vászon");
};

FIG.porter = function(B){
  var b = '', X = 60, W = 560, rows = [["inf","Vállalati infrastruktúra"],["eem","Emberierőforrás-menedzsment"],["tech","Technológia"],["besz","Beszerzés"]];
  rows.forEach(function(r,i){ b += slot(B,r[0],X,16+i*46,W,40,r[1],"fx-sand"); });
  var cols = [["bl","Bemenő|logisztika"],["ter","Termelés"],["kl","Kimenő|logisztika"],["mark","Marketing|és|értékesítés"],["vus","Vásárlás|utáni|szolgál-|tatások"]];
  var cw = (W - 4*6)/5;
  cols.forEach(function(c,i){ b += slot(B,c[0],X+i*(cw+6),206,cw,170,c[1],"fx-hi","fx-at"); });
  b += '<path d="M630,16 H690 L748,196 L690,376 H630 Z" class="fx-dark"/>';
  if(B && B.haszon != null) b += '<rect x="640" y="160" width="80" height="72" rx="7" class="fx-blank"/>'+badge(680,196,B.haszon);
  else b += lines(676,196,"Érték|/|Haszon","fx-on",null,19);
  if(B && B.tam != null) b += '<rect x="8" y="16" width="44" height="178" rx="7" class="fx-blank"/>'+badge(30,105,B.tam);
  else b += '<text x="30" y="105" class="fx-s" text-anchor="middle" dy="0.35em" transform="rotate(-90 30 105)">Támogató tevékenységek</text>';
  if(B && B.els != null) b += '<rect x="8" y="206" width="44" height="170" rx="7" class="fx-blank"/>'+badge(30,291,B.els);
  else b += '<text x="30" y="291" class="fx-s" text-anchor="middle" dy="0.35em" transform="rotate(-90 30 291)">Elsődleges tevékenységek</text>';
  return svg(760,392,b,"Porter értéklánca");
};

FIG.ito = function(B){
  var b = '';
  b += (B && B["in"] != null) ? '<rect x="20" y="40" width="150" height="64" rx="32" class="fx-blank"/>'+badge(95,72,B["in"]) : '<ellipse cx="95" cy="72" rx="75" ry="32" class="fx-dark"/>'+lines(95,72,"input","fx-on");
  b += arrow(172,72,238,72);
  b += slot(B,"tr",240,40,220,64,"transzformáció","fx-dark","fx-on");
  b += arrow(462,72,528,72);
  b += (B && B.out != null) ? '<rect x="530" y="40" width="150" height="64" rx="32" class="fx-blank"/>'+badge(605,72,B.out) : '<ellipse cx="605" cy="72" rx="75" ry="32" class="fx-dark"/>'+lines(605,72,"output","fx-on");
  b += arrow(350,150,350,108);
  b += slot(B,"aux",265,150,170,48,"segédanyagok","fx-hi","fx-at");
  return svg(700,212,b,"Termelőtevékenység");
};

FIG.cycle = function(B){
  var b = '', L = [["c1","Tervezés"],["c2","Szervezés"],["c3","Működés"],["c4","Irányítás"]];
  L.forEach(function(l,i){ var x = 20 + i*172; b += slot(B,l[0],x,30,140,56,l[1],"fx-hi","fx-at"); if(i<3) b += arrow(x+142,58,x+170,58); });
  b += '<path d="M610,90 C600,200 470,214 420,212" class="fx-line" marker-end="url(#ah)"/>';
  b += '<path d="M280,212 C190,212 90,190 90,94" class="fx-line" marker-end="url(#ah)"/>';
  b += slot(B,"c5",282,186,136,52,"Fejlesztés","fx-sand");
  return svg(720,252,b,"A termelés menedzseri körfolyamata");
};

FIG.smile = function(B){
  var b = '';
  b += arrow(80,280,80,30); b += arrow(80,280,680,280);
  b += '<path d="M130,110 C210,250 300,245 380,245 C460,245 550,250 630,110" class="fx-acc"/>';
  b += '<circle cx="130" cy="110" r="15" class="fx-ok"/><circle cx="380" cy="245" r="15" class="fx-bad"/><circle cx="630" cy="110" r="15" class="fx-ok"/>';
  b += label(B,"yax",0,40,72,120,"Részese-|dés a|termék|hozzá-|adott|értéké-|ben","fx-s");
  b += label(B,"pre",70,292,190,46,"Gyártás előtti fázis:|K+F, tervezés","fx-t");
  b += label(B,"prod",290,292,180,46,"Termelési fázis","fx-t");
  b += label(B,"post",500,292,200,46,"Termelést követő fázis:|marketing, vevőszolgálat","fx-t");
  return svg(720,350,b,"Mosolygörbe");
};

FIG.kraljic = function(B){
  var b = '';
  b += arrow(100,370,100,20); b += arrow(100,370,620,370);
  b += slot(B,"q1",120,40,230,140,"Szűk keresztmetszetű|termék","fx-sand");
  b += slot(B,"q2",370,40,230,140,"Stratégiai termék","fx-hi","fx-at");
  b += slot(B,"q3",120,200,230,140,"Nem kritikus termék");
  b += slot(B,"q4",370,200,230,140,"Befolyásolható|termék","fx-sand");
  if(B && B.ay != null) b += '<rect x="20" y="70" width="56" height="240" rx="7" class="fx-blank"/>'+badge(48,190,B.ay);
  else b += '<text x="58" y="195" class="fx-t" text-anchor="middle" dy="0.35em" transform="rotate(-90 58 195)">Beszerzés piaci komplexitása</text>';
  b += label(B,"ax",250,382,220,36,"Termék fontossága","fx-t");
  b += lines(108,388,"alacsony","fx-s","start"); b += lines(612,356,"magas","fx-s","end");
  return svg(640,424,b,"Kraljic-mátrix");
};

FIG.updown = function(B){
  var b = '', N = [["Nyersanyag",60],["Beszállítók",215],["",380],["Disztribúció",545],["Fogyasztó",700]];
  N.forEach(function(n,i){
    if(i === 2) b += slot(B,"core",310,92,140,64,"Központi|vállalat","fx-dark","fx-on");
    else b += '<circle cx="'+n[1]+'" cy="124" r="44" class="'+(i<2?"fx-sand":"fx-hi")+'"/>'+lines(n[1],124,n[0],"fx-s");
    if(i<4){ var x1 = i===2 ? 452 : n[1]+46, x2 = i===1 ? 308 : N[i+1][1]-46; b += arrow(x1,124,x2,124); }
  });
  b += '<path d="M20,52 V40 H350 V52" class="fx-line"/><path d="M410,52 V40 H740 V52" class="fx-line"/>';
  b += label(B,"up",70,4,230,32,"Beszerzési (ellátási) hálózat","fx-at");
  b += label(B,"down",460,4,230,32,"Disztribúciós (elosztási) hálózat","fx-at");
  b += lines(185,196,"beszállítói oldal · upstream","fx-s"); b += lines(575,196,"vevői oldal · downstream","fx-s");
  return svg(760,212,b,"Az ellátási lánc részei");
};

FIG.codp = function(B){
  var b = '', st = ["Tervezés","Beszerzés","Gyártás","Össze-|szerelés","Kiszállítás"], X0 = 230, cw = 100;
  st.forEach(function(s,i){ b += lines(X0+i*cw+cw/2, 26, s, "fx-s"); });
  var rows = [["r1","Make-to-stock (MTS)",4],["r2","Assemble-to-order (ATO)",3],["r3","Make-to-order (MTO)",2],["r4","Engineer-to-order (ETO)",0]];
  rows.forEach(function(r,i){
    var y = 60 + i*62, cx = X0 + r[2]*cw;
    b += label(B,r[0],10,y,200,40,r[1],"fx-t","start");
    if(cx > X0) b += '<rect x="'+X0+'" y="'+(y+8)+'" width="'+(cx-X0)+'" height="24" rx="5" class="fx-sand"/>';
    b += '<rect x="'+cx+'" y="'+(y+8)+'" width="'+(X0+5*cw-cx)+'" height="24" rx="5" class="fx-hi"/>';
    b += '<path d="M'+(cx-11)+','+(y+2)+' L'+(cx+11)+','+(y+2)+' L'+cx+','+(y+22)+' Z" class="fx-tri"/>';
  });
  b += '<rect x="'+X0+'" y="312" width="16" height="12" rx="3" class="fx-sand"/>'+lines(X0+22,318,"előrejelzésre (push)","fx-s","start");
  b += '<rect x="'+(X0+190)+'" y="312" width="16" height="12" rx="3" class="fx-hi"/>'+lines(X0+212,318,"vevői rendelésre (pull)","fx-s","start");
  b += '<path d="M'+(X0+400)+',310 L'+(X0+416)+',310 L'+(X0+408)+',324 Z" class="fx-tri"/>'+lines(X0+422,318,"CODP","fx-s","start");
  return svg(760,334,b,"CODP szerinti vállalattípusok");
};

FIG.bullwhip = function(B){
  var b = '', P = [["Beszállító",110,70],["Gyártó",280,46],["Elosztó-|központ",450,26],["Kiskereskedő",620,12]];
  P.forEach(function(p){
    var d = "", x0 = p[1]-70;
    for(var t=0;t<=140;t+=4){ d += (t?"L":"M")+(x0+t)+","+(110 - p[2]*Math.sin(t/140*Math.PI*3)).toFixed(1); }
    b += '<path d="'+d+'" class="fx-acc"/>'+'<line x1="'+x0+'" y1="110" x2="'+(x0+140)+'" y2="110" class="fx-dash"/>';
    b += lines(p[1],212,p[0],"fx-t");
  });
  b += arrow(690,250,60,250); b += lines(375,270,"a kereslet ingadozása felnagyítódik a beszállítók felé","fx-s");
  return svg(720,286,b,"Ostorcsapás-hatás");
};

FIG.gravity = function(B, data, unit){
  unit = unit || "db";
  var pts = data || [["A",150,75,6000],["B",100,300,8200],["C",275,380,7000]], D = data ? null : [171.93,262.74];
  var mx = 400, my = 400; pts.forEach(function(p){ mx = Math.max(mx, p[1]+50); my = Math.max(my, p[2]+50); });
  mx = Math.ceil(mx/100)*100; my = Math.ceil(my/100)*100;
  var W = 520, H = 360, ox = 60, oy = 380, sx = function(v){ return ox + v/mx*W; }, sy = function(v){ return oy - v/my*H; };
  var b = '';
  for(var g=0; g<=mx; g+=100){ b += '<line x1="'+sx(g)+'" y1="'+sy(0)+'" x2="'+sx(g)+'" y2="'+sy(my)+'" class="fx-grid"/>'+lines(sx(g),oy+16,g,"fx-s"); }
  for(var h=100; h<=my; h+=100){ b += '<line x1="'+sx(0)+'" y1="'+sy(h)+'" x2="'+sx(mx)+'" y2="'+sy(h)+'" class="fx-grid"/>'+lines(ox-10,sy(h),h,"fx-s","end"); }
  var vmax = 0; pts.forEach(function(p){ vmax = Math.max(vmax, p[3]); });
  var placed = [];
  pts.forEach(function(p){
    var r = 8 + 16*Math.sqrt(p[3]/vmax), cx = sx(p[1]), cy = sy(p[2]);
    b += '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" class="fx-hi"/>'+lines(cx,cy,p[0],"fx-at");
    var txt = "["+p[1]+"; "+p[2]+"] · "+String(p[3]).replace(/\B(?=(\d{3})+(?!\d))/g," ")+" "+unit, tw = txt.length*7.8;
    var right = cx + r + 6 + tw <= 612, x0 = right ? cx + r + 6 : cx - r - 6 - tw, ly = cy;
    /* ütközés esetén lejjebb/feljebb tolás */
    for(var k=0;k<8;k++){
      var hit = placed.some(function(q){ return Math.abs(q.y - ly) < 18 && x0 < q.x1 && x0 + tw > q.x0; });
      if(!hit) break; ly = cy + (k%2 ? -1 : 1) * 20 * Math.ceil((k+1)/2);
    }
    placed.push({x0:x0, x1:x0+tw, y:ly});
    b += lines(right ? x0 : x0 + tw, ly, txt, "fx-s", right ? "start" : "end");
  });
  if(D){ b += '<path d="'+star(sx(D[0]),sy(D[1]),13)+'" class="fx-dark"/>'+lines(sx(D[0])+18,sy(D[1])+16,"D ≈ [172; 263]","fx-at","start"); }
  return svg(640,410,b,"Gravitációs központ");
};
function star(cx,cy,r){ var d=""; for(var i=0;i<10;i++){ var a=Math.PI/5*i-Math.PI/2, rr=i%2?r*.45:r; d+=(i?"L":"M")+(cx+rr*Math.cos(a)).toFixed(1)+","+(cy+rr*Math.sin(a)).toFixed(1); } return d+"Z"; }

window.FIG = FIG;
window.FIGCAP = {
  flow:"A tárgy logikája: a vevői érték az értékteremtés során jön létre, és a vevő ítéli meg.",
  pyramid:"Versenystratégiák – alulról felfelé egymásra épülnek.",
  formulas:"Az érték mérése: fent a haszon, lent a ráfordítás.",
  bmc:"Üzletimodell-vászon (Osterwalder–Pigneur) – 9 építőelem.",
  vpc:"Értékajánlat-vászon: értéktérkép (vállalat) és ügyfélprofil (vevő).",
  porter:"Porter értéklánca – 4 támogató és 5 elsődleges tevékenység.",
  ito:"A termelés mint transzformáció.",
  cycle:"A termelés menedzseri körfolyamata.",
  smile:"Mosolygörbe (Rekettye, 2018).",
  kraljic:"Kraljic-mátrix.",
  updown:"Az ellátási lánc részei: beszállítói és vevői oldal.",
  codp:"CODP szerinti vállalattípusok – a háromszög a szétkapcsolási pont.",
  bullwhip:"Ostorcsapás-hatás: a lánc elején a legnagyobb a kilengés.",
  gravity:"A mintafeladat üzletei és a D raktár helye. A kör mérete a forgalommal arányos."
};
})();
