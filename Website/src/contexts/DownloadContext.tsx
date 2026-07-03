import { createContext, useContext, useState, type ReactNode } from 'react';

type DownloadContextType = {
  open: (hint?: 'main' | 'lite') => void;
  openQuiz: () => void;
};

const DownloadContext = createContext<DownloadContextType | null>(null);

export function useDownloadModal() {
  const ctx = useContext(DownloadContext);
  if (!ctx) throw new Error('useDownloadModal used outside DownloadProvider');
  return ctx;
}

type Props = { children: ReactNode; onOpen: (hint?: 'main' | 'lite') => void; onOpenQuiz: () => void };

export function DownloadProvider({ children, onOpen, onOpenQuiz }: Props) {
  return (
    <DownloadContext.Provider value={{ open: onOpen, openQuiz: onOpenQuiz }}>
      {children}
    </DownloadContext.Provider>
  );
}
