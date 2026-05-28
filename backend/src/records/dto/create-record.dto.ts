export class CreateRecordDto {
    appointmentId: number;
    patient: number;
    doctor: number;
    diagnosis: string;
    summary: string;
    followUpInstructions: string;
}
