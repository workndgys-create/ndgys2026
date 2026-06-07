function toIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function escape(t: string): string {
  return t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export interface IcsEvent {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
}

/** Builds a minimal, valid VCALENDAR string for a single event. */
export function buildIcs(e: IcsEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NDGYS 2026//Summit//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(e.start)}`,
    `DTEND:${toIcsDate(e.end)}`,
    `SUMMARY:${escape(e.title)}`,
    e.location ? `LOCATION:${escape(e.location)}` : "",
    e.description ? `DESCRIPTION:${escape(e.description)}` : "",
    "END:VEVENT",
    "END:VCALENDAR"
  ].filter(Boolean);
  return lines.join("\r\n");
}
