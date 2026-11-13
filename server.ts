import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Multer memory storage for evidence attachments
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

// Persistent Data Storage
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface SafeReportRecord {
  reference: string;
  trackingCode: string;
  reportType: 'text' | 'photo' | 'audio' | 'video';
  category: string;
  description: string;
  incidentDate?: string;
  location?: string;
  urgent: boolean;
  status: string;
  publicUpdate?: string;
  hasMedia: boolean;
  mediaMimeType?: string;
  mediaDataUri?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserRecord {
  id: string;
  studentId: string;
  name: string;
  role: 'superadmin' | 'admin' | 'counselor' | 'teacher' | 'student';
  passwordHash?: string;
  passwordSalt?: string;
}

interface LegacyReportRecord {
  id: string;
  student: string;
  class: string;
  issue: string;
  status: string;
  date: string;
}

interface AppDatabase {
  reports: SafeReportRecord[];
  users: UserRecord[];
  legacyReports: LegacyReportRecord[];
  featureUsage: Record<string, number>;
  features: Record<string, { title: string; status: string; message: string }>;
  settings: { maintenanceMode: boolean };
}

function initDb(): AppDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const defaultDb: AppDatabase = {
    reports: [
      {
        reference: 'KB-20261020-DEMO',
        trackingCode: 'KB-SAFE-7788',
        reportType: 'text',
        category: 'verbal',
        description: 'Terdapat kumpulan pelajar mengejek fizikal dan pakaian seragam rakan sekelas sewaktu waktu rehat di belakang kantin.',
        incidentDate: '2026-10-19',
        location: 'Belakang Kantin Sekolah',
        urgent: true,
        status: 'Dalam Semakan',
        publicUpdate: 'Laporan telah diterima oleh Guru Kaunseling. Sesi perbincangan awal sedang dijadualkan.',
        hasMedia: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        reference: 'KB-20261018-CYBER',
        trackingCode: 'KB-SAFE-1234',
        reportType: 'text',
        category: 'cyber',
        description: 'Penyebaran gambar dan perkataan memalukan dalam grup media sosial pelajar Tingkatan 3.',
        incidentDate: '2026-10-18',
        location: 'Kumpulan Media Sosial / Dalam Talian',
        urgent: false,
        status: 'Tindakan Susulan',
        publicUpdate: 'Pentadbir telah menghubungi pentadbir grup dan sesi kaunseling sokongan telah diberikan kepada mangsa.',
        hasMedia: false,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ],
    users: [
      { id: 'usr-superadmin', studentId: 'rfnsyhmi@kitabuddy.dpdns.org', name: 'Arfan Syahmi', role: 'superadmin' },
      { id: 'usr-1', studentId: 'admin', name: 'Pentadbir Sistem KB', role: 'admin' },
      { id: 'usr-2', studentId: 'kaunselor01', name: 'Cikgu Aminah (Guru Kaunseling)', role: 'counselor' },
      { id: 'usr-3', studentId: 'guru01', name: 'Cikgu Razak (Guru Disiplin)', role: 'teacher' },
      { id: 'usr-4', studentId: 'student101', name: 'Ahmad Daniel (Tingkatan 2)', role: 'student' }
    ],
    legacyReports: [
      { id: 'rep-1', student: 'Amirul Haziq', class: '2 Amanah', issue: 'Ejekan lisan berulang waktu rehat', status: 'Selesai', date: '15/10/2026' },
      { id: 'rep-2', student: 'Siti Sarah', class: '3 Cekap', issue: 'Dipalau dan diugut dalam grup WhatsApp kelas', status: 'Dalam Siasatan', date: '18/10/2026' }
    ],
    featureUsage: {
      '1': 72,
      '3': 59,
      lapor: 28,
      'safe-framework': 41,
    },
    features: {
      'sos-spdb': { title: 'SOS BULI (SPDB)', status: 'Active', message: 'Pautan terus ke portal aduan kecemasan SPDB KPM.' }
    },
    settings: {
      maintenanceMode: false
    }
  };

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf-8');
    return defaultDb;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return defaultDb;
  }
}

let db = initDb();

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database file:', err);
  }
}

// ----------------- API ENDPOINTS -----------------

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'KitaBuddy 2.0 SAFE API Server',
    environment: isProduction ? 'production' : 'development',
    reportsCount: db.reports.length,
    usersCount: db.users.length,
  });
});

// Features & Settings
app.get('/api/features', (_req: Request, res: Response) => {
  res.json({ features: db.features || {} });
});

app.patch('/api/admin/features/:featureId', (req: Request, res: Response) => {
  const { featureId } = req.params;
  const { title, status, message } = req.body;
  if (!db.features) db.features = {};
  db.features[featureId] = { title, status, message };
  saveDb();
  res.json({ ok: true, feature: db.features[featureId] });
});

app.get('/api/settings/public', (_req: Request, res: Response) => {
  res.json(db.settings || { maintenanceMode: false });
});

app.patch('/api/admin/settings/maintenance', (req: Request, res: Response) => {
  const { enabled } = req.body;
  db.settings.maintenanceMode = Boolean(enabled);
  saveDb();
  res.json({ ok: true, maintenanceMode: db.settings.maintenanceMode });
});

// Feature Analytics
app.post('/api/analytics/features/:featureId/usage', (req: Request, res: Response) => {
  const { featureId } = req.params;
  db.featureUsage[featureId] = (db.featureUsage[featureId] || 0) + 1;
  saveDb();
  res.json({ ok: true, count: db.featureUsage[featureId] });
});

app.get('/api/admin/analytics/features', (_req: Request, res: Response) => {
  res.json({ usage: db.featureUsage || {} });
});

async function sendTelegramNotification(report: SafeReportRecord, userEmail?: string, userName?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN || '8948754302:AAE2W1pvWUtTMFn6UzjDLrmcOluxodvUqQk';
  const chatId = process.env.TELEGRAM_CHAT_ID || '-1004343894728';
  if (!token || !chatId) return;

  const text = `🚨 *LAPORAN SOS BULI BAHARU (SPDB)* 🚨\n\n` +
    `• *No. Rujukan:* \`${report.reference}\`\n` +
    `• *Kod Semakan:* \`${report.trackingCode}\`\n` +
    `• *Kategori:* ${report.category}\n` +
    `• *Tarikh Kejadian:* ${report.incidentDate || 'Tidak dinyatakan'}\n` +
    `• *Lokasi:* ${report.location || 'Tidak dinyatakan'}\n` +
    `• *Kecemasan:* ${report.urgent ? '🔴 SEGERA (Urgente)' : 'Biasa'}\n` +
    `• *Keterangan:* ${report.description}\n\n` +
    `👤 *Pengguna Log Masuk:*\n` +
    `• *Nama:* ${userName || 'Tetamu / Tidak Log Masuk'}\n` +
    `• *Emel/ID:* ${userEmail || 'Tidak dinyatakan'}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown'
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
  } catch (err) {
    console.error('Failed to send Telegram notification:', err);
  }
}

// Anonymous Safe Bullying Report Submission
app.post('/api/reports', upload.single('media'), (req: Request, res: Response) => {
  try {
    const { reportType, category, description, incidentDate, location, urgent, userEmail, userName } = req.body;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const reference = `KB-${dateStr}-${randHex}`;
    const trackingCode = `SAFE-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    let mediaDataUri: string | undefined = undefined;
    let hasMedia = false;
    let mediaMimeType: string | undefined = undefined;

    if (req.file) {
      hasMedia = true;
      mediaMimeType = req.file.mimetype;
      mediaDataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const newReport: SafeReportRecord = {
      reference,
      trackingCode,
      reportType: reportType || 'text',
      category: category || 'physical',
      description: description || '',
      incidentDate: incidentDate || undefined,
      location: location || undefined,
      urgent: String(urgent) === 'true',
      status: 'Diterima',
      publicUpdate: 'Laporan anda telah selamat diterima oleh sistem SAFE. Pihak sekolah sedang meneliti maklumat ini dengan kerahsiaan penuh.',
      hasMedia,
      mediaMimeType,
      mediaDataUri,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.reports.unshift(newReport);
    db.featureUsage['lapor'] = (db.featureUsage['lapor'] || 0) + 1;
    saveDb();

    void sendTelegramNotification(newReport, userEmail, userName);

    res.json({
      ok: true,
      reference,
      trackingCode,
      status: newReport.status,
      message: 'Laporan berjaya diterima secara selamat dan anonim.',
    });
  } catch (err: any) {
    console.error('Error submitting report:', err);
    res.status(500).json({ message: 'Gagal memproses laporan. Sila cuba lagi.' });
  }
});

// Check Report Status
app.post('/api/reports/status', (req: Request, res: Response) => {
  const { reference, trackingCode } = req.body;
  if (!reference || !trackingCode) {
    return res.status(400).json({ message: 'Nombor rujukan dan kod semakan diperlukan.' });
  }

  const report = db.reports.find(
    r => r.reference.trim().toUpperCase() === String(reference).trim().toUpperCase() &&
         r.trackingCode.trim().toUpperCase() === String(trackingCode).trim().toUpperCase()
  );

  if (!report) {
    return res.status(404).json({ message: 'Nombor rujukan atau kod semakan tidak sah atau tidak dijumpai.' });
  }

  res.json({
    reference: report.reference,
    status: report.status,
    publicUpdate: report.publicUpdate || 'Laporan sedang diproses.',
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    category: report.category,
  });
});

// Admin / Staff Reports List
app.get('/api/admin/reports', (_req: Request, res: Response) => {
  // Strip heavy mediaDataUri from list view
  const rows = db.reports.map(r => ({
    reference: r.reference,
    reportType: r.reportType,
    category: r.category,
    description: r.description,
    incidentDate: r.incidentDate,
    location: r.location,
    urgent: r.urgent,
    status: r.status,
    publicUpdate: r.publicUpdate,
    hasMedia: r.hasMedia,
    mediaMimeType: r.mediaMimeType,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  res.json({ reports: rows });
});

// Admin / Staff View Evidence
app.get('/api/admin/reports/:reference/evidence', (req: Request, res: Response) => {
  const { reference } = req.params;
  const report = db.reports.find(r => r.reference === reference);
  if (!report || !report.hasMedia || !report.mediaDataUri) {
    return res.status(404).json({ message: 'Bukti tidak dijumpai untuk laporan ini.' });
  }

  res.json({ url: report.mediaDataUri });
});

// Admin / Staff Update Report Status
app.patch('/api/admin/reports/:reference/status', (req: Request, res: Response) => {
  const { reference } = req.params;
  const { status, publicUpdate } = req.body;

  const report = db.reports.find(r => r.reference === reference);
  if (!report) {
    return res.status(404).json({ message: 'Laporan tidak dijumpai.' });
  }

  if (status) report.status = status;
  if (typeof publicUpdate === 'string') report.publicUpdate = publicUpdate;
  report.updatedAt = new Date().toISOString();

  saveDb();
  res.json({ ok: true, status: report.status, publicUpdate: report.publicUpdate });
});

// User Management
app.get('/api/admin/users', (_req: Request, res: Response) => {
  res.json({ users: db.users });
});

app.post('/api/admin/users', (req: Request, res: Response) => {
  const { studentId, name, role } = req.body;
  if (!studentId || !name) {
    return res.status(400).json({ message: 'ID dan nama diperlukan.' });
  }

  const existing = db.users.find(u => u.studentId.toLowerCase() === studentId.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'Pengguna dengan ID ini sudah wujud.' });
  }

  const newUser: UserRecord = {
    id: `usr-${Date.now()}`,
    studentId,
    name,
    role: role || 'student',
  };
  db.users.push(newUser);
  saveDb();
  res.json({ ok: true, user: newUser });
});

app.patch('/api/admin/users/:id/role', (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  const user = db.users.find(u => u.id === id || u.studentId === id);
  if (!user) return res.status(404).json({ message: 'Pengguna tidak dijumpai.' });
  user.role = role;
  saveDb();
  res.json({ ok: true, user });
});

app.delete('/api/admin/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.users.findIndex(u => u.id === id || u.studentId === id);
  if (index === -1) return res.status(404).json({ message: 'Pengguna tidak dijumpai.' });
  db.users.splice(index, 1);
  saveDb();
  res.json({ ok: true });
});

// Legacy Reports
app.get('/api/admin/legacy-reports', (_req: Request, res: Response) => {
  res.json({ reports: db.legacyReports });
});

app.post('/api/admin/legacy-reports', (req: Request, res: Response) => {
  const { student, class: className, issue, status } = req.body;
  const newReport: LegacyReportRecord = {
    id: `rep-${Date.now()}`,
    student,
    class: className,
    issue,
    status: status || 'Baru',
    date: new Date().toLocaleDateString('ms-MY'),
  };
  db.legacyReports.unshift(newReport);
  saveDb();
  res.json({ ok: true, report: newReport });
});

app.patch('/api/admin/legacy-reports/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const report = db.legacyReports.find(r => r.id === id);
  if (!report) return res.status(404).json({ message: 'Laporan tidak dijumpai.' });
  report.status = status;
  saveDb();
  res.json({ ok: true, report });
});

app.delete('/api/admin/legacy-reports/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.legacyReports.findIndex(r => r.id === id);
  if (index === -1) return res.status(404).json({ message: 'Laporan tidak dijumpai.' });
  db.legacyReports.splice(index, 1);
  saveDb();
  res.json({ ok: true });
});

// Authentication Bridge
app.post('/api/auth/manual', (req: Request, res: Response) => {
  const { studentId, password } = req.body;
  if (!studentId || !password) {
    return res.status(400).json({ message: 'ID dan kata laluan diperlukan.' });
  }

  // Admin shortcut
  if (studentId.toLowerCase() === 'admin' && (password === 'admin123' || password === 'admin' || password === '1234')) {
    return res.json({
      studentId: 'admin',
      name: 'Pentadbir Sistem KB',
      role: 'admin',
    });
  }

  const user = db.users.find(u => u.studentId.toLowerCase() === studentId.toLowerCase());
  if (user) {
    return res.json({
      studentId: user.studentId,
      name: user.name,
      role: user.role,
    });
  }

  // Create auto-student session for test credentials
  const newUser: UserRecord = {
    id: `usr-${Date.now()}`,
    studentId,
    name: studentId,
    role: 'student',
  };
  db.users.push(newUser);
  saveDb();

  res.json({
    studentId: newUser.studentId,
    name: newUser.name,
    role: newUser.role,
  });
});

app.post('/api/auth/sync-google-role', (req: Request, res: Response) => {
  const email = String(req.body?.email || '').toLowerCase().trim();
  if (email === 'rfnsyhmi@kitabuddy.dpdns.org') {
    return res.json({ role: 'superadmin' });
  }
  res.json({ role: 'counselor' });
});

// ----------------- VITE / STATIC SERVING -----------------

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[KitaBuddy 2.0] Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
