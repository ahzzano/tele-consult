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
    appointments: Appointment[];
};

type Appointment = {
    appointmentId: number;
    doctorId: number;
    patientId: number;
    timeslot: string;
    day: number;
    doctorFirstName?: string | null;
    doctorLastName?: string | null;
    doctorName?: string | null;
    patientFirstName?: string | null;
    patientLastName?: string | null;
    patientName?: string | null;
};

const modeButtonClassName =
    "flex h-9 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors";

export function DashboardModeSwitcher({
    profile,
    appointmentBlocks,
    appointments,
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
                <PatientDashboard patientId={profile.id} appointments={appointments} />
            ) : (
                <DoctorDashboard
                    doctorId={profile.role === "Doctor" ? profile.id : null}
                    appointmentBlocks={appointmentBlocks}
                    appointments={appointments}
                />
            )}
        </div>
    );
}

function formatAppointmentTime(timeslot: string) {
    return new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(timeslot));
}

function getDoctorName(appointment: Appointment) {
    if (appointment.doctorName) {
        return appointment.doctorName;
    }

    const name = [appointment.doctorFirstName, appointment.doctorLastName]
        .filter(Boolean)
        .join(" ");

    return name || `doctor #${appointment.doctorId}`;
}

function getPatientName(appointment: Appointment) {
    if (appointment.patientName) {
        return appointment.patientName;
    }

    const name = [appointment.patientFirstName, appointment.patientLastName]
        .filter(Boolean)
        .join(" ");

    return name || `patient #${appointment.patientId}`;
}

function PatientDashboard({
    patientId,
    appointments,
}: {
    patientId: number;
    appointments: Appointment[];
}) {
    const upcomingAppointment = appointments[0];

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
                            <span>
                                {upcomingAppointment
                                    ? `${formatAppointmentTime(upcomingAppointment.timeslot)} with Dr. ${getDoctorName(upcomingAppointment)}`
                                    : "No upcoming consultation scheduled."}
                            </span>
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

            <PatientDoctorSearch patientId={patientId} />
        </div>
    );
}

function DoctorDashboard({
    doctorId,
    appointmentBlocks,
    appointments,
}: {
    doctorId: number | null;
    appointmentBlocks: AppointmentBlock[];
    appointments: Appointment[];
}) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Patient Queue</CardTitle>
                    <CardDescription>Consultations waiting for review.</CardDescription>
                </CardHeader>
                <CardContent>
                    {appointments.length > 0 ? (
                        <div className="grid gap-2 text-sm">
                            {appointments.slice(0, 3).map((appointment) => (
                                <div
                                    key={appointment.appointmentId}
                                    className="flex items-center gap-3"
                                >
                                    <ClipboardList className="size-5 text-muted-foreground" />
                                    <span>
                                        {getPatientName(appointment)} at{" "}
                                        {formatAppointmentTime(appointment.timeslot)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 text-sm">
                            <ClipboardList className="size-5 text-muted-foreground" />
                            <span>No patients currently waiting.</span>
                        </div>
                    )}
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
