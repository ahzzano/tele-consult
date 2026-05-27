import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardModeSwitcher } from "./dashboard-mode-switcher";

type AuthTokenPayload = {
    email?: string;
};

type AccountProfile = {
    id: number;
    role: "Patient" | "Doctor";
};

type AppointmentBlock = {
    blockId: number;
    doctorId: number;
    dayOfWeek: number;
    start: string;
    end: string;
};

type ApiResponse<T> = {
    success: boolean;
    data: T;
};

function decodeJwtPayload(token: string): AuthTokenPayload {
    const payload = token.split(".")[1];

    if (!payload) {
        return {};
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = Buffer.from(normalizedPayload, "base64").toString("utf8");

    return JSON.parse(decodedPayload) as AuthTokenPayload;
}

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
        redirect("/login");
    }

    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        throw new Error("BACKEND_URL is not configured");
    }

    const tokenPayload = decodeJwtPayload(token);

    if (!tokenPayload.email) {
        redirect("/login");
    }

    const profileResponse = await fetch(
        `${backendUrl}/account/${encodeURIComponent(tokenPayload.email)}`,
        {
            cache: "no-store",
        },
    );

    if (!profileResponse.ok) {
        throw new Error("Failed to load profile");
    }

    const profileBody = (await profileResponse.json()) as ApiResponse<AccountProfile | null>;
    const profile = profileBody.data;

    if (!profile) {
        redirect("/login");
    }

    let appointmentBlocks: AppointmentBlock[] = [];

    if (profile.role === "Doctor") {
        const appointmentBlocksResponse = await fetch(
            `${backendUrl}/doctor/${profile.id}/appointment-blocks`,
            {
                cache: "no-store",
            },
        );

        if (!appointmentBlocksResponse.ok) {
            throw new Error("Failed to load consultation hours");
        }

        const appointmentBlocksBody =
            (await appointmentBlocksResponse.json()) as ApiResponse<AppointmentBlock[]>;
        appointmentBlocks = appointmentBlocksBody.data;
    }

    return (
        <main className="min-h-screen bg-muted/30">
            <DashboardModeSwitcher
                profile={profile}
                appointmentBlocks={appointmentBlocks}
            />
        </main>
    );
}
