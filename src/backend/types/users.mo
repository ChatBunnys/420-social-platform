import Common "common";
import Principal "mo:core/Principal";

module {
  public type Timestamp = Common.Timestamp;

  // Internal user record (mutable fields for updates)
  public type UserInternal = {
    id : Principal;
    var username : Text;
    var bio : Text;
    var avatarUrl : ?Text;
    createdAt : Timestamp;
    var isAdmin : Bool;
    var isSuspended : Bool;
  };

  // Shared (public API) user record
  public type User = {
    id : Principal;
    username : Text;
    bio : Text;
    avatarUrl : ?Text;
    createdAt : Timestamp;
    isAdmin : Bool;
    isSuspended : Bool;
  };

  // Extended profile with social counts
  public type UserProfile = {
    id : Principal;
    username : Text;
    bio : Text;
    avatarUrl : ?Text;
    createdAt : Timestamp;
    isAdmin : Bool;
    isSuspended : Bool;
    followerCount : Nat;
    followingCount : Nat;
    postCount : Nat;
  };
};
