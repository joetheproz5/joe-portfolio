import type { Metadata } from "next";
import { DM_Mono, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const mono = DM_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Joe Ghaoui — Software Developer",
  description: "Portfolio of Joe Ghaoui, a Computer Science student and software developer building web applications, desktop software and automation tools.",
  openGraph: { title: "Joe Ghaoui — Software Developer", description: "Web applications, desktop software and automation tools.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${manrope.variable} ${mono.variable}`}><body>{children}</body></html>;
}
