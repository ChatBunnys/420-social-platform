import { Header } from "@/components/Header";
import { Navigation } from "@/components/Navigation";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function Layout({ children, hideNav = false }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex flex-1 max-w-6xl w-full mx-auto">
        {!hideNav && <Navigation />}

        <main className="flex-1 min-w-0 pb-20 lg:pb-0">{children}</main>
      </div>

      {/* Footer — desktop only, shown below content */}
      <footer className="hidden lg:block bg-card border-t border-border py-3 px-6 text-center">
        <p className="text-muted-foreground/50 text-xs font-body">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/60 hover:text-primary transition-smooth"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
