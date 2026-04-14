import Principal "mo:core/Principal";
import Map "mo:core/Map";
import List "mo:core/List";
import UserTypes "../types/users";
import PostTypes "../types/posts";
import CommentTypes "../types/comments";
import ReportTypes "../types/reports";
import PostsLib "../lib/posts";
import CommentsLib "../lib/comments";

mixin (
  adminPrincipal : { var value : ?Principal },
  users : Map.Map<Principal, UserTypes.UserInternal>,
  posts : Map.Map<Text, PostTypes.PostInternal>,
  comments : Map.Map<Text, CommentTypes.CommentInternal>,
  reports : Map.Map<Text, ReportTypes.ReportInternal>,
) {
  func isAdmin(caller : Principal) : Bool {
    switch (adminPrincipal.value) {
      case (?admin) if (Principal.equal(caller, admin)) return true;
      case null {};
    };
    switch (users.get(caller)) {
      case (?u) u.isAdmin;
      case null false;
    };
  };

  public query ({ caller }) func getAllUsers() : async [UserTypes.User] {
    if (not isAdmin(caller)) return [];
    let all = List.empty<UserTypes.User>();
    users.forEach(func(_, u) {
      all.add({
        id = u.id;
        username = u.username;
        bio = u.bio;
        avatarUrl = u.avatarUrl;
        createdAt = u.createdAt;
        isAdmin = u.isAdmin;
        isSuspended = u.isSuspended;
      });
    });
    all.toArray();
  };

  public query ({ caller }) func getAllPosts() : async [PostTypes.Post] {
    if (not isAdmin(caller)) return [];
    let all = List.empty<PostTypes.Post>();
    posts.forEach(func(_, p) {
      all.add(PostsLib.toPublic(p));
    });
    all.toArray();
  };

  public shared ({ caller }) func adminDeletePost(postId : Text) : async { #ok : (); #err : Text } {
    if (not isAdmin(caller)) return #err("Not authorized");
    PostsLib.deletePost(posts, caller, postId, true);
  };

  public shared ({ caller }) func adminDeleteComment(commentId : Text) : async { #ok : (); #err : Text } {
    if (not isAdmin(caller)) return #err("Not authorized");
    CommentsLib.deleteComment(comments, posts, caller, commentId, true);
  };

  public shared ({ caller }) func suspendUser(userId : Principal) : async { #ok : (); #err : Text } {
    if (not isAdmin(caller)) return #err("Not authorized");
    switch (users.get(userId)) {
      case null #err("User not found");
      case (?u) {
        u.isSuspended := true;
        #ok(());
      };
    };
  };

  public shared ({ caller }) func unsuspendUser(userId : Principal) : async { #ok : (); #err : Text } {
    if (not isAdmin(caller)) return #err("Not authorized");
    switch (users.get(userId)) {
      case null #err("User not found");
      case (?u) {
        u.isSuspended := false;
        #ok(());
      };
    };
  };

  public shared ({ caller }) func setAdmin(userId : Principal, isAdminFlag : Bool) : async { #ok : (); #err : Text } {
    // Only root admin (adminPrincipal) can promote/demote
    let isRoot = switch (adminPrincipal.value) {
      case (?admin) Principal.equal(caller, admin);
      case null false;
    };
    if (not isRoot) return #err("Only root admin can set admin status");
    switch (users.get(userId)) {
      case null #err("User not found");
      case (?u) {
        u.isAdmin := isAdminFlag;
        #ok(());
      };
    };
  };

  public query ({ caller }) func getAdminStats() : async {
    totalUsers : Nat;
    totalPosts : Nat;
    totalReports : Nat;
    pendingReports : Nat;
  } {
    if (not isAdmin(caller)) {
      return { totalUsers = 0; totalPosts = 0; totalReports = 0; pendingReports = 0 };
    };
    var totalPosts : Nat = 0;
    posts.forEach(func(_, p) {
      if (not p.isDeleted) totalPosts += 1;
    });
    var pendingReports : Nat = 0;
    reports.forEach(func(_, r) {
      if (not r.isReviewed) pendingReports += 1;
    });
    {
      totalUsers = users.size();
      totalPosts;
      totalReports = reports.size();
      pendingReports;
    };
  };
};
