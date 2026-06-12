/* ============================================================
   MISSÃO: LISETE BIANCA ❤  ·  app v2
   céu de estrelas · linha de Petrova · Rocky (foto) · scroll · música
   ============================================================ */
(function () {
'use strict';

var REDUZIDO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var DPR = Math.min(window.devicePixelRatio || 1, 2);
var VW = innerWidth, VH = innerHeight;
var iniciado = false;

function clamp(v,a,b){return v<a?a:(v>b?b:v);}
function rand(a,b){return a+Math.random()*(b-a);}

/* ============================================================
   1 · CÉU — espaço vivo: nebulosa que respira, estrelas em
   profundidade, poeira cósmica, cometas e a linha de Petrova
   ============================================================ */
var cv = document.getElementById('ceu');
var cx = cv.getContext('2d');
var estrelas = [], poeira = [], nuvens = [], cometas = [];
var bloom = 0;           // 0..1 intensidade da linha rosa (momento rosa)
var scrollY = 0;

function montarCeu(){
  cv.width = VW*DPR; cv.height = VH*DPR;
  cx.setTransform(DPR,0,0,DPR,0,0);

  // estrelas em 3 camadas de profundidade
  estrelas = [];
  var n = Math.min(260, Math.round(VW*VH/7000));
  for (var i=0;i<n;i++){
    var c = i%3;
    estrelas.push({
      x:Math.random()*VW, y:Math.random()*VH*2,
      r: c===2?rand(1.0,1.9):c===1?rand(.6,1.1):rand(.3,.7),
      par: c===2?.22:c===1?.10:.04,
      tw:Math.random()*6.28, tv:rand(.4,1.4),
      rosa:Math.random()<.14
    });
  }

  // poeira cósmica — partículas lentas que dão sensação de movimento
  poeira = [];
  for (var d=0; d<48; d++){
    poeira.push({
      x:Math.random()*VW, y:Math.random()*VH,
      vx:rand(-.08,.08), vy:rand(.05,.22),
      r:rand(.4,1.3), a:rand(.04,.16), rosa:Math.random()<.5
    });
  }

  // nuvens de nebulosa que respiram, flutuam e derivam pela tela
  // amp = amplitude do passeio (fração da tela); vel = velocidade
  nuvens = [
    {x:.76,y:.16, r:.55, cor:'255,45,120',  base:.13, amp:.10, vel:.07, fr:.18, ph:0},
    {x:.16,y:.82, r:.62, cor:'120,60,200',  base:.15, amp:.12, vel:.05, fr:.20, ph:2.1},
    {x:.50,y:.45, r:.48, cor:'255,126,179', base:.07, amp:.14, vel:.09, fr:.22, ph:4.0},
    {x:.90,y:.70, r:.42, cor:'52,211,153',  base:.05, amp:.09, vel:.06, fr:.16, ph:1.0}
  ];

  cometas = [];
}

function talvezCometa(t){
  if (cometas.length<2 && Math.random()<.004){
    var fromLeft = Math.random()<.5;
    cometas.push({
      x: fromLeft?-40:VW+40, y:rand(0,VH*.5),
      vx:(fromLeft?1:-1)*rand(5,9), vy:rand(2,4),
      life:1, len:rand(60,130)
    });
  }
}

var ptsX=[];
function desenharCeu(t){
  cx.clearRect(0,0,VW,VH);

  // ── nebulosa viva (camada de fundo): deriva, respira e pulsa ──
  cx.globalCompositeOperation='lighter';
  for (var ni=0; ni<nuvens.length; ni++){
    var nb=nuvens[ni];
    // passeio orbital lento pela tela
    var cxp=(nb.x + Math.sin(t*nb.vel + nb.ph)*nb.amp)*VW;
    var cyp=(nb.y + Math.cos(t*nb.vel*.8 + nb.ph)*nb.amp*.7)*VH - scrollY*.03;
    cyp=((cyp%(VH*1.5))+VH*1.5)%(VH*1.5);
    // respiração do raio
    var rr=(nb.r + Math.sin(t*nb.fr+nb.ph)*.10)*VW;
    var a=nb.base*(.7+.3*Math.sin(t*.5+nb.ph));
    var g=cx.createRadialGradient(cxp,cyp,0,cxp,cyp,rr);
    g.addColorStop(0,'rgba('+nb.cor+','+a+')');
    g.addColorStop(.6,'rgba('+nb.cor+','+(a*.35)+')');
    g.addColorStop(1,'rgba('+nb.cor+',0)');
    cx.fillStyle=g; cx.fillRect(0,0,VW,VH);
  }
  cx.globalCompositeOperation='source-over';

  // ── poeira cósmica ──
  for (var di=0; di<poeira.length; di++){
    var pz=poeira[di];
    pz.x+=pz.vx; pz.y+=pz.vy + scrollY*0+0;
    if(pz.y>VH+5){pz.y=-5;pz.x=Math.random()*VW;}
    if(pz.x>VW+5)pz.x=-5; if(pz.x<-5)pz.x=VW+5;
    cx.globalAlpha=pz.a*(.6+.4*Math.sin(t*.7+di));
    cx.fillStyle=pz.rosa?'#ffb6d9':'#cdb8ff';
    cx.beginPath();cx.arc(pz.x,pz.y,pz.r,0,6.2832);cx.fill();
  }
  cx.globalAlpha=1;

  // ── estrelas com parallax + cintilação ──
  for (var i=0;i<estrelas.length;i++){
    var e=estrelas[i];
    var yy=((e.y - scrollY*e.par)%VH+VH)%VH;
    var a=.30+.70*(.5+.5*Math.sin(e.tw+t*e.tv));
    cx.globalAlpha=a;
    cx.fillStyle=e.rosa?'#ffb6d9':'#ece6fb';
    cx.beginPath();cx.arc(e.x,yy,e.r,0,6.2832);cx.fill();
    if(e.r>1.1){ // brilho/halo nas estrelas grandes
      cx.globalAlpha=a*.30;
      cx.beginPath();cx.arc(e.x,yy,e.r*3.2,0,6.2832);cx.fill();
    }
  }
  cx.globalAlpha=1;

  // ── cometas ocasionais ──
  talvezCometa(t);
  for (var ci=cometas.length-1; ci>=0; ci--){
    var cm=cometas[ci];
    cm.x+=cm.vx; cm.y+=cm.vy; cm.life-=.012;
    if(cm.life<=0 || cm.x<-60 || cm.x>VW+60){cometas.splice(ci,1);continue;}
    var tx=cm.x-cm.vx/Math.hypot(cm.vx,cm.vy)*cm.len;
    var ty=cm.y-cm.vy/Math.hypot(cm.vx,cm.vy)*cm.len;
    var grad=cx.createLinearGradient(cm.x,cm.y,tx,ty);
    grad.addColorStop(0,'rgba(255,214,232,'+(cm.life*.9)+')');
    grad.addColorStop(1,'rgba(255,45,120,0)');
    cx.strokeStyle=grad;cx.lineWidth=2;cx.lineCap='round';
    cx.beginPath();cx.moveTo(cm.x,cm.y);cx.lineTo(tx,ty);cx.stroke();
    cx.globalAlpha=cm.life;cx.fillStyle='#fff';
    cx.beginPath();cx.arc(cm.x,cm.y,1.8,0,6.2832);cx.fill();cx.globalAlpha=1;
  }

  // ── linha de Petrova ──
  var baseA=.14+bloom*.8, amp=VW*(.12+bloom*.1), midx=VW*.5;
  cx.globalCompositeOperation='lighter';
  ptsX.length=0;
  for (var y=-20;y<=VH+20;y+=16){
    var k=y*.0042;
    ptsX.push(midx+Math.sin(k+t*.5)*amp*.5+Math.sin(k*2.3-t*.3)*amp*.22, y);
  }
  for (var passo=0;passo<3;passo++){
    var lw=passo===0?(24+bloom*90):passo===1?(8+bloom*30):(2+bloom*6);
    var la=passo===0?baseA*.12:passo===1?baseA*.3:baseA*.85;
    cx.strokeStyle=passo===2?'rgba(255,182,217,'+la+')':'rgba(255,45,120,'+la+')';
    cx.lineWidth=lw;cx.lineCap='round';
    cx.beginPath();
    for (var p=0;p<ptsX.length;p+=2){p===0?cx.moveTo(ptsX[p],ptsX[p+1]):cx.lineTo(ptsX[p],ptsX[p+1]);}
    cx.stroke();
  }
  // partículas de Astrophage na linha
  for (var q=0;q<14;q++){
    var ph=(t*(.05+(q%5)*.012)+q*.071)%1, py=ph*(VH+40)-20;
    var idx=clamp(Math.round(py/16)*2,0,ptsX.length-2);
    var px=ptsX[idx]+Math.sin(q*9+t)*(10+24*(q%3)/2);
    cx.globalAlpha=.5+.5*Math.sin(q+t*2);
    cx.fillStyle=q%3?'#ff7eb3':'#ffd6e8';
    cx.beginPath();cx.arc(px,py,q%3?1.6:2.4,0,6.2832);cx.fill();
  }
  cx.globalAlpha=1;cx.globalCompositeOperation='source-over';
}

/* ============================================================
   2 · ROCKY (foto flutuante)
   ============================================================ */
var rockyEl = document.getElementById('rocky');
var falaEl = document.getElementById('rocky-fala');
var falaTxt = document.getElementById('rocky-fala-txt');
var rockyAlvo = {x:.5, y:.78, s:0};   // posição relativa (0..1) + escala
var rockyAtual = {x:.5, y:.78, s:0};
var falaTimer = null;

function rockyIr(x,y,s,dur){
  if (REDUZIDO){rockyAtual.x=x;rockyAtual.y=y;rockyAtual.s=s;aplicarRocky();return;}
  gsap.to(rockyAlvo,{x:x,y:y,s:s,duration:dur||1.3,ease:'power2.inOut',overwrite:'auto'});
}
function aplicarRocky(){
  rockyEl.style.left=(rockyAtual.x*100)+'%';
  rockyEl.style.top=(rockyAtual.y*100)+'%';
  rockyEl.style.transform='translate(-50%,-50%) scale('+rockyAtual.s.toFixed(3)+')';
}
function rockyFala(txt,dur){
  if(!falaTxt) return;
  falaTxt.textContent=txt;
  falaEl.hidden=false;
  posicionarFala();
  requestAnimationFrame(function(){falaEl.classList.add('on');});
  clearTimeout(falaTimer);
  falaTimer=setTimeout(function(){
    falaEl.classList.remove('on');
    setTimeout(function(){falaEl.hidden=true;},320);
  },dur||4400);
}
function posicionarFala(){
  // pega a posição REAL do Rocky na tela (já com clamp aplicado no loop)
  var rb = rockyEl.getBoundingClientRect();
  var rcx = rb.left + rb.width/2;
  var rcy = rb.top + rb.height/2;
  var rW = rb.width || rockyEl.offsetWidth*rockyAtual.s;
  var rH = rb.height || rockyEl.offsetHeight*rockyAtual.s;
  var bw = falaEl.offsetWidth || 240;
  var bh = falaEl.offsetHeight || 80;

  // tenta ACIMA do Rocky (mais natural — balão de fala flutua sobre ele)
  var by = rcy - rH/2 - bh - 16;
  var bx = rcx - bw/2;
  falaEl.classList.remove('seta-cima','seta-baixo');

  if (by >= 12){
    falaEl.classList.add('seta-baixo'); // seta aponta pra baixo (Rocky abaixo)
  } else {
    // não cabe acima → tenta ABAIXO
    by = rcy + rH/2 + 16;
    falaEl.classList.add('seta-cima');
    if (by + bh > VH - 12){
      // nem abaixo → vai pro lado oposto à borda
      by = rcy - bh/2;
      bx = (rcx > VW/2) ? (rcx - rW/2 - bw - 14) : (rcx + rW/2 + 14);
      falaEl.classList.remove('seta-cima','seta-baixo');
    }
  }
  falaEl.style.left = clamp(bx, 10, VW - bw - 10) + 'px';
  falaEl.style.top  = clamp(by, 10, VH - bh - 10) + 'px';
}

/* ============================================================
   3 · LOOP
   ============================================================ */
var t0=performance.now();
function loop(agora){
  var t=(agora-t0)/1000;
  scrollY=pageYOffset;
  // proteção: se o canvas perdeu tamanho (resize/zoom), remonta
  if (cv.width===0 || Math.abs(cv.width/DPR - VW) > 4) { VW=innerWidth; VH=innerHeight; montarCeu(); }
  desenharCeu(t);
  // suaviza Rocky
  rockyAtual.x+=(rockyAlvo.x-rockyAtual.x)*.08;
  rockyAtual.y+=(rockyAlvo.y-rockyAtual.y)*.08;
  rockyAtual.s+=(rockyAlvo.s-rockyAtual.s)*.10;
  posicionarRocky(t);
  if(!falaEl.hidden) posicionarFala();
  requestAnimationFrame(loop);
}

/* coloca o Rocky em px reais, garantindo que NUNCA saia da tela */
function posicionarRocky(t){
  if (rockyAtual.s < .01){ rockyEl.style.opacity='0'; return; }
  rockyEl.style.opacity='1';
  // largura real do elemento (definida no CSS, responsiva)
  var w = rockyEl.offsetWidth, h = rockyEl.offsetHeight;
  var esc = rockyAtual.s;                 // 0..1 → fração do tamanho base
  var flut = Math.sin(t*1.1)*8;           // flutuação em px
  // centro desejado em px
  var cxp = rockyAtual.x * VW;
  var cyp = rockyAtual.y * VH + flut;
  // metades reais já escaladas
  var halfW = w*esc/2, halfH = h*esc/2;
  // clamp pra caber inteiro na tela com margem
  cxp = clamp(cxp, halfW+8, VW-halfW-8);
  cyp = clamp(cyp, halfH+8, VH-halfH-8);
  rockyEl.style.left = cxp+'px';
  rockyEl.style.top  = cyp+'px';
  rockyEl.style.transform='translate(-50%,-50%) scale('+esc.toFixed(3)+') rotate('+(Math.sin(t*.5)*2)+'deg)';
}

/* ============================================================
   4 · MÚSICA
   ============================================================ */
var musica=document.getElementById('musica');
var som=document.getElementById('som');
var somOn=document.getElementById('som-on'), somOff=document.getElementById('som-off');
var tocando=false;
function ligarMusica(){
  musica.volume=0;
  var pr=musica.play(); if(pr&&pr.catch)pr.catch(function(){});
  gsap.to(musica,{volume:.85,duration:3.5,ease:'sine.in'});
  tocando=true; som.hidden=false;
}
som.addEventListener('click',function(){
  if(tocando){gsap.to(musica,{volume:0,duration:.6,onComplete:function(){musica.pause();}});somOn.hidden=true;somOff.hidden=false;tocando=false;}
  else{musica.play();gsap.to(musica,{volume:.85,duration:1.2});somOn.hidden=false;somOff.hidden=true;tocando=true;}
});

/* ============================================================
   5 · CONTADOR
   ============================================================ */
var INICIO=new Date(2026,1,5,0,0,0);
function pad(n){return n<10?'0'+n:''+n;}
function tick(){
  var d=Math.max(0,Date.now()-INICIO.getTime());
  var s=Math.floor(d/1000);
  document.getElementById('c-dias').textContent=Math.floor(s/86400);
  document.getElementById('c-horas').textContent=pad(Math.floor(s%86400/3600));
  document.getElementById('c-min').textContent=pad(Math.floor(s%3600/60));
  document.getElementById('c-seg').textContent=pad(s%60);
}
setInterval(tick,1000);tick();

/* ============================================================
   6 · CONSTELAÇÃO
   ============================================================ */
var MEMS=['mem-img_4259','mem-img_4260','mem-img_4263','mem-img_4418','mem-img_4419',
  'mem-img_4524','mem-img_4667','mem-img_4721','mem-img_4797','mem-img_4805',
  'mem-img_4808','mem-img_4830','mem-img_4831','mem-img_4989','mem-img_5039',
  'mem-img_5567','mem-img_5829','mem-img_5875','mem-img_5981','mem-img_5988',
  'mem-img_6385','mem-img_6389','mem-img_6397'];
var campo=document.getElementById('campo');
function montarConstelacao(){
  for (var i=0;i<MEMS.length;i++){
    var b=document.createElement('button');
    b.className='estrela';b.type='button';
    b.setAttribute('aria-label','Abrir memória '+(i+1));
    b.style.left=((i%2?70:30)+Math.sin(i*2.7)*16)+'%';
    b.style.top=(3+i*(94/(MEMS.length-1)))+'%';
    b.style.animationDelay=(-i*1.3)+'s';
    var img=document.createElement('img');
    img.loading='lazy';img.src='assets/'+MEMS[i]+'.jpg';img.alt='Memória nº '+(i+1);
    b.appendChild(img);
    (function(src){b.addEventListener('click',function(){abrirLightbox(src);});})('assets/'+MEMS[i]+'.jpg');
    campo.appendChild(b);
  }
}
var lightbox=document.getElementById('lightbox');
var lightboxImg=document.getElementById('lightbox-img');
function abrirLightbox(src){
  lightboxImg.src=src;lightbox.hidden=false;
  gsap.fromTo(lightbox,{opacity:0},{opacity:1,duration:.3});
  gsap.fromTo(lightboxImg,{scale:.9},{scale:1,duration:.4,ease:'power3.out'});
}
function fecharLightbox(){gsap.to(lightbox,{opacity:0,duration:.25,onComplete:function(){lightbox.hidden=true;}});}
lightbox.addEventListener('click',fecharLightbox);
document.getElementById('lightbox-x').addEventListener('click',fecharLightbox);

/* ============================================================
   7 · SCROLL — reveals, momento rosa, âncoras do Rocky
   ============================================================ */
function montarScroll(){
  gsap.registerPlugin(ScrollTrigger);

  if(!REDUZIDO){
    document.querySelectorAll('.reveal').forEach(function(el){
      gsap.fromTo(el,{opacity:0,y:40,filter:'blur(8px)'},
        {opacity:1,y:0,filter:'blur(0px)',duration:1.1,ease:'power3.out',
        scrollTrigger:{trigger:el,start:'top 87%',once:true}});
    });
    document.querySelectorAll('.reveal-foto').forEach(function(el){
      gsap.fromTo(el,{opacity:0,y:80,scale:.9,rotate:-2,filter:'blur(10px)'},
        {opacity:1,y:0,scale:1,rotate:0,filter:'blur(0px)',duration:1.5,ease:'power3.out',
        scrollTrigger:{trigger:el,start:'top 85%',once:true}});
      // parallax suave da imagem dentro da moldura enquanto scrolla
      var img=el.querySelector('img');
      if(img){
        gsap.fromTo(img,{yPercent:-6},{yPercent:6,ease:'none',
          scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:true}});
      }
    });
    // títulos: leve subida com brilho
    document.querySelectorAll('.titulo').forEach(function(el){
      gsap.fromTo(el,{opacity:0,y:50,filter:'blur(12px)'},
        {opacity:1,y:0,filter:'blur(0px)',duration:1.3,ease:'power3.out',
        scrollTrigger:{trigger:el,start:'top 88%',once:true}});
    });
  } else {
    gsap.set('.reveal,.reveal-foto,.titulo',{opacity:1});
  }

  // progresso
  var fill=document.getElementById('progresso-fill');
  ScrollTrigger.create({start:0,end:'max',onUpdate:function(self){fill.style.width=(self.progress*100).toFixed(2)+'%';}});

  // momento rosa
  var rosa=document.getElementById('rosa');
  var overlay=document.createElement('div');overlay.className='rosa-overlay';document.body.appendChild(overlay);
  if(!REDUZIDO){
    var tl=gsap.timeline({scrollTrigger:{trigger:rosa,start:'top top',end:'bottom bottom',scrub:.6,
      onUpdate:function(self){if(self.progress>.42)rosa.classList.add('acesa');else rosa.classList.remove('acesa');}}});
    tl.to({},{duration:.05})
      .to('#petrova',{opacity:0,duration:.1},0)
      .to(window,{onUpdate:function(){}},0)
      .add(function(){},0);
    // bloom via objeto
    gsap.to({v:0},{v:1,duration:1,scrollTrigger:{trigger:rosa,start:'top 80%',end:'top top',scrub:.6,
      onUpdate:function(self){bloom=self.progress;}}});
    gsap.fromTo('#rosa-1',{opacity:0,y:30},{opacity:1,y:0,scrollTrigger:{trigger:rosa,start:'top 60%',end:'top 20%',scrub:true}});
    gsap.fromTo('#rosa-2',{opacity:0,y:30},{opacity:1,y:0,scrollTrigger:{trigger:rosa,start:'top -5%',end:'top -25%',scrub:true}});
    gsap.fromTo(overlay,{opacity:0},{opacity:1,scrollTrigger:{trigger:rosa,start:'top -20%',end:'top -45%',scrub:true}});
    gsap.fromTo('#rosa-3',{opacity:0,scale:.92},{opacity:1,scale:1,scrollTrigger:{trigger:rosa,start:'top -45%',end:'top -75%',scrub:true}});
    gsap.fromTo('#rosa-4',{opacity:0},{opacity:1,scrollTrigger:{trigger:rosa,start:'top -80%',end:'top -100%',scrub:true}});
    gsap.to(overlay,{opacity:0,scrollTrigger:{trigger:rosa,start:'bottom 60%',end:'bottom top',scrub:true}});
    gsap.to({v:1},{v:0,scrollTrigger:{trigger:rosa,start:'bottom 60%',end:'bottom top',scrub:true,onUpdate:function(self){bloom=1-self.progress;}}});
    ScrollTrigger.create({trigger:rosa,start:'bottom bottom',onLeave:function(){gsap.to('#petrova',{opacity:.5,duration:.6});},onEnterBack:function(){gsap.to('#petrova',{opacity:0,duration:.3});}});
    ScrollTrigger.create({trigger:rosa,start:'top bottom',end:'bottom top',onLeaveBack:function(){bloom=0;gsap.to('#petrova',{opacity:.5,duration:.6});}});
  } else {
    gsap.set(['#rosa-1','#rosa-2','#rosa-3','#rosa-4'],{opacity:1});
  }

  // âncoras do Rocky pelas seções.
  // lado: 'd' (direita) ou 'e' (esquerda); o x exato é resolvido por
  // ancoraX() conforme a orientação, pra ele nunca cobrir o conteúdo.
  var paradas=[
    {sel:'#abertura',  lado:'d', s:.85, fala:'Análise da estrela Lisete: brilho máximo. Risadinha: arma perigosa. ♫'},
    {sel:'#cap1',      lado:'d', s:.8,  fala:'Registro: tudo começou com um “Oii”. Eficiência humana: questionável. Resultado: amor. ♪'},
    {sel:'#cap2',      s:0},
    {sel:'#cap3',      lado:'e', s:.8,  fala:'“Eu quero namorar meu fi.” Melhor mensagem da galáxia. Confirmado. ♫'},
    {sel:'#cap4',      s:0},
    {sel:'#constelacao',lado:'d',s:.8,  fala:'Tantas estrelas! Espera… são todas vocês dois! ♫'},
    {sel:'#relatorio', lado:'e', s:.8,  fala:'67 mil mensagens analisadas. Conclusão: passou do limite do sensor de amor. ♪'},
    {sel:'#video',     s:0},
    {sel:'#final',     lado:'d', s:.95, fala:'Hora do soquinho! Aperta o botão, humana! ✊ ♫'}
  ];
  paradas.forEach(function(cfg){
    ScrollTrigger.create({trigger:cfg.sel,start:'top 55%',end:'bottom 45%',
      onToggle:function(self){
        if(!self.isActive||!iniciado) return;
        if(cfg.s>0){
          var a=ancoraRocky(cfg.lado);
          rockyIr(a.x,a.y,cfg.s);
          if(cfg.fala&&!cfg.falou){cfg.falou=true;setTimeout(function(){rockyFala(cfg.fala);},900);}
        } else {
          rockyIr(rockyAlvo.x,1.3,0,.8); // some por baixo
        }
      }
    });
  });
}

/* resolve a posição do Rocky (em fração 0..1) conforme orientação.
   paisagem: ele fica bem na quina; retrato: mais centralizado no topo. */
function ancoraRocky(lado){
  var paisagem = VW/VH > 1.15;
  var x, y;
  if (paisagem){
    // paisagem: bem na quina superior, fora da coluna de conteúdo
    x = (lado==='e') ? .08 : .92;
    y = .16;
  } else {
    x = (lado==='e') ? .19 : .81;
    y = .18;
  }
  return {x:x, y:y};
}

/* ============================================================
   8 · SOQUINHO
   ============================================================ */
document.getElementById('bump').addEventListener('click',function(){
  var btn=this;btn.disabled=true;
  rockyFala('Fist my bump! ✊ ♫',3200);
  if(!REDUZIDO){
    var volta=ancoraRocky('d');
    gsap.timeline({onComplete:function(){btn.disabled=false;}})
      .to(rockyAlvo,{x:.5,y:.5,s:1.15,duration:.8,ease:'power2.inOut'})
      .to(rockyAlvo,{s:1.45,duration:.25,ease:'power3.in'})
      .to(rockyAlvo,{s:.9,x:volta.x,y:volta.y,duration:.9,ease:'elastic.out(1,.6)'});
    var flash=document.createElement('div');
    flash.style.cssText='position:fixed;inset:0;z-index:50;pointer-events:none;background:radial-gradient(circle at 50% 55%,rgba(255,214,232,.9),rgba(255,45,120,.3) 60%,transparent 80%);opacity:0';
    document.body.appendChild(flash);
    gsap.fromTo(flash,{opacity:0},{opacity:1,duration:.12,yoyo:true,repeat:1,onComplete:function(){flash.remove();}});
  } else { btn.disabled=false; }
});

/* ============================================================
   INIT
   ============================================================ */
function init(){
  scrollTo(0,0);
  if('scrollRestoration' in history) history.scrollRestoration='manual';
  document.body.classList.add('travado');
  montarCeu();
  montarConstelacao();
  montarScroll();

  if(!REDUZIDO){requestAnimationFrame(loop);}
  else{desenharCeu(1.5);}

  document.getElementById('iniciar').addEventListener('click',function(){
    if(iniciado) return;
    iniciado=true;
    ligarMusica();
    var capa=document.getElementById('capa');
    gsap.to(capa,{opacity:0,duration:1.2,ease:'power2.inOut',onComplete:function(){
      capa.style.display='none';
      document.body.classList.remove('travado');
      ScrollTrigger.refresh();
      var a=ancoraRocky('d');
      rockyIr(a.x,a.y,.85,1.4);
      setTimeout(function(){rockyFala('♫ Bem-vinda a bordo, Lisete Bianca! ♫',5000);},800);
    }});
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();

/* resize / rotação / zoom — recalcula tudo e reancora o Rocky */
var rt=null;
function aoRedimensionar(){
  VW=innerWidth; VH=innerHeight;
  montarCeu();
  // reancora o Rocky no lado que ele já estava (mantém o lado pela posição x atual)
  if (iniciado && rockyAlvo.s>.01){
    var lado = rockyAlvo.x < .5 ? 'e' : 'd';
    var a=ancoraRocky(lado);
    rockyAlvo.x=a.x; rockyAlvo.y=a.y; // sem animação — salto direto evita "voar"
  }
  ScrollTrigger.refresh();
}
addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(aoRedimensionar,200);});
addEventListener('orientationchange',function(){clearTimeout(rt);rt=setTimeout(aoRedimensionar,300);});

})();
