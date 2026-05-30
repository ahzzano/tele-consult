import { Test, TestingModule } from '@nestjs/testing';
import { RecordsService } from './records.service';
import { DbService } from '../db/db.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('RecordsService', () => {
  let service: RecordsService;
  let dbService: { connection: any };

  beforeEach(async () => {
    dbService = {
      connection: {
        select: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordsService,
        {
          provide: DbService,
          useValue: dbService,
        },
        {
          provide: NotificationsService,
          useValue: {
            notify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecordsService>(RecordsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should allow a doctor-scoped patient records query', async () => {
    const records = [
      {
        id: 3,
        appointmentId: 1,
        patient: 1,
        doctor: 2,
        diagnosis: 'Migraine',
        summary: 'Recurring headaches',
      },
    ];
    const where = jest.fn().mockResolvedValue(records);

    dbService.connection.select.mockReturnValue({
      from: jest.fn().mockReturnValue({ where }),
    });

    await expect(service.findAll({ doctor: 2, patient: 1 }, 2)).resolves.toEqual(
      records,
    );
    expect(where).toHaveBeenCalled();
  });

  it('should reject patient records queries that are not scoped to the actor', async () => {
    await expect(service.findAll({ patient: 1 }, 2)).rejects.toThrow(
      'You can only view your own records',
    );
  });
});
