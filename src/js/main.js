import { skills, overlays } from "./data/content.js";
import { createAurora } from "./modules/aurora.js";
import { createCursorSystem } from "./modules/cursor.js";
import { createFxLayer } from "./modules/fx.js";
import { createMagneticType } from "./modules/magneticType.js";
import { createOrbit } from "./modules/orbit.js";
import { createOverlays } from "./modules/overlays.js";
import { scrambleText } from "./modules/scramble.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const themes = ["", "ember", "ice"];

const orbitRoot = document.querySelector("#orbit");
const core = document.querySelector("#core");
const glow = document.querySelector("#cursorGlow");
const cursorEl = document.querySelector("#cursor");
const auroraCanvas = document.querySelector("#aurora");
const fxCanvas = document.querySelector("#fx");
const hudEngine = document.querySelector("#hudEngine");
const hudMode = document.querySelector("#hudMode");
const hudFocus = document.querySelector("#hudFocus");
const hudFps = document.querySelector("#hudFps");
const dockHint = document.querySelector("#dockHint");
const toggleMotion = document.querySelector("#toggleMotion");
const toggleTheme = document.querySelector("#toggleTheme");
const nameEl = document.querySelector(".hero__name");

document.body.classList.add("is-booting");

const ui = createOverlays({ overlays });

// Keep the CSS atmosphere (the look from static index.html).
// Effects run as a transparent overlay so base colors stay intact.
hudEngine.textContent = "CANVAS";
document.body.classList.add("has-css-atmosphere");

const aurora = createAurora(auroraCanvas, {
  reducedMotion,
  overlay: true,
});
const fx = createFxLayer(fxCanvas, { reducedMotion });
const magnetic = createMagneticType(nameEl, { reducedMotion });

const field = {
  setPointer(nx, ny) {
    aurora.setPointer(nx, ny);
  },
  pulse(amount) {
    aurora.pulse(amount);
  },
  refreshTheme() {
    aurora.refreshTheme();
  },
  start() {
    aurora.start();
  },
  stop() {
    aurora.stop();
  },
};

const orbit = createOrbit(orbitRoot, skills, {
  reducedMotion,
  onFocus(skill) {
    hudFocus.textContent = skill ? skill.label.toUpperCase() : "—";
    hudMode.textContent = skill ? "INSPECT" : "ORBIT";
    dockHint.textContent = skill
      ? `${skill.label} · click to open · Esc resets`
      : "Warp the field · Pull nodes · Click for shockwave";
    if (skill) field.pulse(0.45);
  },
  onSelect(skill) {
    ui.openDetail(skill);
    field.pulse(1.2);
  },
  onPulse(x, y, strength = 1) {
    fx.burst(x, y);
    field.pulse(strength);
  },
});

createCursorSystem({
  glowEl: glow,
  coreEl: core,
  orbitEl: orbitRoot,
  cursorEl,
  reducedMotion,
  onMove(nx, ny, x, y) {
    field.setPointer(nx, ny);
    fx.setPointer(x, y);
    orbit.setPointer(x, y);
    magnetic.setPointer(x, y);
  },
});

window.addEventListener(
  "pointerdown",
  (event) => {
    if (event.target.closest("button, a")) return;
    fx.burst(event.clientX, event.clientY);
    field.pulse(0.75);
  },
  { passive: true }
);

let frames = 0;
let lastFpsStamp = performance.now();
function trackFps(now) {
  frames += 1;
  if (now - lastFpsStamp >= 1000) {
    hudFps.textContent = String(frames);
    frames = 0;
    lastFpsStamp = now;
  }
  requestAnimationFrame(trackFps);
}
if (!reducedMotion) requestAnimationFrame(trackFps);

let motionEnabled = !reducedMotion;
toggleMotion?.addEventListener("click", () => {
  motionEnabled = !motionEnabled;
  toggleMotion.setAttribute("aria-pressed", String(motionEnabled));
  document.body.classList.toggle("is-motion-off", !motionEnabled);
  orbit.setMotion(motionEnabled);
  if (motionEnabled) {
    field.start();
    fx.start();
  } else {
    field.stop();
    fx.stop();
  }
});

let themeIndex = 0;
toggleTheme?.addEventListener("click", () => {
  themeIndex = (themeIndex + 1) % themes.length;
  const theme = themes[themeIndex];
  if (theme) document.documentElement.setAttribute("data-theme", theme);
  else document.documentElement.removeAttribute("data-theme");
  field.refreshTheme();
  field.pulse(1);
  fx.burst(window.innerWidth / 2, window.innerHeight / 2);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    ui.closeAll();
    orbit.reset();
    hudMode.textContent = "ORBIT";
    hudFocus.textContent = "—";
  }
});

function runIntroScramble(duration = 1200) {
  scrambleText(nameEl, {
    duration,
    onComplete: () => magnetic.split(),
  });
}

document.querySelector(".brand")?.addEventListener("click", (event) => {
  runIntroScramble(700);
  fx.burst(event.clientX, event.clientY);
  field.pulse(1);
});

window.setTimeout(() => {
  document.body.classList.remove("is-booting");
  document.body.classList.add("is-alive");
  runIntroScramble(1200);
  field.pulse(1.4);
  fx.burst(window.innerWidth / 2, window.innerHeight / 2);
}, 120);
