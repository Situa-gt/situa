import { getFeaturedModels } from '@/lib/queries/home'
import { FeaturedModelCard } from './FeaturedModelCard'

export async function FeaturedModels() {
  const models = await getFeaturedModels()
  if (models.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl overflow-visible px-6 py-20">
      <h2 className="mb-10 text-3xl font-semibold tracking-[-0.015em] text-ink sm:text-[2rem]">
        Modelos destacados
      </h2>
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => (
          <FeaturedModelCard key={model.id} model={model} />
        ))}
      </div>
    </section>
  )
}
