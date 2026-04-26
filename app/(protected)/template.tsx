import { BottomNav } from "@/components/bottom-nav";

export const dynamic = "force-dynamic";

/**
 * AppTopNav is rendered in root `app/layout.tsx` so it is never skipped on Vercel
 * (static prerendered layouts). This template only adds bottom padding + mobile bar.
 */
export default function ProtectedTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-0 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
