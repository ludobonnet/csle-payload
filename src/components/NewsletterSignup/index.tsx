'use client'

import React, { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getClientSideURL } from '@/utilities/getURL'
import type { Form } from '@/payload-types'

interface NewsletterSignupProps {
  form?: Form
}

export const NewsletterSignup: React.FC<NewsletterSignupProps> = ({ form }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<{ email: string }>()

  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const onSubmit = useCallback(
    async (data: { email: string }) => {
      if (!form?.id) {
        setError('Le formulaire de newsletter n\'est pas configuré.')
        return
      }

      setError(undefined)
      setIsLoading(true)

      try {
        const req = await fetch(`${getClientSideURL()}/api/form-submissions`, {
          body: JSON.stringify({
            form: form.id,
            submissionData: [
              {
                field: 'email',
                value: data.email,
              },
            ],
          }),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        const res = await req.json()

        if (req.status >= 400) {
          setError(res.errors?.[0]?.message || 'Une erreur est survenue.')
          setIsLoading(false)
          return
        }

        setIsLoading(false)
        setHasSubmitted(true)
        reset()
      } catch (err) {
        console.error('Newsletter signup error:', err)
        setIsLoading(false)
        setError('Une erreur est survenue. Veuillez réessayer.')
      }
    },
    [form?.id, reset],
  )

  if (!form) {
    return null
  }

  if (hasSubmitted) {
    return (
      <div className="text-center py-4">
        <p className="text-body-sm text-white/90">
          Merci ! Vous êtes inscrit(e) à notre newsletter.
        </p>
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            type="email"
            placeholder="Votre email"
            {...register('email', {
              required: 'L\'email est requis',
              pattern: {
                value: /^\S[^\s@]*@\S+$/,
                message: 'Email invalide',
              },
            })}
            disabled={isLoading}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-primary focus:ring-primary"
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
        </div>
        <Button
          type="submit"
          variant="default"
          disabled={isLoading}
          className="whitespace-nowrap"
        >
          {isLoading ? 'Envoi...' : "S'inscrire"}
        </Button>
      </form>

      {errors.email && (
        <p id="email-error" className="mt-2 text-caption text-red-400">
          {errors.email.message}
        </p>
      )}

      {error && (
        <p className="mt-2 text-caption text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
