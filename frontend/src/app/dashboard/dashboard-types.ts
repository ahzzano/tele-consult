export type Appointment = {
    appointmentId: number;
    doctorId: number;
    patientId: number;
    timeslot: string;
    day: number;
    sessionUrl?: string | null;
    doctorFirstName?: string | null;
    doctorLastName?: string | null;
    doctorName?: string | null;
    patientFirstName?: string | null;
    patientLastName?: string | null;
    patientName?: string | null;
};
