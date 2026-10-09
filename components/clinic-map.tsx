import type { Clinic } from "@/lib/types";
import { googleMapsApiKey } from "@/lib/config";

function directionsUrl(clinic: Clinic): string {
  if (clinic.latitude && clinic.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${clinic.latitude},${clinic.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clinic.name} ${clinic.address} ${clinic.city}`)}`;
}

function mapsEmbedUrl(clinics: Clinic[]): string | null {
  if (!googleMapsApiKey) return null;
  const primary = clinics[0];
  if (!primary?.latitude || !primary?.longitude) return null;
  return `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${primary.latitude},${primary.longitude}&zoom=13`;
}

export function ClinicMap({ clinics }: { clinics: Clinic[] }) {
  const embed = mapsEmbedUrl(clinics);

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-card">
      {embed ? (
        <iframe
          title="Clinic location map"
          src={embed}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-72 w-full border-0"
          allowFullScreen
        />
      ) : (
        <div className="flex h-72 items-center justify-center bg-accent px-6 text-center">
          <div>
            <p className="text-sm font-semibold text-navy">Interactive map unavailable</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The Google Maps browser key is not configured. Use the directions links below to navigate to a clinic.
            </p>
          </div>
        </div>
      )}

      <ul className="divide-y">
        {clinics.map((clinic) => (
          <li key={clinic.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-navy">{clinic.name}</p>
              <p className="text-sm text-muted-foreground">
                {clinic.address}, {clinic.city}, {clinic.state} {clinic.postal_code}
              </p>
            </div>
            <a
              href={directionsUrl(clinic)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-secondary"
            >
              Get directions
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
