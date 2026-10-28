(() => {
  "use strict";

  const STORE_KEY = "blocklist.blocked.v1";

  const accounts = (window.ACCOUNTS || []).filter(a => a && a.handle)
    .map(a => ({ handle: String(a.handle).replace(/^@/, "").trim(), nota: a.nota || "" }));

  const el = {
    list: document.getElementById("list"),
    empty: document.getElementById("empty"),
    search: document.getElementById("search"),
    chips: document.querySelectorAll(".chip"),
    progressText: document.getElementById("progressText"),
    progressBar: document.getElementById("progressBar"),
    reset: document.getElementById("btnReset"),
    help: document.getElementById("helpPanel"),
    openHelp: document.getElementById("btnHelp"),
    closeHelp: document.getElementById("btnCloseHelp"),
    toast: document.getElementById("toast")
  };

  let blocked = load();
  let filter = "todas";
  let query = "";

  /* ---------- persistência (tolerante a storage bloqueado) ---------- */

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify([...blocked]));
    } catch {
      /* modo privado ou storage desligado: a sessão continua funcionando */
    }
  }

  /* ---------- helpers ---------- */

  const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let toastTimer;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove("is-on"), 1900);
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* clipboard API exige HTTPS; cai no método antigo */
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      let ok = false;
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      ta.remove();
      return ok;
    }
  }

  /* ---------- render ---------- */

  function visible() {
    const q = query.toLowerCase();
    return accounts.filter(a => {
      if (filter === "pendentes" && blocked.has(a.handle)) return false;
      if (filter === "bloqueadas" && !blocked.has(a.handle)) return false;
      if (!q) return true;
      return a.handle.toLowerCase().includes(q) || a.nota.toLowerCase().includes(q);
    });
  }

  function render() {
    const rows = visible();

    el.list.innerHTML = rows.map(a => {
      const done = blocked.has(a.handle);
      return `
      <li class="item${done ? " is-blocked" : ""}" data-handle="${esc(a.handle)}">
        <div class="item__head">
          <div class="avatar" aria-hidden="true">${esc(a.handle.charAt(0))}</div>
          <div class="item__meta">
            <div class="item__handle">@${esc(a.handle)}</div>
            ${a.nota ? `<div class="item__note">${esc(a.nota)}</div>` : ""}
          </div>
        </div>
        <div class="item__actions">
          <button type="button" class="btn" data-act="copy">
            <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>
            <span class="btn__label">Copiar @</span>
          </button>
          <a class="btn btn--icon" href="https://www.instagram.com/${encodeURIComponent(a.handle)}/"
             target="_blank" rel="noopener noreferrer" aria-label="Abrir @${esc(a.handle)} no Instagram">
            <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>
          </a>
          <button type="button" class="btn btn--icon${done ? " btn--done" : ""}" data-act="toggle"
                  aria-pressed="${done}" aria-label="${done ? "Desmarcar" : "Marcar como bloqueada"} @${esc(a.handle)}">
            <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 4 4 10-10"/></svg>
          </button>
        </div>
      </li>`;
    }).join("");

    el.empty.hidden = rows.length > 0;
    renderProgress();
  }

  function renderProgress() {
    const total = accounts.length;
    const done = accounts.filter(a => blocked.has(a.handle)).length;
    el.progressText.textContent = `${done} de ${total} bloqueada${total === 1 ? "" : "s"}`;
    el.progressBar.style.width = total ? `${(done / total) * 100}%` : "0%";
  }

  /* ---------- eventos ---------- */

  el.list.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("[data-act]");
    if (!btn) return;
    const handle = btn.closest(".item").dataset.handle;

    if (btn.dataset.act === "copy") {
      const ok = await copy(handle);
      if (!ok) { toast("Não consegui copiar. Selecione o @ manualmente."); return; }
      const label = btn.querySelector(".btn__label");
      btn.classList.add("is-copied");
      label.textContent = "Copiado!";
      toast(`@${handle} copiado`);
      setTimeout(() => {
        btn.classList.remove("is-copied");
        label.textContent = "Copiar @";
      }, 1600);
      return;
    }

    if (btn.dataset.act === "toggle") {
      if (blocked.has(handle)) blocked.delete(handle);
      else blocked.add(handle);
      save();
      render();
    }
  });

  el.search.addEventListener("input", () => {
    query = el.search.value.trim();
    render();
  });

  el.chips.forEach(chip => chip.addEventListener("click", () => {
    filter = chip.dataset.filter;
    el.chips.forEach(c => {
      const on = c === chip;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-selected", String(on));
    });
    render();
  }));

  el.reset.addEventListener("click", () => {
    if (!blocked.size) { toast("Nada marcado ainda."); return; }
    if (!confirm("Apagar todas as marcações de bloqueio?")) return;
    blocked.clear();
    save();
    render();
    toast("Marcações apagadas");
  });

  el.openHelp.addEventListener("click", () => el.help.showModal());
  el.closeHelp.addEventListener("click", () => el.help.close());
  el.help.addEventListener("click", (ev) => {
    if (ev.target === el.help) el.help.close(); /* toque fora fecha */
  });

  render();
})();
