import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteTitle = "Intelligent Brief: weekly intelligence for leadership teams";
const siteDescription =
  "A weekly intelligence brief built around your company: your markets, competitors, customers and suppliers. Filtered by role and delivered on the day and time you choose.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.companybrief.net"),
  title: { default: siteTitle, template: "%s · Intelligent Brief" },
  description: siteDescription,
  applicationName: "Intelligent Brief",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Intelligent Brief",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: { card: "summary", title: siteTitle, description: siteDescription },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
