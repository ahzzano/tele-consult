import { Controller, Get, MessageEvent, Sse, UseGuards } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { CurrentUser, type AuthUser } from '../auth/auth-user';
import { AuthGuard } from '../auth/auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get()
    recent(@CurrentUser() user: AuthUser) {
        return this.notificationsService.recentFor(user.id);
    }

    @Sse('stream')
    stream(@CurrentUser() user: AuthUser): Observable<MessageEvent> {
        return this.notificationsService
            .streamFor(user.id)
            .pipe(map((event) => ({ data: event })));
    }
}
