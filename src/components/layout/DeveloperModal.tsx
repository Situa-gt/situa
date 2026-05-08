'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CtaButton } from '@/components/ui/cta-button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
import { submitDeveloperLead } from '@/app/actions/developer-lead'

const EMPTY = {
  developer_name: '',
  contact_name: '',
  phone: '',
  website: '',
  discount_code: '',
  message: '',
  hp_company: '',
}

export function DeveloperModal() {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState(EMPTY)
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function update(key: keyof typeof EMPTY, value: string) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setTimeout(() => {
        setValues(EMPTY)
        setSubmitted(false)
        setServerError(null)
      }, 200)
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setServerError(null)
    startTransition(async () => {
      const result = await submitDeveloperLead(values)
      if ('error' in result) {
        setServerError(result.error)
      } else {
        setSubmitted(true)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className="cursor-pointer text-sm text-white/80 transition hover:text-white">
        Soy Desarrolladora
      </DialogTrigger>

      <DialogContent
        className="w-full p-8 sm:max-w-lg"
        showCloseButton
      >
        {submitted ? (
          <div
            role="status"
            className="flex flex-col items-center gap-4 px-2 py-8 text-center"
          >
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-purple text-white">
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7"
              >
                <path d="M5 12.5l5 5L20 7" />
              </svg>
            </span>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
              ¡Gracias por tu interés!
            </h2>
            <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
              Recibimos tu información. Nuestro equipo se pondrá en contacto contigo
              a la brevedad.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-2 flex flex-col items-center gap-3 text-center">
              <div className="rounded-xl bg-brand-purple px-5 py-3">
                <Image
                  src="/logo-situa.svg"
                  alt="Sitúa"
                  width={110}
                  height={28}
                  className="h-7 w-auto"
                />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
                Publica tu proyecto en Sitúa
              </h2>
              <p className="text-sm text-zinc-500">
                Completa el formulario y te contactamos.
              </p>
            </div>

            <form onSubmit={onSubmit} noValidate className="mt-2 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dev-developer_name">Nombre desarrolladora</Label>
                <Input
                  id="dev-developer_name"
                  required
                  value={values.developer_name}
                  onChange={(e) => update('developer_name', e.target.value)}
                  placeholder="Ej. Constructora Ejemplo"
                  disabled={isPending}
                  className="h-10"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dev-contact_name">Nombre contacto</Label>
                <Input
                  id="dev-contact_name"
                  required
                  value={values.contact_name}
                  onChange={(e) => update('contact_name', e.target.value)}
                  placeholder="Ej. Ana García"
                  disabled={isPending}
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dev-phone">Teléfono</Label>
                  <Input
                    id="dev-phone"
                    type="tel"
                    required
                    value={values.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="Ej. 5555 5555"
                    disabled={isPending}
                    className="h-10"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dev-website">Página Web</Label>
                  <Input
                    id="dev-website"
                    type="url"
                    value={values.website}
                    onChange={(e) => update('website', e.target.value)}
                    placeholder="https://..."
                    disabled={isPending}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dev-discount_code">
                  Código de descuento{' '}
                  <span className="text-xs font-normal text-zinc-400">(opcional)</span>
                </Label>
                <Input
                  id="dev-discount_code"
                  value={values.discount_code}
                  onChange={(e) => update('discount_code', e.target.value)}
                  placeholder="Ej. ADIG2025"
                  disabled={isPending}
                  className="h-10"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dev-message">Mensaje</Label>
                <textarea
                  id="dev-message"
                  rows={3}
                  maxLength={500}
                  value={values.message}
                  onChange={(e) => update('message', e.target.value)}
                  disabled={isPending}
                  placeholder="Cuéntanos sobre tu proyecto."
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground hover:border-brand-purple focus-visible:border-brand-purple disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                />
              </div>

              <input type="text" name="hp_company" value={values.hp_company} onChange={(e) => update('hp_company', e.target.value)} tabIndex={-1} aria-hidden className="hidden" autoComplete="off" />

              {serverError && (
                <p className="text-sm text-red-600">{serverError}</p>
              )}

              <div className="flex items-center justify-end pt-1">
                <CtaButton type="submit" disabled={isPending}>
                  {isPending ? 'Enviando…' : 'Enviar'}
                </CtaButton>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
