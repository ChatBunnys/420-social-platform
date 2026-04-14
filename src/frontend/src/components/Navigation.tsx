import { CannabisLeafIcon } from "@/components/AgeVerificationGate";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Camera,
  Compass,
  Heart,
  Home,
  MessageCircle,
  ShieldCheck,
  Users,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Feed", path: "/feed", Icon: Home },
  { label: "Stories", path: "/stories", Icon: Camera },
  { label: "Explore", path: "/explore", Icon: Compass },
  { label: "Groups", path: "/groups", Icon: Users },
  { label: "Messages", path: "/messages", Icon: MessageCircle },
  { label: "Donate", path: "/donate", Icon: Heart },
];

export function Navigation() {
  const { profile } = useProfile();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const items = profile?.isAdmin
    ? [...NAV_ITEMS, { label: "Admin", path: "/admin", Icon: ShieldCheck }]
    : NAV_ITEMS;

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-56 bg-card border-r border-border min-h-screen sticky top-14 self-start"
        data-ocid="nav-sidebar"
      >
        {/* Logo area for sidebar */}
        <div className="px-4 py-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <CannabisLeafIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-primary text-base">
              420 Social
            </span>
          </div>
        </div>

        <nav
          className="flex-1 px-3 py-4 space-y-1"
          aria-label="Main navigation"
        >
          {items.map(({ label, path, Icon }) => {
            const isActive = currentPath.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-sm transition-smooth",
                  isActive
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
                data-ocid={`nav-${label.toLowerCase()}`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isActive && "text-primary",
                  )}
                />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border"
        aria-label="Main navigation"
        data-ocid="nav-bottom"
      >
        <div className="flex items-center justify-around h-16 px-2 safe-bottom">
          {items.slice(0, 6).map(({ label, path, Icon }) => {
            const isActive = currentPath.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-smooth min-w-0",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
                data-ocid={`nav-mobile-${label.toLowerCase()}`}
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
              >
                <Icon
                  className={cn(
                    "w-6 h-6",
                    isActive &&
                      "drop-shadow-[0_0_6px_oklch(0.65_0.19_142/0.6)]",
                  )}
                />
                <span className="text-[10px] font-body font-medium truncate">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
