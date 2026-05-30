import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccountService } from '../account/account.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AccountModule } from '../account/account.module';
import { jwtConstants } from './constants';

@Module({
    imports: [
        AccountModule,
        JwtModule.register({
            global: true, 
            secret: jwtConstants.secret,
            signOptions: {expiresIn: '1d'}
        })
    ],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [JwtModule],
})
export class AuthModule { }
