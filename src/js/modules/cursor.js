export function createCursorSystem({
  glowEl,
  coreEl,
  orbitEl,
  cursorEl,
  reducedMotion = false,
  onMove,
} = {}) {
  if (reducedMotion) {
    document.body.classList.add("is-native-cursor");
    return {
      destroy() {},
      getPointer() {
        return { x: 0.5, y: 0.45, clientX: 0, clientY: 0 };
      },
    };
  }

  let targetX = window.innerWidth * 0.5;
  let targetY = window.innerHeight * 0.45;
  let currentX = targetX;
  let currentY = targetY;
  let raf = 0;

  document.body.classList.add("has-custom-cursor");

  function tick() {
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;

    if (glowEl) {
      glowEl.style.left = `${currentX}px`;
      glowEl.style.top = `${currentY}px`;
    }

    if (cursorEl) {
      cursorEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    }

    const nx = currentX / window.innerWidth - 0.5;
    const ny = currentY / window.innerHeight - 0.5;

    if (coreEl) {
      coreEl.style.setProperty("--parallax-x", `${(nx * 18).toFixed(2)}px`);
      coreEl.style.setProperty("--parallax-y", `${(ny * 14).toFixed(2)}px`);
      coreEl.style.setProperty("--tilt-x", `${(-ny * 10).toFixed(2)}deg`);
      coreEl.style.setProperty("--tilt-y", `${(nx * 12).toFixed(2)}deg`);
    }

    if (orbitEl) {
      orbitEl.style.setProperty("--tilt-x", `${(-ny * 6).toFixed(2)}deg`);
      orbitEl.style.setProperty("--tilt-y", `${(nx * 8).toFixed(2)}deg`);
    }

    onMove?.(currentX / window.innerWidth, currentY / window.innerHeight, currentX, currentY);
    raf = requestAnimationFrame(tick);
  }

  function onPointerMove(event) {
    targetX = event.clientX;
    targetY = event.clientY;
  }

  function onPointerDown() {
    cursorEl?.classList.add("is-pressed");
  }

  function onPointerUp() {
    cursorEl?.classList.remove("is-pressed");
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", onPointerUp);
  raf = requestAnimationFrame(tick);

  return {
    getPointer() {
      return {
        x: currentX / window.innerWidth,
        y: currentY / window.innerHeight,
        clientX: currentX,
        clientY: currentY,
      };
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
    },
  };
}
