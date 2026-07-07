import { Link } from 'react-router-dom';

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
    <div className="legal-page">
      <div className="container">
        <h1>About</h1>
        <p className="legal-meta">localhost314.com · St. Louis, Missouri</p>

        <h2>The Project</h2>
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

        <h2>The Developer</h2>
        <p>
          HTMLedger is developed and maintained by <strong>Tristan A.</strong>, a solo developer
          based in St. Louis, Missouri. What began as a love of building things has grown into a
          collection of real, fully-realized products, each one born from tinker projects rather
          than a business plan.
        </p>
        <p>
          Tristan's fascination with computers started young, sparked in large part by his aunt
          Suzy: an IT worker who helped him develop some of his very first projects. These days
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
          Read even more on localhost314's story →
        </a>

        <h2>Open Source</h2>
        <p>
          HTMLedger is fully open source — including this website. The source code is available on{' '}
          <a href="https://github.com/localhost-314/HTMLedger" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>{' '}
          under the MIT License. You're welcome to read the code, open issues, or suggest improvements.
        </p>

        <h2>Other Projects</h2>
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

        <h2>Contact</h2>
        <p>Questions, feedback, or bug reports? We'd love to hear from you.</p>
        <ul>
          <li>Online: <Link to="/contact">Contact form</Link></li>
          <li>Email: <a href="mailto:htmledger@localhost314.com">htmledger@localhost314.com</a></li>
          <li>Bugs: <a href="https://github.com/localhost-314/HTMLedger/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a></li>
        </ul>
      </div>
    </div>
  );
}
