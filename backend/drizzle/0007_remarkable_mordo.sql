ALTER TABLE "appointmentBlock" DROP CONSTRAINT "appointmentBlock_doctor_id_account_id_fk";
--> statement-breakpoint
ALTER TABLE "appointmentBlock" ADD PRIMARY KEY ("doctor_id");--> statement-breakpoint
ALTER TABLE "appointmentBlock" ALTER COLUMN "doctor_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "appointmentBlock" DROP COLUMN "id";