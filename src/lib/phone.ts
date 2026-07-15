const COUNTRY_RULES = [
  { code: "502", country: "Guatemala", nationalLength: 8, groups: [4, 4] },
  { code: "503", country: "El Salvador", nationalLength: 8, groups: [4, 4] },
  { code: "57", country: "Colombia", nationalLength: 10, groups: [3, 3, 4] },
  { code: "52", country: "Mexico", nationalLength: 10, groups: [2, 4, 4] },
  { code: "1", country: "Estados Unidos/Canada", nationalLength: 10, groups: [3, 3, 4] },
] as const

type CountryRule = (typeof COUNTRY_RULES)[number]

export type NormalizedPhone =
  | { ok: true; phone: string; country: string }
  | { ok: false; error: string }

export function normalizePhone(value: string): NormalizedPhone {
  const raw = value.trim()
  if (!raw) return { ok: false, error: "Ingresa un telefono valido." }
  if (/[^0-9+()\s-]/.test(raw)) {
    return { ok: false, error: "Usa solo numeros, espacios, guiones o +." }
  }

  const digits = raw.replace(/\D/g, "")
  if (digits.length < 8) return { ok: false, error: "El telefono es demasiado corto." }
  if (digits.length > 15) return { ok: false, error: "El telefono es demasiado largo." }

  if (digits.length === 8) {
    return formatWithRule("502", digits, COUNTRY_RULES[0])
  }

  const matchedRule = COUNTRY_RULES.find(
    (rule) => digits.startsWith(rule.code) && digits.length === rule.code.length + rule.nationalLength,
  )

  if (matchedRule) {
    return formatWithRule(
      matchedRule.code,
      digits.slice(matchedRule.code.length),
      matchedRule,
    )
  }

  if (!raw.startsWith("+")) {
    return {
      ok: false,
      error: "Agrega codigo de pais o usa 8 digitos si es Guatemala.",
    }
  }

  return {
    ok: false,
    error: "Codigo de pais no reconocido.",
  }
}

function formatWithRule(code: string, national: string, rule: CountryRule): NormalizedPhone {
  return {
    ok: true,
    country: rule.country,
    phone: `+${code} ${groupDigits(national, rule.groups)}`,
  }
}

function groupDigits(value: string, groups: readonly number[]) {
  const parts: string[] = []
  let cursor = 0
  for (const size of groups) {
    parts.push(value.slice(cursor, cursor + size))
    cursor += size
  }
  if (cursor < value.length) parts.push(value.slice(cursor))
  return parts.filter(Boolean).join(" ")
}
