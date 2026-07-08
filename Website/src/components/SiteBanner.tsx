import { useEffect, useRef, useState } from 'react';

interface Banner { message: string; type: 'info' | 'warning' | 'success'; linkUrl?: string; linkText?: string; }

const DISMISS_KEY = 'banner-dismissed';
const CSS_VAR = '--banner-h';

export default function SiteBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/banner')
      .then(r => r.json())
      .then((data: Banner | null) => {
        if (!data?.message) return;
        if (sessionStorage.getItem(DISMISS_KEY) === data.message) return;
        setBanner(data);
        setVisible(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!visible || !ref.current) {
      document.documentElement.style.removeProperty(CSS_VAR);
      return;
    }
    const ro = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty(CSS_VAR, `${entry.contentRect.height}px`);
    });
    ro.observe(ref.current);
    return () => { ro.disconnect(); document.documentElement.style.removeProperty(CSS_VAR); };
  }, [visible]);

  function dismiss() {
    if (banner) sessionStorage.setItem(DISMISS_KEY, banner.message);
    setVisible(false);
  }

  if (!visible || !banner) return null;

  return (
    <div ref={ref} className={`site-banner site-banner--${banner.type}`}>
      <span className="site-banner-msg">
        {banner.message}
        {banner.linkUrl && (
          <a href={banner.linkUrl} className="site-banner-link" target="_blank" rel="noopener noreferrer">
            {banner.linkText || 'Learn more'}
          </a>
        )}
      </span>
      <button className="site-banner-close" onClick={dismiss} aria-label="Dismiss">✕</button>
    </div>
  );
}
