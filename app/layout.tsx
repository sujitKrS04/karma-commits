import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import SessionProvider from "@/components/ui/SessionProvider";
import CustomCursor from "@/components/ui/CustomCursor";
import "./globals.css";

const SITE_URL = process.env.NEXTAUTH_URL ?? "https://karma-commits.vercel.app";

export const metadata: Metadata = {
  title: "Karma Commits — Your GitHub OSS Reputation Passport",
  description:
    "Beyond commits. Track reviews, mentoring, docs, and bug triage. Get your open source reputation score.",
  keywords: [
    "github",
    "open source",
    "reputation",
    "contributions",
    "developer",
    "karma",
    "passport",
    "code review",
    "mentorship",
  ],
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "Karma Commits — Your GitHub OSS Reputation Passport",
    description:
      "Beyond commits. Track reviews, mentoring, docs, and bug triage. Get your open source reputation score.",
    type: "website",
    url: SITE_URL,
    siteName: "Karma Commits",
    images: [
      {
        url: "/og-preview.png",
        width: 1200,
        height: 630,
        alt: "Karma Commits — GitHub OSS Reputation Passport",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Karma Commits — Your GitHub OSS Reputation Passport",
    description:
      "Beyond commits. Track reviews, mentoring, docs, and bug triage.",
    images: ["/og-preview.png"],
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>",
    shortcut: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-gh-bg text-gh-text min-h-screen">
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
        <CustomCursor />
      </body>
    </html>
  );
}

