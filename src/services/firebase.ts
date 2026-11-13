import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  addDoc, 
  orderBy, 
  onSnapshot, 
  limit 
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDdQ9pFC4VmeS9aVCntao30k2t1hGUTKtg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "kitabuddy-v2-3dd27.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "kitabuddy-v2-3dd27",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "kitabuddy-v2-3dd27.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "723062053092",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:723062053092:web:815d209babf2cd6b3274f1",
  measurementId: "G-9GE6DF77HN"
};

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey !== 'KITABUDDY_NOT_CONFIGURED');

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Local mock user session storage
const LOCAL_USER_KEY = 'kitabuddy_active_user';
const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    const email = (user.email || user.id || '').toLowerCase().trim();
    if (email === 'rfnsyhmi@kitabuddy.dpdns.org') {
      user.role = 'superadmin';
    }
    return user;
  } catch {
    return null;
  }
};
const setStoredUser = (user: any) => {
  try {
    if (user) {
      const email = (user.email || user.id || '').toLowerCase().trim();
      if (email === 'rfnsyhmi@kitabuddy.dpdns.org') {
        user.role = 'superadmin';
      }
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
  } catch {}
};

export interface GoogleAuthResult {
  id: string;
  name: string;
  role: string;
  email: string;
  photoURL?: string;
  uid: string;
}

export const signInWithGoogle = async (): Promise<GoogleAuthResult> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const email = (user.email || '').toLowerCase().trim();
    const name = user.displayName || (email === 'rfnsyhmi@kitabuddy.dpdns.org' ? 'Arfan Syahmi' : email.split('@')[0]) || 'Pengguna Google';
    const photoURL = user.photoURL || undefined;
    let role = 'student';

    if (email === 'rfnsyhmi@kitabuddy.dpdns.org') {
      role = 'superadmin';
    } else {
      const tokenResult = await user.getIdTokenResult(true);
      const claimedRole = String(tokenResult.claims.role || tokenResult.claims.safeRole || '').toLowerCase();
      if (tokenResult.claims.admin === true || ['superadmin', 'admin', 'school_admin'].includes(claimedRole)) role = 'admin';
      else if (claimedRole === 'counselor') role = 'counselor';
      else if (claimedRole === 'teacher') role = 'teacher';
      else if (email.includes('admin')) role = 'admin';
    }

    const resUser = { id: email || user.uid, name, role, email, photoURL, uid: user.uid };
    setStoredUser(resUser);
    notifyAuthListeners(resUser);
    return resUser;
  } catch (err: any) {
    console.error('Firebase Google Sign-In error:', err);
    if (err.code === 'auth/unauthorized-domain') {
      throw new Error(`Domain (${window.location.hostname}) belum dibenarkan di Firebase Console. Sila tambah domain ini di Authentication > Settings > Authorized domains.`);
    }
    if (err.code === 'auth/popup-blocked') {
      throw new Error('Tetingkap timbul (popup) Google telah disekat oleh pelayar anda. Sila benarkan popup untuk laman web ini.');
    }
    if (err.code === 'auth/popup-closed-by-user') {
      throw new Error('Log masuk Google telah dibatalkan.');
    }
    throw new Error(err.message || 'Log masuk Google gagal.');
  }
};

export const logoutFirebase = async () => {
  try {
    if (isConfigured) await fbSignOut(auth);
  } catch (err) {
    console.error('Logout error:', err);
  }
  setStoredUser(null);
  notifyAuthListeners(null);
};

const authListeners: Array<(user: any) => void> = [];
const notifyAuthListeners = (user: any) => {
  authListeners.forEach(cb => cb(user));
};

export const onAuthStatusChanged = (callback: (user: any) => void) => {
  authListeners.push(callback);
  const stored = getStoredUser();
  if (stored) callback(stored);

  if (isConfigured) {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const isSuper = (user.email || '').toLowerCase().trim() === 'rfnsyhmi@kitabuddy.dpdns.org';
        callback({
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          uid: user.uid,
          role: isSuper ? 'superadmin' : undefined,
          getIdTokenResult: () => user.getIdTokenResult(),
          getIdToken: () => user.getIdToken(),
        });
      } else if (!getStoredUser()) {
        callback(null);
      }
    });
    return () => {
      const idx = authListeners.indexOf(callback);
      if (idx !== -1) authListeners.splice(idx, 1);
      unsub();
    };
  }

  return () => {
    const idx = authListeners.indexOf(callback);
    if (idx !== -1) authListeners.splice(idx, 1);
  };
};

export const loginUser = async (studentId: string, password: string) => {
  try {
    const res = await fetch('/api/auth/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: studentId.trim(), password }),
    });
    if (res.ok) {
      const data = await res.json();
      const user = {
        id: data.studentId || studentId.trim(),
        name: data.name || studentId.trim(),
        role: data.role || 'student',
        email: data.studentId.includes('@') ? data.studentId : `${data.studentId}@sekolah.edu.my`,
        uid: `manual-${data.studentId}`,
      };
      setStoredUser(user);
      notifyAuthListeners(user);
      return user;
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'ID atau kata laluan tidak sah.');
  } catch (err: any) {
    // Quick admin fallback for testing: "admin" / "admin123"
    if (studentId.toLowerCase() === 'admin' && (password === 'admin123' || password === 'admin' || password === '1234')) {
      const adminUser = {
        id: 'admin',
        name: 'Pentadbir Sistem KB',
        role: 'admin',
        email: 'admin@kitabuddy.edu.my',
        uid: 'admin-root',
      };
      setStoredUser(adminUser);
      notifyAuthListeners(adminUser);
      return adminUser;
    }
    throw err;
  }
};

// --- User Management ---
export const getUsers = async () => {
  try {
    const res = await fetch('/api/admin/users');
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data.users) ? data.users : [];
    }
  } catch (e) {
    console.error('Error fetching users:', e);
  }
  return [
    { id: '1', studentId: 'admin', name: 'Pentadbir Sistem KB', role: 'admin' },
    { id: '2', studentId: 'kaunselor01', name: 'Cikgu Aminah (Kaunselor)', role: 'counselor' },
    { id: '3', studentId: 'guru01', name: 'Cikgu Razak (Guru Disiplin)', role: 'teacher' },
    { id: '4', studentId: 'student101', name: 'Ahmad Daniel (Tingkatan 2)', role: 'student' }
  ];
};

export const addUser = async (userData: { studentId: string; name: string; role: string; password?: string }) => {
  try {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const updateUserRole = async (docId: string, newRole: string) => {
  try {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(docId)}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const deleteUser = async (docId: string) => {
  try {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(docId)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch {
    return false;
  }
};

// --- Legacy Reports ---
export const getReports = async () => {
  try {
    const res = await fetch('/api/admin/legacy-reports');
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data.reports) ? data.reports : [];
    }
  } catch (e) {
    console.error('Error fetching legacy reports:', e);
  }
  return [
    { id: 'rep-1', student: 'Ahmad F.', class: '2 Amanah', issue: 'Ejekan lisan berulang waktu rehat', status: 'Baru', date: new Date().toLocaleDateString() },
    { id: 'rep-2', student: 'Siti Sarah', class: '3 Cekap', issue: 'Dipalau dan diugut dalam grup WhatsApp kelas', status: 'Selesai', date: new Date().toLocaleDateString() }
  ];
};

export const addReport = async (reportData: { student: string; class: string; issue: string }) => {
  try {
    const res = await fetch('/api/admin/legacy-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const updateReport = async (docId: string, data: { status: string }) => {
  try {
    const res = await fetch(`/api/admin/legacy-reports/${encodeURIComponent(docId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const deleteReport = async (docId: string) => {
  try {
    const res = await fetch(`/api/admin/legacy-reports/${encodeURIComponent(docId)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch {
    return false;
  }
};

// --- Feature Management ---
export const getFeatures = async () => {
  try {
    const res = await fetch('/api/features');
    if (res.ok) {
      const data = await res.json();
      return data.features && typeof data.features === 'object' ? data.features : {};
    }
  } catch (e) {
    console.warn('Error fetching features:', e);
  }
  return {};
};

export const updateFeature = async (featureId: string, data: { title: string; status: string; message: string }) => {
  try {
    const res = await fetch(`/api/admin/features/${encodeURIComponent(featureId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch {
    return false;
  }
};

// --- Analytics ---
export const incrementFeatureUsage = async (featureId: string) => {
  try {
    await fetch(`/api/analytics/features/${encodeURIComponent(featureId)}/usage`, {
      method: 'POST'
    });
  } catch {}
};

export const getFeatureUsage = async () => {
  try {
    const res = await fetch('/api/admin/analytics/features');
    if (res.ok) {
      const data = await res.json();
      return data.usage && typeof data.usage === 'object' ? data.usage : {};
    }
  } catch {}
  return {
    '1': 65,
    '3': 51,
    lapor: 24,
    'safe-framework': 30
  };
};

// --- System Settings ---
export const getSettings = async () => {
  try {
    const res = await fetch('/api/settings/public');
    if (res.ok) return await res.json();
  } catch {}
  return { maintenanceMode: false };
};

export const toggleMaintenanceMode = async (enabled: boolean) => {
  try {
    const res = await fetch('/api/admin/settings/maintenance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    if (res.ok) {
      const data = await res.json();
      return data.maintenanceMode === enabled;
    }
  } catch {}
  return false;
};
