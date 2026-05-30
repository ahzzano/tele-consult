import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { ProfileEditor, type AccountProfile } from "./profile-editor";

type AuthTokenPayload = {
    email?: string;
};

type ProfileResponse = {
    success: boolean;
    data: AccountProfile | null;
};

type ApiResponse<T> = {
    success: boolean;
    data: T;
};

function decodeJwtPayload(token: string): AuthTokenPayload {
    try {
        const payload = token.split(".")[1];

        if (!payload) {
            return {};
        }

        const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
        const decodedPayload = Buffer.from(normalizedPayload, "base64").toString("utf8");

        return JSON.parse(decodedPayload) as AuthTokenPayload;
    } catch {
        return {};
    }
}

export default async function ProfilePage() {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
        redirect("/login");
    }

    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        throw new Error("BACKEND_URL is not configured");
    }

    const tokenPayload = decodeJwtPayload(token);
    const authHeaders = {
        Authorization: `Bearer ${token}`,
    };

    if (!tokenPayload.email) {
        redirect("/login");
    }

    const response = await fetch(`${backendUrl}/account/${encodeURIComponent(tokenPayload.email)}`, {
        cache: "no-store",
        headers: authHeaders,
    });

    if (response.status === 401 || response.status === 403) {
        redirect("/login");
    }

    if (!response.ok) {
        throw new Error("Failed to load profile");
    }

    const body = (await response.json()) as ProfileResponse;
    const profile = body.data;

    if (!profile) {
        redirect("/login");
    }

    const recordsQueryKey = profile.role === "Doctor" ? "doctor" : "patient";
    const recordsResponse = await fetch(
        `${backendUrl}/records?${recordsQueryKey}=${profile.id}`,
        {
            cache: "no-store",
            headers: authHeaders,
        },
    );

    if (!recordsResponse.ok) {
        throw new Error("Failed to load medical records");
    }

    const prescriptionsResponse = await fetch(
        `${backendUrl}/prescriptions?${recordsQueryKey}=${profile.id}`,
        {
            cache: "no-store",
            headers: authHeaders,
        },
    );

    if (!prescriptionsResponse.ok) {
        throw new Error("Failed to load prescriptions");
    }

    const recordsBody =
        (await recordsResponse.json()) as ApiResponse<AccountProfile["medicalRecords"]>;
    const prescriptionsBody =
        (await prescriptionsResponse.json()) as ApiResponse<AccountProfile["prescriptions"]>;

    const medicalRecords = recordsBody.data.toSorted(
        (left, right) =>
            new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime(),
    );

    return (
        <main className="min-h-screen bg-muted/30">
            <ProfileEditor
                profile={{
                    ...profile,
                    medicalRecords,
                    prescriptions: prescriptionsBody.data,
                }}
            />
        </main>
    );
}
