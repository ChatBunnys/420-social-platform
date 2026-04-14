import Common "common";
import Principal "mo:core/Principal";

module {
  public type Timestamp = Common.Timestamp;
  public type PostId = Common.PostId;
  public type CommentId = Common.CommentId;

  public type CommentInternal = {
    id : CommentId;
    postId : PostId;
    authorId : Principal;
    var content : Text;
    createdAt : Timestamp;
    var isDeleted : Bool;
  };

  public type Comment = {
    id : CommentId;
    postId : PostId;
    authorId : Principal;
    content : Text;
    createdAt : Timestamp;
    isDeleted : Bool;
  };
};
