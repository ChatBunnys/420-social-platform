import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useBackend } from "@/hooks/useBackend";
import type { Conversation, Message, User } from "@/types/index";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Edit, Search, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function principalStr(p: Principal): string {
  return p.toString();
}

function formatTime(ts: bigint): string {
  const d = new Date(Number(ts / 1_000_000n));
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMessageTime(ts: bigint): string {
  const d = new Date(Number(ts / 1_000_000n));
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

// ── New Message Modal ─────────────────────────────────────────────────────────

interface NewMessageModalProps {
  onClose: () => void;
  onSelect: (userId: Principal, username: string) => void;
}

function NewMessageModal({ onClose, onSelect }: NewMessageModalProps) {
  const { actor, isLoading } = useBackend();
  const [search, setSearch] = useState("");

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["all-users"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isLoading,
  });

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      data-ocid="new-message-modal"
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-display font-bold text-foreground text-base">
            New Message
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
            data-ocid="close-new-message"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-border"
              data-ocid="new-message-search"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6 font-body">
              No users found
            </p>
          ) : (
            filtered.map((u) => (
              <button
                type="button"
                key={principalStr(u.id)}
                onClick={() => onSelect(u.id, u.username)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
                data-ocid="user-select-item"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={u.avatarUrl} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                    {getInitials(u.username)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-body text-foreground text-sm">
                  @{u.username}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Conversation Item ─────────────────────────────────────────────────────────

interface ConversationItemProps {
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
}

function ConversationItem({ conv, isActive, onClick }: ConversationItemProps) {
  const { actor, isLoading } = useBackend();

  const { data: user } = useQuery<User | null>({
    queryKey: ["user", principalStr(conv.otherUserId)],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUser(conv.otherUserId);
    },
    enabled: !!actor && !isLoading,
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left ${
        isActive ? "bg-muted/40 border-r-2 border-primary" : ""
      }`}
      data-ocid="conversation-item"
    >
      <div className="relative shrink-0">
        <Avatar className="h-11 w-11">
          <AvatarImage src={user?.avatarUrl} />
          <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
            {user ? getInitials(user.username) : "??"}
          </AvatarFallback>
        </Avatar>
        {conv.unreadCount > 0n && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {conv.unreadCount > 9n ? "9+" : conv.unreadCount.toString()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="font-body font-semibold text-foreground text-sm truncate">
            @{user?.username ?? "…"}
          </p>
          {conv.lastMessage && (
            <span className="text-muted-foreground text-xs shrink-0">
              {formatTime(conv.lastMessage.createdAt)}
            </span>
          )}
        </div>
        <p
          className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0n ? "text-foreground font-medium" : "text-muted-foreground"}`}
        >
          {conv.lastMessage?.content ?? "Start a conversation"}
        </p>
      </div>
    </button>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  msg: Message;
  isMine: boolean;
  showTime: boolean;
}

function MessageBubble({ msg, isMine, showTime }: MessageBubbleProps) {
  return (
    <div
      className={`flex flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}
    >
      <div
        className={`max-w-[72%] px-3.5 py-2 rounded-2xl text-sm font-body leading-relaxed break-words ${
          isMine
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card text-foreground border border-border rounded-bl-sm"
        }`}
        data-ocid="message-bubble"
      >
        {msg.content}
      </div>
      {showTime && (
        <span className="text-muted-foreground/60 text-[11px] px-1">
          {formatMessageTime(msg.createdAt)}
        </span>
      )}
    </div>
  );
}

// ── Message Thread ────────────────────────────────────────────────────────────

interface MessageThreadProps {
  otherUserId: Principal;
  onBack: () => void;
  isMobile: boolean;
}

function MessageThread({ otherUserId, onBack, isMobile }: MessageThreadProps) {
  const { actor, isLoading } = useBackend();
  const { principal } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const otherIdStr = principalStr(otherUserId);

  const { data: otherUser } = useQuery<User | null>({
    queryKey: ["user", otherIdStr],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUser(otherUserId);
    },
    enabled: !!actor && !isLoading,
  });

  const { data: messages = [], isLoading: loadingMsgs } = useQuery<Message[]>({
    queryKey: ["messages", otherIdStr],
    queryFn: async () => {
      if (!actor) return [];
      const msgs = await actor.getMessages(otherUserId);
      // Mark as read
      await actor.markMessagesRead(otherUserId);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      return msgs;
    },
    enabled: !!actor && !isLoading,
    refetchInterval: 5_000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error("No actor");
      const result = await actor.sendMessage(otherUserId, content);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", otherIdStr] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || sendMutation.isPending) return;
    setText("");
    sendMutation.mutate(trimmed);
  }, [text, sendMutation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const myPrincipalStr = principal ? principalStr(principal) : "";

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        {isMobile && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 rounded-full shrink-0"
            data-ocid="thread-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={otherUser?.avatarUrl} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
            {otherUser ? getInitials(otherUser.username) : "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-foreground text-sm truncate">
            @{otherUser?.username ?? "…"}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary/50" />
            <span className="text-muted-foreground text-xs">Active</span>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
        data-ocid="messages-area"
      >
        {loadingMsgs ? (
          <div className="space-y-3">
            {["sk-msg-1", "sk-msg-2", "sk-msg-3", "sk-msg-4"].map((id, i) => (
              <div
                key={id}
                className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
              >
                <Skeleton
                  className={`h-10 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-32"}`}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <p className="text-3xl">💬</p>
            <p className="text-foreground font-display font-semibold text-sm">
              Start the conversation
            </p>
            <p className="text-muted-foreground text-xs font-body">
              Say hello to @{otherUser?.username}
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = principalStr(msg.senderId) === myPrincipalStr;
            const isLast = idx === messages.length - 1;
            const isEvery5 = idx % 5 === 0;
            return (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isMine={isMine}
                showTime={isLast || isEvery5}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Send a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-background border-border rounded-full px-4"
            data-ocid="message-input"
            disabled={sendMutation.isPending}
          />
          <Button
            type="button"
            onClick={handleSend}
            disabled={!text.trim() || sendMutation.isPending}
            size="icon"
            className="h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            data-ocid="send-message-btn"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Conversation List Panel ───────────────────────────────────────────────────

interface ConversationListProps {
  activeUserId: string | null;
  onSelect: (userId: Principal) => void;
  onCompose: () => void;
}

function ConversationList({
  activeUserId,
  onSelect,
  onCompose,
}: ConversationListProps) {
  const { actor, isLoading } = useBackend();

  const { data: conversations = [], isLoading: loadingConvs } = useQuery<
    Conversation[]
  >({
    queryKey: ["conversations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getConversations();
    },
    enabled: !!actor && !isLoading,
    refetchInterval: 10_000,
  });

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0n);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="font-display font-bold text-foreground text-lg">
            Messages
          </h2>
          {totalUnread > 0n && (
            <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-5 rounded-full">
              {totalUnread > 99n ? "99+" : totalUnread.toString()}
            </Badge>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCompose}
          className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
          data-ocid="compose-message-btn"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto" data-ocid="conversation-list">
        {loadingConvs ? (
          <div className="px-4 py-3 space-y-3">
            {[
              "sk-conv-1",
              "sk-conv-2",
              "sk-conv-3",
              "sk-conv-4",
              "sk-conv-5",
            ].map((id, i) => (
              <div key={id} className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton
                    className={`h-3 ${i % 2 === 0 ? "w-40" : "w-32"} rounded`}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 py-12 text-center">
            <p className="text-4xl">✉️</p>
            <p className="font-display font-semibold text-foreground text-sm">
              No messages yet
            </p>
            <p className="text-muted-foreground text-xs font-body">
              Start a conversation with someone in the community
            </p>
            <Button
              type="button"
              onClick={onCompose}
              variant="outline"
              size="sm"
              className="rounded-full border-primary text-primary hover:bg-primary/10"
              data-ocid="empty-compose-btn"
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              New Message
            </Button>
          </div>
        ) : (
          conversations.map((conv) => (
            <ConversationItem
              key={principalStr(conv.otherUserId)}
              conv={conv}
              isActive={activeUserId === principalStr(conv.otherUserId)}
              onClick={() => onSelect(conv.otherUserId)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { userId?: string };
  const [showCompose, setShowCompose] = useState(false);
  const [activePrincipal, setActivePrincipal] = useState<Principal | null>(
    null,
  );
  const { actor, isLoading } = useBackend();

  // Resolve userId param → Principal
  const { data: resolvedUser } = useQuery<User | null>({
    queryKey: ["user-by-param", params.userId],
    queryFn: async () => {
      if (!actor || !params.userId) return null;
      // params.userId is a principal string
      const { Principal: PrincipalClass } = await import(
        "@icp-sdk/core/principal"
      );
      try {
        const p = PrincipalClass.fromText(params.userId);
        return actor.getUser(p);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isLoading && !!params.userId,
  });

  useEffect(() => {
    if (resolvedUser) {
      setActivePrincipal(resolvedUser.id);
    }
  }, [resolvedUser]);

  const activeUserIdStr = activePrincipal
    ? principalStr(activePrincipal)
    : null;

  const handleSelectConversation = (userId: Principal) => {
    setActivePrincipal(userId);
    navigate({ to: `/messages/${principalStr(userId)}` });
  };

  const handleBack = () => {
    setActivePrincipal(null);
    navigate({ to: "/messages" });
  };

  const handleComposeSelect = (userId: Principal) => {
    setShowCompose(false);
    handleSelectConversation(userId);
  };

  // Mobile: show thread if active, else show list
  // Desktop: always show both panels

  return (
    <AuthGuard>
      <Layout hideNav={false}>
        <div
          className="flex h-[calc(100vh-4rem)] lg:h-[calc(100vh-8rem)] overflow-hidden"
          data-ocid="messages-page"
        >
          {/* Left panel: conversation list */}
          <div
            className={`
              w-full lg:w-80 xl:w-96 border-r border-border bg-background shrink-0 flex flex-col
              ${activePrincipal ? "hidden lg:flex" : "flex"}
            `}
          >
            <ConversationList
              activeUserId={activeUserIdStr}
              onSelect={handleSelectConversation}
              onCompose={() => setShowCompose(true)}
            />
          </div>

          {/* Right panel: message thread */}
          <div
            className={`
              flex-1 min-w-0 flex flex-col bg-background
              ${activePrincipal ? "flex" : "hidden lg:flex"}
            `}
          >
            {activePrincipal ? (
              <MessageThread
                key={activeUserIdStr}
                otherUserId={activePrincipal}
                onBack={handleBack}
                isMobile={true}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                <p className="text-5xl">💬</p>
                <p className="font-display font-bold text-foreground text-lg">
                  Your Messages
                </p>
                <p className="text-muted-foreground font-body text-sm max-w-xs">
                  Select a conversation from the list or start a new one
                </p>
                <Button
                  type="button"
                  onClick={() => setShowCompose(true)}
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 mt-1"
                  data-ocid="empty-state-compose"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  New Message
                </Button>
              </div>
            )}
          </div>
        </div>

        {showCompose && (
          <NewMessageModal
            onClose={() => setShowCompose(false)}
            onSelect={handleComposeSelect}
          />
        )}
      </Layout>
    </AuthGuard>
  );
}
