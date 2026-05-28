import { Injectable } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { DbService } from 'src/db/db.service';
import { appointment, doctor } from 'src/db/schema';
import { GetAppontmentDto } from './dto/get-appointment.dto';
import { eq, SQL, and } from 'drizzle-orm';

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
        const conditions: SQL[] = []

        if(getAppointmentDto.patient)  {
            conditions.push(eq(appointment.patientId, getAppointmentDto.patient))
        }

        if(getAppointmentDto.doctor) {
            conditions.push(eq(appointment.doctorId, getAppointmentDto.doctor))
        }

        const appointments = await this.db.connection
            .select()
            .from(appointment)
            .where(and(...conditions))

        return appointments
    }

    findOne(id: number) {
        return `This action returns a #${id} appointment`;
    }

    update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
        return `This action updates a #${id} appointment`;
    }

    remove(id: number) {
        return `This action removes a #${id} appointment`;
    }
}
