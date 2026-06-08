import { getSetting } from "./settings";
import { buildIcs } from "./ics";

/** Builds the summit calendar invite from editable settings. */
export async function summitIcs(uidSuffix = "summit"): Promise<{ ics: string; filename: string }> {
  const [start, end, venue] = await Promise.all([
    getSetting("event.start"), getSetting("event.end"), getSetting("event.venue")
  ]);
  const ics = buildIcs({
    uid: `ndgys-4.0-${uidSuffix}@nesummit.in`,
    title: "New Delhi Global Youth Summit 4.0",
    start: new Date(start), end: new Date(end),
    location: venue,
    description: "Your delegate pass and committee details are in your dashboard."
  });
  return { ics, filename: "ndgys-4.0.ics" };
}
