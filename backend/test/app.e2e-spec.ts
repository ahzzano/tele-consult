import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { Client } from 'pg';
import { firstValueFrom, timeout } from 'rxjs';
import { AppModule } from './../src/app.module';
import { NotificationsService } from './../src/notifications/notifications.service';

const PASSWORD = 'Password123!';
const TEST_EMAIL_DOMAIN = 'tele.test';

type AuthenticatedAccount = {
  id: number;
  email: string;
  token: string;
};

describe('Telehealth requirements (e2e)', () => {
  let app: INestApplication<App>;
  let notificationsService: NotificationsService;
  let databaseAvailable = false;

  beforeAll(async () => {
    await cleanE2eData();
    databaseAvailable = true;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    notificationsService = app.get(NotificationsService);
  });

  afterAll(async () => {
    await app?.close();
    if (databaseAvailable) {
      await cleanE2eData();
    }
  });

  it('covers patient registration, profile, doctor discovery, AI recommendation, booking, consultation, records, and prescriptions', async () => {
    const patient = await registerAndLogin({
      role: 'Patient',
      email: `e2e+patient@${TEST_EMAIL_DOMAIN}`,
      firstName: 'Mina',
      lastName: 'Santos',
      birthday: '1992-04-18',
      weight: '62',
      height: '164',
      contactDetails: '+63 917 555 0188',
      medicalHistory: 'Mild asthma, no known drug allergies.',
      profilePicture: 'https://example.com/patients/mina.png',
    });

    const doctor = await registerAndLogin({
      role: 'Doctor',
      email: `e2e+doctor@${TEST_EMAIL_DOMAIN}`,
      firstName: 'Rafael',
      lastName: 'Cruz',
      bio: 'Board-certified cardiologist focused on hypertension and chest pain triage.',
      specialization: 'Cardiology',
      profilePicture: 'https://example.com/doctors/rafael.png',
    });

    await request(app.getHttpServer())
      .get(`/account/${patient.email}`)
      .set(auth(patient.token))
      .expect(200)
      .expect(({ body }) => {
        expect(body.password).toBeUndefined();
        expect(body.role).toBe('Patient');
        expect(body.patientProfile.contactDetails).toBe('+63 917 555 0188');
        expect(body.patientProfile.medicalHistory).toContain('asthma');
      });

    await request(app.getHttpServer())
      .patch(`/account/${doctor.id}`)
      .set(auth(doctor.token))
      .send({
        role: 'Doctor',
        firstName: 'Rafael',
        lastName: 'Cruz',
        bio: 'Cardiologist for chest pain, hypertension, and preventive heart care.',
        specialization: 'Cardiology',
        profilePicture: 'https://example.com/doctors/rafael-updated.png',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.doctorProfile.specialization).toBe('Cardiology');
        expect(body.doctorProfile.bio).toContain('preventive heart care');
      });

    const mondayAtNine = nextWeekdayAt(1, 9, 0);
    const mondayAtNoon = nextWeekdayAt(1, 12, 0);
    const mondayAtFive = nextWeekdayAt(1, 17, 0);
    const mondayAtTwo = nextWeekdayAt(1, 14, 0);

    await request(app.getHttpServer())
      .put(`/doctor/${doctor.id}/appointment-blocks`)
      .set(auth(doctor.token))
      .send({
        appointmentBlocks: [
          {
            dayOfWeek: mondayAtNine.getDay(),
            start: localTimestamp(mondayAtNine),
            end: localTimestamp(mondayAtFive),
          },
        ],
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0].doctorId).toBe(doctor.id);
        expect(body[0].dayOfWeek).toBe(1);
      });

    await request(app.getHttpServer())
      .get('/doctor')
      .query({ name: 'rafael', specialization: 'Cardiology' })
      .set(auth(patient.token))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: doctor.id,
              firstName: 'Rafael',
              specialization: 'Cardiology',
            }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .get('/doctor/recommendations')
      .query({ symptoms: 'I have chest pressure and high blood pressure.' })
      .set(auth(patient.token))
      .expect(200)
      .expect(({ body }) => {
        expect(body.specialization).toBe('Cardiology');
        expect(body.reason).toContain('Cardiology');
        expect(body.doctors).toEqual(
          expect.arrayContaining([expect.objectContaining({ id: doctor.id })]),
        );
      });

    await request(app.getHttpServer())
      .post('/appointments')
      .set(auth(patient.token))
      .send({
        doctorId: doctor.id,
        patientId: doctor.id,
        timeslot: localTimestamp(mondayAtNine),
        dayOfWeek: mondayAtNine.getDay(),
      })
      .expect(403);

    const doctorBookingNotification = firstValueFrom(
      notificationsService.streamFor(doctor.id).pipe(timeout(1000)),
    );
    const patientBookingNotification = firstValueFrom(
      notificationsService.streamFor(patient.id).pipe(timeout(1000)),
    );

    const appointment = await request(app.getHttpServer())
      .post('/appointments')
      .set(auth(patient.token))
      .send({
        doctorId: doctor.id,
        patientId: patient.id,
        timeslot: localTimestamp(mondayAtNine),
        dayOfWeek: mondayAtNine.getDay(),
      })
      .expect(201)
      .then(({ body }) => body);

    await expect(doctorBookingNotification).resolves.toEqual(
      expect.objectContaining({
        recipientId: doctor.id,
        title: 'New appointment booked',
      }),
    );
    await expect(patientBookingNotification).resolves.toEqual(
      expect.objectContaining({
        recipientId: patient.id,
        title: 'Appointment confirmed',
      }),
    );

    await request(app.getHttpServer())
      .post('/appointments')
      .set(auth(patient.token))
      .send({
        doctorId: doctor.id,
        patientId: patient.id,
        timeslot: localTimestamp(mondayAtNine),
        dayOfWeek: mondayAtNine.getDay(),
      })
      .expect(409);

    await request(app.getHttpServer())
      .get(`/appointments/doctor/${doctor.id}/booked-slots`)
      .set(auth(patient.token))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              appointmentId: appointment.appointmentId,
              day: mondayAtNine.getDay(),
            }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .patch(`/appointments/${appointment.appointmentId}/reschedule`)
      .set(auth(patient.token))
      .send({
        timeslot: localTimestamp(mondayAtNoon),
        dayOfWeek: mondayAtNoon.getDay(),
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.timeslot).toContain(localDate(mondayAtNoon));
      });

    const patientAppointments = await request(app.getHttpServer())
      .get('/appointments')
      .query({ patient: patient.id })
      .set(auth(patient.token))
      .expect(200)
      .then(({ body }) => body);

    expect(patientAppointments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          appointmentId: appointment.appointmentId,
          doctorId: doctor.id,
          patientId: patient.id,
          sessionUrl: `https://meet.jit.si/tele-consult-${appointment.appointmentId}`,
        }),
      ]),
    );

    await request(app.getHttpServer())
      .get('/appointments')
      .query({ doctor: doctor.id })
      .set(auth(doctor.token))
      .expect(200)
      .expect(({ body }) => {
        expect(body[0].patientFirstName).toBe('Mina');
        expect(body[0].sessionUrl).toContain('https://meet.jit.si/');
      });

    const record = await request(app.getHttpServer())
      .post('/records')
      .set(auth(doctor.token))
      .send({
        appointmentId: appointment.appointmentId,
        patient: patient.id,
        doctor: doctor.id,
        diagnosis: 'Elevated blood pressure under review',
        summary: 'Patient reported intermittent chest pressure without acute distress.',
        followUpInstructions: 'Track blood pressure twice daily and return in one week.',
      })
      .expect(201)
      .then(({ body }) => body);

    await request(app.getHttpServer())
      .post('/prescriptions')
      .set(auth(doctor.token))
      .send({
        patient: patient.id,
        doctor: doctor.id,
        record: record.id,
        medicine: 'Amlodipine',
        dosage: 5,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.medicine).toBe('Amlodipine');
        expect(body.record).toBe(record.id);
      });

    await request(app.getHttpServer())
      .get('/records')
      .query({ patient: patient.id })
      .set(auth(patient.token))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: record.id,
              diagnosis: 'Elevated blood pressure under review',
            }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .get('/prescriptions')
      .query({ patient: patient.id })
      .set(auth(patient.token))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              medicine: 'Amlodipine',
              dosage: 5,
            }),
          ]),
        );
      });

    const secondAppointment = await request(app.getHttpServer())
      .post('/appointments')
      .set(auth(patient.token))
      .send({
        doctorId: doctor.id,
        patientId: patient.id,
        timeslot: localTimestamp(mondayAtTwo),
        dayOfWeek: mondayAtTwo.getDay(),
      })
      .expect(201)
      .then(({ body }) => body);

    await request(app.getHttpServer())
      .delete(`/appointments/${secondAppointment.appointmentId}`)
      .set(auth(patient.token))
      .expect(200)
      .expect(({ body }) => {
        expect(body.appointmentId).toBe(secondAppointment.appointmentId);
      });
  });

  it('hydrates upcoming appointment reminders within 24 hours', async () => {
    const patient = await registerAndLogin({
      role: 'Patient',
      email: `e2e+reminder-patient@${TEST_EMAIL_DOMAIN}`,
      firstName: 'Leo',
      lastName: 'Reyes',
      birthday: '1988-07-12',
      weight: '78',
      height: '173',
      contactDetails: '+63 917 555 0101',
      medicalHistory: 'Seasonal allergies.',
    });

    const doctor = await registerAndLogin({
      role: 'Doctor',
      email: `e2e+reminder-doctor@${TEST_EMAIL_DOMAIN}`,
      firstName: 'Tala',
      lastName: 'Garcia',
      bio: 'General practitioner for same-day virtual consults.',
      specialization: 'General Medicine',
    });

    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const availabilityStart = new Date(twoHoursFromNow);
    availabilityStart.setHours(0, 0, 0, 0);
    const availabilityEnd = new Date(twoHoursFromNow);
    availabilityEnd.setHours(23, 59, 0, 0);

    await request(app.getHttpServer())
      .put(`/doctor/${doctor.id}/appointment-blocks`)
      .set(auth(doctor.token))
      .send({
        appointmentBlocks: [
          {
            dayOfWeek: twoHoursFromNow.getDay(),
            start: localTimestamp(availabilityStart),
            end: localTimestamp(availabilityEnd),
          },
        ],
      })
      .expect(200);

    const appointment = await request(app.getHttpServer())
      .post('/appointments')
      .set(auth(patient.token))
      .send({
        doctorId: doctor.id,
        patientId: patient.id,
        timeslot: localTimestamp(twoHoursFromNow),
        dayOfWeek: twoHoursFromNow.getDay(),
      })
      .expect(201)
      .then(({ body }) => body);

    await request(app.getHttpServer())
      .get('/appointments/upcoming-reminders')
      .set(auth(patient.token))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: `upcoming-${appointment.appointmentId}`,
              title: 'Upcoming appointment',
            }),
          ]),
        );
      });
  });

  async function registerAndLogin(payload: Record<string, unknown>) {
    const registered = await request(app.getHttpServer())
      .post('/account')
      .send({
        ...payload,
        password: PASSWORD,
      })
      .expect(201)
      .then(({ body }) => body as AuthenticatedAccount);

    const { access_token: token } = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: payload.email,
        password: PASSWORD,
      })
      .expect(200)
      .then(({ body }) => body);

    return {
      ...registered,
      token,
    };
  }
});

function auth(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function nextWeekdayAt(dayOfWeek: number, hours: number, minutes: number) {
  const date = new Date();
  const daysUntilNext = ((dayOfWeek - date.getDay() + 7) % 7) || 7;

  date.setDate(date.getDate() + daysUntilNext);
  date.setHours(hours, minutes, 0, 0);

  return date;
}

function localTimestamp(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, '0');

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join('T');
}

function localDate(date: Date) {
  return localTimestamp(date).slice(0, 10);
}

async function cleanE2eData() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return;
  }

  const client = new Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 1000,
  });

  try {
    await client.connect();
  } catch (error) {
    throw new Error(`Unable to connect to test database at ${databaseUrl}`, {
      cause: error,
    });
  }

  try {
    await client.query('BEGIN');
    await client.query(`
      WITH e2e_accounts AS (
        SELECT id FROM account WHERE email LIKE $1
      )
      DELETE FROM prescription
      WHERE patient IN (SELECT id FROM e2e_accounts)
        OR doctor IN (SELECT id FROM e2e_accounts)
        OR record IN (
          SELECT id FROM "medicalRecord"
          WHERE patient IN (SELECT id FROM e2e_accounts)
             OR doctor IN (SELECT id FROM e2e_accounts)
        )
    `, [`e2e+%@${TEST_EMAIL_DOMAIN}`]);
    await client.query(`
      WITH e2e_accounts AS (
        SELECT id FROM account WHERE email LIKE $1
      )
      DELETE FROM "medicalRecord"
      WHERE patient IN (SELECT id FROM e2e_accounts)
         OR doctor IN (SELECT id FROM e2e_accounts)
    `, [`e2e+%@${TEST_EMAIL_DOMAIN}`]);
    await client.query(`
      WITH e2e_accounts AS (
        SELECT id FROM account WHERE email LIKE $1
      )
      DELETE FROM appointment
      WHERE patient_id IN (SELECT id FROM e2e_accounts)
         OR doctor_id IN (SELECT id FROM e2e_accounts)
    `, [`e2e+%@${TEST_EMAIL_DOMAIN}`]);
    await client.query(`
      WITH e2e_accounts AS (
        SELECT id FROM account WHERE email LIKE $1
      )
      DELETE FROM "appointmentBlock"
      WHERE doctor_id IN (SELECT id FROM e2e_accounts)
    `, [`e2e+%@${TEST_EMAIL_DOMAIN}`]);
    await client.query('DELETE FROM account WHERE email LIKE $1', [
      `e2e+%@${TEST_EMAIL_DOMAIN}`,
    ]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}
