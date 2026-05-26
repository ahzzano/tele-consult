ALTER TABLE "user" RENAME TO "account";--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT "user_email_unique";--> statement-breakpoint
ALTER TABLE "doctor" DROP CONSTRAINT "doctor_acct_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "patient" DROP CONSTRAINT "patient_acct_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "doctor" ADD CONSTRAINT "doctor_acct_id_account_id_fk" FOREIGN KEY ("acct_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_acct_id_account_id_fk" FOREIGN KEY ("acct_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_email_unique" UNIQUE("email");