import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  const appointmentsService = {
    reschedule: jest.fn(),
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
    }).compile();

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

    controller.reschedule('12', dto);

    expect(appointmentsService.reschedule).toHaveBeenCalledWith(12, dto);
  });
});
