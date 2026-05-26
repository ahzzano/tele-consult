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
    bio?: string | null;
    specialization?: string | null;
    birthday?: string | null;
    weight?: string | null;
    height?: string | null;
    contactDetails?: string | null;
    medicalHistory?: string | null;
    profilePicture?: string | null;
}
