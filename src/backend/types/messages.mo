import Common "common";
import Principal "mo:core/Principal";

module {
  public type Timestamp = Common.Timestamp;
  public type MessageId = Common.MessageId;

  public type MessageInternal = {
    id : MessageId;
    senderId : Principal;
    receiverId : Principal;
    var content : Text;
    createdAt : Timestamp;
    var isRead : Bool;
  };

  public type Message = {
    id : MessageId;
    senderId : Principal;
    receiverId : Principal;
    content : Text;
    createdAt : Timestamp;
    isRead : Bool;
  };

  public type Conversation = {
    otherUserId : Principal;
    lastMessage : ?Message;
    unreadCount : Nat;
  };
};
