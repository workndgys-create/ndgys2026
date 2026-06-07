import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Venue — NDGYS 2026",
  description: "IIT Delhi — venue for New Delhi Global Youth Summit 2026",
};

export default function VenuePage() {
  const src = "https://www.google.com/maps/embed?origin=mfe&pb=!1m2!2m1!1sIIT+Delhi,+Hauz+Khas,+New+Delhi";

  return (
    <div className="h-screen w-full">
      <iframe
        title="IIT Delhi map"
        src={src}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
