import type { Crumb } from '@/components/breadcrumbs/Breadcrumbs'
import type { Resolved } from '@/lib/resolve-slug'
import { tipoSlug, type PropertyType } from '@/lib/types/property'

export function labelForTipo(tipo: PropertyType): string {
  return tipo === 'apartamento' ? 'Apartamentos' : 'Casas'
}

export function breadcrumbsFor(
  resolved: Exclude<Resolved, { kind: 'not-found' }>,
): Crumb[] {
  switch (resolved.kind) {
    case 'tipo':
      return [
        { label: 'Inicio', href: '/' },
        { label: labelForTipo(resolved.data.tipo) },
      ]
    case 'zone':
      return [
        { label: 'Inicio', href: '/' },
        { label: resolved.data.zone.name },
      ]
    case 'zone-tipo':
      return [
        { label: 'Inicio', href: '/' },
        { label: resolved.data.zone.name, href: `/${resolved.data.zone.url_slug}` },
        { label: labelForTipo(resolved.data.tipo) },
      ]
    case 'project': {
      const { project, zone } = resolved.data
      return [
        { label: 'Inicio', href: '/' },
        { label: zone.name, href: `/${zone.url_slug}` },
        {
          label: labelForTipo(project.property_type),
          href: `/${zone.url_slug}/${tipoSlug(project.property_type)}`,
        },
        { label: project.name },
      ]
    }
    case 'model': {
      const { model, project, zone } = resolved.data
      return [
        { label: 'Inicio', href: '/' },
        { label: zone.name, href: `/${zone.url_slug}` },
        {
          label: labelForTipo(project.property_type),
          href: `/${zone.url_slug}/${tipoSlug(project.property_type)}`,
        },
        {
          label: project.name,
          href: `/${zone.url_slug}/${tipoSlug(project.property_type)}/${project.slug}`,
        },
        { label: model.name },
      ]
    }
  }
}
