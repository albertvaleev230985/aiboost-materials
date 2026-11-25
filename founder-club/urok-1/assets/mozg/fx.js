/* Canvas overlay for the мозгИИ cover. Coordinates are in brain.png pixels. */
function initBrainFx(box) {
  const slide = box.closest('.slide');
  if (!slide) return;
  const canvas = box.querySelector('canvas.fx');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.style.mixBlendMode = 'plus-lighter';

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const size = 1024;
  const center = size / 2;
  const R = size * 0.40;
  const tau = 2 * Math.PI;
  const random = (min, max) => min + Math.random() * (max - min);
  const choose = items => items[Math.floor(Math.random() * items.length)];

  function smooth(value) {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  }

  function inHemi(x, y) {
    const dx = (x - (center + R * 0.42)) / (R * 0.50);
    const dy = (y - center) / (R * 0.68);
    return dx * dx + dy * dy <= 1;
  }

  // Local peaks in the artwork. The same contain transform aligns them at every size.
  const anchors = [
    [670,263], [710,293], [640,305], [548,313], [732,317], [678,327], [622,329],
    [574,347], [684,359], [604,363], [730,363], [558,371], [626,383], [582,387],
    [746,407], [684,409], [562,423], [798,429], [720,433], [604,435], [758,441],
    [602,463], [734,465], [788,469], [560,475], [668,479], [606,497], [744,499],
    [638,501], [542,517], [716,519], [580,523], [810,535], [658,543], [774,543],
    [622,551], [596,563], [742,565], [550,565], [678,573], [604,593], [568,595],
    [708,597], [766,603], [812,613], [740,619], [546,621], [662,627], [772,643],
    [690,647], [580,663], [614,665], [654,673], [750,681], [600,699], [636,705],
    [558,709], [704,711]
  ];
  const nodes = anchors.filter(([x, y]) => inHemi(x, y)).map(([x, y]) => ({
    x, y, radius: random(4.5, 7), rest: random(0.42, 0.68), neighbors: []
  }));
  for (const node of nodes) {
    const distance = other => Math.hypot(other.x - node.x, other.y - node.y);
    node.neighbors = nodes.filter(other => other !== node && distance(other) < 90)
      .sort((a, b) => distance(a) - distance(b)).slice(0, 8);
  }

  // A single stamp carries both the warm core and the wider turquoise bloom.
  function sprite(stops, pixels = 96) {
    const stamp = document.createElement('canvas');
    stamp.width = stamp.height = pixels;
    const brush = stamp.getContext('2d');
    const r = pixels / 2;
    const gradient = brush.createRadialGradient(r, r, 0, r, r, r);
    for (const [offset, color] of stops) gradient.addColorStop(offset, color);
    brush.fillStyle = gradient;
    brush.fillRect(0, 0, pixels, pixels);
    return stamp;
  }
  const aqua = sprite([[0, '#d7fff7'], [0.24, '#8cebdd'], [0.53, '#4fd1c56b'], [1, '#4fd1c500']]);
  const pearl = sprite([[0, '#fff5e4'], [0.22, '#fff5e4'], [0.29, '#fff0daef'],
    [0.39, '#a0f6eadb'], [0.59, '#59dcceb0'], [0.80, '#4fd1c53d'], [1, '#4fd1c500']]);
  const coral = sprite([[0, '#fff0df'], [0.25, '#ffa394'], [0.58, '#ff6f616b'], [1, '#ff6f6100']]);
  const ripple = sprite([[0, '#4fd1c500'], [0.83, '#4fd1c500'], [0.92, '#4fd1c51c'],
    [0.965, '#a9eee592'], [0.98, '#73dccc55'], [1, '#4fd1c500']], 384);

  function glow(stamp, x, y, radius, opacity) {
    ctx.globalAlpha = opacity;
    ctx.drawImage(stamp, x - radius, y - radius, radius * 2, radius * 2);
  }

  let time = 0;
  let nextSignal = random(0.4, 0.9);
  let nextThought = random(3, 5);
  let thought = null;
  const signals = [];
  const flashes = [];

  function pulse(node, start, end) {
    const rise = random(0.25, 0.4);
    return { node, rise, fall: end - start - rise, start, end,
      radius: random(12, 15.5), incoming: null };
  }

  function available(node) {
    return flashes.every(f => f.node !== node && f.incoming?.to !== node);
  }

  // Spread spontaneous firings apart. Only a travelling signal recruits a neighbour.
  function restingNode() {
    const candidates = nodes.filter(available);
    if (!flashes.length) return choose(candidates);
    let best, bestDistance = -1;
    for (let i = 0; i < 7; i++) {
      const n = choose(candidates);
      const distance = Math.min(...flashes.map(f => Math.hypot(n.x - f.node.x, n.y - f.node.y)));
      if (distance > bestDistance) { best = n; bestDistance = distance; }
    }
    return best;
  }
  // Ten overlapping envelopes share a loose cadence so their quiet tails never pile up.
  const flashCount = 10;
  const initialInterval = 0.146;
  let lastEnd = 0;
  for (let i = 0; i < flashCount; i++) {
    lastEnd = (i + 0.5) * initialInterval;
    flashes.push(pulse(restingNode(), lastEnd - flashCount * initialInterval, lastEnd));
  }

  function light(f) {
    return smooth((time - f.start) / f.rise) * smooth((f.end - time) / f.fall);
  }

  // Reserve a retiring flash so the bead arrives exactly as its target begins to rise.
  function route(path, hops) {
    const from = path[path.length - 1];
    const to = choose(from.neighbors.filter(n => available(n) && !path.includes(n)));
    const slot = flashes.filter(f => !f.incoming && f.end >= time + 0.24)
      .sort((a, b) => a.end - b.end)[0];
    if (!to || !slot || signals.length >= 14) return;
    const s = { from, to, path, hops, start: time, end: slot.end };
    slot.incoming = s;
    signals.push(s);
  }

  function advanceNetwork() {
    for (let i = 0; i < flashes.length; i++) {
      const f = flashes[i];
      if (time < f.end) continue;
      const s = f.incoming;
      lastEnd += random(0.140, 0.155);
      flashes[i] = pulse(s ? s.to : restingNode(), f.end, lastEnd);
      if (s && s.hops > 1) route(s.path.concat(s.to), s.hops - 1);
    }
    if (time >= nextSignal) {
      const sources = flashes.filter(f => light(f) > 0.45 && f.node.neighbors.some(available));
      if (sources.length) route([choose(sources).node], Math.floor(random(2, 5)));
      nextSignal = time + random(0.4, 0.9);
    }
    if (time >= nextThought) {
      thought = { node: choose(flashes).node, start: time, radius: random(115, 166) };
      nextThought = time + random(3, 5);
    }
  }

  function drawSignals() {
    for (let i = signals.length - 1; i >= 0; i--) {
      const s = signals[i];
      const after = time - s.end;
      if (after >= 0.6) { signals.splice(i, 1); continue; }
      const age = time - s.start;
      const t = smooth(age / (s.end - s.start));
      const dx = s.to.x - s.from.x, dy = s.to.y - s.from.y;
      const x = s.from.x + dx * t, y = s.from.y + dy * t;
      ctx.globalAlpha = 0.7 * smooth(age / 0.12) * smooth(1 - after / 0.6);
      ctx.strokeStyle = '#64dfcf';
      ctx.lineWidth = 1.35;
      ctx.beginPath();
      ctx.moveTo(s.from.x, s.from.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      if (after >= 0) continue;
      const gain = smooth(age / 0.1) * smooth(-after / 0.12);
      const tail = Math.max(0, t - 10 / Math.hypot(dx, dy));
      ctx.globalAlpha = gain * 0.83;
      ctx.strokeStyle = '#c8f5e8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(s.from.x + dx * tail, s.from.y + dy * tail);
      ctx.lineTo(x, y);
      ctx.stroke();
      glow(pearl, x, y, 8.2, gain);
    }
  }

  // Follow the outer silhouette of the illustration, from crown to lower lobe.
  const rim = [[551,198], [648,213], [735,271], [802,352], [850,469],
    [848,595], [819,671], [768,715], [735,770], [676,800], [589,794]];
  const dust = Array.from({ length: 18 }, () => {
    const i = Math.floor(random(0, rim.length - 1));
    const [x, y] = rim[i], [u, v] = rim[i + 1];
    const dx = u - x, dy = v - y;
    const offset = random(7, 34) / Math.hypot(dx, dy);
    const t = Math.random();
    return { x: x + dx * t + dy * offset, y: y + dy * t - dx * offset,
      phase: random(0, tau), speed: random(0.17, 0.34), radius: random(1.6, 3.3) };
  });

  function drawDust() {
    for (const p of dust) {
      const t = p.phase + time * p.speed;
      const shimmer = smooth(0.5 + 0.5 * Math.sin(t * 2.3));
      glow(aqua, p.x + 5 * Math.sin(t), p.y + 7 * Math.cos(t * 0.84), p.radius, 0.25 + 0.5 * shimmer);
    }
  }

  // Independent crossings drift along shallow arcs. Colours meet in the cleft.
  function crossing() {
    return { startX: random(317, 419), endX: random(578, 652),
      y: random(354, 647), bend: random(-23, 23), drift: random(-17, 17),
      radius: random(4.4, 6.3), duration: random(2.6, 4.2), age: 0 };
  }
  const stream = Array.from({ length: 10 }, () => {
    const p = crossing();
    p.age = Math.random() * p.duration;
    return p;
  });

  function drawStream(dt) {
    for (let i = 0; i < stream.length; i++) {
      let p = stream[i];
      p.age += dt;
      if (p.age >= p.duration) stream[i] = p = crossing();
      const t = p.age / p.duration;
      const x = p.startX + (p.endX - p.startX) * t;
      const y = p.y + p.drift * t + p.bend * Math.sin(Math.PI * t);
      const fade = smooth(t / 0.22) * smooth((1 - t) / 0.28);
      const mix = smooth((x - 486) / 28);
      if (mix < 1) glow(coral, x, y, p.radius, (1 - mix) * fade * 0.96);
      if (mix > 0) glow(aqua, x, y, p.radius + 1, mix * fade);
      const bridge = 4 * mix * (1 - mix);
      if (bridge > 0) glow(pearl, x, y, p.radius * 0.8, bridge * fade);
    }
  }

  function paint(dt, still) {
    time += dt;
    // All effects live in image coordinates, including the largest expanding ring.
    ctx.clearRect(0, 0, size, size);
    const breath = still ? 0.83 : (2 + smooth(0.5 + 0.5 * Math.sin(tau * time / 7.3))) / 3;
    for (const node of nodes) glow(aqua, node.x, node.y, node.radius, node.rest * breath);
    if (!still) {
      advanceNetwork();
      if (thought) {
        const t = (time - thought.start) / 1.85;
        if (t >= 1) thought = null;
        else {
          const fade = smooth(t / 0.16) * smooth((1 - t) / 0.70);
          glow(ripple, thought.node.x, thought.node.y, 6 + (thought.radius - 6) * smooth(t), 0.70 * fade);
        }
      }
      drawDust();
      drawSignals();
      for (const f of flashes) {
        const gain = light(f);
        glow(pearl, f.node.x, f.node.y, f.radius * (0.85 + 0.15 * gain), gain);
      }
      drawStream(dt);
    }
    ctx.globalAlpha = 1;
  }

  let width = -1, height = -1, ratio = 0;
  let frameId = null, previous = null;
  function visible() {
    return !document.hidden && slide.classList.contains('on');
  }
  function layout() {
    const w = box.clientWidth, h = box.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (w === width && h === height && ratio === dpr) return;
    width = w; height = h; ratio = dpr;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const side = Math.min(w, h);
    ctx.setTransform(side * dpr / size, 0, 0, side * dpr / size,
      (w - side) * dpr / 2, (h - side) * dpr / 2);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
  }
  function frame(timestamp) {
    frameId = null;
    if (!visible() || !width || !height) return;
    const dt = previous === null ? 0 : Math.min((timestamp - previous) / 1000, 0.05);
    previous = timestamp;
    paint(motion.matches ? 0 : dt, motion.matches);
    if (!motion.matches) frameId = requestAnimationFrame(frame);
  }
  function sync() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = previous = null;
    if (!visible()) return;
    layout();
    if (width && height) frameId = requestAnimationFrame(frame);
  }
  new MutationObserver(sync).observe(slide, { attributes: true, attributeFilter: ['class'] });
  if (window.ResizeObserver) new ResizeObserver(sync).observe(box);
  window.addEventListener('resize', sync);
  document.addEventListener('visibilitychange', sync);
  if (motion.addEventListener) motion.addEventListener('change', sync);
  else motion.addListener(sync);
  sync();
}
