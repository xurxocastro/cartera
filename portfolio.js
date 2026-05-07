// Portfolio público: layout dinámico (horizontal/vertical) + lightbox
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("portfolioGridPhotos");
  if (!grid) return;

  const figures = Array.from(grid.querySelectorAll(".portfolio-photo"));
  const images = figures.map((f) => f.querySelector("img"));

  // 1) Detectar orientación de cada imagen y aplicar clase
  function classifyImage(figure, img) {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return;
    const ratio = w / h;
    figure.classList.remove("is-landscape", "is-portrait", "is-square");
    if (ratio > 1.15) {
      figure.classList.add("is-landscape");
    } else if (ratio < 0.9) {
      figure.classList.add("is-portrait");
    } else {
      figure.classList.add("is-square");
    }
    figure.style.setProperty("--ar", `${w} / ${h}`);
  }

  images.forEach((img, i) => {
    if (img.complete && img.naturalWidth) {
      classifyImage(figures[i], img);
    } else {
      img.addEventListener("load", () => classifyImage(figures[i], img), { once: true });
      img.addEventListener("error", () => figures[i].classList.add("is-portrait"), { once: true });
    }
  });

  // 2) Lightbox
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const closeBtn = document.getElementById("lightboxClose");
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");

  let currentIndex = -1;

  function openLightbox(index) {
    currentIndex = index;
    const src = images[index]?.getAttribute("src");
    if (!src) return;
    lightboxImage.src = src;
    lightbox.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.add("hidden");
    lightboxImage.removeAttribute("src");
    currentIndex = -1;
    document.body.style.overflow = "";
  }

  function showRelative(delta) {
    if (currentIndex < 0) return;
    const next = (currentIndex + delta + images.length) % images.length;
    openLightbox(next);
  }

  figures.forEach((fig, i) => {
    fig.addEventListener("click", () => openLightbox(i));
    fig.style.cursor = "zoom-in";
  });

  closeBtn?.addEventListener("click", closeLightbox);
  prevBtn?.addEventListener("click", (e) => { e.stopPropagation(); showRelative(-1); });
  nextBtn?.addEventListener("click", (e) => { e.stopPropagation(); showRelative(1); });

  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (lightbox.classList.contains("hidden")) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") showRelative(-1);
    else if (e.key === "ArrowRight") showRelative(1);
  });
});
