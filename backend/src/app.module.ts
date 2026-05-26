import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { AccountModule } from './account/account.module';
import { DoctorModule } from './doctor/doctor.module';
import { PatientModule } from './patient/patient.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot({isGlobal: true}),
        DbModule,
        AccountModule,
        DoctorModule,
        PatientModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
