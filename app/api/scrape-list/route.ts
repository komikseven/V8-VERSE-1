import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const SITE_BASE = "https://komik7.my.id"

function decodeHtml(text: string): string {
  return (text || "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&#8217;/g, "'").replace(/&#8211;/g, "-").replace(/&nbsp;/g, " ")
}

/**
 * Scrape halaman list komik dari komik7.my.id
 * Support: /genres/[slug]/ dan /manga/?type=Manhwa
 *
 * Struktur kartu di HTML:
 *   <div class="..."> ... <a href="https://komik7.my.id/manga/[slug]/" ...>
 *     <img ... title="Komik XYZ" ...>
 *     <span class="...">Manhwa</span>
 *   </a>
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const targetUrl = searchParams.get("url")
  if (!targetUrl) return NextResponse.json({ series: [], totalPages: 1 })

  try {
    const res = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 1800 },
    })
    if (!res.ok) return NextResponse.json({ series: [], totalPages: 1 })
    const html = await res.text()

    // Parse kartu series
    // Pola: href="/manga/[slug]/" diikuti img dengan title="..."
    const seen = new Set<string>()
    const series: Array<{
      id: number; name: string; slug: string; count: number;
      thumbnail?: string; mangaType?: string
    }> = []

    // Match tiap blok kartu: href manga + img title + opsional type span
    const cardRegex = /href="https?:\/\/komik7\.my\.id\/manga\/([^/]+)\/"[^>]*>[\s\S]*?<img[^>]+title="([^"]+)"[\s\S]*?(?:href="[^"]*\?[^"]*type=(Manga|Manhwa|Manhua)[^"]*"|<\/a>)/gi
    let m: RegExpExecArray | null
    while ((m = cardRegex.exec(html)) !== null) {
      const slug = m[1]
      const rawName = decodeHtml(m[2])
      const mangaType = m[3] || undefined
      if (!slug || slug === "manga" || seen.has(slug)) continue
      seen.add(slug)
      series.push({
        id: series.length + 1,
        name: rawName.replace(/^Komik\s+/i, ""),
        slug,
        count: 0,
        mangaType,
      })
    }

    // Fallback parser kalau regex di atas tidak match (pola HTML berbeda)
    if (series.length === 0) {
      const hrefMatches = [...html.matchAll(/href="(https?:\/\/komik7\.my\.id\/manga\/([^/]+)\/)"[^>]*>\s*<img[^>]+title="([^"]+)"/gi)]
      for (const hm of hrefMatches) {
        const slug = hm[2]
        const rawName = decodeHtml(hm[3])
        if (!slug || slug === "manga" || seen.has(slug)) continue
        seen.add(slug)
        series.push({ id: series.length + 1, name: rawName.replace(/^Komik\s+/i, ""), slug, count: 0 })
      }
    }

    // Deteksi total pages dari pagination
    // Cari angka page terbesar di link pagination
    const pageNums = [...html.matchAll(/\/page\/(\d+)\//g)].map(pm => parseInt(pm[1]))
    const maxPage = pageNums.length > 0 ? Math.max(...pageNums) : 1
    // Cek apakah ada "next page" link
    const currentPageMatch = targetUrl.match(/\/page\/(\d+)/)
    const currentPage = currentPageMatch ? parseInt(currentPageMatch[1]) : 1
    const totalPages = Math.max(maxPage, currentPage)

    return NextResponse.json({ series, totalPages })
  } catch (e) {
    console.error("scrape-list error:", e)
    return NextResponse.json({ series: [], totalPages: 1 })
  }
}
