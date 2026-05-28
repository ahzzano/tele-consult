"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import axios from "axios";
import { CalendarClock, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    days,
    formatDateInput,
    formatTime,
    getAppointmentTimestamp,
    getSlotFromTimestamp,
    getWeekdayDate,
    ScheduleSlotPicker,
    type AppointmentBlock,
    type ScheduleSlot,
} from "./appointment-schedule";
import type { Appointment } from "./dashboard-types";

type ApiResponse<T> = {
    success: boolean;
    data: T;
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";
const axiosConfig = { withCredentials: true };

export function formatAppointmentTime(timeslot: string) {
    return new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(timeslot));
}

export function getDoctorName(appointment: Appointment) {
    if (appointment.doctorName) {
        return appointment.doctorName;
    }

    const name = [appointment.doctorFirstName, appointment.doctorLastName]
        .filter(Boolean)
        .join(" ");

    return name || `doctor #${appointment.doctorId}`;
}

export function getPatientName(appointment: Appointment) {
    if (appointment.patientName) {
        return appointment.patientName;
    }

    const name = [appointment.patientFirstName, appointment.patientLastName]
        .filter(Boolean)
        .join(" ");

    return name || `patient #${appointment.patientId}`;
}

export function PatientAppointments({
    appointments,
}: {
    appointments: Appointment[];
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Appointments</CardTitle>
                <CardDescription>Manage upcoming consultations.</CardDescription>
            </CardHeader>
            <CardContent>
                {appointments.length > 0 ? (
                    <div className="grid gap-3">
                        {appointments.map((appointment) => (
                            <div
                                key={appointment.appointmentId}
                                className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_auto] sm:items-center"
                            >
                                <div className="min-w-0">
                                    <div className="font-medium">
                                        Dr. {getDoctorName(appointment)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {formatAppointmentTime(appointment.timeslot)}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <RescheduleAppointmentDialog appointment={appointment} />
                                    <CancelAppointmentDialog appointment={appointment} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">
                        No appointments scheduled yet.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function RescheduleAppointmentDialog({
    appointment,
}: {
    appointment: Appointment;
}) {
    const [date, setDate] = useState(() =>
        formatDateInput(new Date(appointment.timeslot)),
    );
    const [appointmentBlocks, setAppointmentBlocks] = useState<AppointmentBlock[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(() =>
        getSlotFromTimestamp(appointment.timeslot),
    );
    const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    async function loadSchedule() {
        try {
            setIsLoadingSchedule(true);
            setStatusMessage(null);

            const response = await axios.get<ApiResponse<AppointmentBlock[]>>(
                `${backendUrl}/doctor/${appointment.doctorId}/appointment-blocks`,
                axiosConfig,
            );

            setAppointmentBlocks(Array.isArray(response.data.data) ? response.data.data : []);
        } catch {
            setStatusMessage("Unable to load this doctor's schedule.");
        } finally {
            setIsLoadingSchedule(false);
        }
    }

    function selectSlot(slot: ScheduleSlot) {
        setSelectedSlot(slot);
        setStatusMessage(null);
    }

    async function rescheduleAppointment() {
        if (!selectedSlot) {
            setStatusMessage("Select an available time first.");
            return;
        }

        try {
            setIsSaving(true);
            setStatusMessage(null);

            await axios.patch(
                `${backendUrl}/appointments/${appointment.appointmentId}/reschedule`,
                {
                    timeslot: getAppointmentTimestamp(
                        date,
                        selectedSlot.dayOfWeek,
                        selectedSlot.slotIndex,
                    ),
                    dayOfWeek: selectedSlot.dayOfWeek,
                },
                axiosConfig,
            );

            setStatusMessage("Appointment rescheduled.");
            router.refresh();
            setIsOpen(false);
        } catch {
            setStatusMessage("Unable to reschedule this appointment.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Dialog.Root
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);

                if (open) {
                    void loadSchedule();
                }
            }}
        >
            <Dialog.Trigger className={buttonVariants({ variant: "outline", size: "sm" })}>
                <CalendarClock className="size-4" />
                Reschedule
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
                <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex h-[min(760px,calc(100vh-3rem))] w-[min(1040px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border bg-background shadow-xl">
                    <div className="flex items-start justify-between gap-4 px-6 py-5">
                        <div>
                            <Dialog.Title className="text-lg font-semibold">
                                Reschedule appointment
                            </Dialog.Title>
                            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                                Choose a new available time with Dr. {getDoctorName(appointment)}.
                            </Dialog.Description>
                        </div>
                        <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon" })}>
                            <span className="sr-only">Close reschedule dialog</span>
                            <X className="size-4" />
                        </Dialog.Close>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col gap-5 px-6 pb-6">
                        <div className="flex flex-wrap items-end gap-3">
                            <label className="grid gap-1 text-sm">
                                <span className="font-medium">Appointment date</span>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(event) => {
                                        setDate(event.target.value);
                                        setSelectedSlot(null);
                                    }}
                                    className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
                                />
                            </label>

                            {statusMessage ? (
                                <span className="pb-2 text-sm text-muted-foreground">
                                    {statusMessage}
                                </span>
                            ) : null}
                        </div>

                        <ScheduleSlotPicker
                            appointmentBlocks={appointmentBlocks}
                            date={date}
                            selectedSlot={selectedSlot}
                            disabled={isSaving || isLoadingSchedule}
                            onSelectSlot={selectSlot}
                        />

                        {isLoadingSchedule ? (
                            <div className="text-sm text-muted-foreground">
                                Loading available times...
                            </div>
                        ) : null}

                        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t pt-4">
                            <div className="text-sm text-muted-foreground">
                                {selectedSlot
                                    ? `${days[selectedSlot.dayOfWeek].label}, ${getWeekdayDate(date, selectedSlot.dayOfWeek)} at ${formatTime(selectedSlot.slotIndex)}`
                                    : "Select an available time slot."}
                            </div>
                            <Button
                                type="button"
                                disabled={!selectedSlot || isSaving}
                                onClick={rescheduleAppointment}
                            >
                                <CalendarClock className="size-4" />
                                {isSaving ? "Saving" : "Save"}
                            </Button>
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function CancelAppointmentDialog({
    appointment,
}: {
    appointment: Appointment;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const router = useRouter();

    async function cancelAppointment() {
        try {
            setIsCancelling(true);
            setStatusMessage(null);

            await axios.delete(
                `${backendUrl}/appointments/${appointment.appointmentId}`,
                axiosConfig,
            );

            router.refresh();
            setIsOpen(false);
        } catch {
            setStatusMessage("Unable to cancel this appointment.");
        } finally {
            setIsCancelling(false);
        }
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Trigger className={buttonVariants({ variant: "destructive", size: "sm" })}>
                <Trash2 className="size-4" />
                Cancel
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
                <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 grid w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-5 shadow-xl">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <Dialog.Title className="text-lg font-semibold">
                                Cancel appointment
                            </Dialog.Title>
                            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                                Dr. {getDoctorName(appointment)} on{" "}
                                {formatAppointmentTime(appointment.timeslot)}
                            </Dialog.Description>
                        </div>
                        <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon" })}>
                            <span className="sr-only">Close cancellation dialog</span>
                            <X className="size-4" />
                        </Dialog.Close>
                    </div>

                    {statusMessage ? (
                        <div className="text-sm text-destructive">{statusMessage}</div>
                    ) : null}

                    <div className="flex justify-end gap-2">
                        <Dialog.Close className={buttonVariants({ variant: "outline" })}>
                            Keep
                        </Dialog.Close>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={isCancelling}
                            onClick={cancelAppointment}
                        >
                            <Trash2 className="size-4" />
                            {isCancelling ? "Cancelling" : "Cancel appointment"}
                        </Button>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
