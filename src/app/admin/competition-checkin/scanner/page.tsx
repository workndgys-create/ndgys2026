"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AdminShell, { Panel } from "@/components/admin/Shell";

export default function CompetitionScannerPage() {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [autoScan, setAutoScan] = useState(true);
  const [scanMessage, setScanMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectorRef = useRef<any>(null);
  const scanCooldownRef = useRef(false);
  const activeRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      const r = await fetch("/api/admin/competition-scanner");
      if (r.status === 401) return router.push("/admin/login");
      await r.json().catch(() => ({}));
      if (!mounted) return;
      setCameraSupported(typeof (window as any).BarcodeDetector === "function");
    }

    checkAuth();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [router]);

  async function onScan(e?: React.FormEvent, scannedValue?: string) {
    e?.preventDefault();

    let qtrim = (scannedValue ?? q).trim();
    if (!qtrim) return;

    // Strip signature: NDGYS-C-2026-XXXX.hash → NDGYS-C-2026-XXXX
    const dot = qtrim.lastIndexOf(".");
    if (qtrim.startsWith("NDGYS-C-") && dot > 0) {
      qtrim = qtrim.substring(0, dot);
    }

    // Extract from verify URL
    if (qtrim.includes("/verify/")) {
      qtrim = qtrim.split("/verify/").pop() || qtrim;
    }

    setScanMessage(null);

    // Search
    const r = await fetch(`/api/admin/competition-scanner?q=${encodeURIComponent(qtrim)}`);
    if (r.status === 401) return router.push("/admin/login");

    const data = await r.json().catch(() => ({}));
    const results: any[] = data.results || [];

    if (results.length === 0) {
      setScanMessage({ text: "No paid competition participant found.", ok: false });
      setQ("");
      return;
    }

    if (results.length > 1) {
      setScanMessage({ text: "Multiple matches — type the full reference ID.", ok: false });
      setQ("");
      return;
    }

    const participant = results[0];

    if (participant.checkedIn) {
      setScanMessage({ text: `${participant.leaderName} is already checked in.`, ok: false });
      setQ("");
      return;
    }

    if (!autoScan) {
      setScanMessage({ text: `Found: ${participant.leaderName} (${participant.refId}). Press Check In to confirm.`, ok: true });
      setQ("");
      return;
    }

    // Auto check-in
    const markRes = await fetch("/api/admin/competition-scanner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: qtrim }),
    });

    if (markRes.status === 403) {
      setScanMessage({ text: "Invalid QR signature — cannot check in.", ok: false });
    } else if (!markRes.ok) {
      setScanMessage({ text: "Check-in failed. Try again.", ok: false });
    } else {
      const payload = await markRes.json().catch(() => ({}));
      if (payload.alreadyCheckedIn) {
        setScanMessage({ text: `${participant.leaderName} was already checked in.`, ok: false });
      } else {
        setScanMessage({ text: `✓ Checked in ${participant.leaderName} — ${participant.competitionTitle}`, ok: true });
      }
    }

    setQ("");
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanMessage({ text: "Camera not available in this browser.", ok: false });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      await video.play();
      activeRef.current = true;
      setCameraActive(true);

      const BarcodeDetector = (window as any).BarcodeDetector;
      if (!BarcodeDetector) {
        setScanMessage({ text: "Camera QR scanning not supported in this browser.", ok: false });
        return;
      }

      detectorRef.current = new BarcodeDetector({ formats: ["qr_code"] });

      const loop = async () => {
        if (!activeRef.current || scanCooldownRef.current) {
          requestAnimationFrame(loop);
          return;
        }

        try {
          const barcodes = await detectorRef.current.detect(videoRef.current as HTMLVideoElement);
          if (barcodes?.length > 0) {
            const raw = barcodes[0].rawValue || barcodes[0].rawText || "";
            if (raw) {
              scanCooldownRef.current = true;
              setQ(raw);
              await onScan(undefined, raw);
              setTimeout(() => { scanCooldownRef.current = false; }, 2000);
            }
          }
        } catch (err) {
          console.error("QR detect error:", err);
        }

        if (activeRef.current) requestAnimationFrame(loop);
      };

      requestAnimationFrame(loop);
    } catch (err) {
      setScanMessage({ text: "Could not start camera: " + String(err), ok: false });
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    activeRef.current = false;
    setCameraActive(false);
  }

  return (
    <AdminShell title="Competition Scanner">
      <Panel title="Scan competition badge">
        <div className="mb-4 flex gap-4">
          {/* Camera */}
          <div className="w-1/2">
            {cameraSupported ? (
              <div>
                <video
                  ref={videoRef}
                  className="w-full rounded-md bg-black"
                  playsInline
                  muted
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={cameraActive}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    Start camera
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    disabled={!cameraActive}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    Stop camera
                  </button>
                  <span className={`ml-2 text-xs ${cameraActive ? "text-emerald-700" : "text-slatey"}`}>
                    {cameraActive ? "● Camera active" : "Camera inactive"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-ink/10 p-3 text-sm text-slatey">
                Camera scanning not supported — paste QR or type reference ID below.
              </div>
            )}
          </div>

          {/* Manual input */}
          <div className="flex-1">
            <form onSubmit={onScan} className="flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoFocus
                placeholder="Scan QR or type reference ID"
                className="flex-1 rounded-lg border border-ink/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
              <button className="rounded-full bg-midnight px-6 py-2.5 text-sm font-600 text-cream hover:bg-royal">
                Scan
              </button>
            </form>

            <div className="mt-3 flex items-center gap-4 text-xs text-slatey">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoScan}
                  onChange={(e) => setAutoScan(e.target.checked)}
                />
                <span>Auto check-in on scan</span>
              </label>
            </div>
          </div>
        </div>

        {scanMessage && (
          <p className={`mt-3 rounded-lg px-4 py-2.5 text-sm font-500 ${
            scanMessage.ok
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}>
            {scanMessage.text}
          </p>
        )}
      </Panel>
    </AdminShell>
  );
                    }

