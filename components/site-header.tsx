"use client"

import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import useSWR from "swr"
import { Search } from "lucide-react"
import { getMenuItems, type MenuItem } from "@/lib/api"

const FALLBACK_NAV: { label: string; href: string }[] = [
  { label: "Beranda", href: "/" },
  { label: "Komik", href: "/series" },
  { label: "Genre", href: "/genre" },
  { label: "Post", href: "/post" },
]

function toHref(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname || "/"
  } catch {
    return url.startsWith("/") ? url : "/"
  }
}

export function SiteHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState("")

  const { data: menuItems } = useSWR<MenuItem[]>("menu-items", getMenuItems, {
    revalidateOnFocus: false,
  })

  const nav =
    menuItems && menuItems.length > 0
      ? menuItems.map((m) => ({ label: m.title, href: toHref(m.url) }))
      : FALLBACK_NAV

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-40">
      {/* ── Main bar ── */}
      <div className="header-glass">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 md:gap-5">

          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center gap-2.5 group" aria-label="Beranda">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm ring-1 ring-border transition group-hover:ring-primary/40 group-hover:shadow-md">
              <Image
                src="/logo.jpg"
                alt="Komiku Logo"
                fill
                sizes="36px"
                className="object-cover"
                priority
              />
            </div>
            <span
              className="hidden sm:block text-base font-bold tracking-tight text-foreground transition group-hover:text-primary"
              style={{ letterSpacing: "-0.03em" }}
            >
              KOMIKU
            </span>
          </Link>

          {/* Search bar */}
          <form onSubmit={onSubmit} className="relative flex-1 max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari manga, komik…"
              aria-label="Cari komik"
              className="search-input w-full py-2 pl-9 pr-4 text-sm"
            />
          </form>

          {/* Search button */}
          <button
            type="button"
            onClick={onSubmit}
            aria-label="Cari"
            className="btn-primary shrink-0 flex items-center gap-1.5 py-2 px-3.5 md:px-4"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs font-semibold">Cari</span>
          </button>
        </div>
      </div>

      {/* ── Desktop nav bar ── */}
      <nav
        className="hidden md:block border-b border-border bg-card/70 backdrop-blur-md"
        aria-label="Menu utama"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-0.5 overflow-x-auto px-4">
          {nav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            return (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                className={`relative whitespace-nowrap px-3.5 py-2.5 text-sm font-medium transition-colors
                  ${active
                    ? "nav-link-active"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                  }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
