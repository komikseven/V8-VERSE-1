# KOMIKU — Setup Halaman Baru

## File yang ditambahkan

```
app/genre/page.tsx          → halaman Explore (Jenis + Genre)
app/genre/[slug]/page.tsx   → halaman filter per genre/type
app/favorit/page.tsx        → halaman Favorit (localStorage)
app/history/page.tsx        → halaman Riwayat Baca (localStorage)
app/api/genres/route.ts     → API route genres dengan Redis cache
lib/redis.ts                → Redis cache utility
.env.local.example          → contoh env vars
```

## Install Redis (ioredis)

```bash
pnpm add ioredis
# atau
npm install ioredis
```

## Setup Redis lokal (development)

```bash
# macOS
brew install redis && brew services start redis

# Ubuntu/Debian
sudo apt install redis-server && sudo systemctl start redis

# Docker (paling simpel)
docker run -d -p 6379:6379 redis:alpine
```

Lalu buat file `.env.local`:
```
REDIS_URL=redis://localhost:6379
```

## Production (Vercel + Upstash — gratis)

1. Daftar di https://upstash.com
2. Buat database Redis → salin URL
3. Di Vercel dashboard → Settings → Environment Variables
4. Tambah `REDIS_URL=rediss://...` (URL dari Upstash)

## Alur Cache

```
Browser → Next.js API Route → Redis (hit?) → return cache
                                    ↓ miss
                             WordPress API → simpan ke Redis → return
```

TTL default:
- Genres: 6 jam
- Series: 2 jam  
- Home: 5 menit
- Chapters: 10 menit

## Favorit & History

Keduanya menggunakan **localStorage** (sudah ada di `lib/storage.ts`).
Data tersimpan di browser masing-masing pengguna.
Sinkronisasi antar tab otomatis via `storage` event.
