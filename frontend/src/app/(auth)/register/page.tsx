"use client";

import { useState } from "react";
import { Input } from "@base-ui/react";
import { Stethoscope, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { register } from "./actions";

type AccountRole = "Patient" | "Doctor";

const inputClassName =
    "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const textareaClassName =
    "min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default function RegistrationPage() {
    const [role, setRole] = useState<AccountRole>("Patient");

    return (
        <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <div className="w-full max-w-2xl">
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Register</CardTitle>
                        <CardDescription>Create your tele-consult account.</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form action={register}>
                            <FieldGroup>
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
                                    <Field>
                                        <FieldLabel htmlFor="first-name">First Name</FieldLabel>
                                        <Input id="first-name" name="firstName" autoComplete="given-name" className={inputClassName} placeholder="First name" required />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="last-name">Last Name</FieldLabel>
                                        <Input id="last-name" name="lastName" autoComplete="family-name" className={inputClassName} placeholder="Last name" required />
                                    </Field>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field>
                                        <FieldLabel htmlFor="email">Email</FieldLabel>
                                        <Input id="email" name="email" type="email" autoComplete="email" className={inputClassName} placeholder="you@example.com" required />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="password">Password</FieldLabel>
                                        <Input id="password" name="password" type="password" autoComplete="new-password" className={inputClassName} placeholder="Create a password" required />
                                    </Field>
                                </div>

                                {role === "Patient" ? (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field>
                                            <FieldLabel htmlFor="birthday">Birthday</FieldLabel>
                                            <Input id="birthday" name="birthday" type="date" className={inputClassName} />
                                        </Field>
                                        <Field>
                                            <FieldLabel htmlFor="contact-details">Contact Details</FieldLabel>
                                            <Input id="contact-details" name="contactDetails" autoComplete="tel" className={inputClassName} placeholder="Phone or emergency contact" />
                                        </Field>
                                        <Field>
                                            <FieldLabel htmlFor="weight">Weight</FieldLabel>
                                            <Input id="weight" name="weight" type="number" min="0" step="0.1" className={inputClassName} placeholder="kg" />
                                        </Field>
                                        <Field>
                                            <FieldLabel htmlFor="height">Height</FieldLabel>
                                            <Input id="height" name="height" type="number" min="0" step="0.1" className={inputClassName} placeholder="cm" />
                                        </Field>
                                        <Field className="sm:col-span-2">
                                            <FieldLabel htmlFor="medical-history">Medical History</FieldLabel>
                                            <textarea id="medical-history" name="medicalHistory" className={textareaClassName} placeholder="Allergies, medications, existing conditions" />
                                            <FieldDescription>Optional details help doctors understand your health background.</FieldDescription>
                                        </Field>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        <Field>
                                            <FieldLabel htmlFor="specialization">Specialization</FieldLabel>
                                            <Input id="specialization" name="specialization" autoComplete="organization-title" className={inputClassName} placeholder="Cardiology, pediatrics, dermatology" required />
                                        </Field>
                                        <Field>
                                            <FieldLabel htmlFor="bio">Bio</FieldLabel>
                                            <textarea id="bio" name="bio" className={textareaClassName} placeholder="Clinical background, experience, and areas of care" />
                                            <FieldDescription>This appears on your doctor profile.</FieldDescription>
                                        </Field>
                                    </div>
                                )}

                                <Field>
                                    <FieldLabel htmlFor="profile-picture">Profile Picture URL</FieldLabel>
                                    <Input id="profile-picture" name="profilePicture" type="url" className={inputClassName} placeholder="https://example.com/photo.jpg" />
                                    <FieldDescription>Optional. You can add or change this later.</FieldDescription>
                                </Field>

                                <Button type="submit" size="lg">
                                    Create account
                                </Button>
                            </FieldGroup>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
