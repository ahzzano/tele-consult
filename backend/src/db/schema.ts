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
    user: integer("acct_id").primaryKey().references(() => account.id),
    bio: text("bio"),
    specialization: text("specialization"),
    profilePicture: text("profile_picture"),
})

export const patient = pgTable('patient', {
    acctId: integer("acct_id").primaryKey().references(() => account.id),
    birthday: date("birthday"),
    weight: numeric("weight"),       // in kg
    height: numeric("height"),       // in cm
    contactDetails: text("contact_details"),
    medicalHistory: text("medical_history"),
    profilePicture: text("profile_picture"),
})
