import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

interface Article { id: number; slug: string; title: string; summary: string; body: string; created_at: string; }

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/articles/${slug}`)
      .then(r => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then((data: Article | null) => { if (data) setArticle(data); })
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) return (
    <div className="article-page container">
      <p>Article not found. <Link to="/articles">← Back to articles</Link></p>
    </div>
  );

  if (!article) return <div className="article-page container"><p>Loading…</p></div>;

  return (
    <div className="article-page container">
      <Link to="/articles" className="article-back">← All articles</Link>
      <div className="article-header">
        <span className="article-date">{new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <h1 className="article-title">{article.title}</h1>
        {article.summary && <p className="article-summary">{article.summary}</p>}
      </div>
      <div className="article-body">
        {article.body.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </div>
  );
}
