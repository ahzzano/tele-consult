import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccountService } from '../account/account.service';
import { JwtModule } from '@nestjs/jwt';
import { AccountModule } from '../account/account.module';
import { getJwtSecret } from './jwt.config';

@Module({
    imports: [
        AccountModule,
        JwtModule.register({
            global: true, 
            secret: getJwtSecret(),
            signOptions: {expiresIn: '1d'}
        })
    ],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [JwtModule],
})
export class AuthModule { }
