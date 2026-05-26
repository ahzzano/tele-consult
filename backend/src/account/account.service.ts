import { Injectable } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { DbService } from 'src/db/db.service';
import { account, NewAccount } from 'src/db/schema';

@Injectable()
export class AccountService {
    constructor(private db: DbService) { }

    async create(data: NewAccount) {
        return this.db.connection.insert(account).values(data).returning()
    }

    findAll() {
        return `This action returns all account`;
    }

    findOne(id: number) {
        return `This action returns a #${id} account`;
    }

    update(id: number, updateAccountDto: UpdateAccountDto) {
        return `This action updates a #${id} account`;
    }

    remove(id: number) {
        return `This action removes a #${id} account`;
    }
}
