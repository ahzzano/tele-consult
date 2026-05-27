ALTER TABLE "appointmentBlock" RENAME COLUMN "acct_id" TO "doctor_id";--> statement-breakpoint
ALTER TABLE "appointmentBlock" DROP CONSTRAINT "appointmentBlock_acct_id_account_id_fk";
--> statement-breakpoint
ALTER TABLE "appointmentBlock" ADD CONSTRAINT "appointmentBlock_doctor_id_account_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;