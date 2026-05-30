import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { DbService } from '../db/db.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  const returning = jest.fn();
  const where = jest.fn(() => ({ returning }));
  const set = jest.fn(() => ({ where }));
  const update = jest.fn(() => ({ set }));
  const select = jest.fn();

  function selectWithLimit(result: unknown[]) {
    return {
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue(result),
        })),
      })),
    };
  }

  function selectWithWhere(result: unknown[]) {
    return {
      from: jest.fn(() => ({
        where: jest.fn().mockResolvedValue(result),
      })),
    };
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: DbService,
          useValue: {
            connection: {
              select,
              update,
            },
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            notify: jest.fn(),
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
      timeslot: '2026-06-01T01:00:00.000Z',
      day: 1,
    };

    returning.mockResolvedValue([updatedAppointment]);
    select
      .mockReturnValueOnce(selectWithLimit([updatedAppointment]))
      .mockReturnValueOnce(selectWithLimit([{ acctId: 2 }]))
      .mockReturnValueOnce(selectWithLimit([{ acctId: 3 }]))
      .mockReturnValueOnce(
        selectWithWhere([
          {
            doctorId: 2,
            dayOfWeek: 1,
            start: '2000-01-03T00:00:00.000Z',
            end: '2000-01-03T04:00:00.000Z',
          },
        ]),
      )
      .mockReturnValueOnce(selectWithWhere([]));

    await expect(
      service.reschedule(12, {
        timeslot: '2026-06-01T01:00:00.000Z',
        dayOfWeek: 1,
      }),
    ).resolves.toEqual(updatedAppointment);

    expect(update).toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith({
      timeslot: '2026-06-01T01:00:00.000Z',
      day: 1,
    });
  });
});
