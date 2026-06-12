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
   1 · CÉU — estrelas + linha de Petrova em canvas
   ============================================================ */
var cv = document.getElementById('ceu');
var cx = cv.getContext('2d');
var estrelas = [];
var bloom = 0;           // 0..1 intensidade da linha rosa (momento rosa)
var scrollY = 0;

function montarCeu(){
  cv.width = VW*DPR; cv.height = VH*DPR;
  cx.setTransform(DPR,0,0,DPR,0,0);
  estrelas = [];
  var n = Math.min(200, Math.round(VW*VH/9000));
  for (var i=0;i<n;i++){
    var c = i%3;
    estrelas.push({
      x:Math.random()*VW, y:Math.random()*VH*2,
      r: c===2?rand(.9,1.7):c===1?rand(.6,1.1):rand(.3,.7),
      par: c===2?.16:c===1?.08:.03,
      tw:Math.random()*6.28, tv:rand(.4,1.3),
      rosa:Math.random()<.13
    });
  }
}

var ptsX=[];
function desenharCeu(t){
  cx.clearRect(0,0,VW,VH);
  // estrelas
  for (var i=0;i<estrelas.length;i++){
    var e=estrelas[i];
    var yy=((e.y - scrollY*e.par)%VH+VH)%VH;
    var a=.35+.65*(.5+.5*Math.sin(e.tw+t*e.tv));
    cx.globalAlpha=a;
    cx.fillStyle=e.rosa?'#ffb6d9':'#ece6fb';
    cx.beginPath();cx.arc(e.x,yy,e.r,0,6.2832);cx.fill();
    if(e.rosa&&e.r>1){cx.globalAlpha=a*.35;cx.beginPath();cx.arc(e.x,yy,e.r*3,0,6.2832);cx.fill();}
  }
  cx.globalAlpha=1;
  // linha de Petrova
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
  for (var q=0;q<12;q++){
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
  var bx=rockyAtual.x*VW, by=rockyAtual.y*VH - 110*Math.max(rockyAtual.s,.5) - 30;
  falaEl.style.left=clamp(bx-30,12,VW-Math.min(260,VW*.72)-12)+'px';
  falaEl.style.top=clamp(by,14,VH-150)+'px';
}

/* ============================================================
   3 · LOOP
   ============================================================ */
var t0=performance.now();
function loop(agora){
  var t=(agora-t0)/1000;
  scrollY=pageYOffset;
  desenharCeu(t);
  // suaviza Rocky
  rockyAtual.x+=(rockyAlvo.x-rockyAtual.x)*.08;
  rockyAtual.y+=(rockyAlvo.y-rockyAtual.y)*.08;
  rockyAtual.s+=(rockyAlvo.s-rockyAtual.s)*.10;
  var flut=Math.sin(t*1.1)*.012;
  rockyEl.style.left=(rockyAtual.x*100)+'%';
  rockyEl.style.top=((rockyAtual.y+flut)*100)+'%';
  rockyEl.style.transform='translate(-50%,-50%) scale('+rockyAtual.s.toFixed(3)+') rotate('+(Math.sin(t*.5)*2)+'deg)';
  if(!falaEl.hidden) posicionarFala();
  requestAnimationFrame(loop);
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
      gsap.fromTo(el,{opacity:0,y:36},{opacity:1,y:0,duration:1,ease:'power3.out',
        scrollTrigger:{trigger:el,start:'top 86%',once:true}});
    });
    document.querySelectorAll('.reveal-foto').forEach(function(el){
      gsap.fromTo(el,{opacity:0,y:70,scale:.92},{opacity:1,y:0,scale:1,duration:1.4,ease:'power3.out',
        scrollTrigger:{trigger:el,start:'top 84%',once:true}});
    });
  } else {
    gsap.set('.reveal,.reveal-foto',{opacity:1});
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

  // âncoras do Rocky pelas seções
  var paradas=[
    {sel:'#abertura',x:.82,y:.82,s:.7,fala:'Pergunta: o Lucas te ama infinito? Resposta: agora você sabe. ♫'},
    {sel:'#cap1',x:.85,y:.85,s:.6,fala:'Humana colorindo. Concentração máxima. Amaze! ♪'},
    {sel:'#cap2',x:0,y:0,s:0},
    {sel:'#cap3',x:.17,y:.85,s:.6,fala:'Caneta sai com água. Do coração, nunca. ♫'},
    {sel:'#cap4',x:0,y:0,s:0},
    {sel:'#constelacao',x:.85,y:.88,s:.6,fala:'Tantas estrelas! Espera… são todas vocês dois! ♫'},
    {sel:'#relatorio',x:.16,y:.88,s:.6,fala:'Telemetria verificada: amor passou do limite do sensor. ♪'},
    {sel:'#video',x:0,y:0,s:0},
    {sel:'#final',x:.82,y:.78,s:.78,fala:'Hora do soquinho! Aperta o botão! ♫'}
  ];
  paradas.forEach(function(cfg){
    ScrollTrigger.create({trigger:cfg.sel,start:'top 55%',end:'bottom 45%',
      onToggle:function(self){
        if(!self.isActive||!iniciado) return;
        if(cfg.s>0){
          rockyIr(cfg.x,cfg.y,cfg.s);
          if(cfg.fala&&!cfg.falou){cfg.falou=true;setTimeout(function(){rockyFala(cfg.fala);},900);}
        } else {
          rockyIr(rockyAlvo.x,1.25,0,.8);
        }
      }
    });
  });
}

/* ============================================================
   8 · SOQUINHO
   ============================================================ */
document.getElementById('bump').addEventListener('click',function(){
  var btn=this;btn.disabled=true;
  rockyFala('Fist my bump! ✊ ♫',3200);
  if(!REDUZIDO){
    gsap.timeline({onComplete:function(){btn.disabled=false;}})
      .to(rockyAlvo,{x:.5,y:.55,s:1.3,duration:.8,ease:'power2.inOut'})
      .to(rockyAlvo,{s:1.7,duration:.25,ease:'power3.in'})
      .to(rockyAlvo,{s:.78,x:.82,y:.78,duration:.9,ease:'elastic.out(1,.6)'});
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
      rockyIr(.82,.8,.7,1.4);
      setTimeout(function(){rockyFala('♫ Bem-vinda a bordo, Lisete Bianca! ♫',5000);},800);
    }});
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();

/* resize */
var rt=null;
addEventListener('resize',function(){
  clearTimeout(rt);
  rt=setTimeout(function(){VW=innerWidth;VH=innerHeight;montarCeu();ScrollTrigger.refresh();},250);
});

})();
