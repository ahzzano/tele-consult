// Assume all appointments are 1.5 hours (1 hour and 30 mins)
export class CreateAppointmentDto {
    patientId: number;
    doctorId: number;
    timeslot: string;
    dayOfWeek: number;
}
