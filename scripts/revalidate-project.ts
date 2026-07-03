const siteUrl = process.env.SITE_URL ?? 'https://www.situa.gt'
const secret = process.env.REVALIDATION_SECRET
const projectId = process.env.PROJECT_ID ?? process.argv[2]
const projectSlug = process.env.PROJECT_SLUG ?? process.argv[3] ?? 'miro-apartamentos'

async function main() {
  if (!secret) {
    console.error('Missing REVALIDATION_SECRET. Add it to .env.local or pass it in the environment.')
    process.exit(1)
  }

  if (!projectId) {
    console.error('Missing PROJECT_ID. Usage: npm run revalidate:project -- <project-id> [project-slug]')
    process.exit(1)
  }

  const response = await fetch(`${siteUrl.replace(/\/$/, '')}/api/revalidate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-revalidation-secret': secret,
    },
    body: JSON.stringify({
      type: 'UPDATE',
      table: 'project_media',
      schema: 'public',
      record: {
        id: 'manual-revalidate',
        project_id: projectId,
        slug: projectSlug,
      },
    }),
  })

  const body = await response.text()

  if (!response.ok) {
    console.error(`Revalidation failed: ${response.status} ${response.statusText}`)
    console.error(body)
    process.exit(1)
  }

  console.log(body)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
