import type { backendInterface } from "../backend";

const samplePrincipal = { toString: () => "aaaaa-aa", toText: () => "aaaaa-aa", compareTo: () => 0, isAnonymous: () => false, toUint8Array: () => new Uint8Array(), toHex: () => "00" } as any;

const samplePost = {
  id: "post-1",
  likeCount: BigInt(42),
  isDeleted: false,
  content: "Just rolled the perfect blunt 🌿 #420culture #cannabis #highlife",
  authorId: samplePrincipal,
  createdAt: BigInt(Date.now() * 1_000_000),
  imageUrl: undefined,
  commentCount: BigInt(7),
};

const samplePost2 = {
  id: "post-2",
  likeCount: BigInt(88),
  isDeleted: false,
  content: "Strain of the week: Blue Dream 💨 Smooth, euphoric, creative vibes all around. Who else loves this one?",
  authorId: samplePrincipal,
  createdAt: BigInt((Date.now() - 3600000) * 1_000_000),
  imageUrl: undefined,
  commentCount: BigInt(14),
};

const samplePost3 = {
  id: "post-3",
  likeCount: BigInt(23),
  isDeleted: false,
  content: "Home grow update 🌱 Week 6 of flower stage. Looking frosty! #homegrow #growyourown",
  authorId: samplePrincipal,
  createdAt: BigInt((Date.now() - 7200000) * 1_000_000),
  imageUrl: undefined,
  commentCount: BigInt(3),
};

const sampleStory = {
  id: "story-1",
  content: "Morning sesh 🌿",
  expiresAt: BigInt((Date.now() + 86400000) * 1_000_000),
  authorId: samplePrincipal,
  createdAt: BigInt(Date.now() * 1_000_000),
  imageUrl: undefined,
};

const sampleStory2 = {
  id: "story-2",
  content: "Dispensary run!",
  expiresAt: BigInt((Date.now() + 86400000) * 1_000_000),
  authorId: samplePrincipal,
  createdAt: BigInt((Date.now() - 1800000) * 1_000_000),
  imageUrl: undefined,
};

const sampleGroup = {
  id: "group-1",
  name: "Strain Hunters",
  createdAt: BigInt(Date.now() * 1_000_000),
  memberCount: BigInt(234),
  creatorId: samplePrincipal,
  description: "Discovering and sharing the best cannabis strains from around the world.",
  category: "strains",
};

const sampleGroup2 = {
  id: "group-2",
  name: "420 Advocacy",
  createdAt: BigInt(Date.now() * 1_000_000),
  memberCount: BigInt(512),
  creatorId: samplePrincipal,
  description: "Fighting for cannabis legalization and social justice reform.",
  category: "advocacy",
};

const sampleUser = {
  id: samplePrincipal,
  bio: "Cannabis enthusiast 🌿 | Home grower | Strain connoisseur",
  username: "GreenThumb420",
  createdAt: BigInt(Date.now() * 1_000_000),
  avatarUrl: undefined,
  isSuspended: false,
  isAdmin: false,
};

const sampleComment = {
  id: "comment-1",
  isDeleted: false,
  content: "This looks incredible! What strain is that?",
  authorId: samplePrincipal,
  createdAt: BigInt(Date.now() * 1_000_000),
  postId: "post-1",
};

const sampleMessage = {
  id: "msg-1",
  content: "Hey, want to trade some clones?",
  createdAt: BigInt(Date.now() * 1_000_000),
  isRead: false,
  receiverId: samplePrincipal,
  senderId: samplePrincipal,
};

const sampleReport = {
  id: "report-1",
  contentId: "post-1",
  contentType: "post",
  isReviewed: false,
  createdAt: BigInt(Date.now() * 1_000_000),
  reporterId: samplePrincipal,
  details: undefined,
  reason: "Spam",
};

export const mockBackend: backendInterface = {
  addComment: async () => ({ __kind__: "ok", ok: sampleComment }),
  adminDeleteComment: async () => ({ __kind__: "ok", ok: null }),
  adminDeletePost: async () => ({ __kind__: "ok", ok: null }),
  createGroup: async () => ({ __kind__: "ok", ok: sampleGroup }),
  createGroupPost: async () => ({ __kind__: "ok", ok: { id: "gp-1", content: "Group post", authorId: samplePrincipal, createdAt: BigInt(Date.now() * 1_000_000), imageUrl: undefined, groupId: "group-1" } }),
  createPost: async () => ({ __kind__: "ok", ok: samplePost }),
  createStory: async () => ({ __kind__: "ok", ok: sampleStory }),
  deleteComment: async () => ({ __kind__: "ok", ok: null }),
  deleteGroup: async () => ({ __kind__: "ok", ok: null }),
  deletePost: async () => ({ __kind__: "ok", ok: null }),
  dismissReport: async () => ({ __kind__: "ok", ok: null }),
  followUser: async () => ({ __kind__: "ok", ok: null }),
  getActiveStories: async () => [sampleStory, sampleStory2],
  getAdminStats: async () => ({ pendingReports: BigInt(3), totalReports: BigInt(12), totalUsers: BigInt(420), totalPosts: BigInt(1337) }),
  getAllActiveStories: async () => [sampleStory, sampleStory2],
  getAllGroups: async () => [sampleGroup, sampleGroup2],
  getAllPosts: async () => [samplePost, samplePost2, samplePost3],
  getAllUsers: async () => [sampleUser],
  getComments: async () => [sampleComment],
  getConversations: async () => [{ otherUserId: samplePrincipal, lastMessage: sampleMessage, unreadCount: BigInt(1) }],
  getExplorePosts: async () => [samplePost, samplePost2, samplePost3],
  getFeedPosts: async () => [samplePost, samplePost2, samplePost3],
  getFollowers: async () => [samplePrincipal],
  getFollowing: async () => [samplePrincipal],
  getGroup: async () => sampleGroup,
  getGroupMembers: async () => [samplePrincipal],
  getGroupPosts: async () => [{ id: "gp-1", content: "Group discussion post", authorId: samplePrincipal, createdAt: BigInt(Date.now() * 1_000_000), imageUrl: undefined, groupId: "group-1" }],
  getMessages: async () => [sampleMessage],
  getMyStories: async () => [sampleStory],
  getPost: async () => samplePost,
  getReports: async () => [sampleReport],
  getUnreadCount: async () => BigInt(2),
  getUser: async () => sampleUser,
  getUserGroups: async () => [sampleGroup],
  getUserPosts: async () => [samplePost, samplePost2],
  getUserProfile: async () => ({ id: samplePrincipal, bio: "Cannabis enthusiast 🌿", postCount: BigInt(42), username: "GreenThumb420", createdAt: BigInt(Date.now() * 1_000_000), avatarUrl: undefined, isSuspended: false, followerCount: BigInt(420), isAdmin: false, followingCount: BigInt(69) }),
  hasLikedPost: async () => false,
  isFollowing: async () => false,
  isGroupMember: async () => false,
  joinGroup: async () => ({ __kind__: "ok", ok: null }),
  leaveGroup: async () => ({ __kind__: "ok", ok: null }),
  likePost: async () => ({ __kind__: "ok", ok: BigInt(43) }),
  markMessagesRead: async () => undefined,
  registerUser: async () => ({ __kind__: "ok", ok: sampleUser }),
  reportContent: async () => ({ __kind__: "ok", ok: sampleReport }),
  sendMessage: async () => ({ __kind__: "ok", ok: sampleMessage }),
  setAdmin: async () => ({ __kind__: "ok", ok: null }),
  suspendUser: async () => ({ __kind__: "ok", ok: null }),
  unfollowUser: async () => ({ __kind__: "ok", ok: null }),
  unlikePost: async () => ({ __kind__: "ok", ok: BigInt(41) }),
  unsuspendUser: async () => ({ __kind__: "ok", ok: null }),
  updateProfile: async () => ({ __kind__: "ok", ok: sampleUser }),
};
