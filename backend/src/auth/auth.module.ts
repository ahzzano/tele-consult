import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccountService } from 'src/account/account.service';

@Module({
    controllers: [AuthController],
    providers: [AuthService, AccountService],
})
export class AuthModule { }
