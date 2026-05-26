import { ConflictException, Injectable } from '@nestjs/common';
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

    async findOne(id: number) {
        return await this.db.connection.select().from(account).where(eq(account.id, id))
    }

    update(id: number, updateAccountDto: UpdateAccountDto) {
        return `This action updates a #${id} account`;
    }

    remove(id: number) {
        return `This action removes a #${id} account`;
    }
}
