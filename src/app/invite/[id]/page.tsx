import type { Metadata } from "next";
import Explore from "@/components/Explore";

export const metadata: Metadata = {
  title: "Inbjudan — SunSpot",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function InvitationPage() {
  return <Explore />;
}
