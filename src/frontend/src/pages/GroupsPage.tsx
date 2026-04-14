import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useBackend } from "@/hooks/useBackend";
import type { Group } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Search, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

function GroupCard({
  group,
  isMember,
  onJoin,
  onLeave,
  joining,
}: {
  group: Group;
  isMember: boolean;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  joining: boolean;
}) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 hover:border-primary/40 transition-smooth cursor-pointer text-left w-full"
      onClick={() =>
        navigate({ to: "/groups/$groupId", params: { groupId: group.id } })
      }
      data-ocid="group-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground truncate">
            {group.name}
          </h3>
          <CategoryBadge category={group.category} />
        </div>
        <div className="flex items-center gap-1 text-muted-foreground shrink-0 mt-0.5">
          <Users size={13} />
          <span className="text-xs font-body">
            {group.memberCount.toString()}
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground font-body line-clamp-2">
        {group.description}
      </p>

      <Button
        type="button"
        size="sm"
        variant={isMember ? "outline" : "default"}
        className="w-full mt-1"
        disabled={joining}
        onClick={(e) => {
          e.stopPropagation();
          isMember ? onLeave(group.id) : onJoin(group.id);
        }}
        data-ocid={isMember ? "leave-group-btn" : "join-group-btn"}
      >
        {joining ? "..." : isMember ? "Leave" : "Join"}
      </Button>
    </button>
  );
}

function GroupCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-32 bg-muted rounded-lg" />
        <Skeleton className="h-4 w-12 bg-muted rounded-full" />
      </div>
      <Skeleton className="h-4 w-full bg-muted rounded" />
      <Skeleton className="h-4 w-3/4 bg-muted rounded" />
      <Skeleton className="h-8 w-full bg-muted rounded-lg" />
    </div>
  );
}

function CreateGroupModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.createGroup(name, description, category);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["userGroups"] });
      toast.success("Group created!");
      onClose();
      navigate({ to: "/groups/$groupId", params: { groupId: group.id } });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !category) return;
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="bg-card border-border max-w-md"
        data-ocid="create-group-modal"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">
            Create a Group
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="font-body text-sm text-foreground">
              Group Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. OG Kush Enthusiasts"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              required
              data-ocid="group-name-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body text-sm text-foreground">
              Description
            </Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              rows={3}
              required
              className="w-full rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              data-ocid="group-description-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body text-sm text-foreground">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger
                className="bg-background border-border text-foreground"
                data-ocid="group-category-select"
              >
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {["Strains", "Culture", "Advocacy", "News"].map((c) => (
                  <SelectItem
                    key={c}
                    value={c}
                    className="text-foreground focus:bg-muted"
                  >
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            disabled={
              mutation.isPending ||
              !name.trim() ||
              !description.trim() ||
              !category
            }
            className="w-full"
            data-ocid="create-group-submit"
          >
            {mutation.isPending ? "Creating..." : "Create Group"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function GroupsPage() {
  const { actor, isLoading: actorLoading } = useBackend();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data: allGroups = [], isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: ["groups"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllGroups();
    },
    enabled: !!actor && !actorLoading,
    staleTime: 30_000,
  });

  const { data: userGroups = [], isLoading: myGroupsLoading } = useQuery<
    Group[]
  >({
    queryKey: ["userGroups"],
    queryFn: async () => {
      if (!actor || !isAuthenticated) return [];
      return actor.getUserGroups();
    },
    enabled: !!actor && !actorLoading && isAuthenticated,
    staleTime: 30_000,
  });

  const memberGroupIds = new Set(userGroups.map((g) => g.id));

  const joinMutation = useMutation({
    mutationFn: async (groupId: string) => {
      if (!actor) throw new Error("Not connected");
      setPendingId(groupId);
      const res = await actor.joinGroup(groupId);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["userGroups"] });
      toast.success("Joined group!");
    },
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => setPendingId(null),
  });

  const leaveMutation = useMutation({
    mutationFn: async (groupId: string) => {
      if (!actor) throw new Error("Not connected");
      setPendingId(groupId);
      const res = await actor.leaveGroup(groupId);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["userGroups"] });
      toast.success("Left group.");
    },
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => setPendingId(null),
  });

  const filteredAll = allGroups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()),
  );

  const isLoading = groupsLoading || actorLoading;

  return (
    <AuthGuard>
      <Layout>
        <div className="px-4 py-6 max-w-2xl mx-auto" data-ocid="groups-page">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-xl text-foreground">
              Communities
            </h2>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowCreate(true)}
              data-ocid="create-group-fab"
            >
              <Plus size={15} />
              New Group
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search communities..."
              className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
              data-ocid="groups-search-input"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="discover">
            <TabsList className="bg-muted w-full mb-5" data-ocid="groups-tabs">
              <TabsTrigger
                value="discover"
                className="flex-1 font-body"
                data-ocid="discover-tab"
              >
                Discover
              </TabsTrigger>
              <TabsTrigger
                value="my-groups"
                className="flex-1 font-body"
                data-ocid="my-groups-tab"
              >
                My Groups
                {userGroups.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 text-xs px-1.5 py-0 h-4"
                  >
                    {userGroups.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Discover Tab */}
            <TabsContent value="discover" data-ocid="discover-tab-content">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <GroupCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredAll.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-16 text-center"
                  data-ocid="groups-empty-state"
                >
                  <span className="text-5xl mb-3">🌿</span>
                  <p className="font-display font-semibold text-foreground mb-1">
                    {search ? "No groups found" : "No groups yet"}
                  </p>
                  <p className="text-muted-foreground text-sm font-body mb-4">
                    {search
                      ? "Try a different search term"
                      : "Be the first to start a community"}
                  </p>
                  {!search && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowCreate(true)}
                    >
                      Create a Group
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredAll.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      isMember={memberGroupIds.has(group.id)}
                      onJoin={(id) => joinMutation.mutate(id)}
                      onLeave={(id) => leaveMutation.mutate(id)}
                      joining={
                        pendingId === group.id &&
                        (joinMutation.isPending || leaveMutation.isPending)
                      }
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* My Groups Tab */}
            <TabsContent value="my-groups" data-ocid="my-groups-tab-content">
              {myGroupsLoading || actorLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2].map((i) => (
                    <GroupCardSkeleton key={i} />
                  ))}
                </div>
              ) : userGroups.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-16 text-center"
                  data-ocid="my-groups-empty-state"
                >
                  <span className="text-5xl mb-3">🫂</span>
                  <p className="font-display font-semibold text-foreground mb-1">
                    No groups joined yet
                  </p>
                  <p className="text-muted-foreground text-sm font-body mb-4">
                    Discover and join communities you care about
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {userGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      isMember={true}
                      onJoin={(id) => joinMutation.mutate(id)}
                      onLeave={(id) => leaveMutation.mutate(id)}
                      joining={
                        pendingId === group.id &&
                        (joinMutation.isPending || leaveMutation.isPending)
                      }
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <CreateGroupModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
        />
      </Layout>
    </AuthGuard>
  );
}
