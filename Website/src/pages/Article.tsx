import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marked } from 'marked';

interface Article { id: number; slug: string; title: string; summary: string; body: string; style: 'plain' | 'markdown'; created_at: string; }

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

  const isMarkdown = article.style === 'markdown';

  return (
    <div className="article-page container">
      <Link to="/articles" className="article-back">← All articles</Link>
      <div className="article-header">
        <span className="article-date">{new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <h1 className="article-title">{article.title}</h1>
        {article.summary && <p className="article-summary">{article.summary}</p>}
      </div>
      {isMarkdown ? (
        <div
          className="article-body article-body--md"
          dangerouslySetInnerHTML={{ __html: marked(article.body) as string }}
        />
      ) : (
        <div className="article-body">
          {article.body.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}
    </div>
  );
}
