import Profile from "@/components/Profile";
import { profileReturn } from "@/profile.js";
export const metadata = {
  title: "Din profil · SunSpot",
  robots: { index: false, follow: false },
};
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  return (
    <Profile
      returnTo={profileReturn(returnTo)}
      canExplore={process.env.SUNSPOT_RECIPIENT_ONLY !== "1"}
    />
  );
}
