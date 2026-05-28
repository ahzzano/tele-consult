import { Injectable } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { DbService } from 'src/db/db.service';
import { account, appointment } from 'src/db/schema';
import { GetAppontmentDto } from './dto/get-appointment.dto';
import { eq, SQL, and, sql } from 'drizzle-orm';
import { aliasedTable } from 'drizzle-orm/alias';

@Injectable()
export class AppointmentsService {
    constructor(private db: DbService) {}

    async create(createAppointmentDto: CreateAppointmentDto) {
        const [newAppointment] = await this.db.connection
            .insert(appointment)
            .values({
                doctorId: createAppointmentDto.doctorId,
                patientId: createAppointmentDto.patientId,
                timeslot: createAppointmentDto.timeslot,
                day: createAppointmentDto.dayOfWeek,
            })
            .returning();

        return newAppointment;
    }

    async findAll(getAppointmentDto: GetAppontmentDto) {
        const conditions: SQL[] = [];
        const doctorAccount = aliasedTable(account, 'doctorAccount');
        const patientAccount = aliasedTable(account, 'patientAccount');

        if(getAppointmentDto.patient)  {
            conditions.push(eq(appointment.patientId, Number(getAppointmentDto.patient)));
        }

        if(getAppointmentDto.doctor) {
            conditions.push(eq(appointment.doctorId, Number(getAppointmentDto.doctor)));
        }

        const query = this.db.connection
            .select({
                appointmentId: appointment.appointmentId,
                doctorId: appointment.doctorId,
                patientId: appointment.patientId,
                timeslot: appointment.timeslot,
                day: appointment.day,
                doctorFirstName: doctorAccount.firstName,
                doctorLastName: doctorAccount.lastName,
                patientFirstName: patientAccount.firstName,
                patientLastName: patientAccount.lastName,
            })
            .from(appointment)
            .innerJoin(doctorAccount, eq(appointment.doctorId, doctorAccount.id))
            .innerJoin(patientAccount, eq(appointment.patientId, patientAccount.id));

        if (conditions.length === 0) {
            return query;
        }

        return query.where(and(...conditions));
    }

    update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
        return `This action updates a #${id} appointment`;
    }

    async remove(id: number) {
        return await this.db.connection
            .delete(appointment)
            .where(eq(appointment.appointmentId, id))
            .returning()
    }
}
