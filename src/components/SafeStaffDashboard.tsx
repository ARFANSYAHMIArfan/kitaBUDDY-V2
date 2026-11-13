import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, FileText, Image as ImageIcon, Mic, Video, ExternalLink, Save, ShieldAlert, LockKeyhole, Search, ListFilter } from 'lucide-react';
import { auth } from '../services/firebase';

type SafeReport = {
  reference: string;
  reportType: 'text' | 'photo' | 'audio' | 'video';
  category: string;
  description: string;
  incidentDate?: string | null;
  location?: string;
  urgent: boolean;
  status: string;
  publicUpdate?: string;
  hasMedia: boolean;
  mediaMimeType?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

const API_BASE = (import.meta.env.VITE_REPORT_API_URL || '').trim().replace(/\/$/, '');
const STATUS_OPTIONS = ['Diterima', 'Dalam Semakan', 'Tindakan Susulan', 'Ditutup'];

const categoryLabel: Record<string, string> = {
  physical: 'Buli fizikal', verbal: 'Buli lisan', social: 'Buli sosial', cyber: 'Buli siber', other: 'Lain-lain',
};
const typeLabel: Record<string, string> = { text: 'Teks', photo: 'Foto', audio: 'Audio', video: 'Video' };

export const SafeStaffDashboard: React.FC = () => {
  const [reports, setReports] = useState<SafeReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, { status: string; publicUpdate: string }>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  const getToken = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) return await currentUser.getIdToken();
    } catch {}
    try {
      const stored = localStorage.getItem('kitabuddy_active_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        return `demo-token-${parsed.role || 'staff'}-${parsed.id || 'user'}`;
      }
    } catch {}
    return 'demo-token-admin';
  }, []);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const url = API_BASE ? `${API_BASE}/api/admin/reports` : '/api/admin/reports';
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Tidak dapat memuatkan senarai laporan.');
      const rows = Array.isArray(data.reports) ? data.reports as SafeReport[] : [];
      setReports(rows);
      setStatusDrafts(Object.fromEntries(rows.map(r => [r.reference, { status: r.status, publicUpdate: r.publicUpdate || '' }])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ralat memuatkan laporan SAFE.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { void loadReports(); }, [loadReports]);

  const updateStatus = async (report: SafeReport) => {
    const draft = statusDrafts[report.reference];
    if (!draft) return;
    setSaving(report.reference);
    setError('');
    try {
      const token = await getToken();
      const url = API_BASE
        ? `${API_BASE}/api/admin/reports/${encodeURIComponent(report.reference)}/status`
        : `/api/admin/reports/${encodeURIComponent(report.reference)}/status`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Status tidak dapat dikemas kini.');
      setReports(prev => prev.map(r => r.reference === report.reference ? { ...r, status: data.status, publicUpdate: data.publicUpdate } : r));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ralat mengemas kini status.');
    } finally {
      setSaving(null);
    }
  };

  const filteredReports = reports.filter(report => {
    const term = searchTerm.trim().toLocaleLowerCase();
    const matchesSearch = !term || [report.reference, report.category, report.description, report.location || ''].some(value => value.toLocaleLowerCase().includes(term));
    return matchesSearch && (statusFilter === 'Semua' || report.status === statusFilter);
  });
  const urgentCount = reports.filter(report => report.urgent).length;
  const openCount = reports.filter(report => report.status !== 'Ditutup').length;

  const openEvidence = async (report: SafeReport) => {
    setError('');
    try {
      const token = await getToken();
      const url = API_BASE
        ? `${API_BASE}/api/admin/reports/${encodeURIComponent(report.reference)}/evidence`
        : `/api/admin/reports/${encodeURIComponent(report.reference)}/evidence`;
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) throw new Error(data.message || 'Bukti tidak dapat dibuka.');
      const anchor = document.createElement('a');
      anchor.href = data.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.click();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ralat membuka bukti.');
    }
  };

  return (
    <section className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h3 className="text-2xl font-black text-[#3D405B] font-fredoka">SAFE · Pengurusan Laporan</h3><p className="mt-1 text-sm text-slate-500">Rekod SAFE v2. Akses kepada kes dikawal semula oleh API server.</p></div>
        <button onClick={() => void loadReports()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3D405B] px-4 py-2.5 text-white font-bold disabled:opacity-60"><RefreshCw size={17} className={loading ? 'animate-spin' : ''}/> Muat semula</button>
      </div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 text-amber-900"><LockKeyhole size={20} className="shrink-0 mt-0.5"/><p className="text-sm leading-relaxed">Paparan ini hanya memuatkan data jika akaun Firebase mempunyai role server-side yang dibenarkan atau e-melnya berada dalam allowlist API. Jangan kongsi paparan kes atau bukti di luar petugas yang diberi kuasa.</p></div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex gap-2 text-sm text-red-800"><AlertTriangle size={18} className="shrink-0"/>{error}</div>}
      {!loading && !error && <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-stone-100 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Jumlah laporan</p><p className="mt-1 text-2xl font-black text-[#3D405B]">{reports.length}</p></div>
        <div className="rounded-2xl border border-stone-100 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Belum ditutup</p><p className="mt-1 text-2xl font-black text-[#3D405B]">{openCount}</p></div>
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-red-700">Perlu semakan segera</p><p className="mt-1 text-2xl font-black text-red-700">{urgentCount}</p></div>
      </div>}
      {!loading && !error && reports.length > 0 && <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
        <label className="relative block"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><span className="sr-only">Cari laporan</span><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Cari rujukan, kategori, lokasi atau kata kunci..." className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-[#81B29A]"/></label>
        <label className="relative block"><ListFilter size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><span className="sr-only">Tapis status</span><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full appearance-none rounded-xl border border-stone-200 bg-white py-3 pl-10 pr-3 text-sm"><option value="Semua">Semua status</option>{STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}</select></label>
      </div>}
      {loading && <div className="bg-white rounded-2xl border border-stone-100 p-8 text-center text-slate-500"><RefreshCw size={22} className="animate-spin mx-auto mb-2"/>Memuatkan laporan SAFE...</div>}
      {!loading && !error && reports.length === 0 && <div className="bg-white rounded-2xl border border-stone-100 p-8 text-center text-slate-500"><FileText size={32} className="mx-auto mb-2 text-slate-300"/>Tiada laporan SAFE v2 ditemui.</div>}
      {!loading && !error && reports.length > 0 && filteredReports.length === 0 && <div className="bg-white rounded-2xl border border-stone-100 p-8 text-center text-slate-500">Tiada laporan sepadan dengan carian atau penapis ini.</div>}
      <div className="space-y-4">
        {filteredReports.map(report => {
          const draft = statusDrafts[report.reference] || { status: report.status, publicUpdate: report.publicUpdate || '' };
          const MediaIcon = report.reportType === 'photo' ? ImageIcon : report.reportType === 'audio' ? Mic : report.reportType === 'video' ? Video : FileText;
          return <article key={report.reference} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <button onClick={() => setExpanded(expanded === report.reference ? null : report.reference)} className="w-full text-left p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3 hover:bg-stone-50">
              <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${report.urgent ? 'bg-red-100 text-red-600' : 'bg-[#EAF3EE] text-[#527F6B]'}`}>{report.urgent ? <ShieldAlert size={22}/> : <MediaIcon size={22}/>}</div>
              <div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-black text-[#3D405B]">{report.reference}</span>{report.urgent && <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[11px] font-black">Risiko segera</span>}</div><p className="text-sm text-slate-600 mt-1">{categoryLabel[report.category] || report.category} · {typeLabel[report.reportType] || report.reportType} · {report.createdAt ? new Date(report.createdAt).toLocaleString('ms-MY') : 'Masa tidak tersedia'}</p></div>
              <div className="flex items-center gap-2"><span className="rounded-full bg-stone-100 text-slate-700 px-3 py-1 text-xs font-bold">{report.status}</span><span className="text-slate-400">{expanded === report.reference ? '−' : '+'}</span></div>
            </button>
            {expanded === report.reference && <div className="border-t border-stone-100 p-4 md:p-5 space-y-4">
              <div className="rounded-xl bg-[#FDFBF7] p-4"><p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2">Keterangan laporan</p><p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{report.description || 'Tiada keterangan teks.'}</p>{report.incidentDate && <p className="mt-3 text-xs text-slate-500">Tarikh kejadian: {report.incidentDate}</p>}{report.location && <p className="text-xs text-slate-500">Lokasi umum: {report.location}</p>}</div>
              {report.hasMedia && <button onClick={() => void openEvidence(report)} className="inline-flex items-center gap-2 rounded-xl border border-[#81B29A] px-4 py-2.5 text-sm font-bold text-[#527F6B] hover:bg-[#EAF3EE]"><ExternalLink size={16}/> Buka bukti (akses sementara 5 minit)</button>}
              <div className="grid md:grid-cols-2 gap-4"><label className="block"><span className="block mb-2 text-sm font-bold">Status kes</span><select value={draft.status} onChange={e => setStatusDrafts(prev => ({ ...prev, [report.reference]: { ...draft, status: e.target.value } }))} className="w-full rounded-xl border border-stone-200 p-3 bg-white">{STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}</select></label><label className="block"><span className="block mb-2 text-sm font-bold">Makluman selamat kepada pelapor</span><textarea rows={3} maxLength={500} value={draft.publicUpdate} onChange={e => setStatusDrafts(prev => ({ ...prev, [report.reference]: { ...draft, publicUpdate: e.target.value } }))} placeholder="Makluman ringkas tanpa butiran sensitif" className="w-full rounded-xl border border-stone-200 p-3 bg-white"/></label></div>
              <button onClick={() => void updateStatus(report)} disabled={saving === report.reference} className="inline-flex items-center gap-2 rounded-xl bg-[#3D405B] px-4 py-2.5 text-white font-bold text-sm disabled:opacity-50"><Save size={16}/>{saving === report.reference ? 'Menyimpan...' : 'Simpan perubahan'}</button>
            </div>}
          </article>;
        })}
      </div>
    </section>
  );
};
