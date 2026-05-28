import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountRole, type CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { DbService } from 'src/db/db.service';
import { account, doctor, patient } from 'src/db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AccountService {
    constructor(private db: DbService) { }

    private optional(value: string | null | undefined) {
        return value === '' ? null : value;
    }

    async create(createAccountDto: CreateAccountDto) {
        return await this.db.connection.insert(account).values(createAccountDto).returning();
    }

    async register(dto: CreateAccountDto) {
        const existing = await this.db.connection
            .select()
            .from(account)
            .where(eq(account.email, dto.email))
            .limit(1);

        if (existing.length > 0) {
            throw new ConflictException('Email already in use');
        }

        const [newAccount] = await this.db.connection
            .insert(account)
            .values({
                email: dto.email,
                password: dto.password,
                firstName: dto.firstName,
                lastName: dto.lastName,
            })
            .returning();
        
        if (dto.role == AccountRole.DOCTOR) {
            await this.db.connection
                .insert(doctor)
                .values({
                    acctId: newAccount.id,
                    bio: this.optional(dto.bio),
                    specialization: this.optional(dto.specialization),
                    profilePicture: this.optional(dto.profilePicture),
                })
                .returning()
        } else {
            await this.db.connection
                .insert(patient)
                .values({
                    acctId: newAccount.id,
                    birthday: this.optional(dto.birthday),
                    weight: this.optional(dto.weight),
                    height: this.optional(dto.height),
                    contactDetails: this.optional(dto.contactDetails),
                    medicalHistory: this.optional(dto.medicalHistory),
                    profilePicture: this.optional(dto.profilePicture),
                })
                .returning()

        }

        return newAccount
    }

    findAll() {
        return `This action returns all account`;
    }

    async findOne(email: string) {
        return await this.db.connection
            .select()
            .from(account)
            .where(eq(account.email, email))
    }

    async findProfile(email: string) {
        const [user] = await this.findOne(email);

        if (!user) {
            return null;
        }

        const [doctorProfile] = await this.db.connection
            .select()
            .from(doctor)
            .where(eq(doctor.acctId, user.id));

        const [patientProfile] = await this.db.connection
            .select()
            .from(patient)
            .where(eq(patient.acctId, user.id));

        const { password, ...accountProfile } = user;

        return {
            ...accountProfile,
            role: doctorProfile ? AccountRole.DOCTOR : AccountRole.PATIENT,
            doctorProfile: doctorProfile ?? null,
            patientProfile: patientProfile ?? null,
        };
    }

    async update(id: number, dto: UpdateAccountDto) {
        const [existingAccount] = await this.db.connection
            .select()
            .from(account)
            .where(eq(account.id, id))
            .limit(1);

        if (!existingAccount) {
            throw new NotFoundException('Account not found');
        }

        if (dto.email && dto.email !== existingAccount.email) {
            const existingEmail = await this.db.connection
                .select()
                .from(account)
                .where(eq(account.email, dto.email))
                .limit(1);

            if (existingEmail.length > 0) {
                throw new ConflictException('Email already in use');
            }
        }

        const { password, ...accountFields } = {
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            password: dto.password,
        };

        await this.db.connection
            .update(account)
            .set({
                ...accountFields,
                ...(password ? { password } : {}),
            })
            .where(eq(account.id, id));

        if (dto.role === AccountRole.DOCTOR) {
            await this.db.connection
                .update(doctor)
                .set({
                    bio: this.optional(dto.bio),
                    specialization: this.optional(dto.specialization),
                    profilePicture: this.optional(dto.profilePicture),
                })
                .where(eq(doctor.acctId, id));
        }

        if (dto.role === AccountRole.PATIENT) {
            await this.db.connection
                .update(patient)
                .set({
                    birthday: this.optional(dto.birthday),
                    weight: this.optional(dto.weight),
                    height: this.optional(dto.height),
                    contactDetails: this.optional(dto.contactDetails),
                    medicalHistory: this.optional(dto.medicalHistory),
                    profilePicture: this.optional(dto.profilePicture),
                })
                .where(eq(patient.acctId, id));
        }

        return this.findProfile(dto.email ?? existingAccount.email);
    }

    remove(id: number) {
        return `This action removes a #${id} account`;
    }
}
