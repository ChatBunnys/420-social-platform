import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Timestamp = bigint;
export type CommentId = string;
export interface Comment {
    id: CommentId;
    isDeleted: boolean;
    content: string;
    authorId: Principal;
    createdAt: Timestamp;
    postId: PostId;
}
export interface User {
    id: Principal;
    bio: string;
    username: string;
    createdAt: Timestamp;
    avatarUrl?: string;
    isSuspended: boolean;
    isAdmin: boolean;
}
export interface Story {
    id: StoryId;
    content?: string;
    expiresAt: Timestamp;
    authorId: Principal;
    createdAt: Timestamp;
    imageUrl?: string;
}
export type StoryId = string;
export type PostId = string;
export interface Group {
    id: GroupId;
    name: string;
    createdAt: Timestamp;
    memberCount: bigint;
    creatorId: Principal;
    description: string;
    category: string;
}
export interface Report {
    id: ReportId;
    contentId: string;
    contentType: string;
    isReviewed: boolean;
    createdAt: Timestamp;
    reporterId: Principal;
    details?: string;
    reason: string;
}
export type GroupId = string;
export type ReportId = string;
export type MessageId = string;
export interface Post {
    id: PostId;
    likeCount: bigint;
    isDeleted: boolean;
    content: string;
    authorId: Principal;
    createdAt: Timestamp;
    imageUrl?: string;
    commentCount: bigint;
}
export interface GroupPost {
    id: string;
    content: string;
    authorId: Principal;
    createdAt: Timestamp;
    imageUrl?: string;
    groupId: GroupId;
}
export interface Message {
    id: MessageId;
    content: string;
    createdAt: Timestamp;
    isRead: boolean;
    receiverId: Principal;
    senderId: Principal;
}
export interface Conversation {
    otherUserId: Principal;
    lastMessage?: Message;
    unreadCount: bigint;
}
export interface UserProfile {
    id: Principal;
    bio: string;
    postCount: bigint;
    username: string;
    createdAt: Timestamp;
    avatarUrl?: string;
    isSuspended: boolean;
    followerCount: bigint;
    isAdmin: boolean;
    followingCount: bigint;
}
export interface backendInterface {
    addComment(postId: string, content: string): Promise<{
        __kind__: "ok";
        ok: Comment;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminDeleteComment(commentId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminDeletePost(postId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createGroup(name: string, description: string, category: string): Promise<{
        __kind__: "ok";
        ok: Group;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createGroupPost(groupId: string, content: string, imageUrl: string | null): Promise<{
        __kind__: "ok";
        ok: GroupPost;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createPost(content: string, imageUrl: string | null): Promise<{
        __kind__: "ok";
        ok: Post;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createStory(content: string | null, imageUrl: string | null): Promise<{
        __kind__: "ok";
        ok: Story;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteComment(commentId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteGroup(groupId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deletePost(postId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    dismissReport(reportId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    followUser(targetId: Principal): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getActiveStories(): Promise<Array<Story>>;
    getAdminStats(): Promise<{
        pendingReports: bigint;
        totalReports: bigint;
        totalUsers: bigint;
        totalPosts: bigint;
    }>;
    getAllActiveStories(): Promise<Array<Story>>;
    getAllGroups(): Promise<Array<Group>>;
    getAllPosts(): Promise<Array<Post>>;
    getAllUsers(): Promise<Array<User>>;
    getComments(postId: string): Promise<Array<Comment>>;
    getConversations(): Promise<Array<Conversation>>;
    getExplorePosts(limit: bigint, offset: bigint): Promise<Array<Post>>;
    getFeedPosts(limit: bigint, offset: bigint): Promise<Array<Post>>;
    getFollowers(userId: Principal): Promise<Array<Principal>>;
    getFollowing(userId: Principal): Promise<Array<Principal>>;
    getGroup(groupId: string): Promise<Group | null>;
    getGroupMembers(groupId: string): Promise<Array<Principal>>;
    getGroupPosts(groupId: string, limit: bigint, offset: bigint): Promise<Array<GroupPost>>;
    getMessages(otherUserId: Principal): Promise<Array<Message>>;
    getMyStories(): Promise<Array<Story>>;
    getPost(postId: string): Promise<Post | null>;
    getReports(): Promise<Array<Report>>;
    getUnreadCount(): Promise<bigint>;
    getUser(userId: Principal): Promise<User | null>;
    getUserGroups(): Promise<Array<Group>>;
    getUserPosts(userId: Principal, limit: bigint, offset: bigint): Promise<Array<Post>>;
    getUserProfile(userId: Principal): Promise<UserProfile | null>;
    hasLikedPost(postId: string): Promise<boolean>;
    isFollowing(userId: Principal, targetId: Principal): Promise<boolean>;
    isGroupMember(groupId: string): Promise<boolean>;
    joinGroup(groupId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    leaveGroup(groupId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    likePost(postId: string): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    markMessagesRead(otherUserId: Principal): Promise<void>;
    registerUser(username: string, bio: string, avatarUrl: string | null): Promise<{
        __kind__: "ok";
        ok: User;
    } | {
        __kind__: "err";
        err: string;
    }>;
    reportContent(contentType: string, contentId: string, reason: string, details: string | null): Promise<{
        __kind__: "ok";
        ok: Report;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sendMessage(receiverId: Principal, content: string): Promise<{
        __kind__: "ok";
        ok: Message;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setAdmin(userId: Principal, isAdminFlag: boolean): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    suspendUser(userId: Principal): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    unfollowUser(targetId: Principal): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    unlikePost(postId: string): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    unsuspendUser(userId: Principal): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateProfile(username: string, bio: string, avatarUrl: string | null): Promise<{
        __kind__: "ok";
        ok: User;
    } | {
        __kind__: "err";
        err: string;
    }>;
}
