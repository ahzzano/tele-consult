"use server";

import { z } from "zod";

const requiredText = z.string().trim().min(1, "Required");

const optionalText = z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().optional()
);

const optionalUrl = z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().url("Enter a valid URL").optional()
);

const optionalNumber = z.preprocess(
    (value) => (value === "" ? undefined : Number(value)),
    z.number().positive("Must be greater than 0").optional()
);

const baseRegistrationSchema = z.object({
    role: z.enum(["Patient", "Doctor"]),
    firstName: requiredText,
    lastName: requiredText,
    email: z.email().trim(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    profilePicture: optionalUrl,
});

const patientRegistrationSchema = baseRegistrationSchema.extend({
    role: z.literal("Patient"),
    birthday: optionalText,
    contactDetails: optionalText,
    weight: optionalNumber,
    height: optionalNumber,
    medicalHistory: optionalText,
});

const doctorRegistrationSchema = baseRegistrationSchema.extend({
    role: z.literal("Doctor"),
    specialization: requiredText,
    bio: optionalText,
});

const registrationSchema = z.discriminatedUnion("role", [
    patientRegistrationSchema,
    doctorRegistrationSchema,
]);

export async function register(formData: FormData) {
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        throw new Error("BACKEND_URL is not configured");
    }

    const raw = Object.fromEntries(formData.entries());
    const result = registrationSchema.safeParse({
        ...raw,
    });

    if (!result.success) {
        const errors = z.flattenError(result.error).fieldErrors;

        console.log(errors);
        throw new Error("Invalid registration form");
    }

    const payload = result.data;

    console.log(backendUrl)
    const response = await fetch(`${backendUrl}/account`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error("Registration failed");
    }
}
