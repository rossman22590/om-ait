// app/fonts/roobert-mono.ts
import localFont from "next/font/local";

export const roobertMono = localFont({
  src: "../../../public/fonts/roobert/RoobertMonoUprightsVF.woff2",
  variable: "--font-roobert-mono",
  display: "swap",
  weight: "100 900",
  preload: true,
  fallback: ["ui-monospace", "monospace"],
});
