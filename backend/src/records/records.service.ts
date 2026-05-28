import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { DbService } from 'src/db/db.service';
import { appointment, doctor, medicalRecord, patient } from 'src/db/schema';
import { eq, SQL, and } from 'drizzle-orm';

@Injectable()
export class RecordsService {
    constructor(private dbService: DbService) { }

    async create(createRecordDto: CreateRecordDto, actorId?: number) {
        this.validateRecordData(createRecordDto);

        if (actorId !== undefined && actorId !== createRecordDto.doctor) {
            throw new ForbiddenException('Doctors can only create their own records');
        }

        const [existingDoctor] = await this.dbService.connection
            .select()
            .from(doctor)
            .where(eq(doctor.acctId, createRecordDto.doctor))
            .limit(1);

        if (!existingDoctor) {
            throw new NotFoundException('Doctor not found');
        }

        const [existingPatient] = await this.dbService.connection
            .select()
            .from(patient)
            .where(eq(patient.acctId, createRecordDto.patient))
            .limit(1);

        if (!existingPatient) {
            throw new NotFoundException('Patient not found');
        }

        await this.ensureRecordAppointmentMatches(createRecordDto);

        return await this.dbService.connection
            .insert(medicalRecord)
            .values(createRecordDto)
            .returning()
    }

    async findAll(query: { doctor?: number, patient?: number }, actorId?: number) {
        const conditions: SQL[] = [];

        if(query.doctor)  {
            if (actorId !== undefined && Number(query.doctor) !== actorId) {
                throw new ForbiddenException('You can only view your own records');
            }

            conditions.push(eq(medicalRecord.doctor, Number(query.doctor)));
        }

        if(query.patient) {
            if (actorId !== undefined && Number(query.patient) !== actorId) {
                throw new ForbiddenException('You can only view your own records');
            }

            conditions.push(eq(medicalRecord.patient, Number(query.patient)));
        }

        if (actorId !== undefined && !query.doctor && !query.patient) {
            conditions.push(eq(medicalRecord.patient, actorId));
        }

        const queryBuilder = this.dbService.connection
            .select()
            .from(medicalRecord);

        const result = conditions.length > 0
            ? await queryBuilder.where(and(...conditions))
            : await queryBuilder;

        return result
    }

    async findOne(id: number, actorId?: number) {
        this.validateId(id, 'Record id');

        const [existingRecord] = await this.dbService.connection
            .select()
            .from(medicalRecord)
            .where(eq(medicalRecord.id, id))
            .limit(1);

        if (!existingRecord) {
            throw new NotFoundException('Medical record not found');
        }

        this.ensureRecordActor(existingRecord, actorId);

        return existingRecord;
    }

    async update(id: number, updateRecordDto: UpdateRecordDto, actorId?: number) {
        this.validateId(id, 'Record id');

        const existingRecord = await this.findOne(id, actorId);

        if (actorId !== undefined && existingRecord.doctor !== actorId) {
            throw new ForbiddenException('Only the record doctor can update this record');
        }

        const values: Partial<typeof medicalRecord.$inferInsert> = {};

        if (updateRecordDto.appointmentId !== undefined) {
            values.appointmentId = updateRecordDto.appointmentId;
        }

        if (updateRecordDto.patient !== undefined) {
            values.patient = updateRecordDto.patient;
        }

        if (updateRecordDto.doctor !== undefined) {
            values.doctor = updateRecordDto.doctor;
        }

        if (updateRecordDto.diagnosis !== undefined) {
            values.diagnosis = updateRecordDto.diagnosis;
        }

        if (updateRecordDto.summary !== undefined) {
            values.summary = updateRecordDto.summary;
        }

        if (updateRecordDto.followUpInstructions !== undefined) {
            values.followUpInstructions = updateRecordDto.followUpInstructions;
        }

        if (Object.keys(values).length === 0) {
            throw new BadRequestException('No record fields to update');
        }

        const updatedRecordData = {
            appointmentId: values.appointmentId ?? existingRecord.appointmentId,
            patient: values.patient ?? existingRecord.patient,
            doctor: values.doctor ?? existingRecord.doctor,
            diagnosis: values.diagnosis ?? existingRecord.diagnosis ?? '',
            summary: values.summary ?? existingRecord.summary ?? '',
            followUpInstructions:
                values.followUpInstructions ??
                existingRecord.followUpInstructions ??
                '',
        };

        if (updatedRecordData.appointmentId === null) {
            throw new BadRequestException(
                'Appointment id is required before updating this record',
            );
        }

        const completeRecordData: CreateRecordDto = {
            ...updatedRecordData,
            appointmentId: updatedRecordData.appointmentId,
        };

        this.validateRecordData(completeRecordData);
        await this.ensureRecordAppointmentMatches(completeRecordData);

        const [updatedRecord] = await this.dbService.connection
            .update(medicalRecord)
            .set(values)
            .where(eq(medicalRecord.id, id))
            .returning();

        return updatedRecord;
    }

    async remove(id: number, actorId?: number) {
        const existingRecord = await this.findOne(id, actorId);

        if (actorId !== undefined && existingRecord.doctor !== actorId) {
            throw new ForbiddenException('Only the record doctor can delete this record');
        }

        const [deletedRecord] = await this.dbService.connection
            .delete(medicalRecord)
            .where(eq(medicalRecord.id, id))
            .returning();

        return deletedRecord;
    }

    private validateRecordData(recordData: CreateRecordDto) {
        this.validateId(recordData.appointmentId, 'Appointment id');
        this.validateId(recordData.patient, 'Patient id');
        this.validateId(recordData.doctor, 'Doctor id');

        if (!recordData.diagnosis?.trim()) {
            throw new BadRequestException('Diagnosis is required');
        }

        if (!recordData.summary?.trim()) {
            throw new BadRequestException('Summary is required');
        }
    }

    private async ensureRecordAppointmentMatches(recordData: CreateRecordDto) {
        const [existingAppointment] = await this.dbService.connection
            .select()
            .from(appointment)
            .where(eq(appointment.appointmentId, recordData.appointmentId))
            .limit(1);

        if (!existingAppointment) {
            throw new NotFoundException('Appointment not found');
        }

        if (
            existingAppointment.doctorId !== recordData.doctor ||
            existingAppointment.patientId !== recordData.patient
        ) {
            throw new BadRequestException(
                'Medical record doctor and patient must match the appointment',
            );
        }
    }

    private ensureRecordActor(
        recordData: typeof medicalRecord.$inferSelect,
        actorId?: number,
    ) {
        if (actorId === undefined) {
            return;
        }

        if (recordData.doctor !== actorId && recordData.patient !== actorId) {
            throw new ForbiddenException('You can only access your own records');
        }
    }

    private validateId(id: number, fieldName: string) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new BadRequestException(`${fieldName} must be a positive integer`);
        }
    }
}
