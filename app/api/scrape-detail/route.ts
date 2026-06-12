import { NextRequest, NextResponse } from "next/server"
import { cached, TTL } from "@/lib/redis"

export const runtime = "nodejs"
export const revalidate = 0

const SITE_BASE = "https://komik7.my.id"

function decodeHtml(text: string): string {
  return (text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "-")
    .replace(/&nbsp;/g, " ")
}

async function scrapeDetail(slug: string) {
  const url = `${SITE_BASE}/manga/${slug}/`
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 3600 },
  })
  if (!res.ok) return {}
  const html = await res.text()

  // 1. Thumbnail — dari og:image
  let thumbnail: string | undefined
  const ogImageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)
  if (ogImageMatch) thumbnail = ogImageMatch[1]

  // 2. Type — dari link filter ?order=title&type=Manhwa
  let mangaType: string | undefined
  const typeMatch = html.match(/\?order=title&(?:amp;)?type=(Manga|Manhwa|Manhua)/i)
  if (typeMatch) mangaType = typeMatch[1]
  if (!mangaType) {
    const tipeTeksMatch = html.match(/Tipe\s*<[^>]+>(Manga|Manhwa|Manhua)<\/a>/i)
    if (tipeTeksMatch) mangaType = tipeTeksMatch[1]
  }

  // 3. Sinopsis — teks di bawah <h2>Sinopsis...</h2>
  let sinopsis: string | undefined
  const sinopsisBlockMatch = html.match(
    /(?:Sinopsis|Synopsis)[^<]*<\/h[23]>\s*([\s\S]*?)(?=<h[23]|<div class="chapter|<section|<div id="chapter)/i
  )
  if (sinopsisBlockMatch) {
    sinopsis = sinopsisBlockMatch[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    sinopsis = decodeHtml(sinopsis)
    if (sinopsis.length < 10) sinopsis = undefined
  }
  if (!sinopsis) {
    const metaDescMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/)
    if (metaDescMatch) sinopsis = decodeHtml(metaDescMatch[1])
  }

  // 4. Score
  let score: string | undefined
  const scoreMatch = html.match(/>\s*(\d+(?:\.\d+)?)\s*<\/(?:span|div|p)[^>]*>\s*(?:Status|Tipe)/i)
  if (scoreMatch) score = scoreMatch[1]

  // 5. Status
  let status: string | undefined
  const statusMatch = html.match(/Status\s*<\/(?:b|strong|span)[^>]*>\s*<(?:em|span|a)[^>]*>\s*(Ongoing|Completed|Hiatus)/i)
  if (statusMatch) status = statusMatch[1]
  if (!status) {
    const statusMatch2 = html.match(/Status[^<]*<\/[^>]+>\s*<[^>]+>\s*(Ongoing|Completed|Hiatus)/i)
    if (statusMatch2) status = statusMatch2[1]
  }

  // 6. Author & Artist
  let author: string | undefined
  let artist: string | undefined
  const authorMatch = html.match(/Penulis\s*<\/[^>]+>\s*<[^>]+>([^<]+)</)
  if (authorMatch) author = decodeHtml(authorMatch[1].trim())
  const artistMatch = html.match(/Artist\s*<\/[^>]+>\s*<[^>]+>([^<]+)</)
  if (artistMatch) artist = decodeHtml(artistMatch[1].trim())

  // 7. Genre — dari link /genres/[slug]/
  const genreMatches = [...html.matchAll(/\/genres\/([^/]+)\/[^>]*>([^<]+)</gi)]
  const genres = genreMatches
    .map(m => decodeHtml(m[2].trim()))
    .filter(g => g.length > 0 && g.length < 30)

  return { mangaType, sinopsis, thumbnail, score, status, author, artist, genres }
}

export async function GET(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get("slug")
  if (!slug) return NextResponse.json({}, { status: 400 })

  try {
    const detail = await cached(
      `komiku:detail:${slug}`,
      TTL.seriesDetail,
      () => scrapeDetail(slug)
    )
    return NextResponse.json(detail)
  } catch {
    return NextResponse.json({})
  }
}
