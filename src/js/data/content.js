export const skills = [
  {
    id: "css",
    label: "CSS Artistry",
    angle: -20,
    radius: 0.38,
    kicker: "Visual systems",
    body: "Design tokens, layered atmospheres, fluid layouts that stay locked to one viewport — motion as hierarchy, not decoration.",
    tags: ["Grid", "Mask", "Blend", "Variables"],
  },
  {
    id: "js",
    label: "JavaScript",
    angle: 28,
    radius: 0.42,
    kicker: "Interaction craft",
    body: "Pointer-driven scenes, FLIP-friendly transitions, and canvas loops tuned for 60fps with graceful reduced-motion fallbacks.",
    tags: ["ES Modules", "RAF", "WAAPI", "Canvas"],
  },
  {
    id: "ui",
    label: "UI Systems",
    angle: 78,
    radius: 0.36,
    kicker: "Product feel",
    body: "Interfaces that read as one composition: brand-first hierarchy, purposeful type, and controls that feel springy without noise.",
    tags: ["Typography", "HUD", "A11y", "Motion"],
  },
  {
    id: "react",
    label: "React",
    angle: 128,
    radius: 0.41,
    kicker: "Component thinking",
    body: "Composable UI with clear state boundaries — ready when the stage grows into a full product surface.",
    tags: ["Hooks", "Architecture", "DX"],
  },
  {
    id: "perf",
    label: "Performance",
    angle: 175,
    radius: 0.37,
    kicker: "Smooth under load",
    body: "GPU-friendly transforms, paint-conscious layers, and budgets that keep the orbit silky on mid-range devices.",
    tags: ["60fps", "LCP", "Will-change"],
  },
  {
    id: "design",
    label: "Design Sense",
    angle: 220,
    radius: 0.4,
    kicker: "Taste + craft",
    body: "Atmosphere over flat fill. Real depth, intentional contrast, and restraint — every effect earns its place.",
    tags: ["Direction", "Color", "Composition"],
  },
  {
    id: "api",
    label: "APIs",
    angle: 268,
    radius: 0.35,
    kicker: "Connected experiences",
    body: "Clean contracts between UI and data — resilient loading states that never break the single-frame illusion.",
    tags: ["REST", "Async", "UX states"],
  },
  {
    id: "tooling",
    label: "Tooling",
    angle: 318,
    radius: 0.39,
    kicker: "Ship quality",
    body: "Fast feedback loops, modular structure, and assets organized so the craft stays maintainable as it scales.",
    tags: ["Vite-ready", "Modules", "Git"],
  },
];

export const overlays = {
  about: {
    kicker: "Profile",
    title: "Built for presence",
    html: `
      <p>I craft digital stages — interfaces that feel cinematic, responsive, and intentional from the first frame.</p>
      <p>This profile is a single viewport on purpose: no scroll, no clutter — only hierarchy, motion, and craft you can feel.</p>
      <p>Stack comfort zone: modern CSS, vanilla JS modules, React when the product needs it, and a stubborn eye for polish.</p>
    `,
  },
  work: {
    kicker: "Selected",
    title: "Signals from the lab",
    html: `
      <div class="overlay__list">
        <article class="overlay__card">
          <h3>Orbit Profile</h3>
          <p>This stage — constellation skills, aurora canvas, and pointer-linked atmosphere locked to one screen.</p>
        </article>
        <article class="overlay__card">
          <h3>Motion Systems</h3>
          <p>Micro-interactions with weight: scramble type, breathing core, orbit drift, and theme shifts without reload.</p>
        </article>
        <article class="overlay__card">
          <h3>Product UI</h3>
          <p>Dense tools made calm — HUD patterns, clear focus states, and copy that guides without shouting.</p>
        </article>
      </div>
    `,
  },
  contact: {
    kicker: "Connect",
    title: "Open channel",
    html: `
      <p>Have a product, brand, or wild interface idea? Let’s build a frame people remember.</p>
      <div class="contact-grid">
        <a class="contact-link" href="mailto:hello@nguyenhau.dev">
          <span>Email</span>
          <span>hello@nguyenhau.dev</span>
        </a>
        <a class="contact-link" href="https://github.com/" target="_blank" rel="noreferrer">
          <span>GitHub</span>
          <span>OPEN ↗</span>
        </a>
        <a class="contact-link" href="https://www.linkedin.com/" target="_blank" rel="noreferrer">
          <span>LinkedIn</span>
          <span>OPEN ↗</span>
        </a>
      </div>
    `,
  },
};
