import { Injectable, ConflictException } from '@nestjs/common';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { doctor } from 'src/db/schema';
import { DbService } from 'src/db/db.service';
import { eq } from 'drizzle-orm';

@Injectable()
export class DoctorService {
    constructor(private db: DbService) { }

    async create(dto: CreateDoctorDto) {
        const existing = await this.db.connection
            .select()
            .from(doctor)
            .where(eq(doctor.acctId, dto.acctId))
            .limit(1);

        if (existing.length > 0) {
            throw new ConflictException('Doctor profile already created');
        }

        const [newDoctor] = await this.db.connection
            .insert(doctor)
            .values({
                acctId: dto.acctId,
                bio: dto.bio,
                specialization: dto.specialization,
                profilePicture: dto.profilePicture
            })
            .returning()
        return newDoctor;
    }

    findAll() {
        return `This action returns all doctor`;
    }

    findOne(id: number) {
        return `This action returns a #${id} doctor`;
    }

    update(id: number, updateDoctorDto: UpdateDoctorDto) {
        return `This action updates a #${id} doctor`;
    }

    remove(id: number) {
        return `This action removes a #${id} doctor`;
    }
}
