(() => {
  'use strict';
  function init() {
    const root = document.getElementById('finale');
    if (!root || root.dataset.finaleReady) return;
    const section = root.closest('section');
    if (!section) return;
    root.dataset.finaleReady = 'true';
    const W = 1600, H = 900, LIMIT = 900;
    const colors = ['#e8a875', '#E07461', '#f5f1e8', '#9cc3a8', '#d9a03f'];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const icon = path => `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
    const speaker = '<path d="M11 5 6 9H3v6h3l5 4Z"/>';
    root.innerHTML = `<div class="fn-bg"></div><div class="fn-shade"></div><div class="fn-light"></div><canvas aria-hidden="true"></canvas>
      <div class="fn-top"><span class="fn-brand">neovida · Нейропросвещение</span><span>ИИ. Новая реальность · поток 6 · 15 октября 2026</span></div>
      <div class="fn-wait"><p class="fn-kicker">Следующая глава начинается с вас</p><button type="button" class="fn-start">Завершить курс</button><span class="fn-hint">или Enter</span></div>
      <div class="fn-result"><h2 class="fn-title" aria-label="Поздравляем, выпускники!"></h2><p class="fn-sub">Восемь занятий. Четыре недели. Новая реальность теперь ваша.</p><ul class="fn-names" aria-label="Выпускники"></ul></div>
      <div class="fn-applause">Аплодисменты!</div><div class="fn-footer">Уфа · Выпуск 2026</div>
      <div class="fn-controls"><button type="button" class="fn-control fn-replay">${icon('<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7"/>')}Ещё раз</button><button type="button" class="fn-control fn-sound"></button></div>`;
    const $ = selector => root.querySelector(selector);
    if (root.dataset.bg) $('.fn-bg').style.backgroundImage = `url(${JSON.stringify(root.dataset.bg)})`;
    let letterIndex = 0;
    'Поздравляем, выпускники!'.split(' ').forEach((word, i) => {
      if (i) $('.fn-title').append(' ');
      const wrap = document.createElement('span'); wrap.className = 'fn-word'; wrap.setAttribute('aria-hidden', 'true');
      for (const char of word) {
        const span = document.createElement('span'); span.className = 'fn-letter'; span.textContent = char;
        span.style.setProperty('--i', letterIndex++); wrap.append(span);
      }
      $('.fn-title').append(wrap);
    });
    let names = [];
    try { const parsed = JSON.parse(root.dataset.names || '[]'); if (Array.isArray(parsed)) names = parsed.filter(n => typeof n === 'string' && n.trim()); } catch { /* Пустой список не мешает запуску. */ }
    names.forEach((name, i) => {
      const li = document.createElement('li'); li.className = 'fn-name'; li.textContent = name; li.style.setProperty('--i', i); $('.fn-names').append(li);
    });
    const canvas = $('canvas'), ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let active = false, state = 'waiting', raf = 0, startTime = 0, previous = 0, burstIndex = 0, nextBurst = 2.2;
    let particles = [], muted = false, audioContext = null, sound = null;
    const rand = (a, b) => a + Math.random() * (b - a);
    const setState = value => { state = value; root.dataset.state = value; };
    const glow = document.createElement('canvas'); glow.width = glow.height = 48;
    const gc = glow.getContext('2d');
    if (gc) { const g = gc.createRadialGradient(24,24,0,24,24,24); g.addColorStop(0,'#f5f1e8'); g.addColorStop(.15,'#e8a875'); g.addColorStop(1,'#e8a87500'); gc.fillStyle=g; gc.fillRect(0,0,48,48); }
    function add(p) { if (particles.length < LIMIT) particles.push(p); }
    function seed() {
      particles = [];
      for (let i=0;i<70;i++) add({kind:'bokeh',x:rand(0,W),y:rand(0,H),vx:rand(-7,7),vy:rand(-14,-3),size:rand(3,13),phase:rand(0,7)});
    }
    function burst(x,y) {
      const count=reduced?16:Math.floor(rand(120,161));
      // Освобождаем место за счёт старых искр, сохраняя полную волну конфетти.
      let needed=Math.max(0,particles.length+count+1-LIMIT);
      particles=particles.filter(p=>{if(needed && p.kind==='spark'){needed--;return false;}return true;});
      const radius=rand(260,420), doubleRing=Math.random()<.55;
      add({kind:'flash',x,y,life:0,max:reduced?.12:.32,size:radius*.75});
      for(let i=0;i<count;i++) {
        const a=Math.PI*2*i/count+rand(-.018,.018);
        const r=radius*(doubleRing?(i%2?.66:1):rand(.78,1));
        add({kind:'spark',x,y,ox:x,oy:y,dx:Math.cos(a)*r,dy:Math.sin(a)*r,
          life:0,max:rand(1.8,2.4),phase:rand(0,Math.PI*2),size:rand(2,3.6),color:colors[i%5]});
      }
    }
    function confetti() {
      const count=reduced?24:Math.floor(rand(260,321));
      for(let i=0;i<count;i++) add({kind:'confetti',x:rand(0,W),y:rand(-480,-20),vx:rand(-35,35),vy:rand(145,205),life:0,max:rand(8,12),angle:rand(0,7),spin:rand(-4,4),size:rand(8,16),ribbon:i%5===0,color:colors[i%5]});
    }
    // Каждый запуск получает отдельную шину и список источников.
    function stopSound() {
      if (!sound || !audioContext) return;
      const old = sound; sound = null;
      const t=audioContext.currentTime;
      old.master.gain.cancelScheduledValues(t); old.master.gain.setTargetAtTime(0,t,.025);
      old.sources.forEach(s => { try { s.stop(t+.15); } catch {} });
      setTimeout(() => { old.master.disconnect(); old.compressor.disconnect(); },200);
    }
    function playSound() {
      stopSound();
      try {
        const AC=window.AudioContext||window.webkitAudioContext;
        if (!AC) return;
        if (!audioContext) audioContext=new AC();
        audioContext.resume().catch(() => {});
        const ac=audioContext, master=ac.createGain(), compressor=ac.createDynamicsCompressor();
        compressor.threshold.value=-14; compressor.knee.value=18; compressor.ratio.value=5; compressor.attack.value=.004; compressor.release.value=.2;
        master.gain.value=muted?0:.65; compressor.connect(master); master.connect(ac.destination);
        sound={master,compressor,sources:[]}; const session=sound, t=ac.currentTime+.025;
        const noise=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate), data=noise.getChannelData(0);
        for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
        function voice(freq,at,duration,volume,type='sine',cutoff=1800,detune=0,ring=false) {
          const source=freq?ac.createOscillator():ac.createBufferSource(), gain=ac.createGain(), filter=ac.createBiquadFilter();
          if(freq){source.type=type;source.frequency.value=freq;source.detune.value=detune;}else{source.buffer=noise;source.loop=true;}
          filter.type=freq?'lowpass':(cutoff>3000?'highpass':'lowpass');filter.frequency.value=cutoff;
          gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.018);
          if(!ring) gain.gain.setValueAtTime(volume*.75,at+duration*.55);
          gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
          source.connect(filter);filter.connect(gain);gain.connect(compressor);
          source.start(at);source.stop(at+duration+.04);session.sources.push(source);
          source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
        }
        for(let i=0;i<25;i++) {const p=i/25, at=t+1.38*(1-Math.pow(1-p,1.6));voice(75+p*22,at,.14,.08+p*.12);voice(0,at,.09,.025+p*.06,'sine',750);}
        voice(0,t+1.4,1.8,.28,'sine',5600);voice(55,t+1.4,.8,.35);
        function brass(freq,at,duration,volume) {volume*=1.2;voice(freq,at,duration,volume,'sawtooth',2400,-5);voice(freq,at,duration,volume*.55,'square',1700,5);}
        [392,523.25,659.25,783.99].forEach((f,i)=>brass(f,t+1.4+i*.21,.43,.15));
        [261.63,392,523.25,659.25].forEach(f=>brass(f,t+2.25,2.15,.085));
        [523.25,698.46,880,1046.5].forEach((f,i)=>brass(f,t+4.15+i*.18,.4,.13));
        [349.23,523.25,698.46,880].forEach(f=>brass(f,t+4.88,2.7,.09));
        voice(0,t+4.88,1.6,.18,'sine',6500);
        [1396.92,2093,2793.84,3520,4186].forEach((f,i)=>
          voice(f,t+7.15+i*.065,4.8+i*.18,.045/(1+i*.35),'sine',9000,0,true));
      } catch { stopSound(); }
    }
    function soundLabel() {
      $('.fn-sound').innerHTML=icon(speaker+(muted?'<path d="m16 9 5 6m0-6-5 6"/>':'<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>'))+(muted?'Звук выключен':'Звук включён');
      $('.fn-sound').setAttribute('aria-pressed',String(!muted));
      $('.fn-sound').setAttribute('aria-label',muted?'Включить звук':'Выключить звук');
    }
    function launch() {
      if(!active) return;
      setState('waiting');root.classList.remove('fn-clap');void root.offsetWidth;
      seed();burstIndex=0;nextBurst=2.2;startTime=performance.now();setState('charging');playSound();
    }
    const bursts=[[180,310],[590,225],[1010,250],[1420,330]];
    function frame(now) {
      if(!active) return;
      const dt=Math.min((now-previous)/1000||.016,.04);previous=now;
      const elapsed=(now-startTime)/1000;
      if(state==='charging' && elapsed>=1.4){setState('celebrating');confetti();}
      if(state==='celebrating') {
        while(burstIndex<bursts.length && elapsed>=1.4+burstIndex*.045){burst(...bursts[burstIndex]);burstIndex++;}
        if(elapsed>=8) root.classList.add('fn-clap');
        if(elapsed>=nextBurst){
          burst(rand(160,1440),rand(220,480));
          nextBurst=elapsed+rand(elapsed<9?.6:2.5,elapsed<9?.9:3);
          if(elapsed<9 && nextBurst>=9) nextBurst=9+rand(2.5,3);
        }
      }
      if(ctx) {
        ctx.clearRect(0,0,W,H);
        particles=particles.filter(p=>{
          if(p.kind==='bokeh'){
            if(state==='charging'){p.x+=(800-p.x)*dt*2.2;p.y+=(430-p.y)*dt*2.2;}else{p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.y< -20)p.y=920;}
            ctx.globalAlpha=.22+Math.sin(now*.0007+p.phase)*.12;ctx.drawImage(glow,p.x-p.size,p.y-p.size,p.size*2,p.size*2);return true;
          }
          p.life+=dt;if(p.life>p.max||p.y>980)return false;
          if(p.kind==='flash') {
            ctx.save();ctx.globalCompositeOperation='lighter';
            ctx.globalAlpha=(reduced?.2:.85)*Math.pow(1-p.life/p.max,2);
            ctx.drawImage(glow,p.x-p.size,p.y-p.size,p.size*2,p.size*2);
            ctx.drawImage(glow,p.x-26,p.y-26,52,52);ctx.restore();return true;
          }
          ctx.globalAlpha=Math.min(1,(p.max-p.life)/.65);ctx.fillStyle=p.color;ctx.strokeStyle=p.color;
          if(p.kind==='spark') {
            const oldX=p.x,oldY=p.y, progress=p.life/p.max;
            const spread=(1-Math.exp(-3*progress))/(1-Math.exp(-3));
            p.x=p.ox+p.dx*spread;p.y=p.oy+p.dy*spread+24*p.life*p.life;
            if(progress>.62) ctx.globalAlpha*=.35+.65*Math.pow(Math.sin(p.life*29+p.phase),2);
            ctx.save();ctx.globalCompositeOperation='lighter';
            ctx.lineWidth=p.size;ctx.beginPath();ctx.moveTo(oldX,oldY);ctx.lineTo(p.x,p.y);ctx.stroke();
            ctx.drawImage(glow,p.x-p.size*3,p.y-p.size*3,p.size*6,p.size*6);
            ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);ctx.restore();
          } else {
            p.x+=p.vx*dt;p.y+=p.vy*dt;
            p.angle+=p.spin*dt;p.x+=Math.sin(p.life*2+p.spin)*18*dt;
            const flip=Math.cos(p.life*5+p.spin), height=p.ribbon?p.size*2.8:p.size*.65;
            ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.scale(flip,1);
            ctx.fillRect(-p.size/2,-height/2,p.size,height);
            ctx.globalAlpha*=Math.pow(1-Math.abs(flip),3);ctx.fillStyle='#fff8e4';
            ctx.fillRect(-p.size/2,-height/2,p.size,height);ctx.restore();
          }
          return true;
        });ctx.globalAlpha=1;
      }
      raf=requestAnimationFrame(frame);
    }
    function sync() {
      const next=section.classList.contains('active')&&!document.hidden;
      if(next===active)return;
      active=next;root.classList.toggle('fn-active',active);cancelAnimationFrame(raf);raf=0;
      stopSound();setState('waiting');root.classList.remove('fn-clap');seed();
      if(ctx)ctx.clearRect(0,0,W,H);
      if(active){previous=performance.now();raf=requestAnimationFrame(frame);}
    }
    $('.fn-start').addEventListener('click',e=>{e.stopPropagation();launch();});
    $('.fn-replay').addEventListener('click',e=>{e.stopPropagation();launch();});
    $('.fn-sound').addEventListener('click',e=>{
      e.stopPropagation();muted=!muted;soundLabel();
      if(sound&&audioContext){audioContext.resume().catch(()=>{});sound.master.gain.setTargetAtTime(muted?0:.65,audioContext.currentTime,.035);}
    });
    // Захват раньше обработчика перелистывания деки.
    window.addEventListener('keydown',e=>{
      if(!active||!section.classList.contains('active')||!['Enter',' '].includes(e.key)||e.altKey||e.ctrlKey||e.metaKey||document.querySelector('dialog[open]')||e.target.closest('input,textarea,select,[contenteditable]'))return;
      if(!root.contains(e.target)&&e.target.closest('button,a'))return;
      e.preventDefault();e.stopPropagation();
      if(e.repeat)return;
      if(e.target.closest('.fn-sound'))$('.fn-sound').click();
      else if(e.target.closest('.fn-replay')||state==='waiting')launch();
    },true);
    new MutationObserver(sync).observe(section,{attributes:true,attributeFilter:['class']});
    document.addEventListener('visibilitychange',sync);
    soundLabel();setState('waiting');sync();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
