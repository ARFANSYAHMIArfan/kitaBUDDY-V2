<div align="center">

# 🛡️ KitaBuddy 2.0 (SAFE Framework)
### Platform Pendidikan, Pencegahan & Sokongan Anti-Buli Interaktif

[![Edisi](https://img.shields.io/badge/Edisi-2026-81B29A?style=for-the-badge&logo=shield)](https://github.com)
[![Status](https://img.shields.io/badge/Status-Aktif%20&%20Stabil-E07A5F?style=for-the-badge&logo=rocket)](https://github.com)
[![Teknologi](https://img.shields.io/badge/React%20%2F%20Vite%20%2F%20Tailwind-3D405B?style=for-the-badge&logo=react)](https://github.com)

</div>

---

## 📖 Mengenai Projek

**KitaBuddy 2.0** ialah sebuah aplikasi web interaktif yang dibina khusus untuk menyokong kerangka **SAFE (School Anti-Bullying Framework for Empowerment)**. Aplikasi ini menyediakan pelbagai modul pendidikan pencegahan buli, sokongan kaunseling digital, sistem aduan kecemasan rasmi, serta konsol pentadbir yang komprehensif.

---

## ✨ Ciri-Ciri Utama

1. **🚨 SOS BULI (SPDB) — Aduan & Bantuan Segera**
   - Borang aduan buli dan integriti sekolah yang selamat.
   - Menyokong pelbagai jenis media (Teks, Foto, Audio, Video).
   - **Integrasi Telegram Bot Automatik**: Setiap aduan baharu yang dihantar akan disalurkan terus sebagai notifikasi masa nyata ke Telegram Bot (lengkap dengan maklumat rujukan, kategori, tarikh, lokasi, dan emel/nama pengguna yang log masuk).
   - Semakan status aduan secara anonim menggunakan nombor rujukan dan kod semakan rahsia.

2. **🤖 BUDI Chatbot (Bantu Untuk Dengar & Intervensi)**
   - Chatbot sahabat murid interaktif untuk mendengar masalah, memberikan sokongan moral, dan panduan intervensi awal secara maya.

3. **📚 Modul Pendidikan & Kesedaran Buli**
   - **Definisi Buli**: Memahami bentuk-bentuk buli (fizikal, lisan, sosial, siber).
   - **Cara Mengelak**: Tips dan strategi praktikal menangani buli.
   - **Kerangka SAFE**: Pemerkasaan sekolah anti-buli.

4. **👑 Konsol Pentadbir & Super Pentadbir 🔰**
   - Log masuk melalui Google Authentication (Firebase Auth).
   - Pengguna dengan emel pengesahan tertentu diiktiraf sebagai **Super Pentadbir 🔰**.
   - Papan pemuka pengurusan laporan, statistik penggunaan ciri, pengurusan pengguna, dan kawalan Mod Penyelenggaraan (*Maintenance Mode*).

---

## 🛠️ Teknologi Yang Digunakan

- **Frontend**: React, TypeScript, Tailwind CSS, Lucide Icons
- **Build Tool**: Vite
- **Backend**: Node.js & Express.js (API Server terpadu)
- **Penyimpanan**: Sistem storan berasaskan fail terpusat / Firestore
- **Autentikasi & Notifikasi**: Firebase Authentication & Telegram Bot API (`fetch`)

---

## 🚀 Panduan Pemasangan & Menjalankan Projek

1. **Klon Repositori**
   ```bash
   git clone https://github.com/username/kitabuddy.git
   cd kitabuddy
   ```

2. **Pasang Tanggungan (*Dependencies*)**
   ```bash
   npm install
   ```

3. **Konfigurasi Persekitaran (`.env`)**
   Salin fail contoh dan masukkan kunci konfigurasi Firebase serta token Telegram Bot anda:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_CHAT_ID=your_telegram_chat_id
   ```

4. **Jalankan Aplikasi Pembangunan**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan pada port `3000`.

---

## 📄 Hak Cipta & Penghargaan

- **Dibangunkan oleh**: Muhammad Arfan Syahmi
- **Hak Cipta Terpelihara © 2026**
