import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{ fontSize: '5rem', fontWeight: '800', color: 'var(--accent)', lineHeight: 1 }}>404</div>
      <div style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)', margin: '0.75rem 0 1.5rem', fontSize: '1rem' }}>
        &lt;PageNotFound /&gt;
      </div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem' }}>
        This page doesn't exist
      </h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '360px', marginBottom: '2rem' }}>
        The link may be broken or the page may have moved.
      </p>
      <Link to="/" className="btn btn-primary">
        ← Back to Home
      </Link>
    </div>
  );
}
