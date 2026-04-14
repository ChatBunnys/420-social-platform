import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBackend } from "@/hooks/useBackend";
import { useProfile } from "@/hooks/useProfile";
import type { AdminStats, Post, Report, User } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  FileText,
  Flag,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── Confirmation Dialog ─────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        className="bg-card border-border max-w-sm"
        data-ocid="confirm-dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-foreground font-display flex items-center gap-2">
            <AlertTriangle
              className={`w-5 h-5 ${danger ? "text-destructive" : "text-primary"}`}
            />
            {title}
          </DialogTitle>
          <p className="text-muted-foreground text-sm font-body pt-1">
            {description}
          </p>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-ocid="confirm-cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={danger ? "destructive" : "default"}
            onClick={onConfirm}
            data-ocid="confirm-ok"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: bigint | number | undefined;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/50 transition-smooth flex flex-col gap-3 group w-full"
      data-ocid="stat-card"
    >
      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-smooth">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-primary">
          {value !== undefined ? value.toString() : "—"}
        </p>
        <p className="text-muted-foreground text-xs font-body mt-0.5">
          {label}
        </p>
      </div>
    </button>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  stats,
  isLoading,
  onTabChange,
}: {
  stats: AdminStats | undefined;
  isLoading: boolean;
  onTabChange: (tab: string) => void;
}) {
  return (
    <div className="space-y-6" data-ocid="overview-tab">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          ["s1", "s2", "s3", "s4"].map((k) => (
            <Skeleton key={k} className="h-32 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={Users}
              label="Total Users"
              value={stats?.totalUsers}
              onClick={() => onTabChange("users")}
            />
            <StatCard
              icon={FileText}
              label="Total Posts"
              value={stats?.totalPosts}
              onClick={() => onTabChange("posts")}
            />
            <StatCard
              icon={Flag}
              label="Total Reports"
              value={stats?.totalReports}
              onClick={() => onTabChange("reports")}
            />
            <StatCard
              icon={AlertTriangle}
              label="Pending Reports"
              value={stats?.pendingReports}
              onClick={() => onTabChange("reports")}
            />
          </>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-display font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            type="button"
            variant="outline"
            className="justify-start gap-2"
            onClick={() => onTabChange("posts")}
            data-ocid="quick-action-posts"
          >
            <FileText className="w-4 h-4 text-primary" /> Manage Posts
          </Button>
          <Button
            type="button"
            variant="outline"
            className="justify-start gap-2"
            onClick={() => onTabChange("users")}
            data-ocid="quick-action-users"
          >
            <Users className="w-4 h-4 text-primary" /> Manage Users
          </Button>
          <Button
            type="button"
            variant="outline"
            className="justify-start gap-2"
            onClick={() => onTabChange("reports")}
            data-ocid="quick-action-reports"
          >
            <Flag className="w-4 h-4 text-primary" /> Review Reports
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Posts Tab ────────────────────────────────────────────────────────────────

function PostsTab({
  actor,
}: { actor: import("@/backend.d.ts").backendInterface | null }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [confirmPost, setConfirmPost] = useState<Post | null>(null);

  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ["admin", "posts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPosts();
    },
    enabled: !!actor,
  });

  const deleteMut = useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.adminDeletePost(postId);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "posts"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success("Post deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (posts ?? []).filter(
    (p) =>
      p.authorId.toText().toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4" data-ocid="posts-tab">
      <Input
        placeholder="Search by author ID or content…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-card border-border"
        data-ocid="posts-search"
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-muted-foreground font-body font-medium">
                  Author
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-body font-medium">
                  Content
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-body font-medium">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-body font-medium">
                  Image
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-body font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? ["r1", "r2", "r3", "r4", "r5"].map((k) => (
                    <tr key={k} className="border-b border-border/50">
                      <td colSpan={5} className="px-4 py-3">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    </tr>
                  ))
                : filtered.map((post) => (
                    <tr
                      key={post.id}
                      className={[
                        "border-b border-border/50 hover:bg-muted/20 transition-smooth",
                        post.isDeleted ? "opacity-40" : "",
                      ].join(" ")}
                      data-ocid="post-row"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground truncate max-w-[120px]">
                        {post.authorId.toText().slice(0, 12)}…
                      </td>
                      <td className="px-4 py-3 text-foreground max-w-[200px]">
                        <span className={post.isDeleted ? "line-through" : ""}>
                          {post.content.slice(0, 100)}
                          {post.content.length > 100 ? "…" : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(
                          Number(post.createdAt / 1_000_000n),
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {post.imageUrl ? (
                          <img
                            src={post.imageUrl}
                            alt="thumb"
                            className="w-8 h-8 object-cover rounded"
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            No image
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!post.isDeleted && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setConfirmPost(post)}
                            data-ocid="delete-post-btn"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground text-sm"
                  >
                    No posts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmPost}
        title="Delete Post"
        description="This will permanently delete the post. This action cannot be undone."
        confirmLabel="Delete Post"
        danger
        onConfirm={() => {
          if (confirmPost) {
            deleteMut.mutate(confirmPost.id);
            setConfirmPost(null);
          }
        }}
        onCancel={() => setConfirmPost(null)}
      />
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({
  actor,
}: { actor: import("@/backend.d.ts").backendInterface | null }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    type: "suspend" | "unsuspend" | "promote" | "demote";
    user: User;
  } | null>(null);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor,
  });

  const suspendMut = useMutation({
    mutationFn: async ({
      userId,
      suspend,
    }: {
      userId: import("@icp-sdk/core/principal").Principal;
      suspend: boolean;
    }) => {
      if (!actor) throw new Error("No actor");
      const res = suspend
        ? await actor.suspendUser(userId)
        : await actor.unsuspendUser(userId);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: (_, { suspend }) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(suspend ? "User suspended" : "User unsuspended");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const adminMut = useMutation({
    mutationFn: async ({
      userId,
      promote,
    }: {
      userId: import("@icp-sdk/core/principal").Principal;
      promote: boolean;
    }) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.setAdmin(userId, promote);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: (_, { promote }) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(
        promote ? "User promoted to admin" : "Admin privileges removed",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (users ?? []).filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toText().toLowerCase().includes(search.toLowerCase()),
  );

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { type, user } = confirmAction;
    if (type === "suspend")
      suspendMut.mutate({ userId: user.id, suspend: true });
    else if (type === "unsuspend")
      suspendMut.mutate({ userId: user.id, suspend: false });
    else if (type === "promote")
      adminMut.mutate({ userId: user.id, promote: true });
    else if (type === "demote")
      adminMut.mutate({ userId: user.id, promote: false });
    setConfirmAction(null);
  };

  const confirmMessages: Record<
    string,
    { title: string; desc: string; label: string; danger: boolean }
  > = {
    suspend: {
      title: "Suspend User",
      desc: "This user will be suspended and unable to post or interact.",
      label: "Suspend",
      danger: true,
    },
    unsuspend: {
      title: "Unsuspend User",
      desc: "This user's access will be restored.",
      label: "Unsuspend",
      danger: false,
    },
    promote: {
      title: "Promote to Admin",
      desc: "This user will gain full admin privileges.",
      label: "Promote",
      danger: false,
    },
    demote: {
      title: "Remove Admin",
      desc: "Admin privileges will be removed from this user.",
      label: "Remove Admin",
      danger: true,
    },
  };

  return (
    <div className="space-y-4" data-ocid="users-tab">
      <Input
        placeholder="Search by username or principal ID…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-card border-border"
        data-ocid="users-search"
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-muted-foreground font-body font-medium">
                  User
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-body font-medium">
                  Joined
                </th>
                <th className="text-right px-4 py-3 text-muted-foreground font-body font-medium">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-muted-foreground font-body font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? ["u1", "u2", "u3", "u4", "u5"].map((k) => (
                    <tr key={k} className="border-b border-border/50">
                      <td colSpan={4} className="px-4 py-3">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    </tr>
                  ))
                : filtered.map((user) => (
                    <tr
                      key={user.id.toText()}
                      className="border-b border-border/50 hover:bg-muted/20 transition-smooth"
                      data-ocid="user-row"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.username}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              user.username.slice(0, 1).toUpperCase()
                            )}
                          </div>
                          <button
                            type="button"
                            className="font-body font-medium text-foreground hover:text-primary transition-smooth text-left"
                            onClick={() =>
                              navigate({
                                to: "/profile/$userId",
                                params: { userId: user.id.toText() },
                              })
                            }
                            data-ocid="user-profile-link"
                          >
                            @{user.username}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(
                          Number(user.createdAt / 1_000_000n),
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.isAdmin && (
                            <Badge className="bg-primary/20 text-primary border-primary/30">
                              Admin
                            </Badge>
                          )}
                          {user.isSuspended && (
                            <Badge variant="destructive">Suspended</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={
                              user.isSuspended
                                ? "text-primary hover:text-primary"
                                : "text-destructive hover:text-destructive hover:bg-destructive/10"
                            }
                            onClick={() =>
                              setConfirmAction({
                                type: user.isSuspended
                                  ? "unsuspend"
                                  : "suspend",
                                user,
                              })
                            }
                            data-ocid={
                              user.isSuspended ? "unsuspend-btn" : "suspend-btn"
                            }
                          >
                            {user.isSuspended ? (
                              <ShieldCheck className="w-4 h-4" />
                            ) : (
                              <ShieldOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              setConfirmAction({
                                type: user.isAdmin ? "demote" : "promote",
                                user,
                              })
                            }
                            data-ocid={
                              user.isAdmin ? "demote-btn" : "promote-btn"
                            }
                          >
                            <UserCog className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground text-sm"
                  >
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmAction && (
        <ConfirmDialog
          open
          title={confirmMessages[confirmAction.type].title}
          description={`${confirmMessages[confirmAction.type].desc} User: @${confirmAction.user.username}`}
          confirmLabel={confirmMessages[confirmAction.type].label}
          danger={confirmMessages[confirmAction.type].danger}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────

function ReportsTab({
  actor,
}: { actor: import("@/backend.d.ts").backendInterface | null }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [confirmDelete, setConfirmDelete] = useState<Report | null>(null);
  const [confirmDismiss, setConfirmDismiss] = useState<Report | null>(null);

  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ["admin", "reports"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReports();
    },
    enabled: !!actor,
  });

  const dismissMut = useMutation({
    mutationFn: async (reportId: string) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.dismissReport(reportId);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success("Report dismissed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteContentMut = useMutation({
    mutationFn: async (report: Report) => {
      if (!actor) throw new Error("No actor");
      let res: { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string };
      if (report.contentType === "post") {
        res = await actor.adminDeletePost(report.contentId);
      } else {
        res = await actor.adminDeleteComment(report.contentId);
      }
      if (res.__kind__ === "err") throw new Error(res.err);
      const dismissRes = await actor.dismissReport(report.id);
      if (dismissRes.__kind__ === "err") throw new Error(dismissRes.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
      qc.invalidateQueries({ queryKey: ["admin", "posts"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success("Content deleted and report resolved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sorted = [...(reports ?? [])].sort((a, b) =>
    Number(b.createdAt - a.createdAt),
  );
  const filtered =
    filter === "pending" ? sorted.filter((r) => !r.isReviewed) : sorted;

  return (
    <div className="space-y-4" data-ocid="reports-tab">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
          data-ocid="filter-pending"
        >
          Pending
        </Button>
        <Button
          type="button"
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          data-ocid="filter-all"
        >
          All Reports
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          ["r1", "r2", "r3", "r4"].map((k) => (
            <Skeleton key={k} className="h-24 rounded-xl" />
          ))
        ) : filtered.length === 0 ? (
          <div
            className="bg-card border border-border rounded-xl p-10 text-center"
            data-ocid="reports-empty"
          >
            <Flag className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-body text-sm">
              {filter === "pending"
                ? "No pending reports — you're all caught up! 🌿"
                : "No reports found"}
            </p>
          </div>
        ) : (
          filtered.map((report) => (
            <div
              key={report.id}
              className={`bg-card border rounded-xl p-4 transition-smooth ${report.isReviewed ? "border-border/40 opacity-60" : "border-border hover:border-primary/30"}`}
              data-ocid="report-row"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {report.contentType}
                    </Badge>
                    <Badge
                      className={`text-xs ${report.isReviewed ? "bg-muted text-muted-foreground" : "bg-primary/20 text-primary border-primary/30"}`}
                    >
                      {report.isReviewed ? "Reviewed" : "Pending"}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {new Date(
                        Number(report.createdAt / 1_000_000n),
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="font-body font-medium text-foreground text-sm mb-1">
                    Reason:{" "}
                    <span className="text-primary">{report.reason}</span>
                  </p>
                  {report.details && (
                    <p className="text-muted-foreground text-xs font-body line-clamp-2">
                      {report.details}
                    </p>
                  )}
                  <p className="text-muted-foreground text-xs font-mono mt-1">
                    Reported by: {report.reporterId.toText().slice(0, 16)}…
                  </p>
                </div>
                {!report.isReviewed && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                      onClick={() => setConfirmDelete(report)}
                      data-ocid="delete-content-btn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground gap-1"
                      onClick={() => setConfirmDismiss(report)}
                      data-ocid="dismiss-report-btn"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Reported Content"
        description={`This will permanently delete the ${confirmDelete?.contentType} and resolve the report.`}
        confirmLabel="Delete Content"
        danger
        onConfirm={() => {
          if (confirmDelete) {
            deleteContentMut.mutate(confirmDelete);
            setConfirmDelete(null);
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmDialog
        open={!!confirmDismiss}
        title="Dismiss Report"
        description="The report will be marked as reviewed without deleting the content."
        confirmLabel="Dismiss"
        onConfirm={() => {
          if (confirmDismiss) {
            dismissMut.mutate(confirmDismiss.id);
            setConfirmDismiss(null);
          }
        }}
        onCancel={() => setConfirmDismiss(null)}
      />
    </div>
  );
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────

function AdminPanel() {
  const { actor, isLoading: actorLoading } = useBackend();
  const { profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getAdminStats();
    },
    enabled: !!actor && !actorLoading,
    refetchInterval: 30_000,
  });

  if (profileLoading || actorLoading) {
    return (
      <div className="px-4 py-6 space-y-4" data-ocid="admin-loading">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {["a1", "a2", "a3", "a4"].map((k) => (
            <Skeleton key={k} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile?.isAdmin) {
    return (
      <div
        className="px-4 py-16 flex items-center justify-center"
        data-ocid="access-denied"
      >
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldOff className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="font-display font-bold text-xl text-foreground mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground font-body text-sm mb-6">
            Admin privileges are required to access this panel.
          </p>
          <Button
            type="button"
            onClick={() => navigate({ to: "/feed" })}
            data-ocid="back-to-feed"
          >
            Back to Feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6" data-ocid="admin-panel">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Admin Panel
          </h2>
          <p className="text-muted-foreground text-sm font-body mt-0.5">
            Manage your 420 community
          </p>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30 gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Admin Access
        </Badge>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        data-ocid="admin-tabs"
      >
        <TabsList className="bg-card border border-border mb-6 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger
            value="overview"
            className="gap-1.5"
            data-ocid="tab-overview"
          >
            <BarChart3 className="w-3.5 h-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="posts" className="gap-1.5" data-ocid="tab-posts">
            <FileText className="w-3.5 h-3.5" /> Posts
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5" data-ocid="tab-users">
            <Users className="w-3.5 h-3.5" /> Users
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="gap-1.5 relative"
            data-ocid="tab-reports"
          >
            <Flag className="w-3.5 h-3.5" /> Reports
            {stats && stats.pendingReports > 0n && (
              <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1">
                {stats.pendingReports.toString()}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            stats={stats}
            isLoading={statsLoading}
            onTabChange={setActiveTab}
          />
        </TabsContent>
        <TabsContent value="posts">
          <PostsTab actor={actor} />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab actor={actor} />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsTab actor={actor} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard>
      <Layout>
        <AdminPanel />
      </Layout>
    </AuthGuard>
  );
}
