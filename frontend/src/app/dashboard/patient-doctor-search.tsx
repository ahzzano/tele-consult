"use client";

import { useMemo, useState } from "react";
import {
    CalendarPlus,
    CheckCircle2,
    Clock3,
    MapPin,
    Search,
    SlidersHorizontal,
    Star,
    Stethoscope,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

type DoctorSearchResult = {
    id: number;
    name: string;
    specialization: string;
    location: string;
    rating: number;
    nextAvailable: string;
    consultationFee: string;
    appointmentSlots: string[];
};

const doctors: DoctorSearchResult[] = [
    {
        id: 1,
        name: "Dr. Maya Reyes",
        specialization: "Family Medicine",
        location: "Makati Medical Center",
        rating: 4.9,
        nextAvailable: "Today",
        consultationFee: "P850",
        appointmentSlots: ["9:00 AM", "10:30 AM", "2:00 PM"],
    },
    {
        id: 2,
        name: "Dr. Adrian Lim",
        specialization: "Cardiology",
        location: "St. Luke's BGC",
        rating: 4.8,
        nextAvailable: "Tomorrow",
        consultationFee: "P1,200",
        appointmentSlots: ["11:00 AM", "1:30 PM", "4:00 PM"],
    },
    {
        id: 3,
        name: "Dr. Sofia Tan",
        specialization: "Dermatology",
        location: "Online Consultation",
        rating: 4.7,
        nextAvailable: "Friday",
        consultationFee: "P950",
        appointmentSlots: ["8:30 AM", "12:00 PM", "3:30 PM"],
    },
    {
        id: 4,
        name: "Dr. Nico Santos",
        specialization: "Pediatrics",
        location: "Quezon City Clinic",
        rating: 4.9,
        nextAvailable: "Today",
        consultationFee: "P800",
        appointmentSlots: ["10:00 AM", "1:00 PM", "5:00 PM"],
    },
];

const specializations = ["All", ...Array.from(new Set(doctors.map((doctor) => doctor.specialization)))];

export function PatientDoctorSearch() {
    const [query, setQuery] = useState("");
    const [specialization, setSpecialization] = useState("All");
    const [selectedAppointment, setSelectedAppointment] = useState<{
        doctorId: number;
        slot: string;
    } | null>(null);

    const filteredDoctors = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return doctors.filter((doctor) => {
            const matchesSearch =
                normalizedQuery.length === 0 ||
                doctor.name.toLowerCase().includes(normalizedQuery) ||
                doctor.specialization.toLowerCase().includes(normalizedQuery) ||
                doctor.location.toLowerCase().includes(normalizedQuery);
            const matchesSpecialization =
                specialization === "All" || doctor.specialization === specialization;

            return matchesSearch && matchesSpecialization;
        });
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
                {filteredDoctors.map((doctor) => (
                    <Card key={doctor.id}>
                        <CardHeader>
                            <div className="flex items-start gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <Stethoscope className="size-5 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                    <CardTitle>{doctor.name}</CardTitle>
                                    <CardDescription>{doctor.specialization}</CardDescription>
                                </div>
                            </div>
                            <CardAction className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Star className="size-4 fill-current text-amber-500" />
                                {doctor.rating.toFixed(1)}
                            </CardAction>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                                <span className="flex items-center gap-2">
                                    <MapPin className="size-4" />
                                    {doctor.location}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Clock3 className="size-4" />
                                    {doctor.nextAvailable}
                                </span>
                                <span className="font-medium text-foreground">
                                    {doctor.consultationFee}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {doctor.appointmentSlots.map((slot) => {
                                    const isSelected =
                                        selectedAppointment?.doctorId === doctor.id &&
                                        selectedAppointment.slot === slot;

                                    return (
                                        <Button
                                            key={slot}
                                            type="button"
                                            variant={isSelected ? "default" : "outline"}
                                            size="sm"
                                            onClick={() =>
                                                setSelectedAppointment({
                                                    doctorId: doctor.id,
                                                    slot,
                                                })
                                            }
                                        >
                                            {isSelected ? (
                                                <CheckCircle2 className="size-4" />
                                            ) : (
                                                <CalendarPlus className="size-4" />
                                            )}
                                            {slot}
                                        </Button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filteredDoctors.length === 0 ? (
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
