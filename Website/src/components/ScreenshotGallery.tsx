import { useState, useEffect, useCallback } from 'react';

export interface GalleryCategory {
  id: string;
  label: string;
  shots: string[];
}

interface Props {
  categories: GalleryCategory[];
  accentColor?: string;
}

function imgUrl(path: string) {
  return `/screenshots/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export default function ScreenshotGallery({ categories, accentColor = 'var(--accent)' }: Props) {
  const [activeTab, setActiveTab] = useState(categories[0]?.id ?? '');
  const [lightbox, setLightbox] = useState<{ shots: string[]; index: number } | null>(null);

  const activeShots = categories.find(c => c.id === activeTab)?.shots ?? [];

  const openLightbox = (index: number) => setLightbox({ shots: activeShots, index });

  const closeLightbox = useCallback(() => setLightbox(null), []);

  const prev = useCallback(() => {
    setLightbox(lb => lb && { ...lb, index: (lb.index - 1 + lb.shots.length) % lb.shots.length });
  }, []);

  const next = useCallback(() => {
    setLightbox(lb => lb && { ...lb, index: (lb.index + 1) % lb.shots.length });
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, closeLightbox, prev, next]);

  return (
    <div className="sg-root">
      {/* Category tabs */}
      <div className="sg-tabs">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`sg-tab${activeTab === cat.id ? ' sg-tab--active' : ''}`}
            style={activeTab === cat.id ? { borderColor: accentColor, color: accentColor } as React.CSSProperties : undefined}
            onClick={() => setActiveTab(cat.id)}
          >
            {cat.label}
            <span className="sg-count">{cat.shots.length}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="sg-grid">
        {activeShots.map((shot, i) => (
          <button key={shot} className="sg-thumb" onClick={() => openLightbox(i)}>
            <img src={imgUrl(shot)} alt="" loading="lazy" />
            <div className="sg-thumb-overlay">
              <span className="sg-thumb-icon">⤢</span>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="sg-lightbox" onClick={closeLightbox}>
          <button className="sg-lb-close" onClick={closeLightbox} aria-label="Close">✕</button>

          {lightbox.shots.length > 1 && (
            <button
              className="sg-lb-arrow sg-lb-arrow--left"
              onClick={e => { e.stopPropagation(); prev(); }}
              aria-label="Previous"
            >
              ‹
            </button>
          )}

          <img
            className="sg-lb-img"
            src={imgUrl(lightbox.shots[lightbox.index])}
            alt=""
            onClick={e => e.stopPropagation()}
          />

          {lightbox.shots.length > 1 && (
            <button
              className="sg-lb-arrow sg-lb-arrow--right"
              onClick={e => { e.stopPropagation(); next(); }}
              aria-label="Next"
            >
              ›
            </button>
          )}

          <div className="sg-lb-counter">
            {lightbox.index + 1} / {lightbox.shots.length}
          </div>
        </div>
      )}
    </div>
  );
}
