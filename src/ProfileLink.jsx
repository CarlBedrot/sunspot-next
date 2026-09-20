import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "./Language.jsx";
import { readProfile } from "./profile.js";
import Avatar from "./Avatar.jsx";
export default function ProfileLink({ returnTo = "/", className = "" }) {
  const { t } = useLanguage();
  const [profile] = useState(readProfile);
  return (
    <Link
      href={`/profile${returnTo === "/" ? "" : `?returnTo=${encodeURIComponent(returnTo)}`}`}
      className={`profile-link ${className}`}
      aria-label={t("Min profil")}
      prefetch={false}
    >
      <Avatar name={profile.name} photo={profile.photo} />
    </Link>
  );
}
