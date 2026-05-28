import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { DbService } from 'src/db/db.service';
import { account, appointment } from 'src/db/schema';
import { GetAppontmentDto } from './dto/get-appointment.dto';
import { eq, SQL, and } from 'drizzle-orm';
import { aliasedTable } from 'drizzle-orm/alias';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

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

    async update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
        this.validateAppointmentId(id);

        const values: Partial<typeof appointment.$inferInsert> = {};

        if (updateAppointmentDto.doctorId !== undefined) {
            values.doctorId = updateAppointmentDto.doctorId;
        }

        if (updateAppointmentDto.patientId !== undefined) {
            values.patientId = updateAppointmentDto.patientId;
        }

        if (updateAppointmentDto.timeslot !== undefined) {
            this.validateTimeslot(updateAppointmentDto.timeslot);
            values.timeslot = updateAppointmentDto.timeslot;
        }

        if (updateAppointmentDto.dayOfWeek !== undefined) {
            this.validateDayOfWeek(updateAppointmentDto.dayOfWeek);
            values.day = updateAppointmentDto.dayOfWeek;
        }

        return this.updateAppointment(id, values);
    }

    async reschedule(
        id: number,
        rescheduleAppointmentDto: RescheduleAppointmentDto,
    ) {
        this.validateAppointmentId(id);
        this.validateTimeslot(rescheduleAppointmentDto.timeslot);
        this.validateDayOfWeek(rescheduleAppointmentDto.dayOfWeek);

        return this.updateAppointment(id, {
            timeslot: rescheduleAppointmentDto.timeslot,
            day: rescheduleAppointmentDto.dayOfWeek,
        });
    }

    async remove(id: number) {
        return await this.db.connection
            .delete(appointment)
            .where(eq(appointment.appointmentId, id))
            .returning()
    }

    private async updateAppointment(
        id: number,
        values: Partial<typeof appointment.$inferInsert>,
    ) {
        if (Object.keys(values).length === 0) {
            throw new BadRequestException('No appointment fields to update');
        }

        const [updatedAppointment] = await this.db.connection
            .update(appointment)
            .set(values)
            .where(eq(appointment.appointmentId, id))
            .returning();

        if (!updatedAppointment) {
            throw new NotFoundException('Appointment not found');
        }

        return updatedAppointment;
    }

    private validateAppointmentId(id: number) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new BadRequestException('Appointment id must be a positive integer');
        }
    }

    private validateTimeslot(timeslot: string | undefined) {
        if (!timeslot || Number.isNaN(Date.parse(timeslot))) {
            throw new BadRequestException('Appointment timeslot must be a valid date');
        }
    }

    private validateDayOfWeek(dayOfWeek: number | undefined) {
        if (
            dayOfWeek === undefined ||
            !Number.isInteger(dayOfWeek) ||
            dayOfWeek < 0 ||
            dayOfWeek > 6
        ) {
            throw new BadRequestException(
                'Appointment day must be between 0 and 6',
            );
        }
    }
}
