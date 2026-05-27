export type AppointmentBlockDto = {
  dayOfWeek: number;
  start: string;
  end: string;
};

export class UpdateAppointmentBlocksDto {
  appointmentBlocks: AppointmentBlockDto[];
}
