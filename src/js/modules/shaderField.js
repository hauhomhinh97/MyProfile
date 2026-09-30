const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_pulse;
uniform vec3 u_bg;
uniform vec3 u_accent;
uniform vec3 u_teal;
uniform vec3 u_hot;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
  vec2 m = (u_mouse * u_res - 0.5 * u_res) / min(u_res.x, u_res.y);

  float dist = length(p - m);
  float ripple = sin(dist * 28.0 - u_time * 3.2) * exp(-dist * 3.4) * (0.035 + u_pulse * 0.08);
  vec2 warp = normalize(p - m + 0.0001) * ripple;
  warp += 0.04 * vec2(
    fbm(p * 1.8 + u_time * 0.08),
    fbm(p * 1.8 - u_time * 0.07 + 3.1)
  );

  vec2 q = p + warp;
  float n1 = fbm(q * 2.2 + vec2(u_time * 0.05, -u_time * 0.03));
  float n2 = fbm(q * 3.4 - vec2(u_time * 0.04, u_time * 0.06) + n1);
  float field = smoothstep(0.28, 0.82, n2);

  float veins = smoothstep(0.45, 0.55, abs(n1 - 0.5));
  float glow = exp(-dist * 2.2) * (0.35 + u_pulse * 0.55);
  float core = exp(-length(q) * 1.35) * 0.55;

  // soft chromatic shift near cursor
  float aberr = 0.004 + u_pulse * 0.006;
  float fr = fbm(q * 2.2 + vec2(aberr, 0.0) + u_time * 0.05);
  float fb = fbm(q * 2.2 - vec2(aberr, 0.0) + u_time * 0.05);

  vec3 col = u_bg;
  // Rich teal / amber atmosphere (match the earlier canvas look)
  col += u_teal * field * 0.72;
  col += u_accent * (1.0 - field) * 0.38;
  col += u_hot * veins * 0.28;
  col += mix(u_teal, u_hot, fr) * glow * 1.05;
  col += u_accent * core * 0.55;
  col += u_teal * core * 0.25;
  col.r += fr * glow * 0.18;
  col.b += fb * glow * 0.2;

  // light streaks
  float streak = pow(max(0.0, 1.0 - abs(q.y + n1 * 0.2) * 2.4), 8.0);
  col += u_hot * streak * 0.2;

  // soft vignette — keep color punch in the center
  float vig = smoothstep(1.35, 0.15, length(p * vec2(1.05, 1.2)));
  col *= mix(0.72, 1.0, vig);

  // film grain
  float grain = hash(uv * u_res + u_time) * 0.035;
  col += grain - 0.015;

  gl_FragColor = vec4(col, 1.0);
}
`;

function hexToRgb(hex) {
  const raw = hex.replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  const int = Number.parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255].map((v) => v / 255);
}

function readTheme() {
  const s = getComputedStyle(document.documentElement);
  return {
    bg: hexToRgb(s.getPropertyValue("--bg-0").trim() || "#071016"),
    accent: hexToRgb(s.getPropertyValue("--accent").trim() || "#d4a26a"),
    teal: hexToRgb(s.getPropertyValue("--teal").trim() || "#2bb7a8"),
    hot: hexToRgb(s.getPropertyValue("--accent-hot").trim() || "#f0c48a"),
  };
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(info || "Shader compile failed");
  }
  return shader;
}

export function createShaderField(canvas, { reducedMotion = false } = {}) {
  const gl = canvas.getContext("webgl", {
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
  });

  if (!gl) return null;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let running = !reducedMotion;
  let pointer = { x: 0.5, y: 0.5 };
  let pulse = 0;
  let theme = readTheme();

  const vs = createShader(gl, gl.VERTEX_SHADER, VERT);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAG);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return null;
  }

  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {
    res: gl.getUniformLocation(program, "u_res"),
    time: gl.getUniformLocation(program, "u_time"),
    mouse: gl.getUniformLocation(program, "u_mouse"),
    pulse: gl.getUniformLocation(program, "u_pulse"),
    bg: gl.getUniformLocation(program, "u_bg"),
    accent: gl.getUniformLocation(program, "u_accent"),
    teal: gl.getUniformLocation(program, "u_teal"),
    hot: gl.getUniformLocation(program, "u_hot"),
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function draw(time) {
    pulse *= 0.93;
    gl.uniform2f(uniforms.res, canvas.width, canvas.height);
    gl.uniform1f(uniforms.time, time * 0.001);
    gl.uniform2f(uniforms.mouse, pointer.x, 1 - pointer.y);
    gl.uniform1f(uniforms.pulse, pulse);
    gl.uniform3fv(uniforms.bg, theme.bg);
    gl.uniform3fv(uniforms.accent, theme.accent);
    gl.uniform3fv(uniforms.teal, theme.teal);
    gl.uniform3fv(uniforms.hot, theme.hot);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (running) raf = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  if (running) raf = requestAnimationFrame(draw);
  else draw(0);

  return {
    setPointer(nx, ny) {
      pointer = { x: nx, y: ny };
    },
    pulse(amount = 1) {
      pulse = Math.min(1.8, pulse + amount);
    },
    refreshTheme() {
      theme = readTheme();
    },
    start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(draw);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      draw(performance.now());
    },
    destroy() {
      this.stop();
      window.removeEventListener("resize", resize);
    },
  };
}
