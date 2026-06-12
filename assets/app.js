/* ============================================================
   MISSÃO: LISETE BIANCA ❤
   nave · estrelas · linha de Petrova · Rocky · pétalas · amor
   ============================================================ */
(function () {
'use strict';

document.documentElement.classList.add('js');
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

var REDUZIDO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var DPR = Math.min(window.devicePixelRatio || 1, 2);
var VW = window.innerWidth, VH = window.innerHeight;

var S = {
  bloom: 0,          // 0..1 — intensidade da linha de Petrova (momento rosa)
  petalas: false,    // chuva de pétalas ativa
  coracao: false,    // coração de partículas ativo
  iniciado: false,   // missão iniciada (depois do boot)
  tiltX: 0, tiltY: 0,
  scrollY: 0
};

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function rand(a, b) { return a + Math.random() * (b - a); }

/* ============================================================
   1 · CANVAS DO ESPAÇO — estrelas, nebulosa e linha de Petrova
   ============================================================ */
var spaceCv = document.getElementById('space-canvas');
var spaceCx = spaceCv.getContext('2d');
var estrelas = [], nebulosa = null;

function montarEspaco() {
  spaceCv.width = VW * DPR; spaceCv.height = VH * DPR;
  spaceCx.setTransform(DPR, 0, 0, DPR, 0, 0);
  estrelas = [];
  var n = Math.min(220, Math.round(VW * VH / 8500));
  for (var i = 0; i < n; i++) {
    var camada = i % 3; // 0 longe · 1 meio · 2 perto
    estrelas.push({
      x: Math.random() * VW,
      y: Math.random() * (VH * 2),
      r: camada === 2 ? rand(.9, 1.7) : camada === 1 ? rand(.6, 1.1) : rand(.3, .7),
      par: camada === 2 ? .16 : camada === 1 ? .08 : .03,
      tw: Math.random() * Math.PI * 2,
      tv: rand(.4, 1.4),
      rosa: Math.random() < .14
    });
  }
  // nebulosa pré-renderizada (barata de desenhar por frame)
  nebulosa = document.createElement('canvas');
  nebulosa.width = VW; nebulosa.height = VH;
  var nx = nebulosa.getContext('2d');
  var g1 = nx.createRadialGradient(VW * .78, VH * .16, 0, VW * .78, VH * .16, VW * .55);
  g1.addColorStop(0, 'rgba(255,45,120,.10)'); g1.addColorStop(1, 'rgba(255,45,120,0)');
  nx.fillStyle = g1; nx.fillRect(0, 0, VW, VH);
  var g2 = nx.createRadialGradient(VW * .14, VH * .82, 0, VW * .14, VH * .82, VW * .6);
  g2.addColorStop(0, 'rgba(96,38,170,.13)'); g2.addColorStop(1, 'rgba(96,38,170,0)');
  nx.fillStyle = g2; nx.fillRect(0, 0, VW, VH);
}

var petrovaPts = [];
function desenharEspaco(t) {
  spaceCx.clearRect(0, 0, VW, VH);
  spaceCx.drawImage(nebulosa, S.tiltX * 6, S.tiltY * 4);

  // estrelas com parallax (scroll + inclinação do tablet)
  var sy = S.scrollY;
  for (var i = 0; i < estrelas.length; i++) {
    var e = estrelas[i];
    var yy = ((e.y - sy * e.par) % VH + VH) % VH;
    var x = e.x + S.tiltX * 40 * e.par; if (x > VW + 10) x -= VW; if (x < -10) x += VW;
    var a = .35 + .65 * (0.5 + 0.5 * Math.sin(e.tw + t * e.tv));
    spaceCx.globalAlpha = a;
    spaceCx.fillStyle = e.rosa ? '#ffb6d9' : '#ece6fb';
    spaceCx.beginPath();
    spaceCx.arc(x, yy, e.r, 0, 6.2832);
    spaceCx.fill();
    if (e.rosa && e.r > 1) {
      spaceCx.globalAlpha = a * .35;
      spaceCx.beginPath(); spaceCx.arc(x, yy, e.r * 3, 0, 6.2832); spaceCx.fill();
    }
  }
  spaceCx.globalAlpha = 1;

  // linha de Petrova — a assinatura: fita de luz rosa que cruza tudo
  var bloom = S.bloom;
  var baseA = .16 + bloom * .8;
  var amp = VW * (.13 + bloom * .1);
  var cx = VW * .5;
  spaceCx.globalCompositeOperation = 'lighter';
  petrovaPts.length = 0;
  for (var y2 = -20; y2 <= VH + 20; y2 += 16) {
    var k = y2 * .0042;
    var x2 = cx + Math.sin(k + t * .5) * amp * .5 + Math.sin(k * 2.3 - t * .3) * amp * .22 + S.tiltX * 18;
    petrovaPts.push(x2, y2);
  }
  for (var passo = 0; passo < 3; passo++) {
    var lw = passo === 0 ? (26 + bloom * 90) : passo === 1 ? (8 + bloom * 30) : (2 + bloom * 6);
    var la = passo === 0 ? baseA * .12 : passo === 1 ? baseA * .3 : baseA * .85;
    spaceCx.strokeStyle = passo === 2 ? 'rgba(255,182,217,' + la + ')' : 'rgba(255,45,120,' + la + ')';
    spaceCx.lineWidth = lw;
    spaceCx.lineCap = 'round';
    spaceCx.beginPath();
    for (var p = 0; p < petrovaPts.length; p += 2) {
      if (p === 0) spaceCx.moveTo(petrovaPts[p], petrovaPts[p + 1]);
      else spaceCx.lineTo(petrovaPts[p], petrovaPts[p + 1]);
    }
    spaceCx.stroke();
  }
  // partículas de Astrophage navegando na linha
  for (var q = 0; q < 14; q++) {
    var ph = (t * (.05 + (q % 5) * .012) + q * .071) % 1;
    var py = ph * (VH + 40) - 20;
    var idx = clamp(Math.round(py / 16) * 2, 0, petrovaPts.length - 2);
    var px = petrovaPts[idx] + Math.sin(q * 9 + t) * (10 + 30 * (q % 3) / 2);
    spaceCx.globalAlpha = .5 + .5 * Math.sin(q + t * 2);
    spaceCx.fillStyle = q % 3 ? '#ff7eb3' : '#ffd6e8';
    spaceCx.beginPath(); spaceCx.arc(px, py, q % 3 ? 1.6 : 2.4, 0, 6.2832); spaceCx.fill();
  }
  spaceCx.globalAlpha = 1;
  spaceCx.globalCompositeOperation = 'source-over';
}

/* ============================================================
   2 · CANVAS DE EFEITOS — pétalas de rosa + coração de partículas
   ============================================================ */
var fxCv = document.getElementById('fx-canvas');
var fxCx = fxCv.getContext('2d');
var petalas = [], coracaoPts = [], coracaoCentro = { x: 0, y: 0 }, batidaForte = 0;

function montarFx() {
  fxCv.width = VW * DPR; fxCv.height = VH * DPR;
  fxCx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
function novaPetala(x, y, burst) {
  return {
    x: x !== undefined ? x : Math.random() * VW,
    y: y !== undefined ? y : -20,
    vx: burst ? rand(-3.4, 3.4) : rand(-.3, .3),
    vy: burst ? rand(-4.5, -1) : rand(.55, 1.5),
    rot: rand(0, 6.28), vr: rand(-.03, .03),
    sw: rand(0, 6.28), tam: rand(5, 11),
    cor: Math.random() < .5 ? '#ff5d97' : (Math.random() < .5 ? '#ffb6d9' : '#ff7eb3'),
    vida: 1
  };
}
function explodirPetalas(x, y, n) {
  for (var i = 0; i < n; i++) petalas.push(novaPetala(x + rand(-30, 30), y + rand(-20, 20), true));
}
function desenharFx(t, dt) {
  if (!petalas.length && !S.coracao && !S.petalas) { fxCx.clearRect(0, 0, VW, VH); return; }
  fxCx.clearRect(0, 0, VW, VH);

  // chuva contínua
  if (S.petalas && petalas.length < 70 && Math.random() < .35) petalas.push(novaPetala());

  for (var i = petalas.length - 1; i >= 0; i--) {
    var p = petalas[i];
    p.sw += dt * 2; p.rot += p.vr;
    p.x += p.vx + Math.sin(p.sw) * .9;
    p.y += p.vy; p.vy += p.vy < 1.6 ? .012 : 0;
    if (p.vx > .4) p.vx -= .04; if (p.vx < -.4) p.vx += .04;
    if (p.y > VH + 20) { petalas.splice(i, 1); continue; }
    fxCx.save();
    fxCx.translate(p.x, p.y); fxCx.rotate(p.rot);
    fxCx.globalAlpha = .82;
    fxCx.fillStyle = p.cor;
    fxCx.beginPath();
    fxCx.moveTo(0, -p.tam);
    fxCx.bezierCurveTo(p.tam * .9, -p.tam * .6, p.tam * .7, p.tam * .7, 0, p.tam);
    fxCx.bezierCurveTo(-p.tam * .7, p.tam * .7, -p.tam * .9, -p.tam * .6, 0, -p.tam);
    fxCx.fill();
    fxCx.restore();
  }

  // coração de partículas batendo (gran finale)
  if (S.coracao && coracaoPts.length) {
    var T = 1.05; // período da batida ~57bpm
    var fase = (t % T) / T;
    var pulso = Math.exp(-Math.pow(fase / .1, 2)) + .6 * Math.exp(-Math.pow((fase - .28) / .09, 2));
    var esc = (1 + .09 * pulso + batidaForte * .25);
    if (batidaForte > 0) batidaForte = Math.max(0, batidaForte - dt * 1.4);
    fxCx.globalCompositeOperation = 'lighter';
    for (var j = 0; j < coracaoPts.length; j++) {
      var c = coracaoPts[j];
      var wob = 1 + Math.sin(t * 1.7 + c.f) * .025;
      var hx = coracaoCentro.x + c.x * esc * wob;
      var hy = coracaoCentro.y + c.y * esc * wob;
      fxCx.globalAlpha = .35 + .5 * (0.5 + 0.5 * Math.sin(c.f * 3 + t * 2.2)) + pulso * .25;
      fxCx.fillStyle = j % 4 ? '#ff2d78' : '#ffd6e8';
      fxCx.beginPath(); fxCx.arc(hx, hy, c.r * (1 + pulso * .3), 0, 6.2832); fxCx.fill();
    }
    fxCx.globalAlpha = 1;
    fxCx.globalCompositeOperation = 'source-over';
  }
}
function montarCoracao() {
  coracaoPts = [];
  var R = Math.min(VW, 560) * .26;
  for (var i = 0; i < 130; i++) {
    var a = i / 130 * Math.PI * 2;
    // curva clássica do coração
    var hx = 16 * Math.pow(Math.sin(a), 3);
    var hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
    coracaoPts.push({ x: hx / 16 * R, y: hy / 16 * R, r: rand(1.2, 2.6), f: Math.random() * 6.28 });
  }
}

/* ============================================================
   3 · ROCKY — fiel ao filme/pelúcia
   Corpo: domo de pedra largo e achatado, base plana com saia,
   5 patas grossas saindo pra fora e dobradas pra baixo,
   pintinhas verdes emissivas, sem rosto.
   ============================================================ */
var rocky = null, rockyCena = null, rockyCam = null, rockyGl = null;
var rockyPartes = { carapaca: null, pintas: [], ombros: [], cotos: [], patas: [] };
var rockyAlvo = { x: .5, y: .8, s: 0 };
var rockyVivo = false;

function texturaPedra() {
  var cv = document.createElement('canvas'); cv.width = cv.height = 512;
  var c = cv.getContext('2d');
  c.fillStyle = '#9e7a4a'; c.fillRect(0,0,512,512);
  for (var i = 0; i < 700; i++) {
    c.globalAlpha = rand(.015,.09);
    c.fillStyle = Math.random()<.35 ? '#5c3a18' : Math.random()<.5 ? '#c8a06a' : '#7a5530';
    var r = rand(3,28), x = rand(0,512), y = rand(0,512);
    c.beginPath(); c.arc(x,y,r,0,6.283); c.fill();
  }
  c.globalAlpha = .65; c.strokeStyle = '#382010'; c.lineCap='round';
  for (var j = 0; j < 48; j++) {
    c.lineWidth = rand(.3,1.8);
    var x0=rand(0,512), y0=rand(0,512);
    c.beginPath(); c.moveTo(x0,y0);
    for (var k=0; k<2+Math.floor(Math.random()*4); k++) { x0+=rand(-38,38); y0+=rand(-28,38); c.lineTo(x0,y0); }
    c.stroke();
  }
  c.globalAlpha=1;
  var t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2,2);
  return t;
}

function montarRocky() {
  var cv = document.getElementById('rocky-canvas');
  try { rockyGl = new THREE.WebGLRenderer({ canvas:cv, alpha:true, antialias:true }); }
  catch(e) { cv.style.display='none'; return; }
  rockyGl.setPixelRatio(Math.min(DPR,2));
  rockyGl.setSize(VW,VH);

  rockyCena = new THREE.Scene();
  // Vista de 3/4 levemente de cima — exatamente como nas fotos de referência
  rockyCam = new THREE.PerspectiveCamera(34, VW/VH, .05, 60);
  rockyCam.position.set(1.2, 2.2, 5.8);
  rockyCam.lookAt(0, 0.1, 0);

  rockyCena.add(new THREE.AmbientLight(0x1a0d2e, 2.2));
  // Luz rosa Astrophage lateral esquerda (como no site)
  var lR = new THREE.PointLight(0xff2d78, 4.0, 35); lR.position.set(-3,1.5,2); rockyCena.add(lR);
  // Luz fria de cima direita (destaca o topo do domo)
  var lF = new THREE.DirectionalLight(0xc8e0ff, 1.4); lF.position.set(2,5,3); rockyCena.add(lF);
  // Luz quente de baixo (preenche as patas)
  var lB = new THREE.PointLight(0xff9960, 0.7, 14); lB.position.set(0,-2.5,1); rockyCena.add(lB);

  var tex = texturaPedra();
  var MAT = new THREE.MeshStandardMaterial({ map:tex, bumpMap:tex, bumpScale:.05, roughness:.86, metalness:.06, color:0xc4924e });
  var MAT_J = new THREE.MeshStandardMaterial({ map:tex, roughness:.9, metalness:.04, color:0xa87840 }); // articulações mais escuras
  var MAT_P = new THREE.MeshStandardMaterial({ color:0x04160a, emissive:0x00ff80, emissiveIntensity:3.0, roughness:.3 });

  rocky = new THREE.Group();
  rocky.scale.set(.001,.001,.001);
  rockyCena.add(rocky);

  // ── CORPO PRINCIPAL ──────────────────────────────────────
  // Rocky tem um domo alto e oval, levemente achatado frente-atrás,
  // com uma "saia" na base que esconde onde as patas se juntam.

  // Domo principal (metade superior de um ovóide)
  var domoGeo = new THREE.SphereGeometry(1, 44, 32, 0, Math.PI*2, 0, Math.PI*0.65);
  var pos = domoGeo.attributes.position;
  for (var vi=0; vi<pos.count; vi++) {
    var vx=pos.getX(vi), vy=pos.getY(vi), vz=pos.getZ(vi);
    pos.setXYZ(vi, vx*1.18, vy*1.0, vz*0.92); // mais largo X, levemente comprimido Z
  }
  domoGeo.computeVertexNormals();
  var domo = new THREE.Mesh(domoGeo, MAT.clone());
  domo.position.y = 0.22;
  rocky.add(domo);
  rockyPartes.carapaca = domo;

  // Saia da base (torus achatado que esconde as juntas das patas)
  var saiaGeo = new THREE.TorusGeometry(0.85, 0.22, 10, 36);
  var saiaPos = saiaGeo.attributes.position;
  for (var si=0; si<saiaPos.count; si++) {
    saiaPos.setY(si, saiaPos.getY(si)*0.4); // achata
    saiaPos.setX(si, saiaPos.getX(si)*1.1); // alarga
  }
  saiaGeo.computeVertexNormals();
  var saia = new THREE.Mesh(saiaGeo, MAT.clone());
  saia.position.y = -0.18;
  rocky.add(saia);

  // ── PINTINHAS VERDES ──────────────────────────────────────
  // Espalhadas pelo domo — luminosas como vagalumes
  var PP = [
    [0,1,0], [.7,.7,0], [-.65,.72,0], [.45,.85,.35], [-.42,.82,-.38],
    [.9,.35,.2], [-.88,.38,-.15], [.3,.6,.8], [-.28,.58,-.82], [.5,.5,-.6]
  ];
  PP.forEach(function(p) {
    var len=Math.sqrt(p[0]*p[0]+p[1]*p[1]+p[2]*p[2]);
    var nx=p[0]/len, ny=p[1]/len, nz=p[2]/len;
    var pin=new THREE.Mesh(new THREE.SphereGeometry(.052,8,6), MAT_P.clone());
    pin.position.set(nx*1.20, ny*1.02+0.22, nz*0.94);
    rocky.add(pin);
    rockyPartes.pintas.push(pin);
  });

  // ── 5 PATAS ───────────────────────────────────────────────
  // Cada pata: ombro grosso saindo pra fora e levemente pra cima →
  //            joelho dobrando pra baixo →
  //            canela descendo reta →
  //            pé arredondado tocando o chão.
  // Referência pelúcia: patas bem grossas na raiz, afinando na ponta.

  for (var pi=0; pi<5; pi++) {
    var ang = pi/5 * Math.PI*2 + Math.PI/10; // offset de 36° pra nenhuma pata ficar exatamente na frente
    var ca=Math.cos(ang), sa=Math.sin(ang);

    // Pivô de toda a pata — fica na borda lateral da saia
    var pGrp = new THREE.Group();
    pGrp.position.set(ca*0.82, -0.18, sa*0.72);
    pGrp.rotation.y = -ang; // aponta pra fora
    rocky.add(pGrp);

    // ── Ombro (pivô de animação)
    var oGrp = new THREE.Group();
    pGrp.add(oGrp);
    // Ângulo base: abre a pata pra fora (Z) e levanta um pouco
    oGrp.rotation.z = -1.0;   // abre pra fora
    oGrp.rotation.x = 0.12;   // leve inclinação frontal dependendo do ângulo

    // Bola do ombro
    oGrp.add(new THREE.Mesh(new THREE.SphereGeometry(.175,12,9), MAT_J.clone()));

    // Braço superior (coxa) — grosso, longo
    var coxaGeo = new THREE.CylinderGeometry(.155,.118,.90,12);
    coxaGeo.translate(0,-.45,0);
    oGrp.add(new THREE.Mesh(coxaGeo, MAT.clone()));

    // ── Joelho
    var jGrp = new THREE.Group();
    jGrp.position.set(0,-.90,0);
    oGrp.add(jGrp);
    jGrp.rotation.z = 0.78; // dobra pra baixo

    jGrp.add(new THREE.Mesh(new THREE.SphereGeometry(.135,11,8), MAT_J.clone()));

    // Canela — mais fina, aponta pro chão
    var canelaGeo = new THREE.CylinderGeometry(.105,.072,.82,12);
    canelaGeo.translate(0,-.41,0);
    jGrp.add(new THREE.Mesh(canelaGeo, MAT.clone()));

    // Pé arredondado
    var pe = new THREE.Mesh(new THREE.SphereGeometry(.098,10,8), MAT_J.clone());
    pe.scale.set(1.1,.62,1.2);
    pe.position.set(0,-.82,0);
    jGrp.add(pe);

    // Pinta na coxa
    var pp = new THREE.Mesh(new THREE.SphereGeometry(.042,7,6), MAT_P.clone());
    pp.position.set(.14,-.38,.06);
    oGrp.add(pp);
    rockyPartes.pintas.push(pp);

    rockyPartes.ombros.push(oGrp);
    rockyPartes.cotos.push(jGrp);
    rockyPartes.patas.push(pGrp);
  }

  rockyVivo = true;
}

function anchorParaMundo(ax, ay, z) {
  var dist = rockyCam.position.z - (z || 0);
  var meiaAltura = Math.tan(35 * Math.PI / 360) * dist;
  var meiaLarg = meiaAltura * (VW / VH);
  return { x: (ax * 2 - 1) * meiaLarg, y: -(ay * 2 - 1) * meiaAltura };
}

function rockyIr(ax, ay, s, dur) {
  if (!rockyVivo) return;
  gsap.to(rockyAlvo, { x: ax, y: ay, s: s, duration: dur || 1.2, ease: 'power2.inOut', overwrite: 'auto' });
}

function rockyAcena() {
  if (!rockyVivo || !rockyPartes.ombros.length) return;
  var o = rockyPartes.ombros[0];
  gsap.timeline()
    .to(o.rotation, { z: -2.0, duration: .4, ease: 'power2.out' })
    .to(o.rotation, { z: -1.5, duration: .2, ease: 'sine.inOut' })
    .to(o.rotation, { z: -2.0, duration: .2, ease: 'sine.inOut' })
    .to(o.rotation, { z: -1.5, duration: .2, ease: 'sine.inOut' })
    .to(o.rotation, { z: -1.0, duration: .5, ease: 'power2.inOut' });
}
function rockyPula() {
  if (!rockyVivo) return;
  gsap.timeline()
    .to(rocky.scale, { y: rockyAlvo.s * .82, duration: .14, ease: 'power2.in' })
    .to(rocky.scale, { y: rockyAlvo.s * 1.08, duration: .18 })
    .to(rocky.position, { y: '+=.5', duration: .24, ease: 'power2.out' }, '<')
    .to(rocky.position, { y: '-=.5', duration: .34, ease: 'bounce.out' })
    .to(rocky.scale, { y: rockyAlvo.s, duration: .2 }, '<');
}
function rockyCurioso() {
  if (!rockyVivo) return;
  // Inclina o corpo inteiro (eixo Z = horizontal world por causa do rotation.x = -PI/2)
  gsap.timeline()
    .to(rocky.rotation, { z: .22, duration: .5, ease: 'power2.inOut' })
    .to(rocky.rotation, { z: 0,   duration: .65, ease: 'elastic.out(1,.5)', delay: .5 });
}
function rockyBump(aoTerminar) {
  if (!rockyVivo) { if (aoTerminar) aoTerminar(); return; }
  var o = rockyPartes.ombros.length ? rockyPartes.ombros[0] : null;
  var tl = gsap.timeline({
    onComplete: function () {
      rockyIr(.8, .78, .55, 1.2);
      if (aoTerminar) aoTerminar();
    }
  });
  tl.to(rockyAlvo, { x: .5, y: .52, s: 1.5, duration: .8, ease: 'power2.inOut' }, 0);
  if (o) {
    tl.to(o.rotation, { z: -2.2, duration: .4, ease: 'power3.out' }, .55)
      .to(rockyAlvo, { s: 2.0, duration: .28, ease: 'power3.in' }, .7)
      .to(rockyAlvo, { s: 1.1, duration: .7, ease: 'elastic.out(1,.6)' }, 1.05)
      .to(o.rotation, { z: -1.0, duration: .6, ease: 'power2.inOut' }, 1.1);
  }
  tl.to(rockyAlvo, { s: 1.1, duration: .7, ease: 'elastic.out(1,.6)' }, 1.05);
}

/* ===== fala do Rocky — por música, como no filme ===== */
var bolha = document.getElementById('rocky-bubble');
var bolhaTexto = document.getElementById('rocky-bubble-text');
var bolhaTimer = null, notaTimer = null;

function rockySay(texto, dur) {
  bolhaTexto.textContent = texto;
  bolha.hidden = false;
  bolha.classList.remove('saindo');
  posicionarBolha();
  requestAnimationFrame(function () { bolha.classList.add('ativa'); });
  if (!REDUZIDO) {
    rockyCurioso();
    clearInterval(notaTimer);
    var notas = 0;
    notaTimer = setInterval(function () {
      if (++notas > 5) { clearInterval(notaTimer); return; }
      soltarNota();
    }, 420);
  }
  clearTimeout(bolhaTimer);
  bolhaTimer = setTimeout(function () {
    bolha.classList.add('saindo'); bolha.classList.remove('ativa');
    setTimeout(function () { bolha.hidden = true; }, 350);
  }, dur || 4200);
}
function posicionarBolha() {
  var bx = rockyAlvo.x * VW, by = rockyAlvo.y * VH - rockyAlvo.s * 130 - 30;
  bolha.style.left = clamp(bx - 40, 12, VW - Math.min(250, VW * .7) - 12) + 'px';
  bolha.style.top = clamp(by - 60, 14, VH - 160) + 'px';
}
function soltarNota() {
  var n = document.createElement('span');
  n.className = 'nota-musical';
  n.textContent = Math.random() < .5 ? '♪' : '♫';
  n.style.left = (rockyAlvo.x * VW + rand(-40, 50)) + 'px';
  n.style.top = (rockyAlvo.y * VH - rockyAlvo.s * 110 + rand(-10, 20)) + 'px';
  document.body.appendChild(n);
  setTimeout(function () { n.remove(); }, 2400);
}

/* ============================================================
   4 · LOOP PRINCIPAL
   ============================================================ */
var t0 = performance.now(), tAnt = t0;
function loop(agora) {
  var t = (agora - t0) / 1000;
  var dt = Math.min(.05, (agora - tAnt) / 1000); tAnt = agora;
  S.scrollY = window.pageYOffset;

  desenharEspaco(t);
  desenharFx(t, dt);

  if (rockyVivo) {
    var m = anchorParaMundo(rockyAlvo.x, rockyAlvo.y, 0);
    var s = rockyAlvo.s;
    rocky.position.x = m.x;
    rocky.position.y += ((m.y + Math.sin(t * 1.3) * .07 * s) - rocky.position.y) * .2;
    rocky.scale.x += (s - rocky.scale.x) * .18;
    // Y/Z escalam junto mas mantemos a rotação x=-PI/2, então scale Y/Z são world Z/Y
    rocky.scale.y += (s - rocky.scale.y) * .18;
    rocky.scale.z += (s - rocky.scale.z) * .18;
    // Respiração: domo sobe e desce levemente
    if (rockyPartes.carapaca) {
      var br = 1 + Math.sin(t * 1.2) * 0.022;
      rockyPartes.carapaca.scale.set(br, br*0.97, br);
    }
    // Balanço suave de lado a lado
    rocky.rotation.y = Math.sin(t * 0.42) * 0.14;
    // Ondulação idle das patas — onda sequencial
    for (var i = 0; i < rockyPartes.ombros.length; i++) {
      var off = i * (Math.PI * 2 / 5);
      rockyPartes.ombros[i].rotation.z = -1.0 + Math.sin(t * 1.05 + off) * 0.07;
      if (rockyPartes.cotos[i]) {
        rockyPartes.cotos[i].rotation.z = 0.78 + Math.sin(t * 1.05 + off + 0.5) * 0.05;
      }
    }
    // Pintinhas pulsando
    for (var pi = 0; pi < rockyPartes.pintas.length; pi++) {
      rockyPartes.pintas[pi].material.emissiveIntensity = 1.4 + 0.8 * (0.5 + 0.5 * Math.sin(t * 2.2 + pi * 1.9));
    }
    if (s > .01) rockyGl.render(rockyCena, rockyCam);
    if (!bolha.hidden) posicionarBolha();
  }
  requestAnimationFrame(loop);
}

/* ============================================================
   5 · BOOT — console da nave + início da missão
   ============================================================ */
var LINHAS_BOOT = [
  ['> HAIL MARY · SISTEMA DE BORDO · v05.02.2026', ''],
  ['> calibrando motores de Astrophage ............ ', 'ok'],
  ['> carregando todas as nossas memórias ......... ', 'ok'],
  ['> sincronizando música: Sign of the Times ..... ', 'ok'],
  ['> procurando a estrela mais linda do universo . ', 'encontrada'],
  ['> identificação: ', 'LISETE BIANCA ❤'],
  ['> astronauta de plantão: Lucas Guilherme — nível de paixão: máximo', ''],
  ['> objetivo: te fazer sorrir até o fim do universo', ''],
  ['> status: pronto pra decolar', '']
];
var bootEl = document.getElementById('boot');
var consoleEl = document.getElementById('boot-console');
var lockEl = document.getElementById('boot-lock');

function digitarBoot(fim) {
  if (REDUZIDO) {
    consoleEl.innerHTML = LINHAS_BOOT.map(function (l) {
      var extra = l[1] ? '<span class="' + (l[1] === 'ok' ? 'ok' : 'rosa') + '">' + l[1] + '</span>' : '';
      return l[0] + extra;
    }).join('\n');
    fim();
    return;
  }
  var li = 0;
  function proximaLinha() {
    if (li >= LINHAS_BOOT.length) { fim(); return; }
    var linha = LINHAS_BOOT[li], ci = 0;
    var span = document.createElement('div');
    consoleEl.appendChild(span);
    var iv = setInterval(function () {
      ci += 2;
      span.textContent = linha[0].slice(0, ci);
      if (ci >= linha[0].length) {
        clearInterval(iv);
        if (linha[1]) {
          var ok = document.createElement('span');
          ok.className = linha[1] === 'ok' ? 'ok' : 'rosa';
          ok.textContent = linha[1];
          span.appendChild(ok);
        }
        li++;
        setTimeout(proximaLinha, li === 5 ? 360 : 130);
      }
    }, 14);
  }
  proximaLinha();
}

/* ============================================================
   6 · MÚSICA
   ============================================================ */
var musica = document.getElementById('musica');
var audioBtn = document.getElementById('audio-btn');
var iconOn = document.getElementById('icon-on');
var iconOff = document.getElementById('icon-off');
var tocando = false;

function ligarMusica() {
  musica.volume = 0;
  var p = musica.play();
  if (p && p.catch) p.catch(function () { });
  gsap.to(musica, { volume: .85, duration: 3.5, ease: 'sine.in' });
  tocando = true;
  audioBtn.hidden = false;
}
audioBtn.addEventListener('click', function () {
  if (tocando) {
    gsap.to(musica, { volume: 0, duration: .6, onComplete: function () { musica.pause(); } });
    iconOn.hidden = true; iconOff.hidden = false;
    tocando = false;
  } else {
    musica.play();
    gsap.to(musica, { volume: .85, duration: 1.2 });
    iconOn.hidden = false; iconOff.hidden = true;
    tocando = true;
  }
});

/* ============================================================
   7 · CONTADOR — tempo de missão
   ============================================================ */
var INICIO = new Date(2026, 1, 5, 0, 0, 0); // 05/02/2026
function pad(n) { return n < 10 ? '0' + n : '' + n; }
function atualizarContador() {
  var diff = Math.max(0, Date.now() - INICIO.getTime());
  var seg = Math.floor(diff / 1000);
  var dias = Math.floor(seg / 86400);
  var h = Math.floor(seg % 86400 / 3600), mi = Math.floor(seg % 3600 / 60), ss = seg % 60;
  document.getElementById('t-dias').textContent = dias;
  document.getElementById('t-horas').textContent = pad(h);
  document.getElementById('t-min').textContent = pad(mi);
  document.getElementById('t-seg').textContent = pad(ss);
  document.getElementById('t-frase').textContent = 'T+ ' + dias + ' dias orbitando você';
}
setInterval(atualizarContador, 1000);
atualizarContador();

/* ============================================================
   8 · CONSTELAÇÃO DE MEMÓRIAS
   ============================================================ */
var MEMS = ['mem-img_4259', 'mem-img_4260', 'mem-img_4263', 'mem-img_4418', 'mem-img_4419',
  'mem-img_4524', 'mem-img_4667', 'mem-img_4668', 'mem-img_4721', 'mem-img_4797',
  'mem-img_4805', 'mem-img_4808', 'mem-img_4830', 'mem-img_4831', 'mem-img_4989',
  'mem-img_5039', 'mem-img_5567', 'mem-img_5829', 'mem-img_5875', 'mem-img_5981',
  'mem-img_5988', 'mem-img_6385', 'mem-img_6389', 'mem-img_6397'];

var campo = document.getElementById('campo-estelar');
var svgLinhas = document.getElementById('constelacao-linhas');
var nosConst = [];

function montarConstelacao() {
  for (var i = 0; i < MEMS.length; i++) {
    var b = document.createElement('button');
    b.className = 'estrela-mem';
    b.type = 'button';
    b.setAttribute('aria-label', 'Abrir memória ' + (i + 1));
    var px = (i % 2 ? 70 : 30) + Math.sin(i * 2.7) * 17;
    var py = 3 + i * (94 / (MEMS.length - 1));
    b.style.left = px + '%';
    b.style.top = py + '%';
    b.style.animationDelay = (-i * 1.3) + 's';
    var img = document.createElement('img');
    img.loading = 'lazy';
    img.src = 'assets/' + MEMS[i] + '.jpg';
    img.alt = 'Memória nossa nº ' + (i + 1);
    b.appendChild(img);
    (function (src, idx) {
      b.addEventListener('click', function () { abrirLightbox(src, idx); });
    })('assets/' + MEMS[i] + '.jpg', i);
    campo.appendChild(b);
    nosConst.push(b);
  }
  desenharLinhasConst();
}
function desenharLinhasConst() {
  var w = campo.offsetWidth, h = campo.offsetHeight;
  svgLinhas.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  var d = '';
  for (var i = 0; i < nosConst.length; i++) {
    var x = parseFloat(nosConst[i].style.left) / 100 * w;
    var y = parseFloat(nosConst[i].style.top) / 100 * h;
    d += (i ? ' L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
  }
  svgLinhas.innerHTML = '<path d="' + d + '"/>';
}

var lightbox = document.getElementById('lightbox');
var lightboxImg = document.getElementById('lightbox-img');
var lightboxCap = document.getElementById('lightbox-cap');
function abrirLightbox(src, idx) {
  lightboxImg.src = src;
  lightboxCap.textContent = 'memória nº ' + (idx + 1) + ' · recuperada do coração da nave';
  lightbox.hidden = false;
  gsap.fromTo(lightbox, { opacity: 0 }, { opacity: 1, duration: .3 });
  gsap.fromTo(lightboxImg, { scale: .88 }, { scale: 1, duration: .45, ease: 'power3.out' });
}
function fecharLightbox() {
  gsap.to(lightbox, { opacity: 0, duration: .25, onComplete: function () { lightbox.hidden = true; } });
}
lightbox.addEventListener('click', fecharLightbox);
document.getElementById('lightbox-fechar').addEventListener('click', fecharLightbox);

/* ============================================================
   9 · SCROLL — revelações, momento rosa, âncoras do Rocky
   ============================================================ */
function dividirPalavras(el) {
  var partes = el.textContent.split(/\s+/);
  el.innerHTML = partes.map(function (w) { return '<span class="palavra">' + w + '</span>'; }).join(' ');
}

function montarScroll() {
  gsap.registerPlugin(ScrollTrigger);

  if (!REDUZIDO) {
    // textos palavra por palavra
    document.querySelectorAll('.reveal-words').forEach(function (el) {
      dividirPalavras(el);
      gsap.to(el.querySelectorAll('.palavra'), {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: .9, stagger: .045, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 78%', once: true }
      });
    });
    // blocos
    document.querySelectorAll('.reveal').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });
    // fotos: revelação cinematográfica
    document.querySelectorAll('.reveal-foto').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 90, scale: .9, rotate: -2.5 }, {
        opacity: 1, y: 0, scale: 1, rotate: 0, duration: 1.5, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 82%', once: true }
      });
    });
  } else {
    gsap.set('.reveal,.reveal-foto', { opacity: 1 });
  }

  // ===== momento rosa: a tela inteira vira luz Astrophage =====
  var rosaSec = document.getElementById('rosa');
  if (!REDUZIDO) {
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: rosaSec, start: 'top top', end: 'bottom bottom', scrub: .6,
        onUpdate: function (self) {
          S.petalas = self.progress > .3 && self.progress < .97 && self.isActive;
          if (self.progress > .42) rosaSec.classList.add('acesa'); else rosaSec.classList.remove('acesa');
        },
        onLeave: function () { S.petalas = false; },
        onLeaveBack: function () { S.petalas = false; S.bloom = 0; }
      }
    });
    tl.to(S, { bloom: 1, duration: .3, ease: 'sine.in' }, 0)
      .fromTo('#rosa-l1', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .12 }, .05)
      .to('#rosa-overlay', { opacity: 1, duration: .25 }, .18)
      .fromTo('#rosa-l2', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .12 }, .2)
      .fromTo('#rosa-l3', { opacity: 0, scale: .92 }, { opacity: 1, scale: 1, duration: .16 }, .45)
      .fromTo('#rosa-l4', { opacity: 0 }, { opacity: 1, duration: .1 }, .68)
      .to({}, { duration: .08 }, .82)
      .to('#rosa-overlay', { opacity: 0, duration: .1 }, .9)
      .to(S, { bloom: 0, duration: .1 }, .9);
  }

  // ===== trajetória da missão (progresso de scroll) =====
  var fill = document.getElementById('trajetoria-fill');
  var nave = document.getElementById('trajetoria-nave');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: function (self) {
      var pc = (self.progress * 100).toFixed(2) + '%';
      fill.style.width = pc;
      nave.style.left = pc;
    }
  });

  // ===== coração de partículas no fim =====
  var fimEl = document.getElementById('tmais');
  ScrollTrigger.create({
    trigger: '#fim', start: 'top 95%', end: 'bottom -20%',
    onToggle: function (self) {
      S.coracao = self.isActive && !REDUZIDO;
      if (S.coracao) {
        var r = fimEl.getBoundingClientRect();
        coracaoCentro.x = r.left + r.width / 2;
        coracaoCentro.y = r.top + r.height / 2 + 10;
      }
    },
    onUpdate: function () {
      if (S.coracao) {
        var r = fimEl.getBoundingClientRect();
        coracaoCentro.x = r.left + r.width / 2;
        coracaoCentro.y = r.top + r.height / 2 + 10;
      }
    }
  });

  // ===== âncoras do Rocky pelas seções =====
  var paradas = [
    { sel: '#abertura', x: .79, y: .84, s: .5, fala: 'Pergunta: você sabia que o Lucas te ama infinito? Resposta: agora sabe. ♫' },
    { sel: '#cap1', x: .84, y: .88, s: .42, fala: '♪ Humana colorindo. Concentração máxima. Amaze! ♪' },
    { sel: '#cap2', x: 0, y: 0, s: 0 },
    { sel: '#cap3', x: .16, y: .88, s: .42, fala: 'Pergunta: caneta sai com água? Resposta: do coração, nunca. ♫' },
    { sel: '#cap4', x: 0, y: 0, s: 0 },
    { sel: '#cap5', x: 0, y: 0, s: 0 },
    { sel: '#constelacao', x: .85, y: .9, s: .42, fala: '♫ Quantas estrelas! Espera… são todas vocês dois! ♫' },
    { sel: '#relatorio', x: .15, y: .9, s: .42, fala: '♪ Telemetria verificada: o amor passou do limite do sensor. ♪' },
    { sel: '#rosa', x: 0, y: 0, s: 0 },
    { sel: '#final', x: .8, y: .76, s: .6, fala: '♫ Hora do soquinho! Aperta o botão! ♫' }
  ];
  paradas.forEach(function (cfg) {
    ScrollTrigger.create({
      trigger: cfg.sel, start: 'top 55%', end: 'bottom 45%',
      onToggle: function (self) {
        if (!self.isActive || !S.iniciado) return;
        if (cfg.s > 0) {
          rockyIr(cfg.x, cfg.y, cfg.s);
          if (cfg.fala && !cfg.falou) {
            cfg.falou = true;
            setTimeout(function () { rockySay(cfg.fala); if (!REDUZIDO) rockyPula(); }, 900);
          }
        } else {
          rockyIr(rockyAlvo.x, 1.18, 0, .8); // sai de cena
        }
      }
    });
  });
}

/* ============================================================
   10 · SOQUINHO (fist my bump!) + flash
   ============================================================ */
document.getElementById('btn-bump').addEventListener('click', function () {
  var btn = this;
  btn.disabled = true;
  rockySay('Fist my bump! ✊ ♫', 3200);
  rockyBump(function () { btn.disabled = false; });
  setTimeout(function () {
    gsap.fromTo('#flash', { opacity: 0 }, { opacity: 1, duration: .12, yoyo: true, repeat: 1 });
    explodirPetalas(VW / 2, VH / 2, 56);
    batidaForte = 1;
    if (!REDUZIDO) {
      gsap.fromTo('.final-inner', { x: -7 }, { x: 0, duration: .5, ease: 'elastic.out(1,.3)' });
    }
  }, 950);
});

/* ============================================================
   11 · PARALLAX por toque/inclinação (sem hover — é tablet!)
   ============================================================ */
window.addEventListener('deviceorientation', function (ev) {
  if (ev.gamma === null) return;
  S.tiltX += ((clamp(ev.gamma, -30, 30) / 30) - S.tiltX) * .06;
  S.tiltY += ((clamp(ev.beta - 40, -30, 30) / 30) - S.tiltY) * .06;
}, true);
var toqueX = null;
window.addEventListener('touchstart', function (ev) { toqueX = ev.touches[0].clientX; }, { passive: true });
window.addEventListener('touchmove', function (ev) {
  if (toqueX === null) return;
  var dx = (ev.touches[0].clientX - toqueX) / VW;
  S.tiltX = clamp(S.tiltX + dx * .5, -1, 1);
  toqueX = ev.touches[0].clientX;
}, { passive: true });
window.addEventListener('touchend', function () {
  toqueX = null;
  gsap.to(S, { tiltX: 0, duration: 2, ease: 'sine.out', overwrite: 'auto' });
}, { passive: true });

/* ============================================================
   12 · RESIZE
   ============================================================ */
var resizeTimer = null;
window.addEventListener('resize', function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function () {
    VW = window.innerWidth; VH = window.innerHeight;
    montarEspaco(); montarFx(); montarCoracao();
    if (rockyVivo) {
      rockyGl.setSize(VW, VH);
      rockyCam.aspect = VW / VH;
      rockyCam.updateProjectionMatrix();
    }
    desenharLinhasConst();
    ScrollTrigger.refresh();
  }, 250);
});

/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */
function init() {
  window.scrollTo(0, 0);
  document.body.classList.add('travado');
  montarEspaco();
  montarFx();
  montarCoracao();
  montarRocky();
  montarConstelacao();
  montarScroll();

  // posição do Rocky na tela de boot
  var retrato = VW / VH < .85;
  var bootAnchor = retrato ? { x: .5, y: .82, s: .72 } : { x: .78, y: .6, s: .95 };

  digitarBoot(function () {
    rockyIr(bootAnchor.x, bootAnchor.y, bootAnchor.s, 1.4);
    gsap.to(lockEl, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: .2 });
    setTimeout(function () {
      rockySay('♫ Bem-vinda a bordo, tripulante Lisete Bianca! ♫', 5000);
      rockyAcena();
    }, 1300);
  });

  if (!REDUZIDO) {
    requestAnimationFrame(loop);
  } else {
    // versão estática e graciosa
    desenharEspaco(1.5);
    if (rockyVivo) {
      rocky.scale.set(.001, .001, .001);
    }
  }

  document.getElementById('btn-iniciar').addEventListener('click', function () {
    if (S.iniciado) return;
    S.iniciado = true;
    ligarMusica();
    rockySay('Amaze! ♪', 2600);
    if (!REDUZIDO) rockyPula();
    gsap.to(bootEl, {
      opacity: 0, duration: 1.4, ease: 'power2.inOut', delay: .4,
      onComplete: function () {
        bootEl.style.display = 'none';
        document.body.classList.remove('travado');
        ScrollTrigger.refresh();
        rockyIr(.82, .84, .5, 1.6);
        if (REDUZIDO && rockyVivo) {
          rocky.scale.set(.5, .5, .5);
          var m = anchorParaMundo(.82, .84, 0);
          rocky.position.set(m.x, m.y, 0);
          rockyGl.render(rockyCena, rockyCam);
        }
      }
    });
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
