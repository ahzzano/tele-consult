CREATE TABLE "doctor" (
	"acct_id" integer PRIMARY KEY NOT NULL,
	"bio" text,
	"specialization" text,
	"profile_picture" text
);
--> statement-breakpoint
CREATE TABLE "patient" (
	"acct_id" integer PRIMARY KEY NOT NULL,
	"birthday" date,
	"weight" numeric,
	"height" numeric,
	"contact_details" text,
	"medical_history" text,
	"profile_picture" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "doctor" ADD CONSTRAINT "doctor_acct_id_user_id_fk" FOREIGN KEY ("acct_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_acct_id_user_id_fk" FOREIGN KEY ("acct_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;