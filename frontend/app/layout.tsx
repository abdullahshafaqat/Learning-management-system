import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/auth-context";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "LMS - Premium Learning",
  description: "A premium learning management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors position="top-right" closeButton duration={4000} />
      </body>
    </html>
  );
}
