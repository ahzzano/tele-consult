"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
    email: z.email().trim(),
    password: z.string().min(1, "Password is required"),
});

type LoginResponse = {
    success: boolean;
    data?: {
        access_token?: string;
    };
};

export async function login(formData: FormData) {
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        throw new Error("BACKEND_URL is not configured");
    }

    const raw = Object.fromEntries(formData.entries());
    const result = loginSchema.safeParse({
        ...raw,
    });

    if (!result.success) {
        throw new Error("Invalid login form");
    }

    const response = await fetch(`${backendUrl}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(result.data),
    });

    if (!response.ok) {
        throw new Error("Login failed");
    }

    const body = (await response.json()) as LoginResponse;
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
