import { relations } from "drizzle-orm/relations";
import { account, doctor, patient } from "./schema";

export const doctorRelations = relations(doctor, ({one}) => ({
	account: one(account, {
		fields: [doctor.acctId],
		references: [account.id]
	}),
}));

export const accountRelations = relations(account, ({many}) => ({
	doctors: many(doctor),
	patients: many(patient),
}));

export const patientRelations = relations(patient, ({one}) => ({
	account: one(account, {
		fields: [patient.acctId],
		references: [account.id]
	}),
}));