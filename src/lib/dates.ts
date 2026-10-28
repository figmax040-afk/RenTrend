// Today's date (YYYY-MM-DD) in Hong Kong, regardless of the device's timezone.
export function todayHK(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
