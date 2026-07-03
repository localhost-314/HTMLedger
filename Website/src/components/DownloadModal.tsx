import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const QUIZ = [
  {
    q: 'What best describes your project?',
    a: { lite: 'A few HTML / CSS pages', main: 'Multi-file project with JS, TS, or frameworks' },
  },
  {
    q: 'Which tools do you need beyond editing?',
    a: { lite: 'Just editing, preview, and file management', main: 'Snippets, DMARC analysis, advanced search' },
  },
  {
    q: 'How important is startup speed?',
    a: { lite: 'Blazing fast — I open the editor constantly', main: 'Fine either way — I want all the features' },
  },
];

type Mode = 'pick' | 'quiz' | 'result';

export default function DownloadModal({ open, hint, startQuiz, onClose }: {
  open: boolean;
  hint?: 'main' | 'lite';
  startQuiz?: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('pick');
  const [step, setStep] = useState(0);
  const [votes, setVotes] = useState<('lite' | 'main')[]>([]);

  useEffect(() => {
    if (open) { setMode(startQuiz ? 'quiz' : 'pick'); setStep(0); setVotes([]); }
  }, [open, startQuiz]);

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, close]);

  if (!open) return null;

  function answer(pick: 'lite' | 'main') {
    const next = [...votes, pick];
    setVotes(next);
    if (step + 1 < QUIZ.length) {
      setStep(s => s + 1);
    } else {
      setMode('result');
    }
  }

  const recommendation = votes.filter(v => v === 'main').length >= 2 ? 'main' : 'lite';

  return (
    <div className="dlm-backdrop" onClick={close}>
      <div className="dlm-panel" onClick={e => e.stopPropagation()}>
        <button className="dlm-close" onClick={close} aria-label="Close">✕</button>

        {/* ── Version Picker ── */}
        {mode === 'pick' && (
          <>
            <div className="dlm-header">
              <h2 className="dlm-title">Choose your edition</h2>
              <p className="dlm-sub">Both free. Both offline. Zero telemetry.</p>
            </div>
            <div className="dlm-cards">
              {/* Full */}
              <div className={`dlm-card${hint === 'main' ? ' dlm-card--hint' : ''}`}>
                <div className="dlm-card-badge">Full</div>
                <div className="dlm-card-name">HTMLedger</div>
                <div className="dlm-card-engine">Monaco Engine · VS Code's core</div>
                <ul className="dlm-card-feats">
                  <li>✓ Snippet library (16 built-in)</li>
                  <li>✓ DMARC aggregate report viewer</li>
                  <li>✓ Find in folder (grep-style search)</li>
                  <li>✓ Full Monaco editing power</li>
                  <li>✓ Workspace backup &amp; restore</li>
                </ul>
                <div className="dlm-card-size">~150 MB · NSIS installer</div>
                <button className="btn btn-primary" onClick={() => { close(); navigate('/main/download'); }}>
                  ↓ Download HTMLedger
                </button>
                <a href="/main" className="dlm-card-learn" onClick={close}>
                  Learn more →
                </a>
              </div>

              <div className="dlm-or">or</div>

              {/* Lite */}
              <div className={`dlm-card dlm-card--lite${hint === 'lite' ? ' dlm-card--hint' : ''}`}>
                <div className="dlm-card-badge dlm-card-badge--lite">Lite</div>
                <div className="dlm-card-name">HTMLedger Lite</div>
                <div className="dlm-card-engine">CodeMirror 6 · ultralight</div>
                <ul className="dlm-card-feats">
                  <li>✓ 11 file types with syntax highlighting</li>
                  <li>✓ Workspace manager + file search</li>
                  <li>✓ Multi-tab editing</li>
                  <li>✓ Faster startup, smaller footprint</li>
                  <li>✓ All the essentials, nothing wasted</li>
                </ul>
                <div className="dlm-card-size">~25 MB · portable or installer</div>
                <button className="btn dlm-lite-btn" onClick={() => { close(); navigate('/lite/download'); }}>
                  ↓ Download Lite
                </button>
                <a href="/lite" className="dlm-card-learn" onClick={close}>
                  Learn more →
                </a>
              </div>
            </div>

            <button className="dlm-quiz-link" onClick={() => setMode('quiz')}>
              Not sure which is right for you? Take the 1-minute quiz →
            </button>
          </>
        )}

        {/* ── Quiz ── */}
        {mode === 'quiz' && (
          <>
            <div className="dlm-header">
              <div className="dlm-quiz-progress">
                {QUIZ.map((_, i) => (
                  <div key={i} className={`dlm-quiz-dot${i <= step ? ' active' : ''}`} />
                ))}
              </div>
              <h2 className="dlm-title" style={{ marginTop: '1rem' }}>
                {QUIZ[step].q}
              </h2>
            </div>
            <div className="dlm-quiz-choices">
              <button className="dlm-choice" onClick={() => answer('lite')}>
                <span className="dlm-choice-icon">⚡</span>
                <span>{QUIZ[step].a.lite}</span>
              </button>
              <button className="dlm-choice" onClick={() => answer('main')}>
                <span className="dlm-choice-icon">🧰</span>
                <span>{QUIZ[step].a.main}</span>
              </button>
            </div>
            <button className="dlm-quiz-link" onClick={() => setMode('pick')}>
              ← Back to comparison
            </button>
          </>
        )}

        {/* ── Result ── */}
        {mode === 'result' && (
          <>
            <div className="dlm-header">
              <div className="dlm-result-badge">
                {recommendation === 'main' ? '🧰' : '⚡'} Our recommendation
              </div>
              <h2 className="dlm-title" style={{ marginTop: '0.75rem' }}>
                {recommendation === 'main' ? 'HTMLedger' : 'HTMLedger Lite'}
              </h2>
              <p className="dlm-sub">
                {recommendation === 'main'
                  ? 'You\'ll get the most out of the full feature set — Monaco, snippets, DMARC, and more.'
                  : 'Lite is the right fit — fast, focused, and everything you actually need.'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                className={`btn btn-lg${recommendation === 'lite' ? '' : ' btn-primary'}`}
                style={recommendation === 'lite' ? { background: '#818cf8', color: '#fff' } : undefined}
                onClick={() => { close(); navigate(recommendation === 'main' ? '/main/download' : '/lite/download'); }}
              >
                ↓ Download {recommendation === 'main' ? 'HTMLedger' : 'Lite'} Free
              </button>
              <button className="dlm-quiz-link" onClick={() => { setMode('pick'); setStep(0); setVotes([]); }}>
                ← See both versions
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
