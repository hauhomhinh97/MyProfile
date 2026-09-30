function splitLine(lineEl) {
  const text = (lineEl.dataset.scramble || lineEl.textContent).replace(/\u00A0/g, " ").trim();
  lineEl.textContent = "";
  lineEl.classList.add("is-magnetic");
  const letters = [];

  for (const ch of text) {
    const span = document.createElement("span");
    span.className = "magnet-letter";
    span.textContent = ch;
    lineEl.appendChild(span);
    letters.push(span);
  }

  return letters;
}

export function createMagneticType(rootEl, { reducedMotion = false } = {}) {
  if (!rootEl || reducedMotion) {
    return { setPointer() {}, split() {}, destroy() {} };
  }

  let letters = [];
  const lines = () => [...rootEl.querySelectorAll(".hero__name-line")];

  function split() {
    letters = [];
    rootEl.classList.add("is-stacked");
    for (const line of lines()) {
      letters.push(...splitLine(line));
    }
  }

  function setPointer(clientX, clientY) {
    if (!letters.length) return;
    for (const span of letters) {
      const rect = span.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < 120 && dist > 0.01) {
        const force = (1 - dist / 120) * 12;
        const ox = (dx / dist) * force;
        const oy = (dy / dist) * force;
        span.style.transform = `translate3d(${ox.toFixed(2)}px, ${oy.toFixed(2)}px, 0) scale(${(1 + force * 0.01).toFixed(3)})`;
      } else {
        span.style.transform = "translate3d(0,0,0) scale(1)";
      }
    }
  }

  return {
    split,
    setPointer,
    destroy() {
      for (const line of lines()) {
        line.textContent = line.dataset.scramble || line.textContent;
        line.classList.remove("is-magnetic");
      }
      rootEl.classList.remove("is-stacked");
      letters = [];
    },
  };
}
