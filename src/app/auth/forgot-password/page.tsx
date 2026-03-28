'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Shield, Mail, ArrowLeft } from 'lucide-react'

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type ForgotFormValues = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (values: ForgotFormValues) => {
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo,
    })

    if (error) {
      toast.error(error.message ?? 'Failed to send reset link. Please try again.')
      return
    }

    setSubmittedEmail(values.email)
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0F172A] px-4 py-12">
      {/* Subtle grid texture overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#60A5FA 1px, transparent 1px), linear-gradient(90deg, #60A5FA 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Brand header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1E3A5F] border border-[#2D5A8E] mb-5 shadow-lg shadow-blue-950/40">
            <Shield className="w-7 h-7 text-[#60A5FA]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            LVIS<span className="text-[#60A5FA] text-lg align-super ml-0.5">™</span>
          </h1>
          <p className="mt-1 text-sm font-medium tracking-widest text-[#64748B] uppercase">
            LV Image Integrity System™
          </p>
        </div>

        {/* Card */}
        <Card className="border border-[#1E293B] bg-[#0F1E33] shadow-2xl shadow-black/50">
          {!submitted ? (
            <>
              <CardHeader className="pb-4 border-b border-[#1E293B]">
                <CardTitle className="text-base font-semibold text-white">
                  Reset your password
                </CardTitle>
                <CardDescription className="text-[#64748B] text-sm">
                  Enter your account email and we&apos;ll send you a secure reset link.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <CardContent className="pt-6 space-y-5">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="email"
                      className="text-xs font-semibold tracking-wider uppercase text-[#94A3B8]"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      {...register('email')}
                      className="
                        bg-[#0F172A] border-[#1E293B] text-white placeholder:text-[#334155]
                        focus-visible:ring-[#2D5A8E] focus-visible:border-[#2D5A8E]
                        h-10 text-sm
                      "
                    />
                    {errors.email && (
                      <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 pt-2 pb-6 px-6">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="
                      w-full h-10 text-sm font-semibold tracking-wide
                      bg-[#1D4ED8] hover:bg-[#2563EB] text-white
                      border border-[#2D5A8E] shadow-md shadow-blue-950/30
                      transition-all duration-150 disabled:opacity-60
                    "
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending reset link…
                      </span>
                    ) : (
                      'Send reset link'
                    )}
                  </Button>

                  <Link
                    href="/auth/login"
                    className="flex items-center justify-center gap-1.5 text-xs text-[#475569] hover:text-[#94A3B8] transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back to sign in
                  </Link>
                </CardFooter>
              </form>
            </>
          ) : (
            /* Success state */
            <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#1E3A5F] border border-[#2D5A8E]">
                <Mail className="w-8 h-8 text-[#60A5FA]" />
              </div>
              <div className="space-y-2 text-center">
                <h2 className="text-lg font-semibold text-white">Reset link sent</h2>
                <p className="text-sm text-[#64748B] max-w-xs mx-auto">
                  If an account exists for{' '}
                  <span className="text-[#93C5FD] font-medium">{submittedEmail}</span>, you
                  will receive a password reset link shortly.
                </p>
                <p className="text-xs text-[#475569] max-w-xs mx-auto pt-1">
                  Check your spam folder if you don&apos;t see it within a few minutes.
                </p>
              </div>
              <div className="mt-2 pt-4 border-t border-[#1E293B] w-full text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1.5 text-xs text-[#60A5FA] hover:text-[#93C5FD] font-medium transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back to sign in
                </Link>
              </div>
            </CardContent>
          )}
        </Card>

        <p className="mt-6 text-center text-[10px] tracking-widest text-[#334155] uppercase">
          LVIS™ is a secure forensic platform &mdash; unauthorized access is prohibited
        </p>
      </div>
    </main>
  )
}
