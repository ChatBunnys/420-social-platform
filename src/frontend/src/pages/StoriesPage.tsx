import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useBackend } from "@/hooks/useBackend";
import { useProfile } from "@/hooks/useProfile";
import type { Story } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Story grouping by author ────────────────────────────────────────────────

interface StoryGroup {
  authorId: string;
  username: string;
  avatarUrl?: string;
  stories: Story[];
  hasUnviewed: boolean;
}

function groupStoriesByAuthor(
  stories: Story[],
  viewedIds: Set<string>,
  myPrincipal: string | null,
): StoryGroup[] {
  const map = new Map<string, StoryGroup>();
  const now = Date.now();

  for (const s of stories) {
    const aid = s.authorId.toText();
    if (Number(s.expiresAt) / 1_000_000 < now) continue;
    if (!map.has(aid)) {
      map.set(aid, {
        authorId: aid,
        username: aid.slice(0, 8),
        stories: [],
        hasUnviewed: false,
      });
    }
    const g = map.get(aid)!;
    g.stories.push(s);
    if (!viewedIds.has(s.id)) g.hasUnviewed = true;
  }

  const groups = Array.from(map.values()).sort((a, b) => {
    if (a.authorId === myPrincipal) return -1;
    if (b.authorId === myPrincipal) return 1;
    if (a.hasUnviewed && !b.hasUnviewed) return -1;
    if (!a.hasUnviewed && b.hasUnviewed) return 1;
    return 0;
  });

  return groups;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function timeAgo(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const diff = Date.now() - ms;
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return `${Math.floor(diff / 60_000)}m ago`;
  return `${h}h ago`;
}

function expiresIn(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const diff = ms - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h < 1) return `Expires in ${m}m`;
  return `Expires in ${h}h ${m}m`;
}

// ─── Story Avatar ─────────────────────────────────────────────────────────────

function StoryAvatar({
  group,
  isMe,
  onClick,
}: {
  group: StoryGroup;
  isMe: boolean;
  onClick: () => void;
}) {
  const initials = (group.username ?? "?").slice(0, 2).toUpperCase();
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 flex-shrink-0"
      data-ocid="story-circle"
    >
      <div
        className={`p-0.5 rounded-full ${
          group.hasUnviewed
            ? "bg-gradient-to-tr from-primary to-secondary"
            : "bg-muted"
        }`}
      >
        <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center border-2 border-background overflow-hidden">
          {group.avatarUrl ? (
            <img
              src={group.avatarUrl}
              alt={group.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg font-display font-bold text-foreground">
              {isMe ? "🌿" : initials}
            </span>
          )}
        </div>
      </div>
      <span className="text-xs font-body text-muted-foreground truncate max-w-[64px]">
        {isMe ? "Your Story" : group.username}
      </span>
    </button>
  );
}

// ─── Add Story Avatar ─────────────────────────────────────────────────────────

function AddStoryAvatar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 flex-shrink-0"
      data-ocid="add-story-btn"
    >
      <div className="p-0.5 rounded-full bg-muted">
        <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center border-2 border-dashed border-primary/60 overflow-hidden">
          <span className="text-2xl text-primary">＋</span>
        </div>
      </div>
      <span className="text-xs font-body text-muted-foreground">Add Story</span>
    </button>
  );
}

// ─── Cannabis Leaf SVG ────────────────────────────────────────────────────────

function CannabisLeafBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
      {[
        { top: "10%", left: "5%", size: 120, rot: -15, key: "tl" },
        { top: "60%", left: "80%", size: 90, rot: 30, key: "br" },
        { top: "30%", left: "65%", size: 60, rot: -40, key: "tr" },
        { top: "80%", left: "15%", size: 80, rot: 20, key: "bl" },
      ].map((pos) => (
        <svg
          key={pos.key}
          style={{
            position: "absolute",
            top: pos.top,
            left: pos.left,
            width: pos.size,
            height: pos.size,
            transform: `rotate(${pos.rot}deg)`,
          }}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M50 5 C50 5 30 20 20 35 C10 50 15 60 25 65 C30 67 35 65 40 62 L38 85 L50 85 L62 85 L60 62 C65 65 70 67 75 65 C85 60 90 50 80 35 C70 20 50 5 50 5Z"
            fill="#22c55e"
          />
          <path
            d="M50 5 C50 5 35 22 27 38 C30 45 38 52 50 55 C62 52 70 45 73 38 C65 22 50 5 50 5Z"
            fill="#16a34a"
          />
        </svg>
      ))}
    </div>
  );
}

// ─── Story Viewer ─────────────────────────────────────────────────────────────

interface StoryViewerProps {
  groups: StoryGroup[];
  startGroupIndex: number;
  onClose: () => void;
  onViewed: (storyId: string) => void;
}

const STORY_DURATION = 5000;

function StoryViewer({
  groups,
  startGroupIndex,
  onClose,
  onViewed,
}: StoryViewerProps) {
  const [groupIdx, setGroupIdx] = useState(startGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(Date.now());

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];
  const totalStories = group?.stories.length ?? 0;

  const goNext = useCallback(() => {
    if (storyIdx < totalStories - 1) {
      setStoryIdx((i) => i + 1);
      setProgress(0);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx((g) => g + 1);
      setStoryIdx(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [storyIdx, totalStories, groupIdx, groups.length, onClose]);

  const goPrev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx((i) => i - 1);
      setProgress(0);
    } else if (groupIdx > 0) {
      setGroupIdx((g) => g - 1);
      setStoryIdx(0);
      setProgress(0);
    }
  }, [storyIdx, groupIdx]);

  // Mark viewed
  useEffect(() => {
    if (story) onViewed(story.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story, onViewed]);

  // Progress timer — reset and restart on story change
  // biome-ignore lint/correctness/useExhaustiveDependencies: groupIdx+storyIdx intentionally reset timer
  useEffect(() => {
    setProgress(0);
    startedAt.current = Date.now();
    const interval = 50;
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current!);
        goNext();
      }
    }, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [groupIdx, storyIdx, goNext]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, onClose]);

  if (!group || !story) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      data-ocid="story-viewer"
    >
      {/* Story container */}
      <div className="relative w-full max-w-md h-full max-h-[100dvh] overflow-hidden">
        {/* Background: cannabis leaf pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-card">
          <CannabisLeafBg />
        </div>

        {/* Story content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {story.imageUrl ? (
            <img
              src={story.imageUrl}
              alt="Story"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="px-8 text-center">
              <p className="text-primary font-display text-2xl font-bold leading-snug drop-shadow-lg">
                {story.content}
              </p>
            </div>
          )}
          {/* Text overlay on image */}
          {story.imageUrl && story.content && (
            <div className="absolute bottom-24 left-0 right-0 px-6">
              <p className="text-foreground font-display text-xl font-bold text-center drop-shadow-lg bg-black/40 px-4 py-2 rounded-xl">
                {story.content}
              </p>
            </div>
          )}
        </div>

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 pt-safe-top px-3 pt-3">
          {group.stories.map((s, i) => (
            <div key={s.id} className="story-progress flex-1">
              <div
                className="story-progress-bar"
                style={{
                  width:
                    i < storyIdx
                      ? "100%"
                      : i === storyIdx
                        ? `${progress}%`
                        : "0%",
                  transition: i === storyIdx ? "width 50ms linear" : "none",
                }}
              />
            </div>
          ))}
        </div>

        {/* Author + close */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-3 pt-10 pb-3">
          <div className="w-9 h-9 rounded-full bg-card flex items-center justify-center border border-primary/40 overflow-hidden flex-shrink-0">
            {group.avatarUrl ? (
              <img
                src={group.avatarUrl}
                alt={group.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-foreground">
                {group.username.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-display font-semibold text-sm truncate">
              {group.username}
            </p>
            <p className="text-foreground/60 font-body text-xs">
              {timeAgo(story.createdAt)} · {expiresIn(story.expiresAt)}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close story"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-foreground hover:bg-black/60 transition-smooth"
            data-ocid="story-close-btn"
          >
            ✕
          </button>
        </div>

        {/* Tap zones */}
        <button
          type="button"
          aria-label="Previous story"
          onClick={goPrev}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
        />
        <button
          type="button"
          aria-label="Next story"
          onClick={goNext}
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
        />
      </div>
    </motion.div>
  );
}

// ─── Create Story Modal ───────────────────────────────────────────────────────

interface CreateStoryModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateStoryModal({ onClose, onCreated }: CreateStoryModalProps) {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"text" | "image">("text");
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [overlayText, setOverlayText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_CHARS = 200;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");

      let imageUrl: string | null = null;
      if (mode === "image" && imageFile) {
        // Convert to base64 data URL
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
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

      const content = mode === "text" ? text || null : overlayText || null;
      const result = await actor.createStory(content, imageUrl);
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["myStories"] });
      onCreated();
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const canPost = mode === "text" ? text.trim().length > 0 : imageFile !== null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      data-ocid="create-story-modal"
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-display font-bold text-lg text-foreground">
            Add to Story
          </h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth"
          >
            ✕
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 px-5 pt-4">
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`flex-1 py-2 rounded-xl text-sm font-display font-semibold transition-smooth ${
              mode === "text"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
            data-ocid="story-mode-text"
          >
            ✍ Text Story
          </button>
          <button
            type="button"
            onClick={() => setMode("image")}
            className={`flex-1 py-2 rounded-xl text-sm font-display font-semibold transition-smooth ${
              mode === "image"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
            data-ocid="story-mode-image"
          >
            🖼 Image Story
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {mode === "text" && (
            <>
              {/* Live preview */}
              <div className="relative rounded-xl bg-black border border-primary/20 overflow-hidden h-48 flex items-center justify-center">
                <CannabisLeafBg />
                <p
                  className={`text-primary font-display font-bold text-xl text-center px-4 z-10 transition-smooth ${
                    text ? "opacity-100" : "opacity-30"
                  }`}
                >
                  {text || "Your story text…"}
                </p>
              </div>
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                  placeholder="What's on your mind? 🌿"
                  rows={3}
                  maxLength={MAX_CHARS}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground font-body text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                  data-ocid="story-text-input"
                />
                <span className="absolute bottom-3 right-3 text-xs text-muted-foreground font-mono">
                  {text.length}/{MAX_CHARS}
                </span>
              </div>
            </>
          )}

          {mode === "image" && (
            <>
              {/* Image upload area */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full h-48 rounded-xl bg-muted border-2 border-dashed border-border hover:border-primary/60 transition-smooth overflow-hidden flex items-center justify-center"
                data-ocid="story-image-upload"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-4xl mb-2">📷</p>
                    <p className="text-sm text-muted-foreground font-body">
                      Tap to upload image
                    </p>
                  </div>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload story image"
              />
              <input
                type="text"
                value={overlayText}
                onChange={(e) =>
                  setOverlayText(e.target.value.slice(0, MAX_CHARS))
                }
                placeholder="Optional text overlay…"
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                data-ocid="story-overlay-input"
              />
            </>
          )}

          {mutation.isError && (
            <p className="text-destructive text-sm font-body text-center">
              {(mutation.error as Error).message}
            </p>
          )}

          {mutation.isPending && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="story-progress">
              <div
                className="story-progress-bar"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            type="button"
            disabled={!canPost || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm transition-smooth hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            data-ocid="story-post-btn"
          >
            {mutation.isPending ? "Posting…" : "Post Story 🌿"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StoriesPage() {
  const { actor, isLoading: actorLoading } = useBackend();
  const { principal } = useAuth();
  const { profile } = useProfile();
  const myPrincipalText = principal?.toText() ?? null;

  const [viewedIds, setViewedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("viewedStories");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });
  const [viewingGroupIdx, setViewingGroupIdx] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const allStoriesQuery = useQuery<Story[]>({
    queryKey: ["stories"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllActiveStories();
    },
    enabled: !!actor && !actorLoading,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const myStoriesQuery = useQuery<Story[]>({
    queryKey: ["myStories"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyStories();
    },
    enabled: !!actor && !actorLoading,
    staleTime: 30_000,
  });

  const allStories = allStoriesQuery.data ?? [];
  const myStories = myStoriesQuery.data ?? [];
  const now = Date.now();
  const activeMyStories = myStories.filter(
    (s) => Number(s.expiresAt) / 1_000_000 > now,
  );
  const hasMyStoryToday = activeMyStories.length > 0;

  const groups = groupStoriesByAuthor(allStories, viewedIds, myPrincipalText);

  const markViewed = useCallback((storyId: string) => {
    setViewedIds((prev) => {
      const next = new Set(prev);
      next.add(storyId);
      try {
        localStorage.setItem("viewedStories", JSON.stringify([...next]));
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  const openViewer = (groupIdx: number) => {
    setViewingGroupIdx(groupIdx);
  };

  const closeViewer = () => {
    setViewingGroupIdx(null);
  };

  const isLoading = allStoriesQuery.isLoading || actorLoading;

  // Find my group in the list (for opening own stories)
  const myGroupIdx = groups.findIndex((g) => g.authorId === myPrincipalText);

  // Update usernames from profile data
  const enrichedGroups = groups.map((g) => {
    if (g.authorId === myPrincipalText && profile) {
      return { ...g, username: profile.username, avatarUrl: profile.avatarUrl };
    }
    return g;
  });

  return (
    <AuthGuard>
      <Layout>
        <div className="max-w-xl mx-auto" data-ocid="stories-page">
          {/* Stories row */}
          <div className="bg-card border-b border-border px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-base text-foreground">
                🌿 Stories
              </h2>
            </div>

            {isLoading ? (
              <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0"
                  >
                    <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
                    <div className="h-3 w-12 rounded bg-muted animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
                {/* Add story button or own story */}
                {hasMyStoryToday && myGroupIdx >= 0 ? (
                  <StoryAvatar
                    group={enrichedGroups[myGroupIdx]}
                    isMe
                    onClick={() => openViewer(myGroupIdx)}
                  />
                ) : (
                  <AddStoryAvatar onClick={() => setShowCreateModal(true)} />
                )}

                {/* Other users' stories */}
                {enrichedGroups
                  .filter((g) => g.authorId !== myPrincipalText)
                  .map((group) => {
                    const idx = enrichedGroups.indexOf(group);
                    return (
                      <StoryAvatar
                        key={group.authorId}
                        group={group}
                        isMe={false}
                        onClick={() => openViewer(idx)}
                      />
                    );
                  })}

                {enrichedGroups.filter((g) => g.authorId !== myPrincipalText)
                  .length === 0 &&
                  !isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground/60 text-sm font-body italic py-4">
                      <span>No stories yet</span>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Stories feed / my stories section */}
          <div className="px-4 py-6 space-y-4">
            {/* My active stories */}
            {hasMyStoryToday && activeMyStories.length > 0 && (
              <div>
                <h3 className="font-display font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                  Your Active Stories
                </h3>
                <div className="space-y-2">
                  {activeMyStories.map((s) => (
                    <div
                      key={s.id}
                      className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3"
                      data-ocid="my-story-item"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 border border-primary/20">
                        {s.imageUrl ? (
                          <img
                            src={s.imageUrl}
                            alt="Story"
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <span className="text-primary text-lg">🌿</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {s.content && (
                          <p className="text-foreground font-body text-sm truncate">
                            {s.content}
                          </p>
                        )}
                        <p className="text-muted-foreground text-xs font-body mt-0.5">
                          {expiresIn(s.expiresAt)} · {timeAgo(s.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add story CTA when no stories yet */}
            {!hasMyStoryToday && (
              <button
                type="button"
                className="w-full bg-card border border-dashed border-primary/30 rounded-2xl p-6 flex flex-col items-center gap-3 text-center cursor-pointer hover:border-primary/60 transition-smooth"
                onClick={() => setShowCreateModal(true)}
                data-ocid="story-cta"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                  🌿
                </div>
                <div>
                  <p className="font-display font-bold text-foreground">
                    Share your vibe
                  </p>
                  <p className="text-muted-foreground text-sm font-body mt-1">
                    Stories disappear after 24 hours
                  </p>
                </div>
                <span
                  className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-display font-semibold text-sm transition-smooth hover:opacity-90"
                  data-ocid="story-cta-btn"
                >
                  + Add to Story
                </span>
              </button>
            )}

            {/* All stories grid */}
            {enrichedGroups.filter((g) => g.authorId !== myPrincipalText)
              .length > 0 && (
              <div>
                <h3 className="font-display font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                  Recent Stories
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {enrichedGroups
                    .filter((g) => g.authorId !== myPrincipalText)
                    .map((group) => {
                      const firstStory = group.stories[0];
                      const idx = enrichedGroups.indexOf(group);
                      return (
                        <button
                          key={group.authorId}
                          type="button"
                          onClick={() => openViewer(idx)}
                          className="relative rounded-2xl overflow-hidden aspect-[9/14] bg-card border border-border hover:border-primary/40 transition-smooth group"
                          data-ocid="story-grid-card"
                        >
                          {/* Background */}
                          {firstStory.imageUrl ? (
                            <img
                              src={firstStory.imageUrl}
                              alt={group.username}
                              className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-b from-card to-background flex items-center justify-center relative overflow-hidden">
                              <CannabisLeafBg />
                              <p className="text-primary font-display font-bold text-sm text-center px-2 z-10 leading-snug line-clamp-4">
                                {firstStory.content}
                              </p>
                            </div>
                          )}

                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                          {/* Unviewed indicator */}
                          {group.hasUnviewed && (
                            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                          )}

                          {/* Author info at bottom */}
                          <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                            <p className="text-foreground font-display font-semibold text-xs truncate">
                              {group.username}
                            </p>
                            <p className="text-foreground/60 font-body text-[10px] mt-0.5">
                              {timeAgo(firstStory.createdAt)}
                            </p>
                          </div>

                          {/* Story count badge */}
                          {group.stories.length > 1 && (
                            <div className="absolute top-2 left-2 bg-black/60 rounded-full px-2 py-0.5">
                              <span className="text-foreground/80 text-[10px] font-mono">
                                {group.stories.length}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Empty state when no other stories */}
            {!isLoading &&
              enrichedGroups.filter((g) => g.authorId !== myPrincipalText)
                .length === 0 && (
                <div
                  className="flex flex-col items-center justify-center py-12 text-center"
                  data-ocid="stories-empty"
                >
                  <p className="text-4xl mb-3">🌿</p>
                  <p className="font-display font-semibold text-foreground">
                    No stories yet
                  </p>
                  <p className="text-muted-foreground text-sm font-body mt-1 max-w-xs">
                    Be the first to share a story — they disappear after 24
                    hours
                  </p>
                </div>
              )}
          </div>
        </div>

        {/* Story viewer overlay */}
        <AnimatePresence>
          {viewingGroupIdx !== null && enrichedGroups.length > 0 && (
            <StoryViewer
              groups={enrichedGroups}
              startGroupIndex={viewingGroupIdx}
              onClose={closeViewer}
              onViewed={markViewed}
            />
          )}
        </AnimatePresence>

        {/* Create story modal */}
        <AnimatePresence>
          {showCreateModal && (
            <CreateStoryModal
              onClose={() => setShowCreateModal(false)}
              onCreated={() => setShowCreateModal(false)}
            />
          )}
        </AnimatePresence>
      </Layout>
    </AuthGuard>
  );
}
