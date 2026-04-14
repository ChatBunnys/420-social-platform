import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useBackend } from "@/hooks/useBackend";
import type { Post, User } from "@/types/index";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Heart,
  MessageCircle,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(ts: bigint): string {
  const diff = Date.now() - Number(ts / 1_000_000n);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function avatarInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

// ─── Post Card ────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: Post;
  author?: User | null;
  isLiked: boolean;
  onLike: () => void;
  onOpen: () => void;
  rank?: number;
}

function PostCard({
  post,
  author,
  isLiked,
  onLike,
  onOpen,
  rank,
}: PostCardProps) {
  return (
    <article
      className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-smooth group"
      data-ocid={`explore-post-${post.id}`}
    >
      {post.imageUrl && (
        <button
          type="button"
          onClick={onOpen}
          className="relative w-full h-48 overflow-hidden block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <img
            src={post.imageUrl}
            alt="Post"
            className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
          />
          {rank !== undefined && (
            <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm rounded-full w-7 h-7 flex items-center justify-center">
              <span className="text-xs font-display font-bold text-primary">
                #{rank + 1}
              </span>
            </div>
          )}
        </button>
      )}
      <div className="p-4">
        <button
          type="button"
          onClick={onOpen}
          className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <Avatar className="w-8 h-8 border border-border/60">
              <AvatarImage src={author?.avatarUrl} />
              <AvatarFallback className="bg-muted text-xs font-display">
                {author ? avatarInitials(author.username) : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-display font-semibold text-foreground truncate">
                {author?.username ?? "Loading…"}
              </p>
              <p className="text-xs text-muted-foreground">
                {timeAgo(post.createdAt)}
              </p>
            </div>
            {!post.imageUrl && rank !== undefined && (
              <Badge
                variant="secondary"
                className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20"
              >
                #{rank + 1}
              </Badge>
            )}
          </div>
          <p className="text-sm text-foreground/90 font-body line-clamp-3 mb-3 leading-relaxed">
            {post.content}
          </p>
        </button>
        <div className="flex items-center gap-4 pt-2 border-t border-border/50">
          <button
            type="button"
            className={`flex items-center gap-1.5 text-sm transition-smooth ${isLiked ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            onClick={onLike}
            data-ocid={`like-post-${post.id}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-primary" : ""}`} />
            <span>{Number(post.likeCount)}</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-smooth"
            onClick={onOpen}
            data-ocid={`comments-post-${post.id}`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{Number(post.commentCount)}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Post Modal ───────────────────────────────────────────────────────────────

interface PostModalProps {
  post: Post | null;
  author?: User | null;
  isLiked: boolean;
  onLike: () => void;
  onClose: () => void;
  onReport: (postId: string) => void;
}

function PostModal({
  post,
  author,
  isLiked,
  onLike,
  onClose,
  onReport,
}: PostModalProps) {
  const { actor } = useBackend();
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", post?.id],
    queryFn: async () => (post && actor ? actor.getComments(post.id) : []),
    enabled: !!post && !!actor,
  });

  if (!post) return null;

  return (
    <Dialog open={!!post} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="sr-only">Post detail</DialogTitle>
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 border border-border/60">
              <AvatarImage src={author?.avatarUrl} />
              <AvatarFallback className="bg-muted text-xs font-display">
                {author ? avatarInitials(author.username) : "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-display font-semibold text-sm text-foreground">
                {author?.username ?? ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {timeAgo(post.createdAt)}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-5 py-3">
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt="Post"
              className="w-full rounded-xl mb-3 object-cover max-h-72"
            />
          )}
          <p className="text-sm text-foreground/90 font-body leading-relaxed mb-4">
            {post.content}
          </p>
          <div className="flex items-center gap-4 pb-3 border-b border-border/50">
            <button
              type="button"
              className={`flex items-center gap-1.5 text-sm transition-smooth ${isLiked ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
              onClick={onLike}
              data-ocid="modal-like-btn"
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-primary" : ""}`} />
              <span>{Number(post.likeCount)} likes</span>
            </button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-destructive transition-smooth ml-auto"
              onClick={() => onReport(post.id)}
              data-ocid="report-post-btn"
            >
              Report
            </button>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-3">
          <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">
            Comments ({Number(post.commentCount)})
          </p>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl bg-muted" />
              ))}
            </div>
          ) : comments.filter((c) => !c.isDeleted).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No comments yet. Be the first! 🌿
            </p>
          ) : (
            <div className="space-y-2">
              {comments
                .filter((c) => !c.isDeleted)
                .map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-background rounded-xl px-3 py-2.5"
                  >
                    <p className="text-xs font-display font-semibold text-foreground/80 mb-0.5">
                      {comment.authorId.toText().slice(0, 8)}…
                    </p>
                    <p className="text-sm text-foreground/90 font-body">
                      {comment.content}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── People Card ──────────────────────────────────────────────────────────────

interface PeopleCardProps {
  user: User;
  isFollowing: boolean;
  onFollow: () => void;
  onNavigate: () => void;
}

function PeopleCard({
  user,
  isFollowing,
  onFollow,
  onNavigate,
}: PeopleCardProps) {
  return (
    <div
      className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 hover:border-primary/30 transition-smooth"
      data-ocid={`people-card-${user.id.toText().slice(0, 8)}`}
    >
      <button
        type="button"
        className="flex items-center gap-3 w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
        onClick={onNavigate}
      >
        <Avatar className="w-11 h-11 border border-primary/20">
          <AvatarImage src={user.avatarUrl} />
          <AvatarFallback className="bg-primary/10 text-primary font-display font-bold text-sm">
            {avatarInitials(user.username)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-sm text-foreground truncate">
            @{user.username}
          </p>
          {user.bio && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {user.bio}
            </p>
          )}
        </div>
      </button>
      <Button
        type="button"
        size="sm"
        variant={isFollowing ? "outline" : "default"}
        className={`w-full text-xs h-8 rounded-xl font-display font-semibold transition-smooth ${isFollowing ? "border-primary/30 text-primary" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
        onClick={onFollow}
        data-ocid={`follow-btn-${user.id.toText().slice(0, 8)}`}
      >
        {isFollowing ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Follow
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function PostSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <Skeleton className="w-8 h-8 rounded-full bg-muted" />
        <div className="space-y-1 flex-1">
          <Skeleton className="h-3 w-24 rounded bg-muted" />
          <Skeleton className="h-2.5 w-14 rounded bg-muted" />
        </div>
      </div>
      <Skeleton className="h-4 w-full rounded bg-muted" />
      <Skeleton className="h-4 w-2/3 rounded bg-muted" />
      <div className="flex gap-4 pt-1">
        <Skeleton className="h-3 w-12 rounded bg-muted" />
        <Skeleton className="h-3 w-12 rounded bg-muted" />
      </div>
    </div>
  );
}

function PeopleSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-11 h-11 rounded-full bg-muted" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-20 rounded bg-muted" />
          <Skeleton className="h-2.5 w-32 rounded bg-muted" />
        </div>
      </div>
      <Skeleton className="h-8 w-full rounded-xl bg-muted" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "trending" | "people";

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<Tab>("trending");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  const { actor, isLoading: actorLoading } = useBackend();
  const { principal } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ─ Trending posts
  const { data: explorePosts = [], isLoading: postsLoading } = useQuery<Post[]>(
    {
      queryKey: ["explore-posts"],
      queryFn: async () => {
        if (!actor) return [];
        return actor.getExplorePosts(20n, 0n);
      },
      enabled: !!actor && !actorLoading,
    },
  );

  // ─ All users for people tab
  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["all-users"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !actorLoading,
  });

  // ─ Author cache: unique authorIds across posts
  const authorIds = [...new Set(explorePosts.map((p) => p.authorId.toText()))];
  const { data: authorMap = {} } = useQuery<Record<string, User>>({
    queryKey: ["explore-authors", authorIds.join(",")],
    queryFn: async () => {
      if (!actor || authorIds.length === 0) return {};
      const results = await Promise.all(
        authorIds.map(async (idStr) => {
          const post = explorePosts.find((p) => p.authorId.toText() === idStr);
          if (!post) return null;
          const user = await actor.getUser(post.authorId);
          return user ? ([idStr, user] as [string, User]) : null;
        }),
      );
      return Object.fromEntries(
        results.filter((r): r is [string, User] => r !== null),
      );
    },
    enabled: !!actor && authorIds.length > 0,
  });

  // ─ Suggested people: users that aren't the current user
  const suggestedUsers = allUsers
    .filter((u) => u.id.toText() !== (principal?.toText() ?? ""))
    .slice(0, 12);

  // ─ Like handler
  async function handleLike(post: Post) {
    if (!actor) return;
    const postId = post.id;
    const alreadyLiked = likedPosts.has(postId);
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (alreadyLiked) next.delete(postId);
      else next.add(postId);
      return next;
    });
    try {
      if (alreadyLiked) await actor.unlikePost(postId);
      else await actor.likePost(postId);
      queryClient.invalidateQueries({ queryKey: ["explore-posts"] });
    } catch {
      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (alreadyLiked) next.add(postId);
        else next.delete(postId);
        return next;
      });
    }
  }

  // ─ Follow handler
  async function handleFollow(user: User) {
    if (!actor) return;
    const userId = user.id.toText();
    const alreadyFollowing = followingUsers.has(userId);
    setFollowingUsers((prev) => {
      const next = new Set(prev);
      if (alreadyFollowing) next.delete(userId);
      else next.add(userId);
      return next;
    });
    try {
      if (alreadyFollowing) await actor.unfollowUser(user.id);
      else await actor.followUser(user.id);
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    } catch {
      setFollowingUsers((prev) => {
        const next = new Set(prev);
        if (alreadyFollowing) next.add(userId);
        else next.delete(userId);
        return next;
      });
    }
  }

  // ─ Report handler
  async function handleReport(postId: string) {
    if (!actor) return;
    await actor.reportContent("post", postId, "inappropriate", null);
    setSelectedPost(null);
  }

  const tabs: { id: Tab; label: string; icon: typeof TrendingUp }[] = [
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "people", label: "People", icon: Users },
  ];

  const isLoading =
    actorLoading || (activeTab === "trending" ? postsLoading : usersLoading);

  return (
    <AuthGuard>
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-6" data-ocid="explore-page">
          {/* Header */}
          <div className="mb-5">
            <h2 className="font-display font-bold text-2xl text-foreground">
              Explore
            </h2>
            <p className="text-sm text-muted-foreground font-body mt-0.5">
              Discover trending posts and new people 🌿
            </p>
          </div>

          {/* Tabs */}
          <div
            className="flex gap-1 bg-card border border-border rounded-2xl p-1 mb-6"
            data-ocid="explore-tabs"
          >
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-display font-semibold transition-smooth ${
                  activeTab === id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                data-ocid={`tab-${id}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Trending Tab */}
          {activeTab === "trending" && (
            <div data-ocid="trending-section">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <PostSkeleton key={i} />
                  ))}
                </div>
              ) : explorePosts.filter((p) => !p.isDeleted).length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-16 text-center"
                  data-ocid="trending-empty"
                >
                  <span className="text-5xl mb-4">🔥</span>
                  <p className="font-display font-semibold text-foreground mb-1">
                    No trending posts yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Be the first to post and get likes!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {explorePosts
                    .filter((p) => !p.isDeleted)
                    .map((post, index) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        author={authorMap[post.authorId.toText()] ?? null}
                        isLiked={likedPosts.has(post.id)}
                        onLike={() => handleLike(post)}
                        onOpen={() => setSelectedPost(post)}
                        rank={index}
                      />
                    ))}
                </div>
              )}
            </div>
          )}

          {/* People Tab */}
          {activeTab === "people" && (
            <div data-ocid="people-section">
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <PeopleSkeleton key={i} />
                  ))}
                </div>
              ) : suggestedUsers.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-16 text-center"
                  data-ocid="people-empty"
                >
                  <span className="text-5xl mb-4">👥</span>
                  <p className="font-display font-semibold text-foreground mb-1">
                    No users to discover yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Invite your friends to the community!
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Suggested for you
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {suggestedUsers.map((user) => (
                      <PeopleCard
                        key={user.id.toText()}
                        user={user}
                        isFollowing={followingUsers.has(user.id.toText())}
                        onFollow={() => handleFollow(user)}
                        onNavigate={() =>
                          navigate({
                            to: "/profile/$userId",
                            params: { userId: user.id.toText() },
                          })
                        }
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Post Detail Modal */}
        <PostModal
          post={selectedPost}
          author={
            selectedPost
              ? (authorMap[selectedPost.authorId.toText()] ?? null)
              : null
          }
          isLiked={selectedPost ? likedPosts.has(selectedPost.id) : false}
          onLike={() => selectedPost && handleLike(selectedPost)}
          onClose={() => setSelectedPost(null)}
          onReport={handleReport}
        />
      </Layout>
    </AuthGuard>
  );
}
