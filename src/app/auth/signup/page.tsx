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
import { Eye, EyeOff, Shield, CheckCircle2 } from 'lucide-react'

const signupSchema = z
  .object({
    full_name: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Name is too long'),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (values: SignupFormValues) => {
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.full_name,
        },
      },
    })

    if (error) {
      toast.error(error.message ?? 'Registration failed. Please try again.')
      return
    }

    setSubmittedEmail(values.email)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0F172A] px-4 py-12">
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#60A5FA 1px, transparent 1px), linear-gradient(90deg, #60A5FA 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1E3A5F] border border-[#2D5A8E] mb-5 shadow-lg shadow-blue-950/40">
            <Shield className="w-7 h-7 text-[#60A5FA]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            LVIS<span className="text-[#60A5FA] text-lg align-super ml-0.5">™</span>
          </h1>
          <p className="text-sm font-medium tracking-widest text-[#64748B] uppercase mb-8">
            Image Integrity System™
          </p>

          <Card className="border border-[#1E293B] bg-[#0F1E33] shadow-2xl shadow-black/50">
            <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#0F2D1F] border border-[#166534]">
                <CheckCircle2 className="w-8 h-8 text-[#4ADE80]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-white">Check your email</h2>
                <p className="text-sm text-[#64748B] max-w-xs mx-auto">
                  A confirmation link has been sent to{' '}
                  <span className="text-[#93C5FD] font-medium">{submittedEmail}</span>.
                  Click the link to activate your account.
                </p>
              </div>
              <div className="mt-2 pt-4 border-t border-[#1E293B] w-full text-center">
                <p className="text-xs text-[#475569]">
                  Already confirmed?{' '}
                  <Link
                    href="/auth/login"
                    className="text-[#60A5FA] hover:text-[#93C5FD] font-medium transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0F172A] px-4 py-12">
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
            Image Integrity System™
          </p>
        </div>

        {/* Signup card */}
        <Card className="border border-[#1E293B] bg-[#0F1E33] shadow-2xl shadow-black/50">
          <CardHeader className="pb-4 border-b border-[#1E293B]">
            <CardTitle className="text-base font-semibold text-white">
              Create an account
            </CardTitle>
            <CardDescription className="text-[#64748B] text-sm">
              Request access to the LVIS forensic platform.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardContent className="pt-6 space-y-5">
              {/* Full name */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="full_name"
                  className="text-xs font-semibold tracking-wider uppercase text-[#94A3B8]"
                >
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Smith"
                  {...register('full_name')}
                  className="
                    bg-[#0F172A] border-[#1E293B] text-white placeholder:text-[#334155]
                    focus-visible:ring-[#2D5A8E] focus-visible:border-[#2D5A8E]
                    h-10 text-sm
                  "
                />
                {errors.full_name && (
                  <p className="text-xs text-red-400 mt-1">{errors.full_name.message}</p>
                )}
              </div>

              {/* Email */}
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

              {/* Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold tracking-wider uppercase text-[#94A3B8]"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...register('password')}
                    className="
                      bg-[#0F172A] border-[#1E293B] text-white placeholder:text-[#334155]
                      focus-visible:ring-[#2D5A8E] focus-visible:border-[#2D5A8E]
                      h-10 text-sm pr-10
                    "
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94A3B8] transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password ? (
                  <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
                ) : (
                  <p className="text-[11px] text-[#475569] mt-1">
                    Min. 8 characters, one uppercase letter and one number
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="confirmPassword"
                  className="text-xs font-semibold tracking-wider uppercase text-[#94A3B8]"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    className="
                      bg-[#0F172A] border-[#1E293B] text-white placeholder:text-[#334155]
                      focus-visible:ring-[#2D5A8E] focus-visible:border-[#2D5A8E]
                      h-10 text-sm pr-10
                    "
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94A3B8] transition-colors"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>
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
                    Creating account…
                  </span>
                ) : (
                  'Create account'
                )}
              </Button>

              <p className="text-xs text-center text-[#475569]">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="text-[#60A5FA] hover:text-[#93C5FD] font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <p className="mt-6 text-center text-[10px] tracking-widest text-[#334155] uppercase">
          LVIS™ is a secure forensic platform &mdash; unauthorized access is prohibited
        </p>
      </div>
    </main>
  )
}
