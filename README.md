# Nera AI

Nera AI adalah aplikasi chat AI Android berbasis React, Vite, dan Capacitor.

## Identitas aplikasi

- App name: `Nera AI`
- Android package: `com.axynera.neraai`
- API: `https://api.axynera.my.id/v1/chat/completions`
- SDK docs: `https://sdk.axynera.my.id`
- SDK runtime pinned: `https://sdk.axynera.my.id/v/0.3.0/axynera.mjs`
- Model default: `Nera-V4`

## Build APK manual di GitHub

Workflow hanya memakai `workflow_dispatch`, jadi build tidak berjalan otomatis saat push.

1. Buka tab **Actions**.
2. Pilih **Build Nera AI APK**.
3. Tekan **Run workflow**.
4. Setelah selesai, unduh artifact **Nera-AI-APK**.

## Login Google

Source memakai `@capgo/capacitor-social-login` untuk Google Sign-In.

Tambahkan repository secret:

`VITE_GOOGLE_WEB_CLIENT_ID`

Isi dengan OAuth Client ID tipe **Web application** dari Google Cloud. Untuk Android, buat juga OAuth Client tipe **Android** dengan package `com.axynera.neraai` dan SHA-1 sertifikat APK yang digunakan.

> Jangan masukkan client secret atau signing keystore ke source repository.

## Axynera SDK v0.3.0

Aplikasi sekarang memakai SDK resmi Axynera yang dipin ke versi `0.3.0` agar update runtime terbaru tidak mengubah perilaku aplikasi secara mendadak.

Method yang disiapkan melalui `src/api.js`:

- `chat()`
- `stream()`
- `vision()`
- `search()`
- `inspectWeb()`
- `sandbox()`
- `createFile()`
- `saveToDrive()`
- `models()`
- `identity()`
- `conversation()`

`createFile()` dan `saveToDrive()` tetap dianggap backend-dependent sampai pipeline sandbox → binary file → Google Drive selesai end-to-end di backend Axynera.

OpenAI compatibility tetap tersedia di `POST https://api.axynera.my.id/v1/chat/completions`, dan Anthropic compatibility di `POST https://api.axynera.my.id/v1/messages`.

## Permission Android

Workflow menambahkan permission berikut saat project Android dibuat:

- Internet dan network state
- Kamera
- Mikrofon
- Notifikasi
- Foto, video, dan audio melalui izin media Android modern

Akses file umum memakai Android system file picker, bukan `MANAGE_EXTERNAL_STORAGE`. Akses aplikasi lain menggunakan Intent/queries yang diperlukan, bukan `QUERY_ALL_PACKAGES` global.

## Development

```bash
npm install
npm run dev
```

Build web:

```bash
npm run build
```
