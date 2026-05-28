import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { DbService } from 'src/db/db.service';
import { account, appointment, appointmentBlock, doctor, patient } from 'src/db/schema';
import { GetAppontmentDto } from './dto/get-appointment.dto';
import { eq, SQL, and, or } from 'drizzle-orm';
import { aliasedTable } from 'drizzle-orm/alias';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

const APPOINTMENT_DURATION_MINUTES = 90;

@Injectable()
export class AppointmentsService {
    constructor(private db: DbService) {}

    async create(createAppointmentDto: CreateAppointmentDto) {
        await this.validateBookableAppointment({
            doctorId: createAppointmentDto.doctorId,
            patientId: createAppointmentDto.patientId,
            timeslot: createAppointmentDto.timeslot,
            dayOfWeek: createAppointmentDto.dayOfWeek,
        });

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

        await this.validateUpdatedAppointment(id, values);

        return this.updateAppointment(id, values);
    }

    async reschedule(
        id: number,
        rescheduleAppointmentDto: RescheduleAppointmentDto,
    ) {
        this.validateAppointmentId(id);
        this.validateTimeslot(rescheduleAppointmentDto.timeslot);
        this.validateDayOfWeek(rescheduleAppointmentDto.dayOfWeek);

        await this.validateUpdatedAppointment(id, {
            timeslot: rescheduleAppointmentDto.timeslot,
            day: rescheduleAppointmentDto.dayOfWeek,
        });

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

    private async validateUpdatedAppointment(
        id: number,
        values: Partial<typeof appointment.$inferInsert>,
    ) {
        const [existingAppointment] = await this.db.connection
            .select()
            .from(appointment)
            .where(eq(appointment.appointmentId, id))
            .limit(1);

        if (!existingAppointment) {
            throw new NotFoundException('Appointment not found');
        }

        const doctorId = values.doctorId ?? existingAppointment.doctorId;
        const patientId = values.patientId ?? existingAppointment.patientId;
        const timeslot = values.timeslot ?? existingAppointment.timeslot;
        const dayOfWeek = values.day ?? existingAppointment.day;

        await this.validateBookableAppointment({
            doctorId,
            patientId,
            timeslot,
            dayOfWeek,
            excludedAppointmentId: id,
        });
    }

    private async validateBookableAppointment({
        doctorId,
        patientId,
        timeslot,
        dayOfWeek,
        excludedAppointmentId,
    }: {
        doctorId: number;
        patientId: number;
        timeslot: string;
        dayOfWeek: number;
        excludedAppointmentId?: number;
    }) {
        this.validateAccountId(doctorId, 'Doctor id');
        this.validateAccountId(patientId, 'Patient id');
        this.validateTimeslot(timeslot);
        this.validateDayOfWeek(dayOfWeek);

        const requestedStart = new Date(timeslot);

        if (requestedStart.getDay() !== dayOfWeek) {
            throw new BadRequestException(
                'Appointment day must match the timeslot date',
            );
        }

        const requestedEnd = this.addMinutes(
            requestedStart,
            APPOINTMENT_DURATION_MINUTES,
        );

        await this.ensureDoctorAndPatientExist(doctorId, patientId);
        await this.ensureWithinDoctorAvailability(
            doctorId,
            dayOfWeek,
            requestedStart,
            requestedEnd,
        );
        await this.ensureNoScheduleConflict({
            doctorId,
            patientId,
            dayOfWeek,
            requestedStart,
            requestedEnd,
            excludedAppointmentId,
        });
    }

    private async ensureDoctorAndPatientExist(doctorId: number, patientId: number) {
        const [existingDoctor] = await this.db.connection
            .select()
            .from(doctor)
            .where(eq(doctor.acctId, doctorId))
            .limit(1);

        if (!existingDoctor) {
            throw new NotFoundException('Doctor not found');
        }

        const [existingPatient] = await this.db.connection
            .select()
            .from(patient)
            .where(eq(patient.acctId, patientId))
            .limit(1);

        if (!existingPatient) {
            throw new NotFoundException('Patient not found');
        }
    }

    private async ensureWithinDoctorAvailability(
        doctorId: number,
        dayOfWeek: number,
        requestedStart: Date,
        requestedEnd: Date,
    ) {
        const blocks = await this.db.connection
            .select()
            .from(appointmentBlock)
            .where(
                and(
                    eq(appointmentBlock.doctorId, doctorId),
                    eq(appointmentBlock.dayOfWeek, dayOfWeek),
                ),
            );

        const isWithinAvailability = blocks.some((block) => {
            const blockStart = this.dateWithTime(requestedStart, block.start);
            const blockEnd = this.dateWithTime(requestedStart, block.end);

            return requestedStart >= blockStart && requestedEnd <= blockEnd;
        });

        if (!isWithinAvailability) {
            throw new ConflictException(
                'Appointment must fit inside the doctor availability',
            );
        }
    }

    private async ensureNoScheduleConflict({
        doctorId,
        patientId,
        dayOfWeek,
        requestedStart,
        requestedEnd,
        excludedAppointmentId,
    }: {
        doctorId: number;
        patientId: number;
        dayOfWeek: number;
        requestedStart: Date;
        requestedEnd: Date;
        excludedAppointmentId?: number;
    }) {
        const sameDayAppointments = await this.db.connection
            .select()
            .from(appointment)
            .where(
                and(
                    eq(appointment.day, dayOfWeek),
                    or(
                        eq(appointment.doctorId, doctorId),
                        eq(appointment.patientId, patientId),
                    ),
                ),
            );

        const conflictingAppointment = sameDayAppointments.find((existing) => {
            if (existing.appointmentId === excludedAppointmentId) {
                return false;
            }

            const existingStart = new Date(existing.timeslot);
            const existingEnd = this.addMinutes(
                existingStart,
                APPOINTMENT_DURATION_MINUTES,
            );

            return requestedStart < existingEnd && requestedEnd > existingStart;
        });

        if (!conflictingAppointment) {
            return;
        }

        if (conflictingAppointment.doctorId === doctorId) {
            throw new ConflictException(
                'Doctor already has an appointment at this time',
            );
        }

        throw new ConflictException(
            'Patient already has an appointment at this time',
        );
    }

    private validateAccountId(id: number, fieldName: string) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new BadRequestException(`${fieldName} must be a positive integer`);
        }
    }

    private addMinutes(date: Date, minutes: number) {
        return new Date(date.getTime() + minutes * 60 * 1000);
    }

    private dateWithTime(date: Date, timestamp: string) {
        const source = new Date(timestamp);
        const target = new Date(date);
        target.setHours(
            source.getHours(),
            source.getMinutes(),
            source.getSeconds(),
            source.getMilliseconds(),
        );

        return target;
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
