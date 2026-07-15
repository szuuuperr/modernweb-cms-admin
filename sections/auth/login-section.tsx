"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/input";
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

  if (status === "loading") return <LoadingBlock label="Memeriksa sesi…" />;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold">ModernWeb CMS</h1>
          <p className="text-sm text-slate-500">Masuk untuk mengelola konten</p>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              {error != null && <ErrorBlock error={error} />}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                <FieldError message={errors.email?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                <FieldError message={errors.password?.message} />
              </div>

              <Button type="submit" className="w-full" loading={isSubmitting}>
                Masuk
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
