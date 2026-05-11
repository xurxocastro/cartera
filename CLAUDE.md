# Convenciones para Claude en este repo

- **Despliegue**: subir los cambios directamente a `main`. No crear pull requests intermedias salvo que el usuario lo pida explícitamente. GitHub Pages publica desde `main` en 1–2 min.
- **Datos cifrados**: `data/portfolio.enc.json` y `data/quotes.enc.json` se cifran con AES-GCM usando `PORTFOLIO_PASSWORD`. Para modificarlos, descifrar con `scripts/crypto-utils.mjs`, editar y recifrar reutilizando el `salt` actual del fichero (`scripts/encrypt-json.mjs --salt-from data/portfolio.enc.json`). Preservar el salt evita invalidar las sesiones `localStorage` de 365 días.
- **Cotizaciones**: la GitHub Action `Update quotes` refresca precios y dividendos cada 5 min en horario de mercado. Para tickers que Yahoo no rellene (AIM, TSXV, ETFs poco líquidos), buscar el `dividendYield` manualmente con WebSearch e inyectarlo en `data/quotes.enc.json`.
