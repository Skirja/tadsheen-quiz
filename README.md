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

---

# Quiz Builder

Web application for creating and taking quizzes with multi-language support (English and Arabic).

## Main Features

- User authentication (email/password and Google)
- Quiz creation with various question types:
  - Single choice
  - Multiple choice
  - Long answer
- Quiz management (edit, delete, preview)
- Quiz taking with scoring system
- Quiz statistics
- Quiz sharing via URL
- English and Arabic language support (RTL)
- Dark/light mode

## Technologies Used

- Next.js 14 (App Router)
- Supabase (Database and Authentication)
- Tailwind CSS
- Shadcn UI
- TypeScript

## Prerequisites

Before running this project, make sure you have installed and configured:

- [Node.js (version 18.17 or higher)](https://nodejs.org/en/download)
- npm or pnpm
- [Git](https://git-scm.com/downloads)
- [Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Google Console Project](https://console.cloud.google.com/)

## Installation Steps

1. Clone this repository:
```bash
git clone <repository-url>
cd tadsheen-quiz
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

4. Set environment variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Setup Supabase database:
   
   a. Setup Supabase CLI:
   ```bash
   # Install Supabase CLI
   npx supabase init
   
   # Login to Supabase
   npx supabase login
   
   # Link with your Supabase project
   npx supabase link
   
   # Push database migrations
   npx supabase db push
   ```
   The migrations will automatically create:
   - Database structure
   - Storage bucket for image uploads
   - RLS (Row Level Security) policies
   
   b. Setup Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing one
   - Enable Google OAuth API in "APIs & Services > Library"
   - Create Credentials in "APIs & Services > Credentials"
   - Select "OAuth 2.0 Client ID"
   - Choose Application Type: "Web Application"
   - Add Authorized redirect URIs:
     ```
     https://<PROJECT_ID>.supabase.co/auth/v1/callback
     ```
     (Replace <PROJECT_ID> with your Supabase project ID)
   - Copy Client ID and Client Secret
   - Open Supabase dashboard, go to Authentication > Providers
   - Enable Google provider
   - Enter Client ID and Client Secret from Google Cloud Console

6. Configure Next.js for Image Upload:
   - Create `next.config.mjs` in project root
   - Add the following configuration to handle images from Supabase storage:
   ```javascript
   import createNextIntlPlugin from 'next-intl/plugin';

   const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

   /** @type {import('next').NextConfig} */
   const nextConfig = {
       images: {
           remotePatterns: [
               {
                   protocol: 'https',
                   hostname: '[PROJECT_ID].supabase.co', // Replace [PROJECT_ID] with your Supabase project ID
                   pathname: '/storage/v1/object/public/**',
               },
           ],
       },
   };

   export default withNextIntl(nextConfig);
   ```
   - Replace `[PROJECT_ID]` with your Supabase project ID (example: kbmdzgdrbmueewwhsmth)

## Running the Application

1. Development mode:
```bash
npm run dev
# or
pnpm dev
```

2. Open browser and access [http://localhost:3000](http://localhost:3000)

## Project Structure

```
tadsheen-quiz/
├── app/                    # Next.js app router
│   ├── [locale]/          # Language-based routing
│   ├── (dashboard)/       # Dashboard pages (protected)
│   └── api/               # API routes
├── components/            # React components
├── messages/              # Translation files (en.json, ar.json)
├── public/               # Static assets
├── styles/              # CSS files
├── supabase/            # Supabase migrations and types
└── utils/               # Utility functions
```

---

<div dir="rtl">

# منشئ الاختبارات

تطبيق ويب لإنشاء وإجراء الاختبارات مع دعم متعدد اللغات (الإنجليزية والعربية).

## الميزات الرئيسية

- مصادقة المستخدم (البريد الإلكتروني/كلمة المرور وجوجل)
- إنشاء اختبارات بأنواع مختلفة من الأسئلة:
  - اختيار واحد
  - اختيار متعدد
  - إجابة طويلة
- إدارة الاختبارات (تعديل، حذف، معاينة)
- إجراء الاختبارات مع نظام التقييم
- إحصائيات الاختبارات
- مشاركة الاختبارات عبر الرابط
- دعم اللغتين الإنجليزية والعربية (RTL)
- الوضع الداكن/الفاتح

## التقنيات المستخدمة

- Next.js 14 (App Router)
- Supabase (قاعدة البيانات والمصادقة)
- Tailwind CSS
- Shadcn UI
- TypeScript

## المتطلبات الأساسية

قبل تشغيل هذا المشروع، تأكد من تثبيت وتكوين ما يلي:

- [Node.js (الإصدار 18.17 أو أعلى)](https://nodejs.org/en/download)
- npm أو pnpm
- [Git](https://git-scm.com/downloads)
- [Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Google Console Project](https://console.cloud.google.com/)

## خطوات التثبيت

1. استنساخ المستودع:
```bash
git clone <repository-url>
cd tadsheen-quiz
```

2. تثبيت التبعيات:
```bash
npm install
# أو
pnpm install
```

3. نسخ ملف `.env.example` إلى `.env.local`:
```bash
cp .env.example .env.local
```

4. تعيين متغيرات البيئة في `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. إعداد قاعدة بيانات Supabase:
   
   أ. إعداد Supabase CLI:
   ```bash
   # تثبيت Supabase CLI
   npx supabase init
   
   # تسجيل الدخول إلى Supabase
   npx supabase login
   
   # ربط مع مشروع Supabase الخاص بك
   npx supabase link
   
   # دفع ترحيلات قاعدة البيانات
   npx supabase db push
   ```
   سيقوم الترحيل تلقائياً بإنشاء:
   - هيكل قاعدة البيانات
   - مخزن للصور
   - سياسات أمان الصفوف (RLS)
   
   ب. إعداد مصادقة Google:
   - افتح [Google Cloud Console](https://console.cloud.google.com/)
   - أنشئ مشروعاً جديداً أو اختر مشروعاً موجوداً
   - فعّل Google OAuth API في "APIs & Services > Library"
   - أنشئ بيانات الاعتماد في "APIs & Services > Credentials"
   - اختر "OAuth 2.0 Client ID"
   - اختر نوع التطبيق: "Web Application"
   - أضف عناوين URL إعادة التوجيه المصرح بها:
     ```
     https://<PROJECT_ID>.supabase.co/auth/v1/callback
     ```
     (استبدل <PROJECT_ID> بمعرف مشروع Supabase الخاص بك)
   - انسخ معرف العميل والسر
   - افتح لوحة تحكم Supabase، انتقل إلى Authentication > Providers
   - فعّل مزود Google
   - أدخل معرف العميل والسر من Google Cloud Console

6. تكوين Next.js لتحميل الصور:
   - أنشئ ملف `next.config.mjs` في جذر المشروع
   - أضف التكوين التالي للتعامل مع الصور من مخزن Supabase:
   ```javascript
   import createNextIntlPlugin from 'next-intl/plugin';

   const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

   /** @type {import('next').NextConfig} */
   const nextConfig = {
       images: {
           remotePatterns: [
               {
                   protocol: 'https',
                   hostname: '[PROJECT_ID].supabase.co', // استبدل [PROJECT_ID] بمعرف مشروع Supabase الخاص بك
                   pathname: '/storage/v1/object/public/**',
               },
           ],
       },
   };

   export default withNextIntl(nextConfig);
   ```
   - استبدل `[PROJECT_ID]` بمعرف مشروع Supabase الخاص بك (مثال: kbmdzgdrbmueewwhsmth)

## تشغيل التطبيق

1. وضع التطوير:
```bash
npm run dev
# أو
pnpm dev
```

2. افتح المتصفح وانتقل إلى [http://localhost:3000](http://localhost:3000)

## هيكل المشروع

```
tadsheen-quiz/
├── app/                    # مسار تطبيق Next.js
│   ├── [locale]/          # التوجيه حسب اللغة
│   ├── (dashboard)/       # صفحات لوحة التحكم (محمية)
│   └── api/               # مسارات API
├── components/            # مكونات React
├── messages/              # ملفات الترجمة (en.json, ar.json)
├── public/               # الأصول الثابتة
├── styles/              # ملفات CSS
├── supabase/            # ترحيلات وأنواع Supabase
└── utils/               # وظائف المساعدة
```

</div>
