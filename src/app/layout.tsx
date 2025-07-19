import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitREADME AI",
  description: "built by Zeeshier",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
