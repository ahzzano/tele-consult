import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccountService } from 'src/account/account.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AccountModule } from 'src/account/account.module';
import { jwtConstants } from './constants';

@Module({
    imports: [
        AccountModule,
        JwtModule.register({
            global: true, 
            secret: jwtConstants.secret,
            signOptions: {expiresIn: '100s'}
        })
    ],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [JwtModule],
})
export class AuthModule { }
