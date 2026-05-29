import { Module } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [DoctorController],
  providers: [DoctorService],
})
export class DoctorModule {}
