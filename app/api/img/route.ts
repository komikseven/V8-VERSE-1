import { type NextRequest, NextResponse } from "next/server"

// Proxy for manga images that are protected by hotlink/referer checks.
// The upstream CDN (img.komiku.org) only serves images when the request
// includes a valid Referer header, which browsers can't set for <img> tags.
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  if (!url) {
    return new NextResponse("Missing url", { status: 400 })
  }

  let target: URL
  try {
    target = new URL(url)
  } catch {
    return new NextResponse("Invalid url", { status: 400 })
  }

  // Only allow http/https
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return new NextResponse("Invalid protocol", { status: 400 })
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Referer: "https://komiku.org/",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      cache: "no-store",
    })

    if (!upstream.ok || !upstream.body) {
      return new NextResponse("Upstream error", { status: upstream.status || 502 })
    }

    const contentType = upstream.headers.get("content-type") ?? "image/webp"

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    })
  } catch {
    return new NextResponse("Fetch failed", { status: 502 })
  }
}
