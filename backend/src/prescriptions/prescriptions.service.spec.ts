import { Test, TestingModule } from '@nestjs/testing';
import { PrescriptionsService } from './prescriptions.service';
import { DbService } from 'src/db/db.service';
import { NotificationsService } from 'src/notifications/notifications.service';

describe('PrescriptionsService', () => {
  let service: PrescriptionsService;
  let dbService: { connection: any };

  const createSelectMock = (result: unknown[]) => ({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(result),
      }),
    }),
  });

  beforeEach(async () => {
    dbService = {
      connection: {
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrescriptionsService,
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

    service = module.get<PrescriptionsService>(PrescriptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a prescription when references exist', async () => {
    const createPrescriptionDto = {
      patient: 1,
      doctor: 2,
      record: 3,
      medicine: 'Amoxicillin',
      dosage: 500,
    };
    const createdPrescription = { id: 4, ...createPrescriptionDto };

    dbService.connection.select
      .mockReturnValueOnce(createSelectMock([{ acctId: 2 }]))
      .mockReturnValueOnce(createSelectMock([{ acctId: 1 }]))
      .mockReturnValueOnce(createSelectMock([{ id: 3, patient: 1, doctor: 2 }]));
    dbService.connection.insert.mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([createdPrescription]),
      }),
    });

    await expect(service.create(createPrescriptionDto)).resolves.toEqual(
      createdPrescription,
    );
  });

  it('should update a prescription when references remain valid', async () => {
    const existingPrescription = {
      id: 4,
      patient: 1,
      doctor: 2,
      record: 3,
      medicine: 'Amoxicillin',
      dosage: 500,
    };
    const updatedPrescription = {
      ...existingPrescription,
      medicine: 'Ibuprofen',
    };

    dbService.connection.select
      .mockReturnValueOnce(createSelectMock([existingPrescription]))
      .mockReturnValueOnce(createSelectMock([{ acctId: 2 }]))
      .mockReturnValueOnce(createSelectMock([{ acctId: 1 }]))
      .mockReturnValueOnce(createSelectMock([{ id: 3, patient: 1, doctor: 2 }]));
    dbService.connection.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([updatedPrescription]),
        }),
      }),
    });

    await expect(service.update(4, { medicine: 'Ibuprofen' })).resolves.toEqual(
      updatedPrescription,
    );
  });

  it('should delete a prescription', async () => {
    const deletedPrescription = {
      id: 4,
      patient: 1,
      doctor: 2,
      record: 3,
      medicine: 'Amoxicillin',
      dosage: 500,
    };

    dbService.connection.select.mockReturnValueOnce(
      createSelectMock([deletedPrescription]),
    );
    dbService.connection.delete.mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([deletedPrescription]),
      }),
    });

    await expect(service.remove(4)).resolves.toEqual(deletedPrescription);
  });
});
