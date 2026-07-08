import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './index.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SiteBanner from './components/SiteBanner';
import DownloadModal from './components/DownloadModal';
import { DownloadProvider } from './contexts/DownloadContext';
import Home from './pages/Home';
import MainApp from './pages/MainApp';
import LiteApp from './pages/LiteApp';
import Features from './pages/Features';
import Download from './pages/Download';
import MainDownload from './pages/MainDownload';
import LiteDownload from './pages/LiteDownload';
import Contact from './pages/Contact';
import TOS from './pages/TOS';
import Privacy from './pages/Privacy';
import License from './pages/License';
import About from './pages/About';
import Admin from './pages/Admin';
import Articles from './pages/Articles';
import Article from './pages/Article';
import DirectDownload from './pages/DirectDownload';
import LiteDirectDownload from './pages/LiteDirectDownload';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function RouteTheme() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname.startsWith('/lite')) {
      document.body.classList.add('theme-lite');
    } else {
      document.body.classList.remove('theme-lite');
    }
    return () => document.body.classList.remove('theme-lite');
  }, [pathname]);
  return null;
}

function AppShell({ dlOpen, dlHint, dlStartQuiz, openDl, openQuiz, onClose }: {
  dlOpen: boolean; dlHint: 'main' | 'lite' | undefined; dlStartQuiz: boolean;
  openDl: (h?: 'main' | 'lite') => void; openQuiz: () => void; onClose: () => void;
}) {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <DownloadProvider onOpen={openDl} onOpenQuiz={openQuiz}>
      <ScrollToTop />
      <RouteTheme />
      {!isAdmin && <SiteBanner />}
      {!isAdmin && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/main" element={<MainApp />} />
          <Route path="/main/features" element={<Features />} />
          <Route path="/main/download" element={<MainDownload />} />
          <Route path="/lite" element={<LiteApp />} />
          <Route path="/lite/features" element={<LiteApp />} />
          <Route path="/lite/download" element={<LiteDownload />} />
          <Route path="/download" element={<Navigate to="/" replace />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/tos" element={<TOS />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/license" element={<License />} />
          <Route path="/about" element={<About />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/articles/:slug" element={<Article />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/main/download/direct" element={<DirectDownload />} />
          <Route path="/lite/download/direct" element={<LiteDirectDownload />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && (
        <DownloadModal open={dlOpen} hint={dlHint} startQuiz={dlStartQuiz} onClose={onClose} />
      )}
    </DownloadProvider>
  );
}

export default function App() {
  const [dlOpen, setDlOpen] = useState(false);
  const [dlHint, setDlHint] = useState<'main' | 'lite' | undefined>(undefined);
  const [dlStartQuiz, setDlStartQuiz] = useState(false);

  function openDl(hint?: 'main' | 'lite') { setDlHint(hint); setDlStartQuiz(false); setDlOpen(true); }
  function openQuiz() { setDlHint(undefined); setDlStartQuiz(true); setDlOpen(true); }

  return (
    <BrowserRouter>
      <AppShell
        dlOpen={dlOpen} dlHint={dlHint} dlStartQuiz={dlStartQuiz}
        openDl={openDl} openQuiz={openQuiz} onClose={() => setDlOpen(false)}
      />
    </BrowserRouter>
  );
}
