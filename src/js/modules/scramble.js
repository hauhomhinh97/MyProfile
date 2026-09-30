const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/\\|";

function scrambleOne(el, { duration = 900 } = {}) {
  return new Promise((resolve) => {
    if (!el) {
      resolve();
      return;
    }

    const finalText = el.dataset.scramble || el.textContent.replace(/\u00A0/g, " ");
    el.textContent = finalText;
    el.classList.remove("is-magnetic");

    const length = finalText.length;
    const start = performance.now();
    let frame = 0;

    function update(now) {
      const progress = Math.min(1, (now - start) / duration);
      const reveal = Math.floor(progress * length);
      let output = "";

      for (let i = 0; i < length; i += 1) {
        if (finalText[i] === " ") {
          output += " ";
          continue;
        }
        if (i < reveal) output += finalText[i];
        else output += GLYPHS[(frame + i) % GLYPHS.length];
      }

      el.textContent = output;
      frame += 1;

      if (progress < 1) requestAnimationFrame(update);
      else {
        el.textContent = finalText;
        resolve();
      }
    }

    requestAnimationFrame(update);
  });
}

export function scrambleText(el, { duration = 900, onComplete } = {}) {
  if (!el) return;

  const lines = el.querySelectorAll("[data-scramble]");
  const targets = lines.length ? [...lines] : [el];

  Promise.all(targets.map((target, index) =>
    scrambleOne(target, { duration: duration + index * 120 })
  )).then(() => onComplete?.());
}
