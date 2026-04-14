import Common "common";
import Principal "mo:core/Principal";
import Set "mo:core/Set";

module {
  public type Timestamp = Common.Timestamp;
  public type PostId = Common.PostId;

  // Internal post record with mutable fields
  public type PostInternal = {
    id : PostId;
    authorId : Principal;
    var content : Text;
    var imageUrl : ?Text;
    createdAt : Timestamp;
    likedBy : Set.Set<Principal>;
    var commentCount : Nat;
    var isDeleted : Bool;
  };

  // Shared (public API) post record
  public type Post = {
    id : PostId;
    authorId : Principal;
    content : Text;
    imageUrl : ?Text;
    createdAt : Timestamp;
    likeCount : Nat;
    commentCount : Nat;
    isDeleted : Bool;
  };
};
