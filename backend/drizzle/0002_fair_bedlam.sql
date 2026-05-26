ALTER TABLE "doctor" DROP CONSTRAINT "doctor_acct_id_account_id_fk";
--> statement-breakpoint
ALTER TABLE "patient" DROP CONSTRAINT "patient_acct_id_account_id_fk";
--> statement-breakpoint
ALTER TABLE "doctor" ADD CONSTRAINT "doctor_acct_id_account_id_fk" FOREIGN KEY ("acct_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_acct_id_account_id_fk" FOREIGN KEY ("acct_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;