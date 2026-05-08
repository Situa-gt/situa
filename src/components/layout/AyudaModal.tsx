'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CtaButton } from '@/components/ui/cta-button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  message: '',
}

export function AyudaModal() {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState(EMPTY)
  const [submitted, setSubmitted] = useState(false)
  const [isPending, setIsPending] = useState(false)

  function update(key: keyof typeof EMPTY, value: string) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setTimeout(() => {
        setValues(EMPTY)
        setSubmitted(false)
      }, 200)
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    // TODO: wire SendGrid — submit general help lead
    setTimeout(() => {
      setIsPending(false)
      setSubmitted(true)
    }, 800)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className="cursor-pointer text-sm text-white/80 transition hover:text-white">
        Ayuda
      </DialogTrigger>

      <DialogContent className="w-full p-8 sm:max-w-lg" showCloseButton>
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
              ¡Gracias por escribirnos!
            </h2>
            <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
              Recibimos tu mensaje. Nuestro equipo te contactará pronto para ayudarte.
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
                ¿En qué podemos ayudarte?
              </h2>
              <p className="text-sm text-zinc-500">
                Cuéntanos qué buscas y te orientamos.
              </p>
            </div>

            <form onSubmit={onSubmit} noValidate className="mt-2 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ayuda-name">Nombre</Label>
                <Input
                  id="ayuda-name"
                  required
                  value={values.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Ej. Ana García"
                  disabled={isPending}
                  className="h-10"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ayuda-email">Correo</Label>
                <Input
                  id="ayuda-email"
                  type="email"
                  required
                  value={values.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  disabled={isPending}
                  className="h-10"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ayuda-phone">Teléfono</Label>
                <Input
                  id="ayuda-phone"
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
                <Label htmlFor="ayuda-message">Mensaje</Label>
                <textarea
                  id="ayuda-message"
                  rows={3}
                  maxLength={500}
                  value={values.message}
                  onChange={(e) => update('message', e.target.value)}
                  disabled={isPending}
                  placeholder="Cuéntanos qué tipo de propiedad buscas, zona, presupuesto…"
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground hover:border-brand-purple focus-visible:border-brand-purple disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                />
              </div>

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
