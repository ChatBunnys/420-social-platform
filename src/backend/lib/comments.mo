import Principal "mo:core/Principal";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Types "../types/comments";
import PostTypes "../types/posts";
import UserTypes "../types/users";

module {
  public func addComment(
    comments : Map.Map<Text, Types.CommentInternal>,
    posts : Map.Map<Text, PostTypes.PostInternal>,
    counter : { var value : Nat },
    caller : Principal,
    users : Map.Map<Principal, UserTypes.UserInternal>,
    postId : Text,
    content : Text,
  ) : { #ok : Types.Comment; #err : Text } {
    if (content.size() == 0) return #err("Comment cannot be empty");
    if (not users.containsKey(caller)) return #err("User not registered");
    switch (posts.get(postId)) {
      case null #err("Post not found");
      case (?post) {
        if (post.isDeleted) return #err("Post not found");
        counter.value += 1;
        let id = Time.now().toText() # "-c-" # caller.toText() # "-" # counter.value.toText();
        let comment : Types.CommentInternal = {
          id;
          postId;
          authorId = caller;
          var content = content;
          createdAt = Time.now();
          var isDeleted = false;
        };
        comments.add(id, comment);
        post.commentCount += 1;
        #ok(toPublic(comment));
      };
    };
  };

  public func getComments(
    comments : Map.Map<Text, Types.CommentInternal>,
    postId : Text,
  ) : [Types.Comment] {
    let postComments = List.empty<Types.CommentInternal>();
    comments.forEach(func(_, c) {
      if (c.postId == postId and not c.isDeleted) {
        postComments.add(c);
      };
    });
    postComments.sortInPlace(func(a, b) { Int.compare(a.createdAt, b.createdAt) });
    postComments.toArray().map<Types.CommentInternal, Types.Comment>(func c = toPublic(c));
  };

  public func deleteComment(
    comments : Map.Map<Text, Types.CommentInternal>,
    posts : Map.Map<Text, PostTypes.PostInternal>,
    caller : Principal,
    commentId : Text,
    isAdmin : Bool,
  ) : { #ok : (); #err : Text } {
    switch (comments.get(commentId)) {
      case null #err("Comment not found");
      case (?c) {
        if (not Principal.equal(c.authorId, caller) and not isAdmin) {
          return #err("Not authorized");
        };
        c.isDeleted := true;
        switch (posts.get(c.postId)) {
          case (?post) {
            if (post.commentCount > 0) post.commentCount -= 1;
          };
          case null {};
        };
        #ok(());
      };
    };
  };

  public func toPublic(comment : Types.CommentInternal) : Types.Comment {
    {
      id = comment.id;
      postId = comment.postId;
      authorId = comment.authorId;
      content = comment.content;
      createdAt = comment.createdAt;
      isDeleted = comment.isDeleted;
    };
  };
};
