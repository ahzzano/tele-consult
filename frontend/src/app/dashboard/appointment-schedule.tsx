"use client";

import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type AppointmentBlock = {
    blockId: number;
    doctorId: number;
    dayOfWeek: number;
    start: string;
    end: string;
};

export type ScheduleSlot = {
    dayOfWeek: number;
    slotIndex: number;
};

export type BookedSlot = {
    appointmentId: number;
    timeslot: string;
    day: number;
};

export const days = [
    { label: "Sunday", shortLabel: "Sun" },
    { label: "Monday", shortLabel: "Mon" },
    { label: "Tuesday", shortLabel: "Tue" },
    { label: "Wednesday", shortLabel: "Wed" },
    { label: "Thursday", shortLabel: "Thu" },
    { label: "Friday", shortLabel: "Fri" },
    { label: "Saturday", shortLabel: "Sat" },
];

export const startHour = 7;
export const endHour = 23;
export const slotMinutes = 30;
const slotsPerHour = 60 / slotMinutes;
const slotCount = (endHour - startHour) * slotsPerHour;
const appointmentSlotLength = 2;

export function formatDateInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function formatTime(slotIndex: number) {
    const totalMinutes = startHour * 60 + slotIndex * slotMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const suffix = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;

    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${suffix}`;
}

export function getSlotIndexFromTimestamp(timestamp: string) {
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

export function createAvailabilityFromBlocks(appointmentBlocks: AppointmentBlock[]) {
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

export function getStartOfWeek(dateValue: string) {
    const date = new Date(`${dateValue}T00:00:00`);
    date.setDate(date.getDate() - date.getDay());

    return date;
}

export function getAppointmentTimestamp(
    dateValue: string,
    dayOfWeek: number,
    slotIndex: number,
) {
    const date = getStartOfWeek(dateValue);
    const totalMinutes = startHour * 60 + slotIndex * slotMinutes;
    date.setDate(date.getDate() + dayOfWeek);
    date.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:00`;
}

export function getWeekdayDate(dateValue: string, dayOfWeek: number) {
    const date = getStartOfWeek(dateValue);
    date.setDate(date.getDate() + dayOfWeek);

    return formatDateInput(date);
}

export function getSlotFromTimestamp(timestamp: string): ScheduleSlot | null {
    const slotIndex = getSlotIndexFromTimestamp(timestamp);

    if (slotIndex === null) {
        return null;
    }

    return {
        dayOfWeek: new Date(timestamp).getDay(),
        slotIndex,
    };
}

function bookedSlotIndexesForDay(
    bookedSlots: BookedSlot[],
    date: string,
    dayOfWeek: number,
) {
    const weekdayDate = getWeekdayDate(date, dayOfWeek);

    return bookedSlots
        .filter(
            (slot) =>
                slot.day === dayOfWeek &&
                formatDateInput(new Date(slot.timeslot)) === weekdayDate,
        )
        .map((slot) => getSlotIndexFromTimestamp(slot.timeslot))
        .filter((slot): slot is number => slot !== null);
}

function isSlotBookable(
    availability: boolean[][],
    bookedSlots: BookedSlot[],
    date: string,
    dayOfWeek: number,
    slotIndex: number,
) {
    const hasEnoughAvailableTime = Array.from({ length: appointmentSlotLength }).every(
        (_, offset) => availability[dayOfWeek][slotIndex + offset],
    );

    if (!hasEnoughAvailableTime) {
        return false;
    }

    return !bookedSlotIndexesForDay(bookedSlots, date, dayOfWeek).some((bookedSlotIndex) => {
        const requestedEnd = slotIndex + appointmentSlotLength;
        const bookedEnd = bookedSlotIndex + appointmentSlotLength;

        return slotIndex < bookedEnd && requestedEnd > bookedSlotIndex;
    });
}

export function ScheduleSlotPicker({
    appointmentBlocks,
    bookedSlots = [],
    date,
    selectedSlot,
    disabled = false,
    onSelectSlot,
}: {
    appointmentBlocks: AppointmentBlock[];
    bookedSlots?: BookedSlot[];
    date: string;
    selectedSlot: ScheduleSlot | null;
    disabled?: boolean;
    onSelectSlot: (slot: ScheduleSlot) => void;
}) {
    const availability = createAvailabilityFromBlocks(appointmentBlocks);
    const bookableSlots = availability.map((dayAvailability, dayOfWeek) =>
        dayAvailability.map((_, slotIndex) =>
            isSlotBookable(availability, bookedSlots, date, dayOfWeek, slotIndex),
        ),
    );

    return (
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
                                    const isAvailable = bookableSlots[dayOfWeek][slotIndex];
                                    const isSelected =
                                        selectedSlot?.dayOfWeek === dayOfWeek &&
                                        selectedSlot.slotIndex === slotIndex;

                                    return (
                                        <button
                                            key={`${day.label}-${slotIndex}`}
                                            type="button"
                                            disabled={!isAvailable || disabled}
                                            onClick={() => onSelectSlot({ dayOfWeek, slotIndex })}
                                            aria-label={`${day.label} ${formatTime(slotIndex)}`}
                                            className={cn(
                                                "relative h-8 border-l border-t bg-background transition-colors disabled:cursor-not-allowed disabled:bg-muted/30 disabled:hover:bg-muted/30 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring",
                                                isAvailable && "hover:bg-emerald-50",
                                            )}
                                        >
                                            {isAvailable ? (
                                                <span
                                                    className={cn(
                                                        "pointer-events-none absolute inset-x-1 inset-y-1 flex items-center justify-center rounded-md border border-emerald-600 bg-emerald-500/20 text-[11px] font-medium text-emerald-800",
                                                        isSelected && "bg-emerald-500/30 text-emerald-900",
                                                    )}
                                                >
                                                    {formatTime(slotIndex)}
                                                </span>
                                            ) : null}
                                            {isSelected ? (
                                                <CheckCircle2 className="absolute right-1.5 top-1/2 size-3.5 -translate-y-1/2 text-emerald-800" />
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
    );
}
