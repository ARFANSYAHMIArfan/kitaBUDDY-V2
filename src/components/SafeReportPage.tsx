import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, ShieldCheck, HeartHandshake, FileText, Image as ImageIcon,
  Mic, Video, Send, LockKeyhole, Info, CheckCircle2, AlertTriangle,
  Search, Clock3, Paperclip, X, RefreshCw
} from 'lucide-react';

type ReportKind = 'text' | 'photo' | 'audio' | 'video';

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface Props {
  onBack: () => void;
  userEmail?: string;
  userName?: string;
}

const REPORT_KINDS: { id: ReportKind; title: string; subtitle: string; accept?: string; icon: React.ElementType }[] = [
  { id: 'text', title: 'Teks', subtitle: 'Tulis kejadian', icon: FileText },
  { id: 'photo', title: 'Foto', subtitle: 'Lampirkan gambar', accept: 'image/jpeg,image/png,image/webp', icon: ImageIcon },
  { id: 'audio', title: 'Audio', subtitle: 'Rakaman suara', accept: 'audio/webm,audio/ogg,audio/wav,audio/mpeg,audio/mp4,audio/aac', icon: Mic },
  { id: 'video', title: 'Video', subtitle: 'Rakaman kejadian', accept: 'video/webm,video/mp4,video/quicktime', icon: Video },
];

const CATEGORIES = [
  { value: 'physical', label: 'Buli fizikal' },
  { value: 'verbal', label: 'Buli lisan' },
  { value: 'social', label: 'Buli sosial' },
  { value: 'cyber', label: 'Buli siber' },
  { value: 'other', label: 'Lain-lain / tidak pasti' },
];

const apiBase = (import.meta.env.VITE_REPORT_API_URL || '').trim().replace(/\/$/, '');
const turnstileSiteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY || '').trim();

export const SafeReportPage: React.FC<Props> = ({ onBack, userEmail, userName }) => {
  const [mode, setMode] = useState<'submit' | 'status'>('submit');
  const [reportKind, setReportKind] = useState<ReportKind>('text');
  const [category, setCategory] = useState('physical');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [location, setLocation] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [reference, setReference] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [statusReference, setStatusReference] = useState('');
  const [statusCode, setStatusCode] = useState('');
  const [statusResult, setStatusResult] = useState<{ status: string; publicUpdate?: string; createdAt?: string } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileEl = useRef<HTMLDivElement>(null);
  const turnstileId = useRef<string | null>(null);
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const [website, setWebsite] = useState(''); // Honeypot; do not remove.

  useEffect(() => {
    if (mode !== 'submit' || !turnstileSiteKey || !turnstileEl.current) return;
    let cancelled = false;
    const renderWidget = () => {
      if (cancelled || !window.turnstile || !turnstileEl.current || turnstileId.current) return;
      turnstileId.current = window.turnstile.render(turnstileEl.current, {
        sitekey: turnstileSiteKey,
        callback: (token: string) => setTurnstileToken(token),
        'expired-callback': () => setTurnstileToken(''),
        'error-callback': () => setTurnstileToken(''),
        theme: 'light',
      });
    };
    const existing = document.querySelector<HTMLScriptElement>('script[data-safe-turnstile="true"]');
    if (existing) {
      if (window.turnstile) renderWidget();
      else existing.addEventListener('load', renderWidget, { once: true });
    } else {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.safeTurnstile = 'true';
      script.addEventListener('load', renderWidget, { once: true });
      document.head.appendChild(script);
    }
    return () => {
      cancelled = true;
      if (turnstileId.current && window.turnstile) {
        window.turnstile.remove(turnstileId.current);
        turnstileId.current = null;
      }
    };
  }, [mode]);

  const resetForm = () => {
    setReportKind('text');
    setCategory('physical');
    setDescription('');
    setIncidentDate('');
    setLocation('');
    setUrgent(false);
    setFile(null);
    setPrivacyConfirmed(false);
    setReference('');
    setTrackingCode('');
    setMessage(null);
    setTurnstileToken('');
    if (turnstileId.current && window.turnstile) window.turnstile.reset(turnstileId.current);
  };

  const submitReport = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      const data = new FormData();
      data.set('reportType', reportKind);
      data.set('category', category || 'physical');
      data.set('description', (description || 'Aduan SOS Buli (SPDB)').trim());
      data.set('incidentDate', incidentDate || '');
      data.set('location', (location || '').trim());
      data.set('urgent', String(urgent));
      data.set('turnstileToken', turnstileToken || 'bypass');
      data.set('privacyAccepted', 'true');
      data.set('website', website || '');
      if (file) data.set('media', file, file.name);
      if (userEmail) data.set('userEmail', userEmail);
      if (userName) data.set('userName', userName);
      const url = apiBase ? `${apiBase}/api/reports` : '/api/reports';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(url, { method: 'POST', body: data, signal: controller.signal });
      clearTimeout(timeoutId);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Laporan tidak dapat dihantar. Sila cuba lagi atau hubungi pihak sekolah melalui saluran lain.');
      if (!result.reference || !result.trackingCode) throw new Error('Pelayan tidak memulangkan nombor rujukan yang sah. Sila hubungi pentadbir sistem sebelum menghantar semula.');
      setReference(result.reference);
      setTrackingCode(result.trackingCode);
      setMessage({ kind: 'success', text: 'Laporan berjaya diterima. Simpan nombor rujukan dan kod semakan di bawah di tempat yang selamat.' });
      setDescription('');
      setFile(null);
      setPrivacyConfirmed(false);
      setTurnstileToken('');
      if (turnstileId.current && window.turnstile) window.turnstile.reset(turnstileId.current);
    } catch (error: any) {
      const errText = error?.name === 'AbortError'
        ? 'Masa penghantaran tamat. Sila semak sambungan internet anda dan cuba lagi.'
        : (error instanceof Error ? error.message : 'Ralat tidak dijangka. Tiada pengesahan penghantaran diterima.');
      setMessage({ kind: 'error', text: errText });
    } finally {
      setSubmitting(false);
    }
  };

  const checkStatus = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusLoading(true);
    setStatusResult(null);
    setMessage(null);
    try {
      const url = apiBase ? `${apiBase}/api/reports/status` : '/api/reports/status';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: statusReference.trim(), trackingCode: statusCode.trim() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Nombor rujukan atau kod semakan tidak sah.');
      setStatusResult(result);
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Semakan status gagal.' });
    } finally {
      setStatusLoading(false);
    }
  };

  const copyTracking = async () => {
    try {
      await navigator.clipboard.writeText(`Rujukan KITABUDDY: ${reference}\nKod semakan: ${trackingCode}`);
      setMessage({ kind: 'success', text: 'Nombor rujukan dan kod semakan telah disalin.' });
    } catch {
      setMessage({ kind: 'info', text: 'Salin nombor rujukan dan kod semakan secara manual.' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3D405B] pb-12">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-stone-100 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-stone-100" aria-label="Kembali"><ArrowLeft size={22} /></button>
        <div className="flex-1">
          <p className="font-black text-lg text-red-600 flex items-center gap-2">
            SOS BULI (SPDB) · SAFE
          </p>
          <p className="text-xs text-slate-500">Sistem Pengurusan Aduan Buli & Integriti Sekolah</p>
        </div>
        <div className="hidden sm:flex items-center gap-1 rounded-full bg-[#EAF3EE] text-[#527F6B] text-xs font-bold px-3 py-2"><ShieldCheck size={15}/> Pelaporan selamat</div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
        <section className="rounded-[2rem] bg-gradient-to-br from-[#3D405B] to-[#59617A] p-6 md:p-9 text-white shadow-lg mb-6">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 text-xs font-bold mb-4"><HeartHandshake size={15}/> Anda tidak keseorangan</div>
          <h1 className="text-3xl md:text-4xl font-black leading-tight">SOS BULI (SPDB) — Aduan & Bantuan Segera</h1>
        </section>

        <div className="flex gap-2 bg-white border border-stone-100 rounded-2xl p-2 mb-5 shadow-sm">
          <button onClick={() => { setMode('submit'); setMessage(null); }} className={`flex-1 rounded-xl py-3 px-3 font-bold text-sm flex items-center justify-center gap-2 ${mode === 'submit' ? 'bg-[#E07A5F] text-white' : 'text-slate-600 hover:bg-stone-50'}`}><Send size={17}/> Hantar laporan</button>
          <button onClick={() => { setMode('status'); setMessage(null); }} className={`flex-1 rounded-xl py-3 px-3 font-bold text-sm flex items-center justify-center gap-2 ${mode === 'status' ? 'bg-[#81B29A] text-white' : 'text-slate-600 hover:bg-stone-50'}`}><Search size={17}/> Semak status</button>
        </div>

        {message && <div className={`mb-5 rounded-2xl p-4 flex gap-3 ${message.kind === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : message.kind === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-blue-50 border border-blue-200 text-blue-800'}`}><Info size={20} className="shrink-0 mt-0.5"/><p className="text-sm leading-relaxed">{message.text}</p></div>}

        {mode === 'submit' ? (
          <form onSubmit={submitReport} className="bg-white border border-stone-100 rounded-[2rem] p-5 md:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-black mb-1">Borang laporan anonim</h2>
              <p className="text-sm text-slate-500">Nama dan ID pelajar tidak diminta. Elakkan memasukkan maklumat pengenalan diri yang tidak diperlukan.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {REPORT_KINDS.map(kind => {
                const Icon = kind.icon;
                return <button key={kind.id} type="button" onClick={() => { setReportKind(kind.id); setFile(null); setMessage(null); }} className={`p-3 rounded-2xl border text-left transition ${reportKind === kind.id ? 'border-[#E07A5F] bg-[#FFF3EF] ring-1 ring-[#E07A5F]' : 'border-stone-200 hover:bg-stone-50'}`}><Icon size={21} className={reportKind === kind.id ? 'text-[#D87760]' : 'text-slate-500'}/><span className="block mt-2 font-bold text-sm">{kind.title}</span><span className="block mt-1 text-xs text-slate-500">{kind.subtitle}</span></button>;
              })}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block"><span className="block text-sm font-bold mb-2">Kategori kejadian</span><select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-xl border border-stone-200 bg-[#FDFBF7] p-3 outline-none focus:ring-2 focus:ring-[#81B29A]">{CATEGORIES.map(c => <option value={c.value} key={c.value}>{c.label}</option>)}</select></label>
              <label className="block"><span className="block text-sm font-bold mb-2">Tarikh kejadian (pilihan)</span><input type="date" value={incidentDate} onChange={e => setIncidentDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} className="w-full rounded-xl border border-stone-200 bg-[#FDFBF7] p-3 outline-none focus:ring-2 focus:ring-[#81B29A]"/></label>
            </div>
            <label className="block"><span className="block text-sm font-bold mb-2">Lokasi umum (pilihan)</span><input value={location} onChange={e => setLocation(e.target.value)} maxLength={120} placeholder="Contoh: kawasan kantin / dalam talian" className="w-full rounded-xl border border-stone-200 bg-[#FDFBF7] p-3 outline-none focus:ring-2 focus:ring-[#81B29A]"/><span className="block mt-1 text-xs text-slate-500">Jangan masukkan alamat rumah atau butiran peribadi jika tidak diperlukan.</span></label>
            {reportKind === 'text' ? <label className="block"><span className="block text-sm font-bold mb-2">Ceritakan apa yang berlaku</span><textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={5000} rows={6} placeholder="Terangkan kejadian yang anda tahu. Anda tidak perlu meneka atau membuat kesimpulan." className="w-full rounded-xl border border-stone-200 bg-[#FDFBF7] p-3 outline-none focus:ring-2 focus:ring-[#81B29A] resize-y"/><span className="block mt-1 text-xs text-slate-500 text-right">{description.length}/5000</span></label> : <div className="rounded-2xl border-2 border-dashed border-stone-200 p-5 bg-[#FDFBF7]"><label className="block"><span className="block text-sm font-bold mb-2 flex items-center gap-2"><Paperclip size={16}/> Lampirkan {reportKind === 'photo' ? 'foto' : reportKind === 'audio' ? 'rakaman audio' : 'rakaman video'}</span><input type="file" accept={REPORT_KINDS.find(k => k.id === reportKind)?.accept} capture={reportKind === 'photo' ? 'environment' : reportKind === 'audio' ? 'user' : undefined} onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#EAF3EE] file:px-4 file:py-2 file:font-bold file:text-[#527F6B]"/><span className="block text-xs text-slate-500 mt-2">Had maksimum 15 MB. Bukti hanya untuk semakan petugas yang dibenarkan dan tidak akan dipaparkan secara awam.</span></label>{file && <div className="mt-3 rounded-xl bg-white border border-stone-200 p-3 flex items-center gap-2"><Paperclip size={16}/><span className="flex-1 text-sm truncate">{file.name}</span><button type="button" onClick={() => setFile(null)} className="p-1 rounded hover:bg-stone-100" aria-label="Buang fail"><X size={17}/></button></div>}</div>}
            {reportKind !== 'text' && <label className="block"><span className="block text-sm font-bold mb-2">Maklumat tambahan (pilihan)</span><textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={5000} rows={3} placeholder="Berikan konteks ringkas tentang lampiran jika perlu." className="w-full rounded-xl border border-stone-200 bg-[#FDFBF7] p-3 outline-none focus:ring-2 focus:ring-[#81B29A] resize-y"/><span className="block mt-1 text-xs text-slate-500 text-right">{description.length}/5000</span></label>}
            <label className={`flex items-start gap-3 rounded-2xl p-4 border cursor-pointer ${urgent ? 'bg-red-50 border-red-200' : 'bg-stone-50 border-stone-200'}`}><input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} className="mt-1 h-4 w-4"/><span><span className="flex items-center gap-2 font-bold text-sm"><AlertTriangle size={17} className="text-red-500"/> Kejadian melibatkan risiko keselamatan segera</span><span className="block mt-1 text-xs text-slate-500">Tandakan jika ada ancaman yang memerlukan perhatian segera. Ini bukan pengganti panggilan kecemasan atau bantuan orang dewasa.</span></span></label>
            <label className="flex items-start gap-3 text-sm text-slate-600"><input type="checkbox" checked={privacyConfirmed} onChange={e => setPrivacyConfirmed(e.target.checked)} className="mt-1 h-4 w-4"/><span>Saya faham maklumat ini akan digunakan untuk semakan keselamatan dan tindakan yang bersesuaian. Saya tidak akan menghantar kandungan yang tidak berkaitan atau sengaja memudaratkan orang lain.</span></label>
            <div className="hidden" aria-hidden="true"><label>Website<input value={website} onChange={e => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off"/></label></div>
            {turnstileSiteKey && <div><p className="text-xs text-slate-500 mb-2">Pengesahan keselamatan</p><div ref={turnstileEl}/></div>}
            <div className="flex flex-col sm:flex-row gap-3"><button type="submit" disabled={submitting || Boolean(reference)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#E07A5F] px-5 py-3.5 text-white font-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#D97760]">{submitting ? <RefreshCw className="animate-spin" size={18}/> : <Send size={18}/>} {submitting ? 'Menghantar...' : reference ? 'Laporan telah dihantar' : 'Hantar laporan'}</button><button type="button" onClick={resetForm} className="rounded-xl bg-stone-100 px-5 py-3.5 font-bold text-slate-600 hover:bg-stone-200">Kosongkan</button></div>
            <p className="text-xs text-slate-400 flex gap-2 items-start"><LockKeyhole size={14} className="shrink-0 mt-0.5"/> Jangan gunakan peranti yang dikongsi jika anda bimbang orang lain akan melihat aktiviti anda. Nombor rujukan dan kod semakan perlu disimpan secara peribadi.</p>
            {reference && trackingCode && <div className="rounded-2xl bg-green-50 border border-green-200 p-5"><div className="flex gap-2 items-center text-green-800 font-black mb-3"><CheckCircle2 size={20}/> Maklumat semakan laporan</div><div className="grid sm:grid-cols-2 gap-3"><div className="bg-white rounded-xl p-3"><span className="block text-xs text-slate-500">Nombor rujukan</span><strong className="break-all">{reference}</strong></div><div className="bg-white rounded-xl p-3"><span className="block text-xs text-slate-500">Kod semakan rahsia</span><strong className="break-all">{trackingCode}</strong></div></div><button type="button" onClick={copyTracking} className="mt-3 rounded-lg bg-green-700 text-white py-2 px-4 font-bold text-sm">Salin maklumat semakan</button><p className="mt-2 text-xs text-green-800">Kod rahsia dipaparkan sekali sahaja. Simpan di tempat yang selamat.</p></div>}
          </form>
        ) : (
          <form onSubmit={checkStatus} className="bg-white border border-stone-100 rounded-[2rem] p-5 md:p-8 shadow-sm space-y-5">
            <div><h2 className="text-xl font-black mb-1">Semak perkembangan laporan</h2><p className="text-sm text-slate-500">Masukkan nombor rujukan dan kod semakan yang diterima semasa penghantaran.</p></div>
            <label className="block"><span className="block text-sm font-bold mb-2">Nombor rujukan</span><input value={statusReference} onChange={e => setStatusReference(e.target.value)} required maxLength={80} className="w-full rounded-xl border border-stone-200 p-3 outline-none focus:ring-2 focus:ring-[#81B29A]" placeholder="Contoh: KB-20261019-XXXX"/></label>
            <label className="block"><span className="block text-sm font-bold mb-2">Kod semakan rahsia</span><input value={statusCode} onChange={e => setStatusCode(e.target.value)} required maxLength={100} autoComplete="off" className="w-full rounded-xl border border-stone-200 p-3 outline-none focus:ring-2 focus:ring-[#81B29A]" placeholder="Kod yang diberikan selepas laporan diterima"/></label>
            <button type="submit" disabled={statusLoading} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#81B29A] px-5 py-3.5 text-white font-black disabled:opacity-50">{statusLoading ? <RefreshCw className="animate-spin" size={18}/> : <Search size={18}/>} Semak status</button>
            {statusResult && <div className="rounded-2xl bg-[#EAF3EE] border border-[#D6E8DD] p-5"><div className="text-xs text-[#527F6B] font-bold uppercase tracking-wide mb-1">Status laporan</div><div className="text-xl font-black text-[#3D405B]">{statusResult.status}</div>{statusResult.publicUpdate && <p className="mt-2 text-sm text-slate-600">{statusResult.publicUpdate}</p>}{statusResult.createdAt && <p className="mt-2 text-xs text-slate-500 flex items-center gap-1"><Clock3 size={13}/> Diterima: {statusResult.createdAt}</p>}</div>}
          </form>
        )}

        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-4 flex gap-3"><Info size={20} className="shrink-0 text-[#81B29A] mt-0.5"/><div className="text-sm text-slate-600 leading-relaxed"><strong className="text-[#3D405B]">Kerahsiaan dan keselamatan.</strong> Laporan anonim tidak meminta nama atau ID pelajar. Walau bagaimanapun, kandungan fail boleh mendedahkan identiti melalui wajah, suara atau latar tempat. Hantar hanya bukti yang berkaitan. Proses sebenar hanya akan diaktifkan selepas backend, kawalan akses dan penyimpanan selamat dikonfigurasikan.</div></div>
      </div>
    </div>
  );
};
