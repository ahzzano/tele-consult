import { Test, TestingModule } from '@nestjs/testing';
import { AccountService } from './account.service';
import { DbService } from '../db/db.service';

describe('AccountService', () => {
  let service: AccountService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: DbService,
          useValue: {
            connection: {},
          },
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
