import Principal "mo:core/Principal";
import Map "mo:core/Map";
import CommentTypes "../types/comments";
import PostTypes "../types/posts";
import UserTypes "../types/users";
import CommentsLib "../lib/comments";

mixin (
  comments : Map.Map<Text, CommentTypes.CommentInternal>,
  posts : Map.Map<Text, PostTypes.PostInternal>,
  users : Map.Map<Principal, UserTypes.UserInternal>,
  commentCounter : { var value : Nat },
) {
  public shared ({ caller }) func addComment(
    postId : Text,
    content : Text,
  ) : async { #ok : CommentTypes.Comment; #err : Text } {
    CommentsLib.addComment(comments, posts, commentCounter, caller, users, postId, content);
  };

  public query ({ caller }) func getComments(postId : Text) : async [CommentTypes.Comment] {
    CommentsLib.getComments(comments, postId);
  };

  public shared ({ caller }) func deleteComment(commentId : Text) : async { #ok : (); #err : Text } {
    CommentsLib.deleteComment(comments, posts, caller, commentId, false);
  };
};
