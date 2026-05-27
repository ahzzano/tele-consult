"use client";

import { useState } from "react";
import { CalendarDays, ClipboardList, Stethoscope, UserRound } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    DoctorAvailabilityPlanner,
    type AppointmentBlock,
} from "./doctor-availability-planner";
import { PatientDoctorSearch } from "./patient-doctor-search";

type DashboardMode = "Patient" | "Doctor";

type DashboardModeSwitcherProps = {
    profile: {
        id: number;
        role: DashboardMode;
    };
    appointmentBlocks: AppointmentBlock[];
};

const modeButtonClassName =
    "flex h-9 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors";

export function DashboardModeSwitcher({
    profile,
    appointmentBlocks,
}: DashboardModeSwitcherProps) {
    const [mode, setMode] = useState<DashboardMode>(profile.role);

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                        Viewing as {mode.toLowerCase()}.
                    </p>
                </div>

                <div className="grid w-full grid-cols-2 gap-2 rounded-lg bg-muted p-1 sm:w-80">
                    <button
                        type="button"
                        aria-pressed={mode === "Patient"}
                        disabled={profile.role !== "Patient"}
                        onClick={() => setMode("Patient")}
                        className={`${modeButtonClassName} ${mode === "Patient"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-muted-foreground"
                            }`}
                    >
                        <UserRound className="size-4" />
                        Patient
                    </button>
                    <button
                        type="button"
                        aria-pressed={mode === "Doctor"}
                        disabled={profile.role !== "Doctor"}
                        onClick={() => setMode("Doctor")}
                        className={`${modeButtonClassName} ${mode === "Doctor"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-muted-foreground"
                            }`}
                    >
                        <Stethoscope className="size-4" />
                        Doctor
                    </button>
                </div>
                <div>
                    <Button variant="link">
                        <Link href="/profile">Profile</Link>
                    </Button>
                </div>
            </div>
            {mode === "Patient" ? (
                <PatientDashboard />
            ) : (
                <DoctorDashboard
                    doctorId={profile.role === "Doctor" ? profile.id : null}
                    appointmentBlocks={appointmentBlocks}
                />
            )}
        </div>
    );
}

function PatientDashboard() {
    return (
        <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Consultation</CardTitle>
                        <CardDescription>Your next appointment schedule.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3 text-sm">
                            <CalendarDays className="size-5 text-muted-foreground" />
                            <span>No upcoming consultation scheduled.</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Medical Summary</CardTitle>
                        <CardDescription>Patient details available to your doctor.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3 text-sm">
                            <ClipboardList className="size-5 text-muted-foreground" />
                            <span>Complete your profile to improve consultation context.</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <PatientDoctorSearch />
        </div>
    );
}

function DoctorDashboard({
    doctorId,
    appointmentBlocks,
}: {
    doctorId: number | null;
    appointmentBlocks: AppointmentBlock[];
}) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Patient Queue</CardTitle>
                    <CardDescription>Consultations waiting for review.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3 text-sm">
                        <ClipboardList className="size-5 text-muted-foreground" />
                        <span>No patients currently waiting.</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Availability</CardTitle>
                    <CardDescription>Your current consultation status.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3 text-sm">
                        <Stethoscope className="size-5 text-muted-foreground" />
                        <span>Set your availability before accepting consultations.</span>
                    </div>
                </CardContent>
            </Card>

            <DoctorAvailabilityPlanner
                doctorId={doctorId}
                initialAppointmentBlocks={appointmentBlocks}
            />
        </div>
    );
}
