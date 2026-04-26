import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppTopNav } from "@/components/app-top-nav";
import { isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Social Fitness",
  description: "Fitness challenges for teams",
};

/** Required: otherwise the shell can be prerendered at build time with no session. */
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = Boolean(user?.email && isAdminEmail(user.email));

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {user && <AppTopNav isAdmin={isAdmin} />}
        {children}
      </body>
    </html>
  );
}
