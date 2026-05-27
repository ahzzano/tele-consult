import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarDays, Mail, Ruler, Scale, Stethoscope, UserRound } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AuthTokenPayload = {
    email?: string;
};

type AccountProfile = {
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

type ProfileResponse = {
    success: boolean;
    data: AccountProfile | null;
};

function decodeJwtPayload(token: string): AuthTokenPayload {
    const payload = token.split(".")[1];

    if (!payload) {
        return {};
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = Buffer.from(normalizedPayload, "base64").toString("utf8");

    return JSON.parse(decodedPayload) as AuthTokenPayload;
}

function displayValue(value: string | number | null | undefined) {
    return value ? String(value) : "Not provided";
}

export default async function ProfilePage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
        redirect("/login");
    }

    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        throw new Error("BACKEND_URL is not configured");
    }

    const tokenPayload = decodeJwtPayload(token);

    if (!tokenPayload.email) {
        redirect("/login");
    }

    const response = await fetch(`${backendUrl}/account/${encodeURIComponent(tokenPayload.email)}`, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Failed to load profile");
    }

    const body = (await response.json()) as ProfileResponse;
    const profile = body.data;

    if (!profile) {
        redirect("/login");
    }

    const profilePicture =
        profile.doctorProfile?.profilePicture ?? profile.patientProfile?.profilePicture;

    return (
        <main className="min-h-screen bg-muted/30">
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
                </div>

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
            </div>
        </main>
    );
}
