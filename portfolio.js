// Portfolio público: masonry CSS columns + lightbox + smooth scroll
document.addEventListener("DOMContentLoaded", () => {
  // Butter-smooth scrolling (Lenis). Higher `duration` = slower, more drawn-out.
  if (typeof Lenis !== "undefined" && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const lenis = new Lenis({
      duration: 1.3,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.0,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    // Pause Lenis while the lightbox is open so it doesn't fight body overflow:hidden
    window.__lenis = lenis;
  }

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
    // Use the optimized WebP (from <source>) for fast loading; fall back to original
    const source = img.closest("picture")?.querySelector('source[type="image/webp"]');
    lightboxImage.src = source?.getAttribute("srcset") || img.getAttribute("src");
    lightbox.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    window.__lenis?.stop();
  }

  function closeLightbox() {
    lightbox.classList.add("hidden");
    lightboxImage.removeAttribute("src");
    currentIndex = -1;
    document.body.style.overflow = "";
    window.__lenis?.start();
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
