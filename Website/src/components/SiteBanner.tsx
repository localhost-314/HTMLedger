import { useEffect, useState } from 'react';

interface Banner { message: string; type: 'info' | 'warning' | 'success'; linkUrl?: string; linkText?: string; }

const DISMISS_KEY = 'banner-dismissed';

export default function SiteBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch('/api/banner')
      .then(r => r.json())
      .then((data: Banner | null) => {
        if (!data?.message) return;
        const dismissed = sessionStorage.getItem(DISMISS_KEY);
        if (dismissed === data.message) return;
        setBanner(data);
        setVisible(true);
      })
      .catch(() => {});
  }, []);

  function dismiss() {
    if (banner) sessionStorage.setItem(DISMISS_KEY, banner.message);
    setVisible(false);
  }

  if (!visible || !banner) return null;

  return (
    <div className={`site-banner site-banner--${banner.type}`}>
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
