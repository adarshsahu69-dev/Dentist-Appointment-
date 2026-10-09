import { data } from "@/lib/data";
import { BookingWizard } from "@/components/booking/booking-wizard";

export const metadata = {
  title: "Book an Appointment",
  description: "Book a dental appointment at DentalCare in four quick steps.",
};

export const dynamic = "force-dynamic";

export default async function BookAppointmentPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const user = await data.getSessionUser();
  const [services, dentists, clinics] = await Promise.all([data.listServices(), data.listDentists(), data.listClinics()]);

  const availability: Record<string, Awaited<ReturnType<typeof data.listAvailability>>> = {};
  const blockedDates: Record<string, string[]> = {};
  for (const dentist of dentists) {
    availability[dentist.id] = await data.listAvailability(dentist.id);
    blockedDates[dentist.id] = (await data.listBlockedDates(dentist.id)).map((b) => b.blocked_date);
  }

  return (
    <BookingWizard
      services={services}
      dentists={dentists}
      clinics={clinics}
      availability={availability}
      blockedDates={blockedDates}
      user={user}
      initialServiceId={typeof searchParams.service === "string" ? searchParams.service : undefined}
      initialDentistId={typeof searchParams.dentist === "string" ? searchParams.dentist : undefined}
      initialClinicId={typeof searchParams.clinic === "string" ? searchParams.clinic : undefined}
    />
  );
}
