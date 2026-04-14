import Principal "mo:core/Principal";
import Map "mo:core/Map";
import MessageTypes "../types/messages";
import UserTypes "../types/users";
import MessagesLib "../lib/messages";

mixin (
  messages : Map.Map<Text, MessageTypes.MessageInternal>,
  users : Map.Map<Principal, UserTypes.UserInternal>,
  messageCounter : { var value : Nat },
) {
  public shared ({ caller }) func sendMessage(
    receiverId : Principal,
    content : Text,
  ) : async { #ok : MessageTypes.Message; #err : Text } {
    MessagesLib.sendMessage(messages, messageCounter, caller, users, receiverId, content);
  };

  public query ({ caller }) func getConversations() : async [MessageTypes.Conversation] {
    MessagesLib.getConversations(messages, caller);
  };

  public query ({ caller }) func getMessages(otherUserId : Principal) : async [MessageTypes.Message] {
    MessagesLib.getMessages(messages, caller, otherUserId);
  };

  public shared ({ caller }) func markMessagesRead(otherUserId : Principal) : async () {
    MessagesLib.markMessagesRead(messages, caller, otherUserId);
  };

  public query ({ caller }) func getUnreadCount() : async Nat {
    MessagesLib.getUnreadCount(messages, caller);
  };
};
