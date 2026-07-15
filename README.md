# ModernWeb CMS — Admin Panel

Panel admin untuk [ModernWeb CMS](../modernweb-cms). Next.js 16 (App Router) + React 19 + Tailwind v4, seluruh dashboard **client-side rendered**, dideploy ke Vercel di `cms.modernwebid.com`.

Panel ini tidak punya backend sendiri — semua data berasal dari API NestJS di `api.modernwebid.com`.

## Menjalankan

```bash
cp .env.example .env.local   # arahkan NEXT_PUBLIC_API_URL ke API
npm install
npm run dev                  # http://localhost:3000
```

API harus jalan lebih dulu, dan origin panel **wajib** terdaftar di `ADMIN_ORIGINS` milik API — kalau tidak, browser menolak mengirim cookie refresh dan setiap reload berakhir di `/login`.

| Di sini | Di repo API |
|---|---|
| `NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"` | `ADMIN_ORIGINS="http://localhost:3000"` |

## Desain

Sumber kebenaran: **[`design.md`](./design.md)** — token warna (primary `#00419c`), tipografi Poppins, bentuk, dan aturan komponen. Token diterapkan di blok `@theme` pada `app/globals.css` (Tailwind v4, tidak ada `tailwind.config.js`) dan dipakai lewat utility biasa: `bg-primary`, `text-muted`, `<Badge tone="success">`.

**Jangan menulis hex langsung di komponen.** Kalau sebuah nilai belum ada, tambahkan token-nya dulu lalu perbarui `design.md`.

## Arsitektur

```
layout.tsx  → Server Component: metadata noindex + Providers
  page.tsx  → wrapper tipis, hanya routing
    section → satu layar utuh, memegang data & state
      component → potongan UI yang dipakai ulang
```

- `app/` — rute. Root layout satu-satunya Server Component; sisanya `'use client'`.
- `sections/` — satu section per layar (`sections/entries/entry-editor-section.tsx`).
- `components/ui/` — primitif bergaya shadcn, ditulis langsung di repo agar bebas diedit.
- `lib/api/` — client fetch, hooks TanStack Query, tipe yang mencerminkan Prisma schema backend.

### Autentikasi

Access token hidup **di memory** dan dikirim sebagai `Authorization: Bearer`. Refresh token ada di **httpOnly cookie** yang di-set API — tidak terbaca JavaScript, jadi XSS tidak bisa mencurinya.

```
login   → Set-Cookie: mwc_rt (HttpOnly, SameSite=Lax, Path=/api/v1/auth)
          body: { accessToken } → memory
fetch   → Authorization: Bearer <access>
401     → POST /auth/refresh (credentials: include) → token baru → replay
reload  → memory kosong → tukar cookie jadi token sebelum memutuskan anonim
```

Karena cookie itu host-only milik `api.`, **proxy/middleware di `cms.` tidak bisa melihatnya**. `AuthGuard` karena itu hanya redirect demi UX — penegakan sesungguhnya ada di backend, yang memeriksa token di setiap request.

### Permission

`useCan(websiteId)` membaca `GET /websites/:id/me` dan menyembunyikan kontrol yang pasti ditolak. Ini **kosmetik**: `PermissionsGuard` di backend tetap satu-satunya gerbang.

### Tidak terindeks

Dua lapis: `robots: { index: false }` di `app/layout.tsx` (karena itu file tersebut harus tetap Server Component — `metadata` diabaikan di client component) dan `app/robots.ts` yang men-disallow semua crawler.

## Deploy (Vercel)

1. Set `NEXT_PUBLIC_API_URL="https://api.modernwebid.com/api/v1"`.
2. Di API produksi: `ADMIN_ORIGINS="https://cms.modernwebid.com"`, `COOKIE_SECURE=true`.
3. Arahkan CNAME `cms.modernwebid.com` ke Vercel.

> **Preview deployment**: URL `*.vercel.app` beda registrable domain dari `modernwebid.com`, jadi cookie `SameSite=Lax` tidak terkirim dan login gagal. Untuk memakai preview, tambahkan origin-nya ke `ADMIN_ORIGINS` dan set `COOKIE_SAMESITE=none` (butuh `COOKIE_SECURE=true`).
