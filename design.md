# Design System — ModernWeb CMS Admin

Sumber kebenaran untuk tampilan panel. Token di sini diterapkan di `app/globals.css` (blok `@theme`), lalu dipakai lewat utility Tailwind biasa (`bg-primary`, `text-muted`, …). **Jangan menulis warna hex langsung di komponen** — kalau sebuah nilai belum ada di sini, tambahkan dulu ke token.

Tema: **light, colorful**. Tidak ada dark mode (lihat [Keputusan](#keputusan)).

---

## 1. Warna

### Primary — `#00419c`

Skala di-anchor pada warna Anda di **700**, bukan 500, karena `#00419c` itu biru navy gelap: memakainya sebagai 500 akan membuat seluruh skala turunannya terlalu gelap untuk background dan border.

| Token | Hex | Dipakai untuk |
|---|---|---|
| `primary-50` | `#f0f6ff` | Latar item nav aktif, latar badge |
| `primary-100` | `#dbe9ff` | Latar hover halus, border badge |
| `primary-200` | `#b8d3ff` | Border pada state aktif |
| `primary-300` | `#85b5ff` | Ring fokus (di atas latar gelap) |
| `primary-400` | `#4790ff` | Aksen gradient |
| `primary-500` | `#0066ff` | Link, aksen terang |
| `primary-600` | `#0052cc` | Hover tombol primary |
| **`primary-700`** | **`#00419c`** | **Primary. Tombol, teks aktif, ring fokus** |
| `primary-800` | `#00337a` | Tombol primary ditekan |
| `primary-900` | `#00265c` | Heading di atas latar terang |
| `primary-950` | `#001738` | Teks paling pekat |

Alias semantik: `--color-primary` → `primary-700`, `--color-primary-fg` → putih.

### Netral (slate)

Memakai skala `slate` bawaan Tailwind, dialiaskan supaya niatnya jelas:

| Alias | Nilai | Dipakai untuk |
|---|---|---|
| `surface` | `#ffffff` | Kartu, sidebar, modal |
| `canvas` | `#f6f8fb` | Latar halaman di belakang kartu |
| `border` | `slate-200` | Semua garis pemisah |
| `foreground` | `slate-900` | Teks utama |
| `muted` | `slate-500` | Teks sekunder, label, hint |
| `faint` | `slate-400` | Placeholder, ikon nonaktif |

### Aksen (bagian "colorful")

Dipakai untuk status dan kategori — **bukan** dekorasi acak. Satu makna, satu warna, konsisten di seluruh panel:

| Token | Warna | Makna tetap |
|---|---|---|
| `success` | emerald-600 `#059669` | PUBLISHED, berhasil, aktif |
| `warning` | amber-600 `#d97706` | Wajib diisi, perlu perhatian |
| `danger` | rose-600 `#e11d48` | Hapus, error, gagal |
| `info` | sky-600 `#0284c7` | Netral-informasional, DRAFT |
| `violet` | violet-600 `#7c3aed` | Aksen kategori (mis. tipe field) |

Latar lembutnya: `success-soft`, `warning-soft`, `danger-soft`, `info-soft`, `violet-soft` (varian `-50`).

> **Aturan kontras**: teks di atas `primary-700` selalu putih (rasio 8.6:1 ✓). Teks aksen selalu varian `-700`/`-800` di atas latar `-50`, jangan `-600` di atas putih untuk teks kecil.

---

## 2. Tipografi

Font tunggal: **Poppins**, dimuat lewat `next/font/google` sebagai variabel CSS.

```css
font-family: var(--font-poppins), "Poppins", sans-serif;
```

| Peran | Ukuran / bobot | Utility |
|---|---|---|
| Judul halaman | 20px / 600 | `text-xl font-semibold` |
| Judul section & kartu | 14px / 600 | `text-sm font-semibold` |
| Body | 14px / 400 | `text-sm` |
| Label form | 13px / 500 | `text-[13px] font-medium` |
| Hint / caption | 12px / 400 | `text-xs text-muted` |
| Angka statistik | 30px / 700 | `text-3xl font-bold tabular-nums` |
| Kode, slug, key | 12px / mono | `font-mono text-xs` |

Poppins punya x-height besar dan terasa lebih tebal dari Geist — **jangan** pakai bobot 700 untuk teks body, cukup 600 untuk penegasan.

---

## 3. Bentuk & elevasi

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `rounded-lg` | 10px | Kartu, input, tombol |
| `rounded-xl` | 14px | Kartu besar, panel |
| `rounded-2xl` | 20px | Kartu login |
| `shadow-card` | `0 1px 2px rgb(15 23 42 / .06)` | Kartu diam |
| `shadow-pop` | `0 8px 24px -6px rgb(15 23 42 / .12)` | Modal, dropdown, kartu hover |
| `shadow-auth` | `0 16px 40px -12px rgb(0 65 156 / .18)` | Kartu login |

`shadow-auth` diwarnai hue primary dan sengaja ringan: latar login itu gradient pucat, dan bayangan netral yang pekat di atasnya terbaca sebagai noda abu-abu, bukan sebagai ketinggian.

Tinggi kontrol tetap **36px** (`h-9`) untuk tombol dan input agar sejajar dalam satu baris.

---

## 4. Latar grid (halaman login)

Gradient colorful + overlay grid, sesuai spesifikasi Anda. Grid `position: fixed` dan `z-0`; konten wajib `relative z-10` atau akan tertimpa.

```css
.grid-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-image:
    linear-gradient(to right, #ffffff89 1px, transparent 1px),
    linear-gradient(to bottom, #ffffff89 1px, transparent 1px);
  background-size: 32px 32px;
  -webkit-mask-image: radial-gradient(ellipse 80% 80% at 100% 0%, #000 50%, transparent 90%);
  mask-image: radial-gradient(ellipse 80% 80% at 100% 0%, #000 50%, transparent 90%);
}
```

Grid putih itu **hanya terlihat di atas area yang berwarna** — di atas putih ia tidak ada. Latarnya:

```css
.auth-gradient {
  background: radial-gradient(125% 125% at 50% 90%, #fff 40%, #7bb2ff 100%);
}
```

Putih memancar dari bawah-tengah dan menjadi biru muda di tepi atas. Ini berpasangan dengan mask grid yang memudar dari **kanan atas**: justru di sanalah latar paling biru, jadi grid tampil di pojok itu dan lenyap saat mendekati bagian putih. Kalau gradient ini diganti jadi terang menyeluruh, grid akan hilang total.

Urutannya: `.auth-gradient` (latar) → `.grid-bg` (overlay) → kartu (`relative z-10`).

---

## 5. Layout

### Shell setelah login

```
┌──────────┬────────────────────────────────┐
│ sidebar  │ topbar: judul + aksi           │
│ 264px    ├────────────────────────────────┤
│ surface  │ canvas, padding 24px           │
│ border-r │   konten (kartu di atas canvas)│
│          │                                │
│ ──────── │                                │
│ user     │                                │
└──────────┴────────────────────────────────┘
```

- **Sidebar** `w-64` (264px), `bg-surface`, `border-r`, tinggi penuh, tidak ikut scroll.
  - Header logo `h-[72px] px-6` — wordmark 247×72 dirender 152px lebar.
  - Nav `px-4 py-3`; item: ikon 16px + label 14px, `rounded-lg`, tinggi 36px.
  - **Item aktif**: `bg-primary-50 text-primary-700 font-medium` + garis kiri 3px `bg-primary-700`.
  - Blok user menempel di bawah (`mt-auto`), `p-4`, dipisah `border-t`.
- **Topbar** = `PageHeader`, `bg-surface`, `border-b`, `py-5`, memuat judul halaman + aksi utama di kanan.
- **Konten** `px-5 py-6 lg:px-8` di atas `bg-canvas` supaya kartu putih punya kontras.

> `PageHeader` full-bleed lewat margin negatif (`-mx-5 lg:-mx-8`) yang **mencerminkan padding `<main>`**. Kalau salah satu diubah, yang lain wajib ikut — kalau tidak, bar-nya berhenti sebelum tepi.

Di bawah `lg`, sidebar jadi drawer (off-canvas) dengan tombol hamburger di topbar.

### Kartu login

Logo wordmark (168px) berdiri **di atas backdrop, di luar kartu**, lalu kartu putih terpusat: `max-w-[420px]`, `rounded-2xl`, `shadow-auth`, padding 32px, di atas `.auth-gradient` + `.grid-bg`.

---

## 6. Komponen

| Komponen | Aturan |
|---|---|
| `Button primary` | `bg-primary text-white`, hover `primary-600`, aktif `primary-800` |
| `Button secondary` | `bg-surface border`, hover `bg-slate-50` |
| `Button ghost` | transparan, hover `bg-slate-100` |
| `Button danger` | `bg-danger text-white` |
| `Input` | `h-9 rounded-lg border`, fokus `ring-2 ring-primary-700/20 border-primary-700` |
| `Card` | `bg-surface rounded-xl border shadow-card` |
| `Badge` | `rounded-full px-2 py-0.5 text-xs font-medium`, warna dari tabel aksen |
| `Modal` | `rounded-xl shadow-pop`, backdrop `bg-primary-950/40 backdrop-blur-sm` |

**Fokus wajib terlihat**: setiap kontrol interaktif memakai `focus-visible:ring-2 ring-primary-700/40`. Jangan hapus outline tanpa gantinya.

---

## Keputusan

1. **Primary di-anchor pada 700, bukan 500.** `#00419c` adalah navy gelap; kalau ia jadi 500, skala 600–900 turun ke hampir hitam dan tidak ada nilai terang untuk latar/border.
2. **Tidak ada dark mode.** Anda meminta tema light colorful. `globals.css` bawaan sempat punya blok `prefers-color-scheme: dark` yang hanya menukar dua variabel dan tidak pernah dipakai komponen — itu dihapus, bukan dibiarkan setengah jadi.
3. **Elemen di gambar referensi yang tidak didukung backend tidak dibuat**: "Sign in with Google" (tidak ada OAuth), "Forgot password" (tidak ada alur reset), "Remember me" (masa sesi ditentukan `JWT_REFRESH_EXPIRES_IN`), "Sign up" (panel admin tidak boleh registrasi mandiri). Bahasa visualnya diikuti; tombol yang tidak melakukan apa-apa tidak.
4. **Toggle lihat/sembunyikan password diambil** dari referensi — ini satu-satunya elemen tambahan di gambar itu yang benar-benar berfungsi.
5. **Warna aksen terikat makna, bukan hiasan.** "Colorful" datang dari status yang berwarna konsisten (PUBLISHED hijau, DRAFT biru, wajib kuning) dan gradient login — bukan dari mewarnai elemen secara acak.
6. **Logo adalah wordmark 247×72**, bukan ikon persegi. Ia dipakai utuh di header sidebar; jangan dipaksa masuk kotak avatar seperti pada gambar referensi.
