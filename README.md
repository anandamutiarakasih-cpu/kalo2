# THERMO CHAMPIONS: HEAT EDITION 🏆🔥
### Media Pembelajaran Sains IPA SMP Kelas VII — Materi Pokok Kalor & Perpindahannya
> **Tagline:** *"Master the Heat & Energy. Become the Champion."*

Aplikasi web turnamen sains edukatif interaktif berbasis kompetisi antarkelompok kelas VII SMP dengan arsitektur **Multiplayer Realtime Multi-Device**. 8 kelompok siswa bertanding secara serentak dari smartphone/tablet masing-masing di bawah kendali 1 Game Master / Guru melalui Dashboard Admin.

---

## 🚀 1. STACK TEKNOLOGI

Aplikasi ini dibangun murni menggunakan **3 Teknologi Frontend Inti**:

1. **HTML5** — Untuk struktur semantik halaman mobile-first yang bersih, cepat, dan aksesibel.
2. **CSS3** — Untuk desain tampilan, layout modern (Flexbox & CSS Grid), animasi halus, responsivitas multi-device (smartphone, tablet, laptop, desktop), dan Custom Properties (CSS Variables).
3. **Vanilla JavaScript (ES Modules)** — Untuk seluruh logika aplikasi, interaksi antarmuka, state management, timer drift-free, dan sound synthesizer tanpa library eksternal.

### 🚫 Ketentuan Wajib Bebas Framework:
- **TANPA** React, Vue, Angular, atau Next.js
- **TANPA** TypeScript
- **TANPA** Tailwind CSS atau Bootstrap
- **TANPA** jQuery atau library komponen tambahan
- **Bukan** framework berbasis komponen
- Menggunakan CSS murni dan JavaScript ES Modules (`import`/`export`) native peramban.

### 🛠️ Layanan Pendukung:
- **Firebase Realtime Database:** Penyimpanan realtime, atomic slot locking 8 kelompok, dan live leaderboard synchronization.
- **Firebase Authentication:** Otentikasi anonim untuk mengamankan identitas perangkat siswa dan admin.
- **Firebase Cloud Functions:** Validasi server-side kunci jawaban materi kalor, pencegahan cheat, dan kalkulasi skor di backend.
- **Firebase Security Rules:** Perlindungan data sesi, grup, dan jawaban (`database.rules.json`).
- **Vercel:** Hosting statis frontend tanpa proses build rumit.
- **Web Audio API:** Sintesis efek suara cerdas (zero MP3 file).
- **HTML5 Canvas:** Efek konfeti perayaan kemenangan.

---

## 📂 2. STRUKTUR PROYEK

```
d:\Kalor2\
├── index.html                  # Halaman Klien Siswa (Mobile-First HP/Tablet/Laptop)
├── admin.html                  # Dashboard Game Master / Guru
├── style.css                   # CSS Klien Siswa (Flexbox, CSS Grid & Custom Properties)
├── admin.css                   # CSS Dashboard Guru
├── vercel.json                 # Konfigurasi Vercel Deployment & Security Headers
├── database.rules.json         # Aturan Keamanan Firebase Realtime Database
├── firebase.json               # Konfigurasi Proyek Firebase (RTDB, Functions, Hosting)
├── .env.example                # Panduan Variabel Lingkungan Firebase
├── README.md                   # Dokumentasi Lengkap Proyek
├── src/
│   ├── data/
│   │   └── questions.js        # Bank Soal Kalor, Kartu Memori, Rumus & Kriteria Predikat
│   └── js/
│       ├── app.js              # Controller Utama Siswa (Vanilla JS ES Modules)
│       ├── admin.js            # Controller Utama Admin Guru (Vanilla JS ES Modules)
│       ├── firebase/
│       │   ├── config.js       # Inisialisasi Firebase Web Modular SDK v10/v11
│       │   ├── auth.js         # Otentikasi Anonim untuk Perangkat Siswa & Guru
│       │   ├── database.js     # Layanan RTDB: Atomic Slot 8 Kelompok, Timer & Leaderboard
│       │   └── functions.js    # Pemanggil Cloud Functions dengan Fallback RTDB Klien
│       ├── game/
│       │   ├── state.js        # State Management & Pemulihan Sesi (Rehydration)
│       │   ├── star-champ.js   # Mode 1: StarChamp Kalor & Azas Black (10 PG, 35 Poin)
│       │   ├── memory-madness.js# Mode 2: Memory Madness Kalor (Hafal 30s + Recall, 30 Poin)
│       │   └── number-chains.js# Mode 3: Number Chains Hitungan Kalor (5 Tahap, 35 Poin)
│       └── utils/
│           ├── timer.js        # Sinkronisasi Timer Server /.info/serverTimeOffset
│           ├── sounds.js       # Sintesis Efek Suara Web Audio API Murni
│           └── ui.js           # Notifikasi Toast, Dialog Modal & Canvas Confetti
└── functions/
    ├── package.json            # Dependensi Node.js Cloud Functions
    └── index.js                # Backend Functions: Validasi Kunci Jawaban & Anti-Cheat
```

---

## ⚡ 3. TIGA ARENA TANTANGAN TURNAMEN (TOTAL 100 POIN)

| Arena | Nama Arena | Materi & Mekanisme | Bobot Skor |
| :--- | :--- | :--- | :--- |
| **Mode 1** | **StarChamp Challenge** | 10 Soal Pilihan Ganda cepat materi konsep kalor, tara kalor mekanik (1 kalori = 4,2 J), kalor jenis, kalor laten, Azas Black, dan perpindahan kalor (konduksi, konveksi, radiasi). Timer 30 detik/soal. | **35 Poin** (3,5 poin/soal) |
| **Mode 2** | **Memory Madness** | **Fase 1 (Memorize):** 30 detik menghafal 10 kartu fakta penting (rumus $Q = m \cdot c \cdot \Delta T$, $Q = m \cdot L$, konstanta kalor jenis air 4.200 J/kg°C, kalor lebur es 336.000 J/kg).<br>**Fase 2 (Recall):** 10 tantangan uji ingatan cepat (timer 25 detik/soal). | **30 Poin** (3,0 poin/soal) |
| **Mode 3** | **Number Chains** | 5 Tahap perhitungan kalor bertingkat:<br>• Tahap 1: Kalor pemanasan air sederhana ($Q = m \cdot c \cdot \Delta T$)<br>• Tahap 2: Kalor lebur es ($Q = m \cdot L$)<br>• Tahap 3: Menentukan kenaikan suhu ($\Delta T = Q / (m \cdot c)$)<br>• Tahap 4: Kapasitas kalor bejana ($C = Q / \Delta T$)<br>• Tahap 5: Rantai bertingkat es $0^\circ\text{C}$ melebur lalu dipanaskan hingga $100^\circ\text{C}$ | **35 Poin** (7 poin/tahap) |
| **TOTAL** | **Akademik Kalor IPA** | **3 Arena Pertandingan Kelompok** | **100 Poin Maksimal** |

### 🏆 Skala Predikat Pencapaian Resmi:
- **86 – 100 Poin:** 🏆 `THERMO CHAMPION` (Penguasaan materi kalor & termodinamika tingkat master)
- **76 – 85 Poin:** 🥇 `HEAT EXPERT` (Pemahaman konsep, rumus, dan Azas Black sangat matang)
- **66 – 75 Poin:** 🥈 `SCIENCE CHALLENGER` (Penalaran sains dan memori rumus memuaskan)
- **56 – 65 Poin:** 🥉 `HEAT EXPLORER` (Cukup baik, perlu ketelitian dalam menghitung kalor laten)
- **0 – 55 Poin:** 🌱 `THERMAL ROOKIE` (Perlu mengulang modul materi konsep dasar kalor)

---

## 📱 4. PANDUAN PENGGUNAAN DI KELAS

### A. Alur Guru (Game Master Admin):
1. Buka `admin.html` di laptop Guru (dapat diproyeksikan ke layar proyektor kelas).
2. Klik **➕ Buat Sesi Baru**, isi nama sesi (misal: *Turnamen Kalor VII-A*), lalu klik **Buat Sesi**.
3. Guru mendapatkan **Kode Sesi 6 Karakter** (misal: `TC-7929`) atau dapat mengklik tombol **🔗 Salin Link HP Siswa**.
4. Guru memantau **Status 8 Kelompok** di ruang tunggu secara live.
5. Saat ke-8 kelompok telah masuk dan siap di ruang tunggu, Guru menekan tombol hero besar:
   🚀 **"MULAI BERSAMA SELURUH KELOMPOK"**
6. Seluruh HP siswa secara serentak menghitung mundur **3... 2... 1... MULAI!** dan masuk ke arena pertandingan.
7. Guru memantau pergerakan nilai secara langsung di tabel **Papan Peringkat Real-Time** dan dapat mengunduh rekap hasil akhir dengan tombol **📊 Unduh CSV**.

### B. Alur Kelompok Siswa:
1. Satu perwakilan kelompok membuka `index.html` di HP/smartphone mereka.
2. Masukkan **Kode Sesi** dari Guru (atau buka link langsung dari Guru).
3. Pilih nomor kelompok (Kelompok 1 sampai 8). Sistem atomic locking otomatis mencegah 2 kelompok mengambil nomor yang sama.
4. Masukkan **Nama Kelompok** dan daftar **Anggota Tim beserta nomor absen**.
5. Klik **Konfirmasi dan Mulai**. Perangkat masuk ke **Ruang Tunggu (Lobby)**.
6. Tunggu sinyal mulai dari Guru di depan kelas.
7. Kerjakan ketiga mode tantangan bersama-sama hingga tuntas.
8. Lihat hasil akhir nilai kumulatif, predikat, piagam penghargaan, dan peringkat kelas!

---

## 🌐 5. DEPLOYMENT KE VERCEL

Proyek ini telah dikonfigurasi secara lengkap untuk Vercel melalui `vercel.json`:
1. Push repositori ke GitHub / GitLab / Bitbucket.
2. Buka [Vercel Dashboard](https://vercel.com/) dan impor repositori.
3. Karena proyek menggunakan Vanilla HTML/CSS/JS murni:
   - **Framework Preset:** `Other`.
   - **Build Command:** *(kosongkan)*.
   - **Output Directory:** `.` *(root)*.
4. Klik **Deploy**.
5. Website langsung siap diakses secara online oleh seluruh siswa di kelas!
