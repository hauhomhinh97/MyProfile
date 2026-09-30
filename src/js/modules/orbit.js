function polarToXY(angleDeg, radius, size) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const cx = size / 2;
  const cy = size / 2;
  return {
    x: cx + Math.cos(rad) * radius * (size / 2),
    y: cy + Math.sin(rad) * radius * (size / 2),
  };
}

export function createOrbit(root, skills, { onFocus, onSelect, reducedMotion = false, onPulse } = {}) {
  const linksSvg = root.querySelector("#orbitLinks");
  const nodes = new Map();
  let activeId = null;
  let focusId = null;
  let raf = 0;
  let start = performance.now();
  let pointer = { x: 0, y: 0 };
  let motionOn = !reducedMotion;
  let linkPaths = [];
  let energyPath = null;

  const ringA = document.createElement("div");
  ringA.className = "ring ring--a";
  const ringB = document.createElement("div");
  ringB.className = "ring ring--b";
  const ringC = document.createElement("div");
  ringC.className = "ring ring--c";
  const halo = document.createElement("div");
  halo.className = "orbit-halo";
  root.append(halo, ringA, ringB, ringC);

  function size() {
    return root.clientWidth || 1;
  }

  function ensureLinks() {
    if (linkPaths.length) return;
    linksSvg.innerHTML = `
      <defs>
        <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="rgba(43,183,168,0.05)"/>
          <stop offset="50%" stop-color="rgba(212,162,106,0.9)"/>
          <stop offset="100%" stop-color="rgba(43,183,168,0.05)"/>
        </linearGradient>
        <filter id="linkGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
    `;

    linkPaths = skills.map((skill) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.classList.add("orbit__link");
      path.dataset.id = skill.id;
      linksSvg.appendChild(path);
      return path;
    });

    energyPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    energyPath.classList.add("orbit__energy");
    energyPath.style.opacity = "0";
    linksSvg.appendChild(energyPath);
  }

  function updateScene(time = 0) {
    ensureLinks();
    const s = size();
    linksSvg.setAttribute("viewBox", `0 0 ${s} ${s}`);
    const cx = s / 2;
    const cy = s / 2;
    const rect = root.getBoundingClientRect();

    skills.forEach((skill, index) => {
      const entry = nodes.get(skill.id);
      if (!entry) return;
      const pos = polarToXY(entry.angle, skill.radius, s);
      let magX = 0;
      let magY = 0;

      if (motionOn && pointer.x) {
        const nx = rect.left + pos.x;
        const ny = rect.top + pos.y;
        const dx = pointer.x - nx;
        const dy = pointer.y - ny;
        const dist = Math.hypot(dx, dy);
        if (dist < 170 && dist > 0.01) {
          const force = (1 - dist / 170) * 22;
          magX = (dx / dist) * force;
          magY = (dy / dist) * force;
        }
      }

      entry.el.style.setProperty("--node-x", `${(pos.x / s) * 100}%`);
      entry.el.style.setProperty("--node-y", `${(pos.y / s) * 100}%`);
      entry.el.style.setProperty("--drift-x", `${magX.toFixed(2)}px`);
      entry.el.style.setProperty("--drift-y", `${magY.toFixed(2)}px`);
      entry.pos = pos;

      const midX = (cx + pos.x) / 2 + (pos.y - cy) * 0.16;
      const midY = (cy + pos.y) / 2 - (pos.x - cx) * 0.16;
      const d = `M ${cx} ${cy} Q ${midX} ${midY} ${pos.x} ${pos.y}`;
      const path = linkPaths[index];
      path.setAttribute("d", d);
      path.classList.toggle("is-active", focusId === skill.id);

      if (focusId === skill.id && energyPath) {
        energyPath.setAttribute("d", d);
        energyPath.style.opacity = "1";
        const len = 240;
        energyPath.style.strokeDasharray = `44 ${len}`;
        energyPath.style.strokeDashoffset = `${-((time * 0.4) % (len * 2))}`;
      }
    });

    if (!focusId && energyPath) energyPath.style.opacity = "0";
  }

  function renderNodes() {
    for (const skill of skills) {
      const node = document.createElement("div");
      node.className = "skill-node";
      node.dataset.id = skill.id;
      node.innerHTML = `
        <button class="skill-node__hit" type="button" aria-label="${skill.label}">
          <span class="skill-node__aura" aria-hidden="true"></span>
          <span class="skill-node__dot" aria-hidden="true"></span>
          <span class="skill-node__label">${skill.label}</span>
        </button>
      `;

      const button = node.querySelector("button");
      button.addEventListener("pointerenter", (event) => {
        setFocus(skill.id);
        onPulse?.(event.clientX, event.clientY, 0.45);
      });
      button.addEventListener("focus", () => setFocus(skill.id));
      button.addEventListener("pointerleave", () => {
        if (activeId !== skill.id) clearFocus();
      });
      button.addEventListener("blur", () => {
        if (activeId !== skill.id) clearFocus();
      });
      button.addEventListener("click", (event) => {
        activeId = skill.id;
        setFocus(skill.id);
        onPulse?.(event.clientX, event.clientY, 1);
        onSelect?.(skill);
      });

      node.style.animationDelay = `${0.1 + nodes.size * 0.07}s`;
      root.appendChild(node);
      nodes.set(skill.id, {
        el: node,
        skill,
        baseAngle: skill.angle,
        angle: skill.angle,
        pos: { x: 0, y: 0 },
      });
    }
  }

  function setFocus(id) {
    focusId = id;
    for (const [nodeId, entry] of nodes) {
      entry.el.classList.toggle("is-active", nodeId === id);
      entry.el.classList.toggle("is-dim", Boolean(id) && nodeId !== id);
    }
    const skill = skills.find((item) => item.id === id) || null;
    onFocus?.(skill, Boolean(activeId));
  }

  function clearFocus() {
    if (activeId) {
      setFocus(activeId);
      return;
    }
    focusId = null;
    for (const entry of nodes.values()) {
      entry.el.classList.remove("is-active", "is-dim");
    }
    onFocus?.(null, false);
  }

  function reset() {
    activeId = null;
    focusId = null;
    clearFocus();
  }

  function tick(time) {
    const t = (time - start) / 1000;
    if (motionOn) {
      for (const entry of nodes.values()) {
        entry.angle = entry.baseAngle + t * (4.5 + entry.skill.radius * 2.8);
      }
    }
    updateScene(time);
    raf = requestAnimationFrame(tick);
  }

  renderNodes();
  ensureLinks();
  updateScene();
  window.addEventListener("resize", () => updateScene(performance.now()));
  raf = requestAnimationFrame(tick);

  return {
    reset,
    setPointer(x, y) {
      pointer = { x, y };
    },
    setMotion(enabled) {
      motionOn = enabled && !reducedMotion;
      if (!motionOn) {
        for (const entry of nodes.values()) {
          entry.angle = entry.baseAngle;
          entry.el.style.setProperty("--drift-x", "0px");
          entry.el.style.setProperty("--drift-y", "0px");
        }
      } else {
        start = performance.now();
      }
    },
    destroy() {
      cancelAnimationFrame(raf);
    },
  };
}
