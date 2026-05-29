import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type AuthUser = {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
};

export const CurrentUser = createParamDecorator(
    (_data: unknown, context: ExecutionContext): AuthUser => {
        const request = context.switchToHttp().getRequest<{ user: AuthUser }>();
        return request.user;
    },
);
