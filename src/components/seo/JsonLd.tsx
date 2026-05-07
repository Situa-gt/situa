interface Props {
  data: object | object[]
}

const LS = ' '
const PS = ' '

function escapeJsonLd(json: string): string {
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replaceAll(LS, '\\u2028')
    .replaceAll(PS, '\\u2029')
}

export function JsonLd({ data }: Props) {
  const payload = Array.isArray(data)
    ? { '@context': 'https://schema.org', '@graph': data }
    : data
  const json = escapeJsonLd(JSON.stringify(payload))
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
