import { redirect } from "next/navigation";
import { data } from "@/lib/data";
import { ProfileForm } from "@/components/dashboard/profile-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Profile settings" };

export default async function ProfileSettingsPage() {
  const user = await data.getSessionUser();
  if (!user || (user.role !== "patient" && user.role !== "admin")) redirect("/login?next=/dashboard/profile");

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="text-3xl font-bold">Profile settings</h1>
      <p className="mt-1 text-muted-foreground">
        Keep your contact details up to date so appointment confirmations and reminders reach you.
      </p>

      <ProfileForm user={user} />

      <div className="mt-8 rounded-xl border bg-accent/40 p-5 text-sm text-muted-foreground">
        <h2 className="text-sm font-semibold text-navy">Data &amp; privacy</h2>
        <p className="mt-1">
          You can request a copy of your records or ask us to delete information we are not required to keep — contact
          care@dentalcare.example. Deleting your account does not remove clinical records that we are legally obliged to
          retain.
        </p>
      </div>
    </div>
  );
}
