# TEST API — Sinopsis, Thumbnail, Type Komik

## Cara Test Langsung di Browser

Buka URL ini di browser (ganti slug sesuai komik yang mau dicek):

```
https://komiku-v8-fixed.vercel.app/api/scrape-detail?slug=komik-star-martial-god-technique
```

Atau test di **Console browser** saat buka situs KOMIKU:

```javascript
// Test 1 komik — ganti slug sesuai kebutuhan
fetch('/api/scrape-detail?slug=komik-star-martial-god-technique')
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d, null, 2)))
```

---

## Cara Kerja Scraper (lib/api.ts → scrapeSeriesDetail)

Sumber: `https://komik7.my.id/manga/[slug]/`

### Thumbnail
```
Regex: /!\[[^\]]*\]\((https?:\/\/[^\s)"]+\.(?:jpg|jpeg|png|webp))/i
Ambil: gambar pertama di body halaman ![alt](url.jpg)
BUKAN dari og:image — karena banyak komik pakai logo situs
Contoh hasil: https://komik7.my.id/wp-content/uploads/2026/02/1771768845-7253-i370961.jpg
```

### Type Komik
```
Regex: /Tipe\s*\[(Manga|Manhwa|Manhua)\]/i
Ambil: teks di "Tipe [Manhwa](...)" di halaman
Hasil: "Manga" | "Manhwa" | "Manhua"
```

### Sinopsis
```
Regex: /##\s*Sinopsis[^\n]*\n+([^#\n][^\n]+)/i
Ambil: paragraf di bawah heading "## Sinopsis Komik ..."
Fallback: meta-description (jika bukan deskripsi situs)
```

### Score, Status, Author, Genre
```
Score  → /Bookmark\s*\n+(\d+(?:\.\d+)?)\s*\n/i
Status → /Status\s*\*(Ongoing|Completed|Hiatus)\*/i
Author → /\*\*Penulis\*\*\s+([^\n\[]+?)(?:\s*\[|\s*\n)/i
Genre  → /\[([A-Za-z ]+)\]\(https?:\/\/[^)]*\/genres\/[^)]+\)/gi
```

---

## Hasil Test Real (Star Martial God Technique)

```json
{
  "thumbnail": "https://komik7.my.id/wp-content/uploads/2026/02/1771768845-7253-i370961.jpg",
  "mangaType": "Manhua",
  "sinopsis": "Star Martial God Technique menceritakan perjalanan Lin Ming, seorang pemuda berbakat yang berasal dari sebuah klan kecil namun memiliki tekad kuat untuk menjadi pendekar terkuat di dunia...",
  "score": "6.7",
  "status": "Ongoing",
  "author": "Mad Snail",
  "artist": "RuoHong Culture",
  "genres": ["Action", "Adventure", "Drama", "Fantasy", "Harem", "Romance", "Shounen"]
}
```

## Hasil Test Real (Clever Cleaning Life)

```json
{
  "thumbnail": "https://komik7.my.id/wp-content/uploads/2026/02/1771947812-4608-i478596.jpg",
  "mangaType": "Manhwa",
  "sinopsis": "Cerita ini mengikuti perjalanan seorang pemburu jenius yang kembali setelah lama menghilang...",
  "score": "6.7",
  "status": "Ongoing",
  "author": "Dalbeat",
  "artist": "GoilGoil",
  "genres": ["Action", "Comedy", "Shounen", "Supernatural"]
}
```

---

## Catatan Penting

| Hal | Keterangan |
|-----|------------|
| og:image | TIDAK dipakai untuk thumbnail — isinya logo situs |
| Body img | Sumber thumbnail yang benar — gambar pertama di halaman |
| Markdown format | Fetch Next.js mengembalikan teks markdown, bukan raw HTML |
| Bug lama | Regex pecah multi-line karena komentar // berisi contoh teks |
| Fix | Regex thumbnail: `[^\s)"]+` bukan `[^\s)]+` (ada spasi sebelum "title") |
