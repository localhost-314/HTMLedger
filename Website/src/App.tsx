import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './index.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
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
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  const [dlOpen, setDlOpen] = useState(false);
  const [dlHint, setDlHint] = useState<'main' | 'lite' | undefined>(undefined);

  function openDl(hint?: 'main' | 'lite') {
    setDlHint(hint);
    setDlOpen(true);
  }

  return (
    <BrowserRouter>
      <DownloadProvider onOpen={openDl}>
        <ScrollToTop />
        <Navbar />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <DownloadModal
          open={dlOpen}
          hint={dlHint}
          onClose={() => setDlOpen(false)}
        />
      </DownloadProvider>
    </BrowserRouter>
  );
}
