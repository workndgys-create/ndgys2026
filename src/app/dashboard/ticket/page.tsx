"use client";
import { useEffect, useState } from "react";

type Ticket = { id: string; delegateId: string; fullName: string; trackName: string; qr: string; hasPhoto: boolean };

export default function TicketPage() {
  const [t, setT] = useState<Ticket | null>(null);
  const [err, setErr] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [version, setVersion] = useState(0); // cache buster for image URL

  useEffect(() => {
    fetch("/api/delegate/ticket").then(async (r) => {
      if (r.ok) {
        const data = await r.json();
        setT(data);
        setHasPhoto(data.hasPhoto);
      }
      else setErr((await r.json().catch(() => ({}))).error || "Ticket unavailable.");
    });
  }, []);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");

    if (file.type !== "image/jpeg" && file.type !== "image/png" && file.type !== "image/jpg") {
      setUploadError("Only JPEG and PNG formats are supported.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Photo must be smaller than 2MB.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch("/api/delegate/photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoData: base64, photoMime: file.type })
        });
        const resData = await res.json().catch(() => ({}));
        if (res.ok && resData.ok) {
          setHasPhoto(true);
          setVersion((v) => v + 1);
        } else {
          setUploadError(resData.error || "Upload failed. Please try again.");
        }
      } catch (err) {
        setUploadError("An error occurred during upload.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  if (err) return <p className="text-ink/70">{err}</p>;
  if (!t) return <p className="text-slatey">Loading ticket…</p>;

  return (
    <div className="mx-auto max-w-sm">
      <div className="overflow-hidden rounded-3xl border border-ink/10 bg-paper shadow-xl print:shadow-none">
        <div className="bg-midnight px-6 py-5 text-center text-cream">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Participant Pass</p>
          <p className="mt-1 font-display text-xl font-700">New Delhi Global Youth Summit</p>
          <p className="text-xs text-cream/60">22–23 August 2026 · IIT Delhi</p>
        </div>
        <div className="p-6 text-center">
          {hasPhoto ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <img
                  src={`/api/registrations/${t.id}/photo?v=${version}`}
                  alt="Passport Photo"
                  className="h-32 w-28 object-cover rounded-xl border border-ink/15 shadow-sm bg-cream"
                />
                <img src={t.qr} alt="Check-in QR" className="h-32 w-32 border border-ink/5 p-1 rounded-xl bg-white" />
              </div>
              <label className="text-xs font-600 text-gold hover:text-goldlite cursor-pointer hover:underline mb-2">
                {uploading ? "Uploading..." : "Change photo"}
                <input type="file" accept="image/jpeg, image/png" onChange={handlePhotoUpload} disabled={uploading} className="hidden" />
              </label>
              {uploadError && <p className="text-xs text-red-600 mb-2">{uploadError}</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <img src={t.qr} alt="Check-in QR" className="mx-auto h-56 w-56 border border-ink/5 p-2 rounded-2xl bg-white" />
              
              <div className="rounded-2xl border border-dashed border-gold/40 bg-goldlite/10 p-4">
                <p className="text-xs font-500 text-ink/80 mb-2.5">Upload a passport-size photo to complete your badge:</p>
                <label className="inline-block rounded-full bg-gold px-4 py-2 text-xs font-600 text-midnight hover:bg-goldlite cursor-pointer transition">
                  {uploading ? "Uploading..." : "Upload Photo"}
                  <input type="file" accept="image/jpeg, image/png" onChange={handlePhotoUpload} disabled={uploading} className="hidden" />
                </label>
                {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
              </div>
            </div>
          )}

          <p className="mt-4 font-mono text-lg font-700 text-ink">{t.delegateId}</p>
          <p className="mt-1 font-display text-lg text-ink">{t.fullName}</p>
          <p className="text-sm text-slatey">{t.trackName}</p>
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        <button onClick={() => window.print()} className="flex-1 rounded-full bg-midnight py-3 font-600 text-cream hover:bg-royal">Print ticket</button>
        <a href="/api/delegate/badge" className="flex-1 rounded-full border border-ink/20 py-3 text-center font-600 text-ink hover:border-gold">Download pass badge (PDF)</a>
      </div>
      <a href="/api/delegate/calendar" className="mt-3 block rounded-full border border-ink/20 py-3 text-center font-600 text-ink hover:border-gold">Add to calendar (.ics)</a>
      <p className="mt-3 text-center text-xs text-slatey">This ticket works offline once you've opened it on this device.</p>
    </div>
  );
}
