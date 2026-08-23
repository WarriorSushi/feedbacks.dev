import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink, Menu, TriangleAlert, Info, CheckCircle2 } from 'lucide-react'
import { BrandWordmark } from '@/components/brand-wordmark'
import { MascotSpotlight } from '@/components/mascot-spotlight'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DOCS_CATEGORIES, DOCS_PAGES, DOCS_REVISION, getDocsPage, type DocsBlock } from '@/lib/docs-content'
import { publicEnv } from '@/lib/public-env'
import { getDocsMascot } from '@/lib/docs-mascots'
import { DocsCodeBlock, DocsSearch } from '../docs-client'

export function generateStaticParams() {
  return DOCS_PAGES.filter((page) => page.slug !== 'overview').map((page) => ({ slug: page.slug.split('/') }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  const { slug } = await params
  const page = getDocsPage(slug?.join('/'))
  if (!page) return { title: 'Documentation', robots: { index: false, follow: false } }
  const canonical = page.slug === 'overview' ? '/docs' : `/docs/${page.slug}`
  return {
    title: page.title === 'Documentation' ? 'Documentation' : `${page.title} documentation`,
    description: page.description,
    alternates: { canonical },
  }
}

function DocsNavigation({ activeSlug, mobile = false }: { activeSlug: string; mobile?: boolean }) {
  return (
    <nav aria-label="Documentation sections" className={cn('space-y-5', mobile && 'pb-2 pt-4')}>
      {DOCS_CATEGORIES.map((category) => (
        <div key={category}>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{category}</p>
          <div className="space-y-0.5">
            {DOCS_PAGES.filter((page) => page.category === category).map((page) => (
              <Link
                key={page.slug}
                href={page.slug === 'overview' ? '/docs' : `/docs/${page.slug}`}
                className={cn(
                  'block rounded-md px-2.5 py-2 text-sm transition-colors',
                  page.slug === activeSlug
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {page.title}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

function renderBlock(block: DocsBlock, index: number) {
  if (block.type === 'paragraph') return <p key={index} className="my-4 max-w-[72ch] text-[15px] leading-7 text-foreground/78">{block.text}</p>
  if (block.type === 'heading') return <h2 key={block.id} id={block.id} className="scroll-mt-24 border-t pt-8 text-xl font-semibold tracking-tight first:border-0 first:pt-0">{block.title}</h2>
  if (block.type === 'code') return <DocsCodeBlock key={index} {...block} label={`${block.label} · docs ${DOCS_REVISION}`} />
  if (block.type === 'list') return (
    <ul key={index} className="my-4 max-w-[72ch] space-y-2 text-[15px] leading-7 text-foreground/78">
      {block.items.map((item) => <li key={item} className="flex gap-3"><span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{item}</li>)}
    </ul>
  )
  if (block.type === 'steps') return (
    <ol key={index} className="my-5 max-w-[72ch] divide-y border-y">
      {block.items.map((item, itemIndex) => (
        <li key={item.title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 py-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{itemIndex + 1}</span>
          <div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p></div>
        </li>
      ))}
    </ol>
  )
  if (block.type === 'table') return (
    <div key={index} className="my-6 overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead className="bg-muted/60"><tr>{block.columns.map((column) => <th key={column} className="border-b px-4 py-3 font-semibold">{column}</th>)}</tr></thead>
        <tbody>{block.rows.map((row) => <tr key={row.join('|')} className="border-b last:border-0">{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`} className="px-4 py-3 align-top leading-6 text-foreground/75 first:font-medium first:text-foreground">{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
  const CalloutIcon = block.tone === 'warning' ? TriangleAlert : block.tone === 'success' ? CheckCircle2 : Info
  return (
    <div key={index} className={cn('my-6 flex max-w-[72ch] gap-3 rounded-lg border p-4', block.tone === 'warning' ? 'border-amber-500/30 bg-amber-500/[0.07]' : block.tone === 'success' ? 'border-emerald-500/30 bg-emerald-500/[0.07]' : 'bg-muted/40')}>
      <CalloutIcon className={cn('mt-0.5 h-4 w-4 shrink-0', block.tone === 'warning' ? 'text-amber-600 dark:text-amber-400' : block.tone === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary')} />
      <div><p className="text-sm font-semibold">{block.title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{block.body}</p></div>
    </div>
  )
}

export default async function DocsPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const page = getDocsPage(slug?.join('/'))
  if (!page) notFound()
  const index = DOCS_PAGES.findIndex((candidate) => candidate.slug === page.slug)
  const previous = DOCS_PAGES[index - 1]
  const next = DOCS_PAGES[index + 1]
  const headings = page.blocks.filter((block): block is Extract<DocsBlock, { type: 'heading' }> => block.type === 'heading')
  const dashboardHref = `${publicEnv.NEXT_PUBLIC_APP_ORIGIN}/dashboard`

  return (
    <div className="docs-shell min-h-screen bg-background text-foreground">
      <header className="docs-titlebar sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="shrink-0"><BrandWordmark className="text-lg" priority /></Link>
          <span className="hidden h-5 w-px bg-border sm:block" />
          <Link href="/docs" className="hidden shrink-0 items-center gap-2 text-sm font-semibold sm:inline-flex"><BookOpen className="h-4 w-4" />Documentation</Link>
          <div className="ml-auto flex min-w-0 flex-1 justify-end lg:justify-center">
            <DocsSearch pages={DOCS_PAGES.map((docsPage) => ({
              slug: docsPage.slug,
              title: docsPage.title,
              description: docsPage.description,
              category: docsPage.category,
              searchText: JSON.stringify(docsPage.blocks),
            }))} />
          </div>
          <Button asChild variant="outline" size="sm" className="hidden shrink-0 sm:inline-flex"><a href={dashboardHref}>Dashboard <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></a></Button>
        </div>
      </header>

      <div className="mx-auto max-w-[1480px] px-4 sm:px-6">
        <details className="border-b py-3 lg:hidden">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 text-sm font-semibold"><Menu className="h-4 w-4" />Browse documentation</summary>
          <DocsNavigation activeSlug={page.slug} mobile />
        </details>

        <div className="grid lg:grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,820px)_220px] xl:gap-12">
          <aside className="hidden border-r pr-5 lg:block"><div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto py-8"><DocsNavigation activeSlug={page.slug} /></div></aside>

          <main className="docs-content min-w-0 py-8 lg:px-8 xl:px-0 xl:py-12">
            <div className="relative min-h-28 pr-0 sm:pr-36">
              <MascotSpotlight src={getDocsMascot(page.slug)} className="absolute -right-2 -top-8 hidden h-36 w-36 sm:block" sizes="144px" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{page.category}</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{page.title}</h1>
              <p className="mt-4 max-w-[68ch] text-base leading-7 text-muted-foreground">{page.description}</p>
              <p className="mt-3 text-xs text-muted-foreground">Documentation revision {DOCS_REVISION}</p>
            </div>
            <div className="mt-10 space-y-6">{page.blocks.map(renderBlock)}</div>

            <nav aria-label="Adjacent documentation" className="mt-12 grid gap-3 border-t pt-6 sm:grid-cols-2">
              {previous ? <Link href={previous.slug === 'overview' ? '/docs' : `/docs/${previous.slug}`} className="group rounded-lg border p-4 hover:bg-accent"><span className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="h-3.5 w-3.5" />Previous</span><span className="mt-1 block text-sm font-semibold group-hover:text-primary">{previous.title}</span></Link> : <span />}
              {next && <Link href={`/docs/${next.slug}`} className="group rounded-lg border p-4 text-right hover:bg-accent"><span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">Next<ArrowRight className="h-3.5 w-3.5" /></span><span className="mt-1 block text-sm font-semibold group-hover:text-primary">{next.title}</span></Link>}
            </nav>
          </main>

          <aside className="hidden xl:block"><div className="sticky top-24 py-12"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">On this page</p><nav className="mt-3 space-y-2">{headings.map((heading) => <a key={heading.id} href={`#${heading.id}`} className="block text-sm leading-5 text-muted-foreground hover:text-foreground">{heading.title}</a>)}</nav></div></aside>
        </div>
      </div>
    </div>
  )
}
