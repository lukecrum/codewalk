import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeWalker Visualizer",
  description: "Visualize code changes tracked by the CodeWalker skill",
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
