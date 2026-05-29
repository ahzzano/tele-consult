import { Test, TestingModule } from '@nestjs/testing';
import { DoctorService } from './doctor.service';
import { DbService } from 'src/db/db.service';
import { NotificationsService } from 'src/notifications/notifications.service';

describe('DoctorService', () => {
  let service: DoctorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorService,
        {
          provide: DbService,
          useValue: {
            connection: {},
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

    service = module.get<DoctorService>(DoctorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
