"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, CheckCircle2, Search, SlidersHorizontal, Stethoscope } from "lucide-react";
import { Dialog } from "@base-ui/react/dialog";
import { useRouter } from "next/navigation";
import axios from "axios";

import { buttonVariants } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DoctorSearchResult = {
    id: number;
    firstName: string;
    lastName: string;
    specialization: string | null;
    bio: string | null;
};

type AppointmentBlock = {
    blockId: number;
    doctorId: number;
    dayOfWeek: number;
    start: string;
    end: string;
};

type ApiResponse<T> = {
    success: boolean;
    data: T;
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";
const startHour = 7;
const endHour = 22;
const slotMinutes = 30;
const slotsPerHour = 60 / slotMinutes;
const slotCount = (endHour - startHour) * slotsPerHour;
const days = [
    { label: "Sunday", shortLabel: "Sun" },
    { label: "Monday", shortLabel: "Mon" },
    { label: "Tuesday", shortLabel: "Tue" },
    { label: "Wednesday", shortLabel: "Wed" },
    { label: "Thursday", shortLabel: "Thu" },
    { label: "Friday", shortLabel: "Fri" },
    { label: "Saturday", shortLabel: "Sat" },
];

function getDoctorName(doctor: DoctorSearchResult) {
    return `${doctor.firstName} ${doctor.lastName}`;
}

function formatDateInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatTime(slotIndex: number) {
    const totalMinutes = startHour * 60 + slotIndex * slotMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const suffix = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;

    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${suffix}`;
}

function getSlotIndexFromTimestamp(timestamp: string) {
    const timeMatch = timestamp.match(/(?:T|\s)(\d{2}):(\d{2})/);

    if (!timeMatch) {
        return null;
    }

    const [, hours, minutes] = timeMatch;
    const totalMinutes = Number(hours) * 60 + Number(minutes);
    const slotIndex = (totalMinutes - startHour * 60) / slotMinutes;

    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > slotCount) {
        return null;
    }

    return slotIndex;
}

function createAvailabilityFromBlocks(appointmentBlocks: AppointmentBlock[]) {
    const availability = Array.from({ length: 7 }, () =>
        Array.from({ length: slotCount }, () => false),
    );

    appointmentBlocks.forEach((block) => {
        const startSlot = getSlotIndexFromTimestamp(block.start);
        const endSlot = getSlotIndexFromTimestamp(block.end);

        if (
            block.dayOfWeek < 0 ||
            block.dayOfWeek > 6 ||
            startSlot === null ||
            endSlot === null ||
            startSlot >= endSlot
        ) {
            return;
        }

        for (let slot = startSlot; slot < endSlot; slot += 1) {
            availability[block.dayOfWeek][slot] = true;
        }
    });

    return availability;
}

function getStartOfWeek(dateValue: string) {
    const date = new Date(`${dateValue}T00:00:00`);
    date.setDate(date.getDate() - date.getDay());

    return date;
}

function getAppointmentTimestamp(dateValue: string, dayOfWeek: number, slotIndex: number) {
    const date = getStartOfWeek(dateValue);
    const totalMinutes = startHour * 60 + slotIndex * slotMinutes;
    date.setDate(date.getDate() + dayOfWeek);
    date.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);

    return date.toISOString();
}

function getWeekdayDate(dateValue: string, dayOfWeek: number) {
    const date = getStartOfWeek(dateValue);
    date.setDate(date.getDate() + dayOfWeek);

    return formatDateInput(date);
}

export function PatientDoctorSearch({ patientId }: { patientId: number }) {
    const [doctors, setDoctors] = useState<DoctorSearchResult[]>([]);
    const [specializations, setSpecializations] = useState<string[]>(["All"]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [specialization, setSpecialization] = useState("All");

    useEffect(() => {
        let isMounted = true;

        async function loadSpecializations() {
            try {
                const response = await axios.get<ApiResponse<DoctorSearchResult[]>>(`${backendUrl}/doctor`);
                const availableSpecializations = response.data.data
                    .map((doctor) => doctor.specialization)
                    .filter((value): value is string => Boolean(value));

                if (isMounted) {
                    setSpecializations(["All", ...Array.from(new Set(availableSpecializations))]);
                }
            } catch {
                if (isMounted) {
                    setSpecializations(["All"]);
                }
            }
        }

        void loadSpecializations();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const abortController = new AbortController();

        async function loadDoctors() {
            try {
                setIsLoading(true);
                setErrorMessage(null);

                const response = await axios.get<ApiResponse<DoctorSearchResult[]>>(`${backendUrl}/doctor`, {
                    params: {
                        name: query.trim() || undefined,
                        specialization: specialization === "All" ? undefined : specialization,
                    },
                    signal: abortController.signal,
                });

                setDoctors(Array.isArray(response.data.data) ? response.data.data : []);
            } catch (error) {
                if (!axios.isCancel(error)) {
                    setErrorMessage("Unable to load doctors right now.");
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }

        void loadDoctors();

        return () => {
            abortController.abort();
        };
    }, [query, specialization]);

    return (
        <section className="flex flex-col gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Find a Doctor</CardTitle>
                    <CardDescription>Search by name, specialty, or clinic.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                        <label className="relative flex min-h-10 items-center">
                            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search doctors"
                                className="h-10 w-full rounded-lg border border-input bg-background px-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
                            />
                        </label>

                        <label className="relative flex min-h-10 items-center">
                            <SlidersHorizontal className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
                            <select
                                value={specialization}
                                onChange={(event) => setSpecialization(event.target.value)}
                                className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-9 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
                            >
                                {specializations.map((option) => (
                                    <option key={option} value={option}>
                                        {option === "All" ? "All specialties" : option}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4">
                {isLoading ? (
                    <Card>
                        <CardContent className="py-8 text-center text-sm text-muted-foreground">
                            Loading doctors...
                        </CardContent>
                    </Card>
                ) : null}

                {errorMessage ? (
                    <Card>
                        <CardContent className="py-8 text-center text-sm text-destructive">
                            {errorMessage}
                        </CardContent>
                    </Card>
                ) : null}

                {doctors.map((doctor) => (
                    <Card key={doctor.id}>
                        <CardHeader>
                            <div className="flex items-start gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <Stethoscope className="size-5 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                    <CardTitle>{getDoctorName(doctor)}</CardTitle>
                                    <CardDescription>
                                        {doctor.specialization ?? "General practice"}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <p className="text-sm text-muted-foreground">
                                {doctor.bio ?? "No bio provided yet."}
                            </p>
                            <DoctorBookingDialog doctor={doctor} patientId={patientId} />
                        </CardContent>
                    </Card>
                ))}

                {!isLoading && !errorMessage && doctors.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-sm text-muted-foreground">
                            No doctors matched your search.
                        </CardContent>
                    </Card>
                ) : null}
            </div>
        </section>
    );
}

function DoctorBookingDialog({
    doctor,
    patientId,
}: {
    doctor: DoctorSearchResult;
    patientId: number;
}) {
    const [date, setDate] = useState(() => formatDateInput(new Date()));
    const [appointmentBlocks, setAppointmentBlocks] = useState<AppointmentBlock[]>([]);
    const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{
        dayOfWeek: number;
        slotIndex: number;
    } | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isBooking, setIsBooking] = useState(false);
    const router = useRouter();

    const availability = createAvailabilityFromBlocks(appointmentBlocks);

    async function loadSchedule() {
        try {
            setIsLoadingSchedule(true);
            setStatusMessage(null);
            setSelectedSlot(null);

            const response = await axios.get<ApiResponse<AppointmentBlock[]>>(
                `${backendUrl}/doctor/${doctor.id}/appointment-blocks`,
            );

            setAppointmentBlocks(Array.isArray(response.data.data) ? response.data.data : []);
        } catch {
            setStatusMessage("Unable to load this doctor's schedule.");
        } finally {
            setIsLoadingSchedule(false);
        }
    }

    function selectSlot(dayOfWeek: number, slotIndex: number) {
        setSelectedSlot({ dayOfWeek, slotIndex });
        setStatusMessage(null);
    }

    async function bookSelectedAppointment() {
        if (!selectedSlot) {
            setStatusMessage("Select an available time first.");
            return;
        }

        try {
            setIsBooking(true);
            setStatusMessage(null);

            await axios.post(`${backendUrl}/appointments`, {
                patientId,
                doctorId: doctor.id,
                timeslot: getAppointmentTimestamp(
                    date,
                    selectedSlot.dayOfWeek,
                    selectedSlot.slotIndex,
                ),
                dayOfWeek: selectedSlot.dayOfWeek,
            });

            setStatusMessage("Appointment booked.");
            router.refresh();
        } catch {
            setStatusMessage("Unable to book this appointment.");
        } finally {
            setIsBooking(false);
        }
    }

    return (
        <Dialog.Root onOpenChange={(open) => {
            if (open) {
                void loadSchedule();
            }
        }}>
            <Dialog.Trigger className={buttonVariants({ variant: "outline" })}>
                <CalendarPlus className="size-4" />
                Book appointment
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
                <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex h-[min(760px,calc(100vh-3rem))] w-[min(1040px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border bg-background shadow-xl">
                    <div className="flex items-start justify-between gap-4 px-6 py-5">
                        <div>
                            <Dialog.Title className="text-lg font-semibold">
                                Book {getDoctorName(doctor)}
                            </Dialog.Title>
                            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                                Choose a date, then select an available time from that week.
                            </Dialog.Description>
                        </div>
                        <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon" })}>
                            <span className="sr-only">Close booking dialog</span>
                            x
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
                                <span className="pb-2 text-sm text-muted-foreground">{statusMessage}</span>
                            ) : null}
                        </div>

                        <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-background">
                            <div className="min-w-[860px]">
                                <div className="grid grid-cols-[72px_repeat(7,minmax(104px,1fr))] border-b bg-muted/50">
                                    <div className="px-3 py-3 text-xs font-medium uppercase text-muted-foreground">
                                        Time
                                    </div>
                                    {days.map((day, dayOfWeek) => (
                                        <div
                                            key={day.label}
                                            className="border-l px-3 py-3 text-center text-sm font-medium"
                                        >
                                            <div>{day.label}</div>
                                            <div className="text-xs font-normal text-muted-foreground">
                                                {getWeekdayDate(date, dayOfWeek)}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid select-none grid-cols-[72px_repeat(7,minmax(104px,1fr))]">
                                    <div className="h-4" />
                                    {days.map((day) => (
                                        <div
                                            key={`${day.label}-top-spacer`}
                                            aria-hidden="true"
                                            className="h-4 border-l bg-background"
                                        />
                                    ))}

                                    {Array.from({ length: slotCount }).map((_, slotIndex) => {
                                        const showTime = slotIndex % slotsPerHour === 0;

                                        return (
                                            <div key={slotIndex} className="contents">
                                                <div className="relative h-8 border-t text-xs text-muted-foreground">
                                                    {showTime ? (
                                                        <span className="absolute right-2 top-0 -translate-y-1/2 bg-background px-1">
                                                            {formatTime(slotIndex)}
                                                        </span>
                                                    ) : null}
                                                </div>

                                                {days.map((day, dayOfWeek) => {
                                                    const isAvailable = availability[dayOfWeek][slotIndex];
                                                    const aboveAvailable =
                                                        slotIndex > 0 &&
                                                        availability[dayOfWeek][slotIndex - 1];
                                                    const belowAvailable =
                                                        slotIndex < slotCount - 1 &&
                                                        availability[dayOfWeek][slotIndex + 1];
                                                    const isSelected =
                                                        selectedSlot?.dayOfWeek === dayOfWeek &&
                                                        selectedSlot.slotIndex === slotIndex;

                                                    return (
                                                        <button
                                                            key={`${day.label}-${slotIndex}`}
                                                            type="button"
                                                            disabled={!isAvailable || isBooking || isLoadingSchedule}
                                                            onClick={() => selectSlot(dayOfWeek, slotIndex)}
                                                            aria-label={`${day.label} ${formatTime(slotIndex)}`}
                                                            className="relative h-8 border-l border-t bg-background transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:bg-muted/30 disabled:hover:bg-muted/30 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring"
                                                        >
                                                            {isAvailable ? (
                                                                <span
                                                                    className={cn(
                                                                        "pointer-events-none absolute inset-x-1 inset-y-0 border-x border-emerald-600 bg-emerald-500/20",
                                                                        !aboveAvailable &&
                                                                        "top-1 rounded-t-md border-t",
                                                                        !belowAvailable &&
                                                                        "bottom-1 rounded-b-md border-b",
                                                                    )}
                                                                />
                                                            ) : null}
                                                            {isSelected ? (
                                                                <CheckCircle2 className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-emerald-700" />
                                                            ) : null}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {isLoadingSchedule ? (
                            <div className="text-sm text-muted-foreground">Loading available times...</div>
                        ) : null}

                        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t pt-4">
                            <div className="text-sm text-muted-foreground">
                                {selectedSlot
                                    ? `${days[selectedSlot.dayOfWeek].label}, ${getWeekdayDate(date, selectedSlot.dayOfWeek)} at ${formatTime(selectedSlot.slotIndex)}`
                                    : "Select an available time slot."}
                            </div>
                            <button
                                type="button"
                                disabled={!selectedSlot || isBooking}
                                onClick={bookSelectedAppointment}
                                className={buttonVariants()}
                            >
                                <CalendarPlus className="size-4" />
                                {isBooking ? "Booking" : "Book"}
                            </button>
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
