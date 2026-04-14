import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Types "../types/posts";
import UserTypes "../types/users";

module {
  public func createPost(
    posts : Map.Map<Text, Types.PostInternal>,
    counter : { var value : Nat },
    caller : Principal,
    users : Map.Map<Principal, UserTypes.UserInternal>,
    content : Text,
    imageUrl : ?Text,
  ) : { #ok : Types.Post; #err : Text } {
    if (content.size() == 0) return #err("Content cannot be empty");
    if (not users.containsKey(caller)) return #err("User not registered");
    counter.value += 1;
    let now = Time.now();
    let id = now.toText() # "-" # caller.toText() # "-" # counter.value.toText();
    let post : Types.PostInternal = {
      id;
      authorId = caller;
      var content = content;
      var imageUrl = imageUrl;
      createdAt = now;
      likedBy = Set.empty<Principal>();
      var commentCount = 0;
      var isDeleted = false;
    };
    posts.add(id, post);
    #ok(toPublic(post));
  };

  public func getPost(
    posts : Map.Map<Text, Types.PostInternal>,
    postId : Text,
  ) : ?Types.Post {
    switch (posts.get(postId)) {
      case (?p) if (not p.isDeleted) ?toPublic(p) else null;
      case null null;
    };
  };

  public func getFeedPosts(
    posts : Map.Map<Text, Types.PostInternal>,
    following : Map.Map<Principal, Set.Set<Principal>>,
    caller : Principal,
    limit : Nat,
    offset : Nat,
  ) : [Types.Post] {
    let followingSet = switch (following.get(caller)) {
      case (?s) s;
      case null Set.empty<Principal>();
    };
    let feedPosts = List.empty<Types.PostInternal>();
    posts.forEach(func(_, p) {
      if (not p.isDeleted and followingSet.contains(p.authorId)) {
        feedPosts.add(p);
      };
    });
    feedPosts.sortInPlace(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
    let arr = feedPosts.toArray();
    let start = if (offset >= arr.size()) arr.size() else offset;
    let end_ = if (start + limit > arr.size()) arr.size() else start + limit;
    arr.sliceToArray(start.toInt(), end_.toInt()).map<Types.PostInternal, Types.Post>(func p = toPublic(p));
  };

  public func getExplorePosts(
    posts : Map.Map<Text, Types.PostInternal>,
    limit : Nat,
    offset : Nat,
  ) : [Types.Post] {
    let allPosts = List.empty<Types.PostInternal>();
    posts.forEach(func(_, p) {
      if (not p.isDeleted) allPosts.add(p);
    });
    allPosts.sortInPlace(func(a, b) { Int.compare(b.likedBy.size().toInt(), a.likedBy.size().toInt()) });
    let arr = allPosts.toArray();
    let start = if (offset >= arr.size()) arr.size() else offset;
    let end_ = if (start + limit > arr.size()) arr.size() else start + limit;
    arr.sliceToArray(start.toInt(), end_.toInt()).map<Types.PostInternal, Types.Post>(func p = toPublic(p));
  };

  public func getUserPosts(
    posts : Map.Map<Text, Types.PostInternal>,
    userId : Principal,
    limit : Nat,
    offset : Nat,
  ) : [Types.Post] {
    let userPosts = List.empty<Types.PostInternal>();
    posts.forEach(func(_, p) {
      if (not p.isDeleted and Principal.equal(p.authorId, userId)) {
        userPosts.add(p);
      };
    });
    userPosts.sortInPlace(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
    let arr = userPosts.toArray();
    let start = if (offset >= arr.size()) arr.size() else offset;
    let end_ = if (start + limit > arr.size()) arr.size() else start + limit;
    arr.sliceToArray(start.toInt(), end_.toInt()).map<Types.PostInternal, Types.Post>(func p = toPublic(p));
  };

  public func deletePost(
    posts : Map.Map<Text, Types.PostInternal>,
    caller : Principal,
    postId : Text,
    isAdmin : Bool,
  ) : { #ok : (); #err : Text } {
    switch (posts.get(postId)) {
      case null #err("Post not found");
      case (?p) {
        if (not Principal.equal(p.authorId, caller) and not isAdmin) {
          return #err("Not authorized");
        };
        p.isDeleted := true;
        #ok(());
      };
    };
  };

  public func likePost(
    posts : Map.Map<Text, Types.PostInternal>,
    caller : Principal,
    postId : Text,
  ) : { #ok : Nat; #err : Text } {
    switch (posts.get(postId)) {
      case null #err("Post not found");
      case (?p) {
        if (p.isDeleted) return #err("Post not found");
        p.likedBy.add(caller);
        #ok(p.likedBy.size());
      };
    };
  };

  public func unlikePost(
    posts : Map.Map<Text, Types.PostInternal>,
    caller : Principal,
    postId : Text,
  ) : { #ok : Nat; #err : Text } {
    switch (posts.get(postId)) {
      case null #err("Post not found");
      case (?p) {
        if (p.isDeleted) return #err("Post not found");
        p.likedBy.remove(caller);
        #ok(p.likedBy.size());
      };
    };
  };

  public func hasLikedPost(
    posts : Map.Map<Text, Types.PostInternal>,
    caller : Principal,
    postId : Text,
  ) : Bool {
    switch (posts.get(postId)) {
      case (?p) p.likedBy.contains(caller);
      case null false;
    };
  };

  public func toPublic(post : Types.PostInternal) : Types.Post {
    {
      id = post.id;
      authorId = post.authorId;
      content = post.content;
      imageUrl = post.imageUrl;
      createdAt = post.createdAt;
      likeCount = post.likedBy.size();
      commentCount = post.commentCount;
      isDeleted = post.isDeleted;
    };
  };
};
