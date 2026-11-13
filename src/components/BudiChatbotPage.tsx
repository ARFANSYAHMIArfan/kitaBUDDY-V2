import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, RefreshCw, MessageCircleHeart, ShieldCheck, HeartHandshake } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export const BudiChatbotPage: React.FC<Props> = ({ onBack }) => {
  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const chatbotUrl = 'https://budi-kitabuddy.base44.app';

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey(Date.now());
  };

  const handleOpenExternal = () => {
    const a = document.createElement('a');
    a.href = chatbotUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col animate-fade-in text-[#3D405B]">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2.5 rounded-full hover:bg-stone-100 transition-colors text-[#3D405B]"
            aria-label="Kembali ke Menu"
            title="Kembali"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-[#E07A5F]/10 text-[#E07A5F]">
                <MessageCircleHeart size={18} />
              </span>
              <h1 className="text-base sm:text-lg font-bold font-fredoka text-[#3D405B] leading-tight">
                BUDI: Bantu Untuk Dengar & Intervensi
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-nunito hidden sm:block">
              Chatbot Rakan Dengar & Sokongan Intervensi Anti-Buli
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl text-slate-600 hover:bg-stone-100 transition-colors"
            title="Muat semula Chatbot"
            aria-label="Muat semula"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin text-[#E07A5F]' : ''} />
          </button>
          <button
            onClick={handleOpenExternal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E07A5F] hover:bg-[#d56e54] text-white transition-colors shadow-sm"
            title="Buka dalam tetingkap baru"
          >
            <ExternalLink size={14} />
            <span className="hidden sm:inline">Buka Luar</span>
          </button>
        </div>
      </header>

      {/* Encouragement Sub-banner */}
      <div className="bg-[#81B29A]/10 border-b border-[#81B29A]/20 px-4 py-2 text-xs text-[#3D405B] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <HeartHandshake size={15} className="text-[#81B29A] flex-shrink-0" />
          <span className="truncate">
            Ruang selamat untuk berkongsi, mendengar panduan, dan mencari kekuatan emosi.
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-[#81B29A] flex-shrink-0">
          <ShieldCheck size={14} />
          <span>Sulit & Selamat</span>
        </div>
      </div>

      {/* Main Iframe Viewer */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-2 sm:p-4 flex flex-col">
        <div className="relative flex-1 w-full rounded-2xl md:rounded-3xl overflow-hidden border border-stone-200 bg-white shadow-md flex flex-col min-h-[75vh]">
          {isLoading && (
            <div className="absolute inset-0 bg-[#FDFBF7] flex flex-col items-center justify-center gap-3 z-10 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-[#E07A5F]/10 flex items-center justify-center text-[#E07A5F] animate-pulse">
                <MessageCircleHeart size={32} />
              </div>
              <p className="text-sm font-bold text-[#3D405B] font-fredoka">Memuatkan BUDI Chatbot...</p>
              <p className="text-xs text-slate-400">Menghubungkan ke budi-kitabuddy.base44.app</p>
            </div>
          )}

          <iframe
            key={iframeKey}
            src={chatbotUrl}
            title="BUDI: Bantu Untuk Dengar & Intervensi"
            className="w-full flex-1 border-0 rounded-2xl md:rounded-3xl"
            style={{ minHeight: 'calc(100vh - 180px)', height: '100%' }}
            allow="microphone; camera; clipboard-write; autoplay"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </main>
    </div>
  );
};
