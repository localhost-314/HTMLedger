import { useState, type FormEvent } from 'react';

const API = 'https://localhost314.com/api/contact';

interface FormState {
  name: string;
  email: string;
  message: string;
}

const EMPTY: FormState = { name: '', email: '', message: '' };

export default function Contact() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  function change(field: keyof FormState, val: string) {
    setForm(prev => ({ ...prev, [field]: val }));
    setError('');
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, platform: 'HTMLedger' }),
      });
      const data = await res.json() as { success?: boolean; error?: string; code?: number };
      if (data.success) {
        setSuccess(true);
        setForm(EMPTY);
      } else {
        const code = data.code ? ` (${data.code})` : '';
        setError(`Something went wrong${code}. Email us at htmledger@localhost314.com`);
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

          <form className="contact-form" onSubmit={submit} noValidate>
            <div className="form-group">
              <label htmlFor="cf-name">Name</label>
              <input
                id="cf-name"
                type="text"
                className="form-input"
                placeholder="Your name"
                value={form.name}
                onChange={e => change('name', e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="cf-email">Email</label>
              <input
                id="cf-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => change('email', e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="cf-message">Message</label>
              <textarea
                id="cf-message"
                className="form-textarea"
                placeholder="Tell us what's on your mind…"
                value={form.message}
                onChange={e => change('message', e.target.value)}
                disabled={loading}
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            {success ? (
              <div className="form-success">
                ✓ Message sent! We'll be in touch soon.
              </div>
            ) : (
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Send Message'}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
