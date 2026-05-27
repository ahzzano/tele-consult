ALTER TABLE "appointmentBlock" DROP CONSTRAINT "appointmentBlock_pkey";--> statement-breakpoint
ALTER TABLE "appointmentBlock" ADD COLUMN "blockId" serial PRIMARY KEY NOT NULL;
