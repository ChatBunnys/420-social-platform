import { CannabisLeafIcon } from "@/components/AgeVerificationGate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Link } from "@tanstack/react-router";
import { LogOut, Settings, User } from "lucide-react";

export function Header() {
  const { isAuthenticated, logout } = useAuth();
  const { profile } = useProfile();

  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : "??";

  return (
    <header
      className="sticky top-0 z-50 bg-card border-b border-border shadow-sm"
      data-ocid="header"
    >
      <div className="flex items-center justify-between h-14 px-4 max-w-6xl mx-auto">
        {/* Brand */}
        <Link
          to="/feed"
          className="flex items-center gap-2 group"
          aria-label="420 Social home"
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary/90 transition-smooth">
            <CannabisLeafIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-primary leading-none hidden sm:block">
            420 Social
          </span>
        </Link>

        {/* Right side */}
        {isAuthenticated && profile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="User menu"
                data-ocid="header-user-menu"
              >
                <Avatar className="w-8 h-8 border border-primary/30">
                  <AvatarImage src={profile.avatarUrl} alt={profile.username} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-body text-foreground hidden md:block max-w-24 truncate">
                  @{profile.username}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-popover border-border"
            >
              <DropdownMenuItem asChild>
                <Link
                  to="/profile/$userId"
                  params={{ userId: profile.id.toText() }}
                  className="flex items-center gap-2 cursor-pointer"
                  data-ocid="header-profile-link"
                >
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/settings"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              {profile.isAdmin && (
                <>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild>
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 cursor-pointer text-secondary"
                    >
                      <span>⚡</span>
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={logout}
                className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                data-ocid="header-logout"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  );
}
