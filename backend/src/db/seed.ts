import 'dotenv/config';
import bcrypt from 'bcrypt';
import { Client } from 'pg';

const PASSWORD = 'Password123!';
const SALT_ROUNDS = 12;

type DoctorSeed = {
  email: string;
  firstName: string;
  lastName: string;
  specialization: string;
  bio: string;
  profilePicture: string;
};

type PatientSeed = {
  email: string;
  firstName: string;
  lastName: string;
  birthday: string;
  weight: string;
  height: string;
  contactDetails: string;
  medicalHistory: string;
  profilePicture: string;
};

const doctors: DoctorSeed[] = [
  {
    email: 'dr.rafael.cruz@example.com',
    firstName: 'Rafael',
    lastName: 'Cruz',
    specialization: 'Cardiology',
    bio: 'Cardiologist focused on hypertension, chest pain triage, and preventive heart care.',
    profilePicture: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d',
  },
  {
    email: 'dr.amara.lim@example.com',
    firstName: 'Amara',
    lastName: 'Lim',
    specialization: 'Dermatology',
    bio: 'Dermatologist treating acne, rashes, eczema, and everyday skin concerns.',
    profilePicture: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2',
  },
  {
    email: 'dr.tala.garcia@example.com',
    firstName: 'Tala',
    lastName: 'Garcia',
    specialization: 'General Medicine',
    bio: 'General practitioner for same-day virtual consultations and follow-up care.',
    profilePicture: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f',
  },
  {
    email: 'dr.mateo.reyes@example.com',
    firstName: 'Mateo',
    lastName: 'Reyes',
    specialization: 'Pediatrics',
    bio: 'Pediatrician supporting child fever, nutrition, respiratory symptoms, and parent guidance.',
    profilePicture: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54',
  },
  {
    email: 'dr.sofia.navarro@example.com',
    firstName: 'Sofia',
    lastName: 'Navarro',
    specialization: 'Psychiatry',
    bio: 'Psychiatrist helping patients with anxiety, stress, sleep concerns, and care planning.',
    profilePicture: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f',
  },
];

const patients: PatientSeed[] = [
  {
    email: 'mina.santos@example.com',
    firstName: 'Mina',
    lastName: 'Santos',
    birthday: '1992-04-18',
    weight: '62',
    height: '164',
    contactDetails: '+63 917 555 0188',
    medicalHistory: 'Mild asthma. No known drug allergies.',
    profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  },
  {
    email: 'leo.reyes@example.com',
    firstName: 'Leo',
    lastName: 'Reyes',
    birthday: '1988-07-12',
    weight: '78',
    height: '173',
    contactDetails: '+63 917 555 0101',
    medicalHistory: 'Seasonal allergies and borderline hypertension.',
    profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
  },
  {
    email: 'ana.delacruz@example.com',
    firstName: 'Ana',
    lastName: 'Dela Cruz',
    birthday: '1997-11-03',
    weight: '54',
    height: '158',
    contactDetails: '+63 917 555 0122',
    medicalHistory: 'Migraine episodes twice per month.',
    profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
  },
  {
    email: 'niko.ramos@example.com',
    firstName: 'Niko',
    lastName: 'Ramos',
    birthday: '2018-02-22',
    weight: '24',
    height: '121',
    contactDetails: '+63 917 555 0144',
    medicalHistory: 'Childhood eczema and recurrent cough.',
    profilePicture: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9',
  },
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to seed mock data.');
  }

  const password = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query('BEGIN');

    const doctorIds = new Map<string, number>();
    const patientIds = new Map<string, number>();

    for (const doctor of doctors) {
      const id = await upsertAccount(client, {
        email: doctor.email,
        password,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
      });

      await client.query(
        `
          INSERT INTO doctor (acct_id, bio, specialization, profile_picture)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (acct_id) DO UPDATE SET
            bio = EXCLUDED.bio,
            specialization = EXCLUDED.specialization,
            profile_picture = EXCLUDED.profile_picture
        `,
        [id, doctor.bio, doctor.specialization, doctor.profilePicture],
      );

      doctorIds.set(doctor.email, id);
    }

    for (const patient of patients) {
      const id = await upsertAccount(client, {
        email: patient.email,
        password,
        firstName: patient.firstName,
        lastName: patient.lastName,
      });

      await client.query(
        `
          INSERT INTO patient (
            acct_id,
            birthday,
            weight,
            height,
            contact_details,
            medical_history,
            profile_picture
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (acct_id) DO UPDATE SET
            birthday = EXCLUDED.birthday,
            weight = EXCLUDED.weight,
            height = EXCLUDED.height,
            contact_details = EXCLUDED.contact_details,
            medical_history = EXCLUDED.medical_history,
            profile_picture = EXCLUDED.profile_picture
        `,
        [
          id,
          patient.birthday,
          patient.weight,
          patient.height,
          patient.contactDetails,
          patient.medicalHistory,
          patient.profilePicture,
        ],
      );

      patientIds.set(patient.email, id);
    }

    await seedAvailability(client, [...doctorIds.values()]);
    await seedClinicalHistory(client, doctorIds, patientIds);

    await client.query('COMMIT');

    console.log(`Seeded ${doctors.length} doctors and ${patients.length} patients.`);
    console.log(`Demo password for all mock users: ${PASSWORD}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

async function upsertAccount(
  client: Client,
  account: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  },
) {
  const { rows } = await client.query<{ id: number }>(
    `
      INSERT INTO account (email, password, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name
      RETURNING id
    `,
    [account.email, account.password, account.firstName, account.lastName],
  );

  return rows[0].id;
}

async function seedAvailability(client: Client, doctorIds: number[]) {
  for (const doctorId of doctorIds) {
    await client.query('DELETE FROM "appointmentBlock" WHERE doctor_id = $1', [
      doctorId,
    ]);

    await client.query(
      `
        INSERT INTO "appointmentBlock" (doctor_id, start, "end", day_of_week)
        VALUES
          ($1, '2026-06-01 09:00:00', '2026-06-01 12:00:00', 1),
          ($1, '2026-06-03 13:00:00', '2026-06-03 17:00:00', 3),
          ($1, '2026-06-05 09:00:00', '2026-06-05 15:00:00', 5)
      `,
      [doctorId],
    );
  }
}

async function seedClinicalHistory(
  client: Client,
  doctorIds: Map<string, number>,
  patientIds: Map<string, number>,
) {
  const cardiologistId = doctorIds.get('dr.rafael.cruz@example.com');
  const patientId = patientIds.get('leo.reyes@example.com');

  if (!cardiologistId || !patientId) {
    return;
  }

  await client.query(
    `
      DELETE FROM prescription
      WHERE doctor = $1 AND patient = $2
    `,
    [cardiologistId, patientId],
  );
  await client.query(
    `
      DELETE FROM "medicalRecord"
      WHERE doctor = $1 AND patient = $2
    `,
    [cardiologistId, patientId],
  );
  await client.query(
    `
      DELETE FROM appointment
      WHERE doctor_id = $1 AND patient_id = $2
    `,
    [cardiologistId, patientId],
  );

  const appointment = await client.query<{ appointmentId: number }>(
    `
      INSERT INTO appointment (doctor_id, patient_id, timeslot, day_of_week)
      VALUES ($1, $2, '2026-06-01 09:00:00', 1)
      RETURNING "appointmentId"
    `,
    [cardiologistId, patientId],
  );

  const record = await client.query<{ id: number }>(
    `
      INSERT INTO "medicalRecord" (
        appointment_id,
        patient,
        doctor,
        diagnosis,
        summary,
        "followUpInstructions"
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `,
    [
      appointment.rows[0].appointmentId,
      patientId,
      cardiologistId,
      'Borderline hypertension',
      'Patient reports occasional chest tightness during stressful workdays.',
      'Monitor blood pressure twice daily and schedule a follow-up in one week.',
    ],
  );

  await client.query(
    `
      INSERT INTO prescription (patient, doctor, record, medicine, dosage)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [patientId, cardiologistId, record.rows[0].id, 'Amlodipine', 5],
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
