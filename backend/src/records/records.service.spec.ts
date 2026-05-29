import { Test, TestingModule } from '@nestjs/testing';
import { RecordsService } from './records.service';
import { DbService } from 'src/db/db.service';
import { NotificationsService } from 'src/notifications/notifications.service';

describe('RecordsService', () => {
  let service: RecordsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordsService,
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

    service = module.get<RecordsService>(RecordsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
