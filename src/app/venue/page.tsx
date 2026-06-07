import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Venue — NDGYS 2026",
  description: "IIT Delhi — venue for New Delhi Global Youth Summit 2026",
};

export default function VenuePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="relative h-[60vh] bg-gray-900">
        <img
          src="/IMG_7820.JPG.jpeg"
          alt="IIT Delhi campus"
          className="absolute inset-0 w-full h-full object-cover brightness-75"
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold">Venue</h1>
          <p className="mt-3 text-lg md:text-xl opacity-90">IIT Delhi, Hauz Khas, New Delhi</p>
          <p className="mt-6 max-w-3xl text-sm md:text-base">
            The New Delhi Global Youth Summit 2026 will be hosted at the historic and well-equipped
            campus of IIT Delhi (Hauz Khas). The campus provides large lecture halls, multiple
            breakout rooms, and accessible facilities suitable for conferences and large events.
          </p>
          <div className="mt-6 flex gap-3">
            <a
              href="https://www.google.com/maps/place/IIT+Delhi/@28.5463,77.1928,15z"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow"
            >
              Open in Google Maps
            </a>
            <a
              href="#directions"
              className="inline-block rounded border border-white/30 px-4 py-2 text-sm font-medium text-white/90"
            >
              Directions
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold">About the venue</h2>
        <p className="mt-4 text-slate-700">
          IIT Delhi's Hauz Khas campus sits in South Delhi and combines academic spaces with
          conference-ready auditoria and guest facilities. We'll be using centrally-located
          lecture halls and breakout rooms with AV support. The campus is wheelchair-accessible
          and has on-site parking for organisers.
        </p>

        <div className="grid gap-8 md:grid-cols-2 mt-8">
          <div>
            <h3 className="font-semibold">Address</h3>
            <address className="not-italic mt-2 text-slate-700">
              Indian Institute of Technology Delhi
              <br />
              Hauz Khas, New Delhi, Delhi 110016
            </address>

            <h4 className="mt-6 font-semibold">On-site contacts</h4>
            <p className="mt-2 text-slate-700">Event desk: +91 11 2659 XXXX (on event days)</p>
          </div>

          <div>
            <h3 className="font-semibold">How to reach</h3>
            <ul className="mt-2 list-disc pl-5 text-slate-700">
              <li>
                By Metro: Hauz Khas Metro Station (Yellow Line) is a short auto/ride away from the
                campus.
              </li>
              <li className="mt-2">By Road: Easily accessible from South Delhi and the Ring Road.</li>
              <li className="mt-2">By Air: Indira Gandhi International Airport is ~30–45 minutes by taxi.</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="facilities" className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-xl font-semibold">Facilities</h3>
          <ul className="mt-4 grid gap-2 md:grid-cols-2 text-slate-700">
            <li>Multiple auditoria and lecture halls with AV support</li>
            <li>Breakout rooms for workshops and panels</li>
            <li>On-campus dining and catering options</li>
            <li>Accessible restrooms and ramps</li>
            <li>On-site parking for organisers</li>
            <li>Secure Wi‑Fi for event operations</li>
          </ul>
        </div>
      </section>

      <section id="gallery" className="max-w-6xl mx-auto px-6 py-12">
        <h3 className="text-xl font-semibold">Gallery</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <img src="/logos/IMG_2821.PNG" alt="venue 1" className="w-full h-40 object-cover rounded" />
          <img src="/IMG_7820.JPG.jpeg" alt="venue 2" className="w-full h-40 object-cover rounded" />
          <img src="/logo.png" alt="venue 3" className="w-full h-40 object-cover rounded" />
          <div className="w-full h-40 bg-slate-200 rounded flex items-center justify-center text-slate-500">
            More images coming soon
          </div>
        </div>
      </section>

      <section id="directions" className="max-w-6xl mx-auto px-6 py-12">
        <h3 className="text-xl font-semibold">Event day information</h3>
        <p className="mt-4 text-slate-700">
          Please arrive at the venue at least 45 minutes before your scheduled session. On arrival,
          check in at the event desk and collect your badge. Volunteers will be available to guide
          participants to auditoria and breakout rooms.
        </p>
      </section>
    </main>
  );
}
