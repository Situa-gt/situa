export interface ModelPricingRow {
  project_id: string
  price_from: number | null
  monthly_payment_from: number | null
}

export interface ProjectPricing {
  price_from: number
  monthly_payment_from: number | null
}

function positiveNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

export function cheapestModelPricingByProject(
  rows: ModelPricingRow[],
  normalize: (projectId: string, value: number) => number = (_projectId, value) => value,
) {
  const pricing = new Map<string, ProjectPricing>()

  for (const row of rows) {
    const price = positiveNumber(row.price_from)
    if (price === null) continue

    const normalizedPrice = normalize(row.project_id, price)
    const current = pricing.get(row.project_id)
    if (current && normalizedPrice >= current.price_from) continue

    const payment = positiveNumber(row.monthly_payment_from)
    pricing.set(row.project_id, {
      price_from: normalizedPrice,
      monthly_payment_from: payment === null ? null : normalize(row.project_id, payment),
    })
  }

  return pricing
}

export function cheapestModelPricing(rows: Array<Omit<ModelPricingRow, 'project_id'>>) {
  return cheapestModelPricingByProject(rows.map((row) => ({ ...row, project_id: 'project' }))).get('project') ?? null
}
