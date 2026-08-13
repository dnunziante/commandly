import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Refyntra", template: "%s | Refyntra" },
  description: "Refine your team. Transform performance. Perform with clarity.",
  applicationName: "Refyntra",
  icons: { icon: "/icon.png", apple: "/icon.png" },
  openGraph: {
    title: "Refyntra",
    description: "Refine. Transform. Perform.",
    images: ["/opengraph-image.png"],
  },
  twitter: { card: "summary_large_image", title: "Refyntra", description: "Refine. Transform. Perform." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
