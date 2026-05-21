import { getFeaturedModels } from '@/lib/queries/home'
import { FeaturedModelsCarousel } from './FeaturedModelsCarousel'

export async function FeaturedModels() {
  const models = await getFeaturedModels()
  if (models.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-20">
      <h2 className="mb-10 text-3xl font-semibold tracking-[-0.015em] text-ink sm:text-[2rem]">
        Modelos destacados
      </h2>
      <FeaturedModelsCarousel models={models} />
    </section>
  )
}
