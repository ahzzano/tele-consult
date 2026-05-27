import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardModeSwitcher } from "./dashboard-mode-switcher";

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
        redirect("/login");
    }

    return (
        <main className="min-h-screen bg-muted/30">
            <DashboardModeSwitcher />
        </main>
    );
}
