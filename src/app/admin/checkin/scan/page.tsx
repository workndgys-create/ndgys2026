"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminShell, { Panel } from "@/components/admin/Shell";

export default function ScannerPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [scanDay, setScanDay] = useState<1 | 2>(1);
  const [autoScan, setAutoScan] = useState(true);
  const [scanMessage, setScanMessage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const videoRef = /*#__PURE__*/ (null as unknown) as { current: HTMLVideoElement | null };
  const detectorRef = /*#__PURE__*/ (null as unknown) as { current: any };
  let scanCooldown = false;

  useEffect(() => {
    let mounted = true;
    async function checkAuth() {
      const r = await fetch(`/api/admin/checkin`);
      if (r.status === 401) return router.push("/admin/login");
      // ignore data; scanner page shows minimal UI
      const _ = await r.json().catch(() => ({}));
      if (!mounted) return;
      // feature-detect BarcodeDetector
      setCameraSupported(typeof (window as any).BarcodeDetector === "function");
    }
    checkAuth();
    return () => { mounted = false; };
  }, [router]);

  async function onScan(e?: React.FormEvent) {
    e?.preventDefault();
    const qtrim = q.trim();
    if (!qtrim) return;
    setScanMessage("");
    const r = await fetch(`/api/admin/checkin?q=${encodeURIComponent(qtrim)}`);
    if (r.status === 401) return router.push("/admin/login");
    const data = await r.json().catch(() => ({}));
    const results = data.results || [];

    if (autoScan && Array.isArray(results) && results.length === 1) {
      const reg = results[0];
      const dayAlreadyChecked = scanDay === 1 ? reg.checkedInDay1 : reg.checkedInDay2;
      if (!dayAlreadyChecked) {
        const markRes = await fetch("/api/admin/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: qtrim, day: scanDay, value: true })
        });
        if (markRes.ok) {
          const payload = await markRes.json().catch(() => ({}));
          if (payload.alreadyCheckedIn) {
            setScanMessage(`${reg.fullName} was already checked in at ${payload.when || "an earlier time"}.`);
          } else {
            setScanMessage(`Checked in ${reg.fullName} (Day ${scanDay})`);
          }
        } else if (markRes.status === 403) {
          setScanMessage("Invalid QR signature - cannot check in.");
        } else {
          setScanMessage("Check-in failed");
        }
      } else {
        setScanMessage(`${reg.fullName} is already checked in for Day ${scanDay}.`);
      }
    } else if (Array.isArray(results) && results.length > 1) {
      setScanMessage("Multiple matches found - please type full delegate ID or email.");
    } else {
      setScanMessage("No paid delegate found for this scan.");
    }

    setQ("");
  }

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScanMessage("Camera not available in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const video = document.getElementById("scanner-video") as HTMLVideoElement | null;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setCameraActive(true);

      // use BarcodeDetector if available
      const BarcodeDetector = (window as any).BarcodeDetector;
      if (BarcodeDetector) {
        detectorRef.current = new BarcodeDetector({ formats: ["qr_code"] });
        const loop = async () => {
          if (!cameraActive || scanCooldown) return;
          try {
            const barcodes = await detectorRef.current.detect(video);
            if (barcodes && barcodes.length) {
              const raw = barcodes[0].rawValue || barcodes[0].rawText || "";
              if (raw) {
                scanCooldown = true;
                setQ(raw);
                await onScan();
                setTimeout(() => { scanCooldown = false; }, 1500);
              }
            }
          } catch (err) {
            // ignore detection errors
          }
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      } else {
        setScanMessage("Camera QR scanning not supported in this browser.");
      }
    } catch (err) {
      setScanMessage("Could not start camera: " + String(err));
    }
  }

  function stopCamera() {
    const video = document.getElementById("scanner-video") as HTMLVideoElement | null;
    if (video && video.srcObject) {
      const s = video.srcObject as MediaStream;
      s.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }
    setCameraActive(false);
  }

  return (
    <AdminShell title="Scanner">
      <Panel title="Scan badge">
        <form onSubmit={onScan} className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            placeholder="Scan QR or type delegate ID / email"
            className="flex-1 rounded-lg border border-ink/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
          <button className="rounded-full bg-midnight px-6 py-2.5 text-sm font-600 text-cream hover:bg-royal">Scan</button>
        </form>

        <div className="mt-3 flex items-center gap-4 text-xs text-slatey">
          <label className="inline-flex items-center gap-2">
            <span>Scan day</span>
            <select value={scanDay} onChange={(e) => setScanDay(Number(e.target.value) === 2 ? 2 : 1)} className="rounded-md border border-ink/15 bg-cream px-2 py-1 text-xs">
              <option value={1}>Day 1</option>
              <option value={2}>Day 2</option>
            </select>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={autoScan} onChange={(e) => setAutoScan(e.target.checked)} />
            <span>Auto check-in on scan</span>
          </label>
        </div>
        {scanMessage && <p className="mt-3 text-sm text-ink/70">{scanMessage}</p>}
      </Panel>
    </AdminShell>
  );
}
