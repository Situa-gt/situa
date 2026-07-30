import { createServerClient } from '@/lib/supabase/server'
import { tipoSlug } from '@/lib/types/property'
import { SITE_DESCRIPTION_ES, SITE_NAME, SITE_URL } from '@/lib/seo/site'

export const revalidate = 3600

async function buildProjectLinks() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('projects')
    .select('name, slug, property_type, is_featured, zones(name, url_slug)')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    console.error('[llms.txt] Could not fetch projects', error)
    return []
  }

  return (data ?? [])
    .filter((project) => project.zones)
    .map((project) => {
      const zone = project.zones as { name: string; url_slug: string }
      return `- [${project.name} en ${zone.name}](${SITE_URL}/${zone.url_slug}/${tipoSlug(project.property_type)}/${project.slug})`
    })
}

export async function GET() {
  const projectLinks = await buildProjectLinks()
  const body = [
    `# ${SITE_NAME}`,
    '',
    SITE_DESCRIPTION_ES,
    '',
    'Sitúa.gt es una plataforma inmobiliaria en Guatemala para descubrir proyectos de apartamentos y casas en preventa, construcción y entrega inmediata.',
    '',
    '## Contenido principal',
    '',
    `- [Inicio](${SITE_URL}/): buscador principal de proyectos inmobiliarios.`,
    `- [Apartamentos](${SITE_URL}/apartamentos): índice de apartamentos disponibles.`,
    `- [Calculadora](${SITE_URL}/calculadora): simulador de cuota mensual.`,
    `- [Quiénes somos](${SITE_URL}/quienes-somos): información institucional de Sitúa.`,
    '',
    '## Entidades importantes',
    '',
    '- Proyecto: desarrollo inmobiliario con zona, etapa, desarrolladora, modelos, galería, amenidades, precio desde y cuota desde.',
    '- Modelo: unidad disponible dentro de un proyecto con área, dormitorios, baños, parqueos, precio y cuota.',
    '- Zona: ubicación comercial dentro de Guatemala usada para navegación e indexación.',
    '- Desarrolladora: empresa responsable del proyecto inmobiliario.',
    '',
    '## Proyectos destacados o recientes',
    '',
    ...(projectLinks.length > 0 ? projectLinks : ['- Consulta el sitemap para el listado completo de URLs activas.']),
    '',
    '## Archivos para descubrimiento',
    '',
    `- [Sitemap](${SITE_URL}/sitemap.xml)`,
    `- [Robots](${SITE_URL}/robots.txt)`,
    '',
    '## Uso recomendado',
    '',
    'Usa las URLs canónicas del sitemap para citar proyectos. Para precio, disponibilidad y cuota, prioriza los datos visibles en la ficha del proyecto o modelo.',
    '',
  ].join('\n')

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
