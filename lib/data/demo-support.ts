export * from "../demo/store";
import type { DemoDB } from "../demo/seed";
import { activeAppointmentsFor } from "../demo/store";
import { withLock } from "../demo/seed";

export { withLock };

export function activeAppointmentsForDentist(db: DemoDB, dentistId: string, date?: string) {
  return activeAppointmentsFor(db, dentistId, date);
}

export function markNotificationReadInDb(db: DemoDB, id: string, userId: string): boolean {
  const notification = db.notifications.find((n: { id: string; user_id: string; is_read: boolean }) => n.id === id && n.user_id === userId);
  if (!notification) return false;
  notification.is_read = true;
  return true;
}

export function removeBlockedDateFromDb(db: DemoDB, id: string): boolean {
  const before = db.blockedDates.length;
  db.blockedDates = db.blockedDates.filter((b: { id: string }) => b.id !== id);
  return db.blockedDates.length < before;
}
