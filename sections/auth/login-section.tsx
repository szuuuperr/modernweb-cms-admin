"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { ErrorBlock, LoadingBlock } from "@/components/ui/feedback";

const schema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type FormValues = z.infer<typeof schema>;

export function LoginSection() {
  const { login, status } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<unknown>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Someone with a live refresh cookie who opens /login directly should land
  // in the panel, not stare at a form they no longer need.
  useEffect(() => {
    if (status === "authenticated") router.replace("/websites");
  }, [status, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values.email, values.password);
      router.replace("/websites");
    } catch (err) {
      setError(err);
    }
  });

  return (
    <div className="auth-gradient relative flex min-h-screen items-center justify-center p-4">
      {/* Fixed + z-0, so the card below must stay z-10 to survive. */}
      <div className="grid-bg" aria-hidden />

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Brand sits on the backdrop, above the card — not inside it. */}
        <div className="mb-7 flex justify-center">
          <Logo width={168} />
        </div>

        {status === "loading" ? (
          <div className="rounded-2xl bg-surface p-8 shadow-auth">
            <LoadingBlock label="Memeriksa sesi…" />
          </div>
        ) : (
          <div className="rounded-2xl bg-surface p-8 shadow-auth">
            <div className="mb-7 text-center">
              <h1 className="text-xl font-semibold">Selamat datang</h1>
              <p className="mt-1 text-sm text-muted">
                Masuk untuk mengelola konten website Anda.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              {error != null && <ErrorBlock error={error} />}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Masukkan email Anda"
                  autoFocus
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                <FieldError message={errors.email?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    className="pr-10"
                    aria-invalid={!!errors.password}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-0 top-0 flex h-9 w-10 items-center justify-center rounded-r-lg text-faint transition-colors hover:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700/40"
                    aria-label={
                      showPassword ? "Sembunyikan password" : "Tampilkan password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <FieldError message={errors.password?.message} />
              </div>

              <Button
                type="submit"
                className="mt-2 h-10 w-full"
                loading={isSubmitting}
              >
                Masuk
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted">
              Akun panel dibuat oleh administrator platform.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
