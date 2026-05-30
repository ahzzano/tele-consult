"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

const requiredText = (fieldName: string) =>
    z.string().trim().min(1, `${fieldName} is required`);

const optionalText = z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().optional()
);

const optionalNumber = z.preprocess(
    (value) => (value === "" ? undefined : Number(value)),
    z.number().positive("Must be greater than 0").optional()
);

const maxProfilePictureSize = 2 * 1024 * 1024;

const baseRegistrationSchema = z.object({
    role: z.enum(["Patient", "Doctor"]),
    firstName: requiredText("First name"),
    lastName: requiredText("Last name"),
    email: z.email("Enter a valid email address").trim(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    profilePicture: optionalText,
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
    specialization: requiredText("Specialization"),
    bio: optionalText,
});

const registrationSchema = z.discriminatedUnion("role", [
    patientRegistrationSchema,
    doctorRegistrationSchema,
]);

type RegistrationFieldName =
    | "role"
    | "firstName"
    | "lastName"
    | "email"
    | "password"
    | "profilePicture"
    | "birthday"
    | "contactDetails"
    | "weight"
    | "height"
    | "medicalHistory"
    | "specialization"
    | "bio";

export type RegistrationActionState = {
    status: "idle" | "error";
    message?: string;
    fieldErrors?: Partial<Record<RegistrationFieldName, string[]>>;
};

async function getProfilePictureDataUrl(formData: FormData) {
    const file = formData.get("profilePictureFile");

    if (!(file instanceof File) || file.size === 0) {
        return {
            value: undefined,
        };
    }

    if (!file.type.startsWith("image/")) {
        return {
            error: "Profile picture must be an image file.",
        };
    }

    if (file.size > maxProfilePictureSize) {
        return {
            error: "Profile picture must be 2 MB or smaller.",
        };
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    return {
        value: `data:${file.type};base64,${buffer.toString("base64")}`,
    };
}

async function getErrorMessage(response: Response) {
    try {
        const body = (await response.json()) as { message?: string | string[] };
        const message = Array.isArray(body.message) ? body.message.join(" ") : body.message;

        return message;
    } catch {
        return undefined;
    }
}

export async function register(
    _previousState: RegistrationActionState,
    formData: FormData
): Promise<RegistrationActionState> {
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        throw new Error("BACKEND_URL is not configured");
    }

    const profilePicture = await getProfilePictureDataUrl(formData);

    if (profilePicture.error) {
        return {
            status: "error",
            message: profilePicture.error,
            fieldErrors: {
                profilePicture: [profilePicture.error],
            },
        };
    }

    const raw = Object.fromEntries(formData.entries());
    delete raw.profilePictureFile;

    const result = registrationSchema.safeParse({
        ...raw,
        profilePicture: profilePicture.value,
    });

    if (!result.success) {
        const errors = z.flattenError(result.error).fieldErrors;

        return {
            status: "error",
            message: "Check the highlighted registration details and try again.",
            fieldErrors: errors,
        };
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
        const responseMessage = await getErrorMessage(response);

        if (response.status === 409) {
            return {
                status: "error",
                message: "An account with this email already exists.",
                fieldErrors: {
                    email: ["Use a different email address or log in instead."],
                },
            };
        }

        return {
            status: "error",
            message: responseMessage ?? "Unable to create your account right now. Please try again.",
        };
    }

    redirect("/login?registered=1");
}
