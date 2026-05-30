import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
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
import { NotificationsService } from 'src/notifications/notifications.service';

const APPOINTMENT_DURATION_MINUTES = 60;

@Injectable()
export class AppointmentsService {
    constructor(
        private db: DbService,
        private notificationsService: NotificationsService,
    ) {}

    async create(createAppointmentDto: CreateAppointmentDto, actorId?: number) {
        if (actorId !== undefined && actorId !== createAppointmentDto.patientId) {
            throw new ForbiddenException('Patients can only book their own appointments');
        }

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

        this.notificationsService.notify(
            createAppointmentDto.doctorId,
            'New appointment booked',
            `A patient booked a consultation for ${this.formatAppointmentTime(createAppointmentDto.timeslot)}.`,
        );
        this.notificationsService.notify(
            createAppointmentDto.patientId,
            'Appointment confirmed',
            `Your consultation is booked for ${this.formatAppointmentTime(createAppointmentDto.timeslot)}.`,
        );

        return newAppointment;
    }

    async findAll(getAppointmentDto: GetAppontmentDto, actorId?: number) {
        const conditions: SQL[] = [];
        const doctorAccount = aliasedTable(account, 'doctorAccount');
        const patientAccount = aliasedTable(account, 'patientAccount');

        if(getAppointmentDto.patient)  {
            if (actorId !== undefined && Number(getAppointmentDto.patient) !== actorId) {
                throw new ForbiddenException('You can only view your own appointments');
            }

            conditions.push(eq(appointment.patientId, Number(getAppointmentDto.patient)));
        }

        if(getAppointmentDto.doctor) {
            if (actorId !== undefined && Number(getAppointmentDto.doctor) !== actorId) {
                throw new ForbiddenException('You can only view your own appointments');
            }

            conditions.push(eq(appointment.doctorId, Number(getAppointmentDto.doctor)));
        }

        if (actorId !== undefined && !getAppointmentDto.patient && !getAppointmentDto.doctor) {
            const ownAppointmentsFilter = or(
                eq(appointment.patientId, actorId),
                eq(appointment.doctorId, actorId),
            );

            if (ownAppointmentsFilter) {
                conditions.push(ownAppointmentsFilter);
            }
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

        const rows = conditions.length === 0
            ? await query
            : await query.where(and(...conditions));

        return rows.map((row) => ({
            ...row,
            sessionUrl: this.sessionUrl(row.appointmentId),
        }));
    }

    async update(id: number, updateAppointmentDto: UpdateAppointmentDto, actorId?: number) {
        this.validateAppointmentId(id);
        await this.ensureAppointmentActor(id, actorId);

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
        actorId?: number,
    ) {
        this.validateAppointmentId(id);
        await this.ensureAppointmentActor(id, actorId);
        this.validateTimeslot(rescheduleAppointmentDto.timeslot);
        this.validateDayOfWeek(rescheduleAppointmentDto.dayOfWeek);

        await this.validateUpdatedAppointment(id, {
            timeslot: rescheduleAppointmentDto.timeslot,
            day: rescheduleAppointmentDto.dayOfWeek,
        });

        const updatedAppointment = await this.updateAppointment(id, {
            timeslot: rescheduleAppointmentDto.timeslot,
            day: rescheduleAppointmentDto.dayOfWeek,
        });

        this.notificationsService.notify(
            updatedAppointment.doctorId,
            'Appointment rescheduled',
            `A consultation moved to ${this.formatAppointmentTime(updatedAppointment.timeslot)}.`,
        );
        this.notificationsService.notify(
            updatedAppointment.patientId,
            'Appointment rescheduled',
            `Your consultation moved to ${this.formatAppointmentTime(updatedAppointment.timeslot)}.`,
        );

        return updatedAppointment;
    }

    async remove(id: number, actorId?: number) {
        this.validateAppointmentId(id);
        await this.ensureAppointmentActor(id, actorId);

        const [deletedAppointment] = await this.db.connection
            .delete(appointment)
            .where(eq(appointment.appointmentId, id))
            .returning();

        if (deletedAppointment) {
            this.notificationsService.notify(
                deletedAppointment.doctorId,
                'Appointment cancelled',
                `A consultation on ${this.formatAppointmentTime(deletedAppointment.timeslot)} was cancelled.`,
            );
            this.notificationsService.notify(
                deletedAppointment.patientId,
                'Appointment cancelled',
                `Your consultation on ${this.formatAppointmentTime(deletedAppointment.timeslot)} was cancelled.`,
            );
        }

        return deletedAppointment;
    }

    async findBookedSlots(doctorId: number, actorId?: number) {
        void actorId;
        this.validateAccountId(doctorId, 'Doctor id');

        await this.ensureDoctorExists(doctorId);

        return this.db.connection
            .select({
                appointmentId: appointment.appointmentId,
                timeslot: appointment.timeslot,
                day: appointment.day,
            })
            .from(appointment)
            .where(eq(appointment.doctorId, doctorId));
    }

    async findUpcomingReminders(actorId: number) {
        const now = new Date();
        const reminderWindowEnd = this.addMinutes(now, 24 * 60);
        const appointments = await this.findAll({}, actorId);

        return appointments
            .filter((existingAppointment) => {
                const appointmentDate = new Date(existingAppointment.timeslot);

                return appointmentDate >= now && appointmentDate <= reminderWindowEnd;
            })
            .map((existingAppointment) => {
                const isDoctor = existingAppointment.doctorId === actorId;
                const otherParty = isDoctor
                    ? this.fullName(
                          existingAppointment.patientFirstName,
                          existingAppointment.patientLastName,
                          `patient #${existingAppointment.patientId}`,
                      )
                    : `Dr. ${this.fullName(
                          existingAppointment.doctorFirstName,
                          existingAppointment.doctorLastName,
                          `doctor #${existingAppointment.doctorId}`,
                      )}`;

                return {
                    id: `upcoming-${existingAppointment.appointmentId}`,
                    title: 'Upcoming appointment',
                    message: `${otherParty} at ${this.formatAppointmentTime(existingAppointment.timeslot)}.`,
                    createdAt: now.toISOString(),
                };
            });
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

    private async ensureAppointmentActor(id: number, actorId?: number) {
        if (actorId === undefined) {
            return;
        }

        const [existingAppointment] = await this.db.connection
            .select()
            .from(appointment)
            .where(eq(appointment.appointmentId, id))
            .limit(1);

        if (!existingAppointment) {
            throw new NotFoundException('Appointment not found');
        }

        if (
            existingAppointment.patientId !== actorId &&
            existingAppointment.doctorId !== actorId
        ) {
            throw new ForbiddenException('You can only manage your own appointments');
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
        await this.ensureDoctorExists(doctorId);

        const [existingPatient] = await this.db.connection
            .select()
            .from(patient)
            .where(eq(patient.acctId, patientId))
            .limit(1);

        if (!existingPatient) {
            throw new NotFoundException('Patient not found');
        }
    }

    private async ensureDoctorExists(doctorId: number) {
        const [existingDoctor] = await this.db.connection
            .select()
            .from(doctor)
            .where(eq(doctor.acctId, doctorId))
            .limit(1);

        if (!existingDoctor) {
            throw new NotFoundException('Doctor not found');
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

    private sessionUrl(appointmentId: number) {
        return `https://meet.jit.si/tele-consult-${appointmentId}`;
    }

    private formatAppointmentTime(timeslot: string) {
        return new Intl.DateTimeFormat('en', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(timeslot));
    }

    private fullName(
        firstName: string | null,
        lastName: string | null,
        fallback: string,
    ) {
        return [firstName, lastName].filter(Boolean).join(' ') || fallback;
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
