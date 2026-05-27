"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

type LoginResponse = {
    success: boolean;
    data?: {
        access_token?: string;
    };
};

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
        const message = Object.entries(errors)
            .map(([field, messages]) => `${field}: ${messages?.join(", ")}`)
            .join("; ");

        console.log(errors);
        throw new Error(message || "Invalid registration form");
    }

    const payload = result.data;

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

    const loginResponse = await fetch(`${backendUrl}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: payload.email,
            password: payload.password,
        }),
    });

    if (!loginResponse.ok) {
        throw new Error("Registration succeeded, but login failed");
    }

    const body = (await loginResponse.json()) as LoginResponse;
    const accessToken = body.data?.access_token;

    if (!accessToken) {
        throw new Error("Login response did not include an access token");
    }

    const cookieStore = await cookies();
    cookieStore.set("auth_token", accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
    });

    redirect("/dashboard");
}
