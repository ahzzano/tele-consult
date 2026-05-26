export enum AccountRole {
    PATIENT = 'Patient',
    DOCTOR = 'Doctor',
}

export class CreateAccountDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    id?: number | undefined;
    createdAt?: Date | null | undefined
    role: AccountRole
}
