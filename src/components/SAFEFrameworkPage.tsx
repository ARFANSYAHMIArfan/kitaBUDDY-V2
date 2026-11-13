import React, { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, HeartHandshake, ShieldCheck, Users, ClipboardCheck, BarChart3, ArrowRight, CalendarDays, Plus, CheckCircle2, Download } from 'lucide-react';

interface Props { onBack: () => void; onReport: () => void; }

const pillars = [
  { icon: BookOpen, title: 'Pencegahan', color: 'bg-violet-100 text-violet-700', desc: 'Pendidikan Pencegahan Anti-Buli (PPBA), video kesedaran, cerita interaktif, kuiz dan latihan mengenal pasti situasi buli.' },
  { icon: Users, title: 'Pemerkasaan dan perkembangan', color: 'bg-blue-100 text-blue-700', desc: 'Kemahiran empati, komunikasi berhemah, peranan saksi, kepimpinan rakan sebaya dan pembudayaan sekolah selamat.' },
  { icon: HeartHandshake, title: 'Sokongan dan pemulihan', color: 'bg-rose-100 text-rose-700', desc: 'Sokongan mangsa, bimbingan perubahan tingkah laku pelaku dan susulan bersama kaunselor atau guru yang diberi tanggungjawab.' },
  { icon: ShieldCheck, title: 'Pengurusan dan respons', color: 'bg-emerald-100 text-emerald-700', desc: 'Penilaian risiko, pelaporan yang selamat, pengagihan kes kepada petugas dan tindakan mengikut prosedur sekolah.' },
];

type ProgramActivity = { id: number; title: string; date: string; lead: string; target: string; done: boolean };

export const SAFEFrameworkPage: React.FC<Props> = ({ onBack, onReport }) => {
  const [activities, setActivities] = useState<ProgramActivity[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [lead, setLead] = useState('');
  const [target, setTarget] = useState('Murid');
  const [notice, setNotice] = useState('');
  const completed = useMemo(() => activities.filter(a => a.done).length, [activities]);
  const addActivity = (event: React.FormEvent) => {
    event.preventDefault();
    if (title.trim().length < 3 || !date) { setNotice('Masukkan nama aktiviti dan tarikh terlebih dahulu.'); return; }
    setActivities(current => [...current, { id: Date.now(), title: title.trim(), date, lead: lead.trim() || 'Belum ditetapkan', target, done: false }]);
    setTitle(''); setDate(''); setLead(''); setNotice('Aktiviti ditambah untuk sesi ini. Data belum disimpan ke pelayan.');
  };
  const exportPlan = () => {
    const rows = [['Aktiviti', 'Tarikh', 'Penyelaras', 'Sasaran', 'Status'], ...activities.map(a => [a.title, a.date, a.lead, a.target, a.done ? 'Selesai' : 'Dirancang'])];
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'pelan-program-safe.csv'; anchor.click(); URL.revokeObjectURL(url);
  };
  return (
  <div className="min-h-screen bg-[#FDFBF7] text-[#3D405B] pb-12">
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-stone-100 px-4 py-3 flex items-center gap-3">
      <button onClick={onBack} className="p-2 rounded-full hover:bg-stone-100" aria-label="Kembali"><ArrowLeft size={22} /></button>
      <div><p className="font-black text-lg">KITABUDDY · SAFE</p><p className="text-xs text-slate-500">School Anti-Bullying Framework for Empowerment</p></div>
    </header>
    <main className="max-w-5xl mx-auto px-4 py-7 md:py-10">
      <section className="rounded-[2rem] bg-gradient-to-br from-[#3D405B] to-[#59617A] p-7 md:p-10 text-white shadow-lg">
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 text-xs font-bold mb-4"><ShieldCheck size={15}/> SAFE Framework Add-on</div>
        <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">Memperkasa sekolah, melindungi murid.</h1>
        <p className="text-white/80 max-w-2xl leading-relaxed">SAFE ialah kerangka pelengkap dalam KITABUDDY 2.0 untuk menyatukan pendidikan pencegahan, pemerkasaan warga sekolah, sokongan intervensi dan pengurusan laporan buli.</p>
        <button onClick={onReport} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#E07A5F] hover:bg-[#D97760] px-5 py-3 font-black text-white">Laporkan buli secara anonim <ArrowRight size={18}/></button>
      </section>
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        {pillars.map(p => { const Icon = p.icon; return <section key={p.title} className="rounded-3xl bg-white border border-stone-100 p-6 shadow-sm"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${p.color}`}><Icon size={24}/></div><h2 className="text-xl font-black mt-4 mb-2">{p.title}</h2><p className="text-slate-600 text-sm leading-relaxed">{p.desc}</p></section>; })}
      </div>
      <section className="mt-6 rounded-3xl bg-white border border-stone-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 font-black text-lg mb-2"><HeartHandshake size={21}/> Panduan sokongan dan intervensi</div>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">Panduan ringkas untuk membantu warga sekolah bertindak secara tenang, menjaga maruah murid dan mengutamakan keselamatan. Ia bukan pengganti SOP sekolah atau penilaian profesional.</p>
        <div className="grid md:grid-cols-3 gap-3">
          <article className="rounded-2xl bg-rose-50 border border-rose-100 p-4">
            <h3 className="font-black mb-2">Sokongan mangsa</h3>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1.5"><li>Dengar tanpa menyalahkan atau mendesak murid menceritakan semuanya sekali gus.</li><li>Tanya apa yang diperlukan untuk berasa selamat sekarang.</li><li>Hubungkan kepada kaunselor atau petugas sekolah yang diberi kuasa.</li><li>Aturkan susulan secara sulit dan jelaskan had kerahsiaan.</li></ul>
          </article>
          <article className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
            <h3 className="font-black mb-2">Panduan saksi</h3>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1.5"><li>Jangan membahayakan diri dengan berdepan sendirian.</li><li>Dapatkan bantuan guru atau orang dewasa yang dipercayai.</li><li>Catat fakta yang dilihat atau didengar tanpa menyebarkan khabar angin.</li><li>Jangan kongsi gambar atau video kejadian di media sosial.</li></ul>
          </article>
          <article className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
            <h3 className="font-black mb-2">Perubahan tingkah laku</h3>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1.5"><li>Fokus pada tindakan dan kesannya, bukan melabel murid sebagai “pembuli” selama-lamanya.</li><li>Tetapkan jangkaan tingkah laku yang jelas dan munasabah.</li><li>Gunakan bimbingan, akauntabiliti dan pemantauan yang sesuai.</li><li>Utamakan keselamatan mangsa; jangan paksa perdamaian atau pertemuan bersama.</li></ul>
          </article>
        </div>
        <p className="mt-4 rounded-xl bg-stone-50 p-3 text-xs text-slate-600 leading-relaxed"><strong>Jika ada bahaya segera:</strong> maklumkan guru atau orang dewasa yang dipercayai dengan segera dan hubungi perkhidmatan kecemasan tempatan jika perlu. Jangan tunggu laporan dalam aplikasi diproses.</p>
      </section>
      <section className="mt-6 rounded-3xl border border-[#D6E8DD] bg-[#EAF3EE] p-6">
        <div className="flex items-center gap-2 font-black mb-2"><ClipboardCheck size={20}/> SAFE Program Management</div>
        <p className="text-sm text-slate-700 leading-relaxed">Rancang aktiviti pencegahan dan latihan sekolah. Buat masa ini senarai disimpan dalam sesi pelayar sahaja—belum disegerakkan atau disimpan ke pangkalan data.</p>
        <form onSubmit={addActivity} className="mt-5 grid md:grid-cols-2 gap-3 rounded-2xl bg-white p-4 border border-emerald-100">
          <label className="text-sm font-bold md:col-span-2">Nama aktiviti<input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} required placeholder="Contoh: Minggu Kesedaran Anti-Buli" className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 font-normal" /></label>
          <label className="text-sm font-bold">Tarikh<input type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 font-normal" /></label>
          <label className="text-sm font-bold">Sasaran<select value={target} onChange={e => setTarget(e.target.value)} className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 font-normal"><option>Murid</option><option>Guru dan staf</option><option>Ibu bapa / penjaga</option><option>Seluruh komuniti sekolah</option></select></label>
          <label className="text-sm font-bold md:col-span-2">Penyelaras (pilihan)<input value={lead} onChange={e => setLead(e.target.value)} maxLength={100} placeholder="Nama peranan atau jawatankuasa" className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 font-normal" /></label>
          <div className="md:col-span-2 flex flex-wrap gap-2"><button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#3D405B] px-4 py-2.5 font-bold text-white"><Plus size={17}/> Tambah aktiviti</button><button type="button" onClick={exportPlan} disabled={!activities.length} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2.5 font-bold disabled:opacity-40"><Download size={17}/> Eksport CSV</button></div>
          {notice && <p role="status" className="md:col-span-2 text-sm text-slate-600">{notice}</p>}
        </form>
        <div className="grid grid-cols-3 gap-3 mt-4"><div className="rounded-2xl bg-white p-3"><p className="text-xs text-slate-500">Dirancang</p><p className="text-2xl font-black">{activities.length}</p></div><div className="rounded-2xl bg-white p-3"><p className="text-xs text-slate-500">Selesai</p><p className="text-2xl font-black">{completed}</p></div><div className="rounded-2xl bg-white p-3"><p className="text-xs text-slate-500">Belum selesai</p><p className="text-2xl font-black">{activities.length - completed}</p></div></div>
        {activities.length > 0 && <ul className="mt-4 space-y-2">{activities.map(activity => <li key={activity.id} className="flex items-start gap-3 rounded-2xl bg-white p-4"><button type="button" aria-label={activity.done ? 'Tandakan belum selesai' : 'Tandakan selesai'} onClick={() => setActivities(current => current.map(a => a.id === activity.id ? { ...a, done: !a.done } : a))} className={`mt-0.5 rounded-full ${activity.done ? 'text-emerald-600' : 'text-slate-300'}`}><CheckCircle2 size={22}/></button><div className="min-w-0 flex-1"><p className={`font-bold ${activity.done ? 'line-through text-slate-400' : ''}`}>{activity.title}</p><p className="text-xs text-slate-500 mt-1"><CalendarDays size={12} className="inline mr-1"/>{activity.date} · {activity.target} · {activity.lead}</p></div><button type="button" onClick={() => setActivities(current => current.filter(a => a.id !== activity.id))} className="text-xs text-rose-600">Padam</button></li>)}</ul>}
        <div className="flex items-center gap-2 font-black mt-6 mb-2"><BarChart3 size={20}/> SAFE Impact Dashboard</div><p className="text-sm text-slate-700 leading-relaxed">Ringkasan aktiviti di atas ialah kiraan perancangan sahaja, bukan ukuran keberkesanan anti-buli. Analitik impak sebenar perlu menggunakan data agregat yang disahkan dan tidak mendedahkan identiti murid.</p>
      </section>
      <p className="text-xs text-slate-500 mt-5 leading-relaxed">Nota: Ini ialah paparan konsep add-on SAFE dalam KITABUDDY 2.0. Aliran kerja rasmi, indikator dan prosedur akan diperhalus selepas audit projek SAFE sedia ada serta semakan bersama pihak sekolah.</p>
    </main>
  </div>
  );
};
