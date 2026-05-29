import { Module } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsController } from './prescriptions.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService],
})
export class PrescriptionsModule {}
