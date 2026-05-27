"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

const appointmentBlockSchema = z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    start: z.string().min(1),
    end: z.string().min(1),
});

const appointmentBlocksSchema = z.object({
    doctorId: z.number().int().positive(),
    appointmentBlocks: z.array(appointmentBlockSchema),
});

export type AppointmentBlockPayload = z.infer<typeof appointmentBlockSchema>;

export type AvailabilityActionState = {
    status: "idle" | "success" | "error";
    message?: string;
};

export async function updateDoctorAppointmentBlocks(
    doctorId: number,
    appointmentBlocks: AppointmentBlockPayload[],
): Promise<AvailabilityActionState> {
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        throw new Error("BACKEND_URL is not configured");
    }

    const result = appointmentBlocksSchema.safeParse({
        doctorId,
        appointmentBlocks,
    });

    if (!result.success) {
        return {
            status: "error",
            message: "Check the availability blocks and try again.",
        };
    }

    const response = await fetch(`${backendUrl}/doctor/${doctorId}/appointment-blocks`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            appointmentBlocks: result.data.appointmentBlocks,
        }),
    });

    if (!response.ok) {
        return {
            status: "error",
            message: "Unable to save consultation hours.",
        };
    }

    revalidatePath("/dashboard");

    return {
        status: "success",
        message: "Consultation hours saved.",
    };
}
