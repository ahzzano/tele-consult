import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AccountService } from 'src/account/account.service';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private acctService: AccountService,
        private jwtService: JwtService
    ) {}

    async signin(email: string, pass: string) {
        const [user] = await this.acctService.findOne(email)
        if(!user || !(await bcrypt.compare(pass, user.password))) {
            throw new UnauthorizedException()
        }

        const {password, ...result} = user

        return { 
            access_token: await this.jwtService.signAsync(result)
        }
    }
}
