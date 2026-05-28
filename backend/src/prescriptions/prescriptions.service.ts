import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { DbService } from 'src/db/db.service';
import { doctor, medicalRecord, patient, prescription } from 'src/db/schema';
import { and, eq, SQL } from 'drizzle-orm';

@Injectable()
export class PrescriptionsService {
    constructor(private dbService: DbService) { }

    async create(createPrescriptionDto: CreatePrescriptionDto) {
        this.validatePrescriptionData(createPrescriptionDto);
        await this.ensurePrescriptionReferencesExist(createPrescriptionDto);

        const [newPrescription] = await this.dbService.connection
            .insert(prescription)
            .values(createPrescriptionDto)
            .returning();

        return newPrescription;
    }

    async findAll(query: { doctor?: number, patient?: number, record?: number } = {}) {
        const conditions: SQL[] = [];

        if (query.doctor) {
            conditions.push(eq(prescription.doctor, Number(query.doctor)));
        }

        if (query.patient) {
            conditions.push(eq(prescription.patient, Number(query.patient)));
        }

        if (query.record) {
            conditions.push(eq(prescription.record, Number(query.record)));
        }

        const dbQuery = this.dbService.connection
            .select()
            .from(prescription);

        if (conditions.length === 0) {
            return await dbQuery;
        }

        return await dbQuery.where(and(...conditions));
    }

    async findOne(id: number) {
        this.validateId(id, 'Prescription id');

        const [existingPrescription] = await this.dbService.connection
            .select()
            .from(prescription)
            .where(eq(prescription.id, id))
            .limit(1);

        if (!existingPrescription) {
            throw new NotFoundException('Prescription not found');
        }

        return existingPrescription;
    }

    async update(id: number, updatePrescriptionDto: UpdatePrescriptionDto) {
        this.validateId(id, 'Prescription id');

        const [existingPrescription] = await this.dbService.connection
            .select()
            .from(prescription)
            .where(eq(prescription.id, id))
            .limit(1);

        if (!existingPrescription) {
            throw new NotFoundException('Prescription not found');
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

    async remove(id: number) {
        this.validateId(id, 'Prescription id');

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
}
