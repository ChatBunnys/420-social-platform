import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Types "../types/users";
import PostTypes "../types/posts";

module {
  public func registerUser(
    users : Map.Map<Principal, Types.UserInternal>,
    caller : Principal,
    username : Text,
    bio : Text,
    avatarUrl : ?Text,
  ) : { #ok : Types.User; #err : Text } {
    if (username.size() == 0) return #err("Username cannot be empty");
    if (users.containsKey(caller)) return #err("User already registered");
    // Check username uniqueness
    let taken = users.any(func(_, u) { u.username == username });
    if (taken) return #err("Username already taken");
    let user : Types.UserInternal = {
      id = caller;
      var username = username;
      var bio = bio;
      var avatarUrl = avatarUrl;
      createdAt = Time.now();
      var isAdmin = false;
      var isSuspended = false;
    };
    users.add(caller, user);
    #ok(toPublic(user));
  };

  public func getUser(
    users : Map.Map<Principal, Types.UserInternal>,
    userId : Principal,
  ) : ?Types.User {
    switch (users.get(userId)) {
      case (?u) ?toPublic(u);
      case null null;
    };
  };

  public func getUserProfile(
    users : Map.Map<Principal, Types.UserInternal>,
    followers : Map.Map<Principal, Set.Set<Principal>>,
    following : Map.Map<Principal, Set.Set<Principal>>,
    posts : Map.Map<Text, PostTypes.PostInternal>,
    userId : Principal,
  ) : ?Types.UserProfile {
    switch (users.get(userId)) {
      case null null;
      case (?u) {
        let followerCount = switch (followers.get(userId)) {
          case (?s) s.size();
          case null 0;
        };
        let followingCount = switch (following.get(userId)) {
          case (?s) s.size();
          case null 0;
        };
        var postCount : Nat = 0;
        posts.forEach(func(_, p) {
          if (Principal.equal(p.authorId, userId) and not p.isDeleted) {
            postCount += 1;
          };
        });
        ?{
          id = u.id;
          username = u.username;
          bio = u.bio;
          avatarUrl = u.avatarUrl;
          createdAt = u.createdAt;
          isAdmin = u.isAdmin;
          isSuspended = u.isSuspended;
          followerCount;
          followingCount;
          postCount;
        };
      };
    };
  };

  public func updateProfile(
    users : Map.Map<Principal, Types.UserInternal>,
    caller : Principal,
    username : Text,
    bio : Text,
    avatarUrl : ?Text,
  ) : { #ok : Types.User; #err : Text } {
    if (username.size() == 0) return #err("Username cannot be empty");
    switch (users.get(caller)) {
      case null #err("User not found");
      case (?u) {
        // Check username uniqueness (excluding self)
        let taken = users.any(func(id, usr) {
          usr.username == username and not Principal.equal(id, caller)
        });
        if (taken) return #err("Username already taken");
        u.username := username;
        u.bio := bio;
        u.avatarUrl := avatarUrl;
        #ok(toPublic(u));
      };
    };
  };

  public func followUser(
    users : Map.Map<Principal, Types.UserInternal>,
    followers : Map.Map<Principal, Set.Set<Principal>>,
    following : Map.Map<Principal, Set.Set<Principal>>,
    caller : Principal,
    targetId : Principal,
  ) : { #ok : (); #err : Text } {
    if (Principal.equal(caller, targetId)) return #err("Cannot follow yourself");
    if (not users.containsKey(caller)) return #err("Caller not registered");
    if (not users.containsKey(targetId)) return #err("Target user not found");
    // Add to caller's following set
    let callerFollowing = switch (following.get(caller)) {
      case (?s) s;
      case null {
        let s = Set.empty<Principal>();
        following.add(caller, s);
        s;
      };
    };
    callerFollowing.add(targetId);
    // Add caller to target's followers set
    let targetFollowers = switch (followers.get(targetId)) {
      case (?s) s;
      case null {
        let s = Set.empty<Principal>();
        followers.add(targetId, s);
        s;
      };
    };
    targetFollowers.add(caller);
    #ok(());
  };

  public func unfollowUser(
    users : Map.Map<Principal, Types.UserInternal>,
    followers : Map.Map<Principal, Set.Set<Principal>>,
    following : Map.Map<Principal, Set.Set<Principal>>,
    caller : Principal,
    targetId : Principal,
  ) : { #ok : (); #err : Text } {
    if (not users.containsKey(caller)) return #err("Caller not registered");
    switch (following.get(caller)) {
      case (?s) s.remove(targetId);
      case null {};
    };
    switch (followers.get(targetId)) {
      case (?s) s.remove(caller);
      case null {};
    };
    #ok(());
  };

  public func getFollowers(
    followers : Map.Map<Principal, Set.Set<Principal>>,
    userId : Principal,
  ) : [Principal] {
    switch (followers.get(userId)) {
      case (?s) s.toArray();
      case null [];
    };
  };

  public func getFollowing(
    following : Map.Map<Principal, Set.Set<Principal>>,
    userId : Principal,
  ) : [Principal] {
    switch (following.get(userId)) {
      case (?s) s.toArray();
      case null [];
    };
  };

  public func isFollowing(
    following : Map.Map<Principal, Set.Set<Principal>>,
    userId : Principal,
    targetId : Principal,
  ) : Bool {
    switch (following.get(userId)) {
      case (?s) s.contains(targetId);
      case null false;
    };
  };

  public func toPublic(user : Types.UserInternal) : Types.User {
    {
      id = user.id;
      username = user.username;
      bio = user.bio;
      avatarUrl = user.avatarUrl;
      createdAt = user.createdAt;
      isAdmin = user.isAdmin;
      isSuspended = user.isSuspended;
    };
  };
};
