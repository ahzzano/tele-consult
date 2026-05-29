CREATE TABLE "medicalRecord" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient" integer NOT NULL,
	"doctor" integer NOT NULL,
	"diagnosis" text,
	"summary" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prescription" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient" integer NOT NULL,
	"doctor" integer NOT NULL,
	"record" integer NOT NULL,
	"medicine" text NOT NULL,
	"dosage" real NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "day_of_week" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "medicalRecord" ADD CONSTRAINT "medicalRecord_patient_patient_acct_id_fk" FOREIGN KEY ("patient") REFERENCES "public"."patient"("acct_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicalRecord" ADD CONSTRAINT "medicalRecord_doctor_doctor_acct_id_fk" FOREIGN KEY ("doctor") REFERENCES "public"."doctor"("acct_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription" ADD CONSTRAINT "prescription_patient_patient_acct_id_fk" FOREIGN KEY ("patient") REFERENCES "public"."patient"("acct_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription" ADD CONSTRAINT "prescription_doctor_doctor_acct_id_fk" FOREIGN KEY ("doctor") REFERENCES "public"."doctor"("acct_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription" ADD CONSTRAINT "prescription_record_medicalRecord_id_fk" FOREIGN KEY ("record") REFERENCES "public"."medicalRecord"("id") ON DELETE no action ON UPDATE no action;