import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marked } from 'marked';

interface Article {
  id: number; slug: string; title: string; summary: string; body: string;
  style: 'plain' | 'markdown'; pinned: number; archived: number;
  archived_at: string | null; archive_reason: string | null; created_at: string;
}

export default function Article({ archived = false }: { archived?: boolean }) {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const url = archived ? `/api/articles/archives/${slug}` : `/api/articles/${slug}`;
    fetch(url)
      .then(r => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then((data: Article | null) => { if (data) setArticle(data); })
      .catch(() => setNotFound(true));
  }, [slug, archived]);

  if (notFound) return (
    <div className="article-page container">
      <p>Article not found. <Link to={archived ? '/articles/archives' : '/articles'}>← Back to articles</Link></p>
    </div>
  );

  if (!article) return <div className="article-page container"><p>Loading…</p></div>;

  const isMarkdown = article.style === 'markdown';

  return (
    <div className="article-page container">
      <div className="article-nav-row">
        <Link to={archived ? '/articles/archives' : '/articles'} className="article-back">
          ← {archived ? 'Archived Articles' : 'All articles'}
        </Link>
        {!archived && (
          <Link to="/articles/archives" className="article-archives-link">Archived Articles →</Link>
        )}
      </div>

      {archived && article.archived_at && (
        <div className="article-archive-banner">
          <span className="article-archive-banner-icon">📦</span>
          <span>
            As of {new Date(article.archived_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}, this article has been archived
            {article.archive_reason ? ` because ${article.archive_reason}` : '.'}{article.archive_reason ? '.' : ''}
          </span>
        </div>
      )}

      <div className="article-header">
        <div className="article-header-meta">
          <span className="article-date">{new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          {!archived && !!article.pinned && <span className="article-pinned-badge">📌 Pinned</span>}
        </div>
        <h1 className="article-title">{article.title}</h1>
        {article.summary && <p className="article-summary">{article.summary}</p>}
      </div>

      {isMarkdown ? (
        <div className="article-body article-body--md" dangerouslySetInnerHTML={{ __html: marked(article.body) as string }} />
      ) : (
        <div className="article-body">
          {article.body.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
        </div>
      )}
    </div>
  );
}
