import { Test, TestingModule } from '@nestjs/testing';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';

describe('PrescriptionsController', () => {
  let controller: PrescriptionsController;
  const prescriptionsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrescriptionsController],
      providers: [
        {
          provide: PrescriptionsService,
          useValue: prescriptionsService,
        },
      ],
    }).compile();

    controller = module.get<PrescriptionsController>(PrescriptionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
