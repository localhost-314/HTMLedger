import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Plan {
  id: number;
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'done';
  sort_order: number;
}

const STATUS_META: Record<Plan['status'], { label: string; color: string; bg: string }> = {
  'in-progress': { label: 'In progress', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  planned:       { label: 'Planned',     color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  done:          { label: 'Done',        color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
};

export default function Upcoming() {
  const [plans, setPlans]   = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/upcoming')
      .then(r => r.json())
      .then((data: Plan[]) => { setPlans(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="hero" style={{ paddingBottom: '4rem' }}>
        <div className="hero-bg-glow" />
        <div className="hero-bg-grid" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-tag">&lt;HTMLedger /&gt;</div>
          <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)' }}>
            Upcoming Features
          </h1>
          <p className="hero-sub">
            What we're building next — updated as things move forward.
          </p>
          <div className="hero-btns">
            <Link to="/main/download" className="btn btn-primary btn-lg">
              ↓&nbsp;&nbsp;Download Free
            </Link>
            <Link to="/upcoming/request" className="btn btn-ghost btn-lg">
              Request a feature →
            </Link>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section style={{ padding: '3rem 0 5rem' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          {loading && (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem 0' }}>
              Loading…
            </p>
          )}

          {!loading && plans.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem 0' }}>
              Nothing queued right now — check back soon.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {plans.map(plan => {
              const meta = STATUS_META[plan.status] ?? STATUS_META.planned;
              return (
                <div
                  key={plan.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    display: 'flex',
                    gap: '1.25rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        {plan.title}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: meta.color,
                          background: meta.bg,
                          border: `1px solid ${meta.color}40`,
                          borderRadius: '999px',
                          padding: '0.15rem 0.65rem',
                          lineHeight: 1.6,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                      {plan.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {!loading && plans.length > 0 && (
            <p style={{ marginTop: '2.5rem', fontSize: '0.85rem', color: 'var(--text-muted, var(--text-secondary))', textAlign: 'center' }}>
              Have an idea?{' '}
              <a
                href="https://github.com/localhost-314/HTMLedger/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent)' }}
              >
                Open a GitHub issue
              </a>{' '}
              and we'll consider it.
            </p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-strip">
        <div className="container">
          <h2>Already the best free HTML editor for Windows.</h2>
          <p>Download today and get every feature — with more on the way.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/main/download" className="btn btn-primary btn-lg">
              ↓&nbsp;&nbsp;Download HTMLedger Free
            </Link>
            <Link to="/main/features" className="btn btn-ghost btn-lg">
              See all current features →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
