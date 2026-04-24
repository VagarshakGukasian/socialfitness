import { ProfileSubnav } from "@/components/profile-subnav";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-4 sm:py-6">
      <ProfileSubnav />
      {children}
    </div>
  );
}
