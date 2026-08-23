import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import CommandPalette from "./components/CommandPalette";
import { AuthProvider } from "../context/AuthContext";

export const metadata: Metadata = {
  title: "Alkame Intelligence — AI Market Research & Competitor Analysis Platform",
  description: "Autonomous AI-powered market intelligence platform delivering real-time competitor analysis, SWOT matrices, and strategic insights via Groq LLM + live web crawling.",
  keywords: "market intelligence, competitor analysis, AI, SWOT, business strategy, Groq, LLM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>
          <div className="app-layout">
            <Sidebar />
            <CommandPalette />
            <main className="app-main">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
