import Link from "next/link";
import { Input } from "@base-ui/react";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { login } from "./actions";

const inputClassName =
    "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default function LoginPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <div className="w-full max-w-xl">
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Login</CardTitle>
                        <CardDescription>Access your tele-consult account.</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form action={login}>
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="email">Email</FieldLabel>
                                    <Input id="email" name="email" autoComplete="email" className={inputClassName} placeholder="you@example.com" type="email" required />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="password">Password</FieldLabel>
                                    <Input id="password" name="password" autoComplete="current-password" className={inputClassName} placeholder="Enter your password" type="password" required />
                                </Field>

                                <Button type="submit" size="lg">
                                    <LogIn className="size-4" />
                                    Login
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
