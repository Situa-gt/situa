import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPublishedBlogPosts } from '@/lib/queries/blog'

export const metadata: Metadata = {
  title: 'Blog inmobiliario de Guatemala | Sitúa',
  description: 'Guías para comprar, invertir, financiar y comparar apartamentos y proyectos inmobiliarios en Guatemala.',
  alternates: { canonical: '/blog' },
}

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts()
  return <main className="bg-[#f7f6f2] text-zinc-950">
    <section className="bg-brand-purple px-6 py-16 text-white lg:py-24">
      <div className="mx-auto max-w-7xl"><p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">Ideas para decidir mejor</p><h1 className="max-w-3xl text-4xl font-semibold tracking-tight lg:text-6xl">Blog inmobiliario Sitúa</h1><p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80">Guías claras para explorar vivienda nueva, comparar proyectos e invertir con más información en Guatemala.</p></div>
    </section>
    <section className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
      {posts.length ? <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <article key={post.id} className="group overflow-hidden rounded-3xl bg-white shadow-[0_16px_50px_-35px_rgba(20,20,20,.35)]">
        <Link href={`/blog/${post.slug}`} className="block">
          <div className="relative aspect-[16/10] overflow-hidden bg-zinc-200">{post.cover_url && <Image src={post.cover_url} alt={post.cover_alt || post.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />}</div>
          <div className="p-7"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-purple">Guía Sitúa</p><h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight">{post.title}</h2><p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-600">{post.excerpt}</p><span className="mt-6 inline-flex text-sm font-semibold text-brand-purple">Leer artículo →</span></div>
        </Link>
      </article>)}</div> : <div className="rounded-3xl bg-white p-12 text-center"><h2 className="text-2xl font-semibold">Estamos preparando nuevas guías</h2><p className="mt-3 text-zinc-600">Muy pronto encontrarás aquí contenido para tomar mejores decisiones inmobiliarias.</p></div>}
    </section>
  </main>
}
