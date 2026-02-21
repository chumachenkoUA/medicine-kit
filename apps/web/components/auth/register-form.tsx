"use client"

import Link from "next/link"
import { startTransition, useActionState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { registerAction, type AuthFormState } from "@/app/(auth)/actions"
import { AuthCardHeader } from "@/components/auth/auth-card-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { registerSchema, type RegisterInput } from "@/lib/validation/auth"

const initialState: AuthFormState = { success: false }

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState
  )
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      surname: "",
      username: "",
      email: "",
      password: "",
    },
  })

  useEffect(() => {
    if (!state.errors) return
    for (const [field, messages] of Object.entries(state.errors)) {
      const message = Array.isArray(messages) ? messages[0] : undefined
      if (message) {
        setError(field as keyof RegisterInput, { type: "server", message })
      }
    }
  }, [setError, state.errors])

  const onSubmit = (values: RegisterInput) => {
    const formData = new FormData()
    formData.set("name", values.name)
    formData.set("surname", values.surname)
    formData.set("username", values.username)
    formData.set("email", values.email)
    formData.set("password", values.password)
    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm dark:bg-card">
      <AuthCardHeader
        title="Реєстрація"
        description="Створи акаунт, щоб зберігати ліки та курси прийому."
      />
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Імʼя</Label>
              <Input
                id="name"
                type="text"
                placeholder="Іван"
                aria-invalid={Boolean(errors.name)}
                disabled={isPending}
                {...register("name")}
              />
              {errors.name?.message ? (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname">Прізвище</Label>
              <Input
                id="surname"
                type="text"
                placeholder="Іваненко"
                aria-invalid={Boolean(errors.surname)}
                disabled={isPending}
                {...register("surname")}
              />
              {errors.surname?.message ? (
                <p className="text-sm text-destructive">{errors.surname.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="ivanenko"
              aria-invalid={Boolean(errors.username)}
              disabled={isPending}
              {...register("username")}
            />
            {errors.username?.message ? (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            ) : null}
          </div>

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
              placeholder="Мінімум 8 символів"
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

          {state.success ? (
            <p className="text-sm text-emerald-600">
              Акаунт створено. Тепер увійди у систему.
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Перевірка..." : "Зареєструватися"}
          </Button>
        </form>

        <div className="my-4">
          <Separator />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Уже є акаунт?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Увійти
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
