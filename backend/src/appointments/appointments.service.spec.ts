import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { DbService } from 'src/db/db.service';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  const returning = jest.fn();
  const where = jest.fn(() => ({ returning }));
  const set = jest.fn(() => ({ where }));
  const update = jest.fn(() => ({ set }));

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: DbService,
          useValue: {
            connection: {
              update,
            },
          },
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('reschedules an appointment', async () => {
    const updatedAppointment = {
      appointmentId: 12,
      doctorId: 2,
      patientId: 3,
      timeslot: '2026-06-01T09:00:00.000Z',
      day: 1,
    };

    returning.mockResolvedValue([updatedAppointment]);

    await expect(
      service.reschedule(12, {
        timeslot: '2026-06-01T09:00:00.000Z',
        dayOfWeek: 1,
      }),
    ).resolves.toEqual(updatedAppointment);

    expect(update).toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith({
      timeslot: '2026-06-01T09:00:00.000Z',
      day: 1,
    });
  });
});
