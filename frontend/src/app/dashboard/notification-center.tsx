"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type NotificationEvent = {
    id: string;
    title: string;
    message: string;
    createdAt: string;
};

type NotificationPayload =
    | NotificationEvent
    | { success: boolean; data: NotificationEvent | { data: NotificationEvent } };

type ApiResponse<T> = {
    success: boolean;
    data: T;
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

function normalizeNotification(payload: NotificationPayload) {
    if ("success" in payload) {
        return "data" in payload.data ? payload.data.data : payload.data;
    }

    return payload;
}

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
    const [browserPermission, setBrowserPermission] = useState<NotificationPermission | "unsupported">(
        "unsupported",
    );

    useEffect(() => {
        setBrowserPermission(
            typeof Notification === "undefined" ? "unsupported" : Notification.permission,
        );
    }, []);

    useEffect(() => {
        async function loadNotifications() {
            try {
                const [recentResponse, remindersResponse] = await Promise.all([
                    fetch(`${backendUrl}/notifications`, { credentials: "include" }),
                    fetch(`${backendUrl}/appointments/upcoming-reminders`, {
                        credentials: "include",
                    }),
                ]);

                const recentBody = recentResponse.ok
                    ? ((await recentResponse.json()) as ApiResponse<NotificationEvent[]>)
                    : { data: [] };
                const remindersBody = remindersResponse.ok
                    ? ((await remindersResponse.json()) as ApiResponse<NotificationEvent[]>)
                    : { data: [] };

                setNotifications(
                    [...remindersBody.data, ...recentBody.data].slice(0, 8),
                );
            } catch {
                setNotifications([]);
            }
        }

        void loadNotifications();

        const eventSource = new EventSource(`${backendUrl}/notifications/stream`, {
            withCredentials: true,
        });

        eventSource.onmessage = (event) => {
            const notification = normalizeNotification(JSON.parse(event.data) as NotificationPayload);

            if (browserPermission === "granted" && typeof Notification !== "undefined") {
                new Notification(notification.title, {
                    body: notification.message,
                });
            }

            setNotifications((current) => [notification, ...current].slice(0, 8));
        };

        return () => {
            eventSource.close();
        };
    }, [browserPermission]);

    async function enableBrowserNotifications() {
        if (typeof Notification === "undefined") {
            setBrowserPermission("unsupported");
            return;
        }

        const permission = await Notification.requestPermission();
        setBrowserPermission(permission);
    }

    return (
        <Card size="sm">
            <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <BellRing className="size-4 text-emerald-700" />
                            Notifications
                        </CardTitle>
                        <CardDescription>Live appointment and record updates.</CardDescription>
                    </div>
                    {browserPermission === "default" ? (
                        <Button type="button" variant="outline" size="sm" onClick={enableBrowserNotifications}>
                            Enable alerts
                        </Button>
                    ) : null}
                </div>
            </CardHeader>
            <CardContent>
                {notifications.length > 0 ? (
                    <div className="grid gap-2">
                        {notifications.map((notification) => (
                            <div key={notification.id} className="rounded-lg border bg-background p-3">
                                <div className="font-medium">{notification.title}</div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                    {notification.message}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">
                        New booking, schedule, and record updates will appear here.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
