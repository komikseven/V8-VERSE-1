"use client"

import Link from "next/link"
import useSWR from "swr"
import { useState } from "react"
import { getLatestChapters, proxyImage, timeAgo, type Chapter } from "@/lib/api"
import { ListSkeleton, ErrorState } from "@/components/states"
import { ChevronLeft, ChevronRight } from "lucide-react"

function ChapterRow({ chapter }: { chapter: Chapter }) {
  const title = chapter.seriesTitle || chapter.title
  return (
    <Link
      href={`/detail/${chapter.id}`}
      className="group flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 transition hover:border-primary/40 hover:shadow-sm"
    >
      <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={proxyImage(chapter.thumbnail) || "/placeholder.svg"}
          alt={title}
          loading="lazy"
          crossOrigin="anonymous"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h3 className="line-clamp-1 text-sm font-semibold text-card-foreground group-hover:text-primary">{title}</h3>
        <span className="text-xs font-medium text-primary">Chapter {chapter.chapterNumber || "?"}</span>
        <span className="text-xs text-muted-foreground">{timeAgo(chapter.date)}</span>
      </div>
    </Link>
  )
}

export function LatestChapters({ paginated = false }: { paginated?: boolean }) {
  const [page, setPage] = useState(1)
  const { data, error, isLoading, mutate } = useSWR(
    ["latest-chapters", page],
    () => getLatestChapters(page, 24),
    { revalidateOnFocus: false },
  )

  const chapters: Chapter[] = data?.chapters ?? []
  const totalPages = data?.totalPages ?? 1

  function changePage(next: number) {
    setPage(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <span className="h-5 w-1.5 rounded-full bg-primary" />
        <h2 className="text-lg font-bold text-foreground md:text-xl">Chapter Terbaru</h2>
      </div>

      {isLoading ? (
        <ListSkeleton count={12} />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={() => mutate()} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {chapters.map((c) => (
              <ChapterRow key={c.id} chapter={c} />
            ))}
          </div>

          {paginated ? (
            <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
              <button
                onClick={() => changePage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Sebelumnya
              </button>
              <span className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
                Halaman {page} / {totalPages}
              </span>
              <button
                onClick={() => changePage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Berikutnya
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          ) : null}
        </>
      )}
    </section>
  )
}
