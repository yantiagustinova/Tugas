# Task Tracker Envilog

Aplikasi web pencatatan target, progress, dan status tugas tim Envilog —
pengganti Excel + WhatsApp group untuk pencatatan, dengan pengingat WhatsApp
otomatis menjelang dan setelah due date.

Dibuat sebagai MVP Fase 1 sesuai *Spesifikasi Fitur — Aplikasi Task Tracker Tim
Envilog (Draft v1)*: mobile-friendly, diakses lewat link, siap dites dalam satu
minggu.

---

## Isi

- [Fitur yang sudah jalan](#fitur-yang-sudah-jalan)
- [Teknologi](#teknologi)
- [Menjalankan di lokal](#menjalankan-di-lokal)
- [Deploy ke Vercel](#deploy-ke-vercel)
- [Setup gateway WhatsApp](#setup-gateway-whatsapp)
- [Mengelola anggota tim & PIN](#mengelola-anggota-tim--pin)
- [Cara kerja pengingat](#cara-kerja-pengingat)
- [Struktur kode](#struktur-kode)
- [Catatan & batasan MVP](#catatan--batasan-mvp)

---

## Fitur yang sudah jalan

| Spek | Status | Keterangan |
| --- | --- | --- |
| §2 Login pilih nama + PIN | ✅ | Dropdown nama + PIN 4–8 angka, sesi cookie 30 hari. Tanpa registrasi mandiri. |
| §3 Model data tugas | ✅ | Nama tugas, pemilik (otomatis dari user login), target, due date, progress 0–100%, status terakhir, timestamp update. |
| §4.1 Input & update tugas | ✅ | Form tambah tugas; update kilat 1 tap lewat chip progress (0/25/50/75/100) dan chip status di kartu. Riwayat perubahan (Fase 2) sudah ada — lihat di bawah. |
| §4.2 Dashboard monitoring | ✅ | Semua tugas tim dalam satu layar, filter per orang / per status / urut due date terdekat, kartu merah untuk yang lewat due date. |
| §4.3 Reminder WA otomatis | ✅ | Cron harian: pesan personal mulai H-2 sampai tugas selesai + rekap harian ke grup. Satu arah (app → WA). |
| §4.4 Semua user setara | ✅ | Tidak ada role admin. Semua orang lihat semua tugas, hanya bisa update tugas sendiri (dipaksa di level API). |
| §4.5 Status = dropdown | ✅ | Hanya "Proses" / "Terkendala" / "Selesai" (di-*constraint* juga di database). |

### Fase 2 — riwayat perubahan

Sesuai §4.1 yang menaruh riwayat di Fase 2, setiap penyimpanan yang benar-benar
mengubah **progress**, **status**, atau **due date** kini tercatat di tabel
`task_history` dan tampil sebagai timeline di dialog detail tugas — bisa dibaca
seluruh anggota tim, sama seperti dashboard.

Yang perlu diketahui soal perilakunya:

- Menyimpan nilai yang sama persis **tidak** menghasilkan baris riwayat, jadi
  timeline tidak penuh entri kosong saat staf menekan chip yang sudah aktif.
- Satu penyimpanan yang mengubah dua field sekaligus (mis. geser ke 100% yang
  otomatis mengubah status jadi "Selesai") menjadi **satu** entri berisi dua
  baris, bukan dua entri terpisah.
- Pembuatan tugas ikut tercatat sebagai titik awal timeline ("Tugas dibuat").
- Perubahan **nama tugas** dan **target** sengaja tidak dicatat — spek meminta
  riwayat perubahan status, bukan audit trail penuh.
- Menghapus tugas ikut menghapus riwayatnya (`ON DELETE CASCADE`).

> **Kalau aplikasi sudah pernah dideploy**, jalankan `npm run db:setup` sekali
> lagi terhadap database produksi untuk membuat tabel `task_history`. Skema
> memakai `CREATE TABLE IF NOT EXISTS`, jadi data lama tidak tersentuh. Tugas
> yang dibuat sebelum upgrade tidak punya entri "Tugas dibuat" — timeline-nya
> mulai dari perubahan pertama setelah upgrade.

Tambahan kecil di luar spek yang membantu pengujian minggu ini:

- **`/pengingat`** — pratinjau persis isi pesan WA yang akan dikirim cron hari
  ini, tanpa mengirim apa pun. Berguna untuk mengecek kalimat sebelum gateway
  dinyalakan.
- Geser progress ke **100% otomatis** mengubah status jadi "Selesai", dan
  sebaliknya — supaya staf tidak perlu dua kali tap.
- Nama terakhir yang dipakai login diingat di HP, jadi tinggal ketik PIN.

---

## Teknologi

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **PostgreSQL** (Neon / Vercel Postgres / Supabase — apa pun yang memberi
  connection string) lewat driver `postgres`
- **Vercel Cron** untuk penjadwalan harian
- **Fonnte** atau **Wablas** sebagai gateway WhatsApp (bisa dipilih lewat env)

Tidak ada ORM dan tidak ada layanan auth pihak ketiga — sengaja, supaya
gampang dibaca dan cepat diubah.

---

## Menjalankan di lokal

### 1. Prasyarat

- Node.js 20+
- Satu database PostgreSQL (paling cepat: bikin gratis di
  [neon.tech](https://neon.tech), pilih region Singapore)

### 2. Install & konfigurasi

```bash
npm install
cp .env.example .env.local
```

Isi minimal dua env di `.env.local`:

```dotenv
DATABASE_URL="postgresql://user:password@host/envilog?sslmode=require"
SESSION_SECRET="hasil-dari-openssl-rand-base64-32"
```

Buat `SESSION_SECRET` dengan:

```bash
openssl rand -base64 32
```

### 3. Siapkan tabel dan daftar nama tim

```bash
npm run db:setup                    # bikin tabel users, tasks, task_history, reminder_log
cp seed/team.example.json seed/team.json
# edit seed/team.json: nama, nomor WA, PIN awal tiap orang
npm run db:seed
```

`seed/team.json` sengaja masuk `.gitignore` karena berisi PIN awal.

### 4. Jalankan

```bash
npm run dev
```

Buka http://localhost:3000, login dengan nama + PIN dari `seed/team.json`.

---

## Deploy ke Vercel

1. Push repo ini ke GitHub, lalu **Import Project** di Vercel.
2. Di **Settings → Environment Variables**, isi (untuk environment
   *Production* dan *Preview*):

   | Variable | Wajib | Contoh |
   | --- | --- | --- |
   | `DATABASE_URL` | ✅ | `postgresql://…?sslmode=require` — **tidak perlu diisi manual kalau memakai Vercel Postgres**, lihat catatan di bawah |
   | `SESSION_SECRET` | ✅ | hasil `openssl rand -base64 32` |
   | `CRON_SECRET` | ✅ | string acak; Vercel otomatis mengirimnya ke endpoint cron |
   | `APP_URL` | ✅ | `https://task-tracker-envilog.vercel.app` (dipakai sebagai link di pesan WA) |
   | `WA_PROVIDER` | | `fonnte`, `wablas`, atau `log` (default `log` = tidak mengirim) |
   | `WA_GROUP_ID` | | ID grup WA tujuan rekap harian |
   | `FONNTE_TOKEN` / `WABLAS_TOKEN` | | sesuai gateway yang dipakai |
   | `APP_TIMEZONE` | | default `Asia/Jakarta` |
   | `REMINDER_LEAD_DAYS` | | default `2` (H-2) |

3. Deploy. Cron sudah terdaftar lewat `vercel.json`:

   ```json
   { "path": "/api/cron/reminder", "schedule": "0 1 * * *" }
   ```

   Vercel Cron memakai UTC, jadi `0 1 * * *` = **08:00 WIB** setiap hari.
   Ubah angka jamnya kalau mau jam lain (mis. `0 0 * * *` = 07:00 WIB).

4. Jalankan sekali dari laptop untuk menyiapkan database produksi:

   ```bash
   DATABASE_URL="<url-produksi>" npm run db:setup
   DATABASE_URL="<url-produksi>" npm run db:seed
   ```

> **Catatan:** Vercel Hobby membatasi cron **1× per hari**. Skema saat ini
> memang butuh sekali sehari, jadi Hobby cukup.

### Kalau memakai Vercel Postgres

Buat database lewat tab **Storage** di project Vercel. Integrasinya menyuntikkan
env var sendiri ke project — biasanya `DATABASE_URL` dan/atau `POSTGRES_URL`.
Aplikasi membaca ketiga nama yang umum dipakai secara berurutan:

```
DATABASE_URL  →  POSTGRES_URL  →  POSTGRES_URL_NON_POOLING
```

jadi tidak perlu menyalin connection string secara manual. Yang tetap harus
diisi sendiri hanya `SESSION_SECRET`, `CRON_SECRET`, dan `APP_URL`.

Untuk menyiapkan tabel dan anggota tim, salin connection string dari tab
Storage lalu jalankan dari laptop:

```bash
DATABASE_URL="<connection string dari tab Storage>" npm run db:setup
DATABASE_URL="<connection string dari tab Storage>" npm run db:seed
```

> **TLS.** Driver `postgres` **tidak** membaca `sslmode=` dari connection
> string, jadi aplikasi menentukan sendiri: TLS diwajibkan untuk semua host
> selain `localhost`/`127.0.0.1`. Ini yang membuat koneksi ke Vercel Postgres,
> Neon, dan Supabase berhasil tanpa konfigurasi tambahan.

---

## Setup gateway WhatsApp

Aplikasi mendukung dua gateway. Selama `WA_PROVIDER` masih `log` (default),
tidak ada pesan yang dikirim — isi pesan hanya ditulis ke server log dan bisa
dilihat di halaman `/pengingat`. Ini mode aman untuk uji coba awal.

### Fonnte

1. Daftar di [fonnte.com](https://fonnte.com), sambungkan nomor WA yang akan
   jadi pengirim.
2. Salin **token device** ke `FONNTE_TOKEN`.
3. Untuk rekap grup: kirim satu pesan ke grup dari device tersebut, lalu ambil
   ID grup (`…@g.us`) dari dashboard Fonnte → isi ke `WA_GROUP_ID`.
4. Set `WA_PROVIDER=fonnte`.

### Wablas

1. Daftar di [wablas.com](https://wablas.com), scan QR untuk device pengirim.
2. Salin token ke `WABLAS_TOKEN`, dan domain server (mis.
   `https://sg.wablas.com`) ke `WABLAS_DOMAIN`.
3. Ambil `group_id` dari menu grup di dashboard → isi ke `WA_GROUP_ID`.
4. Set `WA_PROVIDER=wablas`.

### Menguji tanpa menunggu jam cron

```bash
# pratinjau saja, tidak mengirim
curl "https://<app>.vercel.app/api/cron/reminder?dry=1&key=<CRON_SECRET>"

# kirim betulan sekarang
curl "https://<app>.vercel.app/api/cron/reminder?key=<CRON_SECRET>"
```

Atau buka `/pengingat` di aplikasi (harus sudah login) untuk melihat pratinjau
yang sama dalam tampilan rapi.

---

## Mengelola anggota tim & PIN

Belum ada halaman admin (sesuai §4.4: semua user setara). Pengelolaan anggota
dilakukan lewat CLI dari laptop:

```bash
# tambah anggota baru / update nomor WA — PIN yang sudah ada TIDAK diubah
npm run db:seed

# sama seperti di atas, tapi PIN semua orang direset ke isi seed/team.json
npm run db:seed -- --reset-pin

# reset PIN satu orang saja
npm run team:pin -- "Budi" 4321
```

Menonaktifkan anggota yang keluar (tugasnya tetap tersimpan):

```sql
UPDATE users SET active = FALSE WHERE name = 'Nama Orang';
```

---

## Cara kerja pengingat

Setiap hari, cron memanggil `GET /api/cron/reminder`:

1. **Pengingat personal.** Semua tugas yang belum selesai (progress < 100% dan
   status ≠ "Selesai") dengan due date ≤ H-2 — termasuk yang sudah lewat —
   dikumpulkan per orang, lalu dikirim sebagai **satu pesan WA per orang**
   (bukan satu pesan per tugas, supaya tidak berisik). Diulang setiap hari
   sampai tugasnya selesai.

2. **Rekap harian ke grup.** Satu pesan berisi ringkasan semua orang
   (jumlah selesai, rata-rata progress, jumlah terlambat) plus daftar tugas
   yang lewat due date dan yang jatuh tempo ≤ 2 hari.

Setiap pengiriman dicatat di tabel `reminder_log` dengan *unique index* per
`(task_id, tanggal)` dan per `(tanggal)` untuk rekap — jadi kalau cron
ter-*retry* atau endpoint dipanggil dua kali, **tidak ada pesan dobel**.
Pengiriman yang gagal sengaja tidak dicatat, supaya bisa dicoba lagi.

Contoh pesan personal:

```
Halo Budi 👋
Pengingat tugas Envilog — 8 Agu 2026

🔴 *Kejar pembayaran customer telat*
   Telat 1 hari (7 Agu 2026)
   Target: 3 customer
   Progress: 0% · Proses
🟡 *Input data manifest harian*
   2 hari lagi (10 Agu 2026)
   Target: 30 AWB
   Progress: 0% · Proses

Update progress di: https://task-tracker-envilog.vercel.app
```

---

## Struktur kode

```
.github/workflows/ci.yml   CI: typecheck, build, dan uji skema SQL
db/schema.sql              Skema PostgreSQL (users, tasks, task_history, reminder_log)
scripts/                   CLI: setup skema, seed anggota tim, reset PIN
seed/team.example.json     Contoh daftar anggota tim
vercel.json                Jadwal cron harian

src/app/
  page.tsx                 Dashboard (server component)
  login/page.tsx           Halaman login
  pengingat/page.tsx       Pratinjau pesan WA (dry run, tidak mengirim)
  api/auth/…               Login & logout
  api/tasks/…              CRUD tugas + aturan "hanya pemilik yang boleh ubah"
  api/tasks/[id]/history/  Riwayat perubahan satu tugas (baca untuk semua)
  api/cron/reminder/       Endpoint yang dipanggil Vercel Cron

src/components/            Dashboard, kartu tugas, dialog tambah/ubah, timeline riwayat
src/lib/
  db.ts                    Koneksi PostgreSQL (lazy, aman untuk serverless)
  session.ts               Sesi JWT di cookie HttpOnly
  users.ts / tasks.ts      Query database
  reminder.ts              Logika pengingat + penyusunan pesan WA
  wa.ts                    Adapter gateway (Fonnte / Wablas / log)
  dates.ts                 Perhitungan tanggal zona Asia/Jakarta
```

---

## CI

Setiap push dan pull request menjalankan `.github/workflows/ci.yml` dengan dua
job paralel:

| Job | Isi | Kenapa |
| --- | --- | --- |
| **Typecheck & build** | `npm run typecheck` lalu `npm run build` | Sengaja dijalankan **tanpa** `DATABASE_URL`/`SESSION_SECRET` — koneksi database dibuat saat query pertama, jadi build wajib lolos tanpa env rahasia. Ini juga yang memastikan deploy Vercel tidak gagal. |
| **Skema & seed database** | `npm run db:setup` dan `npm run db:seed`, masing-masing 2×, terhadap service PostgreSQL 16 | `db/schema.sql` tidak tersentuh TypeScript, jadi SQL-nya dijalankan betulan. Dijalankan dua kali untuk membuktikan skema dan seed tetap aman kalau diulang. |

Jalankan pemeriksaan yang sama di lokal:

```bash
npm run typecheck
npm run build
```

---

## Catatan & batasan MVP

Hal-hal yang **sengaja** belum dikerjakan, sesuai keputusan di spek:

- **Halaman admin** — pengelolaan anggota lewat CLI, karena §4.4 memutuskan
  semua user setara dan daftar nama diisi manual di awal.
- **Update lewat WA** — tidak ada. Pengiriman satu arah saja (app → WA), sesuai
  §4.3.

Batasan teknis yang perlu diketahui:

- **PIN 4–8 angka bukan password kuat.** PIN disimpan sebagai hash bcrypt dan
  ada pembatas 6 percobaan gagal per 10 menit, tapi ini tetap cocoknya untuk
  data operasional internal tim kecil — bukan data sensitif.
- **Batas cron Vercel Hobby** 1× per hari. Kalau nanti perlu pengingat pagi dan
  sore, butuh paket Pro atau pemicu eksternal (mis. cron-job.org memanggil
  endpoint yang sama dengan `?key=<CRON_SECRET>`).
- **Nomor WA wajib diisi** di `seed/team.json`; kalau kosong, pengingat personal
  untuk orang tersebut dilewati dan dilaporkan di respons cron.
- Semua perhitungan tanggal memakai zona `Asia/Jakarta` (bisa diubah lewat
  `APP_TIMEZONE`), bukan zona server.

Kandidat lanjutan kalau uji coba minggu ini lancar: komentar per tugas, tugas
berulang, ekspor rekap mingguan, dan halaman admin.
