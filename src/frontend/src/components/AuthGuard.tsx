import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  requireProfile?: boolean;
}

export function AuthGuard({ children, requireProfile = true }: AuthGuardProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, hasProfile } = useProfile();

  const isLoading =
    authLoading || (isAuthenticated && profileLoading && profile === null);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        data-ocid="auth-loading"
      >
        <div className="space-y-4 w-full max-w-sm px-6">
          <Skeleton className="h-12 w-full rounded-xl bg-muted" />
          <Skeleton className="h-4 w-3/4 rounded-lg bg-muted" />
          <Skeleton className="h-4 w-1/2 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requireProfile && !profileLoading && !hasProfile) {
    return <Navigate to="/onboarding" />;
  }

  return <>{children}</>;
}
