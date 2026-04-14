import type { Principal } from "@icp-sdk/core/principal";

export type { Principal };

export type Timestamp = bigint;
export type PostId = string;
export type CommentId = string;
export type StoryId = string;
export type GroupId = string;
export type ReportId = string;
export type MessageId = string;

export interface User {
  id: Principal;
  bio: string;
  username: string;
  createdAt: Timestamp;
  avatarUrl?: string;
  isSuspended: boolean;
  isAdmin: boolean;
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

export interface Comment {
  id: CommentId;
  isDeleted: boolean;
  content: string;
  authorId: Principal;
  createdAt: Timestamp;
  postId: PostId;
}

export interface Story {
  id: StoryId;
  content?: string;
  expiresAt: Timestamp;
  authorId: Principal;
  createdAt: Timestamp;
  imageUrl?: string;
}

export interface Group {
  id: GroupId;
  name: string;
  createdAt: Timestamp;
  memberCount: bigint;
  creatorId: Principal;
  description: string;
  category: string;
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

export interface AdminStats {
  pendingReports: bigint;
  totalReports: bigint;
  totalUsers: bigint;
  totalPosts: bigint;
}

export interface AgeVerificationState {
  verified: boolean;
  timestamp: number;
}

export type NavItem = {
  label: string;
  path: string;
  icon: string;
  adminOnly?: boolean;
};
