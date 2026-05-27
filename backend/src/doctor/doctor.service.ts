import {
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { UpdateAppointmentBlocksDto } from './dto/update-appointment-blocks.dto';
import { account, appointmentBlock, doctor } from 'src/db/schema';
import { DbService } from 'src/db/db.service';
import { SQL, and, asc, eq, ilike, or } from 'drizzle-orm';
import { GetDoctorDto } from './dto/get-doctor.dto';

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
                profilePicture: dto.profilePicture,
            })
            .returning();
        return newDoctor;
    }

    async findAll(getDoctorDto: GetDoctorDto) {
        const searchTerm = getDoctorDto.name?.trim();
        const specialization = getDoctorDto.specialization?.trim();
        const filters: SQL[] = [];

        if (searchTerm) {
            const searchPattern = `%${searchTerm}%`;
            const searchFilter = or(
                ilike(account.firstName, searchPattern),
                ilike(account.lastName, searchPattern),
                ilike(doctor.specialization, searchPattern),
                ilike(doctor.bio, searchPattern),
            );

            if (searchFilter) {
                filters.push(searchFilter);
            }
        }

        if (specialization && specialization !== 'All') {
            filters.push(eq(doctor.specialization, specialization));
        }

        const query = this.db.connection
            .select({
                id: doctor.acctId,
                firstName: account.firstName,
                lastName: account.lastName,
                specialization: doctor.specialization,
                bio: doctor.bio
            })
            .from(doctor)
            .innerJoin(account, eq(doctor.acctId, account.id));

        if (filters.length === 0) {
            return query;
        }

        return query.where(and(...filters));
    }

    findOne(id: number) {
        return `This action returns a #${id} doctor`;
    }

    update(id: number, updateDoctorDto: UpdateDoctorDto) {
        void updateDoctorDto;
        return `This action updates a #${id} doctor`;
    }

    async findAppointmentBlocks(id: number) {
        await this.ensureDoctorExists(id);

        return this.db.connection
            .select()
            .from(appointmentBlock)
            .where(eq(appointmentBlock.doctorId, id))
            .orderBy(asc(appointmentBlock.dayOfWeek), asc(appointmentBlock.start));
    }

    async updateAppointmentBlocks(id: number, dto: UpdateAppointmentBlocksDto) {
        await this.ensureDoctorExists(id);

        const blocks = this.sanitizeAppointmentBlocks(id, dto.appointmentBlocks);

        return this.db.connection.transaction(async (tx) => {
            await tx
                .delete(appointmentBlock)
                .where(eq(appointmentBlock.doctorId, id));

            if (blocks.length === 0) {
                return [];
            }

            return tx.insert(appointmentBlock).values(blocks).returning();
        });
    }

    remove(id: number) {
        return `This action removes a #${id} doctor`;
    }

    private async ensureDoctorExists(id: number) {
        const [existingDoctor] = await this.db.connection
            .select()
            .from(doctor)
            .where(eq(doctor.acctId, id))
            .limit(1);

        if (!existingDoctor) {
            throw new NotFoundException('Doctor not found');
        }
    }

    private sanitizeAppointmentBlocks(
        doctorId: number,
        appointmentBlocks: UpdateAppointmentBlocksDto['appointmentBlocks'] = [],
    ) {
        return appointmentBlocks.map((block) => {
            if (block.dayOfWeek < 0 || block.dayOfWeek > 6) {
                throw new ConflictException(
                    'Appointment block day must be between 0 and 6',
                );
            }

            if (
                !block.start ||
                !block.end ||
                new Date(block.start) >= new Date(block.end)
            ) {
                throw new ConflictException(
                    'Appointment block start must be before end',
                );
            }

            return {
                doctorId,
                dayOfWeek: block.dayOfWeek,
                start: block.start,
                end: block.end,
            };
        });
    }
}
