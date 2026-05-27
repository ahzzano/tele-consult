"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { CalendarClock, RotateCcw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
    updateDoctorAppointmentBlocks,
    type AppointmentBlockPayload,
    type AvailabilityActionState,
} from "./actions";

type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

type Availability = Record<DayKey, boolean[]>;

export type AppointmentBlock = {
    blockId: number;
    doctorId: number;
    dayOfWeek: number;
    start: string;
    end: string;
};

type DragState = {
    dayIndex: number;
    startSlot: number;
    endSlot: number;
    shouldSelect: boolean;
};

const days: Array<{ key: DayKey; label: string; shortLabel: string }> = [
    { key: "sun", label: "Sunday", shortLabel: "Sun" },
    { key: "mon", label: "Monday", shortLabel: "Mon" },
    { key: "tue", label: "Tuesday", shortLabel: "Tue" },
    { key: "wed", label: "Wednesday", shortLabel: "Wed" },
    { key: "thu", label: "Thursday", shortLabel: "Thu" },
    { key: "fri", label: "Friday", shortLabel: "Fri" },
    { key: "sat", label: "Saturday", shortLabel: "Sat" },
];

const startHour = 7;
const endHour = 22;
const slotMinutes = 30;
const slotsPerHour = 60 / slotMinutes;
const slotCount = (endHour - startHour) * slotsPerHour;
const baseSunday = "2000-01-02";

function createEmptyAvailability(): Availability {
    return days.reduce((availability, day) => {
        availability[day.key] = Array.from({ length: slotCount }, () => false);
        return availability;
    }, {} as Availability);
}

function formatTime(slotIndex: number) {
    const totalMinutes = startHour * 60 + slotIndex * slotMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const suffix = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;

    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${suffix}`;
}

function formatTimestamp(dayOfWeek: number, slotIndex: number) {
    const totalMinutes = startHour * 60 + slotIndex * slotMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const date = new Date(`${baseSunday}T00:00:00`);
    date.setDate(date.getDate() + dayOfWeek);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(hours).padStart(2, "0");
    const minute = String(minutes).padStart(2, "0");

    return `${year}-${month}-${day} ${hour}:${minute}:00`;
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

function getDayRanges(daySlots: boolean[]) {
    const ranges: Array<{ start: number; end: number }> = [];
    let rangeStart: number | null = null;

    daySlots.forEach((selected, index) => {
        if (selected && rangeStart === null) {
            rangeStart = index;
        }

        if (rangeStart !== null && (!selected || index === daySlots.length - 1)) {
            ranges.push({
                start: rangeStart,
                end: selected && index === daySlots.length - 1 ? index + 1 : index,
            });
            rangeStart = null;
        }
    });

    return ranges;
}

function applyDragSelection(availability: Availability, drag: DragState) {
    const draft: Availability = {
        sun: [...availability.sun],
        mon: [...availability.mon],
        tue: [...availability.tue],
        wed: [...availability.wed],
        thu: [...availability.thu],
        fri: [...availability.fri],
        sat: [...availability.sat],
    };
    const day = days[drag.dayIndex];
    const from = Math.min(drag.startSlot, drag.endSlot);
    const to = Math.max(drag.startSlot, drag.endSlot);

    for (let slot = from; slot <= to; slot += 1) {
        draft[day.key][slot] = drag.shouldSelect;
    }

    return draft;
}

function createAvailabilityFromBlocks(appointmentBlocks: AppointmentBlock[]) {
    const availability = createEmptyAvailability();

    appointmentBlocks.forEach((block) => {
        const day = days[block.dayOfWeek];
        const startSlot = getSlotIndexFromTimestamp(block.start);
        const endSlot = getSlotIndexFromTimestamp(block.end);

        if (!day || startSlot === null || endSlot === null || startSlot >= endSlot) {
            return;
        }

        for (let slot = startSlot; slot < endSlot; slot += 1) {
            availability[day.key][slot] = true;
        }
    });

    return availability;
}

function createBlocksFromAvailability(availability: Availability): AppointmentBlockPayload[] {
    return days.flatMap((day, dayOfWeek) =>
        getDayRanges(availability[day.key]).map((range) => ({
            dayOfWeek,
            start: formatTimestamp(dayOfWeek, range.start),
            end: formatTimestamp(dayOfWeek, range.end),
        })),
    );
}

function getCellFromPoint(event: PointerEvent | ReactPointerEvent<HTMLElement>) {
    const target = document.elementFromPoint(event.clientX, event.clientY);

    if (!(target instanceof HTMLElement)) {
        return null;
    }

    return target.closest<HTMLElement>("[data-day-index][data-slot-index]");
}

export function DoctorAvailabilityPlanner({
    doctorId,
    initialAppointmentBlocks,
}: {
    doctorId: number | null;
    initialAppointmentBlocks: AppointmentBlock[];
}) {
    const [availability, setAvailability] = useState<Availability>(() =>
        createAvailabilityFromBlocks(initialAppointmentBlocks),
    );
    const [drag, setDrag] = useState<DragState | null>(null);
    const [actionState, setActionState] = useState<AvailabilityActionState>({
        status: "idle",
    });
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (!drag) {
            return;
        }

        const activeDrag = drag;

        function handlePointerUp() {
            setAvailability((current) => applyDragSelection(current, activeDrag));
            setDrag(null);
        }

        window.addEventListener("pointerup", handlePointerUp);
        window.addEventListener("pointercancel", handlePointerUp);

        return () => {
            window.removeEventListener("pointerup", handlePointerUp);
            window.removeEventListener("pointercancel", handlePointerUp);
        };
    }, [drag]);

    const previewAvailability = useMemo(
        () => (drag ? applyDragSelection(availability, drag) : availability),
        [availability, drag],
    );

    const totalHours = useMemo(() => {
        const selectedSlots = days.reduce(
            (total, day) => total + availability[day.key].filter(Boolean).length,
            0,
        );

        return selectedSlots * (slotMinutes / 60);
    }, [availability]);

    function handlePointerDown(
        event: ReactPointerEvent<HTMLButtonElement>,
        dayIndex: number,
        slotIndex: number,
    ) {
        event.preventDefault();

        const day = days[dayIndex];

        setDrag({
            dayIndex,
            startSlot: slotIndex,
            endSlot: slotIndex,
            shouldSelect: !availability[day.key][slotIndex],
        });
    }

    function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
        if (!drag) {
            return;
        }

        const cell = getCellFromPoint(event);

        if (!cell) {
            return;
        }

        const dayIndex = Number(cell.dataset.dayIndex);
        const slotIndex = Number(cell.dataset.slotIndex);

        if (dayIndex !== drag.dayIndex || Number.isNaN(slotIndex)) {
            return;
        }

        setDrag((current) => (current ? { ...current, endSlot: slotIndex } : current));
    }

    function handleSave() {
        if (!doctorId) {
            setActionState({
                status: "error",
                message: "Only doctor accounts can save consultation hours.",
            });
            return;
        }

        startTransition(async () => {
            const result = await updateDoctorAppointmentBlocks(
                doctorId,
                createBlocksFromAvailability(availability),
            );
            setActionState(result);
        });
    }

    function handleReset() {
        setAvailability(createEmptyAvailability());
        setActionState({ status: "idle" });
    }

    return (
        <Card className="md:col-span-2">
            <CardHeader className="gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarClock className="size-5 text-emerald-700" />
                        Consultation Hours
                    </CardTitle>
                    <CardDescription>
                        Weekly availability patients can book from, Sunday through Saturday.
                    </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Button type="button" variant="outline" onClick={handleReset}>
                        <RotateCcw className="size-4" />
                        Reset
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={isPending || !doctorId}>
                        <Save className="size-4" />
                        {isPending ? "Saving" : "Save"}
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-5">
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-800 ring-1 ring-emerald-200">
                        {totalHours.toFixed(totalHours % 1 === 0 ? 0 : 1)} hours weekly
                    </span>
                    {actionState.message ? (
                        <span
                            className={cn(
                                actionState.status === "error" && "text-destructive",
                                actionState.status === "success" && "text-emerald-700",
                            )}
                        >
                            {actionState.message}
                        </span>
                    ) : (
                        <span>Unsaved changes</span>
                    )}
                </div>

                <div className="overflow-x-auto rounded-lg border bg-background">
                    <div className="min-w-[860px]">
                        <div className="grid grid-cols-[72px_repeat(7,minmax(104px,1fr))] border-b bg-muted/50">
                            <div className="px-3 py-3 text-xs font-medium uppercase text-muted-foreground">
                                Time
                            </div>
                            {days.map((day) => (
                                <div
                                    key={day.key}
                                    className="border-l px-3 py-3 text-center text-sm font-medium"
                                >
                                    <span className="hidden sm:inline">{day.label}</span>
                                    <span className="sm:hidden">{day.shortLabel}</span>
                                </div>
                            ))}
                        </div>

                        <div
                            className="grid select-none grid-cols-[72px_repeat(7,minmax(104px,1fr))]"
                            onPointerMove={handlePointerMove}
                            style={{ touchAction: "none" }}
                        >
                            <div className="h-4" />
                            {days.map((day) => (
                                <div
                                    key={`${day.key}-top-spacer`}
                                    aria-hidden="true"
                                    className="h-4 border-l bg-background"
                                />
                            ))}

                            {Array.from({ length: slotCount }).map((_, slotIndex) => {
                                const showTime = slotIndex % slotsPerHour === 0;

                                return (
                                    <div key={slotIndex} className="contents">
                                        <div
                                            className="relative h-8 border-t text-xs text-muted-foreground"
                                        >
                                            {showTime ? (
                                                <span className="absolute right-2 top-0 -translate-y-1/2 bg-background px-1">
                                                    {formatTime(slotIndex)}
                                                </span>
                                            ) : null}
                                        </div>

                                        {days.map((day, dayIndex) => {
                                            const selected = previewAvailability[day.key][slotIndex];
                                            const aboveSelected =
                                                slotIndex > 0 &&
                                                previewAvailability[day.key][slotIndex - 1];
                                            const belowSelected =
                                                slotIndex < slotCount - 1 &&
                                                previewAvailability[day.key][slotIndex + 1];

                                            return (
                                                <button
                                                    key={`${day.key}-${slotIndex}`}
                                                    type="button"
                                                    aria-label={`${day.label} ${formatTime(slotIndex)}`}
                                                    data-day-index={dayIndex}
                                                    data-slot-index={slotIndex}
                                                    onPointerDown={(event) =>
                                                        handlePointerDown(event, dayIndex, slotIndex)
                                                    }
                                                    className={cn(
                                                        "relative h-8 border-l border-t bg-background transition-colors hover:bg-emerald-50 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring",
                                                        selected &&
                                                        "before:pointer-events-none before:absolute before:inset-x-1 before:inset-y-0 before:border-x before:border-emerald-600 before:bg-emerald-500/20 before:content-[''] hover:before:bg-emerald-500/25",
                                                        selected &&
                                                        !aboveSelected &&
                                                        "before:top-1 before:rounded-t-md before:border-t",
                                                        selected &&
                                                        !belowSelected &&
                                                        "before:bottom-1 before:rounded-b-md before:border-b",
                                                    )}
                                                />
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-7">
                    {days.map((day) => {
                        const ranges = getDayRanges(availability[day.key]);

                        return (
                            <div key={day.key} className="rounded-lg border bg-background p-3">
                                <div className="text-sm font-medium">{day.shortLabel}</div>
                                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                    {ranges.length > 0 ? (
                                        ranges.map((range) => (
                                            <div key={`${range.start}-${range.end}`}>
                                                {formatTime(range.start)} - {formatTime(range.end)}
                                            </div>
                                        ))
                                    ) : (
                                        <div>Unavailable</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
