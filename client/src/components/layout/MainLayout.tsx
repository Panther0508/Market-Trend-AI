import { ReactNode } from "react";
import { CyberHeader } from "./CyberHeader";
import { Footer } from "./Footer";
import { DevBanner } from "../common/DevBanner";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <DevBanner />
      <CyberHeader />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
