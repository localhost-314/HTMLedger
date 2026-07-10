import { useState, useEffect, useRef } from 'react';

interface Article {
  id: number; slug: string; title: string; summary: string;
  style: 'plain' | 'markdown'; pinned: number; archived: number;
  archived_at: string | null; archive_reason: string | null;
  published: number; created_at: string;
}
interface Banner { message: string; type: 'info' | 'warning' | 'success'; linkUrl?: string; linkText?: string; }
interface Plan { id: number; title: string; description: string; status: 'planned' | 'in-progress' | 'done'; sort_order: number; }

const TOKEN_KEY = 'admin-token';

function authHeaders(token: string) {
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? '');
  const [pwInput, setPwInput] = useState('');
  const [loginErr, setLoginErr] = useState(false);
  const [tab, setTab] = useState<'banner' | 'articles' | 'upcoming'>('banner');

  // Banner state
  const [banner, setBanner] = useState<Banner>({ message: '', type: 'info', linkUrl: '', linkText: '' });
  const [bannerActive, setBannerActive] = useState(false);
  const [bannerSaved, setBannerSaved] = useState(false);

  // Articles state
  const [articles, setArticles] = useState<Article[]>([]);
  const [editing, setEditing] = useState<Partial<Article> & { body?: string } | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Archive modal state
  const [archiving, setArchiving] = useState<Article | null>(null);
  const [archiveReason, setArchiveReason] = useState('');

  // Upcoming plans state
  const [plans, setPlans]           = useState<Plan[]>([]);
  const [editingPlan, setEditingPlan] = useState<Partial<Plan> | null>(null);
  const [isNewPlan, setIsNewPlan]   = useState(false);

  // Image upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');

  async function login() {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwInput }),
    });
    if (res.ok) { sessionStorage.setItem(TOKEN_KEY, pwInput); setToken(pwInput); setLoginErr(false); }
    else setLoginErr(true);
  }

  async function loadBanner() {
    const res = await fetch('/api/admin/banner', { headers: authHeaders(token) });
    const data: Banner | null = await res.json();
    if (data) { setBanner(data); setBannerActive(true); } else setBannerActive(false);
  }

  async function saveBanner() {
    await fetch('/api/admin/banner', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(banner) });
    setBannerActive(true); setBannerSaved(true); setTimeout(() => setBannerSaved(false), 2000);
  }

  async function clearBanner() {
    await fetch('/api/admin/banner', { method: 'DELETE', headers: authHeaders(token) });
    setBanner({ message: '', type: 'info' }); setBannerActive(false);
  }

  async function loadArticles() {
    const res = await fetch('/api/admin/articles', { headers: authHeaders(token) });
    setArticles(await res.json());
  }

  async function saveArticle() {
    if (!editing) return;
    const url = isNew ? '/api/admin/articles' : `/api/admin/articles/${editing.id}`;
    const method = isNew ? 'POST' : 'PUT';
    await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(editing) });
    setEditing(null);
    loadArticles();
  }

  async function fetchFull(id: number) {
    const res = await fetch(`/api/admin/articles/${id}`, { headers: authHeaders(token) });
    return res.json();
  }

  async function togglePublish(a: Article) {
    const full = await fetchFull(a.id);
    await fetch(`/api/admin/articles/${a.id}`, {
      method: 'PUT', headers: authHeaders(token),
      body: JSON.stringify({ ...full, published: a.published ? 0 : 1 }),
    });
    loadArticles();
  }

  async function togglePin(a: Article) {
    const full = await fetchFull(a.id);
    await fetch(`/api/admin/articles/${a.id}`, {
      method: 'PUT', headers: authHeaders(token),
      body: JSON.stringify({ ...full, pinned: a.pinned ? 0 : 1 }),
    });
    loadArticles();
  }

  async function confirmArchive(a: Article) {
    const full = await fetchFull(a.id);
    await fetch(`/api/admin/articles/${a.id}`, {
      method: 'PUT', headers: authHeaders(token),
      body: JSON.stringify({
        ...full,
        archived: 1,
        archived_at: new Date().toISOString(),
        archive_reason: archiveReason.trim() || null,
      }),
    });
    setArchiving(null); setArchiveReason(''); loadArticles();
  }

  async function unarchive(a: Article) {
    const full = await fetchFull(a.id);
    await fetch(`/api/admin/articles/${a.id}`, {
      method: 'PUT', headers: authHeaders(token),
      body: JSON.stringify({ ...full, archived: 0, archived_at: null, archive_reason: null }),
    });
    loadArticles();
  }

  async function deleteArticle(id: number) {
    if (!confirm('Delete this article?')) return;
    await fetch(`/api/admin/articles/${id}`, { method: 'DELETE', headers: authHeaders(token) });
    loadArticles();
  }

  async function loadPlans() {
    const res = await fetch('/api/admin/upcoming', { headers: authHeaders(token) });
    setPlans(await res.json());
  }

  async function savePlan() {
    if (!editingPlan) return;
    const url    = isNewPlan ? '/api/admin/upcoming' : `/api/admin/upcoming/${editingPlan.id}`;
    const method = isNewPlan ? 'POST' : 'PUT';
    await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(editingPlan) });
    setEditingPlan(null);
    loadPlans();
  }

  async function deletePlan(id: number) {
    if (!confirm('Delete this plan?')) return;
    await fetch(`/api/admin/upcoming/${id}`, { method: 'DELETE', headers: authHeaders(token) });
    loadPlans();
  }

  async function uploadImage(file: File) {
    setUploading(true); setUploadedUrl('');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: fd,
    });
    const { url } = await res.json();
    setUploadedUrl(url);
    setUploading(false);
  }

  useEffect(() => {
    if (!token) return;
    loadBanner(); loadArticles(); loadPlans();
  }, [token]);

  if (!token) {
    return (
      <div className="admin-login">
        <div className="admin-login-box">
          <img src="/Logos/White Graphic Ledger.png" alt="HTMLedger" className="admin-login-logo" />
          <h1>Admin</h1>
          <input
            type="password" placeholder="Password" value={pwInput}
            onChange={e => setPwInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            className={`admin-input ${loginErr ? 'error' : ''}`} autoFocus
          />
          {loginErr && <p className="admin-login-err">Incorrect password</p>}
          <button className="btn btn-primary" onClick={login}>Sign in</button>
        </div>
      </div>
    );
  }

  const active = articles.filter(a => !a.archived);
  const archived = articles.filter(a => a.archived);

  return (
    <div className="admin-page">
      {/* Archive modal */}
      {archiving && (
        <div className="admin-modal-overlay" onClick={() => setArchiving(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h2>Archive "{archiving.title}"?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.5rem 0 1rem' }}>
              The article will move to /articles/archives/{archiving.slug}. Pinned state is remembered.
            </p>
            <div className="admin-field">
              <label>Reason <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
              <input className="admin-input" value={archiveReason} onChange={e => setArchiveReason(e.target.value)}
                placeholder="e.g. this information is outdated" />
            </div>
            <div className="admin-actions">
              <button className="btn btn-primary" onClick={() => confirmArchive(archiving)}>Archive</button>
              <button className="admin-btn-sm" onClick={() => setArchiving(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-header">
        <div className="admin-header-left">
          <img src="/Logos/White Graphic Ledger.png" alt="" className="admin-header-logo" />
          <span>HTMLedger Admin</span>
        </div>
        <button className="admin-signout" onClick={() => { sessionStorage.removeItem(TOKEN_KEY); setToken(''); }}>Sign out</button>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'banner' ? 'active' : ''}`} onClick={() => setTab('banner')}>Banner</button>
        <button className={`admin-tab ${tab === 'articles' ? 'active' : ''}`} onClick={() => setTab('articles')}>Articles</button>
        <button className={`admin-tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>Upcoming</button>
      </div>

      <div className="admin-body">

        {tab === 'banner' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2>Site Banner</h2>
              {bannerActive ? <span className="admin-badge admin-badge--green">Active</span> : <span className="admin-badge">Inactive</span>}
            </div>
            <div className="admin-field">
              <label>Message</label>
              <input className="admin-input" value={banner.message} onChange={e => setBanner(b => ({ ...b, message: e.target.value }))} placeholder="e.g. HTMLedger 2.1 is now available!" />
            </div>
            <div className="admin-field">
              <label>Type</label>
              <select className="admin-input" value={banner.type} onChange={e => setBanner(b => ({ ...b, type: e.target.value as Banner['type'] }))}>
                <option value="info">Info (blue)</option>
                <option value="success">Success (green)</option>
                <option value="warning">Warning (yellow)</option>
              </select>
            </div>
            <div className="admin-field">
              <label>Link URL <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
              <input className="admin-input" value={banner.linkUrl ?? ''} onChange={e => setBanner(b => ({ ...b, linkUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="admin-field">
              <label>Link Text <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
              <input className="admin-input" value={banner.linkText ?? ''} onChange={e => setBanner(b => ({ ...b, linkText: e.target.value }))} placeholder="Learn more" />
            </div>
            <div className="admin-actions">
              <button className="btn btn-primary" onClick={saveBanner} disabled={!banner.message.trim()}>{bannerSaved ? '✓ Saved' : 'Publish Banner'}</button>
              {bannerActive && <button className="admin-btn-danger" onClick={clearBanner}>Remove Banner</button>}
            </div>
          </div>
        )}

        {tab === 'articles' && !editing && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2>Articles</h2>
              <button className="btn btn-primary btn-sm" onClick={() => { setIsNew(true); setEditing({ slug: '', title: '', summary: '', body: '', style: 'plain', pinned: 0, archived: 0, published: 0 }); }}>
                + New Article
              </button>
            </div>

            {active.length === 0 && <p className="admin-empty">No articles yet.</p>}
            <div className="admin-article-list">
              {active.map(a => (
                <div key={a.id} className={`admin-article-row ${a.pinned ? 'admin-article-row--pinned' : ''}`}>
                  <div className="admin-article-info">
                    {!!a.pinned && <span className="admin-pin-icon">📌</span>}
                    <span className="admin-article-title">{a.title}</span>
                    <span className="admin-article-meta">/{a.slug} · {new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="admin-article-actions">
                    <span className={`admin-badge ${a.published ? 'admin-badge--green' : ''}`}>{a.published ? 'Published' : 'Draft'}</span>
                    <button className="admin-btn-sm" onClick={async () => {
                      const res = await fetch(`/api/admin/articles/${a.id}`, { headers: authHeaders(token) });
                      setIsNew(false); setEditing(await res.json());
                    }}>Edit</button>
                    <button className="admin-btn-sm" onClick={() => togglePin(a)}>{a.pinned ? 'Unpin' : 'Pin'}</button>
                    <button className="admin-btn-sm" onClick={() => togglePublish(a)}>{a.published ? 'Unpublish' : 'Publish'}</button>
                    <button className="admin-btn-sm" onClick={() => { setArchiving(a); setArchiveReason(''); }}>Archive</button>
                    <button className="admin-btn-sm admin-btn-sm--danger" onClick={() => deleteArticle(a.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>

            {archived.length > 0 && (
              <>
                <div className="admin-section-divider"><span>Archived</span></div>
                <div className="admin-article-list">
                  {archived.map(a => (
                    <div key={a.id} className="admin-article-row admin-article-row--archived">
                      <div className="admin-article-info">
                        <span className="admin-article-title">{a.title}</span>
                        <span className="admin-article-meta">/{a.slug} · archived {a.archived_at ? new Date(a.archived_at).toLocaleDateString() : ''}</span>
                      </div>
                      <div className="admin-article-actions">
                        <button className="admin-btn-sm" onClick={async () => {
                          const res = await fetch(`/api/admin/articles/${a.id}`, { headers: authHeaders(token) });
                          setIsNew(false); setEditing(await res.json());
                        }}>Edit</button>
                        <button className="admin-btn-sm" onClick={() => unarchive(a)}>Unarchive</button>
                        <button className="admin-btn-sm admin-btn-sm--danger" onClick={() => deleteArticle(a.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'articles' && editing && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2>{isNew ? 'New Article' : 'Edit Article'}</h2>
              <button className="admin-btn-sm" onClick={() => setEditing(null)}>← Back</button>
            </div>
            <div className="admin-field">
              <label>Title</label>
              <input className="admin-input" value={editing.title ?? ''} onChange={e => setEditing(ed => ({ ...ed!, title: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label>Slug</label>
              <input className="admin-input" value={editing.slug ?? ''} onChange={e => setEditing(ed => ({ ...ed!, slug: e.target.value }))} placeholder="my-article-slug" />
            </div>
            <div className="admin-field">
              <label>Summary</label>
              <input className="admin-input" value={editing.summary ?? ''} onChange={e => setEditing(ed => ({ ...ed!, summary: e.target.value }))} placeholder="Short description shown in the article list" />
            </div>
            <div className="admin-field">
              <label>Style</label>
              <select className="admin-input" value={editing.style ?? 'plain'} onChange={e => setEditing(ed => ({ ...ed!, style: e.target.value as 'plain' | 'markdown' }))}>
                <option value="plain">Plain text</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>
            <div className="admin-field">
              <label>Body</label>
              <textarea className="admin-input admin-textarea" value={editing.body ?? ''} onChange={e => setEditing(ed => ({ ...ed!, body: e.target.value }))} rows={18} />
            </div>

            {/* Image upload */}
            <div className="admin-field">
              <label>Upload Image</label>
              <div className="admin-upload-row">
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ''; }} />
                <button className="admin-btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Uploading…' : 'Choose image…'}
                </button>
                {uploadedUrl && (
                  <div className="admin-upload-result">
                    <code className="admin-upload-md">![alt text]({uploadedUrl})</code>
                    <button className="admin-btn-sm" onClick={() => navigator.clipboard.writeText(`![alt text](${uploadedUrl})`)}>Copy</button>
                    <button className="admin-btn-sm" onClick={() => setEditing(ed => ({ ...ed!, body: (ed!.body ?? '') + `\n\n![alt text](${uploadedUrl})` }))}>Insert</button>
                  </div>
                )}
              </div>
            </div>

            <div className="admin-field admin-field--row">
              <label>
                <input type="checkbox" checked={!!editing.published} onChange={e => setEditing(ed => ({ ...ed!, published: e.target.checked ? 1 : 0 }))} />
                {' '}Published
              </label>
              <label>
                <input type="checkbox" checked={!!editing.pinned} onChange={e => setEditing(ed => ({ ...ed!, pinned: e.target.checked ? 1 : 0 }))} />
                {' '}Pinned
              </label>
            </div>
            <div className="admin-actions">
              <button className="btn btn-primary" onClick={saveArticle}>Save</button>
              <button className="admin-btn-sm" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        )}

        {tab === 'upcoming' && !editingPlan && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2>Upcoming Features</h2>
              <button className="btn btn-primary btn-sm" onClick={() => { setIsNewPlan(true); setEditingPlan({ title: '', description: '', status: 'planned', sort_order: plans.length + 1 }); }}>
                + New Plan
              </button>
            </div>
            {plans.length === 0 && <p className="admin-empty">No plans yet.</p>}
            <div className="admin-article-list">
              {plans.map(p => (
                <div key={p.id} className="admin-article-row">
                  <div className="admin-article-info">
                    <span className="admin-article-title">{p.title}</span>
                    <span className="admin-article-meta">#{p.sort_order} · {p.status}</span>
                  </div>
                  <div className="admin-article-actions">
                    <span className={`admin-badge ${p.status === 'in-progress' ? 'admin-badge--green' : p.status === 'done' ? '' : ''}`}>
                      {p.status === 'in-progress' ? 'In Progress' : p.status === 'done' ? 'Done' : 'Planned'}
                    </span>
                    <button className="admin-btn-sm" onClick={() => { setIsNewPlan(false); setEditingPlan({ ...p }); }}>Edit</button>
                    <button className="admin-btn-sm admin-btn-sm--danger" onClick={() => deletePlan(p.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'upcoming' && editingPlan && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2>{isNewPlan ? 'New Plan' : 'Edit Plan'}</h2>
              <button className="admin-btn-sm" onClick={() => setEditingPlan(null)}>← Back</button>
            </div>
            <div className="admin-field">
              <label>Title</label>
              <input className="admin-input" value={editingPlan.title ?? ''} onChange={e => setEditingPlan(p => ({ ...p!, title: e.target.value }))} placeholder="e.g. Git Integration" />
            </div>
            <div className="admin-field">
              <label>Description</label>
              <textarea className="admin-input admin-textarea" rows={4} value={editingPlan.description ?? ''} onChange={e => setEditingPlan(p => ({ ...p!, description: e.target.value }))} placeholder="What will this feature do?" />
            </div>
            <div className="admin-field">
              <label>Status</label>
              <select className="admin-input" value={editingPlan.status ?? 'planned'} onChange={e => setEditingPlan(p => ({ ...p!, status: e.target.value as Plan['status'] }))}>
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="admin-field">
              <label>Sort Order</label>
              <input className="admin-input" type="number" value={editingPlan.sort_order ?? 0} onChange={e => setEditingPlan(p => ({ ...p!, sort_order: Number(e.target.value) }))} />
            </div>
            <div className="admin-actions">
              <button className="btn btn-primary" onClick={savePlan}>Save</button>
              <button className="admin-btn-sm" onClick={() => setEditingPlan(null)}>Cancel</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
