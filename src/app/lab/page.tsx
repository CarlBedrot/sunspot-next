"use client";

import dynamic from "next/dynamic";
import "./lab.css";

// Preserve the original Next.js prototype for comparison and bench-layer work.
const OriginalMap = dynamic(
  () => import("@/components/SunspotMap").then((m) => m.SunspotMap),
  { ssr: false },
);

export default function LabPage() {
  return <OriginalMap />;
}
