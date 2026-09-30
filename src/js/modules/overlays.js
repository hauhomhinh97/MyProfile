export function createOverlays({ overlays }) {
  const overlay = document.querySelector("#overlay");
  const overlayKicker = document.querySelector("#overlayKicker");
  const overlayTitle = document.querySelector("#overlayTitle");
  const overlayContent = document.querySelector("#overlayContent");

  const detail = document.querySelector("#detail");
  const detailKicker = document.querySelector("#detailKicker");
  const detailTitle = document.querySelector("#detailTitle");
  const detailBody = document.querySelector("#detailBody");
  const detailTags = document.querySelector("#detailTags");
  const detailClose = document.querySelector("#detailClose");

  function openOverlay(key) {
    const data = overlays[key];
    if (!data || !overlay) return;
    closeDetail();
    overlayKicker.textContent = data.kicker;
    overlayTitle.textContent = data.title;
    overlayContent.innerHTML = data.html;
    overlay.hidden = false;
    document.body.dataset.lock = "1";
  }

  function closeOverlay() {
    if (!overlay) return;
    overlay.hidden = true;
    delete document.body.dataset.lock;
  }

  function openDetail(skill) {
    if (!skill || !detail) return;
    closeOverlay();
    detailKicker.textContent = skill.kicker;
    detailTitle.textContent = skill.label;
    detailBody.textContent = skill.body;
    detailTags.innerHTML = skill.tags.map((tag) => `<li>${tag}</li>`).join("");
    detail.hidden = false;
    document.body.dataset.lock = "1";
  }

  function closeDetail() {
    if (!detail) return;
    detail.hidden = true;
    if (overlay?.hidden !== false) delete document.body.dataset.lock;
  }

  function closeAll() {
    closeOverlay();
    closeDetail();
  }

  overlay?.addEventListener("click", (event) => {
    if (event.target === overlay) closeOverlay();
  });

  detail?.addEventListener("click", (event) => {
    if (event.target === detail) closeDetail();
  });

  overlay?.querySelectorAll("[data-close-overlay]").forEach((btn) => {
    btn.addEventListener("click", closeOverlay);
  });

  detailClose?.addEventListener("click", closeDetail);

  document.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => openOverlay(btn.dataset.open));
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAll();
  });

  return {
    openOverlay,
    openDetail,
    closeDetail,
    closeAll,
  };
}
