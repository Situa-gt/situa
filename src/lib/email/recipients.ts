const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function uniqueEmails(emails: Array<string | null | undefined>) {
  const normalized = emails
    .map((email) => email?.trim().toLowerCase())
    .filter((email): email is string => typeof email === 'string' && email.length > 0 && EMAIL_PATTERN.test(email))
  return [...new Set(normalized)]
}

export function resolveContactRecipients({
  developerEmails,
  projectEmails,
  fallbackEmail,
}: {
  developerEmails: Array<string | null | undefined>
  projectEmails: Array<string | null | undefined>
  fallbackEmail?: string | null
}) {
  const recipients = uniqueEmails([...developerEmails, ...projectEmails])
  return recipients.length ? recipients : uniqueEmails([fallbackEmail])
}

export function redactEmails(value: string) {
  return value.replace(/([A-Z0-9._%+-])[^\s@]*@([A-Z0-9.-]+\.[A-Z]{2,})/gi, '$1***@$2')
}
