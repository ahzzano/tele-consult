import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { DbService } from 'src/db/db.service';
import { doctor, medicalRecord, patient } from 'src/db/schema';
import { eq, SQL, and } from 'drizzle-orm';

@Injectable()
export class RecordsService {
    constructor(private dbService: DbService) { }

    async create(createRecordDto: CreateRecordDto) {
        const [existingDoctor] = await this.dbService.connection
            .select()
            .from(doctor)
            .where(eq(doctor.acctId, doctorId))
            .limit(1);

        if (!existingDoctor) {
            throw new NotFoundException('Doctor not found');
        }

        const [existingPatient] = await this.dbService.connection
            .select()
            .from(patient)
            .where(eq(patient.acctId, patientId))
            .limit(1);

        if (!existingPatient) {
            throw new NotFoundException('Patient not found');
        }

        return await this.dbService.connection
            .insert(medicalRecord)
            .values(createRecordDto)
            .returning()
    }

    async findAll(query: { doctor?: number, patient?: number }) {
        const conditions: SQL[] = [];

        if(query.doctor)  {
            conditions.push(eq(medicalRecord.doctor, query.doctor));
        }

        if(query.patient) {
            conditions.push(eq(medicalRecord.patient, query.patient));
        }

        const result = await this.dbService.connection
            .select()
            .from(medicalRecord)
            .where(and(...conditions))

        return result
    }

    findOne(id: number) {
        return `This action returns a #${id} record`;
    }

    update(id: number, updateRecordDto: UpdateRecordDto) {
        return `This action updates a #${id} record`;
    }

    remove(id: number) {
        return `This action removes a #${id} record`;
    }
}
