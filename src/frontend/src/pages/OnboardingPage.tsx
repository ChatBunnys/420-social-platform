import { CannabisLeafIcon } from "@/components/AgeVerificationGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useBackend } from "@/hooks/useBackend";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export default function OnboardingPage() {
  const { principal } = useAuth();
  const { actor } = useBackend();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actor || !principal) return;

    const trimmed = username.trim();
    if (trimmed.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError("Username can only contain letters, numbers, and underscores.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await actor.registerUser(trimmed, bio.trim(), null);
      if (result.__kind__ === "err") {
        setError(result.err);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["profile"] });
        navigate({ to: "/feed" });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center px-4"
      data-ocid="onboarding-page"
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary mx-auto mb-4 flex items-center justify-center">
            <CannabisLeafIcon className="w-9 h-9 text-primary-foreground" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-1">
            Set Up Your Profile
          </h1>
          <p className="text-muted-foreground text-sm font-body">
            Welcome to 420 Social! Choose your username to get started.
          </p>
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-sm font-body font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Username <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-body text-sm">
                  @
                </span>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your_username"
                  className="pl-7 bg-background border-input font-body"
                  maxLength={32}
                  required
                  data-ocid="onboarding-username"
                />
              </div>
              <p className="text-muted-foreground/60 text-xs font-body">
                Letters, numbers, underscores only. Min 3 characters.
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="bio"
                className="text-sm font-body font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Bio{" "}
                <span className="text-muted-foreground/40 font-normal text-xs normal-case">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the community about yourself..."
                className="bg-background border-input font-body resize-none"
                rows={3}
                maxLength={200}
                data-ocid="onboarding-bio"
              />
              <p className="text-muted-foreground/40 text-xs font-body text-right">
                {bio.length}/200
              </p>
            </div>

            {error && (
              <div className="px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-destructive text-sm font-body">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !username.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold text-sm uppercase tracking-widest py-3 rounded-xl transition-smooth"
              data-ocid="onboarding-submit"
            >
              {isSubmitting ? "Creating Profile..." : "Join 420 Social 🌿"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
