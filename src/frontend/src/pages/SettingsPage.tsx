import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useBackend } from "@/hooks/useBackend";
import { useProfile } from "@/hooks/useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, LogOut, Save, Shield } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const MAX_BIO = 200;

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}

function SettingsContent() {
  const { profile, isLoading: profileLoading, refetch } = useProfile();
  const { actor, isLoading: actorLoading } = useBackend();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize form once profile loads
  if (profile && !initialized) {
    setUsername(profile.username);
    setBio(profile.bio);
    setInitialized(true);
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!actor) return;
    const trimmed = username.trim();
    if (trimmed.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    if (bio.length > MAX_BIO) {
      toast.error(`Bio must be ${MAX_BIO} characters or less`);
      return;
    }

    setIsSaving(true);
    try {
      // Use preview (data URL) if new avatar was selected, otherwise keep existing
      const avatarUrl: string | null =
        avatarPreview ?? profile?.avatarUrl ?? null;
      const result = await actor.updateProfile(trimmed, bio.trim(), avatarUrl);
      if (result.__kind__ === "err") throw new Error(result.err);
      toast.success("Profile updated!");
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save profile",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  if (profileLoading || actorLoading) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-40 rounded-lg bg-muted" />
          <Skeleton className="h-48 w-full rounded-2xl bg-muted" />
          <Skeleton className="h-32 w-full rounded-2xl bg-muted" />
        </div>
      </Layout>
    );
  }

  const currentAvatarUrl = avatarPreview ?? profile?.avatarUrl;
  const initials = (username || profile?.username || "??")
    .slice(0, 2)
    .toUpperCase();
  const bioLength = bio.length;
  const bioNearLimit = bioLength > MAX_BIO - 20;

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-6" data-ocid="settings-page">
        <h1 className="font-display font-bold text-2xl text-foreground mb-6">
          Settings
        </h1>

        {/* Profile card */}
        <Card className="bg-card border-border rounded-2xl p-6 mb-4">
          <h2 className="font-display font-semibold text-base text-foreground mb-5 flex items-center gap-2">
            <Shield size={16} className="text-primary" />
            Edit Profile
          </h2>

          {/* Avatar upload */}
          <div className="flex flex-col items-center mb-6">
            <button
              type="button"
              className="relative group cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change avatar photo"
            >
              <Avatar className="w-24 h-24 ring-3 ring-primary ring-offset-2 ring-offset-background">
                <AvatarImage src={currentAvatarUrl} alt={username} />
                <AvatarFallback className="bg-primary/20 text-primary font-display font-bold text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                <Camera size={22} className="text-foreground" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              data-ocid="settings-avatar-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-primary text-sm font-body mt-2 hover:text-primary/80 transition-smooth"
              data-ocid="settings-avatar-btn"
            >
              Change photo
            </button>
            {avatarFile && (
              <p className="text-muted-foreground text-xs mt-1 font-body">
                {avatarFile.name} — ready to save
              </p>
            )}
          </div>

          {/* Username */}
          <div className="space-y-1.5 mb-4">
            <Label
              htmlFor="username"
              className="text-foreground font-body text-sm font-medium"
            >
              Username <span className="text-destructive">*</span>
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              minLength={3}
              maxLength={30}
              className="bg-background border-input focus:border-primary transition-smooth"
              data-ocid="settings-username-input"
            />
            {username.trim().length > 0 && username.trim().length < 3 && (
              <p className="text-destructive text-xs font-body">
                Minimum 3 characters
              </p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-1.5 mb-6">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="bio"
                className="text-foreground font-body text-sm font-medium"
              >
                Bio
              </Label>
              <span
                className={`text-xs font-mono transition-smooth ${
                  bioNearLimit
                    ? bioLength > MAX_BIO
                      ? "text-destructive"
                      : "text-yellow-500"
                    : "text-muted-foreground"
                }`}
              >
                {bioLength}/{MAX_BIO}
              </span>
            </div>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community about yourself…"
              rows={3}
              className="bg-background border-input focus:border-primary resize-none transition-smooth"
              data-ocid="settings-bio-input"
            />
          </div>

          <Button
            type="button"
            disabled={
              isSaving || username.trim().length < 3 || bioLength > MAX_BIO
            }
            onClick={handleSave}
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth font-display font-semibold"
            data-ocid="settings-save-btn"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Saving…
              </span>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </Button>
        </Card>

        {/* Danger zone */}
        <Card
          className="bg-card border border-destructive/30 rounded-2xl p-6"
          data-ocid="settings-danger-zone"
        >
          <h2 className="font-display font-semibold text-base text-destructive mb-1 flex items-center gap-2">
            <LogOut size={16} />
            Danger Zone
          </h2>
          <p className="text-muted-foreground text-sm font-body mb-4">
            Log out of your account on this device.
          </p>
          <Separator className="bg-border mb-4" />
          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive transition-smooth"
            data-ocid="settings-logout-btn"
          >
            <LogOut size={14} />
            Log Out
          </Button>
        </Card>
      </div>
    </Layout>
  );
}
