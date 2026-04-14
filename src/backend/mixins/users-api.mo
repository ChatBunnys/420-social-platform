import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Set "mo:core/Set";
import UserTypes "../types/users";
import PostTypes "../types/posts";
import UsersLib "../lib/users";

mixin (
  adminPrincipal : { var value : ?Principal },
  users : Map.Map<Principal, UserTypes.UserInternal>,
  followers : Map.Map<Principal, Set.Set<Principal>>,
  following : Map.Map<Principal, Set.Set<Principal>>,
  posts : Map.Map<Text, PostTypes.PostInternal>,
) {
  public shared ({ caller }) func registerUser(
    username : Text,
    bio : Text,
    avatarUrl : ?Text,
  ) : async { #ok : UserTypes.User; #err : Text } {
    // First user becomes the admin
    if (users.isEmpty()) {
      adminPrincipal.value := ?caller;
    };
    UsersLib.registerUser(users, caller, username, bio, avatarUrl);
  };

  public query ({ caller }) func getUser(userId : Principal) : async ?UserTypes.User {
    UsersLib.getUser(users, userId);
  };

  public query ({ caller }) func getUserProfile(userId : Principal) : async ?UserTypes.UserProfile {
    UsersLib.getUserProfile(users, followers, following, posts, userId);
  };

  public shared ({ caller }) func updateProfile(
    username : Text,
    bio : Text,
    avatarUrl : ?Text,
  ) : async { #ok : UserTypes.User; #err : Text } {
    UsersLib.updateProfile(users, caller, username, bio, avatarUrl);
  };

  public shared ({ caller }) func followUser(targetId : Principal) : async { #ok : (); #err : Text } {
    UsersLib.followUser(users, followers, following, caller, targetId);
  };

  public shared ({ caller }) func unfollowUser(targetId : Principal) : async { #ok : (); #err : Text } {
    UsersLib.unfollowUser(users, followers, following, caller, targetId);
  };

  public query ({ caller }) func getFollowers(userId : Principal) : async [Principal] {
    UsersLib.getFollowers(followers, userId);
  };

  public query ({ caller }) func getFollowing(userId : Principal) : async [Principal] {
    UsersLib.getFollowing(following, userId);
  };

  public query ({ caller }) func isFollowing(userId : Principal, targetId : Principal) : async Bool {
    UsersLib.isFollowing(following, userId, targetId);
  };
};
