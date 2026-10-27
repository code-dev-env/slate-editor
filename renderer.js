const base = api.monacoBase + '/min';
require.config({ paths: { vs: base + '/vs' } });
self.MonacoEnvironment = {
  getWorkerUrl: () => 'data:text/javascript;charset=utf-8,' + encodeURIComponent(
    `self.MonacoEnvironment={baseUrl:'${base}/'};importScripts('${base}/vs/base/worker/workerMain.js');`)
};

require(['vs/editor/editor.main'], () => {
  const tabsEl = document.getElementById('tabs');
  const tabs = [];
  let active = null;
  let untitled = 0;

  const dark = localStorage.getItem('theme')
    ? localStorage.getItem('theme') === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  document.body.classList.toggle('dark', dark);

  const editor = monaco.editor.create(document.getElementById('editor'), {
    theme: dark ? 'vs-dark' : 'vs', automaticLayout: true, fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace', minimap: { enabled: true },
    model: null, wordWrap: 'off', scrollBeyondLastLine: false
  });

  function langFor(name) {
    const ext = '.' + name.split('.').pop().toLowerCase();
    const l = monaco.languages.getLanguages().find(l => (l.extensions || []).includes(ext));
    return l ? l.id : 'plaintext';
  }

  function render() {
    tabsEl.innerHTML = '';
    for (const t of tabs) {
      const el = document.createElement('div');
      el.className = 'tab' + (t === active ? ' active' : '');
      el.title = t.path || t.name;
      const label = document.createElement('span');
      label.textContent = t.name;
      el.appendChild(label);
      if (t.dirty) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.textContent = '●';
        el.appendChild(dot);
      }
      const x = document.createElement('span');
      x.className = 'x';
      x.textContent = '✕';
      x.onclick = (e) => { e.stopPropagation(); closeTab(t); };
      el.appendChild(x);
      el.onclick = () => activate(t);
      el.onauxclick = (e) => { if (e.button === 1) closeTab(t); };
      tabsEl.appendChild(el);
    }
    document.title = (active ? active.name + (active.dirty ? ' •' : '') + ' - ' : '') + 'Editor';
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
    model.onDidChangeContent(() => { if (!t.dirty) { t.dirty = true; render(); } });
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
      else { editor.setModel(null); render(); }
    } else render();
  }

  async function openPath(p) {
    const existing = tabs.find(t => t.path === p);
    if (existing) return activate(existing);
    try {
      const name = api.basename(p), text = await api.read(p);
      const blank = active && !active.path && active.model.getValueLength() === 0;
      if (!blank) return addTab(name, text, p);
      // Reuse the empty untitled tab instead of opening a new one.
      active.name = name; active.path = p;
      active.model.setValue(text);
      monaco.editor.setModelLanguage(active.model, langFor(name));
      active.dirty = false;
      render();
    } catch (e) { alert('Could not open file:\n' + e.message); }
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

  function newTab() { addTab('Untitled-' + (++untitled), '', null); }

  async function openDialog() { for (const p of await api.open()) await openPath(p); }
  document.getElementById('open').onclick = openDialog;
  document.getElementById('new').onclick = newTab;
  document.getElementById('theme').onclick = () => {
    const d = !document.body.classList.contains('dark');
    document.body.classList.toggle('dark', d);
    monaco.editor.setTheme(d ? 'vs-dark' : 'vs');
    localStorage.setItem('theme', d ? 'dark' : 'light');
  };

  addEventListener('keydown', (e) => {
    if (!e.ctrlKey) return;
    const k = e.key.toLowerCase();
    if (k === 's') { e.preventDefault(); save(); }
    else if (k === 'o') { e.preventDefault(); openDialog(); }
    else if (k === 'n') { e.preventDefault(); newTab(); }
    else if (k === 'w') { e.preventDefault(); if (active) closeTab(active); }
    else if (e.key === 'Tab' && tabs.length > 1) {
      e.preventDefault();
      const i = tabs.indexOf(active);
      activate(tabs[(i + (e.shiftKey ? tabs.length - 1 : 1)) % tabs.length]);
    }
  });

  // Drag & drop files -> new tab
  const drop = document.getElementById('drop');
  let depth = 0;
  // Capture phase + stopPropagation so Monaco's own drag handling can't veto the drop.
  const cap = { capture: true };
  addEventListener('dragenter', (e) => { e.preventDefault(); e.stopPropagation(); depth++; drop.style.display = 'block'; }, cap);
  addEventListener('dragleave', (e) => { e.stopPropagation(); if (--depth <= 0) { depth = 0; drop.style.display = 'none'; } }, cap);
  addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; }, cap);
  addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    depth = 0;
    drop.style.display = 'none';
    for (const f of e.dataTransfer.files) await openPath(api.pathOf(f));
  }, cap);

  api.argv().then(async (paths) => {
    for (const p of paths) await openPath(p);
    if (!tabs.length) newTab();
  });
});
