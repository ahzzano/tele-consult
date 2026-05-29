"use client";

import { CalendarDays, ClipboardList, LogOut, Stethoscope } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut } from "./actions";
import {
    DoctorAppointments,
    formatAppointmentTime,
    getDoctorName,
    getPatientName,
    PatientAppointments,
} from "./appointment-management";
import type { Appointment } from "./dashboard-types";
import {
    DoctorAvailabilityPlanner,
    type AppointmentBlock,
} from "./doctor-availability-planner";
import { NotificationCenter } from "./notification-center";
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

export function DashboardModeSwitcher({
    profile,
    appointmentBlocks,
    appointments,
}: DashboardModeSwitcherProps) {
    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                        Viewing as {profile.role.toLowerCase()}.
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Link
                        href="/profile"
                        className={buttonVariants({
                            variant: "outline",
                            className: "w-full sm:w-auto",
                        })}
                    >
                        Profile
                    </Link>
                    <form action={signOut}>
                        <Button type="submit" variant="outline" className="w-full sm:w-auto">
                            <LogOut className="size-4" />
                            Sign out
                        </Button>
                    </form>
                </div>
            </div>
            <NotificationCenter />
            {profile.role === "Patient" ? (
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

            <PatientAppointments appointments={appointments} />
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
            <DoctorAppointments appointments={appointments} />
        </div>
    );
}
