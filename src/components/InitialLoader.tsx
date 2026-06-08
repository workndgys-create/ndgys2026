"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Loading from "@/components/LoaderUI";

export default function InitialLoader() {
  const [visible, setVisible] = useState(true);
  const pathname = usePathname();
  const timerRef = useRef<number | null>(null);

  const HIDE_DELAY = 700; // allow internal animation to finish
  const SIMULATED_DURATION = 3500; // match Loading's simulated duration

  useEffect(() => {
    // show on first mount
    setVisible(true);

    const onLoad = () => {
      // hide shortly after load so animation finishes
      timerRef.current = window.setTimeout(() => setVisible(false), HIDE_DELAY + 0);
    };

    if (typeof window !== "undefined") {
      if (document.readyState === "complete") {
        onLoad();
      } else {
        window.addEventListener("load", onLoad, { once: true });
      }
    }

    // safety fallback: hide after the simulated duration + grace
    timerRef.current = window.setTimeout(() => setVisible(false), SIMULATED_DURATION + HIDE_DELAY + 1000);

    return () => {
      if (typeof window !== "undefined") window.removeEventListener("load", onLoad as any);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // show loader on client-side route changes
  useEffect(() => {
    if (!pathname) return;
    // show immediately
    setVisible(true);

    // hide after the simulated loading animation finishes
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => setVisible(false), SIMULATED_DURATION + HIDE_DELAY);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      aria-hidden={!visible}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
      }}
    >
      <Loading />
    </div>
  );
}
