import { Link } from 'react-router-dom';

const STL_BANNER = 'https://localhost314.com/st-louis-skyline-banner.jpeg';
const GITHUB_URL = 'https://github.com/localhost-314/HTMLedger';

const OTHER_PROJECTS = [
  {
    name: 'Globe Itinerary',
    url: 'https://globeitinerary.com',
    desc: 'Free and powerful trip itinerary building with AI tools, jet-lag planning, and collaboration.',
  },
  {
    name: 'Order Dispatchy',
    url: 'https://orderdispatchy.com',
    desc: 'Online ordering systems with Kanban-style overview and driver live GPS tracking for small businesses — without replacing your current driver fleet.',
  },
];

export default function About() {
  return (
    <div className="about-page">

      {/* ── Hero ── */}
      <div className="about-hero">
        <div
          className="about-hero-bg"
          style={{ backgroundImage: `url(${STL_BANNER})` }}
        />
        <div className="about-hero-overlay" />
        <div className="about-hero-content container">
          <img src="/Logos/Traditional Graphic Ledger.png" alt="HTMLedger icon" className="about-hero-icon" />
          <h1 className="about-hero-title">About HTMLedger</h1>
          <p className="about-hero-sub">A free, open-source project from St. Louis, Missouri</p>
          <div className="about-hero-pills">
            <span className="about-hero-pill">🔓 Always free</span>
            <span className="about-hero-pill">🔒 Zero telemetry</span>
            <span className="about-hero-pill">📍 St. Louis, MO</span>
          </div>
        </div>
      </div>

      {/* ── The Project ── */}
      <section className="about-section">
        <div className="container about-prose">
          <span className="about-section-label">The Project</span>
          <h2 className="about-section-title">Built for people who work with HTML every day</h2>
          <p>
            HTMLedger is a free, open-source desktop editor for Windows built for people who work
            with HTML, CSS, JavaScript, and related file types every day. It comes in two editions —
            the full Monaco-powered HTMLedger and the ultralight HTMLedger Lite — so you can pick
            exactly what you need, nothing more.
          </p>
          <p>
            Both editions are completely free, work fully offline, and collect zero telemetry. No
            account, no subscription, no catch.
          </p>
          <div className="about-editions">
            <div className="about-edition-card">
              <img src="/Logos/White Graphic Ledger.png" alt="HTMLedger" className="about-edition-icon" />
              <div>
                <div className="about-edition-name">HTMLedger</div>
                <div className="about-edition-desc">Full Monaco editor — the engine behind VS Code</div>
              </div>
            </div>
            <div className="about-edition-card">
              <img src="/Logos/White Graphic Ledger Lite.png" alt="HTMLedger Lite" className="about-edition-icon" />
              <div>
                <div className="about-edition-name">HTMLedger Lite</div>
                <div className="about-edition-desc">Ultralight CodeMirror 6 — fast, focused, minimal</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Developer ── */}
      <section className="about-section about-section--alt">
        <div className="container about-dev-row">
          <div className="about-dev-logo-wrap">
            <img src="/localhost314 Logo.png" alt="localhost:314" className="about-dev-logo" />
            <div className="about-dev-location">📍 St. Louis, Missouri</div>
          </div>
          <div className="about-dev-text">
            <span className="about-section-label">The Developer</span>
            <h2 className="about-section-title">Built by Tristan A.</h2>
            <p>
              HTMLedger is developed and maintained by <strong>Tristan A.</strong>, a solo developer
              based in St. Louis, Missouri. What began as a love of building things has grown into a
              collection of real, fully-realized products — each one born from tinker projects rather
              than a business plan.
            </p>
            <p>
              Tristan's fascination with computers started young, sparked in large part by his aunt
              Suzy — an IT worker who helped him develop some of his very first projects. These days
              he builds under the{' '}
              <a href="https://localhost314.com" target="_blank" rel="noopener noreferrer">localhost:314</a>{' '}
              name, creating tools he finds genuinely interesting. When not building, he's usually
              eating pizza, listening to Nelly, or spending time with cats.
            </p>
            <a
              href="https://localhost314.com/about"
              target="_blank"
              rel="noopener noreferrer"
              className="about-story-btn"
            >
              Read the full story on localhost:314 →
            </a>
          </div>
        </div>
      </section>

      {/* ── Open Source ── */}
      <section className="about-section">
        <div className="container about-prose">
          <span className="about-section-label">Open Source</span>
          <h2 className="about-section-title">All of it, open.</h2>
          <p>
            HTMLedger is fully open source — including this website. The source code is available on{' '}
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>{' '}
            under the MIT License. You're welcome to read the code, open issues, or suggest improvements.
          </p>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="about-story-btn">
            View on GitHub →
          </a>
        </div>
      </section>

      {/* ── Other Projects ── */}
      <section className="about-section about-section--alt">
        <div className="container">
          <span className="about-section-label">Other Projects</span>
          <h2 className="about-section-title">More from localhost:314</h2>
          <div className="about-projects">
            {OTHER_PROJECTS.map(p => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="about-project-card"
              >
                <span className="about-project-name">{p.name} →</span>
                <span className="about-project-desc">{p.desc}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact strip ── */}
      <section className="about-contact-strip">
        <div className="container about-contact-inner">
          <div className="about-contact-text">
            <h3>Get in touch</h3>
            <p>Questions, feedback, or bug reports? We'd love to hear from you.</p>
          </div>
          <div className="about-contact-links">
            <Link to="/contact" className="about-contact-btn">Contact Form</Link>
            <a href="https://github.com/localhost-314/HTMLedger/issues/new" target="_blank" rel="noopener noreferrer" className="about-contact-btn">Report an Issue</a>
            <a href="mailto:htmledger@localhost314.com" className="about-contact-btn">Email Us</a>
          </div>
        </div>
      </section>

    </div>
  );
}
