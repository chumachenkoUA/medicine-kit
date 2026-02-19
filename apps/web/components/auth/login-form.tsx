"use client"

import Link from "next/link"
import { useActionState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { loginAction, type AuthFormState } from "@/app/(auth)/actions"
import { AuthCardHeader } from "@/components/auth/auth-card-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { loginSchema, type LoginInput } from "@/lib/validation/auth"

const initialState: AuthFormState = { success: false }

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  useEffect(() => {
    if (!state.errors) return
    for (const [field, messages] of Object.entries(state.errors)) {
      const message = Array.isArray(messages) ? messages[0] : undefined
      if (message) {
        setError(field as keyof LoginInput, { type: "server", message })
      }
    }
  }, [setError, state.errors])

  const onSubmit = (values: LoginInput) => {
    const formData = new FormData()
    formData.set("email", values.email)
    formData.set("password", values.password)
    formAction(formData)
  }

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm dark:bg-card">
      <AuthCardHeader
        title="Вхід"
        description="Увійди в акаунт, щоб відкрити дашборд і курси прийому."
      />
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              aria-invalid={Boolean(errors.email)}
              disabled={isPending}
              {...register("email")}
            />
            {errors.email?.message ? (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="Введи пароль"
              aria-invalid={Boolean(errors.password)}
              disabled={isPending}
              {...register("password")}
            />
            {errors.password?.message ? (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            ) : null}
          </div>

          {state.formError ? (
            <p className="text-sm text-destructive">{state.formError}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Перевірка..." : "Увійти"}
          </Button>
        </form>

        <div className="my-4">
          <Separator />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Немає акаунта?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Реєстрація
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
