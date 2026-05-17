// Portfolio público: masonry CSS columns + lightbox
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("portfolioGridPhotos");
  if (!grid) return;

  const figures = Array.from(grid.querySelectorAll(".portfolio-photo"));
  const images = figures.map((f) => f.querySelector("img"));

  // Lightbox — shows original JPEG (full quality) when opened
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const closeBtn = document.getElementById("lightboxClose");
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");

  let currentIndex = -1;

  function openLightbox(index) {
    currentIndex = index;
    const img = images[index];
    if (!img) return;
    // Prefer the original src (JPEG) over the WebP thumbnail for lightbox
    lightboxImage.src = img.getAttribute("src");
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
    openLightbox((currentIndex + delta + images.length) % images.length);
  }

  figures.forEach((fig, i) => {
    fig.addEventListener("click", () => openLightbox(i));
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
