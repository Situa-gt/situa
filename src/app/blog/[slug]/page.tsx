import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/seo/JsonLd'
import { getPublishedBlogPost, getPublishedBlogPosts } from '@/lib/queries/blog'
import { SITE_URL } from '@/lib/seo/site'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getPublishedBlogPosts()).map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublishedBlogPost((await params).slug)
  if (!post) return {}
  const canonical = `/blog/${post.slug}`
  const title = post.seo_title || `${post.title} | Sitúa`
  const description = post.seo_description || post.excerpt
  const image = post.cover_url
    ? post.cover_url.startsWith('http') ? post.cover_url : `${SITE_URL}${post.cover_url}`
    : `${SITE_URL}/og-default.jpg`
  return {
    title,
    description,
    alternates: { canonical },
    authors: [{ name: 'Sitúa', url: SITE_URL }],
    robots: { index: true, follow: true },
    openGraph: {
      type: 'article',
      siteName: 'Sitúa',
      locale: 'es_GT',
      title,
      description,
      url: canonical,
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at,
      authors: [SITE_URL],
      images: [{ url: image, width: 1200, height: 630, alt: post.cover_alt || post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@situagt_',
      title,
      description,
      images: [{ url: image, alt: post.cover_alt || post.title }],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPublishedBlogPost((await params).slug)
  if (!post) notFound()
  const paragraphs = post.content.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean)
  const articleJsonLd = {
    '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.excerpt,
    image: post.cover_url ? [post.cover_url.startsWith('http') ? post.cover_url : `${SITE_URL}${post.cover_url}`] : undefined,
    datePublished: post.published_at, dateModified: post.updated_at,
    author: { '@type': 'Organization', name: 'Sitúa' }, publisher: { '@type': 'Organization', name: 'Sitúa', url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`, url: `${SITE_URL}/blog/${post.slug}`, inLanguage: 'es-GT',
  }
  return <main className="bg-[#f7f6f2] text-zinc-950">
    <JsonLd data={articleJsonLd} />
    <article className="mx-auto max-w-6xl px-6 pb-20 pt-14 lg:pb-28 lg:pt-20">
      <header className="mx-auto max-w-4xl text-center"><Link href="/blog" className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-purple">Blog Sitúa</Link><h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">{post.title}</h1><p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">{post.excerpt}</p>{post.published_at && <time className="mt-5 block text-sm text-zinc-500" dateTime={post.published_at}>{new Intl.DateTimeFormat('es-GT', { dateStyle: 'long' }).format(new Date(post.published_at))}</time>}</header>
      {post.cover_url && <div className="relative mt-12 aspect-[16/9] overflow-hidden rounded-3xl bg-zinc-200 shadow-[0_22px_70px_-45px_rgba(20,20,20,.45)]"><Image src={post.cover_url} alt={post.cover_alt || post.title} fill priority sizes="(min-width: 1200px) 1152px, 100vw" className="object-cover" /></div>}
      <div className="mx-auto mt-12 max-w-3xl space-y-6 text-[17px] leading-8 text-zinc-700 lg:mt-16 lg:text-lg">{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      <aside className="mx-auto mt-16 max-w-3xl rounded-3xl bg-brand-purple p-8 text-white lg:p-10"><h2 className="text-2xl font-semibold tracking-tight">Encuentra tu próximo apartamento</h2><p className="mt-3 leading-relaxed text-white/80">Explora proyectos de vivienda nueva en Guatemala y compara opciones en un solo lugar.</p><Link href="/" className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-purple transition hover:bg-white/90">Ver proyectos</Link></aside>
    </article>
  </main>
}
