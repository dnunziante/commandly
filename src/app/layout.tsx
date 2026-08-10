import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Commandly",
  description: "Multi-tenant AI sales enablement platform"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
