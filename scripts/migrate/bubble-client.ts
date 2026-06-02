const BASE_URL = process.env.BUBBLE_APP_URL!
const API_KEY = process.env.BUBBLE_ADMIN_KEY!

interface BubbleResponse<T> {
  response: {
    cursor: number
    results: T[]
    count: number
    remaining: number
  }
}

interface BubbleSingleResponse<T> {
  response: T
}

export async function fetchAll<T = Record<string, unknown>>(type: string): Promise<T[]> {
  const all: T[] = []
  let cursor = 0

  while (true) {
    const url = `${BASE_URL}/${type}?limit=100&cursor=${cursor}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } })

    if (!res.ok) {
      throw new Error(`Bubble ${type} fetch failed: ${res.status} ${await res.text()}`)
    }

    const json: BubbleResponse<T> = await res.json()
    all.push(...json.response.results)

    if (json.response.remaining === 0) break
    cursor += json.response.count
  }

  return all
}

export async function fetchOne<T = Record<string, unknown>>(type: string, id: string): Promise<T> {
  const url = `${BASE_URL}/${type}/${id}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } })

  if (!res.ok) {
    throw new Error(`Bubble ${type}/${id} fetch failed: ${res.status} ${await res.text()}`)
  }

  const json: BubbleSingleResponse<T> = await res.json()
  return json.response
}

export async function fetchFiltered<T = Record<string, unknown>>(
  type: string,
  key: string,
  value: string,
): Promise<T[]> {
  const all: T[] = []
  let cursor = 0
  const constraints = encodeURIComponent(JSON.stringify([{ key, constraint_type: 'equals', value }]))

  while (true) {
    const url = `${BASE_URL}/${type}?limit=100&cursor=${cursor}&constraints=${constraints}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } })

    if (!res.ok) {
      throw new Error(`Bubble ${type} filtered fetch failed: ${res.status} ${await res.text()}`)
    }

    const json: BubbleResponse<T> = await res.json()
    all.push(...json.response.results)

    if (json.response.remaining === 0) break
    cursor += json.response.count
  }

  return all
}
