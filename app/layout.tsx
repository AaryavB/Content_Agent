import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { AppLayout } from "@/components/AppLayout";
import { AppNavigationProvider } from "@/components/AppNavigationProvider";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: "Content Agent",
  description: "AI Ghostwriter Agent for personalized LinkedIn posts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fraunces.variable}>
      <body className="min-h-screen font-sans antialiased">
        <ConvexClientProvider>
          <AppNavigationProvider>
            <AppLayout>{children}</AppLayout>
          </AppNavigationProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
