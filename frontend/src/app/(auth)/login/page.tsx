"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Input } from "@base-ui/react";
import { CircleAlert, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { login, type LoginActionState } from "./actions";

const initialState: LoginActionState = {
    status: "idle",
};

const inputClassName =
    "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, initialState);
    const emailErrors = state.fieldErrors?.email;
    const passwordErrors = state.fieldErrors?.password;

    return (
        <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <div className="w-full max-w-xl">
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Login</CardTitle>
                        <CardDescription>Access your tele-consult account.</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form action={formAction}>
                            <FieldGroup>
                                {state.message ? (
                                    <div role="alert" aria-live="polite" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                                        <CircleAlert className="mt-0.5 size-4 shrink-0" />
                                        <p>{state.message}</p>
                                    </div>
                                ) : null}

                                <Field data-invalid={Boolean(emailErrors?.length)}>
                                    <FieldLabel htmlFor="email">Email</FieldLabel>
                                    <Input id="email" name="email" autoComplete="email" className={inputClassName} placeholder="you@example.com" type="email" aria-invalid={Boolean(emailErrors?.length)} required />
                                    <FieldError errors={emailErrors?.map((message) => ({ message }))} />
                                </Field>

                                <Field data-invalid={Boolean(passwordErrors?.length)}>
                                    <FieldLabel htmlFor="password">Password</FieldLabel>
                                    <Input id="password" name="password" autoComplete="current-password" className={inputClassName} placeholder="Enter your password" type="password" aria-invalid={Boolean(passwordErrors?.length)} required />
                                    <FieldError errors={passwordErrors?.map((message) => ({ message }))} />
                                </Field>

                                <Button type="submit" size="lg" disabled={isPending}>
                                    <LogIn className="size-4" />
                                    {isPending ? "Logging in..." : "Login"}
                                </Button>

                                <p className="text-center text-sm text-muted-foreground">
                                    Need an account?{" "}
                                    <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
                                        Register
                                    </Link>
                                </p>
                            </FieldGroup>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
