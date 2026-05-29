"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
    email: z.email("Enter a valid email address").trim(),
    password: z.string().min(1, "Password is required"),
});

export type LoginActionState = {
    status: "idle" | "error";
    message?: string;
    fieldErrors?: {
        email?: string[];
        password?: string[];
    };
};

type LoginResponse = {
    success: boolean;
    data?: {
        access_token?: string;
    };
};

async function getErrorMessage(response: Response) {
    try {
        const body = (await response.json()) as { message?: string | string[] };
        const message = Array.isArray(body.message) ? body.message.join(" ") : body.message;

        return message;
    } catch {
        return undefined;
    }
}

export async function login(
    _previousState: LoginActionState,
    formData: FormData
): Promise<LoginActionState> {
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        throw new Error("BACKEND_URL is not configured");
    }

    const raw = Object.fromEntries(formData.entries());
    const result = loginSchema.safeParse({
        ...raw,
    });

    if (!result.success) {
        return {
            status: "error",
            message: "Check your email and password, then try again.",
            fieldErrors: z.flattenError(result.error).fieldErrors,
        };
    }

    const response = await fetch(`${backendUrl}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(result.data),
    });

    if (!response.ok) {
        const responseMessage = await getErrorMessage(response);

        return {
            status: "error",
            message:
                response.status === 401
                    ? "The email or password you entered is incorrect."
                    : responseMessage ?? "Unable to log in right now. Please try again.",
        };
    }

    const body = (await response.json()) as LoginResponse;
    const accessToken = body.data?.access_token;

    if (!accessToken) {
        return {
            status: "error",
            message: "Unable to start your session. Please try again.",
        };
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
