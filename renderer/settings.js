// renderer/settings.js — Unified settings panel (editor.html + home.html)
(function () {
  let _overlay = null;
  let _tab     = 'editor';
  let _cfg     = {};
  let _ws      = [];
  let _wsId    = null;

  const FONTS = [
    { val: "'Cascadia Code','Fira Code',Consolas,monospace", label: 'Cascadia Code'  },
    { val: "'Fira Code',Consolas,monospace",                 label: 'Fira Code'      },
    { val: "'JetBrains Mono',Consolas,monospace",            label: 'JetBrains Mono' },
    { val: 'Consolas,monospace',                             label: 'Consolas'       },
    { val: "'Courier New',monospace",                        label: 'Courier New'    },
  ];

  // Shortcuts reference — editable ones can be remapped
  const SHORTCUTS = [
    { section: 'File' },
    { id: 'save',            label: 'Save File',         def: 'Ctrl+S'        },
    { id: 'new-file',        label: 'New File',          def: 'Ctrl+N'        },
    { id: 'close-tab',       label: 'Close Tab',         def: 'Ctrl+W'        },
    { section: 'View' },
    { id: 'quick-open',      label: 'Quick Open',        def: 'Ctrl+P'        },
    { id: 'toggle-terminal', label: 'Toggle Terminal',   def: 'Ctrl+`'        },
    { section: 'Editor (Monaco built-ins — read-only)' },
    { id: 'find',        label: 'Find',             def: 'Ctrl+F',       ro: true },
    { id: 'replace',     label: 'Find & Replace',   def: 'Ctrl+H',       ro: true },
    { id: 'comment',     label: 'Toggle Comment',   def: 'Ctrl+/',       ro: true },
    { id: 'format',      label: 'Format Document',  def: 'Shift+Alt+F',  ro: true },
    { id: 'del-line',    label: 'Delete Line',      def: 'Ctrl+Shift+K', ro: true },
    { id: 'undo',        label: 'Undo',             def: 'Ctrl+Z',       ro: true },
    { id: 'redo',        label: 'Redo',             def: 'Ctrl+Y',       ro: true },
    { id: 'goto-line',   label: 'Go to Line',       def: 'Ctrl+G',       ro: true },
    { id: 'select-all',  label: 'Select All',       def: 'Ctrl+A',       ro: true },
    { id: 'move-up',     label: 'Move Line Up',     def: 'Alt+↑',        ro: true },
    { id: 'move-down',   label: 'Move Line Down',   def: 'Alt+↓',        ro: true },
    { id: 'duplicate',   label: 'Duplicate Line',   def: 'Alt+Shift+↓',  ro: true },
  ];

  /* ── Public API ───────────────────────────────────────────────────── */
  window.openUnifiedSettings = async function (tab, wsId, focusField) {
    tab  = tab  || 'editor';
    wsId = wsId || null;
    _cfg = (await window.api.getSettings()) || {};
    if (window.api.getAppVersion) _cfg._appVersion = await window.api.getAppVersion();
    // Toolbar theme toggle updates localStorage but not the settings file — sync here
    const lsTheme = localStorage.getItem('htmledger-theme');
    if (lsTheme) _cfg.theme = lsTheme;
    const r = await window.api.getWorkspaces();
    _ws  = (r && r.data) ? r.data : [];
    _wsId = wsId || (_ws[0] ? _ws[0].id : null);
    if (!_overlay) _build();
    _switchTab(tab);
    _overlay.style.display = 'flex';
    if (focusField) requestAnimationFrame(() => {
      const el = document.getElementById('u-ws-' + focusField);
      if (!el) return;
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el.closest('.usp-row')?.classList.add('usp-row-highlight');
      setTimeout(() => el.closest('.usp-row')?.classList.remove('usp-row-highlight'), 2000);
    });
  };

  /* ── Build overlay once ───────────────────────────────────────────── */
  function _build() {
    _overlay = document.createElement('div');
    _overlay.className = 'usp-overlay';
    _overlay.innerHTML = `
      <div class="usp-panel">
        <div class="usp-header">
          <svg class="usp-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
          <span class="usp-title">Settings</span>
          <button class="usp-close" id="usp-close">✕</button>
        </div>
        <div class="usp-tabs">
          <button class="usp-tab" data-t="editor">Editor</button>
          <button class="usp-tab" data-t="app">App</button>
          <button class="usp-tab" data-t="workspace">Workspace</button>
          <button class="usp-tab" data-t="shortcuts">Shortcuts</button>
        </div>
        <div class="usp-body" id="usp-body"></div>
        <div class="usp-footer">
          <button class="usp-btn-sec" id="usp-cancel">Cancel</button>
          <button class="usp-btn-pri" id="usp-save">Save Changes</button>
        </div>
      </div>`;
    document.body.appendChild(_overlay);
    _overlay.addEventListener('click', e => { if (e.target === _overlay) _close(); });
    _overlay.querySelector('#usp-close').onclick  = _close;
    _overlay.querySelector('#usp-cancel').onclick = _close;
    _overlay.querySelector('#usp-save').onclick   = _save;
    _overlay.querySelectorAll('.usp-tab').forEach(t => {
      t.onclick = () => _switchTab(t.dataset.t);
    });
  }

  function _switchTab(t) {
    _tab = t;
    _overlay.querySelectorAll('.usp-tab').forEach(b =>
      b.classList.toggle('active', b.dataset.t === t));
    const body = _overlay.querySelector('#usp-body');
    if      (t === 'editor')    { body.innerHTML = _editorHtml();    _bindEditor();    }
    else if (t === 'app')       { body.innerHTML = _appHtml();       _bindApp();       }
    else if (t === 'workspace') { body.innerHTML = _wsHtml();        _bindWs();        }
    else                        { body.innerHTML = _shortcutsHtml(); _bindShortcuts(); }
  }

  /* ── Editor tab ───────────────────────────────────────────────────── */
  function _editorHtml() {
    const fs  = _cfg.fontSize      || 14;
    const lh  = _cfg.lineHeight    || 22;
    const ff  = _cfg.fontFamily    || FONTS[0].val;
    const ts  = _cfg.tabSize       || 2;
    const mm  = _cfg.minimap       !== false;
    const ww  = !!_cfg.wordWrap;
    const as  = !!_cfg.autoSave;
    const asi = _cfg.autoSaveDelay || 2000;
    const fo  = _cfg.formatOnSave  || 'ask';
    const ly  = _cfg.layout        || 'split';
    const fl  = _cfg.fontLigatures !== false;
    const acb = _cfg.autoCloseBrackets !== false;
    const act = _cfg.autoCloseTags     !== false;
    const rw  = _cfg.renderWhitespace  || 'none';
    const cs  = _cfg.cursorStyle       || 'line';
    const fontOpts = FONTS.map(f =>
      `<option value="${_esc(f.val)}"${f.val === ff ? ' selected' : ''}>${f.label}</option>`
    ).join('');
    const asiOpts = [
      [2000,'2 s'],[5000,'5 s'],[10000,'10 s'],[30000,'30 s'],[60000,'60 s']
    ].map(([v,l]) => `<button class="usp-chip${asi===v?' on':''}" data-v="${v}">${l}</button>`).join('');
    return `
      <div class="usp-section-label">FONT</div>
      <div class="usp-row">
        <label class="usp-lbl">Font Family</label>
        <select class="usp-sel" id="u-ff">${fontOpts}</select>
      </div>
      <div class="usp-row">
        <label class="usp-lbl">Font Size</label>
        <div class="usp-stepper">
          <button id="u-fs-dec">−</button><span id="u-fs-v">${fs}</span><button id="u-fs-inc">+</button>
          <span class="usp-unit">px</span>
        </div>
      </div>
      <div class="usp-row">
        <label class="usp-lbl">Line Height</label>
        <div class="usp-stepper">
          <button id="u-lh-dec">−</button><span id="u-lh-v">${lh}</span><button id="u-lh-inc">+</button>
          <span class="usp-unit">px</span>
        </div>
      </div>
      <div class="usp-row">
        <label class="usp-lbl">Font Ligatures</label>
        <label class="usp-tog"><input type="checkbox" id="u-fl"${fl?' checked':''}><span></span></label>
      </div>
      <div class="usp-divider"></div>
      <div class="usp-section-label">EDITING</div>
      <div class="usp-row">
        <label class="usp-lbl">Tab Size</label>
        <div class="usp-chips" id="u-ts">
          ${[2,4,8].map(n=>`<button class="usp-chip${ts===n?' on':''}" data-v="${n}">${n} spaces</button>`).join('')}
        </div>
      </div>
      <div class="usp-row">
        <label class="usp-lbl">Cursor Style</label>
        <div class="usp-chips" id="u-cs">
          <button class="usp-chip${cs==='line'     ?' on':''}" data-v="line">Line</button>
          <button class="usp-chip${cs==='block'    ?' on':''}" data-v="block">Block</button>
          <button class="usp-chip${cs==='underline'?' on':''}" data-v="underline">Underline</button>
        </div>
      </div>
      <div class="usp-row">
        <label class="usp-lbl">Render Whitespace</label>
        <div class="usp-chips" id="u-rw">
          <button class="usp-chip${rw==='none'    ?' on':''}" data-v="none">None</button>
          <button class="usp-chip${rw==='boundary'?' on':''}" data-v="boundary">Boundary</button>
          <button class="usp-chip${rw==='all'     ?' on':''}" data-v="all">All</button>
        </div>
      </div>
      <div class="usp-row">
        <label class="usp-lbl">Auto-close Brackets</label>
        <label class="usp-tog"><input type="checkbox" id="u-acb"${acb?' checked':''}><span></span></label>
      </div>
      <div class="usp-row">
        <label class="usp-lbl">Auto-close Tags</label>
        <label class="usp-tog"><input type="checkbox" id="u-act"${act?' checked':''}><span></span></label>
      </div>
      <div class="usp-divider"></div>
      <div class="usp-section-label">DEFAULTS</div>
      <div class="usp-row">
        <label class="usp-lbl">Default Layout</label>
        <div class="usp-chips" id="u-ly">
          <button class="usp-chip${ly==='split'  ?' on':''}" data-v="split">Split</button>
          <button class="usp-chip${ly==='code'   ?' on':''}" data-v="code">Code Only</button>
          <button class="usp-chip${ly==='preview'?' on':''}" data-v="preview">Preview Only</button>
        </div>
      </div>
      <div class="usp-row">
        <label class="usp-lbl">Format on Save</label>
        <select class="usp-sel" id="u-fo">
          <option value="ask"${fo==='ask'?' selected':''}>Ask each time</option>
          <option value="yes"${fo==='yes'?' selected':''}>Always format</option>
          <option value="no" ${fo==='no' ?' selected':''}>Never format</option>
        </select>
      </div>
      <div class="usp-divider"></div>
      <div class="usp-section-label">AUTO-SAVE</div>
      <div class="usp-row">
        <label class="usp-lbl">Enable Auto-save</label>
        <label class="usp-tog"><input type="checkbox" id="u-as"${as?' checked':''}><span></span></label>
      </div>
      <div class="usp-row">
        <label class="usp-lbl">
          Save Delay
          <small class="usp-hint">How long after you stop typing before saving</small>
        </label>
        <div class="usp-chips" id="u-asi">${asiOpts}</div>
      </div>
      <div class="usp-divider"></div>
      <div class="usp-section-label">VIEW</div>
      <div class="usp-row">
        <label class="usp-lbl">Minimap</label>
        <label class="usp-tog"><input type="checkbox" id="u-mm"${mm?' checked':''}><span></span></label>
      </div>
      <div class="usp-row">
        <label class="usp-lbl">Word Wrap</label>
        <label class="usp-tog"><input type="checkbox" id="u-ww"${ww?' checked':''}><span></span></label>
      </div>`;
  }

  function _bindEditor() {
    _on('#u-ff', 'change', e => { _cfg.fontFamily = e.target.value; });
    // Font size stepper
    let fs = _cfg.fontSize || 14;
    const fsV = _q('#u-fs-v');
    _on('#u-fs-dec','click', () => { if (fs > 8)  { fs--; _cfg.fontSize = fs; fsV.textContent = fs; } });
    _on('#u-fs-inc','click', () => { if (fs < 36) { fs++; _cfg.fontSize = fs; fsV.textContent = fs; } });
    // Line height stepper
    let lh = _cfg.lineHeight || 22;
    const lhV = _q('#u-lh-v');
    _on('#u-lh-dec','click', () => { if (lh > 14) { lh--; _cfg.lineHeight = lh; lhV.textContent = lh; } });
    _on('#u-lh-inc','click', () => { if (lh < 48) { lh++; _cfg.lineHeight = lh; lhV.textContent = lh; } });
    // Toggles
    _on('#u-fl',  'change', e => { _cfg.fontLigatures     = e.target.checked; });
    _on('#u-acb', 'change', e => { _cfg.autoCloseBrackets = e.target.checked; });
    _on('#u-act', 'change', e => { _cfg.autoCloseTags     = e.target.checked; });
    _on('#u-mm',  'change', e => { _cfg.minimap           = e.target.checked; });
    _on('#u-ww',  'change', e => { _cfg.wordWrap          = e.target.checked; });
    _on('#u-as',  'change', e => { _cfg.autoSave          = e.target.checked; });
    _on('#u-fo',  'change', e => { _cfg.formatOnSave      = e.target.value;   });
    // Chip groups
    _chips('#u-ts',  v => { _cfg.tabSize          = parseInt(v); });
    _chips('#u-cs',  v => { _cfg.cursorStyle       = v; });
    _chips('#u-rw',  v => { _cfg.renderWhitespace  = v; });
    _chips('#u-ly',  v => { _cfg.layout            = v; });
    _chips('#u-asi', v => { _cfg.autoSaveDelay     = parseInt(v); });
  }

  /* ── App tab ──────────────────────────────────────────────────────── */
  function _appHtml() {
    const th  = _cfg.theme        || localStorage.getItem('htmledger-theme') || 'dark';
    const au  = _cfg.autoUpdates  !== false;
    const rw  = _cfg.restoreWorkspace   || 'none';
    const rwId = _cfg.restoreWorkspaceId || '';
    const wsSelector = rw === 'specific' ? `
      <div class="usp-row" id="u-rw-specific-row" style="padding-left:16px">
        <label class="usp-lbl">Workspace</label>
        <select class="usp-sel" id="u-rw-ws">
          ${_ws.map(w => `<option value="${_esc(w.id)}"${w.id===rwId?' selected':''}>${_esc(w.name)}</option>`).join('')}
        </select>
      </div>` : '';
    return `
      <div class="usp-section-label">APPEARANCE</div>
      <div class="usp-row">
        <label class="usp-lbl">Theme</label>
        <div class="usp-chips" id="u-th">
          <button class="usp-chip${th==='dark' ?' on':''}" data-v="dark">Dark</button>
          <button class="usp-chip${th==='light'?' on':''}" data-v="light">Light</button>
        </div>
      </div>
      <div class="usp-divider"></div>
      <div class="usp-section-label">STARTUP</div>
      <div class="usp-row">
        <label class="usp-lbl">Restore on Launch</label>
        <div class="usp-chips" id="u-rw">
          <button class="usp-chip${rw==='none'    ?' on':''}" data-v="none">None</button>
          <button class="usp-chip${rw==='last'    ?' on':''}" data-v="last">Last Opened</button>
          <button class="usp-chip${rw==='specific'?' on':''}" data-v="specific">Specific</button>
        </div>
      </div>
      <div id="u-rw-specific-wrap">${wsSelector}</div>
      <div class="usp-divider"></div>
      <div class="usp-section-label">UPDATES</div>
      <div class="usp-row">
        <label class="usp-lbl">
          Auto-updates
          <small class="usp-hint">Automatically notify when a new version is available</small>
        </label>
        <label class="usp-tog"><input type="checkbox" id="u-au"${au?' checked':''}><span></span></label>
      </div>
      <div class="usp-row">
        <label class="usp-lbl">
          Show release notes after updates
          <small class="usp-hint">Display what's new the first time you open a new version</small>
        </label>
        <label class="usp-tog"><input type="checkbox" id="u-rn"${_cfg.showReleaseNotes !== false?' checked':''}><span></span></label>
      </div>
      <div class="usp-row">
        <label class="usp-lbl">Release notes</label>
        <button class="usp-chip" id="u-view-rn">View current version</button>
      </div>
      <div class="usp-divider"></div>
      <div class="usp-about">
        <a class="usp-about-logo" id="ua-logo" href="#">
          <span class="logo-bracket">&lt;</span>HTMLedger<span class="logo-bracket">/&gt;</span>
        </a>
        <span class="usp-about-ver" id="usp-ver">v${_cfg._appVersion || '…'}</span>
        <a class="usp-about-studio" id="ua-studio" href="#">
          <img src="../assets/localhost314-logo.png" alt="localhost:314">
        </a>
        <div class="usp-about-links">
          <a class="usp-alink" id="ua-website" href="#">Website</a>
          <a class="usp-alink" id="ua-source"  href="#">Source Code</a>
          <a class="usp-alink" id="ua-tos"     href="#">Terms of Service</a>
          <a class="usp-alink" id="ua-privacy" href="#">Privacy Policy</a>
        </div>
        <div class="usp-about-links" style="margin-top:6px">
          <a class="usp-alink" id="ua-issues"  href="#">Report an Issue</a>
          <a class="usp-alink" id="ua-known"   href="#">Known Issues</a>
          <a class="usp-alink" id="ua-contact" href="#">Contact Us</a>
        </div>
      </div>`;
  }

  function _bindApp() {
    _chips('#u-th', v => {
      _cfg.theme = v;
      _applyTheme(v);
    });
    _on('#u-au', 'change', e => { _cfg.autoUpdates    = e.target.checked; });
    _on('#u-rn', 'change', e => { _cfg.showReleaseNotes = e.target.checked; });
    _on('#u-view-rn', 'click', () => {
      _close();
      window.api.getAppVersion().then(v => showChangelogModal(v));
    });
    // Restore-on-launch chips — specific triggers dynamic row
    const rwGroup = _q('#u-rw');
    if (rwGroup) {
      rwGroup.querySelectorAll('.usp-chip').forEach(btn => {
        btn.onclick = () => {
          rwGroup.querySelectorAll('.usp-chip').forEach(b => b.classList.remove('on'));
          btn.classList.add('on');
          _cfg.restoreWorkspace = btn.dataset.v;
          const wrap = _q('#u-rw-specific-wrap');
          if (btn.dataset.v === 'specific') {
            wrap.innerHTML = `<div class="usp-row" style="padding-left:16px">
              <label class="usp-lbl">Workspace</label>
              <select class="usp-sel" id="u-rw-ws">
                ${_ws.map(w=>`<option value="${_esc(w.id)}"${w.id===(_cfg.restoreWorkspaceId||'')?' selected':''}>${_esc(w.name)}</option>`).join('')}
              </select></div>`;
            const sel = _q('#u-rw-ws');
            if (sel) {
              sel.onchange = e => { _cfg.restoreWorkspaceId = e.target.value; };
              _cfg.restoreWorkspaceId = sel.value;
            }
          } else {
            wrap.innerHTML = '';
          }
        };
      });
    }
    // Specific workspace selector (if already shown)
    const rwSel = _q('#u-rw-ws');
    if (rwSel) rwSel.onchange = e => { _cfg.restoreWorkspaceId = e.target.value; };

    const ext = url => { if (window.api && window.api.openExternal) window.api.openExternal(url); };
    const URLS = {
      'ua-logo':    'https://htmledger.localhost314.com',
      'ua-studio':  'https://localhost314.com',
      'ua-website': 'https://htmledger.localhost314.com',
      'ua-source':  'https://github.com/localhost-314/HTMLedger',
      'ua-tos':     'https://htmledger.localhost314.com/tos',
      'ua-privacy': 'https://htmledger.localhost314.com/privacy',
      'ua-issues':  'https://github.com/localhost-314/HTMLedger/issues/new',
      'ua-known':   'https://github.com/localhost-314/HTMLedger/issues',
    };
    Object.entries(URLS).forEach(([id, url]) => {
      const el = _q('#' + id);
      if (el) el.onclick = e => { e.preventDefault(); ext(url); };
    });
    const contactEl = _q('#ua-contact');
    if (contactEl) contactEl.onclick = e => {
      e.preventDefault();
      _close();
      document.dispatchEvent(new CustomEvent('open-contact-modal'));
    };
  }

  /* ── Workspace tab ────────────────────────────────────────────────── */
  function _wsHtml() {
    if (!_ws.length) {
      return '<div class="usp-empty">No workspaces yet.<br>Create one from the home screen.</div>';
    }
    const ws = _ws.find(w => w.id === _wsId) || _ws[0];
    _wsId = ws.id;
    const opts = _ws.map(w =>
      `<option value="${_esc(w.id)}"${w.id === ws.id ? ' selected' : ''}>${_esc(w.name)}</option>`
    ).join('');
    const folders = (ws.folders || []).map(f =>
      `<div class="usp-folder-item">${_esc(f)}</div>`
    ).join('') || '<span class="usp-muted">No folders added</span>';
    const wsTh = ws.theme || '';
    const dfName = ws.defaultFile ? ws.defaultFile.split(/[\\/]/).pop() : '';
    return `
      <div class="usp-row">
        <label class="usp-lbl">Workspace</label>
        <select class="usp-sel" id="u-ws-sel">${opts}</select>
      </div>
      <div class="usp-divider"></div>
      <div class="usp-section-label">IDENTITY</div>
      <div class="usp-row">
        <label class="usp-lbl">Name</label>
        <input class="usp-inp" id="u-ws-name" type="text" value="${_esc(ws.name)}">
      </div>
      <div class="usp-row">
        <label class="usp-lbl">Folders</label>
        <div class="usp-folder-list">${folders}</div>
      </div>
      <div class="usp-divider"></div>
      <div class="usp-section-label">STARTUP</div>
      <div class="usp-row" id="usp-row-default-file">
        <label class="usp-lbl">
          Default File
          <small class="usp-hint">Opens automatically when this workspace loads</small>
        </label>
        <div class="usp-file-pick-wrap">
          <div class="usp-default-file-display" id="u-ws-default-file">
            ${dfName
              ? `<span class="usp-df-name">${_esc(dfName)}</span>
                 <span class="usp-df-path">${_esc(ws.defaultFile)}</span>`
              : `<span class="usp-df-none">No default file set</span>`}
          </div>
          <button class="usp-pick-ws-btn" id="u-ws-pick-file">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            Browse files
          </button>
          ${ws.defaultFile ? `<button class="usp-clear-btn" id="u-ws-clear-file" title="Clear default file">✕</button>` : ''}
        </div>
      </div>
      <div class="usp-divider"></div>
      <div class="usp-section-label">COMMANDS</div>
      <div class="usp-row">
        <label class="usp-lbl">
          Dev Server
          <small class="usp-hint">Runs a local server (e.g. npm run dev)</small>
        </label>
        <input class="usp-inp usp-mono" id="u-ws-dev" type="text"
               value="${_esc(ws.devServer || '')}" placeholder="e.g. npm run dev">
      </div>
      <div class="usp-row">
        <label class="usp-lbl">
          Deploy Command
          <small class="usp-hint">Builds / deploys the project</small>
        </label>
        <input class="usp-inp usp-mono" id="u-ws-dep" type="text"
               value="${_esc(ws.deploy || '')}" placeholder="e.g. npm run build">
      </div>
      <div class="usp-divider"></div>
      <div class="usp-section-label">APPEARANCE</div>
      <div class="usp-row">
        <label class="usp-lbl">
          Theme Override
          <small class="usp-hint">Overrides the app theme for this workspace</small>
        </label>
        <div class="usp-chips" id="u-ws-th">
          <button class="usp-chip${!wsTh      ?' on':''}" data-v="">Follow App</button>
          <button class="usp-chip${wsTh==='dark' ?' on':''}" data-v="dark">Dark</button>
          <button class="usp-chip${wsTh==='light'?' on':''}" data-v="light">Light</button>
        </div>
      </div>`;
  }

  function _bindWs() {
    _on('#u-ws-sel', 'change', e => { _wsId = e.target.value; _switchTab('workspace'); });
    const cur = () => _ws.find(w => w.id === _wsId);
    _on('#u-ws-name', 'input', e => { const w = cur(); if (w) w.name      = e.target.value; });
    _on('#u-ws-dev',  'input', e => { const w = cur(); if (w) w.devServer = e.target.value; });
    _on('#u-ws-dep',  'input', e => { const w = cur(); if (w) w.deploy    = e.target.value; });
    _chips('#u-ws-th', v => { const w = cur(); if (w) w.theme = v; });

    _on('#u-ws-clear-file', 'click', () => { _setDefaultFile('', cur()); _switchTab('workspace'); });

    // "Browse files" → open full file tree picker page
    _on('#u-ws-pick-file', 'click', () => {
      const ws = cur(); if (ws) _openFilePicker(ws);
    });
  }

  function _setDefaultFile(filePath, ws) {
    if (!ws) return;
    ws.defaultFile = filePath;
  }

  /* ── File picker page (replaces settings body) ── */
  async function _openFilePicker(ws) {
    const body = _overlay.querySelector('#usp-body');
    body.innerHTML = `
      <div class="usp-picker-hd">
        <button class="usp-picker-back" id="usp-picker-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="15,18 9,12 15,6"/></svg>
          Back
        </button>
        <span class="usp-picker-title">Choose default file</span>
      </div>
      <div class="usp-picker-tree" id="usp-picker-tree">
        <div class="usp-file-loading">Loading workspace files…</div>
      </div>`;

    document.getElementById('usp-picker-back').onclick = () => _switchTab('workspace');

    const treeEl  = document.getElementById('usp-picker-tree');
    const folders = ws.folders || [];
    treeEl.innerHTML = '';

    for (const folder of folders) {
      if (folders.length > 1) {
        const lbl = document.createElement('div');
        lbl.className = 'usp-picker-root-lbl';
        lbl.textContent = folder.split(/[\\/]/).pop();
        treeEl.appendChild(lbl);
      }
      const res = await window.api.listDirTree(folder).catch(() => null);
      if (res?.success) _renderPickerLevel(res.tree, treeEl, 0, ws);
      else {
        const err = document.createElement('div');
        err.className = 'usp-file-empty';
        err.textContent = 'Could not read folder';
        treeEl.appendChild(err);
      }
    }
    if (!treeEl.children.length) {
      treeEl.innerHTML = '<div class="usp-file-empty">No files found in workspace</div>';
    }
  }

  function _renderPickerLevel(nodes, container, depth, ws) {
    const sorted = [...nodes].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of sorted) {
      const row = document.createElement('div');
      row.className = 'usp-picker-row' + (node.type === 'file' ? ' usp-picker-file' : ' usp-picker-folder');
      row.style.paddingLeft = (12 + depth * 16) + 'px';
      if (node.type === 'folder') {
        const arrow = document.createElement('span');
        arrow.className = 'usp-picker-arrow';
        arrow.textContent = '▶';
        const ico = document.createElement('span');
        ico.className = 'usp-picker-ico';
        ico.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>`;
        const name = document.createElement('span');
        name.textContent = node.name;
        row.appendChild(arrow); row.appendChild(ico); row.appendChild(name);

        const children = document.createElement('div');
        children.style.display = 'none';
        let rendered = false;
        row.onclick = () => {
          const open = children.style.display !== 'none';
          children.style.display = open ? 'none' : '';
          arrow.textContent = open ? '▶' : '▼';
          if (!open && !rendered) { rendered = true; _renderPickerLevel(node.children || [], children, depth + 1, ws); }
        };
        container.appendChild(row);
        container.appendChild(children);
      } else {
        const ico = document.createElement('span');
        ico.className = 'usp-picker-ico';
        ico.textContent = node.name.split('.').pop().toUpperCase().slice(0, 3);
        const name = document.createElement('span');
        name.className = 'usp-picker-fname';
        name.textContent = node.name;
        row.appendChild(ico); row.appendChild(name);
        row.onclick = async () => {
          const fp      = node.path.replace(/\\/g, '/');
          const folders = (ws.folders || []).map(f => f.replace(/\\/g, '/'));
          const inWs    = folders.some(f => fp.startsWith(f));
          if (!inWs) {
            const parentFolder = node.path.replace(/[\\/][^\\/]+$/, '');
            const ok = await _confirm(
              `<strong>"${node.name}"</strong> is not inside your workspace.<br><br>Add its folder to the workspace and set it as default?`,
              'Yes, add it', 'Cancel'
            );
            if (!ok) return;
            if (!ws.folders.includes(parentFolder)) ws.folders.push(parentFolder);
          }
          _setDefaultFile(node.path, ws);
          _switchTab('workspace');
        };
        container.appendChild(row);
      }
    }
  }

  /* ── Shortcuts tab ────────────────────────────────────────────────── */
  function _shortcutsHtml() {
    const kb = _cfg.keybindings || {};
    let html = '<div class="usp-shortcuts">';
    let lastSection = '';
    SHORTCUTS.forEach(s => {
      if (s.section !== undefined) {
        lastSection = s.section;
        html += `<div class="usp-sc-section">${s.section}</div>`;
        return;
      }
      const current = kb[s.id] ? _fmtBinding(kb[s.id]) : s.def;
      const isCustom = !!kb[s.id];
      html += `<div class="usp-sc-row" data-id="${s.id}">
        <span class="usp-sc-label">${s.label}</span>
        <div class="usp-sc-right">
          <kbd class="usp-kbd${isCustom ? ' custom' : ''}" id="kbd-${s.id}">${current}</kbd>
          ${s.ro ? '' : `<button class="usp-sc-edit" data-id="${s.id}" title="Remap">✎</button>
          ${isCustom ? `<button class="usp-sc-reset" data-id="${s.id}" title="Reset to default">↺</button>` : ''}`}
        </div>
      </div>`;
    });
    html += '</div>';
    html += '<p class="usp-sc-hint">Click ✎ to remap. Press Esc to cancel capture. Monaco editor shortcuts cannot be remapped here.</p>';
    return html;
  }

  function _bindShortcuts() {
    _overlay.querySelectorAll('.usp-sc-edit').forEach(btn => {
      btn.onclick = () => _startCapture(btn.dataset.id);
    });
    _overlay.querySelectorAll('.usp-sc-reset').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        if (!_cfg.keybindings) _cfg.keybindings = {};
        delete _cfg.keybindings[id];
        // Refresh tab
        _switchTab('shortcuts');
      };
    });
  }

  function _startCapture(actionId) {
    const kbdEl = _q('#kbd-' + actionId);
    if (!kbdEl) return;
    const original = kbdEl.textContent;
    kbdEl.textContent = 'Press keys…';
    kbdEl.classList.add('capturing');

    const onKey = e => {
      if (['Control','Shift','Alt','Meta'].includes(e.key)) return; // wait for real key
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        kbdEl.textContent = original;
        kbdEl.classList.remove('capturing');
        document.removeEventListener('keydown', onKey, true);
        return;
      }
      const parts = [];
      if (e.ctrlKey)  parts.push('ctrl');
      if (e.shiftKey) parts.push('shift');
      if (e.altKey)   parts.push('alt');
      const k = e.key === ' ' ? 'space' : e.key.toLowerCase();
      parts.push(k);
      const stored = parts.join('+');
      if (!_cfg.keybindings) _cfg.keybindings = {};
      _cfg.keybindings[actionId] = stored;
      kbdEl.textContent = _fmtBinding(stored);
      kbdEl.classList.remove('capturing');
      kbdEl.classList.add('custom');
      // Show reset button
      const row = kbdEl.closest('.usp-sc-row');
      if (row && !row.querySelector('.usp-sc-reset')) {
        const resetBtn = document.createElement('button');
        resetBtn.className = 'usp-sc-reset'; resetBtn.title = 'Reset to default';
        resetBtn.textContent = '↺'; resetBtn.dataset.id = actionId;
        resetBtn.onclick = () => {
          delete _cfg.keybindings[actionId];
          _switchTab('shortcuts');
        };
        kbdEl.closest('.usp-sc-right').appendChild(resetBtn);
      }
      document.removeEventListener('keydown', onKey, true);
    };
    document.addEventListener('keydown', onKey, true);
  }

  function _fmtBinding(stored) {
    return stored.split('+').map(p => {
      if (p === 'ctrl')  return 'Ctrl';
      if (p === 'shift') return 'Shift';
      if (p === 'alt')   return 'Alt';
      if (p === 'space') return 'Space';
      if (p === '`')     return '`';
      return p.length === 1 ? p.toUpperCase() : p;
    }).join('+');
  }

  /* ── Helpers ──────────────────────────────────────────────────────── */
  function _applyTheme(v) {
    if (v === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      if (window.monaco) monaco.editor.setTheme('htmledger-light');
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (window.monaco) monaco.editor.setTheme('htmledger');
    }
    localStorage.setItem('htmledger-theme', v);
  }

  function _q(sel)      { return _overlay ? _overlay.querySelector(sel) : null; }
  function _on(sel, ev, fn) { const el = _q(sel); if (el) el.addEventListener(ev, fn); }

  function _chips(groupSel, onChange) {
    const group = _q(groupSel);
    if (!group) return;
    group.querySelectorAll('.usp-chip').forEach(btn => {
      btn.onclick = () => {
        group.querySelectorAll('.usp-chip').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        onChange(btn.dataset.v);
      };
    });
  }

  function _esc(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  async function _save() {
    await window.api.saveSettings(_cfg);
    if (_ws.length) {
      await window.api.saveWorkspaces(_ws);
      document.dispatchEvent(new CustomEvent('workspaces-changed', { detail: _ws }));
    }
    if (_cfg.theme) _applyTheme(_cfg.theme);
    document.dispatchEvent(new CustomEvent('settings-changed', { detail: _cfg }));
    _close();
  }

  function _confirm(htmlMsg, yesLabel = 'Yes', noLabel = 'Cancel') {
    return new Promise(resolve => {
      const el = document.createElement('div');
      el.className = 'usp-confirm-overlay';
      el.innerHTML = `
        <div class="usp-confirm-box">
          <div class="usp-confirm-msg">${htmlMsg}</div>
          <div class="usp-confirm-btns">
            <button class="usp-btn-sec" id="usp-conf-no">${_esc(noLabel)}</button>
            <button class="usp-btn-pri" id="usp-conf-yes">${_esc(yesLabel)}</button>
          </div>
        </div>`;
      _overlay.appendChild(el);
      el.querySelector('#usp-conf-yes').onclick = () => { el.remove(); resolve(true);  };
      el.querySelector('#usp-conf-no').onclick  = () => { el.remove(); resolve(false); };
    });
  }

  function _close() { if (_overlay) _overlay.style.display = 'none'; }
})();

/* ── Changelog ─────────────────────────────────────────────────────────── */
const CHANGELOG = {
  '2.0.0': {
    summary: 'Two editors, one install. HTMLedger now ships alongside the all-new Lite edition.',
    sections: [
      {
        title: 'New — HTMLedger Lite',
        items: [
          'Ultralight CodeMirror 6 editor — starts in under a second',
          'Same workspace manager and 11-file-type support as the full edition',
          'Portable build — runs from a folder with no installer needed',
        ],
      },
      {
        title: 'Editor',
        items: [
          'Markdown preview now renders tables (GFM pipe syntax)',
          'Preview pane preserves scroll position on every live update',
          'Tables, blockquotes, and code blocks styled for dark & light themes',
        ],
      },
      {
        title: 'App',
        items: [
          'HTMLedger now appears in Windows "Open with" for all 11 supported file types',
          'Double-clicking a file opens it directly in the editor, bypassing the workspace picker',
          'Release notes shown automatically after each update (toggle in Settings → App)',
        ],
      },
    ],
  },
};

function showChangelogModal(version) {
  const log = CHANGELOG[version];
  const existing = document.getElementById('chl-modal-overlay');
  if (existing) existing.remove();

  const sectionsHtml = log
    ? log.sections.map(s => `
        <div class="chl-section">
          <div class="chl-section-title">${s.title}</div>
          <ul class="chl-list">${s.items.map(i => `<li>${i}</li>`).join('')}</ul>
        </div>`).join('')
    : '<p style="color:var(--text-muted)">No notes available for this version.</p>';

  const summaryHtml = log?.summary
    ? `<p class="chl-summary">${log.summary}</p>` : '';

  const el = document.createElement('div');
  el.id = 'chl-modal-overlay';
  el.className = 'modal-overlay';
  el.innerHTML = `
    <div class="modal chl-modal">
      <div class="modal-header">
        <span class="modal-title">What's new in v${version}</span>
        <button class="modal-close" id="chl-close">&#x2715;</button>
      </div>
      <div class="modal-body chl-body">
        ${summaryHtml}
        ${sectionsHtml}
      </div>
      <div class="modal-footer" style="justify-content:flex-end;gap:0.75rem">
        <button class="usp-btn-sec" id="chl-disable">Don't show again</button>
        <button class="usp-btn-pri" id="chl-done">Got it</button>
      </div>
    </div>`;
  document.body.appendChild(el);

  const close = () => el.remove();
  el.querySelector('#chl-close').onclick = close;
  el.querySelector('#chl-done').onclick  = close;
  el.querySelector('#chl-disable').onclick = async () => {
    const cfg = (await window.api.getSettings()) || {};
    cfg.showReleaseNotes = false;
    await window.api.saveSettings(cfg);
    close();
  };
  el.addEventListener('click', e => { if (e.target === el) close(); });
}

// Listen for the main-process trigger (fires once after an update)
if (window.api?.onShowChangelog) {
  window.api.onShowChangelog(version => showChangelogModal(version));
}
