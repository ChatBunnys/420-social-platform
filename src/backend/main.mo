import Map "mo:core/Map";
import Set "mo:core/Set";
import Principal "mo:core/Principal";

import UserTypes "types/users";
import PostTypes "types/posts";
import CommentTypes "types/comments";
import StoryTypes "types/stories";
import GroupTypes "types/groups";
import MessageTypes "types/messages";
import ReportTypes "types/reports";

import UsersMixin "mixins/users-api";
import PostsMixin "mixins/posts-api";
import CommentsMixin "mixins/comments-api";
import StoriesMixin "mixins/stories-api";
import GroupsMixin "mixins/groups-api";
import MessagesMixin "mixins/messages-api";
import ReportsMixin "mixins/reports-api";
import AdminMixin "mixins/admin-api";

actor {
  // Admin state
  let adminPrincipal = { var value : ?Principal = null };

  // User state
  let users = Map.empty<Principal, UserTypes.UserInternal>();
  let followers = Map.empty<Principal, Set.Set<Principal>>();
  let following = Map.empty<Principal, Set.Set<Principal>>();

  // Post state
  let posts = Map.empty<Text, PostTypes.PostInternal>();
  let postCounter = { var value : Nat = 0 };

  // Comment state
  let comments = Map.empty<Text, CommentTypes.CommentInternal>();
  let commentCounter = { var value : Nat = 0 };

  // Story state
  let stories = Map.empty<Text, StoryTypes.Story>();
  let storyCounter = { var value : Nat = 0 };

  // Group state
  let groups = Map.empty<Text, GroupTypes.GroupInternal>();
  let groupMembers = Map.empty<Text, Set.Set<Principal>>();
  let groupPosts = Map.empty<Text, GroupTypes.GroupPost>();
  let groupCounter = { var value : Nat = 0 };
  let groupPostCounter = { var value : Nat = 0 };

  // Message state
  let messages = Map.empty<Text, MessageTypes.MessageInternal>();
  let messageCounter = { var value : Nat = 0 };

  // Report state
  let reports = Map.empty<Text, ReportTypes.ReportInternal>();
  let reportCounter = { var value : Nat = 0 };

  // Mixin inclusions
  include UsersMixin(adminPrincipal, users, followers, following, posts);
  include PostsMixin(users, posts, following, postCounter);
  include CommentsMixin(comments, posts, users, commentCounter);
  include StoriesMixin(stories, users, following, storyCounter);
  include GroupsMixin(groups, groupMembers, groupPosts, users, groupCounter, groupPostCounter);
  include MessagesMixin(messages, users, messageCounter);
  include ReportsMixin(reports, users, reportCounter);
  include AdminMixin(adminPrincipal, users, posts, comments, reports);
};
