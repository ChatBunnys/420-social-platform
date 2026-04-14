import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useBackend } from "@/hooks/useBackend";
import type { Group, GroupPost, User } from "@/types";
import type { Principal } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Image,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Strains: "bg-primary/20 text-primary border-primary/30",
  Culture:
    "bg-[oklch(0.55_0.2_310)]/20 text-[oklch(0.72_0.18_310)] border-[oklch(0.55_0.2_310)]/30",
  Advocacy:
    "bg-[oklch(0.65_0.2_60)]/20 text-[oklch(0.78_0.18_60)] border-[oklch(0.65_0.2_60)]/30",
  News: "bg-[oklch(0.55_0.2_255)]/20 text-[oklch(0.7_0.18_255)] border-[oklch(0.55_0.2_255)]/30",
};

function CategoryBadge({ category }: { category: string }) {
  const classes =
    CATEGORY_COLORS[category] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={`inline-flex items-center text-xs font-body font-medium px-2 py-0.5 rounded-full border ${classes}`}
    >
      {category}
    </span>
  );
}

function formatTime(ts: bigint) {
  const ms = Number(ts) / 1_000_000;
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ms).toLocaleDateString();
}

function avatarInitials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

// ─── Post Card ───────────────────────────────────────────────────────────────

function GroupPostCard({
  post,
  author,
  canDelete,
  onDelete,
}: {
  post: GroupPost;
  author?: User | null;
  canDelete: boolean;
  onDelete: (id: string) => void;
}) {
  const initials = author ? avatarInitials(author.username) : "??";

  return (
    <div
      className="bg-card border border-border rounded-2xl p-4 space-y-3"
      data-ocid="group-post-card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            {author?.avatarUrl ? (
              <img
                src={author.avatarUrl}
                alt={author.username}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <span className="text-xs font-display font-bold text-primary">
                {initials}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-display font-semibold text-foreground">
              {author?.username ?? "Unknown"}
            </p>
            <p className="text-xs text-muted-foreground font-body">
              {formatTime(post.createdAt)}
            </p>
          </div>
        </div>
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(post.id)}
            aria-label="Delete post"
            data-ocid="delete-group-post-btn"
          >
            <Trash2 size={14} />
          </Button>
        )}
      </div>

      <p className="text-sm text-foreground font-body leading-relaxed">
        {post.content}
      </p>

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Post attachment"
          className="w-full rounded-xl object-cover max-h-64"
        />
      )}
    </div>
  );
}

// ─── Create Post ─────────────────────────────────────────────────────────────

function CreateGroupPost({
  groupId,
  isMember,
}: {
  groupId: string;
  isMember: boolean;
}) {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageUrl, setShowImageUrl] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const res = await actor.createGroupPost(
        groupId,
        content,
        imageUrl.trim() || null,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupPosts", groupId] });
      setContent("");
      setImageUrl("");
      setShowImageUrl(false);
      toast.success("Post shared!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!isMember) {
    return (
      <div
        className="bg-card border border-border rounded-2xl p-5 text-center"
        data-ocid="join-to-post"
      >
        <p className="text-sm text-muted-foreground font-body">
          <span className="text-foreground font-semibold">Join this group</span>{" "}
          to post and participate
        </p>
      </div>
    );
  }

  return (
    <div
      className="bg-card border border-border rounded-2xl p-4 space-y-3"
      data-ocid="create-group-post"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share something with the group..."
        rows={3}
        className="w-full bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground text-sm px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-ring font-body"
        data-ocid="group-post-content-input"
      />

      {showImageUrl && (
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Paste image URL..."
          className="w-full bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring font-body"
          data-ocid="group-post-image-input"
        />
      )}

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground gap-1.5"
          onClick={() => setShowImageUrl((v) => !v)}
          data-ocid="toggle-image-url-btn"
        >
          <Image size={15} />
          {showImageUrl ? "Remove image" : "Add image"}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={mutation.isPending || !content.trim()}
          onClick={() => mutation.mutate()}
          className="gap-1.5"
          data-ocid="submit-group-post-btn"
        >
          <Send size={13} />
          {mutation.isPending ? "Posting..." : "Post"}
        </Button>
      </div>
    </div>
  );
}

// ─── Member Avatars ───────────────────────────────────────────────────────────

function MemberAvatars({
  members,
  total,
  users,
}: {
  members: Principal[];
  total: bigint;
  users: Map<string, User>;
}) {
  const visible = members.slice(0, 7);

  return (
    <div className="flex items-center gap-2" data-ocid="member-avatars">
      <div className="flex -space-x-2">
        {visible.map((p) => {
          const key = p.toString();
          const user = users.get(key);
          const initials = user ? avatarInitials(user.username) : "?";
          return (
            <div
              key={key}
              className="w-8 h-8 rounded-full border-2 border-card bg-primary/20 flex items-center justify-center shrink-0"
              title={user?.username}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-[10px] font-display font-bold text-primary">
                  {initials}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <span className="text-xs text-muted-foreground font-body">
        {total.toString()} {Number(total) === 1 ? "member" : "members"}
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GroupDetailPage() {
  const { groupId } = useParams({ from: "/groups/$groupId" });
  const { actor, isLoading: actorLoading } = useBackend();
  const { principal, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Group data
  const { data: group, isLoading: groupLoading } = useQuery<Group | null>({
    queryKey: ["group", groupId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getGroup(groupId);
    },
    enabled: !!actor && !actorLoading,
    staleTime: 30_000,
  });

  // Membership
  const { data: isMember = false } = useQuery<boolean>({
    queryKey: ["groupMembership", groupId],
    queryFn: async () => {
      if (!actor || !isAuthenticated) return false;
      return actor.isGroupMember(groupId);
    },
    enabled: !!actor && !actorLoading && isAuthenticated,
    staleTime: 15_000,
  });

  // Members list
  const { data: members = [] } = useQuery<Principal[]>({
    queryKey: ["groupMembers", groupId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGroupMembers(groupId);
    },
    enabled: !!actor && !actorLoading,
    staleTime: 30_000,
  });

  // Posts
  const { data: posts = [], isLoading: postsLoading } = useQuery<GroupPost[]>({
    queryKey: ["groupPosts", groupId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGroupPosts(groupId, BigInt(50), BigInt(0));
    },
    enabled: !!actor && !actorLoading,
    staleTime: 15_000,
  });

  // Fetch users for posts
  const authorIds = [...new Set(posts.map((p) => p.authorId.toString()))];
  const memberIds = members.map((p) => p.toString());
  const allIds = [...new Set([...authorIds, ...memberIds])];

  const { data: usersMap = new Map<string, User>() } = useQuery<
    Map<string, User>
  >({
    queryKey: ["groupUsers", groupId, allIds.join(",")],
    queryFn: async () => {
      if (!actor || allIds.length === 0) return new Map();
      const results = await Promise.all(
        allIds.map(async (idStr) => {
          const p =
            posts.find((p) => p.authorId.toString() === idStr)?.authorId ??
            members.find((m) => m.toString() === idStr);
          if (!p) return null;
          const user = await actor.getUser(p);
          return user ? ([idStr, user] as [string, User]) : null;
        }),
      );
      return new Map(results.filter((r): r is [string, User] => r !== null));
    },
    enabled: !!actor && allIds.length > 0,
    staleTime: 60_000,
  });

  // Join / Leave
  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const res = await actor.joinGroup(groupId);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupMembership", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groupMembers", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      toast.success("Joined group!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const res = await actor.leaveGroup(groupId);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupMembership", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groupMembers", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      toast.success("Left group.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const res = await actor.deleteGroup(groupId);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["userGroups"] });
      toast.success("Group deleted.");
      navigate({ to: "/groups" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isCreator =
    group && principal && group.creatorId.toString() === principal.toString();
  const currentUser = principal ? usersMap.get(principal.toString()) : null;
  const isAdmin = currentUser?.isAdmin ?? false;
  const canDelete = isCreator || isAdmin;

  const isLoading = groupLoading || actorLoading;

  if (isLoading) {
    return (
      <AuthGuard>
        <Layout>
          <div
            className="px-4 py-6 max-w-2xl mx-auto space-y-4"
            data-ocid="group-detail-loading"
          >
            <Skeleton className="h-6 w-40 bg-muted rounded-lg" />
            <Skeleton className="h-32 w-full bg-muted rounded-2xl" />
            <Skeleton className="h-24 w-full bg-muted rounded-2xl" />
          </div>
        </Layout>
      </AuthGuard>
    );
  }

  if (!group) {
    return (
      <AuthGuard>
        <Layout>
          <div
            className="px-4 py-16 flex flex-col items-center justify-center text-center"
            data-ocid="group-not-found"
          >
            <AlertTriangle size={40} className="text-muted-foreground mb-3" />
            <p className="font-display font-semibold text-foreground mb-1">
              Group not found
            </p>
            <p className="text-sm text-muted-foreground font-body mb-4">
              This group may have been deleted or doesn't exist.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => navigate({ to: "/groups" })}
            >
              Back to Groups
            </Button>
          </div>
        </Layout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <Layout>
        <div
          className="px-4 py-6 max-w-2xl mx-auto space-y-5"
          data-ocid="group-detail-page"
        >
          {/* Back */}
          <button
            type="button"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-smooth text-sm font-body"
            onClick={() => navigate({ to: "/groups" })}
            data-ocid="back-to-groups"
          >
            <ArrowLeft size={15} />
            Communities
          </button>

          {/* Group Header Card */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h1 className="font-display font-bold text-xl text-foreground truncate">
                    {group.name}
                  </h1>
                  <CategoryBadge category={group.category} />
                </div>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">
                  {group.description}
                </p>
              </div>
            </div>

            {/* Members row */}
            <MemberAvatars
              members={members}
              total={group.memberCount}
              users={usersMap}
            />

            {/* Actions row */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <Button
                type="button"
                size="sm"
                variant={isMember ? "outline" : "default"}
                disabled={joinMutation.isPending || leaveMutation.isPending}
                onClick={() =>
                  isMember ? leaveMutation.mutate() : joinMutation.mutate()
                }
                className="gap-1.5"
                data-ocid={
                  isMember ? "leave-group-detail-btn" : "join-group-detail-btn"
                }
              >
                <Users size={13} />
                {joinMutation.isPending || leaveMutation.isPending
                  ? "..."
                  : isMember
                    ? "Leave Group"
                    : "Join Group"}
              </Button>

              {canDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Delete this group? This cannot be undone.",
                      )
                    ) {
                      deleteMutation.mutate();
                    }
                  }}
                  className="gap-1.5"
                  data-ocid="delete-group-btn"
                >
                  <Trash2 size={13} />
                  {deleteMutation.isPending ? "Deleting..." : "Delete Group"}
                </Button>
              )}
            </div>
          </div>

          {/* Create Post */}
          <CreateGroupPost groupId={groupId} isMember={isMember} />

          {/* Posts Feed */}
          <div className="space-y-3">
            <h2 className="font-display font-semibold text-foreground text-base">
              Group Posts
            </h2>

            {postsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-9 h-9 rounded-full bg-muted" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3.5 w-24 rounded bg-muted" />
                        <Skeleton className="h-3 w-14 rounded bg-muted" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full rounded bg-muted" />
                    <Skeleton className="h-4 w-3/4 rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div
                className="bg-card border border-border rounded-2xl p-10 text-center"
                data-ocid="group-posts-empty"
              >
                <span className="text-4xl mb-3 block">🌱</span>
                <p className="font-display font-semibold text-foreground mb-1">
                  No posts yet
                </p>
                <p className="text-sm text-muted-foreground font-body">
                  {isMember
                    ? "Be the first to post in this group!"
                    : "Join the group to start the conversation"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <GroupPostCard
                    key={post.id}
                    post={post}
                    author={usersMap.get(post.authorId.toString()) ?? null}
                    canDelete={
                      isAdmin ||
                      (principal !== null &&
                        post.authorId.toString() === principal.toString())
                    }
                    onDelete={(id) => {
                      toast.info(
                        "Post deletion not supported via group posts endpoint.",
                      );
                      console.log("delete post", id);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
}
