import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { DbService } from '../db/db.service';
import { doctor, medicalRecord, patient, prescription } from '../db/schema';
import { and, eq, SQL } from 'drizzle-orm';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PrescriptionsService {
    constructor(
        private dbService: DbService,
        private notificationsService: NotificationsService,
    ) { }

    async create(createPrescriptionDto: CreatePrescriptionDto, actorId?: number) {
        if (actorId !== undefined && actorId !== createPrescriptionDto.doctor) {
            throw new ForbiddenException('Doctors can only create their own prescriptions');
        }

        this.validatePrescriptionData(createPrescriptionDto);
        await this.ensurePrescriptionReferencesExist(createPrescriptionDto);

        const [newPrescription] = await this.dbService.connection
            .insert(prescription)
            .values(createPrescriptionDto)
            .returning();

        this.notificationsService.notify(
            createPrescriptionDto.patient,
            'Prescription added',
            `Your doctor added ${createPrescriptionDto.medicine} to your prescription record.`,
        );

        return newPrescription;
    }

    async findAll(
        query: { doctor?: number, patient?: number, record?: number } = {},
        actorId?: number,
    ) {
        const conditions: SQL[] = [];

        if (query.doctor) {
            if (actorId !== undefined && Number(query.doctor) !== actorId) {
                throw new ForbiddenException('You can only view your own prescriptions');
            }

            conditions.push(eq(prescription.doctor, Number(query.doctor)));
        }

        if (query.patient) {
            if (actorId !== undefined && Number(query.patient) !== actorId) {
                throw new ForbiddenException('You can only view your own prescriptions');
            }

            conditions.push(eq(prescription.patient, Number(query.patient)));
        }

        if (query.record) {
            conditions.push(eq(prescription.record, Number(query.record)));
        }

        if (actorId !== undefined && !query.doctor && !query.patient) {
            conditions.push(eq(prescription.patient, actorId));
        }

        const dbQuery = this.dbService.connection
            .select()
            .from(prescription);

        if (conditions.length === 0) {
            return await dbQuery;
        }

        return await dbQuery.where(and(...conditions));
    }

    async findOne(id: number, actorId?: number) {
        this.validateId(id, 'Prescription id');

        const [existingPrescription] = await this.dbService.connection
            .select()
            .from(prescription)
            .where(eq(prescription.id, id))
            .limit(1);

        if (!existingPrescription) {
            throw new NotFoundException('Prescription not found');
        }

        this.ensurePrescriptionActor(existingPrescription, actorId);

        return existingPrescription;
    }

    async update(
        id: number,
        updatePrescriptionDto: UpdatePrescriptionDto,
        actorId?: number,
    ) {
        this.validateId(id, 'Prescription id');

        const existingPrescription = await this.findOne(id, actorId);

        if (actorId !== undefined && existingPrescription.doctor !== actorId) {
            throw new ForbiddenException('Only the prescription doctor can update this prescription');
        }

        const values: Partial<typeof prescription.$inferInsert> = {};

        if (updatePrescriptionDto.patient !== undefined) {
            values.patient = updatePrescriptionDto.patient;
        }

        if (updatePrescriptionDto.doctor !== undefined) {
            values.doctor = updatePrescriptionDto.doctor;
        }

        if (updatePrescriptionDto.record !== undefined) {
            values.record = updatePrescriptionDto.record;
        }

        if (updatePrescriptionDto.medicine !== undefined) {
            values.medicine = updatePrescriptionDto.medicine;
        }

        if (updatePrescriptionDto.dosage !== undefined) {
            values.dosage = updatePrescriptionDto.dosage;
        }

        if (Object.keys(values).length === 0) {
            throw new BadRequestException('No prescription fields to update');
        }

        const updatedPrescriptionData = {
            patient: values.patient ?? existingPrescription.patient,
            doctor: values.doctor ?? existingPrescription.doctor,
            record: values.record ?? existingPrescription.record,
            medicine: values.medicine ?? existingPrescription.medicine,
            dosage: values.dosage ?? existingPrescription.dosage,
        };

        this.validatePrescriptionData(updatedPrescriptionData);
        await this.ensurePrescriptionReferencesExist(updatedPrescriptionData);

        const [updatedPrescription] = await this.dbService.connection
            .update(prescription)
            .set(values)
            .where(eq(prescription.id, id))
            .returning();

        return updatedPrescription;
    }

    async remove(id: number, actorId?: number) {
        this.validateId(id, 'Prescription id');

        const existingPrescription = await this.findOne(id, actorId);

        if (actorId !== undefined && existingPrescription.doctor !== actorId) {
            throw new ForbiddenException('Only the prescription doctor can delete this prescription');
        }

        const [deletedPrescription] = await this.dbService.connection
            .delete(prescription)
            .where(eq(prescription.id, id))
            .returning();

        if (!deletedPrescription) {
            throw new NotFoundException('Prescription not found');
        }

        return deletedPrescription;
    }

    private validatePrescriptionData(prescriptionData: CreatePrescriptionDto) {
        this.validateId(prescriptionData.patient, 'Patient id');
        this.validateId(prescriptionData.doctor, 'Doctor id');
        this.validateId(prescriptionData.record, 'Record id');

        if (!prescriptionData.medicine?.trim()) {
            throw new BadRequestException('Medicine is required');
        }

        if (
            typeof prescriptionData.dosage !== 'number' ||
            !Number.isFinite(prescriptionData.dosage) ||
            prescriptionData.dosage <= 0
        ) {
            throw new BadRequestException('Dosage must be a positive number');
        }
    }

    private async ensurePrescriptionReferencesExist(
        prescriptionData: CreatePrescriptionDto,
    ) {
        const [existingDoctor] = await this.dbService.connection
            .select()
            .from(doctor)
            .where(eq(doctor.acctId, prescriptionData.doctor))
            .limit(1);

        if (!existingDoctor) {
            throw new NotFoundException('Doctor not found');
        }

        const [existingPatient] = await this.dbService.connection
            .select()
            .from(patient)
            .where(eq(patient.acctId, prescriptionData.patient))
            .limit(1);

        if (!existingPatient) {
            throw new NotFoundException('Patient not found');
        }

        const [existingRecord] = await this.dbService.connection
            .select()
            .from(medicalRecord)
            .where(eq(medicalRecord.id, prescriptionData.record))
            .limit(1);

        if (!existingRecord) {
            throw new NotFoundException('Medical record not found');
        }

        if (
            existingRecord.doctor !== prescriptionData.doctor ||
            existingRecord.patient !== prescriptionData.patient
        ) {
            throw new BadRequestException(
                'Prescription doctor and patient must match the medical record',
            );
        }
    }

    private validateId(id: number, fieldName: string) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new BadRequestException(`${fieldName} must be a positive integer`);
        }
    }

    private ensurePrescriptionActor(
        prescriptionData: typeof prescription.$inferSelect,
        actorId?: number,
    ) {
        if (actorId === undefined) {
            return;
        }

        if (
            prescriptionData.doctor !== actorId &&
            prescriptionData.patient !== actorId
        ) {
            throw new ForbiddenException('You can only access your own prescriptions');
        }
    }
}
