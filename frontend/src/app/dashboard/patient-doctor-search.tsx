"use client";

import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, Stethoscope } from "lucide-react";
import axios from "axios";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

type DoctorSearchResult = {
    id: number;
    firstName: string;
    lastName: string;
    specialization: string | null;
    bio: string | null;
};

type ApiResponse<T> = {
    success: boolean;
    data: T;
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

function getDoctorName(doctor: DoctorSearchResult) {
    return `${doctor.firstName} ${doctor.lastName}`;
}

export function PatientDoctorSearch() {
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
