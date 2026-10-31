const base = api.monacoBase + "/min";
require.config({ paths: { vs: base + "/vs" } });
self.MonacoEnvironment = {
  getWorkerUrl: () =>
    "data:text/javascript;charset=utf-8," +
    encodeURIComponent(
      `self.MonacoEnvironment={baseUrl:'${base}/'};importScripts('${base}/vs/base/worker/workerMain.js');`,
    ),
};

require(["vs/editor/editor.main"], () => {
  const tabsEl = document.getElementById("tabs");
  const tabs = [];
  let active = null;
  let untitled = 0;

  document.getElementById("loading").remove();
  const editor = monaco.editor.create(document.getElementById("editor"), {
    automaticLayout: true,
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    minimap: { enabled: true },
    model: null,
    wordWrap: "off",
    scrollBeyondLastLine: false,
  });

  // [id, name, base, bg, fg, accent, keyword, string, number, comment]
  const THEMES = [
    [
      "dark",
      "Dark",
      "vs-dark",
      "#1e1e1e",
      "#cccccc",
      "#0e8fe0",
      "#569cd6",
      "#ce9178",
      "#b5cea8",
      "#6a9955",
    ],
    [
      "light",
      "Light",
      "vs",
      "#ffffff",
      "#333333",
      "#007acc",
      "#0000ff",
      "#a31515",
      "#098658",
      "#008000",
    ],
    [
      "violet",
      "Violet",
      "vs-dark",
      "#1f1530",
      "#e0d4f5",
      "#9d5cf0",
      "#c792ea",
      "#f4a8ff",
      "#ffcb6b",
      "#7e6a9e",
    ],
    [
      "indigo",
      "Indigo",
      "vs-dark",
      "#141737",
      "#d3d8f5",
      "#5c6bf0",
      "#8c9eff",
      "#a5d6ff",
      "#ffb86c",
      "#6370a8",
    ],
    [
      "blue",
      "Blue",
      "vs-dark",
      "#0b2239",
      "#d0e4f7",
      "#2a9df4",
      "#4fc3f7",
      "#ffe082",
      "#ffab91",
      "#5c86a8",
    ],
    [
      "green",
      "Green",
      "vs-dark",
      "#10261a",
      "#d3efdc",
      "#2ecc71",
      "#69f0ae",
      "#e6ee9c",
      "#ffcc80",
      "#5e8f70",
    ],
    [
      "yellow",
      "Yellow",
      "vs",
      "#fff9d6",
      "#4a4020",
      "#d4a900",
      "#b58900",
      "#2e7d32",
      "#c62828",
      "#9a9060",
    ],
    [
      "orange",
      "Orange",
      "vs-dark",
      "#2b1808",
      "#f6e0cc",
      "#ff8c1a",
      "#ffa040",
      "#ffe0a0",
      "#ff7043",
      "#a07850",
    ],
    [
      "red",
      "Red",
      "vs-dark",
      "#2a0e12",
      "#f5d6d8",
      "#ee3b4b",
      "#ff6b7a",
      "#ffc27a",
      "#ffa8b0",
      "#a06068",
    ],
    [
      "pink",
      "Pink",
      "vs",
      "#ffeef5",
      "#4a2335",
      "#e91e8c",
      "#d81b78",
      "#7b1fa2",
      "#e65100",
      "#b07a92",
    ],
    [
      "teal",
      "Teal / Cyan",
      "vs-dark",
      "#0a2828",
      "#cdeeee",
      "#1ec8c8",
      "#4dd0e1",
      "#b2f5a0",
      "#ffd180",
      "#5a9090",
    ],
    [
      "sky",
      "Sky",
      "vs",
      "#e8f5ff",
      "#1f3a52",
      "#0288d1",
      "#0277bd",
      "#2e7d32",
      "#d84315",
      "#6d93b0",
    ],
    [
      "mint",
      "Mint",
      "vs",
      "#e8fbf1",
      "#1d4030",
      "#00a86b",
      "#00796b",
      "#6a1b9a",
      "#e65100",
      "#6aa088",
    ],
    [
      "sunset",
      "Sunset",
      "vs-dark",
      "#2a1033",
      "#fbe3d6",
      "#ff5e7e",
      "#ff7a90",
      "#ffd166",
      "#f78c6b",
      "#a0708a",
    ],
    [
      "mono",
      "Monokai",
      "vs-dark",
      "#272822",
      "#f8f8f2",
      "#a6e22e",
      "#f92672",
      "#e6db74",
      "#ae81ff",
      "#75715e",
    ],
    [
      "solar",
      "Solarized",
      "vs",
      "#fdf6e3",
      "#586e75",
      "#268bd2",
      "#859900",
      "#2aa198",
      "#d33682",
      "#93a1a1",
    ],
    [
      "coffee",
      "Coffee",
      "vs-dark",
      "#241a14",
      "#e8d8c8",
      "#c68b59",
      "#d9a066",
      "#a8c686",
      "#e0a0a0",
      "#8a7060",
    ],
    [
      "slate",
      "Slate",
      "vs-dark",
      "#22272e",
      "#adbac7",
      "#6cb6ff",
      "#f47067",
      "#96d0ff",
      "#6cb6ff",
      "#768390",
    ],
  ];

  const mix = (a, b, t) =>
    "#" +
    [1, 3, 5]
      .map((i) =>
        Math.round(
          parseInt(a.substr(i, 2), 16) * (1 - t) +
            parseInt(b.substr(i, 2), 16) * t,
        )
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");

  for (const [id, , base, bg, fg, accent, kw, str, num, cmt] of THEMES) {
    monaco.editor.defineTheme("t-" + id, {
      base,
      inherit: true,
      rules: [
        { token: "keyword", foreground: kw.slice(1) },
        { token: "string", foreground: str.slice(1) },
        { token: "number", foreground: num.slice(1) },
        { token: "comment", foreground: cmt.slice(1), fontStyle: "italic" },
        { token: "type", foreground: accent.slice(1) },
        { token: "tag", foreground: kw.slice(1) },
        { token: "attribute.name", foreground: num.slice(1) },
        { token: "attribute.value", foreground: str.slice(1) },
      ],
      colors: {
        "editor.background": bg,
        "editor.foreground": fg,
        "editor.lineHighlightBackground": mix(bg, fg, 0.07),
        "editor.selectionBackground": accent + "55",
        "editorCursor.foreground": accent,
        "editorLineNumber.foreground": mix(bg, fg, 0.4),
        "editorLineNumber.activeForeground": accent,
        "editorGutter.background": bg,
        "minimap.background": bg,
        "editorWidget.background": mix(bg, fg, 0.06),
        "scrollbarSlider.background": mix(bg, fg, 0.2) + "88",
      },
    });
  }

  const themesEl = document.getElementById("themes");
  const darkMq = matchMedia("(prefers-color-scheme: dark)");
  let pref = "auto"; // saved choice: "auto" (follow Windows) or a theme id

  function applyTheme(choice) {
    pref = choice;
    const id = choice === "auto" ? (darkMq.matches ? "dark" : "light") : choice;
    const t = THEMES.find((x) => x[0] === id) || THEMES[0];
    const [tid, , , bg, fg, accent] = t;
    const vars = {
      "--bg": bg,
      "--fg": fg,
      "--accent": accent,
      "--bar": mix(bg, fg, 0.06),
      "--tab": mix(bg, fg, 0.12),
      "--tab-active": bg,
      "--border": mix(bg, fg, 0.2),
    };
    for (const k in vars) document.body.style.setProperty(k, vars[k]);
    monaco.editor.setTheme("t-" + tid);
    try {
      localStorage.setItem("theme", choice);
      // read by the inline script in index.html so the first paint is already themed
      localStorage.setItem("themeVars", JSON.stringify(vars));
    } catch {}
    for (const o of themesEl.children)
      o.classList.toggle("sel", o.dataset.id === choice);
  }
  darkMq.addEventListener("change", () => {
    if (pref === "auto") applyTheme("auto");
  });
  {
    const o = document.createElement("div");
    o.className = "opt";
    o.dataset.id = "auto";
    o.innerHTML = '<span class="sw"><i></i></span><span>Auto (System)</span>';
    o.firstChild.style.background = "linear-gradient(90deg,#1e1e1e 50%,#fff 50%)";
    o.firstChild.firstChild.style.background = "#0e8fe0";
    o.onclick = () => {
      applyTheme("auto");
      themesEl.classList.remove("open");
      editor.focus();
    };
    themesEl.appendChild(o);
  }
  for (const [id, name, , bg, , accent] of THEMES) {
    const o = document.createElement("div");
    o.className = "opt";
    o.dataset.id = id;
    o.innerHTML = '<span class="sw"><i></i></span><span></span>';
    o.firstChild.style.background = bg;
    o.firstChild.firstChild.style.background = accent;
    o.lastChild.textContent = name;
    o.onclick = () => {
      applyTheme(id);
      themesEl.classList.remove("open");
      editor.focus();
    };
    themesEl.appendChild(o);
  }

  // Monaco only matches by extension (and a few exact filenames), so dotfiles and
  // types it has no language for are mapped here to the closest built-in language.
  const LANG_BY_NAME = {
    ".bashrc": "shell",
    ".bash_profile": "shell",
    ".bash_login": "shell",
    ".bash_aliases": "shell",
    ".bash_logout": "shell",
    ".profile": "shell",
    ".zshrc": "shell",
    ".zshenv": "shell",
    ".zprofile": "shell",
    ".zlogin": "shell",
    ".gitignore": "shell",
    ".dockerignore": "shell",
  };
  const LANG_BY_EXT = {
    ".vue": "html",
    ".toml": "ini",
    ".lock": "ini",
    ".iml": "xml",
  };
  const WRAPPER_EXT = [".tmpl", ".old", ".bak", ".orig"];

  function langFor(name) {
    let n = name.toLowerCase();
    const dot = n.lastIndexOf(".");
    // template.rs.tmpl / x.rs.old -> highlight as the extension underneath
    if (dot > n.indexOf(".") && WRAPPER_EXT.includes(n.slice(dot)))
      n = n.slice(0, dot);
    if (LANG_BY_NAME[n]) return LANG_BY_NAME[n];
    if (/^\.env(\.|$)/.test(n)) return "shell";
    if (/^dockerfile\./.test(n)) return "dockerfile";
    const langs = monaco.languages.getLanguages();
    const byName = langs.find((l) =>
      (l.filenames || []).some((f) => f.toLowerCase() === n),
    );
    if (byName) return byName.id;
    const ext = n.includes(".") ? n.slice(n.lastIndexOf(".")) : "";
    if (LANG_BY_EXT[ext]) return LANG_BY_EXT[ext];
    const l = langs.find((l) =>
      (l.extensions || []).some((e) => e.toLowerCase() === ext),
    );
    return l ? l.id : "plaintext";
  }

  function render() {
    tabsEl.innerHTML = "";
    for (const t of tabs) {
      const el = document.createElement("div");
      el.className = "tab" + (t === active ? " active" : "");
      el.title = t.path || t.name;
      const label = document.createElement("span");
      label.textContent = t.name;
      el.appendChild(label);
      if (t.dirty) {
        const dot = document.createElement("span");
        dot.className = "dot";
        dot.textContent = "●";
        el.appendChild(dot);
      }
      const x = document.createElement("span");
      x.className = "x";
      x.textContent = "✕";
      x.onclick = (e) => {
        e.stopPropagation();
        closeTab(t);
      };
      el.appendChild(x);
      el.onclick = () => activate(t);
      el.onauxclick = (e) => {
        if (e.button === 1) closeTab(t);
      };
      tabsEl.appendChild(el);
    }
    // Only opened files or edited untitled tabs warrant a close confirmation.
    api.setHasWork(tabs.some((t) => t.path || t.dirty));
    document.title =
      (active ? active.name + (active.dirty ? " •" : "") + " - " : "") +
      "Editor";
  }

  function activate(t) {
    active = t;
    editor.setModel(t.model);
    editor.focus();
    render();
  }

  function addTab(name, text, p) {
    const model = monaco.editor.createModel(text, langFor(name));
    const t = { name, path: p, model, dirty: false };
    model.onDidChangeContent(() => {
      if (!t.dirty) {
        t.dirty = true;
        render();
      }
    });
    tabs.push(t);
    activate(t);
  }

  function closeTab(t) {
    if (t.dirty && !confirm(`Discard unsaved changes to ${t.name}?`)) return;
    const i = tabs.indexOf(t);
    tabs.splice(i, 1);
    t.model.dispose();
    if (active === t) {
      active = null;
      if (tabs.length) activate(tabs[Math.min(i, tabs.length - 1)]);
      else {
        editor.setModel(null);
        render();
      }
    } else render();
  }

  // Reads all files concurrently, then opens them in order so tab order is stable.
  async function openPaths(paths) {
    const reads = paths.map((p) => {
      const r = api.read(p);
      r.catch(() => {}); // surfaced via openPath's own await
      return r;
    });
    for (let i = 0; i < paths.length; i++) await openPath(paths[i], reads[i]);
  }

  async function openPath(p, pending) {
    const existing = tabs.find((t) => t.path === p);
    if (existing) return activate(existing);
    try {
      const name = api.basename(p),
        text = await (pending || api.read(p));
      const blank =
        active && !active.path && active.model.getValueLength() === 0;
      if (!blank) return addTab(name, text, p);
      // Reuse the empty untitled tab instead of opening a new one.
      active.name = name;
      active.path = p;
      active.model.setValue(text);
      monaco.editor.setModelLanguage(active.model, langFor(name));
      active.dirty = false;
      render();
    } catch (e) {
      alert("Could not open file:\n" + e.message);
    }
  }

  async function save() {
    if (!active) return;
    if (!active.path) {
      const p = await api.saveAs(active.name);
      if (!p) return;
      active.path = p;
      active.name = api.basename(p);
      monaco.editor.setModelLanguage(active.model, langFor(active.name));
    }
    await api.write(active.path, active.model.getValue());
    active.dirty = false;
    render();
  }

  function newTab() {
    addTab("Untitled-" + ++untitled, "", null);
  }

  async function openDialog() {
    await openPaths(await api.open());
  }
  document.getElementById("open").onclick = openDialog;
  document.getElementById("new").onclick = newTab;
  document.getElementById("theme").onclick = (e) => {
    e.stopPropagation();
    themesEl.classList.toggle("open");
  };
  addEventListener("click", (e) => {
    if (!themesEl.contains(e.target)) themesEl.classList.remove("open");
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") themesEl.classList.remove("open");
  });

  addEventListener("keydown", (e) => {
    if (!e.ctrlKey) return;
    const k = e.key.toLowerCase();
    if (k === "s") {
      e.preventDefault();
      save();
    } else if (k === "o") {
      e.preventDefault();
      openDialog();
    } else if (k === "n") {
      e.preventDefault();
      newTab();
    } else if (k === "w") {
      e.preventDefault();
      if (active) closeTab(active);
    } else if (e.key === "Tab" && tabs.length > 1) {
      e.preventDefault();
      const i = tabs.indexOf(active);
      activate(tabs[(i + (e.shiftKey ? tabs.length - 1 : 1)) % tabs.length]);
    }
  });

  // Drag & drop files -> new tab
  const drop = document.getElementById("drop");
  let depth = 0;
  // Capture phase + stopPropagation so Monaco's own drag handling can't veto the drop.
  const cap = { capture: true };
  addEventListener(
    "dragenter",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      depth++;
      drop.style.display = "block";
    },
    cap,
  );
  addEventListener(
    "dragleave",
    (e) => {
      e.stopPropagation();
      if (--depth <= 0) {
        depth = 0;
        drop.style.display = "none";
      }
    },
    cap,
  );
  addEventListener(
    "dragover",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
    },
    cap,
  );
  addEventListener(
    "drop",
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      depth = 0;
      drop.style.display = "none";
      await openPaths([...e.dataTransfer.files].map((f) => api.pathOf(f)));
    },
    cap,
  );

  let saved = null;
  try {
    saved = localStorage.getItem("theme");
  } catch {}
  applyTheme(saved || "auto");

  // Theme picked in another window: localStorage is shared, so just follow it.
  addEventListener("storage", (e) => {
    if (e.key === "theme" && e.newValue && e.newValue !== pref)
      applyTheme(e.newValue);
  });
  api.argv().then(async (paths) => {
    await openPaths(paths);
    if (!tabs.length) newTab();
  });
});
