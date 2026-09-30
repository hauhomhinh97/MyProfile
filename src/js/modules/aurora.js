const PARTICLE_COUNT = 72;

function readColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    accent: styles.getPropertyValue("--accent").trim() || "#d4a26a",
    accentHot: styles.getPropertyValue("--accent-hot").trim() || "#f0c48a",
    teal: styles.getPropertyValue("--teal").trim() || "#2bb7a8",
    bg: styles.getPropertyValue("--bg-0").trim() || "#071016",
  };
}

function hexToRgb(hex) {
  const raw = hex.replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  const int = Number.parseInt(full, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function createAurora(canvas, { reducedMotion = false, overlay = false } = {}) {
  const ctx = canvas.getContext("2d", { alpha: overlay });
  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let colors = readColors();
  let running = !reducedMotion;
  let pointer = { x: 0.5, y: 0.45, vx: 0, vy: 0 };
  let prevPointer = { x: 0.5, y: 0.45 };
  let burst = 0;
  const particleCount = overlay ? 48 : PARTICLE_COUNT;

  const blobs = overlay
    ? []
    : Array.from({ length: 7 }, (_, i) => ({
        x: 0.18 + (i % 4) * 0.2,
        y: 0.22 + Math.floor(i / 3) * 0.22,
        r: 0.22 + (i % 4) * 0.06,
        speed: 0.00035 + i * 0.00007,
        phase: i * 1.1,
        hue: i % 2,
      }));

  const particles = Array.from({ length: particleCount }, () => spawnParticle());

  function spawnParticle(nearPointer = false) {
    const spread = nearPointer ? 0.12 : 1;
    return {
      x: nearPointer ? pointer.x + (Math.random() - 0.5) * spread : Math.random(),
      y: nearPointer ? pointer.y + (Math.random() - 0.5) * spread : Math.random(),
      vx: (Math.random() - 0.5) * 0.0012,
      vy: (Math.random() - 0.5) * 0.0012,
      z: Math.random(),
      s: 0.6 + Math.random() * 2.2,
      life: 0.5 + Math.random() * 0.5,
    };
  }

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

  function drawRays(time) {
    const cx = width * 0.5 + (pointer.x - 0.5) * 40;
    const cy = height * 0.48 + (pointer.y - 0.5) * 30;
    const rays = 10;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time * 0.00005);
    for (let i = 0; i < rays; i += 1) {
      const angle = (i / rays) * Math.PI * 2;
      const len = Math.min(width, height) * (0.35 + (i % 3) * 0.08);
      ctx.rotate(angle);
      const g = ctx.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, rgba(colors.accentHot, 0.14 + burst * 0.1));
      g.addColorStop(0.45, rgba(colors.teal, 0.04));
      g.addColorStop(1, rgba(colors.bg, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -2.5);
      ctx.lineTo(len, -18);
      ctx.lineTo(len, 18);
      ctx.lineTo(0, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.rotate(-angle);
    }
    ctx.restore();
  }

  function drawBlobs(time) {
    ctx.globalCompositeOperation = "lighter";
    for (const blob of blobs) {
      const swirl = Math.sin(time * blob.speed + blob.phase);
      const x =
        (blob.x + swirl * 0.12 + (pointer.x - 0.5) * 0.1) * width;
      const y =
        (blob.y + Math.cos(time * blob.speed * 1.35 + blob.phase) * 0.1 + (pointer.y - 0.5) * 0.08) *
        height;
      const radius = blob.r * Math.min(width, height) * (1 + burst * 0.15);
      const tint = blob.hue ? colors.accent : colors.teal;
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, rgba(tint, 0.34));
      g.addColorStop(0.35, rgba(tint, 0.14));
      g.addColorStop(1, rgba(colors.bg, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function drawPointerField() {
    const x = pointer.x * width;
    const y = pointer.y * height;
    const radius = Math.min(width, height) * (0.22 + burst * 0.08);
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, rgba(colors.accentHot, 0.22 + burst * 0.2));
    g.addColorStop(0.35, rgba(colors.teal, 0.12));
    g.addColorStop(1, rgba(colors.bg, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawParticles(time) {
    const px = pointer.x * width;
    const py = pointer.y * height;
    const positions = [];

    for (const p of particles) {
      const dx = pointer.x - p.x;
      const dy = pointer.y - p.y;
      const dist = Math.hypot(dx, dy) + 0.0001;
      p.vx += (dx / dist) * 0.000018 + pointer.vx * 0.02;
      p.vy += (dy / dist) * 0.000018 + pointer.vy * 0.02;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.x += p.vx + Math.sin(time * 0.001 + p.z * 12) * 0.00008;
      p.y += p.vy + Math.cos(time * 0.0012 + p.z * 9) * 0.00008;

      if (p.x < -0.05 || p.x > 1.05 || p.y < -0.05 || p.y > 1.05) {
        Object.assign(p, spawnParticle(Math.random() > 0.55));
      }

      const x = p.x * width;
      const y = p.y * height;
      positions.push({ x, y, z: p.z, s: p.s });

      const near = Math.hypot(x - px, y - py);
      const alpha = 0.18 + p.z * 0.45 + (near < 160 ? 0.25 : 0);
      ctx.fillStyle = rgba(near < 140 ? colors.accentHot : colors.teal, alpha);
      ctx.beginPath();
      ctx.arc(x, y, p.s * (near < 120 ? 1.5 : 1), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.lineWidth = 1;
    for (let i = 0; i < positions.length; i += 1) {
      const a = positions[i];
      for (let j = i + 1; j < positions.length; j += 3) {
        const b = positions[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > 100) continue;
        const alpha = (1 - d / 100) * 0.2;
        ctx.strokeStyle = rgba(colors.teal, alpha);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      const dPointer = Math.hypot(a.x - px, a.y - py);
      if (dPointer < 140) {
        ctx.strokeStyle = rgba(colors.accent, (1 - dPointer / 140) * 0.4);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
    }
  }

  function draw(time) {
    colors = readColors();
    burst *= 0.92;

    if (overlay) {
      ctx.clearRect(0, 0, width, height);
    } else {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);

      const wash = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        0,
        width * 0.5,
        height * 0.45,
        Math.max(width, height) * 0.7
      );
      wash.addColorStop(0, rgba(colors.teal, 0.12));
      wash.addColorStop(0.45, rgba(colors.accent, 0.05));
      wash.addColorStop(1, colors.bg);
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, height);

      drawRays(time);
      drawBlobs(time);
      drawPointerField();
    }

    drawParticles(time);

    if (running) raf = requestAnimationFrame(draw);
  }

  function start() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(draw);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    draw(performance.now());
  }

  function setPointer(nx, ny) {
    pointer.vx = nx - prevPointer.x;
    pointer.vy = ny - prevPointer.y;
    prevPointer = { x: nx, y: ny };
    pointer.x = nx;
    pointer.y = ny;
  }

  function pulse(amount = 1) {
    burst = Math.min(1.5, burst + amount);
  }

  function refreshTheme() {
    colors = readColors();
    if (!running) draw(performance.now());
  }

  resize();
  window.addEventListener("resize", resize);
  if (running) raf = requestAnimationFrame(draw);
  else draw(0);

  return {
    setPointer,
    pulse,
    start,
    stop,
    refreshTheme,
    destroy() {
      stop();
      window.removeEventListener("resize", resize);
    },
  };
}
