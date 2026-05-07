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
