import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AuthGuard } from 'src/auth/auth.guard';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  const appointmentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findBookedSlots: jest.fn(),
    update: jest.fn(),
    reschedule: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        {
          provide: AppointmentsService,
          useValue: appointmentsService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('reschedules an appointment by id', () => {
    const dto = {
      timeslot: '2026-06-01T09:00:00.000Z',
      dayOfWeek: 1,
    };

    controller.reschedule('12', dto, { id: 3, email: 'user@example.com' });

    expect(appointmentsService.reschedule).toHaveBeenCalledWith(12, dto, 3);
  });
});
