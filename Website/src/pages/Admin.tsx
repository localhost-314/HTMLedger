import { useState, useEffect } from 'react';

interface Article { id: number; slug: string; title: string; summary: string; published: number; created_at: string; }
interface Banner { message: string; type: 'info' | 'warning' | 'success'; }

const TOKEN_KEY = 'admin-token';

function authHeaders(token: string) {
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? '');
  const [pwInput, setPwInput] = useState('');
  const [loginErr, setLoginErr] = useState(false);
  const [tab, setTab] = useState<'banner' | 'articles'>('banner');

  // Banner state
  const [banner, setBanner] = useState<Banner>({ message: '', type: 'info' });
  const [bannerActive, setBannerActive] = useState(false);
  const [bannerSaved, setBannerSaved] = useState(false);

  // Articles state
  const [articles, setArticles] = useState<Article[]>([]);
  const [editing, setEditing] = useState<Partial<Article> & { body?: string } | null>(null);
  const [isNew, setIsNew] = useState(false);

  async function login() {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwInput }),
    });
    if (res.ok) {
      sessionStorage.setItem(TOKEN_KEY, pwInput);
      setToken(pwInput);
      setLoginErr(false);
    } else {
      setLoginErr(true);
    }
  }

  async function loadBanner() {
    const res = await fetch('/api/admin/banner', { headers: authHeaders(token) });
    const data: Banner | null = await res.json();
    if (data) { setBanner(data); setBannerActive(true); }
    else setBannerActive(false);
  }

  async function saveBanner() {
    await fetch('/api/admin/banner', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(banner),
    });
    setBannerActive(true);
    setBannerSaved(true);
    setTimeout(() => setBannerSaved(false), 2000);
  }

  async function clearBanner() {
    await fetch('/api/admin/banner', { method: 'DELETE', headers: authHeaders(token) });
    setBanner({ message: '', type: 'info' });
    setBannerActive(false);
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

  async function togglePublish(a: Article) {
    await fetch(`/api/admin/articles/${a.id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ ...a, published: a.published ? 0 : 1 }),
    });
    loadArticles();
  }

  async function deleteArticle(id: number) {
    if (!confirm('Delete this article?')) return;
    await fetch(`/api/admin/articles/${id}`, { method: 'DELETE', headers: authHeaders(token) });
    loadArticles();
  }

  useEffect(() => {
    if (!token) return;
    loadBanner();
    loadArticles();
  }, [token]);

  if (!token) {
    return (
      <div className="admin-login">
        <div className="admin-login-box">
          <img src="/Logos/White Graphic Ledger.png" alt="HTMLedger" className="admin-login-logo" />
          <h1>Admin</h1>
          <input
            type="password"
            placeholder="Password"
            value={pwInput}
            onChange={e => setPwInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            className={`admin-input ${loginErr ? 'error' : ''}`}
            autoFocus
          />
          {loginErr && <p className="admin-login-err">Incorrect password</p>}
          <button className="btn btn-primary" onClick={login}>Sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-left">
          <img src="/Logos/White Graphic Ledger.png" alt="" className="admin-header-logo" />
          <span>HTMLedger Admin</span>
        </div>
        <button className="admin-signout" onClick={() => { sessionStorage.removeItem(TOKEN_KEY); setToken(''); }}>
          Sign out
        </button>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'banner' ? 'active' : ''}`} onClick={() => setTab('banner')}>Banner</button>
        <button className={`admin-tab ${tab === 'articles' ? 'active' : ''}`} onClick={() => setTab('articles')}>Articles</button>
      </div>

      <div className="admin-body">

        {tab === 'banner' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2>Site Banner</h2>
              {bannerActive && <span className="admin-badge admin-badge--green">Active</span>}
              {!bannerActive && <span className="admin-badge">Inactive</span>}
            </div>
            <div className="admin-field">
              <label>Message</label>
              <input
                className="admin-input"
                value={banner.message}
                onChange={e => setBanner(b => ({ ...b, message: e.target.value }))}
                placeholder="e.g. HTMLedger 2.1 is now available!"
              />
            </div>
            <div className="admin-field">
              <label>Type</label>
              <select className="admin-input" value={banner.type} onChange={e => setBanner(b => ({ ...b, type: e.target.value as Banner['type'] }))}>
                <option value="info">Info (blue)</option>
                <option value="success">Success (green)</option>
                <option value="warning">Warning (yellow)</option>
              </select>
            </div>
            <div className="admin-actions">
              <button className="btn btn-primary" onClick={saveBanner} disabled={!banner.message.trim()}>
                {bannerSaved ? '✓ Saved' : 'Publish Banner'}
              </button>
              {bannerActive && <button className="admin-btn-danger" onClick={clearBanner}>Remove Banner</button>}
            </div>
          </div>
        )}

        {tab === 'articles' && !editing && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2>Articles</h2>
              <button className="btn btn-primary btn-sm" onClick={() => { setIsNew(true); setEditing({ slug: '', title: '', summary: '', body: '', published: 0 }); }}>
                + New Article
              </button>
            </div>
            {articles.length === 0 && <p className="admin-empty">No articles yet.</p>}
            <div className="admin-article-list">
              {articles.map(a => (
                <div key={a.id} className="admin-article-row">
                  <div className="admin-article-info">
                    <span className="admin-article-title">{a.title}</span>
                    <span className="admin-article-meta">/{a.slug} · {new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="admin-article-actions">
                    <span className={`admin-badge ${a.published ? 'admin-badge--green' : ''}`}>
                      {a.published ? 'Published' : 'Draft'}
                    </span>
                    <button className="admin-btn-sm" onClick={() => { setIsNew(false); setEditing(a); }}>Edit</button>
                    <button className="admin-btn-sm" onClick={() => togglePublish(a)}>
                      {a.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button className="admin-btn-sm admin-btn-sm--danger" onClick={() => deleteArticle(a.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
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
              <label>Body</label>
              <textarea className="admin-input admin-textarea" value={editing.body ?? ''} onChange={e => setEditing(ed => ({ ...ed!, body: e.target.value }))} rows={18} />
            </div>
            <div className="admin-field admin-field--row">
              <label>
                <input type="checkbox" checked={!!editing.published} onChange={e => setEditing(ed => ({ ...ed!, published: e.target.checked ? 1 : 0 }))} />
                {' '}Published
              </label>
            </div>
            <div className="admin-actions">
              <button className="btn btn-primary" onClick={saveArticle}>Save</button>
              <button className="admin-btn-sm" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
