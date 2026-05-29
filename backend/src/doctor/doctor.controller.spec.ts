import { Test, TestingModule } from '@nestjs/testing';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { AuthGuard } from 'src/auth/auth.guard';

describe('DoctorController', () => {
  let controller: DoctorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoctorController],
      providers: [
        {
          provide: DoctorService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            recommend: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            findAppointmentBlocks: jest.fn(),
            updateAppointmentBlocks: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DoctorController>(DoctorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
