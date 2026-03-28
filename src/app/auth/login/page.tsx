'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
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
import { Eye, EyeOff, Shield } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginFormValues) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      toast.error(error.message ?? 'Sign-in failed. Please try again.')
      return
    }

    router.push('/app/dashboard')
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

        {/* Login card */}
        <Card className="border border-[#1E293B] bg-[#0F1E33] shadow-2xl shadow-black/50">
          <CardHeader className="pb-4 border-b border-[#1E293B]">
            <CardTitle className="text-base font-semibold text-white">
              Sign in to your account
            </CardTitle>
            <CardDescription className="text-[#64748B] text-sm">
              Authorized personnel only. All activity is logged.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardContent className="pt-6 space-y-5">
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
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-xs font-semibold tracking-wider uppercase text-[#94A3B8]"
                  >
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-[#60A5FA] hover:text-[#93C5FD] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
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
                {errors.password && (
                  <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
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
                    Signing in…
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>

              <p className="text-xs text-center text-[#475569]">
                Don&apos;t have an account?{' '}
                <Link
                  href="/auth/signup"
                  className="text-[#60A5FA] hover:text-[#93C5FD] font-medium transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        {/* Footer note */}
        <p className="mt-6 text-center text-[10px] tracking-widest text-[#334155] uppercase">
          LVIS™ is a secure forensic platform &mdash; unauthorized access is prohibited
        </p>
      </div>
    </main>
  )
}
