const GH_TOKEN_KEY = "cartera.github-token.v1";
const GH_OWNER = "xurxocastro";
const GH_REPO = "cartera";
const GH_BRANCH = "main";

/* ── Token storage ────────────────────────────────────────────── */

function ghLoadToken() {
  return localStorage.getItem(GH_TOKEN_KEY) || "";
}

function ghSaveToken(token) {
  localStorage.setItem(GH_TOKEN_KEY, token.trim());
}

/* ── GitHub API ───────────────────────────────────────────────── */

async function ghGetFileSha(filePath) {
  const token = ghLoadToken();
  if (!token) return null;
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${filePath}?ref=${GH_BRANCH}`,
      { headers: { "Authorization": `token ${token}`, "Accept": "application/vnd.github+json" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.sha || null;
  } catch {
    return null;
  }
}

async function ghPutFile(filePath, contentString, commitMessage) {
  const token = ghLoadToken();
  if (!token) throw new Error("NO_TOKEN");

  const sha = await ghGetFileSha(filePath);
  const b64 = btoa(contentString);
  const body = { message: commitMessage, content: b64, branch: GH_BRANCH };
  if (sha) body.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  if (res.status === 401) throw new Error("INVALID_TOKEN");
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  return res.json();
}

/* ── Token dialog (created lazily) ───────────────────────────── */

let _tokenDialog = null;
let _pendingResolve = null;

function _getTokenDialog() {
  if (_tokenDialog) return _tokenDialog;

  const dialog = document.createElement("dialog");
  dialog.id = "githubTokenDialog";
  dialog.className = "edit-dialog";
  dialog.innerHTML = `
    <div class="dialog-header">
      <h2 class="dialog-title">Conectar con GitHub</h2>
      <button type="button" class="icon-button" id="_ghClose" title="Cerrar" aria-label="Cerrar">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
    <div style="padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem;">
      <p style="margin:0;color:var(--muted);">Introduce un token de GitHub para sincronizar los datos entre dispositivos. Solo tienes que hacerlo una vez por navegador.</p>
      <p style="margin:0;"><a href="https://github.com/settings/tokens/new?scopes=public_repo&description=Cartera+sync" target="_blank" rel="noopener noreferrer" style="color:var(--blue);">Crear token en GitHub →</a></p>
      <div style="display:flex;flex-direction:column;gap:.375rem;">
        <label for="_ghTokenInput" style="font-size:.8125rem;font-weight:600;">Token de acceso personal</label>
        <input id="_ghTokenInput" type="password" placeholder="ghp_…" autocomplete="off" style="font-family:monospace;font-size:.875rem;">
      </div>
      <p class="form-error" id="_ghTokenError" role="alert" style="margin:0;"></p>
    </div>
    <div class="dialog-footer">
      <button type="button" id="_ghCancel" class="secondary-button">Cancelar (solo local)</button>
      <button type="button" id="_ghSave" class="primary-button">Guardar y sincronizar</button>
    </div>
  `;
  document.body.appendChild(dialog);

  const close = (ok) => {
    dialog.close();
    if (_pendingResolve) { _pendingResolve(ok); _pendingResolve = null; }
  };

  dialog.querySelector("#_ghClose").addEventListener("click", () => close(false));
  dialog.querySelector("#_ghCancel").addEventListener("click", () => close(false));

  dialog.querySelector("#_ghSave").addEventListener("click", async () => {
    const input = dialog.querySelector("#_ghTokenInput");
    const errorEl = dialog.querySelector("#_ghTokenError");
    const saveBtn = dialog.querySelector("#_ghSave");
    const token = input.value.trim();

    if (!token) { errorEl.textContent = "Introduce un token."; return; }

    errorEl.textContent = "";
    saveBtn.disabled = true;
    saveBtn.textContent = "Verificando…";

    try {
      const res = await fetch("https://api.github.com/user", {
        headers: { "Authorization": `token ${token}`, "Accept": "application/vnd.github+json" }
      });
      if (!res.ok) throw new Error("invalid");
      ghSaveToken(token);
      input.value = "";
      close(true);
    } catch {
      errorEl.textContent = "Token inválido o sin permisos. Asegúrate de que tiene acceso a repositorios públicos.";
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar y sincronizar";
    }
  });

  _tokenDialog = dialog;
  return dialog;
}

function _ensureToken() {
  if (ghLoadToken()) return Promise.resolve(true);
  return new Promise((resolve) => {
    _pendingResolve = resolve;
    _getTokenDialog().showModal();
  });
}

/* ── Main entry point ─────────────────────────────────────────── */

// Syncs a file to GitHub. Shows token dialog on first call.
// Returns: "synced" | "local-only" | "error"
async function ghSync(filePath, contentString, commitMessage) {
  if (!ghLoadToken()) {
    const ok = await _ensureToken();
    if (!ok) return "local-only";
  }

  try {
    await ghPutFile(filePath, contentString, commitMessage);
    return "synced";
  } catch (err) {
    if (err.message === "INVALID_TOKEN") {
      localStorage.removeItem(GH_TOKEN_KEY);
      const ok = await _ensureToken();
      if (!ok) return "local-only";
      try {
        await ghPutFile(filePath, contentString, commitMessage);
        return "synced";
      } catch {
        return "error";
      }
    }
    console.error("GitHub sync error:", err);
    return "error";
  }
}
