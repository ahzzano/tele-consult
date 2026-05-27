ALTER TABLE "appointmentHour" RENAME TO "appointmentBlock";--> statement-breakpoint
ALTER TABLE "appointmentBlock" DROP CONSTRAINT "appointmentHour_acct_id_account_id_fk";
--> statement-breakpoint
ALTER TABLE "appointmentBlock" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "appointmentBlock" ADD CONSTRAINT "appointmentBlock_acct_id_account_id_fk" FOREIGN KEY ("acct_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;