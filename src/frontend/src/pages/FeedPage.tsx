import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useBackend } from "@/hooks/useBackend";
import type { Comment, Post } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Flag,
  Heart,
  ImagePlus,
  Leaf,
  MessageCircle,
  MoreHorizontal,
  RefreshCw,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 20n;

function timeAgo(ts: bigint): string {
  const now = Date.now();
  const created = Number(ts / 1_000_000n);
  const diff = Math.floor((now - created) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

// ─── Create Post Box ──────────────────────────────────────────────────────────

interface CreatePostBoxProps {
  username: string;
  avatarUrl?: string;
  onCreated: () => void;
}

function CreatePostBox({ username, avatarUrl, onCreated }: CreatePostBoxProps) {
  const { actor } = useBackend();
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!actor) return;
    if (!text.trim() && !imageFile) {
      toast.error("Write something or add a photo");
      return;
    }
    setUploading(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        // Convert to base64 data URL for storage
        const reader = new FileReader();
        imageUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          };
          reader.readAsDataURL(imageFile);
        });
      }
      const result = await actor.createPost(text.trim(), imageUrl);
      if (result.__kind__ === "err") throw new Error(result.err);
      setText("");
      removeImage();
      setUploadProgress(0);
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Post shared! 🌿");
      onCreated();
    } catch {
      toast.error("Failed to post. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="bg-card border border-border rounded-2xl p-4 space-y-3"
      data-ocid="create-post-box"
    >
      <div className="flex gap-3">
        <Avatar className="w-9 h-9 shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} className="object-cover" />
          ) : (
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
              {getInitials(username)}
            </AvatarFallback>
          )}
        </Avatar>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's growing? 🌿"
          className="bg-background border-border resize-none min-h-[80px] text-sm placeholder:text-muted-foreground"
          data-ocid="post-text-input"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) handleSubmit();
          }}
        />
      </div>
      {imagePreview && (
        <div className="relative rounded-xl overflow-hidden">
          <img
            src={imagePreview}
            alt="preview"
            className="w-full max-h-60 object-cover"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 bg-background/80 hover:bg-background rounded-full p-1 transition-smooth"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {uploading && uploadProgress > 0 && uploadProgress < 100 && (
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-smooth"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary text-sm transition-smooth"
          data-ocid="add-image-btn"
        >
          <ImagePlus className="w-4 h-4" />
          <span>Photo</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={uploading || (!text.trim() && !imageFile)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5"
          data-ocid="post-submit-btn"
        >
          {uploading ? "Posting…" : "Post"}
        </Button>
      </div>
    </div>
  );
}

// ─── Comment Item ─────────────────────────────────────────────────────────────

interface CommentItemProps {
  comment: Comment;
  currentPrincipal: string | undefined;
  onDelete: (id: string) => void;
}

function CommentItem({
  comment,
  currentPrincipal,
  onDelete,
}: CommentItemProps) {
  const { actor } = useBackend();

  const { data: authorData } = useQuery({
    queryKey: ["user", comment.authorId.toText()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUser(comment.authorId);
    },
    enabled: !!actor,
    staleTime: 60_000,
  });

  const authorName = authorData?.username ?? "";

  const isOwn =
    currentPrincipal !== undefined &&
    comment.authorId.toText() === currentPrincipal;

  return (
    <div className="flex gap-2 items-start group">
      <Avatar className="w-7 h-7 shrink-0 mt-0.5">
        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
          {getInitials(authorName || "??")}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-background rounded-xl px-3 py-2">
          <span className="font-semibold text-xs text-primary mr-1.5">
            {authorName || "…"}
          </span>
          <span className="text-sm text-foreground break-words">
            {comment.content}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 pl-1">
          {timeAgo(comment.createdAt)}
        </p>
      </div>
      {isOwn && (
        <button
          type="button"
          onClick={() => onDelete(comment.id)}
          className="opacity-0 group-hover:opacity-100 text-destructive/60 hover:text-destructive p-1 transition-smooth"
          aria-label="Delete comment"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: Post;
  currentPrincipal: string | undefined;
}

function PostCard({ post, currentPrincipal }: PostCardProps) {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState<bigint>(
    post.likeCount,
  );
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("Spam");
  const [reportDetails, setReportDetails] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isOwn =
    currentPrincipal !== undefined &&
    post.authorId.toText() === currentPrincipal;

  const { data: likedData } = useQuery({
    queryKey: ["liked", post.id, currentPrincipal],
    queryFn: async () => {
      if (!actor) return false;
      return actor.hasLikedPost(post.id);
    },
    enabled: !!actor && !!currentPrincipal,
    staleTime: 30_000,
  });

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["comments", post.id],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getComments(post.id);
    },
    enabled: !!actor && showComments,
  });

  const { data: authorData } = useQuery({
    queryKey: ["user", post.authorId.toText()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUser(post.authorId);
    },
    enabled: !!actor,
    staleTime: 60_000,
  });

  const authorName = authorData?.username ?? "";
  const authorAvatar = authorData?.avatarUrl;

  const isLiked =
    optimisticLiked !== null ? optimisticLiked : (likedData ?? false);
  const likeCount = optimisticLikeCount;

  const toggleLike = async () => {
    if (!actor) return;
    const prevLiked = isLiked;
    const prevCount = likeCount;
    setOptimisticLiked(!prevLiked);
    setOptimisticLikeCount(prevLiked ? likeCount - 1n : likeCount + 1n);
    try {
      if (prevLiked) {
        const r = await actor.unlikePost(post.id);
        if (r.__kind__ === "err") throw new Error(r.err);
      } else {
        const r = await actor.likePost(post.id);
        if (r.__kind__ === "err") throw new Error(r.err);
      }
      await queryClient.invalidateQueries({ queryKey: ["liked", post.id] });
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
    } catch {
      setOptimisticLiked(prevLiked);
      setOptimisticLikeCount(prevCount);
      toast.error("Could not update like");
    }
  };

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const r = await actor.deletePost(post.id);
      if (r.__kind__ === "err") throw new Error(r.err);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Post deleted");
      setShowDeleteDialog(false);
    },
    onError: () => toast.error("Delete failed"),
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error("No actor");
      const r = await actor.addComment(post.id, content);
      if (r.__kind__ === "err") throw new Error(r.err);
      return r.ok;
    },
    onSuccess: async () => {
      setCommentInput("");
      await queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: () => toast.error("Comment failed"),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!actor) throw new Error("No actor");
      const r = await actor.deleteComment(commentId);
      if (r.__kind__ === "err") throw new Error(r.err);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
    },
    onError: () => toast.error("Delete failed"),
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const r = await actor.reportContent(
        "post",
        post.id,
        reportReason,
        reportDetails.trim() || null,
      );
      if (r.__kind__ === "err") throw new Error(r.err);
    },
    onSuccess: () => {
      setShowReportModal(false);
      setReportDetails("");
      toast.success("Report submitted. Thanks for keeping the community safe.");
    },
    onError: () => toast.error("Report failed"),
  });

  const handleCommentSubmit = () => {
    const c = commentInput.trim();
    if (!c) return;
    addCommentMutation.mutate(c);
  };

  const REPORT_REASONS = ["Spam", "Offensive", "Illegal", "Other"];

  return (
    <>
      <article
        className="bg-card border border-border rounded-2xl overflow-hidden transition-smooth hover:border-primary/20"
        data-ocid={`post-card-${post.id}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button
            type="button"
            className="flex items-center gap-2.5 group/author"
            onClick={() =>
              navigate({
                to: "/profile/$userId",
                params: { userId: post.authorId.toText() },
              })
            }
          >
            <Avatar className="w-9 h-9">
              {authorAvatar ? (
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {getInitials(authorName || "??")}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="text-left min-w-0">
              <p className="font-semibold text-sm text-foreground group-hover/author:text-primary transition-smooth truncate">
                {authorName || "Loading…"}
              </p>
              <p className="text-xs text-muted-foreground">
                {timeAgo(post.createdAt)}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1">
            {/* Report dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  aria-label="Post options"
                  data-ocid="post-options-btn"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-popover border-border"
              >
                <DropdownMenuItem
                  className="text-muted-foreground hover:text-foreground cursor-pointer gap-2"
                  onClick={() => setShowReportModal(true)}
                  data-ocid="report-post-btn"
                >
                  <Flag className="w-3.5 h-3.5" /> Report
                </DropdownMenuItem>
                {isOwn && (
                  <DropdownMenuItem
                    className="text-destructive hover:text-destructive cursor-pointer gap-2"
                    onClick={() => setShowDeleteDialog(true)}
                    data-ocid="delete-post-btn"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        {post.content && (
          <p className="px-4 pb-2 text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
            {post.content}
          </p>
        )}
        {post.imageUrl && (
          <div className="mx-0">
            <img
              src={post.imageUrl}
              alt="Post"
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 px-4 py-3 border-t border-border/60">
          <button
            type="button"
            onClick={toggleLike}
            className={`flex items-center gap-1.5 text-sm transition-smooth group/like ${
              isLiked
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            }`}
            aria-label={isLiked ? "Unlike post" : "Like post"}
            data-ocid={`like-btn-${post.id}`}
          >
            <Heart
              className={`w-4.5 h-4.5 transition-smooth ${
                isLiked
                  ? "fill-primary scale-110"
                  : "group-hover/like:scale-110"
              }`}
              style={{ width: "1.125rem", height: "1.125rem" }}
            />
            <span>{likeCount.toString()}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-smooth"
            aria-label="Toggle comments"
            data-ocid={`comment-btn-${post.id}`}
          >
            <MessageCircle style={{ width: "1.125rem", height: "1.125rem" }} />
            <span>{post.commentCount.toString()}</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="border-t border-border/60 px-4 py-3 space-y-3 bg-background/40">
            {comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                currentPrincipal={currentPrincipal}
                onDelete={(id) => deleteCommentMutation.mutate(id)}
              />
            ))}
            {comments.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-1">
                No comments yet. Be first! 🌿
              </p>
            )}
            {/* Add comment */}
            <div
              className="flex gap-2 items-center pt-1"
              data-ocid="add-comment-row"
            >
              <Textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a comment…"
                className="bg-background border-border resize-none min-h-[40px] max-h-[120px] text-sm py-2"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleCommentSubmit();
                  }
                }}
                data-ocid={`comment-input-${post.id}`}
              />
              <Button
                type="button"
                size="icon"
                onClick={handleCommentSubmit}
                disabled={!commentInput.trim() || addCommentMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 h-9 w-9 rounded-full"
                aria-label="Send comment"
                data-ocid={`comment-send-${post.id}`}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </article>

      {/* Delete Confirm Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete post?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This cannot be undone. Your post will be permanently removed.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deletePostMutation.mutate()}
              disabled={deletePostMutation.isPending}
              data-ocid="confirm-delete-btn"
            >
              {deletePostMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Report post</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Reason</p>
              <div
                className="flex flex-wrap gap-2"
                data-ocid="report-reason-group"
              >
                {REPORT_REASONS.map((r) => (
                  <Badge
                    key={r}
                    variant={reportReason === r ? "default" : "outline"}
                    className={`cursor-pointer transition-smooth ${
                      reportReason === r
                        ? "bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                    }`}
                    onClick={() => setReportReason(r)}
                    data-ocid={`report-reason-${r.toLowerCase()}`}
                  >
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Details (optional)
              </p>
              <Textarea
                id="report-details-textarea"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Tell us more…"
                className="bg-background border-border resize-none text-sm"
                rows={3}
                data-ocid="report-details-input"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowReportModal(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => reportMutation.mutate()}
              disabled={reportMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-ocid="report-submit-btn"
            >
              {reportMutation.isPending ? "Reporting…" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Feed Page ────────────────────────────────────────────────────────────────

function FeedContent() {
  const { actor } = useBackend();
  const { principal } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { data: profile } = useQuery({
    queryKey: ["profile", principal?.toText()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !!principal,
    staleTime: 30_000,
  });

  const {
    data: feedPosts,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<Post[]>({
    queryKey: ["feed", page],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFeedPosts(PAGE_SIZE, BigInt(page) * PAGE_SIZE);
    },
    enabled: !!actor,
    staleTime: 30_000,
  });

  // Merge pages into allPosts
  if (feedPosts !== undefined && feedPosts !== null) {
    const ids = new Set(allPosts.map((p) => p.id));
    const newPosts = feedPosts.filter((p) => !ids.has(p.id));
    if (newPosts.length > 0) {
      setAllPosts((prev) => [...prev, ...newPosts]);
      if (feedPosts.length < Number(PAGE_SIZE)) setHasMore(false);
    } else if (page > 0 && feedPosts.length === 0) {
      setHasMore(false);
    }
  }

  const handleRefresh = async () => {
    setAllPosts([]);
    setPage(0);
    setHasMore(true);
    await queryClient.invalidateQueries({ queryKey: ["feed"] });
    await refetch();
    toast.success("Feed refreshed 🌿");
  };

  const currentPrincipal = principal?.toText();

  return (
    <div className="px-4 py-6 max-w-xl mx-auto space-y-4" data-ocid="feed-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-xl text-foreground">
            Your Feed
          </h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isFetching}
          className="text-muted-foreground hover:text-primary"
          aria-label="Refresh feed"
          data-ocid="refresh-btn"
        >
          <RefreshCw
            className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* Create Post */}
      {profile && (
        <CreatePostBox
          username={profile.username}
          avatarUrl={profile.avatarUrl}
          onCreated={() => {
            setAllPosts([]);
            setPage(0);
          }}
        />
      )}

      {/* Loading skeletons */}
      {isLoading && allPosts.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full bg-muted" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-28 rounded-md bg-muted" />
                  <Skeleton className="h-3 w-16 rounded-md bg-muted" />
                </div>
              </div>
              <Skeleton className="h-4 w-full rounded-md bg-muted" />
              <Skeleton className="h-4 w-3/4 rounded-md bg-muted" />
              <Skeleton className="h-40 w-full rounded-xl bg-muted" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && allPosts.length === 0 && (
        <div
          className="text-center py-16 space-y-4"
          data-ocid="feed-empty-state"
        >
          <div className="text-6xl">🌿</div>
          <div>
            <h3 className="font-display font-bold text-lg text-foreground mb-1">
              Nothing here yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Follow some people to see their posts here. Discover the community
              on the Explore page.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => navigate({ to: "/explore" })}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6"
            data-ocid="explore-cta-btn"
          >
            Explore Community
          </Button>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {allPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentPrincipal={currentPrincipal}
          />
        ))}
      </div>

      {/* Load More */}
      {allPosts.length > 0 && hasMore && (
        <div className="flex justify-center pt-2 pb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={isFetching}
            className="border-border text-muted-foreground hover:border-primary hover:text-primary rounded-full px-6"
            data-ocid="load-more-btn"
          >
            {isFetching ? "Loading…" : "Load more posts"}
          </Button>
        </div>
      )}

      {!hasMore && allPosts.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">
          You've seen everything 🌿
        </p>
      )}
    </div>
  );
}

export default function FeedPage() {
  return (
    <AuthGuard>
      <Layout>
        <FeedContent />
      </Layout>
    </AuthGuard>
  );
}
