"use client";

import { useActionState, useState } from "react";
import { Input } from "@base-ui/react";
import { CalendarDays, Edit, Mail, Ruler, Save, Scale, Stethoscope, UserRound, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { type ProfileActionState, updateProfile } from "./actions";

export type AccountProfile = {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    createdAt?: string | null;
    role: "Patient" | "Doctor";
    doctorProfile?: {
        bio?: string | null;
        specialization?: string | null;
        profilePicture?: string | null;
    } | null;
    patientProfile?: {
        birthday?: string | null;
        weight?: string | null;
        height?: string | null;
        contactDetails?: string | null;
        medicalHistory?: string | null;
        profilePicture?: string | null;
    } | null;
};

const initialState: ProfileActionState = {
    status: "idle",
};

const inputClassName =
    "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const textareaClassName =
    "min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function displayValue(value: string | number | null | undefined) {
    return value ? String(value) : "Not provided";
}

export function ProfileEditor({ profile }: { profile: AccountProfile }) {
    const [isEditing, setIsEditing] = useState(false);
    const [state, formAction, isPending] = useActionState(updateProfile, initialState);
    const profilePicture =
        profile.doctorProfile?.profilePicture ?? profile.patientProfile?.profilePicture;

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    {profilePicture ? (
                        <div
                            aria-label={`${profile.firstName} ${profile.lastName}`}
                            className="size-16 rounded-full border bg-cover bg-center"
                            role="img"
                            style={{ backgroundImage: `url(${profilePicture})` }}
                        />
                    ) : (
                        <div className="flex size-16 items-center justify-center rounded-full border bg-background">
                            <UserRound className="size-7 text-muted-foreground" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-semibold tracking-normal">
                            {profile.firstName} {profile.lastName}
                        </h1>
                        <p className="text-sm text-muted-foreground">{profile.role} Profile</p>
                    </div>
                </div>

                <Button type="button" variant={isEditing ? "outline" : "default"} onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? <X className="size-4" /> : <Edit className="size-4" />}
                    {isEditing ? "Cancel" : "Edit profile"}
                </Button>
            </div>

            {isEditing ? (
                <ProfileForm profile={profile} formAction={formAction} isPending={isPending} state={state} />
            ) : (
                <ProfileView profile={profile} />
            )}
        </div>
    );
}

function ProfileForm({
    profile,
    formAction,
    isPending,
    state,
}: {
    profile: AccountProfile;
    formAction: (formData: FormData) => void;
    isPending: boolean;
    state: ProfileActionState;
}) {
    const profilePicture =
        profile.doctorProfile?.profilePicture ?? profile.patientProfile?.profilePicture;

    return (
        <form action={formAction}>
            <input type="hidden" name="id" value={profile.id} />
            <input type="hidden" name="role" value={profile.role} />

            <FieldGroup>
                <Card>
                    <CardHeader>
                        <CardTitle>Account</CardTitle>
                        <CardDescription>Update basic account information.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <Field>
                            <FieldLabel htmlFor="first-name">First Name</FieldLabel>
                            <Input id="first-name" name="firstName" className={inputClassName} defaultValue={profile.firstName} required />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="last-name">Last Name</FieldLabel>
                            <Input id="last-name" name="lastName" className={inputClassName} defaultValue={profile.lastName} required />
                        </Field>
                        <Field className="sm:col-span-2">
                            <FieldLabel htmlFor="email">Email</FieldLabel>
                            <Input id="email" name="email" type="email" className={inputClassName} defaultValue={profile.email} required />
                        </Field>
                        <Field className="sm:col-span-2">
                            <FieldLabel htmlFor="profile-picture">Profile Picture URL</FieldLabel>
                            <Input id="profile-picture" name="profilePicture" type="url" className={inputClassName} defaultValue={profilePicture ?? ""} />
                        </Field>
                    </CardContent>
                </Card>

                {profile.role === "Doctor" ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Doctor Details</CardTitle>
                            <CardDescription>Update information shown to patients.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <Field>
                                <FieldLabel htmlFor="specialization">Specialization</FieldLabel>
                                <Input id="specialization" name="specialization" className={inputClassName} defaultValue={profile.doctorProfile?.specialization ?? ""} />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="bio">Bio</FieldLabel>
                                <textarea id="bio" name="bio" className={textareaClassName} defaultValue={profile.doctorProfile?.bio ?? ""} />
                                <FieldDescription>This appears on your doctor profile.</FieldDescription>
                            </Field>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Patient Details</CardTitle>
                            <CardDescription>Update health information for consultations.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="birthday">Birthday</FieldLabel>
                                <Input id="birthday" name="birthday" type="date" className={inputClassName} defaultValue={profile.patientProfile?.birthday ?? ""} />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="contact-details">Contact Details</FieldLabel>
                                <Input id="contact-details" name="contactDetails" className={inputClassName} defaultValue={profile.patientProfile?.contactDetails ?? ""} />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="weight">Weight</FieldLabel>
                                <Input id="weight" name="weight" type="number" min="0" step="0.1" className={inputClassName} defaultValue={profile.patientProfile?.weight ?? ""} />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="height">Height</FieldLabel>
                                <Input id="height" name="height" type="number" min="0" step="0.1" className={inputClassName} defaultValue={profile.patientProfile?.height ?? ""} />
                            </Field>
                            <Field className="sm:col-span-2">
                                <FieldLabel htmlFor="medical-history">Medical History</FieldLabel>
                                <textarea id="medical-history" name="medicalHistory" className={textareaClassName} defaultValue={profile.patientProfile?.medicalHistory ?? ""} />
                            </Field>
                        </CardContent>
                    </Card>
                )}

                {state.message ? (
                    <p className={`text-sm ${state.status === "error" ? "text-destructive" : "text-emerald-600"}`}>
                        {state.message}
                    </p>
                ) : null}

                <Button type="submit" size="lg" disabled={isPending}>
                    <Save className="size-4" />
                    {isPending ? "Saving..." : "Save profile"}
                </Button>
            </FieldGroup>
        </form>
    );
}

function ProfileView({ profile }: { profile: AccountProfile }) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>Basic account information.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                    <div className="flex items-center gap-3">
                        <Mail className="size-4 text-muted-foreground" />
                        <span>{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <UserRound className="size-4 text-muted-foreground" />
                        <span>{profile.role}</span>
                    </div>
                </CardContent>
            </Card>

            {profile.role === "Doctor" ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Doctor Details</CardTitle>
                        <CardDescription>Information shown to patients.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm">
                        <div className="flex items-center gap-3">
                            <Stethoscope className="size-4 text-muted-foreground" />
                            <span>{displayValue(profile.doctorProfile?.specialization)}</span>
                        </div>
                        <div>
                            <p className="font-medium">Bio</p>
                            <p className="mt-1 text-muted-foreground">
                                {displayValue(profile.doctorProfile?.bio)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Patient Details</CardTitle>
                        <CardDescription>Health information for consultations.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm">
                        <div className="flex items-center gap-3">
                            <CalendarDays className="size-4 text-muted-foreground" />
                            <span>{displayValue(profile.patientProfile?.birthday)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Scale className="size-4 text-muted-foreground" />
                            <span>{displayValue(profile.patientProfile?.weight)} kg</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Ruler className="size-4 text-muted-foreground" />
                            <span>{displayValue(profile.patientProfile?.height)} cm</span>
                        </div>
                        <div>
                            <p className="font-medium">Contact Details</p>
                            <p className="mt-1 text-muted-foreground">
                                {displayValue(profile.patientProfile?.contactDetails)}
                            </p>
                        </div>
                        <div>
                            <p className="font-medium">Medical History</p>
                            <p className="mt-1 text-muted-foreground">
                                {displayValue(profile.patientProfile?.medicalHistory)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
