# Quiz Builder

Aplikasi web untuk membuat dan mengerjakan kuis dengan dukungan multi-bahasa (Inggris dan Arab).

## Fitur Utama

- Autentikasi pengguna (email/password dan Google)
- Pembuatan kuis dengan berbagai tipe soal:
  - Pilihan ganda (single choice)
  - Pilihan ganda (multiple choice)
  - Jawaban panjang (long answer)
- Manajemen kuis (edit, hapus, preview)
- Pengerjaan kuis dengan sistem scoring
- Statistik pengerjaan kuis
- Berbagi kuis melalui URL
- Dukungan bahasa Inggris dan Arab (RTL)
- Mode gelap/terang

## Teknologi yang Digunakan

- Next.js 14 (App Router)
- Supabase (Database dan Autentikasi)
- Tailwind CSS
- Shadcn UI
- TypeScript

## Prasyarat


Sebelum menjalankan proyek ini, pastikan Anda telah menginstal dan konfigurasi ini:

- [Node.js (versi 18.17 atau lebih tinggi)](https://nodejs.org/en/download)
- npm atau pnpm
- [Git](https://git-scm.com/downloads)
- [Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Google Console Project](https://console.cloud.google.com/)

## Langkah Instalasi

1. Clone repositori ini:
```bash
git clone <repository-url>
cd tadsheen-quiz
```

2. Instal dependensi:
```bash
npm install
# atau
pnpm install
```

3. Ubah file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

4. Atur variabel lingkungan di `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Setup database Supabase:
   
   a. Setup Supabase CLI:
   ```bash
   # Install Supabase CLI
   npx supabase init
   
   # Login ke Supabase
   npx supabase login
   
   # Link dengan proyek Supabase Anda
   npx supabase link
   
   # Push migrasi database
   npx supabase db push
   ```
   Migrasi akan otomatis membuat:
   - Struktur database
   - Storage bucket untuk upload gambar
   - RLS (Row Level Security) policies
   
   b. Setup Google OAuth:
   - Buka [Google Cloud Console](https://console.cloud.google.com/)
   - Buat project baru atau pilih project yang sudah ada
   - Aktifkan Google OAuth API di "APIs & Services > Library"
   - Buat Credentials di "APIs & Services > Credentials"
   - Pilih "OAuth 2.0 Client ID"
   - Pilih Application Type: "Web Application"
   - Tambahkan Authorized redirect URIs:
     ```
     https://<PROJECT_ID>.supabase.co/auth/v1/callback
     ```
     (Ganti <PROJECT_ID> dengan ID proyek Supabase Anda)
   - Salin Client ID dan Client Secret
   - Buka dashboard Supabase, masuk ke Authentication > Providers
   - Aktifkan Google provider
   - Masukkan Client ID dan Client Secret dari Google Cloud Console

6. Konfigurasi Next.js untuk Image Upload:
   - Buat file `next.config.mjs` di root proyek
   - Tambahkan konfigurasi berikut untuk menangani image dari Supabase storage:
   ```javascript
   import createNextIntlPlugin from 'next-intl/plugin';

   const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

   /** @type {import('next').NextConfig} */
   const nextConfig = {
       images: {
           remotePatterns: [
               {
                   protocol: 'https',
                   hostname: '[PROJECT_ID].supabase.co', // Ganti [PROJECT_ID] dengan ID proyek Supabase Anda
                   pathname: '/storage/v1/object/public/**',
               },
           ],
       },
   };

   export default withNextIntl(nextConfig);
   ```
   - Ganti `[PROJECT_ID]` dengan ID proyek Supabase Anda (contoh: kbmdzgdrbmueewwhsmth)

## Menjalankan Aplikasi

1. Mode development:
```bash
npm run dev
# atau
pnpm dev
```

2. Buka browser dan akses [http://localhost:3000](http://localhost:3000)

## Struktur Proyek

```
tadsheen-quiz/
├── app/                    # Next.js app router
│   ├── [locale]/          # Routing berdasarkan bahasa
│   ├── (dashboard)/       # Halaman dashboard (protected)
│   └── api/               # API routes
├── components/            # React components
├── messages/              # File terjemahan (en.json, ar.json)
├── public/               # Asset statis
├── styles/              # File CSS
├── supabase/            # Migrasi dan tipe Supabase
└── utils/               # Fungsi utilitas
```
