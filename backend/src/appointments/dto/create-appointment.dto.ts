// Assume all appointments are one hour.
export class CreateAppointmentDto {
    patientId: number;
    doctorId: number;
    timeslot: string;
    dayOfWeek: number;
}
