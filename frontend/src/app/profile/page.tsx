import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ProfileEditor, type AccountProfile } from "./profile-editor";

type AuthTokenPayload = {
    email?: string;
};

type ProfileResponse = {
    success: boolean;
    data: AccountProfile | null;
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

export default async function ProfilePage() {
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

    const response = await fetch(`${backendUrl}/account/${encodeURIComponent(tokenPayload.email)}`, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Failed to load profile");
    }

    const body = (await response.json()) as ProfileResponse;
    const profile = body.data;

    if (!profile) {
        redirect("/login");
    }

    return (
        <main className="min-h-screen bg-muted/30">
            <ProfileEditor profile={profile} />
        </main>
    );
}
