import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Set "mo:core/Set";
import PostTypes "../types/posts";
import UserTypes "../types/users";
import PostsLib "../lib/posts";

mixin (
  users : Map.Map<Principal, UserTypes.UserInternal>,
  posts : Map.Map<Text, PostTypes.PostInternal>,
  following : Map.Map<Principal, Set.Set<Principal>>,
  postCounter : { var value : Nat },
) {
  public shared ({ caller }) func createPost(
    content : Text,
    imageUrl : ?Text,
  ) : async { #ok : PostTypes.Post; #err : Text } {
    PostsLib.createPost(posts, postCounter, caller, users, content, imageUrl);
  };

  public query ({ caller }) func getPost(postId : Text) : async ?PostTypes.Post {
    PostsLib.getPost(posts, postId);
  };

  public query ({ caller }) func getFeedPosts(limit : Nat, offset : Nat) : async [PostTypes.Post] {
    PostsLib.getFeedPosts(posts, following, caller, limit, offset);
  };

  public query ({ caller }) func getExplorePosts(limit : Nat, offset : Nat) : async [PostTypes.Post] {
    PostsLib.getExplorePosts(posts, limit, offset);
  };

  public query ({ caller }) func getUserPosts(userId : Principal, limit : Nat, offset : Nat) : async [PostTypes.Post] {
    PostsLib.getUserPosts(posts, userId, limit, offset);
  };

  public shared ({ caller }) func deletePost(postId : Text) : async { #ok : (); #err : Text } {
    PostsLib.deletePost(posts, caller, postId, false);
  };

  public shared ({ caller }) func likePost(postId : Text) : async { #ok : Nat; #err : Text } {
    PostsLib.likePost(posts, caller, postId);
  };

  public shared ({ caller }) func unlikePost(postId : Text) : async { #ok : Nat; #err : Text } {
    PostsLib.unlikePost(posts, caller, postId);
  };

  public query ({ caller }) func hasLikedPost(postId : Text) : async Bool {
    PostsLib.hasLikedPost(posts, caller, postId);
  };
};
