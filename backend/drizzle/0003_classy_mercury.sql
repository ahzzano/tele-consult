CREATE TABLE "appointmentHour" (
	"acct_id" integer PRIMARY KEY NOT NULL,
	"start" timestamp NOT NULL,
	"end" timestamp NOT NULL,
	"day_of_week" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointmentHour" ADD CONSTRAINT "appointmentHour_acct_id_account_id_fk" FOREIGN KEY ("acct_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;