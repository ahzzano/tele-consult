export class CreateAccountDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    id?: number | undefined;
    createdAt?: Date | null | undefined
}
