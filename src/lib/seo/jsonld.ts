import type { Crumb } from '@/components/breadcrumbs/Breadcrumbs'
import type { Database } from '@/lib/database.types'
import type { ProjectDetailData } from '@/lib/queries/project'
import type { ModelDetailData, ModelImage } from '@/lib/queries/model'
import type { ProjectCardData } from '@/lib/queries/home'
import { tipoSlug } from '@/lib/types/property'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION_ES, SITE_LOGO_PATH } from '@/lib/seo/site'

type ProjectStage = Database['public']['Enums']['project_stage']

function abs(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function buildBreadcrumbList(crumbs: Crumb[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: abs(c.href) } : {}),
    })),
  }
}

export function buildOrganizationSitua() {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: abs(SITE_LOGO_PATH),
  }
}

export function buildWebSite() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION_ES,
    inLanguage: 'es-GT',
    publisher: { '@id': `${SITE_URL}/#organization` },
  }
}

export function buildItemList(projects: ProjectCardData[]) {
  const items = projects
    .filter((p): p is ProjectCardData & { zone: NonNullable<ProjectCardData['zone']> } => p.zone !== null)
    .map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: abs(`/${p.zone.url_slug}/${tipoSlug(p.property_type)}/${p.slug}`),
      name: p.name,
    }))
  return {
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items,
  }
}

function stageToAvailability(stage: ProjectStage): string {
  return stage === 'entrega_inmediata'
    ? 'https://schema.org/InStock'
    : 'https://schema.org/PreOrder'
}

interface ProjectJsonLdInput {
  detail: ProjectDetailData
  zone: { name: string; url_slug: string }
  canonicalPath: string
}

export function buildRealEstateListing({ detail, canonicalPath }: ProjectJsonLdInput) {
  const { project, cover, price_from } = detail
  const node: Record<string, unknown> = {
    '@type': 'RealEstateListing',
    '@id': `${SITE_URL}${canonicalPath}#listing`,
    url: abs(canonicalPath),
    name: project.name,
    inLanguage: 'es-GT',
    datePosted: project.created_at,
    dateModified: project.updated_at,
  }
  if (project.short_description) node.description = project.short_description
  if (cover?.url) {
    node.image = abs(cover.url)
  }
  if (price_from !== null) {
    node.offers = {
      '@type': 'Offer',
      price: price_from,
      priceCurrency: project.base_currency,
      availability: stageToAvailability(project.stage),
      url: abs(canonicalPath),
    }
  }
  if (detail.developer) {
    node.provider = { '@id': `${SITE_URL}/#developer-${detail.developer.id}` }
  }
  return node
}

export function buildPlace({ detail, zone, canonicalPath }: ProjectJsonLdInput) {
  const { project, department } = detail
  const hasGeo = project.latitude !== null && project.longitude !== null
  const address: Record<string, unknown> = {
    '@type': 'PostalAddress',
    addressLocality: zone.name,
    addressCountry: 'GT',
  }
  if (department?.name) address.addressRegion = department.name

  const place: Record<string, unknown> = {
    '@type': 'Place',
    '@id': `${SITE_URL}${canonicalPath}#place`,
    name: project.name,
    address,
  }
  if (hasGeo) {
    place.geo = {
      '@type': 'GeoCoordinates',
      latitude: project.latitude,
      longitude: project.longitude,
    }
  }
  return place
}

export function buildOrganizationDeveloper(detail: ProjectDetailData) {
  if (!detail.developer) return null
  const node: Record<string, unknown> = {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#developer-${detail.developer.id}`,
    name: detail.developer.name,
  }
  if (detail.developer.website) node.url = detail.developer.website
  return node
}

interface ModelJsonLdInput {
  detail: ModelDetailData
  canonicalPath: string
}

export function buildImageObjects(images: ModelImage[]) {
  return images
    .filter((m) => m.url)
    .map((m) => {
      const obj: Record<string, unknown> = {
        '@type': 'ImageObject',
        url: abs(m.url),
      }
      if (m.width) obj.width = m.width
      if (m.height) obj.height = m.height
      if (m.alt) obj.caption = m.alt
      return obj
    })
}

export function buildProductWithOffer({ detail, canonicalPath }: ModelJsonLdInput) {
  const { model, project, images } = detail
  const productId = `${SITE_URL}${canonicalPath}#product`
  const node: Record<string, unknown> = {
    '@type': 'Product',
    '@id': productId,
    name: `${model.name} en ${project.name}`,
    url: abs(canonicalPath),
    inLanguage: 'es-GT',
    brand: project.name,
  }
  if (model.description) node.description = model.description
  else if (project.short_description) node.description = project.short_description

  const imageObjects = buildImageObjects(images)
  if (imageObjects.length > 0) node.image = imageObjects

  node.offers = {
    '@type': 'Offer',
    price: model.price_from,
    priceCurrency: project.base_currency,
    availability: stageToAvailability(project.stage),
    url: abs(canonicalPath),
  }

  return node
}
