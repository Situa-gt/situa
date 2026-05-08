'use client'

import { useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CtaButton } from '@/components/ui/cta-button'
import { submitContactLead } from '@/app/actions/contact'

const ClientSchema = z.object({
  full_name: z.string().trim().min(2, 'Ingresa tu nombre completo').max(100),
  email: z.string().trim().email('Correo inválido').max(255),
  phone: z.string().trim().max(30, 'Teléfono demasiado largo').optional(),
  message: z.string().trim().max(500, 'Máximo 500 caracteres').optional(),
})

type FieldErrors = Partial<Record<'full_name' | 'email' | 'phone' | 'message', string[]>>

interface ContactFormProps {
  projectId: string
  modelId?: string
  projectName?: string
  modelName?: string
}

const EMPTY = { full_name: '', email: '', phone: '', message: '' }

function buildDefaultMessage(projectName?: string, modelName?: string) {
  if (!projectName) return ''
  if (modelName) {
    return `Tengo interés en conocer más sobre ${projectName} el modelo ${modelName}`
  }
  return `Tengo interés en conocer más sobre ${projectName}`
}

export function ContactForm({ projectId, modelId, projectName, modelName }: ContactFormProps) {
  const searchParams = useSearchParams()
  const defaultMessage = buildDefaultMessage(projectName, modelName)
  const INITIAL = { ...EMPTY, message: defaultMessage }
  const [values, setValues] = useState(INITIAL)
  const [hp, setHp] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)

  function update<K extends keyof typeof INITIAL>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})

    const parsed = ClientSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors)
      return
    }

    const payload = {
      project_id: projectId,
      ...(modelId ? { model_id: modelId } : {}),
      ...parsed.data,
      hp_company: hp,
      utm_source: searchParams.get('utm_source') ?? undefined,
      utm_medium: searchParams.get('utm_medium') ?? undefined,
      utm_campaign: searchParams.get('utm_campaign') ?? undefined,
    }

    startTransition(async () => {
      const result = await submitContactLead(payload)
      if ('error' in result) {
        if (result.fields) setErrors(result.fields as FieldErrors)
        toast.error(result.error)
        return
      }
      toast.success('¡Mensaje enviado! Pronto te contactaremos.')
      setValues(INITIAL)
      setHp('')
      setSubmitted(true)
    })
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-6 py-10 text-center"
      >
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M5 12.5l5 5L20 7" />
          </svg>
        </span>
        <h3 className="text-lg font-semibold text-emerald-900">
          ¡Mensaje enviado!
        </h3>
        <p className="text-sm text-emerald-800">
          Pronto te contactaremos.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="full_name">Nombre completo</Label>
        <Input
          id="full_name"
          name="full_name"
          autoComplete="name"
          required
          value={values.full_name}
          onChange={(e) => update('full_name', e.target.value)}
          aria-invalid={!!errors.full_name}
          disabled={isPending}
          placeholder="Ej. María Pérez"
          className="h-10"
        />
        {errors.full_name?.[0] && (
          <p className="text-xs text-destructive">{errors.full_name[0]}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={(e) => update('email', e.target.value)}
          aria-invalid={!!errors.email}
          disabled={isPending}
          placeholder="tucorreo@ejemplo.com"
          className="h-10"
        />
        {errors.email?.[0] && (
          <p className="text-xs text-destructive">{errors.email[0]}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phone">Teléfono (opcional)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={values.phone}
          onChange={(e) => update('phone', e.target.value)}
          aria-invalid={!!errors.phone}
          disabled={isPending}
          placeholder="Ej. 5555 5555"
          className="h-10"
        />
        {errors.phone?.[0] && (
          <p className="text-xs text-destructive">{errors.phone[0]}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="message">Mensaje (opcional)</Label>
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={500}
          value={values.message}
          onChange={(e) => update('message', e.target.value)}
          aria-invalid={!!errors.message}
          disabled={isPending}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground hover:border-brand-purple focus-visible:border-brand-purple disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
          placeholder="Cuéntanos qué te interesa de este proyecto."
        />
        {errors.message?.[0] && (
          <p className="text-xs text-destructive">{errors.message[0]}</p>
        )}
      </div>

      <div aria-hidden className="hidden">
        <label>
          Empresa
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
          />
        </label>
      </div>

      <div className="flex items-center justify-end pt-2">
        <CtaButton type="submit" disabled={isPending}>
          {isPending ? 'Enviando…' : 'Enviar'}
        </CtaButton>
      </div>
    </form>
  )
}
