"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import axios from "axios";
import { CalendarClock, ClipboardPlus, Pill, Trash2, Video, X } from "lucide-react";
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
    type BookedSlot,
    type AppointmentBlock,
    type ScheduleSlot,
} from "./appointment-schedule";
import type { Appointment } from "./dashboard-types";

type ApiResponse<T> = {
    success: boolean;
    data: T;
};

const backendUrl = "/api/backend";

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
                                    <JoinConsultationButton appointment={appointment} />
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

export function DoctorAppointments({
    appointments,
}: {
    appointments: Appointment[];
}) {
    return (
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Consultations</CardTitle>
                <CardDescription>Join sessions and complete consultation notes.</CardDescription>
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
                                        {getPatientName(appointment)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {formatAppointmentTime(appointment.timeslot)}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <JoinConsultationButton appointment={appointment} />
                                    <ConsultationNotesDialog appointment={appointment} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">
                        No consultations scheduled yet.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function JoinConsultationButton({ appointment }: { appointment: Appointment }) {
    const sessionUrl =
        appointment.sessionUrl ?? `https://meet.jit.si/tele-consult-${appointment.appointmentId}`;

    return (
        <a
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href={sessionUrl}
            target="_blank"
            rel="noreferrer"
        >
            <Video className="size-4" />
            Join
        </a>
    );
}

function ConsultationNotesDialog({ appointment }: { appointment: Appointment }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const router = useRouter();

    async function saveConsultation(formData: FormData) {
        const diagnosis = String(formData.get("diagnosis") ?? "").trim();
        const summary = String(formData.get("summary") ?? "").trim();
        const followUpInstructions = String(formData.get("followUpInstructions") ?? "").trim();
        const medicine = String(formData.get("medicine") ?? "").trim();
        const dosageValue = String(formData.get("dosage") ?? "").trim();

        if (!diagnosis || !summary) {
            setStatusMessage("Diagnosis and summary are required.");
            return;
        }

        try {
            setIsSaving(true);
            setStatusMessage(null);

            const recordResponse = await axios.post<ApiResponse<{ id: number }>>(
                `${backendUrl}/records`,
                {
                    appointmentId: appointment.appointmentId,
                    patient: appointment.patientId,
                    doctor: appointment.doctorId,
                    diagnosis,
                    summary,
                    followUpInstructions,
                },
            );

            if (medicine && dosageValue) {
                await axios.post(
                    `${backendUrl}/prescriptions`,
                    {
                        patient: appointment.patientId,
                        doctor: appointment.doctorId,
                        record: recordResponse.data.data.id,
                        medicine,
                        dosage: Number(dosageValue),
                    },
                );
            }

            router.refresh();
            setIsOpen(false);
        } catch {
            setStatusMessage("Unable to save consultation notes.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Trigger className={buttonVariants({ variant: "default", size: "sm" })}>
                <ClipboardPlus className="size-4" />
                Notes
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
                <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 grid w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-5 shadow-xl">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <Dialog.Title className="text-lg font-semibold">
                                Consultation notes
                            </Dialog.Title>
                            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                                {getPatientName(appointment)} at {formatAppointmentTime(appointment.timeslot)}
                            </Dialog.Description>
                        </div>
                        <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon" })}>
                            <span className="sr-only">Close notes dialog</span>
                            <X className="size-4" />
                        </Dialog.Close>
                    </div>

                    <form action={saveConsultation} className="grid gap-3">
                        <label className="grid gap-1 text-sm">
                            <span className="font-medium">Diagnosis</span>
                            <input
                                name="diagnosis"
                                className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
                                required
                            />
                        </label>
                        <label className="grid gap-1 text-sm">
                            <span className="font-medium">Summary</span>
                            <textarea
                                name="summary"
                                className="min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
                                required
                            />
                        </label>
                        <label className="grid gap-1 text-sm">
                            <span className="font-medium">Follow-up Instructions</span>
                            <textarea
                                name="followUpInstructions"
                                className="min-h-20 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
                            />
                        </label>

                        <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,140px)]">
                            <label className="grid min-w-0 gap-1 text-sm">
                                <span className="flex items-center gap-2 font-medium">
                                    <Pill className="size-4 text-muted-foreground" />
                                    Medicine
                                </span>
                                <input
                                    name="medicine"
                                    className="h-9 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
                                    placeholder="Optional"
                                />
                            </label>
                            <label className="grid min-w-0 gap-1 text-sm">
                                <span className="font-medium">Dosage</span>
                                <input
                                    name="dosage"
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    className="h-9 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
                                    placeholder="Optional"
                                />
                            </label>
                        </div>

                        {statusMessage ? (
                            <div className="text-sm text-destructive">{statusMessage}</div>
                        ) : null}

                        <div className="flex justify-end gap-2">
                            <Dialog.Close className={buttonVariants({ variant: "outline" })}>
                                Cancel
                            </Dialog.Close>
                            <Button type="submit" disabled={isSaving}>
                                <ClipboardPlus className="size-4" />
                                {isSaving ? "Saving" : "Save notes"}
                            </Button>
                        </div>
                    </form>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
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
    const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
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
            );
            const bookedSlotsResponse = await axios.get<ApiResponse<BookedSlot[]>>(
                `${backendUrl}/appointments/doctor/${appointment.doctorId}/booked-slots`,
            );

            setAppointmentBlocks(Array.isArray(response.data.data) ? response.data.data : []);
            setBookedSlots(
                Array.isArray(bookedSlotsResponse.data.data)
                    ? bookedSlotsResponse.data.data.filter(
                          (slot) => slot.appointmentId !== appointment.appointmentId,
                      )
                    : [],
            );
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
                            bookedSlots={bookedSlots}
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
