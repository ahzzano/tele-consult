"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

export type ProfileActionState = {
    status: "idle" | "success" | "error";
    message?: string;
};

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

const profileSchema = z.object({
    id: z.coerce.number().int().positive(),
    role: z.enum(["Patient", "Doctor"]),
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.email().trim(),
    password: z.preprocess(
        (value) => (value === "" ? undefined : value),
        z.string().min(8, "Password must be at least 8 characters").optional()
    ),
    profilePicture: optionalUrl,
    birthday: optionalText,
    contactDetails: optionalText,
    weight: optionalNumber,
    height: optionalNumber,
    medicalHistory: optionalText,
    specialization: optionalText,
    bio: optionalText,
});

export async function updateProfile(
    _previousState: ProfileActionState,
    formData: FormData
): Promise<ProfileActionState> {
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        throw new Error("BACKEND_URL is not configured");
    }

    const raw = Object.fromEntries(formData.entries());
    const result = profileSchema.safeParse({
        ...raw,
    });

    if (!result.success) {
        return {
            status: "error",
            message: "Check the profile details and try again.",
        };
    }

    const { id, password, ...profilePayload } = result.data;
    const payload = password
        ? {
              ...profilePayload,
              password,
          }
        : profilePayload;

    const response = await fetch(`${backendUrl}/account/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        return {
            status: "error",
            message: "Unable to update profile.",
        };
    }

    revalidatePath("/profile");

    return {
        status: "success",
        message: "Profile updated.",
    };
}
