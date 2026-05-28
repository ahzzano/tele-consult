"use client";

import { useActionState, useState } from "react";
import { Input } from "@base-ui/react";
import { CircleAlert, Stethoscope, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { register, type RegistrationActionState } from "./actions";

type AccountRole = "Patient" | "Doctor";
type RegistrationFieldName = keyof NonNullable<RegistrationActionState["fieldErrors"]>;

const initialState: RegistrationActionState = {
    status: "idle",
};

const inputClassName =
    "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

const textareaClassName =
    "min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

export default function RegistrationPage() {
    const [role, setRole] = useState<AccountRole>("Patient");
    const [state, formAction, isPending] = useActionState(register, initialState);
    const messagesFor = (field: RegistrationFieldName) => state.fieldErrors?.[field];
    const errorsFor = (field: RegistrationFieldName) =>
        messagesFor(field)?.map((message) => ({ message }));
    const hasError = (field: RegistrationFieldName) => Boolean(messagesFor(field)?.length);

    return (
        <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <div className="w-full max-w-2xl">
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Register</CardTitle>
                        <CardDescription>Create your tele-consult account.</CardDescription>
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

                                <div className="flex flex-col gap-2">
                                    <FieldLabel>Account Type</FieldLabel>
                                    <input type="hidden" name="role" value={role} />
                                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
                                        <button
                                            type="button"
                                            aria-pressed={role === "Patient"}
                                            onClick={() => setRole("Patient")}
                                            className={`flex h-9 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors ${role === "Patient"
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            <UserRound className="size-4" />
                                            Patient
                                        </button>
                                        <button
                                            type="button"
                                            aria-pressed={role === "Doctor"}
                                            onClick={() => setRole("Doctor")}
                                            className={`flex h-9 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors ${role === "Doctor"
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            <Stethoscope className="size-4" />
                                            Doctor
                                        </button>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field data-invalid={hasError("firstName")}>
                                        <FieldLabel htmlFor="first-name">First Name</FieldLabel>
                                        <Input id="first-name" name="firstName" autoComplete="given-name" className={inputClassName} placeholder="First name" aria-invalid={hasError("firstName")} required />
                                        <FieldError errors={errorsFor("firstName")} />
                                    </Field>
                                    <Field data-invalid={hasError("lastName")}>
                                        <FieldLabel htmlFor="last-name">Last Name</FieldLabel>
                                        <Input id="last-name" name="lastName" autoComplete="family-name" className={inputClassName} placeholder="Last name" aria-invalid={hasError("lastName")} required />
                                        <FieldError errors={errorsFor("lastName")} />
                                    </Field>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field data-invalid={hasError("email")}>
                                        <FieldLabel htmlFor="email">Email</FieldLabel>
                                        <Input id="email" name="email" type="email" autoComplete="email" className={inputClassName} placeholder="you@example.com" aria-invalid={hasError("email")} required />
                                        <FieldError errors={errorsFor("email")} />
                                    </Field>
                                    <Field data-invalid={hasError("password")}>
                                        <FieldLabel htmlFor="password">Password</FieldLabel>
                                        <Input id="password" name="password" type="password" autoComplete="new-password" className={inputClassName} placeholder="Create a password" aria-invalid={hasError("password")} required />
                                        <FieldError errors={errorsFor("password")} />
                                    </Field>
                                </div>

                                {role === "Patient" ? (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field data-invalid={hasError("birthday")}>
                                            <FieldLabel htmlFor="birthday">Birthday</FieldLabel>
                                            <Input id="birthday" name="birthday" type="date" className={inputClassName} aria-invalid={hasError("birthday")} />
                                            <FieldError errors={errorsFor("birthday")} />
                                        </Field>
                                        <Field data-invalid={hasError("contactDetails")}>
                                            <FieldLabel htmlFor="contact-details">Contact Details</FieldLabel>
                                            <Input id="contact-details" name="contactDetails" autoComplete="tel" className={inputClassName} placeholder="Phone or emergency contact" aria-invalid={hasError("contactDetails")} />
                                            <FieldError errors={errorsFor("contactDetails")} />
                                        </Field>
                                        <Field data-invalid={hasError("weight")}>
                                            <FieldLabel htmlFor="weight">Weight</FieldLabel>
                                            <Input id="weight" name="weight" type="number" min="0" step="0.1" className={inputClassName} placeholder="kg" aria-invalid={hasError("weight")} />
                                            <FieldError errors={errorsFor("weight")} />
                                        </Field>
                                        <Field data-invalid={hasError("height")}>
                                            <FieldLabel htmlFor="height">Height</FieldLabel>
                                            <Input id="height" name="height" type="number" min="0" step="0.1" className={inputClassName} placeholder="cm" aria-invalid={hasError("height")} />
                                            <FieldError errors={errorsFor("height")} />
                                        </Field>
                                        <Field className="sm:col-span-2" data-invalid={hasError("medicalHistory")}>
                                            <FieldLabel htmlFor="medical-history">Medical History</FieldLabel>
                                            <textarea id="medical-history" name="medicalHistory" className={textareaClassName} placeholder="Allergies, medications, existing conditions" aria-invalid={hasError("medicalHistory")} />
                                            <FieldDescription>Optional details help doctors understand your health background.</FieldDescription>
                                            <FieldError errors={errorsFor("medicalHistory")} />
                                        </Field>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        <Field data-invalid={hasError("specialization")}>
                                            <FieldLabel htmlFor="specialization">Specialization</FieldLabel>
                                            <Input id="specialization" name="specialization" autoComplete="organization-title" className={inputClassName} placeholder="Cardiology, pediatrics, dermatology" aria-invalid={hasError("specialization")} required />
                                            <FieldError errors={errorsFor("specialization")} />
                                        </Field>
                                        <Field data-invalid={hasError("bio")}>
                                            <FieldLabel htmlFor="bio">Bio</FieldLabel>
                                            <textarea id="bio" name="bio" className={textareaClassName} placeholder="Clinical background, experience, and areas of care" aria-invalid={hasError("bio")} />
                                            <FieldDescription>This appears on your doctor profile.</FieldDescription>
                                            <FieldError errors={errorsFor("bio")} />
                                        </Field>
                                    </div>
                                )}

                                <Field data-invalid={hasError("profilePicture")}>
                                    <FieldLabel htmlFor="profile-picture">Profile Picture URL</FieldLabel>
                                    <Input id="profile-picture" name="profilePicture" type="url" className={inputClassName} placeholder="https://example.com/photo.jpg" aria-invalid={hasError("profilePicture")} />
                                    <FieldDescription>Optional. You can add or change this later.</FieldDescription>
                                    <FieldError errors={errorsFor("profilePicture")} />
                                </Field>

                                <Button type="submit" size="lg" disabled={isPending}>
                                    {isPending ? "Creating account..." : "Create account"}
                                </Button>
                            </FieldGroup>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
