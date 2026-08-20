import { unstable_cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover_url: string | null
  cover_alt: string | null
  seo_title: string | null
  seo_description: string | null
  published_at: string | null
  updated_at: string
}

async function fetchPublishedPosts() {
  const { data, error } = await createServerClient().from('blog_posts').select('id,title,slug,excerpt,content,cover_url,cover_alt,seo_title,seo_description,published_at,updated_at').eq('is_published', true).order('published_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as BlogPost[]
}

export const getPublishedBlogPosts = unstable_cache(fetchPublishedPosts, ['blog-posts-published-v1'], { tags: ['blog_posts'], revalidate: 900 })

export async function getPublishedBlogPost(slug: string) {
  const posts = await getPublishedBlogPosts()
  return posts.find((post) => post.slug === slug) ?? null
}
