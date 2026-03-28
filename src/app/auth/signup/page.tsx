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

const signupSchema = z.object({
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
})

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  })

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      toast.error(error.message ?? 'Google sign-in failed. Please try again.')
      setGoogleLoading(false)
    }
  }

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
            LV Image Integrity System™
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
            LV Image Integrity System™
          </p>
        </div>

        {/* Signup card */}
        <Card className="border border-[#1E293B] bg-[#0F1E33] shadow-2xl shadow-black/50">
          <CardHeader className="pb-4 border-b border-[#1E293B]">
            <CardTitle className="text-base font-semibold text-white">
              Create an account
            </CardTitle>
            <CardDescription className="text-[#64748B] text-sm">
              Start your free account — no credit card required.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 h-10 rounded-md border border-[#1E293B] bg-white text-[#1E293B] text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              {googleLoading ? (
                <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#1E293B]" />
              <span className="text-[#334155] text-xs">or</span>
              <div className="flex-1 h-px bg-[#1E293B]" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
            </form>

            <p className="text-xs text-center text-[#475569] pt-1">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="text-[#60A5FA] hover:text-[#93C5FD] font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-[10px] tracking-widest text-[#334155] uppercase">
          LVIS™ is a secure forensic platform &mdash; unauthorized access is prohibited
        </p>
      </div>
    </main>
  )
}
