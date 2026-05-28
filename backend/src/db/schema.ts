import { pgTable, serial, text, timestamp, integer, date, numeric } from "drizzle-orm/pg-core";

export const account = pgTable('account', {
    id: serial('id').primaryKey(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    createdAt: timestamp('created_at').defaultNow()
})

export const doctor = pgTable('doctor', {
    acctId: integer("acct_id").primaryKey().references(() => account.id, { onDelete: "cascade" }),
    bio: text("bio"),
    specialization: text("specialization"),
    profilePicture: text("profile_picture"),
})

export const patient = pgTable('patient', {
    acctId: integer("acct_id").primaryKey().references(() => account.id, { onDelete: "cascade" }),
    birthday: date("birthday"),
    weight: numeric("weight"),       // in kg
    height: numeric("height"),       // in cm
    contactDetails: text("contact_details"),
    medicalHistory: text("medical_history"),
    profilePicture: text("profile_picture"),
})

export const appointmentBlock = pgTable("appointmentBlock", {
    blockId: serial().primaryKey(),
	doctorId: integer("doctor_id").notNull(),
	start: timestamp({ mode: 'string' }).notNull(),
	end: timestamp({ mode: 'string' }).notNull(),
	dayOfWeek: integer("day_of_week").notNull(),
});

export const appointment = pgTable("appointment", {
    appointmentId: serial().primaryKey(),
    doctorId: integer('doctor_id').notNull(),
    patientId: integer('patient_id').notNull(),
    timeslot: timestamp({ mode: 'string'}).notNull(),
    day: integer('day_of_week').notNull()
})

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;

export type Doctor = typeof doctor.$inferSelect;
export type NewDoctor = typeof doctor.$inferInsert;

export type Patient = typeof patient.$inferSelect;
export type NewPatient = typeof patient.$inferInsert;
