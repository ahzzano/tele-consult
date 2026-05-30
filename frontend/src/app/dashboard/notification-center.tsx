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

type ApiResponse<T> = {
    success: boolean;
    data: T;
};

const backendUrl = "/api/backend";

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
    const [browserPermission, setBrowserPermission] = useState<
        NotificationPermission | "unsupported"
    >(() => (typeof Notification === "undefined" ? "unsupported" : Notification.permission));

    useEffect(() => {
        let isMounted = true;
        let knownNotificationIds = new Set<string>();

        async function loadNotifications() {
            try {
                const [recentResponse, remindersResponse] = await Promise.all([
                    fetch(`${backendUrl}/notifications`),
                    fetch(`${backendUrl}/appointments/upcoming-reminders`),
                ]);

                const recentBody = recentResponse.ok
                    ? ((await recentResponse.json()) as ApiResponse<NotificationEvent[]>)
                    : { data: [] };
                const remindersBody = remindersResponse.ok
                    ? ((await remindersResponse.json()) as ApiResponse<NotificationEvent[]>)
                    : { data: [] };

                const nextNotifications = [...remindersBody.data, ...recentBody.data].slice(0, 8);

                if (!isMounted) {
                    return;
                }

                const newNotifications = nextNotifications.filter(
                    (notification) => !knownNotificationIds.has(notification.id),
                );

                if (
                    knownNotificationIds.size > 0 &&
                    browserPermission === "granted" &&
                    typeof Notification !== "undefined"
                ) {
                    newNotifications.forEach((notification) => {
                        new Notification(notification.title, {
                            body: notification.message,
                        });
                    });
                }

                knownNotificationIds = new Set(
                    nextNotifications.map((notification) => notification.id),
                );
                setNotifications(nextNotifications);
            } catch {
                if (isMounted) {
                    setNotifications([]);
                }
            }
        }

        void loadNotifications();
        const interval = window.setInterval(() => {
            void loadNotifications();
        }, 15_000);

        return () => {
            isMounted = false;
            window.clearInterval(interval);
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
