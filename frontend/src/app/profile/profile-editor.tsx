"use client";

import { useActionState, useMemo, useState } from "react";
import { Input } from "@base-ui/react";
import {
    ArrowLeft,
    CalendarDays,
    ClipboardList,
    Edit,
    KeyRound,
    LogOut,
    Mail,
    Pill,
    Ruler,
    Save,
    Scale,
    Stethoscope,
    UserRound,
    X,
} from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { signOut, type ProfileActionState, updateProfile } from "./actions";

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
    medicalRecords: MedicalRecord[];
    prescriptions: Prescription[];
};

type MedicalRecord = {
    id: number;
    appointmentId?: number | null;
    patient: number;
    doctor: number;
    diagnosis?: string | null;
    summary?: string | null;
    followUpInstructions?: string | null;
    createdAt?: string | null;
};

type Prescription = {
    id: number;
    patient: number;
    doctor: number;
    record: number;
    medicine: string;
    dosage: number;
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

function formatRecordDate(value: string | null | undefined) {
    if (!value) {
        return "Date unavailable";
    }

    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(value));
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

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Link
                        href="/dashboard"
                        className={buttonVariants({
                            variant: "outline",
                            className: "w-full sm:w-auto",
                        })}
                    >
                        <ArrowLeft className="size-4" />
                        Dashboard
                    </Link>
                    <Button type="button" variant={isEditing ? "outline" : "default"} onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? <X className="size-4" /> : <Edit className="size-4" />}
                        {isEditing ? "Cancel" : "Edit profile"}
                    </Button>
                    <form action={signOut}>
                        <Button type="submit" variant="ghost" className="w-full sm:w-auto">
                            <LogOut className="size-4" />
                            Sign out
                        </Button>
                    </form>
                </div>
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
                            <FieldLabel htmlFor="password">New Password</FieldLabel>
                            <div className="relative">
                                <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input id="password" name="password" type="password" autoComplete="new-password" className={`${inputClassName} pl-9`} placeholder="Leave blank to keep current password" minLength={8} />
                            </div>
                            <FieldDescription>Only fill this in when changing your password.</FieldDescription>
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
        <div className="grid gap-4">
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

            <MedicalRecordsDisplay
                records={profile.medicalRecords}
                prescriptions={profile.prescriptions}
            />
        </div>
    );
}

function MedicalRecordsDisplay({
    records,
    prescriptions,
}: {
    records: MedicalRecord[];
    prescriptions: Prescription[];
}) {
    const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.id ?? null);

    const selectedRecord = useMemo(
        () => records.find((record) => record.id === selectedRecordId) ?? records[0] ?? null,
        [records, selectedRecordId],
    );

    const selectedPrescriptions = useMemo(
        () =>
            selectedRecord
                ? prescriptions.filter((prescription) => prescription.record === selectedRecord.id)
                : [],
        [prescriptions, selectedRecord],
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Medical Records</CardTitle>
                <CardDescription>Consultation notes and associated prescriptions.</CardDescription>
            </CardHeader>
            <CardContent>
                {records.length === 0 ? (
                    <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
                        No medical records found.
                    </div>
                ) : (
                    <div className="grid min-h-[34rem] gap-4 lg:grid-cols-[minmax(14rem,0.85fr)_minmax(0,1.65fr)]">
                        <div className="rounded-lg border bg-background">
                            <div className="border-b px-3 py-2 text-xs font-medium uppercase text-muted-foreground">
                                Records
                            </div>
                            <div className="max-h-[34rem] overflow-y-auto p-2">
                                {records.map((record) => {
                                    const isSelected = record.id === selectedRecord?.id;

                                    return (
                                        <button
                                            className={`flex w-full flex-col gap-1 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                                isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "hover:bg-muted"
                                            }`}
                                            key={record.id}
                                            onClick={() => setSelectedRecordId(record.id)}
                                            type="button"
                                        >
                                            <span className="flex items-center gap-2 font-medium">
                                                <ClipboardList className="size-4" />
                                                {displayValue(record.diagnosis)}
                                            </span>
                                            <span
                                                className={`text-xs ${
                                                    isSelected
                                                        ? "text-primary-foreground/75"
                                                        : "text-muted-foreground"
                                                }`}
                                            >
                                                {formatRecordDate(record.createdAt)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid min-h-[34rem] gap-4 lg:grid-rows-[1fr_2fr]">
                            <section className="rounded-lg border bg-background p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h2 className="font-medium">
                                            {displayValue(selectedRecord?.diagnosis)}
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            {formatRecordDate(selectedRecord?.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                                    <div>
                                        <p className="font-medium">Summary</p>
                                        <p className="mt-1 text-muted-foreground">
                                            {displayValue(selectedRecord?.summary)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-medium">Follow-up Instructions</p>
                                        <p className="mt-1 text-muted-foreground">
                                            {displayValue(selectedRecord?.followUpInstructions)}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-lg border bg-background p-4">
                                <div className="flex items-center gap-2">
                                    <Pill className="size-4 text-muted-foreground" />
                                    <h2 className="font-medium">Prescription Drugs</h2>
                                </div>
                                {selectedPrescriptions.length === 0 ? (
                                    <p className="mt-4 text-sm text-muted-foreground">
                                        No prescriptions attached to this record.
                                    </p>
                                ) : (
                                    <div className="mt-4 grid gap-2">
                                        {selectedPrescriptions.map((prescription) => (
                                            <div
                                                className="grid gap-1 rounded-lg border px-3 py-2 text-sm sm:grid-cols-[1fr_auto] sm:items-center"
                                                key={prescription.id}
                                            >
                                                <span className="font-medium">
                                                    {prescription.medicine}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    Dosage: {prescription.dosage}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
