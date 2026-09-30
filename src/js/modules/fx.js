function readAccent() {
  const styles = getComputedStyle(document.documentElement);
  return {
    accent: styles.getPropertyValue("--accent-hot").trim() || "#f0c48a",
    teal: styles.getPropertyValue("--teal").trim() || "#2bb7a8",
  };
}

function hexToRgb(hex) {
  const raw = hex.replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  const int = Number.parseInt(full, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

export function createFxLayer(canvas, { reducedMotion = false } = {}) {
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let running = !reducedMotion;
  const trail = [];
  const sparks = [];
  const ripples = [];
  let pointer = { x: -999, y: -999 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pushTrail(x, y) {
    trail.push({ x, y, life: 1 });
    if (trail.length > 28) trail.shift();
  }

  function sparkAt(x, y, count = 16) {
    const colors = readAccent();
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 1.5 + Math.random() * 3.5;
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: i % 2 ? colors.accent : colors.teal,
      });
    }
  }

  function rippleAt(x, y) {
    ripples.push({ x, y, r: 8, life: 1 });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const colors = readAccent();
    const accent = hexToRgb(colors.accent);
    const teal = hexToRgb(colors.teal);

    if (trail.length > 1) {
      for (let i = 1; i < trail.length; i += 1) {
        const prev = trail[i - 1];
        const curr = trail[i];
        const alpha = (i / trail.length) * curr.life * 0.65;
        ctx.strokeStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${alpha})`;
        ctx.lineWidth = 2 + (i / trail.length) * 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.stroke();
      }
    }

    for (let i = trail.length - 1; i >= 0; i -= 1) {
      trail[i].life *= 0.92;
      if (trail[i].life < 0.04) trail.splice(i, 1);
    }

    for (let i = sparks.length - 1; i >= 0; i -= 1) {
      const s = sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.94;
      s.vy *= 0.94;
      s.life *= 0.9;
      const rgb = hexToRgb(s.color);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${s.life})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.6 + s.life * 1.8, 0, Math.PI * 2);
      ctx.fill();
      if (s.life < 0.05) sparks.splice(i, 1);
    }

    for (let i = ripples.length - 1; i >= 0; i -= 1) {
      const r = ripples[i];
      r.r += 4.5;
      r.life *= 0.94;
      ctx.strokeStyle = `rgba(${teal.r}, ${teal.g}, ${teal.b}, ${r.life * 0.55})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${r.life * 0.35})`;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      if (r.life < 0.05 || r.r > 220) ripples.splice(i, 1);
    }

    if (pointer.x > 0) {
      const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 18);
      g.addColorStop(0, `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.9)`);
      g.addColorStop(0.4, `rgba(${teal.r}, ${teal.g}, ${teal.b}, 0.35)`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    if (running) raf = requestAnimationFrame(draw);
  }

  function setPointer(x, y) {
    pointer = { x, y };
    if (!reducedMotion) pushTrail(x, y);
  }

  function burst(x, y) {
    if (reducedMotion) return;
    sparkAt(x, y);
    rippleAt(x, y);
  }

  function start() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(draw);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    ctx.clearRect(0, 0, width, height);
  }

  resize();
  window.addEventListener("resize", resize);
  if (running) raf = requestAnimationFrame(draw);

  return {
    setPointer,
    burst,
    start,
    stop,
    destroy() {
      stop();
      window.removeEventListener("resize", resize);
    },
  };
}
