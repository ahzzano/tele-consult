import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
        const token = this.extractToken(request);

        if (!token) {
            throw new UnauthorizedException();
        }

        try {
            request.user = await this.jwtService.verifyAsync(token);
        } catch {
            throw new UnauthorizedException();
        }

        return true;
    }

    private extractToken(request: Request) {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];

        if (type === 'Bearer' && token) {
            return token;
        }

        return this.extractCookie(request.headers.cookie, 'auth_token');
    }

    private extractCookie(cookieHeader: string | undefined, name: string) {
        if (!cookieHeader) {
            return undefined;
        }

        return cookieHeader
            .split(';')
            .map((cookie) => cookie.trim())
            .find((cookie) => cookie.startsWith(`${name}=`))
            ?.slice(name.length + 1);
    }
}
