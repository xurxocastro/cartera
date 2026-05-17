# Xurxo Castro — Portfolio

Galería fotográfica estática. Masonry CSS + lightbox + smooth scroll (Lenis).

## Estructura

- `index.html` — página principal con la galería.
- `portfolio.css` — estilos.
- `portfolio.js` — lightbox y smooth scroll.
- `images/` — originales (JPG/WEBP) servidos al abrir lightbox.
- `images/w/` — variantes WebP optimizadas usadas en la grid.

## Despliegue

GitHub Pages desde `main`. URL pública: <https://xurxocastro.github.io/portfolio/>.

`.nojekyll` evita el procesado de Jekyll y respeta nombres con guiones bajos o tildes.

## Añadir fotos

1. Copiar el original a `images/` (jpg/webp).
2. Generar una variante optimizada en `images/w/` (mismo nombre, `.webp`).
3. Añadir un `<figure class="portfolio-photo">` en `index.html` con `width`/`height` reales.
