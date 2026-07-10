import { useState, useEffect, useRef, type FormEvent } from 'react';

const API = '/api/contact';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

interface FormState {
  name: string;
  email: string;
  message: string;
}

const EMPTY: FormState = { name: '', email: '', message: '' };

type AppChoice = 'main' | 'lite' | '';

const APP_OPTIONS: { value: AppChoice; label: string; platform: string }[] = [
  { value: 'main', label: 'HTMLedger',      platform: 'HTMLedger' },
  { value: 'lite', label: 'HTMLedger Lite', platform: 'HTMLedger Lite' },
];

export default function FeatureRequest() {
  const [form, setForm]             = useState<FormState>(EMPTY);
  const [appChoice, setAppChoice]   = useState<AppChoice>('');
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState('');
  const [siteKey, setSiteKey]       = useState('');
  const [tsVerified, setTsVerified] = useState(false);
  const tokenRef    = useRef('');
  const tsContainer = useRef<HTMLDivElement>(null);
  const widgetId    = useRef('');

  useEffect(() => {
    fetch('/api/turnstile-key')
      .then(r => r.json())
      .then((d: { siteKey?: string }) => { if (d.siteKey) setSiteKey(d.siteKey); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!siteKey || !tsContainer.current) return;
    const mount = () => {
      if (!window.turnstile || !tsContainer.current) return;
      widgetId.current = window.turnstile.render(tsContainer.current, {
        sitekey:            siteKey,
        callback:           (t: string) => { tokenRef.current = t;  setTsVerified(true);  },
        'expired-callback': ()           => { tokenRef.current = ''; setTsVerified(false); },
        'error-callback':   ()           => { tokenRef.current = ''; setTsVerified(false); },
      });
    };
    if (window.turnstile) { mount(); }
    else {
      window.onTurnstileLoad = mount;
      const s = document.createElement('script');
      s.src   = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
      s.async = true;
      document.head.appendChild(s);
    }
  }, [siteKey]);

  function change(field: keyof FormState, val: string) {
    setForm(prev => ({ ...prev, [field]: val }));
    setError('');
  }

  function resetTurnstile() {
    if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    tokenRef.current = '';
    setTsVerified(false);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (siteKey && !tokenRef.current) {
      setError('Please complete the security check.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const chosen = APP_OPTIONS.find(o => o.value === appChoice);
      const payload: Record<string, string> = {
        name:     form.name,
        email:    form.email,
        subject:  'Feature Request',
        message:  form.message,
        platform: chosen?.platform ?? 'HTMLedger',
      };
      if (tokenRef.current) payload.cfToken = tokenRef.current;

      const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      let data: { success?: boolean; code?: number } = {};
      try { data = await res.json(); } catch { /* non-JSON body */ }
      if (data.success) {
        setSuccess(true);
        setForm(EMPTY);
        setAppChoice('');
        resetTurnstile();
      } else {
        const code = data.code ?? res.status;
        setError(`Something went wrong (${code}). Email us at htmledger@localhost314.com`);
        resetTurnstile();
      }
    } catch {
      setError('Could not reach the server. Email us at htmledger@localhost314.com');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="contact-page">
      <div className="container">
        <div className="contact-grid">
          <div className="contact-info">
            <span className="section-label">Feature Requests</span>
            <h1>Request a Feature</h1>
            <p>
              Got an idea that would make HTMLedger better? We'd love to hear it.
              Describe what you need and we'll add it to the backlog.
            </p>
            <div className="contact-detail">
              <span>📧</span>
              <span>htmledger@localhost314.com</span>
            </div>
            <div className="contact-detail" style={{ marginTop: '2rem', flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Prefer GitHub?</span>
              <span>
                <a
                  href="https://github.com/localhost-314/HTMLedger/issues/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent)' }}
                >
                  Open an issue
                </a>{' '}
                and the community can upvote it.
              </span>
            </div>
          </div>

          <div>
            <form className="contact-form" onSubmit={submit} noValidate>
              <div className="form-group">
                <label htmlFor="fr-name">Name</label>
                <input id="fr-name" type="text" className="form-input" placeholder="Your name"
                  value={form.name} onChange={e => change('name', e.target.value)} disabled={loading} />
              </div>
              <div className="form-group">
                <label htmlFor="fr-email">Email</label>
                <input id="fr-email" type="email" className="form-input" placeholder="you@example.com"
                  value={form.email} onChange={e => change('email', e.target.value)} disabled={loading} />
              </div>
              <div className="form-group">
                <label>
                  Which app? <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
                </label>
                <div className="cf-app-toggle">
                  {APP_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      type="button"
                      className={`cf-app-btn${appChoice === o.value ? ' cf-app-btn--active' : ''}`}
                      onClick={() => setAppChoice(prev => prev === o.value ? '' : o.value)}
                      disabled={loading}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="fr-message">Describe the feature</label>
                <textarea id="fr-message" className="form-textarea"
                  placeholder="What would you like HTMLedger to do? The more detail the better — include your use case if you can."
                  value={form.message} onChange={e => change('message', e.target.value)} disabled={loading} />
              </div>

              {siteKey && <div ref={tsContainer} style={{ margin: '0.75rem 0' }} />}

              {error && <div className="form-error">{error}</div>}

              {success ? (
                <div className="form-success">✓ Feature request sent! We'll review it and add it to the list.</div>
              ) : (
                <button type="submit" className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                  disabled={loading || (!!siteKey && !tsVerified)}>
                  {loading ? 'Sending…' : 'Submit Request'}
                </button>
              )}
            </form>
            <p className="contact-watermark">
              Powered by{' '}
              <a href="https://localhost314.com" target="_blank" rel="noopener noreferrer">Localhost:314</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
