import { useState, useEffect, useRef, type FormEvent } from 'react';

const API = 'https://localhost314.com/api/contact';

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
  subject: string;
  message: string;
}

const EMPTY: FormState = { name: '', email: '', subject: '', message: '' };

export default function Contact() {
  const [form, setForm]       = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');
  const [siteKey, setSiteKey] = useState('');
  const [cfToken, setCfToken] = useState('');
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
        sitekey: siteKey,
        callback:          (t: string) => setCfToken(t),
        'expired-callback':             () => setCfToken(''),
        'error-callback':               () => setCfToken(''),
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
    setCfToken('');
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (siteKey && !cfToken) {
      setError('Please complete the security check.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload: Record<string, string> = {
        name: form.name, email: form.email, message: form.message,
        platform: 'HTMLedger',
      };
      if (form.subject.trim()) payload.subject = form.subject.trim();
      if (cfToken) payload.cfToken = cfToken;

      const res  = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json() as { success?: boolean; code?: number };
      if (data.success) {
        setSuccess(true);
        setForm(EMPTY);
        resetTurnstile();
      } else {
        const code = data.code ? ` (${data.code})` : '';
        setError(`Something went wrong${code}. Email us at htmledger@localhost314.com`);
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
            <span className="section-label">Get in Touch</span>
            <h1>Contact Us</h1>
            <p>
              Have a question, bug report, or feature idea? Fill out the form and
              we'll get back to you as soon as possible.
            </p>
            <div className="contact-detail">
              <span>📧</span>
              <span>htmledger@localhost314.com</span>
            </div>
            <div className="contact-detail" style={{ marginTop: '2rem', flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Response time</span>
              <span>Usually within 24–48 hours</span>
            </div>
          </div>

          <div>
            <form className="contact-form" onSubmit={submit} noValidate>
              <div className="form-group">
                <label htmlFor="cf-name">Name</label>
                <input id="cf-name" type="text" className="form-input" placeholder="Your name"
                  value={form.name} onChange={e => change('name', e.target.value)} disabled={loading} />
              </div>
              <div className="form-group">
                <label htmlFor="cf-email">Email</label>
                <input id="cf-email" type="email" className="form-input" placeholder="you@example.com"
                  value={form.email} onChange={e => change('email', e.target.value)} disabled={loading} />
              </div>
              <div className="form-group">
                <label htmlFor="cf-subject">Subject <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
                <input id="cf-subject" type="text" className="form-input" placeholder="Bug report, feature request, question…"
                  value={form.subject} onChange={e => change('subject', e.target.value)} disabled={loading} />
              </div>
              <div className="form-group">
                <label htmlFor="cf-message">Message</label>
                <textarea id="cf-message" className="form-textarea" placeholder="Tell us what's on your mind…"
                  value={form.message} onChange={e => change('message', e.target.value)} disabled={loading} />
              </div>

              {siteKey && <div ref={tsContainer} style={{ margin: '0.75rem 0' }} />}

              {error && <div className="form-error">{error}</div>}

              {success ? (
                <div className="form-success">✓ Message sent! We'll be in touch soon.</div>
              ) : (
                <button type="submit" className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                  disabled={loading || (!!siteKey && !cfToken)}>
                  {loading ? 'Sending…' : 'Send Message'}
                </button>
              )}
            </form>
            <p className="contact-watermark">
              Powered by{' '}
              <a href="https://localhost314.com" target="_blank" rel="noopener noreferrer">
                Localhost:314
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
