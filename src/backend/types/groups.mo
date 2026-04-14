import Common "common";
import Principal "mo:core/Principal";

module {
  public type Timestamp = Common.Timestamp;
  public type GroupId = Common.GroupId;

  public type GroupInternal = {
    id : GroupId;
    var name : Text;
    var description : Text;
    var category : Text;
    creatorId : Principal;
    var memberCount : Nat;
    createdAt : Timestamp;
  };

  public type Group = {
    id : GroupId;
    name : Text;
    description : Text;
    category : Text;
    creatorId : Principal;
    memberCount : Nat;
    createdAt : Timestamp;
  };

  public type GroupPost = {
    id : Text;
    groupId : GroupId;
    authorId : Principal;
    content : Text;
    imageUrl : ?Text;
    createdAt : Timestamp;
  };
};
