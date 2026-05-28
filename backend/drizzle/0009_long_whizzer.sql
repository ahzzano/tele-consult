CREATE TABLE "appointment" (
	"appointmentId" serial PRIMARY KEY NOT NULL,
	"doctor_id" integer NOT NULL,
	"patient_id" integer NOT NULL,
	"timeslot" timestamp NOT NULL
);
