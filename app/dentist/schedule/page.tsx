import { redirect } from "next/navigation";
import { ScheduleEditor } from "@/components/dentist/schedule-editor";
import { BlockedDates } from "@/components/dentist/blocked-dates";
import { data } from "@/lib/data";
import { DAY_NAMES } from "@/lib/constants";
import { formatTime12h, toISODate } from "@/lib/availability";

export const dynamic = "force-dynamic";

export const metadata = { title: "My Schedule" };

export default async function DentistSchedulePage() {
  const user = await data.getSessionUser();
  if (!user || user.role !== "dentist" || !user.dentist_id) redirect("/unauthorized");

  const [availability, blockedDates, services] = await Promise.all([
    data.listAvailability(user.dentist_id),
    data.listBlockedDates(user.dentist_id),
    data.listServices(),
  ]);

  const offered = services.filter((s) => true);
  const durations = [...new Set(offered.map((s) => s.duration_minutes))].sort((a, b) => a - b);
  const upcomingBlocks = blockedDates.filter((b) => b.blocked_date >= toISODate(new Date()));

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold">My schedule</h1>
      <p className="mt-1 max-w-2xl text-muted-foreground">
        Set the days and hours you work, configure breaks, and block dates when you are unavailable. Appointment
        duration is determined by each service ({durations.join(", ")} minute options) — patients only see slots that
        fit your working hours.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Working hours</h2>
        <ScheduleEditor
          dentistId={user.dentist_id}
          availability={availability.map((a) => ({
            day_of_week: a.day_of_week,
            start_time: a.start_time,
            end_time: a.end_time,
            break_start: a.break_start,
            break_end: a.break_end,
          }))}
        />
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Blocked dates</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Dates with active bookings cannot be blocked — cancel or reschedule those appointments first.
        </p>
        <BlockedDates blocked={upcomingBlocks} dentistId={user.dentist_id} />
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Current weekly schedule</h2>
        {availability.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No working hours published yet.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Day</th>
                  <th className="px-4 py-2 text-left font-semibold">Hours</th>
                  <th className="px-4 py-2 text-left font-semibold">Break</th>
                </tr>
              </thead>
              <tbody>
                {availability.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-4 py-2 font-medium">{DAY_NAMES[row.day_of_week]}</td>
                    <td className="px-4 py-2">
                      {formatTime12h(row.start_time)} – {formatTime12h(row.end_time)}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {row.break_start && row.break_end ? `${formatTime12h(row.break_start)} – ${formatTime12h(row.break_end)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
