import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  ClipboardList,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

const careSteps = [
  {
    title: "Match",
    description: "Describe symptoms and surface relevant doctors by specialty.",
    icon: Sparkles,
  },
  {
    title: "Book",
    description: "Pick from real availability and keep schedules easy to adjust.",
    icon: CalendarCheck,
  },
  {
    title: "Consult",
    description: "Join the online session, then keep notes and prescriptions nearby.",
    icon: Video,
  },
];

const platformSignals = [
  "Patient and doctor modules",
  "Appointment notifications",
  "Medical records and prescriptions",
  "Schedule restrictions",
];

function ProductScene() {
  return (
    <div className="pointer-events-none mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-xl border bg-muted/30 p-4 shadow-2xl sm:p-6">
        <div className="mx-auto grid max-w-5xl gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-2xl font-semibold tracking-normal">Dashboard</div>
              <div className="text-sm text-muted-foreground">Viewing as patient.</div>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex h-8 items-center justify-center rounded-lg border bg-background px-3 text-sm font-medium">
                Profile
              </span>
              <span className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border bg-background px-3 text-sm font-medium">
                <span className="size-3 rounded-sm border border-muted-foreground" />
                Sign out
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-card py-3 text-card-foreground ring-1 ring-foreground/10">
            <div className="px-3">
              <div className="flex items-center gap-2 font-heading text-sm font-medium">
                <BellRing className="size-4 text-emerald-700" />
                Notifications
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Live appointment and record updates.
              </div>
            </div>
            <div className="mt-3 grid gap-2 px-3">
              <div className="rounded-lg border bg-background p-3">
                <div className="font-medium">Appointment booked</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Your online consultation with Dr. Reyes is confirmed.
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-card py-4 ring-1 ring-foreground/10">
              <div className="px-4">
                <div className="font-heading font-medium">Upcoming Consultation</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Your next appointment schedule.
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 px-4 text-sm">
                <CalendarCheck className="size-5 text-muted-foreground" />
                <span>Today, 3:30 PM with Dr. Reyes</span>
              </div>
            </div>

            <div className="rounded-xl bg-card py-4 ring-1 ring-foreground/10">
              <div className="px-4">
                <div className="font-heading font-medium">Medical Summary</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Patient details available to your doctor.
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 px-4 text-sm">
                <ClipboardList className="size-5 text-muted-foreground" />
                <span>Complete your profile to improve consultation context.</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-xl bg-card py-4 ring-1 ring-foreground/10">
              <div className="px-4">
                <div className="font-heading font-medium">Appointments</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Manage upcoming consultations.
                </div>
              </div>
              <div className="mt-4 grid gap-3 px-4">
                <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <div className="font-medium">Dr. Reyes</div>
                    <div className="text-sm text-muted-foreground">Today, 3:30 PM</div>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-lg border px-2.5 py-1 text-xs font-medium">Join</span>
                    <span className="rounded-lg border px-2.5 py-1 text-xs font-medium">Reschedule</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-card py-4 ring-1 ring-foreground/10">
              <div className="px-4">
                <div className="flex items-center gap-2 font-heading font-medium">
                  <Sparkles className="size-4 text-emerald-700" />
                  Care Match
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Describe symptoms to match with a relevant specialty.
                </div>
              </div>
              <div className="mt-4 grid gap-3 px-4">
                <div className="rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">
                  Headache for three days, dizziness...
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex h-8 items-center rounded-lg bg-foreground px-3 text-sm font-medium text-background">
                    Recommend
                  </span>
                  <span className="inline-flex h-8 items-center rounded-lg border px-3 text-sm text-muted-foreground">
                    Suggested: General Medicine
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8f5] text-foreground">
      <section className="overflow-hidden border-b bg-[#f7f8f5]">
        <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
                <HeartPulse className="size-4" />
              </span>
              TeleConsult
            </Link>
            <nav className="flex items-center gap-2">
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", className: "bg-background/80" })}
              >
                Log in
              </Link>
              <Link href="/register" className={buttonVariants({ className: "hidden sm:inline-flex" })}>
                Create account
              </Link>
            </nav>
          </header>

          <div className="py-16 sm:py-20 lg:py-24">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                <Sparkles className="size-3.5 text-emerald-700" />
                Built for online care, booking, and follow-through
              </div>
              <h1 className="text-5xl font-semibold tracking-normal text-balance sm:text-6xl lg:text-7xl">
                Care starts with the right doctor, at the right time.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                A telehealth workspace for patients to find care and for doctors to manage
                schedules, consultations, notes, and prescriptions in one place.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className={buttonVariants({ size: "lg" })}>
                  Start a consultation
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/login"
                  className={buttonVariants({
                    variant: "outline",
                    size: "lg",
                    className: "bg-background/90",
                  })}
                >
                  I already have an account
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="pb-8 sm:pb-12">
          <ProductScene />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <div className="text-sm font-medium text-muted-foreground">Patient to doctor journey</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal">
            The core workflow is simple enough to demo and complete enough to trust.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {careSteps.map((step) => (
            <div key={step.title} className="rounded-lg border bg-background p-4 shadow-sm">
              <step.icon className="size-5 text-emerald-700" />
              <h3 className="mt-5 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {platformSignals.map((signal) => (
              <div key={signal} className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 text-emerald-700" />
                {signal}
              </div>
            ))}
          </div>
          <Link href="/register" className={buttonVariants({ variant: "outline" })}>
            Enter the app
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
