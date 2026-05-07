# Cartera de acciones

Web estática para GitHub Pages con acceso por usuario/contraseña, sesión guardada en el navegador y seguimiento de cartera en euros.

## Privacidad

La cartera y las cotizaciones se guardan en `data/portfolio.enc.json` y `data/quotes.enc.json` usando AES-GCM. En el repositorio público no quedan nombres de activos, tickers, importes ni precios en claro.

El navegador descifra los datos después del login. Para no pedir la contraseña en cada visita, la clave derivada se guarda en `localStorage` durante 365 días en ese dispositivo.

Esto protege frente a alguien que mire el código fuente público, pero no sustituye a un backend privado: quien tenga acceso al dispositivo desbloqueado o a la contraseña podrá ver los datos.

## Publicar gratis en GitHub Pages

1. Crea un repositorio público en GitHub.
2. Sube estos archivos a la rama `main`.
3. En `Settings > Secrets and variables > Actions`, crea el secreto `PORTFOLIO_PASSWORD` con la misma contraseña que usas para entrar en la web.
4. En `Settings > Pages`, elige `Deploy from a branch`, rama `main` y carpeta `/ (root)`.
5. En `Actions`, ejecuta manualmente `Update quotes` una vez para refrescar el fichero cifrado de cotizaciones.
6. Abre la URL que GitHub Pages te muestre.

GitHub Pages gratis funciona con repositorios públicos. La diferencia aquí es que los datos personales se publican cifrados, no legibles.

## Precios y divisas

La acción `Update quotes` descifra la cartera usando el secreto de GitHub Actions, actualiza precios con fuentes gratuitas y vuelve a guardar las cotizaciones cifradas. La web carga el último fichero cifrado cada vez que refrescas la página.

La acción está programada cada 15 minutos en días laborables entre las 08:05 y las 22:50 UTC. GitHub puede retrasar algún disparo, así que no es cotización tick a tick.

## Completar tus datos

Para calcular ganancia y tiempo en cartera, abre cada fila con el botón de edición y añade:

- unidades o acciones;
- precio medio por acción en la divisa del activo;
- fecha de compra;
- valor manual en euros como respaldo.

La app trae unidades estimadas a partir de los valores iniciales para que el total se mueva cuando cambien los precios. Sustitúyelas por tus unidades reales para que los cálculos de valor y ganancia sean precisos.

Los cambios que hagas desde la web se guardan solo en el navegador del dispositivo. Si entras desde otro móvil u ordenador, tendrás que introducirlos de nuevo.
