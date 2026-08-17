# Nera AI

Nera AI adalah aplikasi chat AI Android berbasis React, Vite, dan Capacitor.

## Identitas aplikasi

- App name: `Nera AI`
- Android package: `com.axynera.neraai`
- API: `https://api.axynera.my.id/v1/chat/completions`
- SDK docs: `https://sdk.axynera.my.id`
- Model default: `Nera-V4`

## Build APK manual di GitHub

Workflow hanya memakai `workflow_dispatch`, jadi build tidak berjalan otomatis saat push.

1. Buka tab **Actions**.
2. Pilih **Build Nera AI APK**.
3. Tekan **Run workflow**.
4. Setelah selesai, unduh artifact **Nera-AI-APK**.

## Login Google

Source sudah memakai `@capgo/capacitor-social-login` untuk Google Sign-In.

Tambahkan repository secret:

`VITE_GOOGLE_WEB_CLIENT_ID`

Isi dengan OAuth Client ID tipe **Web application** dari Google Cloud. Untuk Android, buat juga OAuth Client tipe **Android** dengan package `com.axynera.neraai` dan SHA-1 sertifikat APK yang digunakan.

> Jangan masukkan client secret atau signing keystore ke source repository.

## Axynera SDK

Aplikasi direncanakan memakai SDK resmi dari `https://sdk.axynera.my.id`. Integrasi method SDK akan dipasang sesuai dokumentasi resmi agar tidak mengandalkan API yang ditebak. Sampai dokumentasi SDK dapat diakses, `src/api.js` tetap menjadi fallback REST ke endpoint resmi Axynera.

## Permission Android

Workflow menambahkan permission berikut saat project Android dibuat:

- Internet dan network state
- Kamera
- Mikrofon
- Notifikasi
- Foto, video, dan audio melalui izin media Android modern

Akses file umum sebaiknya memakai Android system file picker, bukan `MANAGE_EXTERNAL_STORAGE`. Akses daftar semua aplikasi juga tidak diberikan secara global karena Android/Google Play membatasinya.

## Development

```bash
npm install
npm run dev
```

Build web:

```bash
npm run build
```
