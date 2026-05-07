#!/usr/bin/env bash
# Sube los cambios pendientes a GitHub para que GitHub Pages los publique.
# Uso:
#   ./deploy.sh                 -> usa un mensaje automático
#   ./deploy.sh "tu mensaje"    -> usa el mensaje que pases
set -euo pipefail

cd "$(dirname "$0")"

# Limpia cualquier lock de git colgado de un proceso anterior
[ -f .git/index.lock ] && rm -f .git/index.lock

# Mensaje de commit
MSG="${1:-update site}"

# Primero: stage + commit de los cambios locales (si los hay).
# Hacemos esto ANTES del rebase para no chocar con "unstaged changes".
git add -A
if git diff --cached --quiet; then
  echo "Sin cambios pendientes que commitear."
else
  git commit -m "$MSG"
fi

# Ahora sí, rebase con remoto y push
git pull --rebase origin main
git push origin main

echo ""
echo "Subido. GitHub Pages tarda 1-2 min en redesplegar."
echo "Portfolio: https://xurxocastro.github.io/cartera/"
echo "Cartera:   https://xurxocastro.github.io/cartera/cartera.html"
