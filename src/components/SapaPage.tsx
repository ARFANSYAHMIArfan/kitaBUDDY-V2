import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, RefreshCw, ShieldCheck, FlaskConical } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export const SapaPage: React.FC<Props> = ({ onBack }) => {
  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const sapaUrl = 'https://sapa.kitabuddy.dpdns.org/';

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey(Date.now());
  };

  const handleOpenExternal = () => {
    const a = document.createElement('a');
    a.href = sapaUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  return (
    <div className="h-screen w-full bg-[#FDFBF7] flex flex-col overflow-hidden animate-fade-in text-[#3D405B]">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-stone-200 px-3 sm:px-5 py-2.5 shadow-sm flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-[0.98] transition-all text-[#3D405B] font-bold text-sm inline-flex items-center gap-2 shrink-0 cursor-pointer"
            aria-label="Kembali ke papan pemuka utama"
          >
            <ArrowLeft size={18} />
            <span>Kembali</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-lg bg-[#81B29A]/15 text-[#81B29A] shrink-0 hidden sm:inline-flex">
              <ShieldCheck size={18} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold font-fredoka text-[#3D405B] truncate">
                  S.A.P.A: Suara Anonim, Peduli Anda
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#E07A5F]/15 text-[#E07A5F] border border-[#E07A5F]/25 shrink-0">
                  <FlaskConical size={11} />
                  BETA
                </span>
              </div>
              <p className="text-xs text-slate-500 font-nunito truncate hidden md:block">
                Laporkan kes buli atau dapatkan bantuan segera
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            className="min-h-[44px] px-3 py-2 rounded-xl text-slate-600 hover:bg-stone-100 active:scale-[0.98] transition-all inline-flex items-center gap-1.5 text-xs font-bold whitespace-nowrap cursor-pointer"
            title="Muat semula halaman S.A.P.A"
            aria-label="Muat Semula"
          >
            <RefreshCw size={17} className={isLoading ? 'animate-spin text-[#81B29A]' : ''} />
            <span className="hidden sm:inline">Muat Semula</span>
          </button>
          <button
            type="button"
            onClick={handleOpenExternal}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#E07A5F] hover:bg-[#d56e54] active:scale-[0.98] text-white transition-all shadow-sm whitespace-nowrap cursor-pointer"
            title="Buka dalam tab baru"
            aria-label="Buka Luar"
          >
            <ExternalLink size={15} />
            <span className="hidden sm:inline">Buka Luar</span>
          </button>
        </div>
      </header>

      {/* Full-Screen Borderless Iframe Viewer */}
      <main className="relative flex-1 w-full h-full flex flex-col overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-[#FDFBF7] flex flex-col items-center justify-center gap-3 z-10 animate-fade-in px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#81B29A]/15 flex items-center justify-center text-[#81B29A] animate-pulse">
              <ShieldCheck size={32} />
            </div>
            <p className="text-sm font-bold text-[#3D405B] font-fredoka">
              Memuatkan S.A.P.A...
            </p>
            <p className="text-xs text-slate-400">
              Menghubungkan ke sapa.kitabuddy.dpdns.org
            </p>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={sapaUrl}
          title="S.A.P.A: Suara Anonim, Peduli Anda"
          className="w-full h-full flex-1 border-0 block"
          allow="microphone; camera; clipboard-write; autoplay; geolocation"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          onLoad={() => setIsLoading(false)}
        />
      </main>
    </div>
  );
};
