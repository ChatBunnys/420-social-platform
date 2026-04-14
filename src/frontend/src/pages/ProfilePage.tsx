import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useBackend } from "@/hooks/useBackend";
import type { Post, UserProfile } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
  Check,
  Grid3X3,
  MessageCircle,
  Settings,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function StatBox({ label, value }: { label: string; value: number | bigint }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-primary font-display font-bold text-xl leading-none">
        {Number(value)}
      </span>
      <span className="text-muted-foreground text-xs font-body">{label}</span>
    </div>
  );
}

function PostThumbnail({ post }: { post: Post }) {
  const timeAgo = (ts: bigint) => {
    const diff = Date.now() - Number(ts) / 1_000_000;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <Link
      to="/feed"
      className="group block rounded-xl overflow-hidden bg-card border border-border hover:border-primary/40 transition-smooth"
      data-ocid="profile-post-item"
    >
      {post.imageUrl ? (
        <div className="aspect-square relative overflow-hidden">
          <img
            src={post.imageUrl}
            alt="Post"
            className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
          />
          <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-smooth" />
        </div>
      ) : (
        <div className="aspect-square flex items-center justify-center p-3 bg-muted/30">
          <p className="text-foreground/80 text-xs font-body line-clamp-4 text-center leading-relaxed">
            {post.content}
          </p>
        </div>
      )}
      <div className="px-2.5 py-1.5 flex items-center justify-between">
        <span className="text-muted-foreground text-[10px] font-body">
          {timeAgo(post.createdAt)}
        </span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-0.5 text-primary text-[10px]">
            <MessageCircle size={10} /> {Number(post.commentCount)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6 px-4 py-6">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="w-24 h-24 rounded-full bg-muted" />
        <Skeleton className="h-5 w-32 rounded-lg bg-muted" />
        <Skeleton className="h-4 w-48 rounded-lg bg-muted" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="aspect-square rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent() {
  const { userId } = useParams({ from: "/profile/$userId" });
  const { actor, isLoading: actorLoading } = useBackend();
  const { principal } = useAuth();
  const queryClient = useQueryClient();

  const [optimisticFollowing, setOptimisticFollowing] = useState<
    boolean | null
  >(null);

  const isOwnProfile = principal?.toText() === userId;

  const { data: profile, isLoading: profileLoading } =
    useQuery<UserProfile | null>({
      queryKey: ["profile", userId],
      queryFn: async () => {
        if (!actor) return null;
        const { Principal } = await import("@icp-sdk/core/principal");
        return actor.getUserProfile(Principal.fromText(userId));
      },
      enabled: !!actor && !actorLoading,
      staleTime: 30_000,
    });

  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["user-posts", userId],
    queryFn: async () => {
      if (!actor) return [];
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.getUserPosts(
        Principal.fromText(userId),
        BigInt(24),
        BigInt(0),
      );
    },
    enabled: !!actor && !actorLoading,
    staleTime: 30_000,
  });

  const { data: isFollowingData } = useQuery<boolean>({
    queryKey: ["is-following", principal?.toText(), userId],
    queryFn: async () => {
      if (!actor || !principal || isOwnProfile) return false;
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.isFollowing(principal, Principal.fromText(userId));
    },
    enabled: !!actor && !actorLoading && !!principal && !isOwnProfile,
    staleTime: 15_000,
  });

  const isFollowing = optimisticFollowing ?? isFollowingData ?? false;

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.followUser(Principal.fromText(userId));
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onMutate: () => setOptimisticFollowing(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["is-following"] });
      toast.success("Following!");
    },
    onError: (err) => {
      setOptimisticFollowing(null);
      toast.error(err instanceof Error ? err.message : "Failed to follow");
    },
    onSettled: () => setOptimisticFollowing(null),
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.unfollowUser(Principal.fromText(userId));
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onMutate: () => setOptimisticFollowing(false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["is-following"] });
      toast.success("Unfollowed");
    },
    onError: (err) => {
      setOptimisticFollowing(null);
      toast.error(err instanceof Error ? err.message : "Failed to unfollow");
    },
    onSettled: () => setOptimisticFollowing(null),
  });

  const isLoading = profileLoading || actorLoading;

  if (isLoading) {
    return (
      <Layout>
        <ProfileSkeleton />
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <p className="text-6xl mb-4">🌿</p>
          <p className="text-foreground font-display font-semibold text-lg">
            User not found
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            This profile doesn't exist.
          </p>
        </div>
      </Layout>
    );
  }

  const initials = profile.username.slice(0, 2).toUpperCase();
  const isMutating = followMutation.isPending || unfollowMutation.isPending;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6" data-ocid="profile-page">
        {/* Profile header */}
        <Card className="bg-card border-border rounded-2xl p-6 mb-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full ring-3 ring-primary ring-offset-2 ring-offset-background">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.avatarUrl} alt={profile.username} />
                  <AvatarFallback className="bg-primary/20 text-primary font-display font-bold text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              {profile.isAdmin && (
                <div className="absolute -bottom-1 -right-1">
                  <Badge className="text-[9px] px-1.5 py-0.5 bg-primary text-primary-foreground">
                    Admin
                  </Badge>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h1 className="font-display font-bold text-2xl text-foreground truncate">
                  @{profile.username}
                </h1>
                {profile.isSuspended && (
                  <Badge
                    variant="destructive"
                    className="self-center sm:self-auto text-xs"
                  >
                    Suspended
                  </Badge>
                )}
              </div>

              {profile.bio && (
                <p className="text-muted-foreground font-body text-sm mb-3 break-words line-clamp-3">
                  {profile.bio}
                </p>
              )}

              {/* Stats row */}
              <div className="flex items-center justify-center sm:justify-start gap-6 mb-4">
                <StatBox label="Posts" value={profile.postCount} />
                <div className="w-px h-8 bg-border" />
                <StatBox label="Followers" value={profile.followerCount} />
                <div className="w-px h-8 bg-border" />
                <StatBox label="Following" value={profile.followingCount} />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-center sm:justify-start gap-2">
                {isOwnProfile ? (
                  <Link to="/settings">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 border-border hover:border-primary/50 transition-smooth"
                      data-ocid="profile-edit-btn"
                    >
                      <Settings size={14} />
                      Edit Profile
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isMutating}
                      onClick={() =>
                        isFollowing
                          ? unfollowMutation.mutate()
                          : followMutation.mutate()
                      }
                      className={
                        isFollowing
                          ? "gap-2 bg-muted text-muted-foreground border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 transition-smooth"
                          : "gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth"
                      }
                      data-ocid="profile-follow-btn"
                    >
                      {isFollowing ? (
                        <>
                          <Check size={14} /> Following
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} /> Follow
                        </>
                      )}
                    </Button>
                    <Link to="/messages/$userId" params={{ userId }}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 border-border hover:border-primary/50 transition-smooth"
                        data-ocid="profile-message-btn"
                      >
                        <MessageCircle size={14} />
                        Message
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Posts grid */}
        <div className="mb-3 flex items-center gap-2">
          <Grid3X3 size={16} className="text-muted-foreground" />
          <span className="font-display font-semibold text-sm text-foreground">
            Posts
          </span>
        </div>

        {postsLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-xl bg-muted" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-2xl"
            data-ocid="profile-empty-posts"
          >
            <p className="text-4xl mb-3">🌱</p>
            <p className="text-foreground font-display font-semibold">
              No posts yet
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {isOwnProfile
                ? "Share your first post!"
                : "Nothing posted here yet."}
            </p>
            {isOwnProfile && (
              <Link to="/feed" className="mt-3">
                <Button
                  type="button"
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth"
                >
                  Create Post
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div
            className="grid grid-cols-3 gap-2"
            data-ocid="profile-posts-grid"
          >
            {posts
              .filter((p) => !p.isDeleted)
              .map((post) => (
                <PostThumbnail key={post.id} post={post} />
              ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
