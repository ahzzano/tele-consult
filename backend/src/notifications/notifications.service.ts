import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export type NotificationEvent = {
    id: string;
    recipientId: number;
    title: string;
    message: string;
    createdAt: string;
};

@Injectable()
export class NotificationsService {
    private readonly streams = new Map<number, Subject<NotificationEvent>>();
    private readonly recentEvents = new Map<number, NotificationEvent[]>();
    private readonly maxRecentEvents = 20;

    streamFor(userId: number): Observable<NotificationEvent> {
        return this.subjectFor(userId).asObservable();
    }

    recentFor(userId: number) {
        return this.recentEvents.get(userId) ?? [];
    }

    notify(recipientId: number, title: string, message: string) {
        const event: NotificationEvent = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            recipientId,
            title,
            message,
            createdAt: new Date().toISOString(),
        };

        this.storeRecent(event);
        this.subjectFor(recipientId).next(event);
        return event;
    }

    private storeRecent(event: NotificationEvent) {
        const events = this.recentEvents.get(event.recipientId) ?? [];
        this.recentEvents.set(
            event.recipientId,
            [event, ...events].slice(0, this.maxRecentEvents),
        );
    }

    private subjectFor(userId: number) {
        const existing = this.streams.get(userId);

        if (existing) {
            return existing;
        }

        const subject = new Subject<NotificationEvent>();
        this.streams.set(userId, subject);
        return subject;
    }
}
