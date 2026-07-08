import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Article { id: number; slug: string; title: string; summary: string; created_at: string; }

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/articles')
      .then(r => r.json())
      .then((data: Article[]) => { setArticles(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="articles-page container">
      <div className="articles-header">
        <h1>Articles</h1>
        <p>Updates, guides, and notes from the HTMLedger team.</p>
      </div>
      {loading && <p className="articles-loading">Loading…</p>}
      {!loading && articles.length === 0 && <p className="articles-empty">No articles yet — check back soon.</p>}
      <div className="articles-list">
        {articles.map(a => (
          <Link key={a.id} to={`/articles/${a.slug}`} className="article-card">
            <span className="article-card-date">{new Date(a.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <h2 className="article-card-title">{a.title}</h2>
            {a.summary && <p className="article-card-summary">{a.summary}</p>}
            <span className="article-card-read">Read more →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
