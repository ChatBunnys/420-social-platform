import { CannabisLeafIcon } from "@/components/AgeVerificationGate";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Navigate } from "@tanstack/react-router";

export default function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const { hasProfile, isLoading: profileLoading } = useProfile();

  if (isAuthenticated && !profileLoading) {
    return hasProfile ? <Navigate to="/feed" /> : <Navigate to="/onboarding" />;
  }

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center px-4"
      data-ocid="login-page"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.65 0.19 142 / 0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-2xl bg-primary mx-auto mb-4 flex items-center justify-center shadow-[0_0_40px_oklch(0.65_0.19_142/0.4)]">
            <CannabisLeafIcon className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="font-display font-bold text-3xl text-foreground mb-1">
            420 Social
          </h1>
          <p className="text-muted-foreground text-sm font-body">
            The premium cannabis community platform
          </p>
        </div>

        {/* Login card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <h2 className="font-display font-bold text-xl text-foreground mb-2 text-center">
            Welcome Back
          </h2>
          <p className="text-muted-foreground text-sm font-body text-center mb-6 leading-relaxed">
            Sign in with Internet Identity to join the community. Your identity
            is private and secure.
          </p>

          <Button
            onClick={login}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold text-sm uppercase tracking-widest py-3 rounded-xl transition-smooth"
            data-ocid="login-btn"
          >
            {isLoading ? "Connecting..." : "Sign In with Internet Identity"}
          </Button>

          <p className="text-muted-foreground/50 text-xs text-center mt-4 leading-relaxed">
            New to Internet Identity?{" "}
            <a
              href="https://identity.ic0.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/70 hover:text-primary transition-smooth"
            >
              Create an anchor
            </a>
          </p>
        </div>

        {/* Tagline */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-4 text-muted-foreground/30 text-xs font-body">
            <span>🌿 Strain Reviews</span>
            <span>•</span>
            <span>📖 Culture & News</span>
            <span>•</span>
            <span>👥 Community</span>
          </div>
        </div>
      </div>
    </div>
  );
}
